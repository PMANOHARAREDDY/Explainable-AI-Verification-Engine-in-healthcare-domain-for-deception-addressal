import os
import json
import pickle
import faiss
import spacy
import torch
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder

from .claim_extraction import ClaimExtractor
from .query_expansion import QueryExpander

class VerificationEngine:
    def __init__(self):
        print("Initializing Verification Engine (Upgraded)...")
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        
        # Initialize custom modules
        self.extractor = ClaimExtractor()
        self.expander = QueryExpander()
        
        # Load NLP models
        print("Loading biomedical NLP models...")
        self.nlp = self.extractor.nlp # Reuse the loaded spacy model for gating
        
        self.retriever = SentenceTransformer('ncbi/MedCPT-Article-Encoder')
        
        # Mod 3: Cross-Encoder Reranker
        print("Loading MedCPT Cross-Encoder...")
        self.reranker = CrossEncoder('ncbi/MedCPT-Cross-Encoder')
        
        # Mod 4: Medical-Grade NLI
        print("Loading MedNLI Cross-Encoder...")
        self.nli_model = CrossEncoder('pritamdeka/PubMedBERT-MNLI-MedNLI')
        
        self.retrieval_cache = {}
        self.nli_cache = {}
        
        # BioBERT MedNLI mappings: entailment=0, neutral=1, contradiction=2
        self.label_mapping = self.nli_model.config.id2label
        self.contradiction_idx = next((k for k, v in self.label_mapping.items() if 'contradiction' in v.lower()), 2)
        self.entailment_idx = next((k for k, v in self.label_mapping.items() if 'entailment' in v.lower()), 0)
        
        # Load Indexes
        self.index = faiss.read_index(os.path.join(self.data_dir, 'faiss_index.bin'))
        with open(os.path.join(self.data_dir, 'bm25_index.pkl'), 'rb') as f:
            self.bm25 = pickle.load(f)
            
        with open(os.path.join(self.data_dir, 'metadata.json'), 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)

    def extract_claims(self, text):
        # Mod 1: Fastcoref and Dependency parsing
        return self.extractor.process(text)

    def retrieve_hybrid(self, claim, top_k=3):
        if claim in self.retrieval_cache:
            return self.retrieval_cache[claim]
            
        # Mod 2: Query Expansion
        expanded_sparse_query = self.expander.expand_with_umls(claim)
        hyde_dense_query = self.expander.generate_hyde(claim)
            
        # 1. FAISS Dense Retrieval with HyDE
        embedding = self.retriever.encode([hyde_dense_query], normalize_embeddings=True)
        distances, indices = self.index.search(embedding, 10) # Get top 10 for RRF
        
        faiss_ranks = {}
        for rank, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx != -1:
                faiss_ranks[str(idx)] = {"rank": rank, "score": float(dist)}
                
        # 2. BM25 Sparse Retrieval with UMLS Expansion
        tokenized_query = expanded_sparse_query.lower().split(" ")
        bm25_scores = self.bm25.get_scores(tokenized_query)
        bm25_top_indices = bm25_scores.argsort()[::-1][:10]
        
        bm25_ranks = {}
        for rank, idx in enumerate(bm25_top_indices):
            bm25_ranks[str(idx)] = {"rank": rank, "score": float(bm25_scores[idx])}
            
        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = {}
        all_ids = set(faiss_ranks.keys()).union(set(bm25_ranks.keys()))
        k_rrf = 60
        
        for doc_id in all_ids:
            score = 0.0
            if doc_id in faiss_ranks:
                score += 1.0 / (k_rrf + faiss_ranks[doc_id]["rank"])
            if doc_id in bm25_ranks:
                score += 1.0 / (k_rrf + bm25_ranks[doc_id]["rank"])
            rrf_scores[doc_id] = score
            
        # Sort by RRF score to get candidates for reranking
        candidate_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:10]
        
        candidates = []
        for doc_id in candidate_ids:
            if doc_id in self.metadata:
                meta = self.metadata[doc_id]
                candidates.append({
                    "id": doc_id,
                    "text": meta['text'],
                    "source": meta['source']
                })
                
        if not candidates:
            return []

        # Mod 3: Cross-Encoder Reranking
        cross_inp = [[claim, cand['text']] for cand in candidates]
        cross_scores = self.reranker.predict(cross_inp)
        
        for idx, cand in enumerate(candidates):
            cand['rerank_score'] = float(cross_scores[idx])
            
        # Sort by rerank score and take top_k
        candidates = sorted(candidates, key=lambda x: x['rerank_score'], reverse=True)[:top_k]
        
        evidence = []
        for cand in candidates:
            evidence.append({
                "text": cand['text'],
                "source": cand['source'],
                "rerank_score": cand['rerank_score']
            })
                
        self.retrieval_cache[claim] = evidence
        return evidence
        
    def dynamic_ner_gating(self, claim, evidence_list):
        """
        Mod 4: Check if the claim shares any core medical entities with the retrieved evidence.
        """
        claim_doc = self.nlp(claim)
        claim_ents = set([ent.text.lower() for ent in claim_doc.ents])
        
        if not claim_ents:
            # If no entities in claim, fallback to safe verification
            return True 
            
        for ev in evidence_list:
            ev_doc = self.nlp(ev['text'])
            ev_ents = set([ent.text.lower() for ent in ev_doc.ents])
            
            # If intersection is found, we should proceed with NLI
            if claim_ents.intersection(ev_ents):
                return True
                
        # Zero core medical entities shared, bypass NLI
        return False

    def verify(self, query, response_text):
        claims = self.extract_claims(response_text)
        results = []
        verified_count = 0
        contradictory_count = 0

        for claim in claims:
            evidence_list = self.retrieve_hybrid(claim, top_k=3)
            
            # Mod 4: Dynamic NER Gating
            should_verify = self.dynamic_ner_gating(claim, evidence_list)
            
            if not should_verify or not evidence_list:
                results.append({
                    "text": claim,
                    "status": "UNVERIFIED",
                    "reason": "No shared medical entities with knowledge base",
                    "confidence": 0.0,
                    "evidence": evidence_list
                })
                continue
                
            # NLI Multi-evidence aggregation
            has_contradiction = False
            has_entailment = False
            max_contradiction_prob = 0.0
            max_entailment_prob = 0.0
            
            for ev in evidence_list:
                cache_key = f"{ev['text']}|||{claim}"
                
                if cache_key in self.nli_cache:
                    probs = self.nli_cache[cache_key]
                else:
                    scores = self.nli_model.predict([(ev['text'], claim)])[0]
                    probs = torch.softmax(torch.tensor(scores), dim=-1).tolist()
                    self.nli_cache[cache_key] = probs
                
                contra_prob = probs[self.contradiction_idx]
                entail_prob = probs[self.entailment_idx]
                
                if contra_prob > max_contradiction_prob:
                    max_contradiction_prob = contra_prob
                if entail_prob > max_entailment_prob:
                    max_entailment_prob = entail_prob
                    
                if contra_prob > 0.85:
                    has_contradiction = True
                if entail_prob > 0.80:
                    has_entailment = True

            if has_contradiction:
                status = "CONTRADICTORY"
                confidence = max_contradiction_prob
                contradictory_count += 1
            elif has_entailment:
                status = "VERIFIED"
                confidence = max_entailment_prob
                verified_count += 1
            else:
                status = "UNVERIFIED"
                confidence = max(max_contradiction_prob, max_entailment_prob)
                
            results.append({
                "text": claim,
                "status": status,
                "confidence": confidence,
                "evidence": evidence_list
            })

        total = len(claims)
        if total > 0:
            trust_score = max(0, min(100, (verified_count * 100 - contradictory_count * 100) / total))
            if verified_count == 0 and contradictory_count == 0:
                trust_score = 50.0
        else:
            trust_score = 100.0

        return {
            "query": query,
            "raw_response": response_text,
            "claims": results,
            "trust_score": trust_score
        }

engine_instance = None
def get_engine():
    global engine_instance
    if engine_instance is None:
        engine_instance = VerificationEngine()
    return engine_instance
