"""
LegalEase FastAPI Backend
Advanced Legal RAG System powered by LangChain, LangGraph, and LangSmith
"""

import os
import sys
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from PyPDF2 import PdfReader

# Ensure script directory is in Python module search path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag_service import LegalEaseRAG, RAGState

app = FastAPI(
    title="LegalEase RAG Intelligence API",
    description="Enterprise-grade Legal Question Answering & Contract Analysis RAG Engine powered by LangChain, LangGraph, and LangSmith.",
    version="2.0.0"
)

# ----------------- CORS Configuration -----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend origin e.g. ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG Singleton
rag_service = LegalEaseRAG.get_instance()


# ----------------- Request Models -----------------
class LegacyChatRequest(BaseModel):
    """Compatible with DocumentSimple.jsx and Meaasage.jsx frontend payloads"""
    messages: List[str] = Field(..., description="Array of messages or ['Document Content: ...', 'User asked: ...']")


class AdvancedRAGQueryRequest(BaseModel):
    """Direct structured request for advanced RAG queries"""
    query: str = Field(..., description="The user's legal question")
    chat_history: Optional[List[str]] = Field(default_factory=list, description="Previous conversation turns")
    document_content: Optional[str] = Field(None, description="Optional inline legal document or contract text")
    top_k: Optional[int] = Field(4, description="Number of relevant chunks to retrieve")


class SimplifyRequest(BaseModel):
    """Compatible with DocumentSimple.jsx request body"""
    text: str = Field(..., description="Legal contract or document text to simplify")
    auto_index: Optional[bool] = Field(True, description="Whether to automatically index the document into RAG vector store")


# ----------------- Endpoints -----------------
@app.get("/")
def root():
    """Root health and welcome endpoint."""
    return {
        "service": "LegalEase RAG Engine",
        "status": "online",
        "version": "2.0.0",
        "frameworks": ["LangChain", "LangGraph", "LangSmith"],
        "endpoints": {
            "status": "/rag/status",
            "graph": "/rag/graph",
            "upload": "/upload",
            "query": "/query (frontend compatible)",
            "advanced_query": "/rag/query",
            "docs": "/docs"
        }
    }


@app.get("/health")
@app.get("/rag/status")
def get_rag_status():
    """Returns telemetry, LangSmith tracing status, and vector store statistics."""
    return rag_service.get_status()


@app.get("/rag/graph", response_class=PlainTextResponse)
def get_graph_diagram(format: str = Query("mermaid", enum=["mermaid", "ascii"])):
    """Returns the visual representation of the LangGraph RAG workflow."""
    if format == "ascii":
        try:
            return rag_service.graph.get_graph().draw_ascii()
        except Exception:
            return "START -> parse_input -> retrieve -> grade_documents -> [generate_answer | fallback] -> format_response -> END"
    return rag_service.get_graph_mermaid()


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Ingests a legal document (PDF or Text), splits it using LangChain's RecursiveCharacterTextSplitter,
    embeds chunks using Cohere embeddings, and stores them in the LangChain FAISS vector store.
    """
    docs_dir = os.path.join(BASE_DIR, "data", "docs")
    os.makedirs(docs_dir, exist_ok=True)
    file_path = os.path.join(docs_dir, file.filename)

    file_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    extracted_text = ""
    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_text += f"\n--- Page {page_num + 1} ---\n" + page_text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    else:
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded document contains no readable text.")

    # Ingest into LangChain Vector Store
    chunks_added = rag_service.add_document_text(
        text=extracted_text,
        source_name=file.filename,
        metadata={"filename": file.filename, "file_size": len(file_bytes)}
    )

    total_chunks = rag_service.vector_store.index.ntotal if rag_service.vector_store else 0

    return {
        "status": "success",
        "filename": file.filename,
        "chunks_stored": chunks_added,
        "total_documents_indexed": total_chunks
    }


@app.post("/simplify")
async def simplify_document_endpoint(req: SimplifyRequest):
    """
    Simplifies legal document text into a plain-English summary and key clauses using LangChain.
    Automatically indexes the document into the RAG vector store for instant Q&A.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required for simplification.")

    result = rag_service.simplify_document(req.text, auto_index=req.auto_index)
    return result


@app.post("/query")
async def query_text(req: LegacyChatRequest):
    """
    Primary RAG query endpoint maintaining 100% backward compatibility with DocumentSimple.jsx.
    Executes the multi-stage LangGraph workflow with LangSmith observability.
    """
    if not req.messages:
        return {"error": "No messages provided in query request."}

    # Verify vector store availability, unless inline document is supplied in messages
    total_vectors = rag_service.vector_store.index.ntotal if rag_service.vector_store else 0
    has_inline_doc = any("Document Content:" in str(m) for m in req.messages)

    if total_vectors == 0 and not has_inline_doc:
        return {"error": "No documents indexed yet. Upload a file first."}

    try:
        # Execute LangGraph workflow with LangSmith tracing
        result = rag_service.query(req.messages)

        return {
            "messages": req.messages,
            "context_used": result.get("context_used", []),
            "reply": result.get("reply", ""),
            "citations": result.get("citations", []),
            "relevance": result.get("relevance", "unknown"),
            "status": result.get("status", "complete")
        }
    except Exception as e:
        return {
            "messages": req.messages,
            "context_used": [],
            "reply": f"An error occurred while processing legal advice: {str(e)}",
            "error": str(e)
        }


@app.post("/rag/query")
async def advanced_rag_query(req: AdvancedRAGQueryRequest):
    """
    Advanced structured RAG endpoint for direct client or microservice queries.
    """
    messages = []
    if req.document_content:
        messages.append(f"Document Content: {req.document_content}")
    if req.chat_history:
        messages.extend(req.chat_history)
    messages.append(f"User asked: {req.query}")

    result = rag_service.query(messages)
    return {
        "query": req.query,
        "answer": result.get("reply", ""),
        "context_used": result.get("context_used", []),
        "citations": result.get("citations", []),
        "relevance": result.get("relevance", "unknown"),
        "status": result.get("status", "complete")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
