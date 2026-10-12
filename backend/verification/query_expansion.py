import spacy
import spacy.cli
from transformers import pipeline

class QueryExpander:
    def __init__(self):
        print("Initializing QueryExpander...")
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            spacy.cli.download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
            
        # Fallback Mock UMLS Dictionary since scispacy fails on Python 3.13
        self.mock_umls = {
            "aspirin": ["acetylsalicylic acid", "asa"],
            "cancer": ["carcinoma", "malignancy", "tumor"],
            "hypertension": ["high blood pressure", "hbp"],
            "ibuprofen": ["advil", "motrin", "nsaid"],
            "covid-19": ["sars-cov-2", "coronavirus"],
        }
            
        # HyDE model
        print("Loading Flan-T5 for HyDE...")
        try:
            self.hyde_generator = pipeline("text2text-generation", model="google/flan-t5-small", device="cpu")
        except Exception as e:
            print(f"Failed to load flan-t5-small: {e}")
            self.hyde_generator = None

    def expand_with_umls(self, claim_text):
        """
        Extracts medical entities from the claim and appends standard UMLS synonyms 
        to improve BM25 sparse retrieval.
        """
        doc = self.nlp(claim_text)
        synonyms = set()
        
        for token in doc:
            word = token.text.lower()
            if word in self.mock_umls:
                for alias in self.mock_umls[word]:
                    synonyms.add(alias)
            
        if synonyms:
            return f"{claim_text} " + " ".join(synonyms)
        return claim_text

    def generate_hyde(self, query):
        """
        Generates a Hypothetical Document Embedding (HyDE) response 
        to improve FAISS dense retrieval for non-declarative queries.
        """
        if not self.hyde_generator:
            return query
            
        prompt = f"Answer the following medical question accurately and professionally: {query}"
        try:
            result = self.hyde_generator(prompt, max_length=100, num_return_sequences=1)
            hypothetical_answer = result[0]['generated_text']
            return hypothetical_answer
        except Exception as e:
            print(f"HyDE generation failed: {e}")
            return query
