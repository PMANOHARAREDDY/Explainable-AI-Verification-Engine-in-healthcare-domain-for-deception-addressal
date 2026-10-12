import os
import json
import pickle
import faiss
import re
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

def semantic_chunking(document):
    """
    Chunks a document based on logical clinical boundaries rather than arbitrary character limits.
    """
    text = document.get("text", "")
    source = document.get("source", "Unknown")
    doc_id = document.get("id")
    
    # Common clinical section headers
    headers = [
        "Abstract:", "Background:", "Methods:", "Results:", 
        "Conclusion:", "Adverse Reactions:", "Dosage:", "Indications:"
    ]
    
    # Create regex pattern to match any header
    pattern = f"({'|'.join(headers)})"
    
    # Split text by headers
    parts = re.split(pattern, text)
    chunks = []
    
    # If no headers found, return the whole text as one chunk
    if len(parts) == 1:
        return [{"id": f"{doc_id}_0", "text": text.strip(), "source": source}]
        
    # First part might be before any header
    if parts[0].strip():
        chunks.append({"id": f"{doc_id}_intro", "text": parts[0].strip(), "source": source})
        
    # Iterate through matches
    for i in range(1, len(parts), 2):
        header = parts[i]
        content = parts[i+1] if i+1 < len(parts) else ""
        if content.strip():
            chunks.append({
                "id": f"{doc_id}_{i}",
                "text": f"{header} {content.strip()}",
                "source": source
            })
            
    return chunks

def build_index():
    print("Loading MedCPT model...")
    model = SentenceTransformer('ncbi/MedCPT-Article-Encoder')
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Structured Medical Dataset with explicit logical boundaries
    raw_documents = [
        {
            "id": "1", 
            "text": "Indications: Aspirin is used to treat pain, and reduce fever or inflammation. Adverse Reactions: It should not be given to children or teenagers with viral infections due to the risk of Reye's syndrome. It is unsafe.", 
            "source": "Clinical Guidelines"
        },
        {
            "id": "2", 
            "text": "Background: Vaccines are effective at preventing many serious diseases. Results: Extensive studies show they do not cause autism.", 
            "source": "CDC"
        },
        {
            "id": "3", 
            "text": "Methods: Drinking water does not cure cancer. Conclusion: However, staying hydrated is important for general health.", 
            "source": "Medical Knowledge"
        },
        {
            "id": "4", 
            "text": "Background: Hypertension is a major risk factor for cardiovascular disease. Methods: Regular monitoring is required.", 
            "source": "SciFact corpus"
        },
        {
            "id": "5", 
            "text": "Indications: Metformin is a first-line treatment for type 2 diabetes. Adverse Reactions: Can cause gastrointestinal upset.", 
            "source": "SciFact corpus"
        },
        {
            "id": "6", 
            "text": "Indications: Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used to relieve pain, reduce inflammation, and lower fever.", 
            "source": "Pharmacology Textbook"
        },
        {
            "id": "7", 
            "text": "Results: Vitamin C does not cure the common cold. Conclusion: But regular supplementation may slightly reduce the duration of symptoms.", 
            "source": "Cochrane Review"
        },
        {
            "id": "8", 
            "text": "Background: COVID-19 is caused by the SARS-CoV-2 virus and spreads primarily through respiratory droplets.", 
            "source": "WHO"
        },
        {
            "id": "9", 
            "text": "Indications: Amoxicillin is an antibiotic used to treat bacterial infections, such as middle ear infections and strep throat. Results: It is completely ineffective against viral infections.", 
            "source": "SciFact corpus"
        },
        {
            "id": "10", 
            "text": "Background: Prolonged exposure to ultraviolet (UV) radiation from the sun increases the risk of skin cancer, including melanoma.", 
            "source": "Dermatology Guide"
        }
    ]
    
    print(f"Loaded {len(raw_documents)} raw medical documents. Applying semantic chunking...")
    
    chunked_data = []
    for doc in raw_documents:
        chunked_data.extend(semantic_chunking(doc))
        
    print(f"Generated {len(chunked_data)} semantic chunks. Embedding texts for FAISS...")
    
    # 2. Embed and build FAISS Dense Index
    texts = [item['text'] for item in chunked_data]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    
    print("Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    faiss_path = os.path.join(data_dir, 'faiss_index.bin')
    faiss.write_index(index, faiss_path)
    
    # 3. Build BM25 Sparse Index
    print("Building BM25 sparse index...")
    tokenized_corpus = [doc.lower().split(" ") for doc in texts]
    bm25 = BM25Okapi(tokenized_corpus)
    bm25_path = os.path.join(data_dir, 'bm25_index.pkl')
    with open(bm25_path, 'wb') as f:
        pickle.dump(bm25, f)
    
    # 4. Save Metadata mapping
    metadata_path = os.path.join(data_dir, 'metadata.json')
    metadata = {item['id']: item for item in chunked_data}
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Successfully built FAISS and BM25 indexes with {len(chunked_data)} chunks at {data_dir}")

if __name__ == "__main__":
    build_index()
