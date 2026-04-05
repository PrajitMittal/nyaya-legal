import httpx
from typing import List, Optional
from config import INDIAN_KANOON_API_TOKEN

KANOON_BASE_URL = "https://api.indiankanoon.org"


async def search_kanoon(query: str, page: int = 0) -> List[dict]:
    """Search Indian Kanoon for cases matching the query."""
    if not INDIAN_KANOON_API_TOKEN or INDIAN_KANOON_API_TOKEN == "your_token_here":
        return _mock_search(query)

    headers = {"Authorization": f"Token {INDIAN_KANOON_API_TOKEN}"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{KANOON_BASE_URL}/search/",
                headers=headers,
                data={"formInput": query, "pagenum": page},
            )
            resp.raise_for_status()
            data = resp.json()
            results = []
            for doc in data.get("docs", []):
                results.append({
                    "title": doc.get("title", ""),
                    "doc_id": str(doc.get("tid", "")),
                    "headline": doc.get("headline", ""),
                    "court": doc.get("docsource", ""),
                    "date": doc.get("publishdate", ""),
                    "citations": doc.get("citation", ""),
                })
            return results
    except Exception as e:
        print(f"Indian Kanoon API error: {e}")
        return _mock_search(query)


async def get_document(doc_id: str) -> Optional[dict]:
    """Get a full document from Indian Kanoon."""
    if not INDIAN_KANOON_API_TOKEN or INDIAN_KANOON_API_TOKEN == "your_token_here":
        return _mock_document(doc_id)

    headers = {"Authorization": f"Token {INDIAN_KANOON_API_TOKEN}"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{KANOON_BASE_URL}/doc/{doc_id}/",
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"Indian Kanoon doc fetch error: {e}")
        return _mock_document(doc_id)


def build_search_query(ipc_sections: str, description: str = "") -> str:
    """Build an optimized search query from IPC sections and description."""
    parts = []
    if ipc_sections:
        sections = [s.strip() for s in ipc_sections.split(",")]
        for sec in sections[:3]:  # Top 3 sections
            parts.append(f"Section {sec} IPC")
    if description:
        # Extract key terms (first 5 significant words)
        stop_words = {"the", "a", "an", "is", "was", "were", "of", "in", "to", "and", "or", "on", "at", "by", "for", "with", "that", "this", "from"}
        words = [w for w in description.split() if w.lower() not in stop_words and len(w) > 3]
        parts.extend(words[:5])
    return " ".join(parts) if parts else "criminal case"


# --- Mock Data for Demo Mode ---

def _mock_search(query: str) -> List[dict]:
    """Return realistic mock search results for demo without API key."""
    mock_cases = [
        {
            "title": "State of Maharashtra vs. Suresh Kumar (2023)",
            "doc_id": "mock_001",
            "headline": "Murder case under Section 302 IPC. Accused convicted based on circumstantial evidence. Sentence: Life imprisonment.",
            "court": "Bombay High Court",
            "date": "2023-06-15",
            "citations": "2023 BHC 1456",
        },
        {
            "title": "Rajesh Sharma vs. State of UP (2022)",
            "doc_id": "mock_002",
            "headline": "Cheating case under Section 420 IPC. Property fraud involving forged documents. Accused acquitted due to lack of evidence.",
            "court": "Allahabad High Court",
            "date": "2022-11-20",
            "citations": "2022 AHC 890",
        },
        {
            "title": "State of Delhi vs. Amit Verma (2023)",
            "doc_id": "mock_003",
            "headline": "Dowry death case under Section 304B/498A IPC. Conviction upheld. Evidence of persistent cruelty established.",
            "court": "Delhi High Court",
            "date": "2023-03-10",
            "citations": "2023 DHC 234",
        },
        {
            "title": "Priya Devi vs. State of Bihar (2021)",
            "doc_id": "mock_004",
            "headline": "Sexual assault case under Section 376 IPC. Medical evidence corroborated victim testimony. Accused sentenced to 10 years RI.",
            "court": "Patna High Court",
            "date": "2021-08-05",
            "citations": "2021 PHC 567",
        },
        {
            "title": "State of Karnataka vs. Mohammed Ismail (2022)",
            "doc_id": "mock_005",
            "headline": "Theft and receiving stolen property under Sections 379/411 IPC. Chain of custody established. Conviction with 3 years RI.",
            "court": "Karnataka High Court",
            "date": "2022-04-22",
            "citations": "2022 KHC 345",
        },
        {
            "title": "Sanjay Gupta vs. State of Rajasthan (2023)",
            "doc_id": "mock_006",
            "headline": "Criminal conspiracy and fraud under Sections 120B/420/467/468 IPC. Multi-crore Ponzi scheme. All accused convicted.",
            "court": "Rajasthan High Court",
            "date": "2023-01-18",
            "citations": "2023 RHC 789",
        },
        {
            "title": "State of Tamil Nadu vs. Karthik Subramanian (2022)",
            "doc_id": "mock_007",
            "headline": "Attempted murder under Section 307 IPC. Knife attack on neighbor over land dispute. Convicted, 7 years RI.",
            "court": "Madras High Court",
            "date": "2022-09-30",
            "citations": "2022 MHC 456",
        },
        {
            "title": "Meena Kumari vs. State of MP (2023)",
            "doc_id": "mock_008",
            "headline": "Cruelty by husband under Section 498A IPC. Dowry demand and physical abuse established through medical records.",
            "court": "Madhya Pradesh High Court",
            "date": "2023-07-12",
            "citations": "2023 MPHC 123",
        },
    ]

    # Filter based on query keywords
    query_lower = query.lower()
    scored = []
    for case in mock_cases:
        score = 0
        text = (case["title"] + " " + case["headline"]).lower()
        for word in query_lower.split():
            if word in text:
                score += 1
        scored.append((score, case))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [case for _, case in scored[:5]]


def _mock_document(doc_id: str) -> dict:
    """Return a mock document for demo mode."""
    return {
        "title": f"Mock Case Document ({doc_id})",
        "doc": "This is a mock judgment document used for demonstration purposes. "
               "In a production environment, the full judgment text would be fetched "
               "from Indian Kanoon's API, including detailed facts, arguments, "
               "legal reasoning, and the court's decision.",
        "docsource": "Mock Court",
    }
