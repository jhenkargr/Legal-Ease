"""
Script to inspect FAISS embedding vectors and their corresponding document chunks.
Usage:
    python inspect_vectors.py [vector_index]
Example:
    python inspect_vectors.py 0
"""
import os
import sys
import pickle
import faiss

# Resolve paths relative to script location or project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_DIRS = [
    os.path.join(BASE_DIR, "faiss_index"),
    os.path.join(BASE_DIR, "..", "faiss_index"),
    os.path.join(BASE_DIR, "fastapi", "faiss_index"),
]

INDEX_FILE = None
PKL_FILE = None
for p in POSSIBLE_DIRS:
    idx = os.path.join(p, "index.faiss")
    pkl = os.path.join(p, "index.pkl")
    if os.path.exists(idx) and os.path.exists(pkl):
        INDEX_FILE = idx
        PKL_FILE = pkl
        break

def inspect(idx_num=0):
    if not INDEX_FILE or not PKL_FILE:
        print("❌ Could not locate 'faiss_index/index.faiss' and 'index.pkl'")
        return

    try:
        # 1. Read FAISS index
        index = faiss.read_index(INDEX_FILE)
        total = index.ntotal
        dim = index.d
        print("=" * 65)
        print(f"📊 FAISS Vector Store Status:")
        print(f"   • Index Path:            {INDEX_FILE}")
        print(f"   • Total Vectors Indexed: {total}")
        print(f"   • Vector Dimensions:     {dim} (Cohere embed-english-v3.0)")
        print(f"   • Metric:                Inner Product / Cosine Similarity")
        print("=" * 65)

        if total == 0:
            print("⚠️ The vector index is empty.")
            return

        if idx_num >= total:
            print(f"⚠️ Index {idx_num} out of bounds (max: {total - 1})")
            idx_num = 0

        # 2. Extract Vector (Float32 array)
        vector = index.reconstruct(idx_num)
        print(f"\n🔢 Vector #{idx_num} (1024-dimensional float32):")
        print(f"   Shape:           {vector.shape}")
        print(f"   First 10 floats: {vector[:10].tolist()}")
        print(f"   Range:           min={vector.min():.5f}, max={vector.max():.5f}, mean={vector.mean():.5f}")

        # 3. Read LangChain Document mapping
        with open(PKL_FILE, "rb") as f:
            docstore, index_to_docstore_id = pickle.load(f)

        doc_id = index_to_docstore_id.get(idx_num)
        if doc_id:
            doc = docstore.search(doc_id)
            print(f"\n📄 Corresponding Document Chunk:")
            print(f"   Docstore ID: {doc_id}")
            print(f"   Metadata:    {doc.metadata}")
            print(f"   Text Snippet:")
            print("-" * 65)
            preview = doc.page_content[:350].strip()
            print(preview + ("..." if len(doc.page_content) > 350 else ""))
            print("-" * 65)
    except Exception as e:
        print(f"❌ Error reading index: {e}")

if __name__ == "__main__":
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    inspect(target)
