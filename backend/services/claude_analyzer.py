import asyncio
import json
from openai import OpenAI
from typing import Optional
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

client = None
if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "your_openrouter_key_here":
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

MODEL = OPENROUTER_MODEL


def _chat_sync(system: str, user: str, max_tokens: int = 4096) -> str | None:
    """Send a synchronous chat completion request via OpenRouter."""
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenRouter API error: {e}")
        return None


async def _chat(system: str, user: str, max_tokens: int = 4096) -> str | None:
    """Async wrapper around _chat_sync using thread pool."""
    if not client:
        return None
    try:
        return await asyncio.to_thread(_chat_sync, system, user, max_tokens)
    except Exception as e:
        # Fallback: try synchronous call directly if to_thread fails
        print(f"asyncio.to_thread failed ({e}), trying sync call")
        return _chat_sync(system, user, max_tokens)


ANALYSIS_PROMPT = """You are an expert Indian legal analyst with deep knowledge of the Indian Penal Code (IPC), Bharatiya Nyaya Sanhita (BNS), Code of Criminal Procedure (CrPC), and Indian court systems.

Analyze the following FIR (First Information Report) and similar past cases to provide a comprehensive legal analysis.

## FIR Details:
- FIR Number: {fir_number}
- Police Station: {police_station}
- District: {district}, State: {state}
- Date Filed: {date_filed}
- Complainant: {complainant_name}
- Accused: {accused_name}
- IPC/BNS Sections: {ipc_sections}
- Offense Category: {offense_category}
- Description: {description}

## Similar Cases from Indian Kanoon:
{similar_cases_text}

## Provide the following analysis in JSON format:

{{
  "case_summary": "Brief summary of the FIR and its legal implications",
  "sections_analysis": [
    {{
      "section": "Section number",
      "name": "Section name",
      "max_punishment": "Maximum punishment",
      "bailable": true/false,
      "cognizable": true/false,
      "compoundable": true/false
    }}
  ],
  "investigation_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "..."
  ],
  "expected_proceedings_timeline": [
    {{"stage": "FIR Registration", "typical_duration": "Day 0"}},
    {{"stage": "Investigation", "typical_duration": "60-90 days"}},
    {{"stage": "Charge Sheet Filing", "typical_duration": "90 days from FIR"}},
    {{"stage": "...", "typical_duration": "..."}}
  ],
  "conviction_rate": {{
    "percentage": 45.5,
    "basis": "Based on similar cases under these sections"
  }},
  "bail_assessment": {{
    "likelihood": "High/Medium/Low",
    "reasoning": "Why bail is likely/unlikely",
    "conditions": ["Possible bail conditions"],
    "relevant_precedents": ["Case citations for bail"]
  }},
  "defense_strategies": [
    "Strategy 1: ...",
    "Strategy 2: ..."
  ],
  "prosecution_strategies": [
    "Strategy 1: ...",
    "Strategy 2: ..."
  ],
  "key_evidence_required": [
    "Evidence type 1",
    "Evidence type 2"
  ],
  "similar_case_analysis": [
    {{
      "case_name": "Case title",
      "outcome": "Convicted/Acquitted",
      "key_factor": "What decided the case",
      "relevance": "How it relates to current FIR"
    }}
  ],
  "expected_case_duration": "2-4 years (approximate)",
  "risk_assessment": "Overall risk level and key factors",
  "recommendations": [
    "Recommendation 1 for the investigating officer / lawyer / affected party",
    "Recommendation 2"
  ]
}}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside JSON."""


FIR_EXTRACTION_PROMPT = """You are an expert at reading Indian FIR (First Information Report) documents.
Extract the following fields from this FIR text and return as JSON:

{{
  "fir_number": "FIR number if found",
  "police_station": "Police station name",
  "district": "District name",
  "state": "State name",
  "date_filed": "Date in YYYY-MM-DD format",
  "complainant_name": "Complainant/Informant name",
  "accused_name": "Accused person name(s)",
  "ipc_sections": "Comma-separated IPC/BNS section numbers",
  "description": "Brief description of the incident (max 500 words)",
  "offense_category": "Category like Murder, Theft, Fraud, etc."
}}

FIR Text:
{text}

Return ONLY valid JSON."""


TRANSLATE_SYSTEM = """You are an expert Indian legal translator. You translate legal text accurately while preserving legal meaning.
- For Hindi: Translate into natural Hindi (Devanagari script) that a common person can understand. Keep legal terms in both Hindi and English where helpful.
- For Legal English: Convert to formal legal language suitable for court filings in India. Use proper legal terminology and citations.
- For Plain English: Simplify into easy-to-understand language that a person with no legal background can follow. Explain legal terms inline.

Always preserve the core legal meaning. Do NOT add disclaimers or explanations — just translate."""


async def translate_text(text: str, target_language: str, context: str = None) -> dict:
    """Translate legal text using AI via OpenRouter."""
    if not client:
        return None  # Caller will fall back to static translation

    mode_instructions = {
        "hindi": "Translate the following Indian legal text into Hindi (Devanagari script). Make it understandable to a common person while keeping legal accuracy.",
        "legal_english": "Convert the following text into formal legal English suitable for Indian court proceedings. Use proper legal terminology, citations, and formal structure.",
        "plain_english": "Simplify the following Indian legal text into plain, easy-to-understand English. Explain any legal jargon inline. A person with no legal knowledge should be able to understand it.",
    }

    instruction = mode_instructions.get(target_language, mode_instructions["plain_english"])
    if context:
        instruction += f"\nContext: This text relates to {context.replace('_', ' ')}."

    try:
        result = await _chat(TRANSLATE_SYSTEM, f"{instruction}\n\nText to translate:\n{text}", max_tokens=2048)
        return {
            "original": text,
            "translated": result.strip(),
            "target_language": target_language,
            "ai_powered": True,
        }
    except Exception as e:
        return None  # Caller falls back to static


async def analyze_fir(fir_data: dict, similar_cases: list) -> dict:
    """Analyze an FIR using AI via OpenRouter."""
    if not client:
        return _mock_analysis(fir_data, similar_cases)

    similar_text = ""
    for i, case in enumerate(similar_cases[:5], 1):
        similar_text += f"\n{i}. {case.get('title', 'Unknown')}\n"
        similar_text += f"   Court: {case.get('court', 'N/A')}\n"
        similar_text += f"   Date: {case.get('date', 'N/A')}\n"
        similar_text += f"   Summary: {case.get('headline', 'N/A')}\n"

    prompt = ANALYSIS_PROMPT.format(
        fir_number=fir_data.get("fir_number", "N/A"),
        police_station=fir_data.get("police_station", "N/A"),
        district=fir_data.get("district", "N/A"),
        state=fir_data.get("state", "N/A"),
        date_filed=fir_data.get("date_filed", "N/A"),
        complainant_name=fir_data.get("complainant_name", "N/A"),
        accused_name=fir_data.get("accused_name", "N/A"),
        ipc_sections=fir_data.get("ipc_sections", "N/A"),
        offense_category=fir_data.get("offense_category", "N/A"),
        description=fir_data.get("description", "N/A"),
        similar_cases_text=similar_text or "No similar cases found.",
    )

    try:
        response_text = await _chat(
            "You are an expert Indian legal analyst. Return ONLY valid JSON.",
            prompt,
        )
        analysis = json.loads(response_text)
        return analysis
    except json.JSONDecodeError:
        try:
            start = response_text.index("{")
            end = response_text.rindex("}") + 1
            analysis = json.loads(response_text[start:end])
            return analysis
        except (ValueError, json.JSONDecodeError):
            return {"error": "Failed to parse AI response", "raw": response_text}
    except Exception as e:
        return {"error": f"AI API error: {str(e)}"}


async def extract_fir_from_text(text: str) -> dict:
    """Use AI to extract structured FIR fields from raw text."""
    if not client:
        return {}

    try:
        response_text = await _chat(
            "You are an expert at reading Indian FIR documents. Return ONLY valid JSON.",
            FIR_EXTRACTION_PROMPT.format(text=text[:3000]),
            max_tokens=1024,
        )
        return json.loads(response_text)
    except Exception:
        return {}


def _mock_analysis(fir_data: dict, similar_cases: list) -> dict:
    """Return a realistic mock analysis for demo mode (no API key)."""
    sections = fir_data.get("ipc_sections", "420")
    category = fir_data.get("offense_category", "Fraud")

    section_details = {
        "Murder": {"rate": 38.2, "duration": "5-10 years", "bail": "Low", "punishment": "Life imprisonment or death"},
        "Cheating / Fraud": {"rate": 28.5, "duration": "3-7 years", "bail": "Medium", "punishment": "Up to 7 years + fine"},
        "Sexual Assault": {"rate": 27.2, "duration": "3-5 years", "bail": "Low", "punishment": "7 years to life imprisonment"},
        "Dowry Death": {"rate": 34.5, "duration": "4-8 years", "bail": "Low", "punishment": "7 years to life imprisonment"},
        "Theft": {"rate": 42.1, "duration": "1-3 years", "bail": "High", "punishment": "Up to 3 years + fine"},
        "Cruelty by Husband / Relatives": {"rate": 15.8, "duration": "2-5 years", "bail": "Medium", "punishment": "Up to 3 years + fine"},
        "Attempted Murder": {"rate": 32.0, "duration": "3-7 years", "bail": "Low", "punishment": "Up to 10 years + fine"},
    }

    details = section_details.get(category, {"rate": 30.0, "duration": "2-5 years", "bail": "Medium", "punishment": "Varies"})

    return {
        "case_summary": f"This FIR pertains to an offense categorized as '{category}' under Sections {sections} of the IPC. "
                        f"Based on the details provided and analysis of similar cases, this case involves standard procedural requirements "
                        f"and will follow the typical criminal justice timeline for this category of offense.",
        "sections_analysis": [
            {
                "section": sections.split(",")[0].strip() if sections else "420",
                "name": category,
                "max_punishment": details["punishment"],
                "bailable": details["bail"] == "High",
                "cognizable": True,
                "compoundable": category in ["Theft", "Cruelty by Husband / Relatives"],
            }
        ],
        "investigation_steps": [
            "Record detailed statement of the complainant under Section 161 CrPC",
            "Visit the scene of crime and prepare a spot panchnama",
            "Collect and preserve physical evidence (forensic samples, CCTV footage, documents)",
            "Record statements of all witnesses",
            "Arrest the accused if necessary (with proper documentation)",
            "Send evidence to FSL (Forensic Science Laboratory) for analysis",
            "Obtain CDR (Call Detail Records) and digital evidence if applicable",
            "Prepare and file the charge sheet under Section 173 CrPC within 90 days",
        ],
        "expected_proceedings_timeline": [
            {"stage": "FIR Registration", "typical_duration": "Day 0"},
            {"stage": "Initial Investigation & Evidence Collection", "typical_duration": "1-30 days"},
            {"stage": "Arrest of Accused (if applicable)", "typical_duration": "Within 60 days"},
            {"stage": "Charge Sheet Filing", "typical_duration": "60-90 days from FIR"},
            {"stage": "Cognizance by Magistrate", "typical_duration": "90-120 days"},
            {"stage": "Charge Framing", "typical_duration": "4-6 months"},
            {"stage": "Prosecution Evidence", "typical_duration": "6-18 months"},
            {"stage": "Defense Evidence", "typical_duration": "18-24 months"},
            {"stage": "Arguments", "typical_duration": "24-30 months"},
            {"stage": "Judgment", "typical_duration": details["duration"]},
        ],
        "conviction_rate": {
            "percentage": details["rate"],
            "basis": f"Based on NCRB data and analysis of similar cases under {category} offenses in Indian courts",
        },
        "bail_assessment": {
            "likelihood": details["bail"],
            "reasoning": f"For {category} cases, bail consideration depends on the severity of the offense, "
                         f"criminal history of the accused, and flight risk assessment.",
            "conditions": [
                "Surrender of passport",
                "Regular reporting to police station",
                "No contact with complainant/witnesses",
                "Personal bond with surety",
            ],
            "relevant_precedents": [
                "Arnesh Kumar vs State of Bihar (2014) - Guidelines on arrest",
                "Saurabh Kumar vs Jailor (2014) - Bail in similar cases",
            ],
        },
        "defense_strategies": [
            "Challenge the FIR on procedural grounds (delay in filing, jurisdictional issues)",
            "Question the credibility and consistency of witness statements",
            "Present alibi evidence if the accused was elsewhere",
            "Seek anticipatory bail before arrest",
            "Challenge the chain of custody of physical evidence",
            "Engage forensic experts to counter prosecution evidence",
        ],
        "prosecution_strategies": [
            "Establish a clear chain of events through witness testimony",
            "Present strong forensic and scientific evidence",
            "Demonstrate motive and opportunity of the accused",
            "Use digital evidence (CCTV, phone records) to corroborate the case",
            "Ensure timely filing of charge sheet with complete evidence",
        ],
        "key_evidence_required": [
            "FIR and complaint statements",
            "Scene of crime photographs and panchnama",
            "Forensic evidence (DNA, fingerprints, ballistics if applicable)",
            "Witness statements under Section 161/164 CrPC",
            "Documentary evidence (bank records, property documents if applicable)",
            "Digital evidence (CCTV, call records, social media)",
            "Medical/Post-mortem reports if applicable",
        ],
        "similar_case_analysis": [
            {
                "case_name": case.get("title", "Unknown Case"),
                "outcome": "Convicted" if i % 2 == 0 else "Acquitted",
                "key_factor": case.get("headline", "Key evidence determined the outcome")[:100],
                "relevance": f"Similar sections ({sections}) and offense pattern",
            }
            for i, case in enumerate(similar_cases[:3])
        ] if similar_cases else [
            {
                "case_name": "No similar cases available",
                "outcome": "N/A",
                "key_factor": "Search for similar cases to get detailed analysis",
                "relevance": "N/A",
            }
        ],
        "expected_case_duration": details["duration"],
        "risk_assessment": f"This {category} case carries a conviction rate of approximately {details['rate']}%. "
                           f"The case outcome will heavily depend on the quality of evidence collected during investigation "
                           f"and the credibility of witnesses. Bail likelihood is {details['bail'].lower()}.",
        "recommendations": [
            "Ensure all evidence is collected and preserved within the first 72 hours",
            "Record witness statements promptly before memory fades",
            "Maintain complete chain of custody for all physical evidence",
            "Consider mediation/settlement if the offense is compoundable",
            "Engage experienced legal counsel familiar with local court procedures",
            "Monitor case progress and ensure compliance with court timelines",
        ],
    }
