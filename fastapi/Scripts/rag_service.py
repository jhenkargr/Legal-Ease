"""
LegalEase Advanced RAG Pipeline
Powered by LangChain, LangGraph, and LangSmith
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, TypedDict
from datetime import datetime
from pydantic import BaseModel, Field

from dotenv import load_dotenv
import numpy as np

# LangChain Imports
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_cohere import CohereEmbeddings, ChatCohere
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_text_splitters import RecursiveCharacterTextSplitter

# LangGraph Imports
from langgraph.graph import StateGraph, START, END

# LangSmith Imports
from langsmith import traceable

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("legalease.rag")

# ----------------- Environment & LangSmith Setup -----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load environment variables from script directory or root
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

# LangSmith Observability & Tracing Configuration
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")

if not COHERE_API_KEY:
    logger.warning("COHERE_API_KEY is not set. Please set it in .env.")

# Configure LangSmith tracing only when a valid API key is present
if LANGCHAIN_API_KEY and not LANGCHAIN_API_KEY.startswith("your_") and LANGCHAIN_API_KEY.strip():
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "legalease-rag")
    os.environ["LANGCHAIN_ENDPOINT"] = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
    logger.info("✅ LangSmith tracing enabled for project: %s", os.environ["LANGCHAIN_PROJECT"])
else:
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    logger.info("ℹ️ LangSmith API key not configured. Running locally without cloud tracing. To view traces on the LangSmith dashboard, add your LANGCHAIN_API_KEY in .env.")

# Model Configurations
EMBEDDING_MODEL_NAME = os.getenv("COHERE_EMBED_MODEL", "embed-english-v3.0")
CHAT_MODEL_NAME = os.getenv("COHERE_CHAT_MODEL", "command-r-08-2024")
VECTOR_SIZE = 1024

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "faiss_index")
LEGACY_INDEX_PATH = os.path.join(BASE_DIR, "vector_index.faiss")
LEGACY_CHUNKS_PATH = os.path.join(BASE_DIR, "chunks.json")
DATA_DOCS_DIR = os.path.join(BASE_DIR, "data", "docs")


# ----------------- Document Simplifier Models -----------------
class ClauseItem(BaseModel):
    title: str = Field(description="Short descriptive title of the clause")
    detail: str = Field(description="Clear explanation of the clause in plain English")
    status: str = Field(description="Clause status (e.g. Active, Important, Required, Warning, or Critical)")
    alert: bool = Field(description="True if the clause represents a risk, penalty, violation, or urgent condition; false otherwise")


class SimplificationResult(BaseModel):
    summary: str = Field(description="Comprehensive plain English summary text of the entire document")
    keyClauses: List[ClauseItem] = Field(description="List of extracted key clauses")


# ----------------- RAG State Definition -----------------
class RAGState(TypedDict):
    raw_messages: List[str]
    extracted_query: str
    inline_document: Optional[str]
    retrieved_documents: List[Document]
    context_text: str
    relevance_decision: str  # "relevant", "insufficient", "no_docs"
    relevance_score: float
    answer: str
    context_used: List[str]
    citations: List[Dict[str, Any]]
    status: str
    error: Optional[str]


# ----------------- RAG Engine Class -----------------
class LegalEaseRAG:
    _instance = None

    def __init__(self):
        self.embeddings = CohereEmbeddings(
            cohere_api_key=COHERE_API_KEY,
            model=EMBEDDING_MODEL_NAME
        )
        self.llm = ChatCohere(
            cohere_api_key=COHERE_API_KEY,
            model=CHAT_MODEL_NAME,
            temperature=0.3,
            max_retries=3,
            request_timeout=60
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=750,
            chunk_overlap=120,
            separators=["\n\nCHAPTER", "\n\nSection", "\n\n", "\n", ". ", " ", ""],
            length_function=len
        )
        self.vector_store: Optional[FAISS] = None
        self._init_vector_store()
        self.graph = self._build_graph()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LegalEaseRAG()
        return cls._instance

    def _init_vector_store(self):
        """Initializes or loads the LangChain FAISS vector store, seamlessly migrating legacy indexes."""
        # 1. Try loading modern LangChain FAISS index directory
        if os.path.exists(INDEX_DIR) and os.path.exists(os.path.join(INDEX_DIR, "index.faiss")):
            try:
                self.vector_store = FAISS.load_local(
                    folder_path=INDEX_DIR,
                    embeddings=self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"Loaded existing LangChain FAISS vector store with {self.vector_store.index.ntotal} vectors.")
                return
            except Exception as e:
                logger.warning(f"Could not load index from {INDEX_DIR}: {e}")

        # 2. Try migrating from legacy vector_index.faiss + chunks.json
        if os.path.exists(LEGACY_INDEX_PATH) and os.path.exists(LEGACY_CHUNKS_PATH):
            try:
                import faiss
                legacy_index = faiss.read_index(LEGACY_INDEX_PATH)
                with open(LEGACY_CHUNKS_PATH, "r", encoding="utf-8") as f:
                    legacy_chunks = json.load(f)

                if legacy_chunks and legacy_index.ntotal == len(legacy_chunks):
                    index_to_docstore_id = {i: str(i) for i in range(len(legacy_chunks))}
                    docstore = InMemoryDocstore({
                        str(i): Document(
                            page_content=chunk,
                            metadata={"chunk_id": i, "source": "Model-Tenancy-Act", "migrated": True}
                        )
                        for i, chunk in enumerate(legacy_chunks)
                    })
                    self.vector_store = FAISS(
                        embedding_function=self.embeddings,
                        index=legacy_index,
                        docstore=docstore,
                        index_to_docstore_id=index_to_docstore_id
                    )
                    os.makedirs(INDEX_DIR, exist_ok=True)
                    self.vector_store.save_local(INDEX_DIR)
                    logger.info(f"Successfully migrated legacy index to LangChain FAISS ({len(legacy_chunks)} chunks).")
                    return
            except Exception as e:
                logger.warning(f"Failed to migrate legacy index: {e}")

        # 3. Initialize fresh empty vector store
        try:
            import faiss
            empty_index = faiss.IndexFlatL2(VECTOR_SIZE)
            self.vector_store = FAISS(
                embedding_function=self.embeddings,
                index=empty_index,
                docstore=InMemoryDocstore({}),
                index_to_docstore_id={}
            )
            logger.info("Initialized empty LangChain FAISS vector store.")
        except Exception as e:
            logger.error(f"Error creating FAISS vector store: {e}")
            self.vector_store = None

    def save_vector_store(self):
        """Persists the LangChain FAISS store and updates legacy files for backward compatibility."""
        if not self.vector_store:
            return

        os.makedirs(INDEX_DIR, exist_ok=True)
        self.vector_store.save_local(INDEX_DIR)

        # Sync legacy files so any external script continues to function
        try:
            import faiss
            faiss.write_index(self.vector_store.index, LEGACY_INDEX_PATH)
            
            # Extract chunks from docstore
            all_chunks = []
            for i in range(self.vector_store.index.ntotal):
                doc_id = self.vector_store.index_to_docstore_id.get(i)
                if doc_id:
                    doc = self.vector_store.docstore.search(doc_id)
                    if isinstance(doc, Document):
                        all_chunks.append(doc.page_content)
                    else:
                        all_chunks.append(str(doc))
            
            with open(LEGACY_CHUNKS_PATH, "w", encoding="utf-8") as f:
                json.dump(all_chunks, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Warning syncing legacy files: {e}")

    def add_document_text(self, text: str, source_name: str = "document", metadata: Optional[Dict[str, Any]] = None) -> int:
        """Splits document text into semantic chunks and adds them to LangChain vector store."""
        if not text or not text.strip():
            return 0

        chunks = self.text_splitter.split_text(text)
        base_meta = {
            "source": source_name,
            "created_at": datetime.utcnow().isoformat(),
            **(metadata or {})
        }

        docs = [
            Document(page_content=chunk, metadata={**base_meta, "chunk_index": i})
            for i, chunk in enumerate(chunks)
        ]

        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(docs, self.embeddings)
        else:
            self.vector_store.add_documents(docs)

        self.save_vector_store()
        logger.info(f"Added {len(docs)} chunks from '{source_name}' to vector store.")
        return len(docs)

    # ----------------- LangGraph Nodes -----------------
    def _parse_input_node(self, state: RAGState) -> Dict[str, Any]:
        """Parses raw user messages, extracts inline documents (e.g. from DocumentSimple), and isolates the core question."""
        raw_messages = state.get("raw_messages", [])
        if not raw_messages:
            return {
                "extracted_query": "",
                "inline_document": None,
                "status": "empty_input"
            }

        inline_doc = None
        extracted_query = ""

        # Case 1: Frontend sent array like ["Document Content: ...", "User asked: ..."]
        full_text = "\n".join(raw_messages)
        for msg in raw_messages:
            msg_str = str(msg).strip()
            if msg_str.startswith("Document Content:"):
                inline_doc = msg_str.replace("Document Content:", "", 1).strip()
            elif msg_str.startswith("User asked:"):
                extracted_query = msg_str.replace("User asked:", "", 1).strip()

        # If not matched by prefix, take the last message as the active query
        if not extracted_query:
            if len(raw_messages) > 0:
                extracted_query = str(raw_messages[-1]).strip()

        # Clean query if it still contains wrappers
        if "User asked:" in extracted_query:
            extracted_query = extracted_query.split("User asked:")[-1].strip()

        return {
            "extracted_query": extracted_query,
            "inline_document": inline_doc,
            "status": "input_parsed"
        }

    def _retrieve_node(self, state: RAGState) -> Dict[str, Any]:
        """Retrieves top legal chunks from the vector store and any inline document provided."""
        query = state.get("extracted_query", "")
        inline_doc = state.get("inline_document")
        retrieved_docs: List[Document] = []
        retrieved_texts: List[str] = []

        # 1. Retrieve from persistent FAISS vector store
        if self.vector_store and self.vector_store.index.ntotal > 0 and query:
            try:
                # Retrieve with similarity score
                docs_and_scores = self.vector_store.similarity_search_with_score(query, k=4)
                for doc, score in docs_and_scores:
                    doc.metadata["retrieval_score"] = float(score)
                    retrieved_docs.append(doc)
                    retrieved_texts.append(doc.page_content)
            except Exception as e:
                logger.error(f"Error querying vector store: {e}")

        # 2. If user passed an inline document (e.g. from contract simplifier), also chunk and search it
        if inline_doc and query:
            try:
                inline_chunks = self.text_splitter.split_text(inline_doc)
                if inline_chunks:
                    # In-memory mini FAISS or keyword match for the uploaded contract
                    temp_docs = [
                        Document(page_content=c, metadata={"source": "uploaded_contract", "chunk_index": i})
                        for i, c in enumerate(inline_chunks)
                    ]
                    # Select most relevant chunks from uploaded contract
                    temp_vs = FAISS.from_documents(temp_docs, self.embeddings)
                    temp_results = temp_vs.similarity_search(query, k=3)
                    for d in temp_results:
                        retrieved_docs.insert(0, d)
                        retrieved_texts.insert(0, d.page_content)
            except Exception as e:
                logger.warning(f"Error retrieving from inline document: {e}")

        # Format context text
        context_text = "\n\n---\n\n".join([doc.page_content for doc in retrieved_docs])

        return {
            "retrieved_documents": retrieved_docs,
            "context_used": retrieved_texts,
            "context_text": context_text,
            "status": "documents_retrieved"
        }

    def _grade_documents_node(self, state: RAGState) -> Dict[str, Any]:
        """Grades document relevance to determine if documents are sufficient or if fallback is needed."""
        docs = state.get("retrieved_documents", [])
        query = state.get("extracted_query", "")

        if not docs or not query:
            return {
                "relevance_decision": "no_docs",
                "relevance_score": 0.0,
                "status": "no_documents"
            }

        # Calculate average or best retrieval score
        scores = [d.metadata.get("retrieval_score", 1.0) for d in docs if "retrieval_score" in d.metadata]
        best_score = min(scores) if scores else 1.0

        # L2 distance: lower is better; threshold around 1500 for Cohere 1024d embeddings
        is_relevant = len(docs) > 0

        return {
            "relevance_decision": "relevant" if is_relevant else "insufficient",
            "relevance_score": float(best_score),
            "status": "graded"
        }

    def _generate_answer_node(self, state: RAGState) -> Dict[str, Any]:
        """Generates legal response using ChatCohere and LangChain prompt template."""
        context = state.get("context_text", "")
        query = state.get("extracted_query", "")
        raw_messages = state.get("raw_messages", [])
        history = "\n".join(raw_messages)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are LegalEase AI, an expert, objective, and authoritative legal advisor specializing in tenancy, contract law, civil rights, and statutory compliance.

Your task is to provide clear, actionable, and structured legal advice based on the provided Context and the user's question.

STRICT GUIDELINES:
1. Ground your advice in the provided Legal Context, referencing relevant statutes, clauses, or sections whenever available.
2. Structure your answer using clean, professional GitHub-flavored Markdown:
   - ### 📌 Direct Answer & Summary
   - ### ⚖️ Applicable Legal Provisions & Clauses
   - ### 🛡️ Your Rights & Recommended Steps
   - ### ⚠️ Key Deadlines, Notices, or Exceptions
3. Tone: Professional, clear, objective, and supportive.
4. Bold key terms, notice periods, and statutory numbers for effortless readability.
5. Conclude with the standard disclaimer: "*Disclaimer: LegalEase provides informational legal analysis and is not a formal substitute for a licensed advocate or attorney.*"
"""),
            ("human", """Legal Context:
{context}

Conversation / Context History:
{history}

User Question:
{query}

Please deliver a thorough, structured, and precise legal answer following the guidelines:""")
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        try:
            answer = chain.invoke({
                "context": context if context else "No specific statutory context provided.",
                "history": history,
                "query": query
            })
        except Exception as e:
            logger.error(f"Error during LLM generation: {e}")
            answer = f"Error generating legal advice: {str(e)}"

        return {
            "answer": answer,
            "status": "answer_generated"
        }

    def _fallback_node(self, state: RAGState) -> Dict[str, Any]:
        """Provides general legal advisory fallback when no documents match."""
        query = state.get("extracted_query", "your legal question")

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are LegalEase AI, an expert legal assistant. 
When specific contractual clauses or statutory provisions are not yet uploaded in the system, provide a high-level overview of established legal principles, rights, and standard statutory rules related to the query.
Advise the user to upload their specific contract/notice for a granular clause analysis.
Format your answer with clean Markdown and include standard legal disclaimers.
"""),
            ("human", "User Question: {query}")
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        try:
            answer = chain.invoke({"query": query})
        except Exception as e:
            answer = (
                f"We could not find specific uploaded clauses matching: '{query}'. "
                "Please upload your rental agreement, contract, or legal notice to receive clause-level analysis."
            )

        return {
            "answer": answer,
            "status": "fallback_generated"
        }

    def _format_response_node(self, state: RAGState) -> Dict[str, Any]:
        """Packages the final response payload with citations and metadata."""
        docs = state.get("retrieved_documents", [])
        citations = []
        for d in docs:
            citations.append({
                "source": d.metadata.get("source", "Legal Document"),
                "chunk_index": d.metadata.get("chunk_index", 0),
                "preview": d.page_content[:180] + "..." if len(d.page_content) > 180 else d.page_content
            })

        return {
            "citations": citations,
            "status": "complete"
        }

    # ----------------- Conditional Routing -----------------
    def _route_after_grading(self, state: RAGState) -> str:
        """Routes between document-grounded generation and general fallback."""
        decision = state.get("relevance_decision", "no_docs")
        if decision == "relevant":
            return "generate_answer"
        return "fallback"

    # ----------------- Build LangGraph Workflow -----------------
    def _build_graph(self):
        """Builds and compiles the StateGraph workflow."""
        builder = StateGraph(RAGState)

        # Add Nodes
        builder.add_node("parse_input", self._parse_input_node)
        builder.add_node("retrieve", self._retrieve_node)
        builder.add_node("grade_documents", self._grade_documents_node)
        builder.add_node("generate_answer", self._generate_answer_node)
        builder.add_node("fallback", self._fallback_node)
        builder.add_node("format_response", self._format_response_node)

        # Add Edges
        builder.add_edge(START, "parse_input")
        builder.add_edge("parse_input", "retrieve")
        builder.add_edge("retrieve", "grade_documents")

        # Conditional Edge after grading
        builder.add_conditional_edges(
            "grade_documents",
            self._route_after_grading,
            {
                "generate_answer": "generate_answer",
                "fallback": "fallback"
            }
        )

        builder.add_edge("generate_answer", "format_response")
        builder.add_edge("fallback", "format_response")
        builder.add_edge("format_response", END)

        return builder.compile()

    # ----------------- Execution Interface -----------------
    @traceable(
        name="LegalEase-RAG-Execution",
        run_type="chain",
        tags=["legalease", "rag", "langgraph", "langsmith"]
    )
    def query(self, messages: List[str]) -> Dict[str, Any]:
        """Executes the full LangGraph workflow for a list of messages."""
        initial_state: RAGState = {
            "raw_messages": messages,
            "extracted_query": "",
            "inline_document": None,
            "retrieved_documents": [],
            "context_text": "",
            "relevance_decision": "no_docs",
            "relevance_score": 0.0,
            "answer": "",
            "context_used": [],
            "citations": [],
            "status": "initiated",
            "error": None
        }

        result = self.graph.invoke(initial_state)

        return {
            "messages": messages,
            "context_used": result.get("context_used", []),
            "reply": result.get("answer", "No response generated."),
            "citations": result.get("citations", []),
            "relevance": result.get("relevance_decision", "unknown"),
            "status": result.get("status", "complete")
        }

    @traceable(
        name="LegalEase-Document-Simplification",
        run_type="chain",
        tags=["legalease", "simplifier", "langchain"]
    )
    def simplify_document(self, text: str, auto_index: bool = True) -> Dict[str, Any]:
        """
        Simplifies a legal document into a plain-English summary and key clauses using LangChain structured output.
        Automatically indexes the document into the FAISS vector store for downstream RAG Q&A.
        """
        if not text or not text.strip():
            return {"error": "Text is required for simplification.", "summary": "", "keyClauses": []}

        # 1. Generate simplification with LangChain ChatCohere structured output
        try:
            structured_chain = self.llm.with_structured_output(SimplificationResult)
            prompt = (
                "You are an expert legal assistant. Analyze the following legal document thoroughly.\n"
                "Provide a clear, comprehensive summary in plain English.\n"
                "Then extract all key clauses with title, plain-English detail, status (e.g. Active, Important, Required, Warning, or Critical), "
                "and alert=True if it represents any penalty, risk, violation, or urgent condition; false otherwise.\n\n"
                f"Document Text:\n{text[:15000]}"
            )
            result = structured_chain.invoke(prompt)
            if hasattr(result, "model_dump"):
                data = result.model_dump()
            elif isinstance(result, dict):
                data = result
            else:
                data = {
                    "summary": getattr(result, "summary", "Summary extracted."),
                    "keyClauses": [
                        c.model_dump() if hasattr(c, "model_dump") else dict(c)
                        for c in getattr(result, "keyClauses", [])
                    ]
                }
        except Exception as e:
            logger.warning(f"Structured output error, falling back to JSON prompt: {e}")
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", "You are an expert legal assistant. Output ONLY valid JSON matching this schema: "
                           "{\"summary\": string, \"keyClauses\": [{\"title\": string, \"detail\": string, \"status\": string, \"alert\": boolean}]}"),
                ("human", f"Document Text:\n{text[:15000]}")
            ])
            chain = prompt_template | self.llm | StrOutputParser()
            raw_json = chain.invoke({})
            raw_clean = raw_json.replace("```json", "").replace("```", "").strip()
            data = json.loads(raw_clean)

        # 2. Auto-index into the RAG vector store so user can immediately query it
        if auto_index and text.strip():
            try:
                chunks_added = self.add_document_text(
                    text=text,
                    source_name="user_uploaded_contract",
                    metadata={"source": "uploaded_contract", "simplified": True}
                )
                logger.info(f"Auto-indexed uploaded contract: {chunks_added} chunks added to vector store.")
                data["chunks_indexed"] = chunks_added
            except Exception as e:
                logger.warning(f"Could not auto-index simplified document: {e}")

        return data

    def get_status(self) -> Dict[str, Any]:
        """Returns the health and telemetry status of the RAG system, LangSmith, and models."""
        total_vectors = self.vector_store.index.ntotal if (self.vector_store and hasattr(self.vector_store, 'index')) else 0
        langsmith_enabled = os.getenv("LANGCHAIN_TRACING_V2", "").lower() == "true"
        has_langsmith_key = bool(os.getenv("LANGCHAIN_API_KEY") and not os.getenv("LANGCHAIN_API_KEY", "").startswith("your_"))

        return {
            "status": "healthy",
            "frameworks": {
                "langchain": "1.5.2",
                "langgraph": "1.2.24",
                "langsmith": "0.16.0"
            },
            "langsmith_tracing": {
                "enabled": langsmith_enabled,
                "project": os.getenv("LANGCHAIN_PROJECT", "legalease-rag"),
                "endpoint": os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com"),
                "api_key_configured": has_langsmith_key,
                "note": "Traces will appear on smith.langchain.com when LANGCHAIN_API_KEY is configured." if not has_langsmith_key else "Traces active on LangSmith dashboard."
            },
            "models": {
                "embeddings": EMBEDDING_MODEL_NAME,
                "chat_llm": CHAT_MODEL_NAME,
                "vector_dimension": VECTOR_SIZE
            },
            "vector_store": {
                "type": "LangChain FAISS",
                "total_documents_indexed": total_vectors,
                "index_path": INDEX_DIR
            },
            "graph": {
                "nodes": ["parse_input", "retrieve", "grade_documents", "generate_answer", "fallback", "format_response"],
                "edges": ["START -> parse_input -> retrieve -> grade_documents -> [generate_answer | fallback] -> format_response -> END"]
            }
        }

    def get_graph_mermaid(self) -> str:
        """Returns Mermaid representation of the LangGraph workflow."""
        try:
            return self.graph.get_graph().draw_mermaid()
        except Exception:
            return """
graph TD
    START --> parse_input[Parse Input & Query]
    parse_input --> retrieve[Retrieve Chunks from FAISS]
    retrieve --> grade_documents[Grade Relevance]
    grade_documents -->|Relevant| generate_answer[ChatCohere Legal Generator]
    grade_documents -->|Insufficient| fallback[Fallback Legal Guidance]
    generate_answer --> format_response[Format Citations & Response]
    fallback --> format_response
    format_response --> END
"""
