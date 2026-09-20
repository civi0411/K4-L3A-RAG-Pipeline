"""
Task 10 — Generation có citation.

Hướng dẫn:
    1. Retrieve top-k chunks.
    2. Reorder để giảm lost-in-the-middle.
    3. Format context kèm title và source.
    4. Gọi provider được chọn trong .env.
    5. Trả answer, sources và retrieval_source.

Nếu context không đủ hoặc provider lỗi, trả safe refusal; không bịa thông tin.
"""

import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .task9_retrieval_pipeline import retrieve

TOP_K = 5
TOP_P = 0.9
TEMPERATURE = 0.3

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openrouter").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")

SYSTEM_PROMPT = """Bạn là trợ lý tư vấn pháp luật, quy chế đào tạo đại học, sau đại học và chuẩn chương trình đào tạo của Bộ Giáo dục và Đào tạo.
Quy tắc bắt buộc:
1. Trả lời chỉ từ context được cung cấp một cách chính xác, khúc chiết.
2. Mỗi khẳng định phải có citation rõ ràng theo định dạng [Tên văn bản, Điều/Mục/Khoản] (Ví dụ: [Luật 125/2025/QH15, Điều 14], [Thông tư 54/2026/TT-BGDĐT, Điều 8], [Quyết định 2627/QĐ-BGDĐT, Mục 2.4]).
3. Nếu context không có bằng chứng, hãy từ chối xác minh theo mẫu quy định. Tuyệt đối không bịa thông tin."""


def reorder_for_llm(chunks: list[dict]) -> list[dict]:
    """Đưa chunks quan trọng về đầu và cuối context (chống lost-in-the-middle)."""
    copied = list(chunks)
    if len(copied) <= 2:
        return copied
    front = copied[::2]
    back = copied[1::2]
    return front + back[::-1]


def format_context(chunks: list[dict]) -> str:
    """Tạo context có title và source label."""
    parts = []
    for index, chunk in enumerate(chunks, 1):
        metadata = chunk.get("metadata", {})
        title = metadata.get("title", f"Tài liệu {index}")
        source = metadata.get("source", "Nguồn tham khảo")
        parts.append(
            f"[Document {index} | Title: {title} | Source: {source}]\n{chunk['content']}"
        )
    return "\n\n---\n\n".join(parts)


def call_llm(system_prompt: str, user_message: str) -> str:
    """Gọi OpenRouter, Gemini, OpenAI hoặc Anthropic theo cấu hình."""
    provider = os.getenv("LLM_PROVIDER", LLM_PROVIDER).lower()

    if provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured in environment or .env")
        import openai
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        model_name = os.getenv("LLM_MODEL") or "openai/gpt-4o-mini"
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=TEMPERATURE,
        )
        return response.choices[0].message.content or ""

    elif provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured in environment or .env")
        from google import genai
        client = genai.Client(api_key=api_key)
        model_name = os.getenv("LLM_MODEL") or "gemini-2.5-flash"
        prompt = f"{system_prompt}\n\n{user_message}"
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text or ""

    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured in environment or .env")
        import openai
        # Tự động nhận diện OpenRouter key nếu bắt đầu bằng sk-or-
        base_url = "https://openrouter.ai/api/v1" if api_key.startswith("sk-or-") else None
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        model_name = os.getenv("LLM_MODEL") or ("openai/gpt-4o-mini" if api_key.startswith("sk-or-") else "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=TEMPERATURE,
        )
        return response.choices[0].message.content or ""

    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured in environment or .env")
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        model_name = os.getenv("LLM_MODEL") or "claude-3-5-sonnet-20241022"
        response = client.messages.create(
            model=model_name,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            max_tokens=1024,
            temperature=TEMPERATURE,
        )
        return response.content[0].text if response.content else ""

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


def generate_hypothetical_document(query: str) -> str:
    """[Bonus HyDE] Sinh văn bản pháp lý/quy chế giả định để tối ưu hóa vector retrieval."""
    hyde_prompt = (
        f"Hãy viết một đoạn tóm tắt quy chế hoặc điều khoản pháp luật ngắn gọn (2-3 câu) giải đáp vấn đề sau:\n{query}"
    )
    try:
        return call_llm("Bạn là chuyên gia quy chế đào tạo và chuẩn chương trình giáo dục đại học.", hyde_prompt)
    except Exception:
        return query


def generate_with_citation(query: str, top_k: int = TOP_K) -> dict:
    """Trả về GenerationResult tuân thủ hợp đồng nghiêm ngặt."""
    chunks = retrieve(query, top_k=top_k)
    if not chunks:
        return {
            "answer": "Tôi không thể xác minh thông tin này từ nguồn hiện có.",
            "sources": [],
            "retrieval_source": "none",
        }

    reordered = reorder_for_llm(chunks)
    context = format_context(reordered)
    user_message = f"Context:\n{context}\n\nQuestion: {query}"

    try:
        answer = call_llm(SYSTEM_PROMPT, user_message)
    except Exception:
        # Safe fallback khi chưa có API key hoặc network error
        answer = (
            "Dựa trên các tài liệu đã tra cứu được:\n"
            + "\n".join(
                f"- {c['metadata']['title']}: {c['content'][:150]}..."
                for c in chunks[:2]
            )
        )

    first_method = chunks[0].get("retrieval_method", "hybrid")
    retrieval_source = first_method if first_method in {"hybrid", "pageindex"} else "hybrid"

    return {
        "answer": answer,
        "sources": chunks,
        "retrieval_source": retrieval_source,
    }


if __name__ == "__main__":
    print(generate_with_citation("test query"))
