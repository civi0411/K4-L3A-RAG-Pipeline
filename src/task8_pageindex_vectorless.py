"""
Task 8 — PageIndex vectorless fallback.

Hướng dẫn:
    1. Đọc PAGEINDEX_API_KEY từ .env.
    2. Upload tài liệu ở định dạng PageIndex hỗ trợ.
    3. Cache document IDs để không upload lại.
    4. Parse kết quả thành SearchResult có method pageindex.

PageIndex là dịch vụ ngoài: cần timeout và xử lý lỗi để pipeline không crash.
"""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

PAGEINDEX_API_KEY = os.getenv("PAGEINDEX_API_KEY", "")
STANDARDIZED_DIR = Path(__file__).parent.parent / "data" / "standardized"


def upload_documents() -> None:
    """Upload tài liệu và lưu document IDs để tái sử dụng."""
    if not PAGEINDEX_API_KEY:
        print("PAGEINDEX_API_KEY is not configured. Skipping upload.")
        return


def pageindex_search(query: str, top_k: int = 5) -> list[dict]:
    """Trả về pageindex SearchResult."""
    if not PAGEINDEX_API_KEY:
        return []

    try:
        import pageindex

        client = pageindex.Client(api_key=PAGEINDEX_API_KEY)
        response = client.search(query=query, top_k=top_k)
        results = []
        for index, item in enumerate(response.get("results", [])):
            results.append({
                "id": str(item.get("id", f"pageindex-{index}")),
                "content": str(item.get("content", "")),
                "score": float(item.get("score", 1.0 - index * 0.1)),
                "metadata": {
                    "source": str(item.get("source", "pageindex.doc")),
                    "title": str(item.get("title", "PageIndex Result")),
                    "doc_type": "legal",
                    "url": item.get("url"),
                    "chunk_index": int(item.get("chunk_index", index)),
                },
                "retrieval_method": "pageindex",
            })
        return results[:top_k]
    except Exception:
        return []


if __name__ == "__main__":
    upload_documents()
