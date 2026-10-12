import spacy
import spacy.cli
import re

# Compatibility patch: newer transformers versions require post_init() to populate tied weight keys
try:
    from fastcoref.coref_models.modeling_fcoref import FCorefModel
    from fastcoref.coref_models.modeling_lingmess import LingMessModel

    for model_cls in (FCorefModel, LingMessModel):
        if not getattr(model_cls, '_patched_post_init', False):
            orig_init = model_cls.__init__
            def make_patched_init(orig):
                def patched(self, *args, **kwargs):
                    orig(self, *args, **kwargs)
                    if hasattr(self, 'post_init'):
                        self.post_init()
                return patched
            model_cls.__init__ = make_patched_init(orig_init)
            model_cls._patched_post_init = True
except Exception as e:
    print(f"Warning: fastcoref transformers patch failed: {e}")

from fastcoref import FCoref

class ClaimExtractor:
    def __init__(self):
        print("Initializing ClaimExtractor...")
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            spacy.cli.download('en_core_web_sm')
            self.nlp = spacy.load('en_core_web_sm')
            
        try:
            self.coref_model = FCoref(device='cpu') # Use cpu for local inference by default
        except Exception as e:
            print(f"Warning: Failed to load FCoref ({e}). Falling back without coref resolution.")
            self.coref_model = None

    def resolve_coreferences(self, text):
        """
        Uses fastcoref to resolve pronouns (e.g., 'It reduces pain' -> 'Ibuprofen reduces pain')
        """
        if not self.coref_model or not text or len(text) < 10:
            return text
        
        try:
            preds = self.coref_model.predict(texts=[text])
            resolved_text = text
            clusters = preds[0].get_clusters(as_strings=False)
            strings = preds[0].get_clusters()
            
            if not clusters:
                return text

            # We need to replace from the end to the start so indices don't shift
            replacements = []
            for i, cluster in enumerate(clusters):
                main_entity = strings[i][0] # use the first mention as the main entity
                for j in range(1, len(cluster)): # skip the first mention itself
                    start, end = cluster[j]
                    mention_text = strings[i][j]
                    if len(mention_text.split()) <= 2: # only replace short pronouns/mentions
                        replacements.append((start, end, main_entity))
            
            # Sort by start index descending
            replacements.sort(key=lambda x: x[0], reverse=True)
            for start, end, replacement in replacements:
                resolved_text = resolved_text[:start] + replacement + resolved_text[end:]
                
            return resolved_text
        except Exception as e:
            print(f"Coref resolution failed: {e}")
            return text

    def split_atomic_claims(self, text):
        """
        Uses spaCy dependency parsing to break compound sentences into atomic claims.
        """
        doc = self.nlp(text)
        claims = []
        
        for sent in doc.sents:
            # Count independent clauses (verbs with a subject)
            verbs = [token for token in sent if token.pos_ == "VERB" or token.pos_ == "AUX"]
            independent_clauses = 0
            for v in verbs:
                if any(child.dep_ in ["nsubj", "nsubjpass"] for child in v.children):
                    independent_clauses += 1
            
            if independent_clauses <= 1:
                # Keep it as a single claim
                if len(sent.text.strip()) > 5:
                    claims.append(sent.text.strip())
            else:
                # Split by conjunctions to break into atomic verifiable claims
                parts = re.split(r', and | and |, but | but |; ', sent.text)
                for part in parts:
                    if len(part.strip()) > 5:
                        claims.append(part.strip())

        return [c for c in claims if len(c) > 5]

    def process(self, text):
        resolved_text = self.resolve_coreferences(text)
        claims = self.split_atomic_claims(resolved_text)
        return claims
