import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import json
import os
import requests as req

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# --- Lightweight ONNX model setup (replaces torch + sentence-transformers) ---
MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

_HF_BASE = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main"
_FILES = {
    "model.onnx": f"{_HF_BASE}/onnx/model.onnx",
    "tokenizer.json": f"{_HF_BASE}/tokenizer.json",
}

for fname, url in _FILES.items():
    path = MODEL_DIR / fname
    if not path.exists():
        print(f"Downloading {fname}...")
        r = req.get(url)
        r.raise_for_status()
        path.write_bytes(r.content)

tokenizer = Tokenizer.from_file(str(MODEL_DIR / "tokenizer.json"))
tokenizer.enable_padding(pad_id=0, pad_token="[PAD]", length=128)
tokenizer.enable_truncation(max_length=128)
session = ort.InferenceSession(str(MODEL_DIR / "model.onnx"))

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def generate_embedding(text: str):
    """
    Accepts a string (title + abstract).
    Returns embedding vector as Python list (384-dim, normalized).
    Uses ONNX Runtime instead of torch for minimal memory footprint.
    """
    encoded = tokenizer.encode(text)
    input_ids = np.array([encoded.ids], dtype=np.int64)
    attention_mask = np.array([encoded.attention_mask], dtype=np.int64)
    token_type_ids = np.zeros_like(input_ids)

    outputs = session.run(None, {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "token_type_ids": token_type_ids,
    })

    # Mean pooling over token embeddings
    embeddings = outputs[0]  # (1, seq_len, 384)
    mask = attention_mask[:, :, np.newaxis]
    pooled = (embeddings * mask).sum(axis=1) / mask.sum(axis=1)

    # L2 normalize
    norm = np.linalg.norm(pooled, axis=1, keepdims=True)
    pooled = pooled / norm

    return [float(x) for x in pooled[0]]


def store_paper_with_embedding(paper_data: dict):
    """
    Accepts paper metadata.
    Generates embedding.
    """
    embedding = generate_embedding(paper_data["title"] + " " + paper_data["abstract"])

    return embedding


def get_saved_paper_embeddings(user_id: str):
    """
    Fetch all saved papers for a user.
    Extract their embedding vectors.
    Return list of embeddings.
    """
    saved_papers = (
        supabase.table("saved_papers")
        .select("paper_id")
        .eq("user_id", user_id)
        .execute()
    )

    paper_ids = [p["paper_id"] for p in saved_papers.data]
    if not paper_ids:
        return []

    extracted_embeddings = (
        supabase.table("papers")
        .select("embedding")
        .in_("id", paper_ids)
        .execute()
    )

    results = []
    for row in extracted_embeddings.data:
        emb = row.get("embedding")
        if not emb:
            continue
        if isinstance(emb, str):
            emb = json.loads(emb)
        results.append(emb)

    return results


def compute_user_interest_vector(embeddings: list):
    """
    Accepts list of embedding vectors.
    If fewer than 5 → return None.
    Otherwise:
        - Convert to numpy array
        - Compute mean vector
        - Return averaged vector as list
    """
    if len(embeddings) < 5:
        return None
    
    np_arr = np.array(embeddings)
    mean_vect = np.mean(np_arr, axis=0)

    return mean_vect.tolist()


def fetch_recommendations(user_vector: list, limit: int):
    """
    Calls Supabase RPC `match_papers`.
    Passes query_embedding and match_count.
    Returns similarity-ranked papers.
    """
    ranked_papers = (
        supabase.rpc("match_papers", {"query_embedding": user_vector, "match_count": limit}).execute()
    )
    return ranked_papers.data


def recommend_papers_for_user(user_id: str, limit: int = 5):
    """
    Full recommendation pipeline:
        1. Get saved embeddings
        2. Compute user interest vector
        3. If None → return not_enough_data
        4. Else → fetch recommendations
        5. Filter out already saved papers
        6. Return final top results
    """
    saved_embeddings = get_saved_paper_embeddings(user_id)
    user_vector = compute_user_interest_vector(saved_embeddings)

    if user_vector is None:
        return {"status": "not_enough_data", "message": "Please save at least 5 papers to get recommendations."}

    ranked_papers = fetch_recommendations(user_vector, limit + 10)  # fetch extra to account for filtering

    saved_paper_ids = set(p["paper_id"] for p in supabase.table("saved_papers").select("paper_id").eq("user_id", user_id).execute().data)

    filtered_recommendations = [p for p in ranked_papers if p["id"] not in saved_paper_ids]

    return {"status": "success", "recommendations": filtered_recommendations[:limit]}

