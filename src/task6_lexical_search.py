"""
Task 6 — Lexical search bằng BM25.

Dùng cùng corpus chunks với Task 5. BM25 phù hợp với từ khóa chính xác, mã tài
liệu và tên riêng. Output phải theo SearchResult và sort score giảm dần.
"""

from typing import Any

CORPUS: list[dict] = []


def build_bm25_index(corpus: list[dict]) -> Any:
    """Tạo BM25 index từ cùng corpus chunks của Task 4."""
    try:
        from rank_bm25 import BM25Plus

        tokenized = [item["content"].lower().split() for item in corpus]
        return BM25Plus(tokenized)
    except ImportError:
        class SimpleBM25:
            def __init__(self, docs):
                self.docs = docs

            def get_scores(self, tokens):
                scores = []
                for doc in self.docs:
                    score = sum(1.0 for t in tokens if t in doc)
                    scores.append(float(score))
                return scores

        tokenized = [item["content"].lower().split() for item in corpus]
        return SimpleBM25(tokenized)


def lexical_search(query: str, top_k: int = 10) -> list[dict]:
    """Trả về BM25 SearchResult theo score giảm dần."""
    global CORPUS
    if not CORPUS:
        try:
            from .task4_chunking_indexing import chunk_documents, load_documents
            docs = load_documents()
            if docs:
                CORPUS = chunk_documents(docs)
        except Exception:
            pass

    if not CORPUS:
        return []

    bm25 = build_bm25_index(CORPUS)
    query_tokens = query.lower().split()
    if not query_tokens:
        return []

    scores = bm25.get_scores(query_tokens)
    try:
        import numpy as np
        indices = np.argsort(scores)[::-1][:top_k]
    except ImportError:
        indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    results = []
    for index in indices:
        item = CORPUS[index]
        results.append({
            "id": item["id"],
            "content": item["content"],
            "score": float(scores[index]),
            "metadata": item["metadata"],
            "retrieval_method": "bm25",
        })

    return results[:top_k]


if __name__ == "__main__":
    for result in lexical_search("test query", top_k=3):
        print(result)
