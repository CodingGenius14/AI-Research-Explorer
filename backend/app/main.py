from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

from realtime import Field

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-research-explorer-zeta.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)


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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
