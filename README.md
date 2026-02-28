# Research Explorer

A full-stack web application that helps researchers and students discover, save, and receive personalized academic paper recommendations

**Live Demo:** [https://ai-research-explorer-zeta.vercel.app](https://ai-research-explorer-zeta.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [ML Pipeline](#ml-pipeline)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Technical Decisions](#technical-decisions)

---

## Overview

Research Explorer solves the problem of research paper discovery. Instead of scrolling through hundreds of irrelevant results on Google Scholar, users search for papers, save the ones they find interesting, and the app learns their research interests to recommend similar papers they haven't seen yet.

The recommendation engine uses a sentence transformer model (all-MiniLM-L6-v2) running on ONNX Runtime to generate 384-dimensional embedding vectors for each paper. When a user saves at least 5 papers, the system averages their embeddings into a user interest vector and performs cosine similarity search via pgvector in PostgreSQL to surface the most relevant unseen papers.

---

## Features

- **Paper Search** — Query arXiv's database of 2M+ papers with instant results
- **User Authentication** — Email/password auth via Supabase Auth
- **Personal Library** — Save, view, and remove papers from your collection
- **ML Recommendations** — Content-based filtering using sentence embeddings and cosine similarity
- **Background Processing** — Embeddings generate asynchronously so search results return instantly
- **Responsive Design** — Works on desktop and mobile

---

## Architecture

1. **User searches** → Frontend sends query to FastAPI
2. **FastAPI fetches** results from arXiv API → returns to frontend immediately
3. **Background task** generates embeddings for each paper via ONNX Runtime → upserts into Supabase
4. **User saves papers** → linked to their account in `saved_papers` table
5. **Recommendations** → Backend averages saved paper embeddings → calls `match_papers` RPC in Supabase → pgvector finds closest unsaved papers by cosine similarity

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast dev experience, component-based UI |
| Styling | CSS + Framer Motion | Custom theme with page transitions and staggered animations |
| Backend | FastAPI (Python) | Async, fast, direct access to ML ecosystem |
| ML Model | all-MiniLM-L6-v2 | Small (80MB), fast, purpose-built for semantic similarity |
| ML Runtime | ONNX Runtime | ~200MB RAM vs ~600MB with PyTorch |
| Database | Supabase (PostgreSQL) | Auth + DB + pgvector in one platform |
| Vector Search | pgvector | Cosine similarity search directly in the database |
| Frontend Hosting | Vercel | Free, automatic deploys from GitHub |
| Backend Hosting | Render | Free tier Python hosting |

---

## ML Pipeline

### Embedding Generation

```
Paper text (title + abstract)
        │
        ▼
┌─────────────────┐
│   Tokenizer     │  HuggingFace tokenizers (fast, Rust-based)
│ (tokenizer.json)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ONNX Model    │  all-MiniLM-L6-v2 (model.onnx)
│ (ONNX Runtime)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mean Pooling   │  Average token embeddings weighted by attention mask
│  + L2 Normalize │
└────────┬────────┘
         │
         ▼
384-dim float vector
```

### Recommendation Pipeline

```
1. Fetch saved paper IDs from saved_papers table (by user_id)
2. Fetch embedding vectors from papers table (by paper IDs)
3. Average all embeddings → user interest vector (384-dim)
4. Call match_papers RPC → pgvector cosine similarity search
5. Filter out already-saved papers
6. Return top N results ranked by similarity score
```

### Why ONNX instead of PyTorch?

| Metric | PyTorch + sentence-transformers | ONNX Runtime |
|--------|-------------------------------|--------------|
| RAM usage | ~500-600MB | ~150-200MB |
| Install size | ~2GB | ~100MB |
| Free tier compatible | No (512MB limit) | Yes |

---

## Database Schema

### `papers` table
| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | arXiv paper ID |
| title | text | Paper title |
| abstract | text | Paper abstract |
| authors | text | Comma-separated author names |
| url | text | Link to arXiv page |
| year | integer | Publication year |
| embedding | vector(384) | Sentence embedding from all-MiniLM-L6-v2 |

### `saved_papers` table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| paper_id | text | References papers.id |
| notes | text | User notes (optional) |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/search-papers` | Search arXiv, return results, generate embeddings in background and upserts into `papers` table|
| POST | `/api/save-paper` | Save a paper to user's library |
| GET | `/api/recommendations/{user_id}?limit=N` | Get personalized paper recommendations |
| GET | `/health` | Health check |

---

## Technical Decisions

1. **ONNX over Sentence-Transformers** — Reduced runtime memory from ~600MB to ~200MB, enabling free-tier deployment without sacrificing embedding quality.

2. **Background embedding generation** — Search results return in ~1-2s (arXiv response time only). Embeddings generate asynchronously via `asyncio.create_task()` so users don't wait for ML inference on 20 papers.

3. **pgvector** — Cosine similarity runs inside PostgreSQL rather than pulling all vectors into Python. Scales better and reduces backend memory usage.
 
4. **Minimum 5 papers threshold** — Averaging fewer than 5 embeddings produces an unreliable interest vector. 5 gives enough signal without being a high barrier.
