import os
import json
import sqlite3
import struct
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

JINA_API_KEY     = os.environ["JINA_API_KEY"]
OPENROUTER_KEY   = os.environ["OPENROUTER_API_KEY"]
EMBED_MODEL      = "jina-embeddings-v3"
LLM_MODEL        = "google/gemini-2.0-flash-exp:free"
DB_PATH          = os.environ.get("DB_PATH", "botty.db")
TOP_K            = 4


# ── DB setup ────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            source  TEXT,
            content TEXT,
            vector  BLOB
        )
    """)
    conn.commit()
    return conn


# ── Embedding via Jina AI ────────────────────────────────────────────────────

async def embed(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.jina.ai/v1/embeddings",
            headers={"Authorization": f"Bearer {JINA_API_KEY}"},
            json={"model": EMBED_MODEL, "input": texts, "task": "retrieval.query"},
        )
        res.raise_for_status()
        data = res.json()
        return [item["embedding"] for item in data["data"]]


def vec_to_blob(v: list[float]) -> bytes:
    return struct.pack(f"{len(v)}f", *v)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot  = sum(x * y for x, y in zip(a, b))
    na   = sum(x * x for x in a) ** 0.5
    nb   = sum(x * x for x in b) ** 0.5
    return dot / (na * nb + 1e-9)


def blob_to_vec(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


# ── Retrieval ────────────────────────────────────────────────────────────────

async def retrieve(query: str, k: int = TOP_K) -> list[dict]:
    [q_vec] = await embed([query])

    db = get_db()
    rows = db.execute("SELECT id, source, content, vector FROM chunks").fetchall()
    db.close()

    if not rows:
        return []

    scored = []
    for row_id, source, content, blob in rows:
        v = blob_to_vec(blob)
        score = cosine_similarity(q_vec, v)
        scored.append((score, source, content))

    scored.sort(reverse=True)
    return [{"source": s, "content": c} for _, s, c in scored[:k]]


# ── LLM via OpenRouter ────────────────────────────────────────────────────────

async def ask_llm(question: str, context_chunks: list[dict]) -> str:
    if context_chunks:
        context_text = "\n\n---\n\n".join(
            f"[{c['source']}]\n{c['content']}" for c in context_chunks
        )
        system = (
            "Du bist ein hilfreicher Assistent. "
            "Beantworte die Frage ausschließlich auf Basis des folgenden Kontexts. "
            "Wenn der Kontext keine Antwort enthält, sage das ehrlich.\n\n"
            f"Kontext:\n{context_text}"
        )
    else:
        system = (
            "Du bist ein hilfreicher Assistent. "
            "Es sind noch keine Wissensdokumente im System. "
            "Weise den Nutzer freundlich darauf hin, dass er erst Dokumente hochladen soll."
        )

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "HTTP-Referer": "https://markusstuhr.de/botty",
                "X-Title": "Botty RAG",
            },
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": question},
                ],
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


# ── Routes ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "Empty message")

    chunks  = await retrieve(req.message)
    answer  = await ask_llm(req.message, chunks)
    sources = list(dict.fromkeys(c["source"] for c in chunks))

    return {"answer": answer, "sources": sources}


class IngestRequest(BaseModel):
    source:  str
    content: str


@app.post("/ingest")
async def ingest(req: IngestRequest):
    """Add a text chunk to the knowledge base."""
    paragraphs = [p.strip() for p in req.content.split("\n\n") if p.strip()]
    if not paragraphs:
        raise HTTPException(400, "No content")

    vectors = await embed(paragraphs)

    db = get_db()
    db.executemany(
        "INSERT INTO chunks (source, content, vector) VALUES (?, ?, ?)",
        [(req.source, para, vec_to_blob(vec)) for para, vec in zip(paragraphs, vectors)],
    )
    db.commit()
    db.close()

    return {"inserted": len(paragraphs)}


@app.delete("/knowledge")
def clear_knowledge():
    """Wipe all chunks (for testing)."""
    db = get_db()
    db.execute("DELETE FROM chunks")
    db.commit()
    db.close()
    return {"deleted": True}


@app.get("/knowledge/stats")
def knowledge_stats():
    db = get_db()
    count = db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    sources = db.execute("SELECT DISTINCT source FROM chunks").fetchall()
    db.close()
    return {"chunks": count, "sources": [r[0] for r in sources]}
