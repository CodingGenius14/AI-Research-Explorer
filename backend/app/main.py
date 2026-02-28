from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

try:
    from app.services.recommender import recommend_papers_for_user, generate_embedding, supabase as sb
except ImportError:
    from services.recommender import recommend_papers_for_user, generate_embedding, supabase as sb

app = FastAPI()


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://ai-research-explorer-zeta.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)


class SavePaperRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    paper: Dict[str, Any]


def parse_arxiv_response(xml_content: str) -> Dict[str, Any]:
    """Parse arXiv API XML response and convert to JSON format"""
    root = ET.fromstring(xml_content)
    
    # Define namespace
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    
    papers = []
    entries = root.findall("atom:entry", ns)
    
    for entry in entries:
        # Extract paper ID from the full arXiv URL
        arxiv_id_elem = entry.find("atom:id", ns)
        arxiv_id = arxiv_id_elem.text.split("/abs/")[-1] if arxiv_id_elem is not None else ""
        
        # Extract title
        title_elem = entry.find("atom:title", ns)
        title = title_elem.text.strip() if title_elem is not None else "Untitled"
        
        # Extract authors
        authors = []
        for author in entry.findall("atom:author", ns):
            name_elem = author.find("atom:name", ns)
            if name_elem is not None:
                authors.append({"name": name_elem.text})
        
        # Extract abstract
        summary_elem = entry.find("atom:summary", ns)
        abstract = summary_elem.text.strip() if summary_elem is not None else ""
        
        # Extract year from published date
        published_elem = entry.find("atom:published", ns)
        year = None
        if published_elem is not None:
            year = int(published_elem.text[:4])
        
        paper = {
            "paperId": arxiv_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "year": year,
            "externalIds": {
                "ArXiv": arxiv_id,
            },
        }
        papers.append(paper)
    
    return {"data": papers}


@app.post("/api/search-papers")
async def search_papers(request: SearchRequest):
    """Search for papers using the arXiv API"""
    try:
        params = {
            "search_query": f"all:{request.query}",
            "start": 0,
            "max_results": 20,
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://export.arxiv.org/api/query",
                params=params, 
                timeout=10.0,
                headers={"User-Agent": "AI-Research-Explorer/1.0"}
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"arXiv API error: {response.status_code}",
            )
        
        # Parse XML response
        data = parse_arxiv_response(response.text)

        # Upsert all search results into papers table 
        for p in data.get("data", []):
            pid = p.get("paperId") or p.get("title", "untitled").lower().replace(" ", "-")
            if not pid:
                continue
            text = (p.get("title") or "") + " " + (p.get("abstract") or "")
            embedding = [float(x) for x in generate_embedding(text)]
            row = {
                "id": pid,
                "title": p.get("title") or "Untitled",
                "abstract": p.get("abstract") or "",
                "authors": ", ".join([a.get("name", "") for a in (p.get("authors") or []) if a.get("name")]),
                "url": (
                    f"https://arxiv.org/abs/{p['externalIds']['ArXiv']}"
                    if p.get("externalIds", {}).get("ArXiv")
                    else f"https://arxiv.org/search/?query={pid}"
                ),
                "year": p.get("year"),
                "embedding": embedding,  
            }
            try:
                sb.table("papers").upsert(row, on_conflict="id").execute()
            except Exception:
                pass  # skip duplicates / errors silently

        return data

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="API request timed out")
    except ET.ParseError:
        raise HTTPException(
            status_code=500, detail="Failed to parse API response"
        )
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(error)}"
        )


@app.post("/api/save-paper")
async def save_paper(request: SavePaperRequest):
    """Save a paper for a user. Handles paper upsert with embedding and saved_papers linking."""
    try:
        paper = request.paper
        paper_id = paper.get("paperId") or paper.get("title", "untitled").lower().replace(" ", "-")

        if not paper_id:
            raise HTTPException(status_code=400, detail="Invalid paper metadata")

        # Link paper to user in saved_papers (skip if already exists)
        existing = (
            sb.table("saved_papers")
            .select("id")
            .eq("user_id", request.user_id)
            .eq("paper_id", paper_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            sb.table("saved_papers").insert(
                {"user_id": request.user_id, "paper_id": paper_id, "notes": ""}
            ).execute()

        return {"success": True, "paper_id": paper_id}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to save paper: {str(error)}")


@app.get("/api/recommendations/{user_id}")
async def get_recommendations(user_id: str, limit: int = 5):
    try:
        recommendations = recommend_papers_for_user(user_id, limit)
        return recommendations
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(error)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
