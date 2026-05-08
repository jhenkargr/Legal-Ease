from fastapi import FastAPI, UploadFile
from typing import List
import faiss
import numpy as np
import os
import json
from PyPDF2 import PdfReader
from pydantic import BaseModel

from dotenv import load_dotenv
import cohere
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Cohere Configuration ----------------
# Use environment variable for safety
load_dotenv()
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
co = cohere.Client(COHERE_API_KEY)

# ---------------- Embedding + FAISS Setup ----------------
MODEL_NAME = "embed-english-v3.0"
VECTOR_SIZE = 1024

INDEX_PATH = "vector_index.faiss"
if os.path.exists(INDEX_PATH):
    index = faiss.read_index(INDEX_PATH)
else:
    index = faiss.IndexFlatL2(VECTOR_SIZE)

CHUNKS = []

# ---------------- Utility Functions ----------------
def extract_text_from_pdf(file_path):
    text = ""
    reader = PdfReader(file_path)
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def chunk_text(text, chunk_size=500):
    return [text[i:i + chunk_size].strip() for i in range(0, len(text), chunk_size) if text[i:i + chunk_size].strip()]

def embed_text(chunks):
    response = co.embed(texts=chunks, model=MODEL_NAME, input_type="search_document")
    return response.embeddings

# ---------------- Upload Endpoint ----------------
@app.post("/upload")
async def upload_file(file: UploadFile):
    os.makedirs("data/docs", exist_ok=True)
    file_path = f"data/docs/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    embeddings = embed_text(chunks)

    index.add(np.array(embeddings).astype("float32"))
    faiss.write_index(index, INDEX_PATH)
    CHUNKS.extend(chunks)

    return {"status": "success", "chunks_stored": len(chunks)}

# ---------------- Query (Chat) Endpoint ----------------
class ChatRequest(BaseModel):
    messages: List[str]

@app.post("/query")
async def query_text(req: ChatRequest):
    if index.ntotal == 0:
        return {"error": "No documents indexed yet. Upload a file first."}

    # Combine messages into chat history
    combined_query = "\n".join(req.messages)

    # Embed and retrieve context
    response = co.embed(texts=[combined_query], model=MODEL_NAME, input_type="search_query")
    query_embedding = np.array(response.embeddings).astype("float32")
    D, I = index.search(query_embedding, 3)
    retrieved_chunks = [CHUNKS[i] for i in I[0] if i < len(CHUNKS)]

    # Build context + prompt
    context = "\n\n".join(retrieved_chunks)
    prompt = f"""
You are a helpful AI assistant.

Your task:
1. Analyze the "Context" section carefully. It contains the rules, constraints, and style instructions you must strictly follow.
2. Analyze the user’s first question from the conversation under "Chat history".
3. Combine the information from the context and the first question to understand what the user ultimately wants.
4. Generate a complete and precise answer to the user’s last question while complying with all rules from the context.

---

Context:
{context}

Chat History:
{combined_query}

---

Now, using the above context and chat history, provide a final answer to the user’s last question. Ensure:
- Rules and tone from the context are strictly followed.
- The answer is natural, clear, and concise.
- You include reasoning or analysis where applicable.

"""

    # Call Cohere
    try:
        response = co.chat(
            message=prompt,
            model="command-r-08-2024"
        )
        answer = response.text if response.text else "No valid response from Cohere."
    except Exception as e:
        answer = f"Cohere API error: {str(e)}"

    return {
        "messages": req.messages,
        "context_used": retrieved_chunks,
        "reply": answer
    }
