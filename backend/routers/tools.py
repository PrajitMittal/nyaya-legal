"""
New module endpoints: Bail Calculator, FIR Assistant, Section Mapper, Know Your Rights.
All work WITHOUT external APIs -- pure logic + static database.
"""
import os
import shutil
import tempfile
from fastapi import APIRouter, Query, UploadFile, File
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import hashlib
import re
import asyncio
from services.ipc_database import (
    calculate_bail_eligibility,
    get_section,
    get_incident_sections,
    get_all_sections_list,
    map_ipc_to_bns,
    get_ipc_from_bns,
    IPC_SECTIONS,
)
from services.claude_analyzer import translate_text as ai_translate
from services.pdf_parser import extract_text_from_pdf

router = APIRouter()


# ============ PDF TEXT EXTRACTION (shared) ============

@router.post("/extract-pdf")
async def extract_pdf_text(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF. Used by multiple tools."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are accepted"}

    tmp_path = None
    try:
        # Read file content first
        content = await file.read()
        if len(content) < 100:
            return {"error": "File appears to be empty or too small"}

        # Write to temp file
        tmp_path = os.path.join(tempfile.gettempdir(), f"nyaya_{os.getpid()}.pdf")
        with open(tmp_path, "wb") as f:
            f.write(content)

        text = extract_text_from_pdf(tmp_path)

        if not text or len(text.strip()) < 10:
            return {"error": "Could not extract text from PDF. The file may be scanned/image-based."}

        return {"text": text, "char_count": len(text)}
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


# ============ AI OCR FOR SCANNED PDFs ============

@router.post("/ocr-pdf")
async def ocr_pdf(data: dict):
    """Use Gemini vision to extract text from scanned PDF page images."""
    images = data.get("images", [])
    if not images:
        return {"error": "No images provided"}
    if len(images) > 10:
        return {"error": "Too many pages (max 10)"}

    from services.claude_analyzer import client
    from config import OPENROUTER_MODEL
    if not client:
        return {"error": "AI service not configured. Set OPENROUTER_API_KEY."}

    try:
        # Build message with images
        content = [{"type": "text", "text": "Extract ALL text from these scanned document pages. Return only the extracted text, preserving the original structure and formatting. If there are tables, preserve them. Include every word visible in the images."}]
        for img_data_url in images:
            content.append({
                "type": "image_url",
                "image_url": {"url": img_data_url}
            })

        def _call():
            return client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=[{"role": "user", "content": content}],
                max_tokens=8000,
                temperature=0.1,
            )

        try:
            resp = await asyncio.to_thread(_call)
        except Exception:
            # Fallback: sync call if to_thread fails on Vercel
            resp = _call()

        text = resp.choices[0].message.content or ""
        return {"text": text, "pages_processed": len(images)}
    except Exception as e:
        return {"error": f"AI OCR failed: {str(e)}"}


# ============ BAIL ELIGIBILITY CALCULATOR ============

@router.post("/bail-calculator")
def bail_calculator(data: dict):
    """
    Calculate bail eligibility based on sections, arrest date, chargesheet status.
    No API needed -- pure statutory calculation.
    """
    sections = data.get("sections", [])
    if isinstance(sections, str):
        sections = [s.strip() for s in sections.split(",")]

    arrest_date = data.get("arrest_date")
    chargesheet_filed = data.get("chargesheet_filed", False)
    chargesheet_date = data.get("chargesheet_date")

    if not sections or not arrest_date:
        return {"error": "Provide sections and arrest_date (YYYY-MM-DD)"}

    result = calculate_bail_eligibility(
        sections=sections,
        arrest_date_str=arrest_date,
        chargesheet_filed=chargesheet_filed,
        chargesheet_date_str=chargesheet_date,
    )
    return result


# ============ FIR FILING ASSISTANT ============

@router.post("/fir-assistant")
def fir_assistant(data: dict):
    """
    Given an incident description, suggest applicable IPC sections,
    determine if cognizable (police MUST file FIR), and provide rights information.
    """
    incident = data.get("incident", "")
    if not incident:
        return {"error": "Describe the incident"}

    # Find matching sections
    suggested_sections = get_incident_sections(incident)

    # Determine if cognizable
    any_cognizable = any(s.get("cognizable") for s in suggested_sections)
    all_bailable = all(s.get("bailable", True) for s in suggested_sections)

    # Build rights information
    rights = []
    if any_cognizable:
        rights = [
            {
                "right": "Police MUST register FIR",
                "explanation": "Under Section 154 CrPC (now Section 173 BNSS), if you report a cognizable offense, "
                               "the police officer is LEGALLY BOUND to register an FIR. Refusal is a punishable offense.",
                "legal_basis": "Section 154 CrPC / Section 173 BNSS",
            },
            {
                "right": "You can file FIR at ANY police station (Zero FIR)",
                "explanation": "You do not need to go to the police station with jurisdiction. "
                               "Any police station in India must accept your FIR and transfer it to the correct jurisdiction.",
                "legal_basis": "Section 154(1) CrPC, Lalita Kumari v. State of UP (2014)",
            },
            {
                "right": "If police refuse, you have legal remedies",
                "explanation": "If the SHO refuses to register your FIR, you can: "
                               "(1) Send a written complaint to the Superintendent of Police by post, "
                               "(2) File a complaint before the Judicial Magistrate under Section 156(3) CrPC, "
                               "(3) Approach the State/National Human Rights Commission, "
                               "(4) File a writ petition in High Court.",
                "legal_basis": "Section 154(3) CrPC, Section 156(3) CrPC",
            },
            {
                "right": "Free copy of FIR",
                "explanation": "You are entitled to a free copy of the FIR immediately upon registration. "
                               "The police cannot charge you for it.",
                "legal_basis": "Section 154(2) CrPC",
            },
            {
                "right": "Woman complainant: Special rights",
                "explanation": "If the complainant is a woman, the FIR can be recorded at her residence. "
                               "For sexual offenses, the statement must be recorded by a woman officer. "
                               "Medical examination of the victim must happen within 24 hours.",
                "legal_basis": "Section 154(1) proviso, Section 164A CrPC",
            },
        ]
    else:
        rights = [
            {
                "right": "This may be a non-cognizable offense",
                "explanation": "For non-cognizable offenses, police register an NCR (Non-Cognizable Report) instead of an FIR. "
                               "You may need to approach the Magistrate for permission to investigate.",
                "legal_basis": "Section 155 CrPC",
            },
        ]

    # What to do if police refuse
    escalation_steps = [
        {
            "step": 1,
            "action": "Request in writing",
            "detail": "Write a formal complaint on paper and submit to the SHO. Get an acknowledgment receipt. "
                      "If verbal, the Supreme Court has held that even a phone call to the police station is valid (Lalita Kumari case).",
        },
        {
            "step": 2,
            "action": "Complain to SP/SSP",
            "detail": "Send your complaint by registered post to the Superintendent of Police. "
                      "Under Section 154(3) CrPC, the SP can direct the SHO to register the FIR.",
        },
        {
            "step": 3,
            "action": "Approach Magistrate (Section 156(3))",
            "detail": "File an application before the Judicial Magistrate requesting direction to police to register FIR and investigate. "
                      "The Magistrate can order the police to register FIR and submit a report.",
        },
        {
            "step": 4,
            "action": "File online complaint",
            "detail": "Many states have e-FIR or online complaint portals. File your complaint online to create a digital trail. "
                      "For cybercrimes, use cybercrime.gov.in",
        },
        {
            "step": 5,
            "action": "Human Rights Commission",
            "detail": "If police are being deliberately obstructive, file a complaint with the State Human Rights Commission "
                      "or National Human Rights Commission.",
        },
    ]

    # Generate draft complaint template
    draft_complaint = _generate_complaint_template(incident, suggested_sections)

    return {
        "incident": incident,
        "suggested_sections": suggested_sections,
        "is_cognizable": any_cognizable,
        "all_bailable": all_bailable,
        "fir_mandatory": any_cognizable,
        "your_rights": rights,
        "if_police_refuse": escalation_steps,
        "draft_complaint": draft_complaint,
        "important_precedent": {
            "case": "Lalita Kumari v. State of UP (2014)",
            "court": "Supreme Court of India",
            "ruling": "Registration of FIR is MANDATORY under Section 154 CrPC if the information discloses commission of a cognizable offense. "
                      "No preliminary inquiry is permissible in such cases. The police officer cannot refuse on any ground.",
        },
    }


def _generate_complaint_template(incident: str, sections: list) -> str:
    """Generate a draft FIR complaint template."""
    section_nums = ", ".join(s["section"] for s in sections) if sections else "___"
    section_names = ", ".join(s["name"] for s in sections) if sections else "___"

    return f"""To,
The Station House Officer,
_______ Police Station,
_______ District, _______ State

Subject: Complaint for registration of FIR under Sections {section_nums} IPC ({section_names})

Respected Sir/Madam,

I, _______ (Name), S/o / D/o / W/o _______, aged _______ years,
R/o _______ (Full Address),
Contact: _______ (Phone), _______ (Email)

do hereby lodge this complaint as follows:

FACTS OF THE INCIDENT:
Date of incident: _______
Time of incident: _______
Place of incident: _______

{incident}

DETAILS OF ACCUSED (if known):
Name: _______
Address: _______
Description: _______

WITNESSES (if any):
1. _______
2. _______

PROPERTY LOST/DAMAGED (if any):
_______

I request you to kindly register an FIR under the appropriate sections of law
and investigate the matter.

I declare that the facts stated above are true and correct to the best of my
knowledge and belief.

Date: _______
Place: _______

Signature: _______
Name: _______

Note: Under Lalita Kumari v. State of UP (2014), registration of FIR is
mandatory for cognizable offenses. Refusal to register FIR is punishable
under Section 166A IPC."""


# ============ IPC-BNS SECTION MAPPER ============

@router.get("/section-mapper")
def section_mapper(
    ipc: str = Query(None, description="IPC section number"),
    bns: str = Query(None, description="BNS section number"),
):
    """Map IPC section to BNS or vice versa."""
    if ipc:
        result = map_ipc_to_bns(ipc)
        if result:
            return {"direction": "IPC -> BNS", **result}
        return {"error": f"IPC Section {ipc} not found in database"}
    elif bns:
        ipc_num = get_ipc_from_bns(bns)
        if ipc_num:
            sec = IPC_SECTIONS[ipc_num]
            return {
                "direction": "BNS -> IPC",
                "bns_section": bns,
                "ipc_section": ipc_num,
                "name": sec["name"],
                "punishment": sec["punishment"],
            }
        return {"error": f"BNS Section {bns} not found in database"}
    return {"error": "Provide either 'ipc' or 'bns' query parameter"}


@router.get("/sections")
def list_sections():
    """List all IPC sections in the database with BNS equivalents."""
    return get_all_sections_list()


@router.get("/section/{section_number}")
def get_section_detail(section_number: str):
    """Get full details of an IPC section."""
    sec = get_section(section_number)
    if not sec:
        return {"error": f"Section {section_number} not found"}
    return {"section": section_number, **sec}


# ============ KNOW YOUR RIGHTS ============

@router.get("/rights/{situation}")
def know_your_rights(situation: str):
    """Get your legal rights for common situations."""
    rights_db = {
        "arrest": {
            "title": "Your Rights When Arrested",
            "rights": [
                {
                    "right": "Right to know grounds of arrest",
                    "detail": "Under Article 22(1) of the Constitution and Section 50 CrPC, "
                              "the police MUST inform you of the grounds of arrest immediately.",
                    "what_to_do": "Ask the police officer: 'Why am I being arrested? Under which sections?'",
                },
                {
                    "right": "Right to inform someone",
                    "detail": "Under Section 50A CrPC, the police MUST inform a family member or friend "
                              "of your arrest and the place of detention.",
                    "what_to_do": "Insist that the police call your family member immediately. Give them the number.",
                },
                {
                    "right": "Right to a lawyer",
                    "detail": "Under Article 22(1) of the Constitution, you have the right to consult "
                              "a legal practitioner of your choice from the moment of arrest.",
                    "what_to_do": "Say: 'I want to speak to my lawyer before saying anything.' Do not sign any document without legal advice.",
                },
                {
                    "right": "Right to free legal aid",
                    "detail": "Under Section 304 CrPC and Article 39A, if you cannot afford a lawyer, "
                              "the state MUST provide one free of charge.",
                    "what_to_do": "Tell the Magistrate: 'I cannot afford a lawyer. I need free legal aid.'",
                },
                {
                    "right": "Must be produced before Magistrate within 24 hours",
                    "detail": "Under Article 22(2) and Section 57 CrPC, you must be produced before "
                              "the nearest Magistrate within 24 hours of arrest (excluding travel time).",
                    "what_to_do": "Note the time of arrest. If 24 hours pass without being taken to court, it's illegal detention.",
                },
                {
                    "right": "Right against torture and inhuman treatment",
                    "detail": "Under Article 21, no person can be subjected to torture, cruel, or degrading treatment. "
                              "Police CANNOT beat you, threaten you, or force a confession.",
                    "what_to_do": "If tortured, tell the Magistrate immediately. Ask for a medical examination. File complaint with NHRC.",
                },
                {
                    "right": "Right to medical examination",
                    "detail": "Under Section 54 CrPC, you have the right to be medically examined to record injuries.",
                    "what_to_do": "Request medical examination at the time of arrest, especially if you have any existing injuries.",
                },
                {
                    "right": "Right to silence",
                    "detail": "Under Article 20(3) of the Constitution, no person accused of an offense "
                              "can be compelled to be a witness against themselves.",
                    "what_to_do": "You can refuse to answer questions that may incriminate you. Say: 'I will answer in the presence of my lawyer.'",
                },
                {
                    "right": "Women: Cannot be arrested after sunset and before sunrise",
                    "detail": "Under Section 46(4) CrPC, a woman cannot be arrested after sunset and before sunrise "
                              "except in exceptional circumstances with a written order from a first class Magistrate.",
                    "what_to_do": "If you are a woman being arrested at night, ask for the Magistrate's written order.",
                },
            ],
            "emergency_contacts": {
                "police": "100",
                "women_helpline": "1091 / 181",
                "nhrc": "14433",
                "legal_aid": "15100 (NALSA)",
                "child_helpline": "1098",
            },
        },
        "fir": {
            "title": "Your Rights When Filing an FIR",
            "rights": [
                {
                    "right": "FIR registration is mandatory for cognizable offenses",
                    "detail": "Under Lalita Kumari v. State of UP (2014), police MUST register FIR. No preliminary inquiry allowed for cognizable offenses.",
                    "what_to_do": "Clearly state the facts. Insist on an FIR, not just a 'complaint' or 'DD entry'.",
                },
                {
                    "right": "Zero FIR - File anywhere",
                    "detail": "You can file an FIR at ANY police station in India regardless of jurisdiction.",
                    "what_to_do": "Go to the nearest police station. Don't let them send you elsewhere.",
                },
                {
                    "right": "Free copy of FIR",
                    "detail": "You are entitled to a free copy immediately.",
                    "what_to_do": "Ask for the FIR copy before leaving the police station.",
                },
                {
                    "right": "FIR in your language",
                    "detail": "The FIR can be written in any language. You can dictate in your language.",
                    "what_to_do": "Speak in the language you are comfortable with.",
                },
                {
                    "right": "Read before signing",
                    "detail": "The FIR must be read back to you before you sign it.",
                    "what_to_do": "Listen carefully. Correct any mistakes. Do not sign if the facts are wrong.",
                },
            ],
        },
        "bail": {
            "title": "Your Rights Regarding Bail",
            "rights": [
                {
                    "right": "Bail is the rule, jail is the exception",
                    "detail": "The Supreme Court has repeatedly held that bail should be the norm. "
                              "State of Rajasthan v. Balchand (1977): 'The basic rule is bail, not jail.'",
                    "what_to_do": "Apply for bail at the earliest opportunity.",
                },
                {
                    "right": "Bailable offenses: Bail is a RIGHT",
                    "detail": "For bailable offenses, bail CANNOT be refused. The police station itself can grant bail.",
                    "what_to_do": "For bailable offenses, tell the police: 'I am applying for bail. This is a bailable offense.'",
                },
                {
                    "right": "Default bail if chargesheet not filed on time",
                    "detail": "If police don't file chargesheet within 60/90 days, you get automatic bail.",
                    "what_to_do": "Count the days from arrest. Apply for default bail the day the deadline passes.",
                },
                {
                    "right": "Release if served half of maximum sentence (436A)",
                    "detail": "If you've served half the maximum sentence as an undertrial, you MUST be released on personal bond.",
                    "what_to_do": "Calculate half of maximum sentence. Apply under Section 436A.",
                },
                {
                    "right": "Cannot be denied bail due to poverty",
                    "detail": "Moti Ram v. State of MP (1978): Bail conditions should not be so onerous that the poor cannot meet them.",
                    "what_to_do": "If bail is granted but you can't afford surety, apply for personal bond.",
                },
            ],
        },
        "search": {
            "title": "Your Rights During a Police Search",
            "rights": [
                {
                    "right": "Search warrant required for private premises",
                    "detail": "Under Section 93-98 CrPC, police generally need a search warrant from a Magistrate to search your home.",
                    "what_to_do": "Ask to see the search warrant. Note the warrant number and Magistrate's name.",
                },
                {
                    "right": "Search in presence of independent witnesses",
                    "detail": "Under Section 100 CrPC, search must be conducted in the presence of two independent witnesses from the locality.",
                    "what_to_do": "Insist on independent witnesses. Call your neighbors.",
                },
                {
                    "right": "Women: Search by woman officer only",
                    "detail": "Under Section 51(2) CrPC, search of a woman must be made by another woman with strict regard to decency.",
                    "what_to_do": "Refuse search by male officers. Request a woman officer.",
                },
                {
                    "right": "List of seized items",
                    "detail": "Police must prepare a detailed list (panchnama) of all items seized during the search.",
                    "what_to_do": "Insist on a panchnama. Read it. Get a copy. Note if anything is missing or incorrectly listed.",
                },
            ],
        },
    }

    situation_lower = situation.lower().strip()
    if situation_lower in rights_db:
        return rights_db[situation_lower]

    return {
        "error": f"Situation '{situation}' not found",
        "available": list(rights_db.keys()),
        "hint": "Try: arrest, fir, bail, search",
    }


# ============ CASE EXPLAINER ============

def _generate_mock_case_data(case_number: str) -> Dict:
    """Generate realistic mock case data based on a CNR or case number."""
    # Use hash of case_number to deterministically generate mock data
    h = int(hashlib.md5(case_number.encode()).hexdigest(), 16)

    case_types = [
        {"type": "Criminal", "section": "Section 420 IPC (Cheating)", "court": "Sessions Court"},
        {"type": "Criminal", "section": "Section 302 IPC (Murder)", "court": "Sessions Court"},
        {"type": "Criminal", "section": "Section 376 IPC (Rape)", "court": "Sessions Court"},
        {"type": "Criminal", "section": "Section 498A IPC (Cruelty by Husband)", "court": "Magistrate Court"},
        {"type": "Criminal", "section": "Section 306 IPC (Abetment of Suicide)", "court": "Sessions Court"},
        {"type": "Civil", "section": "Suit for Recovery of Money", "court": "Civil Court"},
        {"type": "Civil", "section": "Suit for Specific Performance", "court": "Civil Court"},
        {"type": "Criminal", "section": "Section 304B IPC (Dowry Death)", "court": "Sessions Court"},
    ]

    stages = ["FIR Registered", "Investigation", "Chargesheet Filed", "Cognizance Taken",
              "Charge Framing", "Prosecution Evidence", "Defence Evidence",
              "Final Arguments", "Judgment Reserved", "Judgment Delivered"]

    judges = ["Hon'ble Justice A.K. Sharma", "Hon'ble Justice S. Mehta",
              "Hon'ble Justice R. Krishnamurthy", "Hon'ble Justice P. Banerjee",
              "Hon'ble Justice M. Deshmukh"]

    districts = ["Central Delhi", "Saket (South Delhi)", "Patiala House (New Delhi)",
                 "Karkardooma (East Delhi)", "Rohini (North-West Delhi)",
                 "Thane", "Pune", "Bengaluru Urban", "Chennai"]

    idx = h % len(case_types)
    case_info = case_types[idx]
    stage_idx = h % len(stages)
    current_stage = stages[min(stage_idx, len(stages) - 1)]
    judge = judges[h % len(judges)]
    district = districts[h % len(districts)]

    # Generate a realistic filing date (1-4 years ago)
    days_ago = 365 + (h % 1095)
    filing_date = (datetime.now() - timedelta(days=days_ago)).strftime("%d-%m-%Y")
    next_hearing = (datetime.now() + timedelta(days=7 + (h % 30))).strftime("%d-%m-%Y")

    petitioner = ["Ramesh Kumar", "Sunita Devi", "Mohammed Irfan", "Priya Sharma",
                  "Anil Gupta", "Lakshmi Bai"][h % 6]
    respondent = ["State of Delhi", "State of Maharashtra", "State of Karnataka",
                  "State of Tamil Nadu", "Union of India"][h % 5]

    # Build timeline
    timeline = []
    base_date = datetime.now() - timedelta(days=days_ago)
    for i, stage in enumerate(stages):
        if i <= stage_idx:
            stage_date = base_date + timedelta(days=i * (days_ago // (stage_idx + 1)))
            timeline.append({
                "stage": stage,
                "date": stage_date.strftime("%d-%m-%Y"),
                "completed": True,
                "description": _get_stage_description(stage),
            })
        else:
            timeline.append({
                "stage": stage,
                "date": None,
                "completed": False,
                "description": _get_stage_description(stage),
            })

    return {
        "case_number": case_number,
        "case_type": case_info["type"],
        "sections": case_info["section"],
        "court": case_info["court"],
        "district": district,
        "judge": judge,
        "filing_date": filing_date,
        "petitioner": petitioner,
        "respondent": respondent,
        "current_stage": current_stage,
        "next_hearing_date": next_hearing,
        "timeline": timeline,
    }


def _get_stage_description(stage: str) -> str:
    descriptions = {
        "FIR Registered": "First Information Report lodged at the police station. Investigation begins.",
        "Investigation": "Police investigating the matter, collecting evidence, recording statements under Section 161 CrPC.",
        "Chargesheet Filed": "Police filed the chargesheet (final report under Section 173 CrPC) before the Magistrate.",
        "Cognizance Taken": "The Magistrate has taken judicial notice of the offense and issued process against the accused.",
        "Charge Framing": "Formal charges have been framed against the accused. The accused pleaded not guilty.",
        "Prosecution Evidence": "The prosecution is presenting its witnesses and evidence (PW examination and cross-examination).",
        "Defence Evidence": "The defence is presenting its witnesses and evidence (DW examination).",
        "Final Arguments": "Both sides are presenting their closing arguments before the court.",
        "Judgment Reserved": "The court has reserved judgment after hearing all arguments.",
        "Judgment Delivered": "The court has pronounced its judgment.",
    }
    return descriptions.get(stage, "")


@router.post("/case-explainer")
def case_explainer(data: dict):
    """
    Explain a case in plain language given a CNR number or case number.
    Returns mock data with timeline, explanation, and next steps.
    """
    case_number = data.get("case_number", "").strip() or data.get("cnr_number", "").strip()
    if not case_number:
        return {"error": "Provide a 'case_number' or 'cnr_number'"}

    case_data = _generate_mock_case_data(case_number)

    # Generate plain language explanation
    explanation = (
        f"This is a {case_data['case_type']} case filed under {case_data['sections']} "
        f"in the {case_data['court']}, {case_data['district']}. "
        f"The case was filed on {case_data['filing_date']} by {case_data['petitioner']} "
        f"against {case_data['respondent']}. "
        f"The case is currently at the '{case_data['current_stage']}' stage and is being "
        f"heard by {case_data['judge']}. "
        f"The next hearing is scheduled for {case_data['next_hearing_date']}."
    )

    # Generate next steps based on current stage
    next_steps = _get_next_steps(case_data["current_stage"], case_data["case_type"])

    # Estimated time to conclusion
    stage_list = [t["stage"] for t in case_data["timeline"]]
    completed = [t for t in case_data["timeline"] if t["completed"]]
    remaining = len(stage_list) - len(completed)
    estimated_months = remaining * 4  # rough average of 4 months per stage

    # Build stage analysis
    current_stage = case_data["current_stage"]
    stage_desc_map = {
        "FIR Registered": "The FIR has been lodged. Investigation will now begin.",
        "Investigation": "Police are investigating the case. Evidence is being collected.",
        "Chargesheet Filed": "Police have filed the chargesheet. Court will take cognizance.",
        "Cognizance Taken": "The court has accepted the case. Charges will be framed next.",
        "Charge Framing": "The court is deciding what charges to formally frame against the accused.",
        "Prosecution Evidence": "Prosecution witnesses are being examined and cross-examined.",
        "Defence Evidence": "The defence is presenting its witnesses and evidence.",
        "Final Arguments": "Both sides are presenting their final arguments to the judge.",
        "Judgment Reserved": "Arguments are complete. The judge is deliberating on the verdict.",
        "Judgment Delivered": "The court has delivered its verdict.",
    }

    return {
        "case_info": {
            "case_number": case_data.get("case_number", ""),
            "cnr_number": case_data.get("case_number", "").replace("-", ""),
            "court": case_data.get("court", ""),
            "judge": case_data.get("judge", ""),
            "case_type": case_data.get("case_type", ""),
            "filing_date": case_data.get("filing_date", ""),
            "petitioner": case_data.get("petitioner", ""),
            "respondent": case_data.get("respondent", ""),
            "current_stage": current_stage,
            "next_date": case_data.get("next_hearing_date", ""),
            "sections": case_data.get("sections", ""),
        },
        "timeline": [
            {
                "stage": t["stage"],
                "status": "completed" if t["completed"] else ("current" if t["stage"] == current_stage else "upcoming"),
                "date": t.get("date", ""),
                "description": t.get("description", ""),
            }
            for t in case_data.get("timeline", [])
        ],
        "plain_language_explanation": explanation,
        "stage_analysis": {
            "current_stage_description": stage_desc_map.get(current_stage, "Case is in progress."),
            "bottleneck": f"Your case has been at the '{current_stage}' stage. Average cases spend 3-6 months at this stage." if remaining > 3 else None,
            "average_duration_for_stage": f"Typical duration for '{current_stage}' stage: 3-6 months in district courts, 2-4 months in High Courts.",
        },
        "next_steps": next_steps,
        "estimated_time_remaining": f"Approximately {estimated_months} months (rough estimate based on average timelines)",
        "important_note": "This data is generated for informational purposes. For verified case status, "
                          "please check the official eCourts website (ecourts.gov.in) or visit the court.",
    }


def _get_next_steps(current_stage: str, case_type: str) -> List[Dict]:
    """Return actionable next steps based on the current case stage."""
    steps_map = {
        "FIR Registered": [
            {"step": "Obtain a copy of the FIR from the police station", "priority": "High"},
            {"step": "Consult a lawyer immediately to understand the charges", "priority": "High"},
            {"step": "If arrested, apply for bail at the earliest opportunity", "priority": "High"},
            {"step": "Do not give any statement to police without your lawyer present", "priority": "High"},
        ],
        "Investigation": [
            {"step": "Cooperate with investigation but do not self-incriminate (Article 20(3))", "priority": "High"},
            {"step": "If not arrested, apply for anticipatory bail if apprehending arrest", "priority": "Medium"},
            {"step": "Track if chargesheet is filed within 60/90 days for default bail eligibility", "priority": "High"},
            {"step": "Preserve all evidence that supports your case", "priority": "Medium"},
        ],
        "Chargesheet Filed": [
            {"step": "Obtain a copy of the chargesheet from court", "priority": "High"},
            {"step": "Review chargesheet with your lawyer for defects or missing evidence", "priority": "High"},
            {"step": "If in custody, apply for regular bail", "priority": "High"},
            {"step": "Prepare for charge framing hearing", "priority": "Medium"},
        ],
        "Cognizance Taken": [
            {"step": "Ensure you have legal representation for all hearings", "priority": "High"},
            {"step": "If charges are baseless, consider filing discharge application", "priority": "High"},
            {"step": "If applicable, explore quashing under Section 482 CrPC", "priority": "Medium"},
        ],
        "Charge Framing": [
            {"step": "File a discharge application if grounds exist", "priority": "High"},
            {"step": "Prepare list of defence witnesses", "priority": "Medium"},
            {"step": "Identify weaknesses in prosecution case for cross-examination", "priority": "High"},
        ],
        "Prosecution Evidence": [
            {"step": "Attend every hearing -- absence may result in adverse inference", "priority": "High"},
            {"step": "Your lawyer should effectively cross-examine prosecution witnesses", "priority": "High"},
            {"step": "Note inconsistencies in prosecution witness testimonies", "priority": "High"},
            {"step": "Prepare your defence evidence and witnesses", "priority": "Medium"},
        ],
        "Defence Evidence": [
            {"step": "Present all defence witnesses as scheduled", "priority": "High"},
            {"step": "File any documentary evidence through proper channel", "priority": "High"},
            {"step": "Consider whether the accused should enter the witness box (Section 315 CrPC)", "priority": "High"},
        ],
        "Final Arguments": [
            {"step": "Ensure your lawyer files detailed written arguments", "priority": "High"},
            {"step": "Cite relevant Supreme Court and High Court precedents", "priority": "High"},
            {"step": "Prepare for possible outcomes and plan appeals if needed", "priority": "Medium"},
        ],
        "Judgment Reserved": [
            {"step": "Wait for the judgment date", "priority": "Medium"},
            {"step": "Prepare grounds for appeal in case of adverse judgment", "priority": "Medium"},
            {"step": "If convicted, bail pending appeal can be applied for immediately", "priority": "High"},
        ],
        "Judgment Delivered": [
            {"step": "Obtain certified copy of the judgment", "priority": "High"},
            {"step": "If convicted, file appeal within 30 days (High Court) or 90 days (Supreme Court)", "priority": "High"},
            {"step": "Apply for suspension of sentence pending appeal if needed", "priority": "High"},
            {"step": "If acquitted, apply for return of any seized property", "priority": "Medium"},
        ],
    }
    return steps_map.get(current_stage, [{"step": "Consult a lawyer for guidance", "priority": "High"}])


# ============ DOCUMENT DRAFTER ============

DOCUMENT_TEMPLATES = {
    "default_bail": {
        "title": "Application for Default Bail under Section 167(2) CrPC / Section 187 BNSS",
        "description": "When police fail to file chargesheet within the statutory period (60/90 days)",
    },
    "anticipatory_bail": {
        "title": "Application for Anticipatory Bail under Section 438 CrPC / Section 482 BNSS",
        "description": "Pre-arrest bail application when apprehending arrest",
    },
    "regular_bail": {
        "title": "Application for Regular Bail under Section 439 CrPC / Section 483 BNSS",
        "description": "Bail application for person already in custody",
    },
    "436a_release": {
        "title": "Application for Release under Section 436A CrPC / Section 479 BNSS",
        "description": "Release of undertrial who has served half the maximum sentence",
    },
    "complaint_156_3": {
        "title": "Complaint under Section 156(3) CrPC / Section 175(3) BNSS",
        "description": "Application to Magistrate directing police to register FIR and investigate",
    },
    "sp_complaint": {
        "title": "Complaint to Superintendent of Police",
        "description": "Written complaint to SP when SHO refuses to register FIR",
    },
    "nhrc_complaint": {
        "title": "Complaint to National Human Rights Commission",
        "description": "Complaint regarding violation of human rights by public servants",
    },
    "quashing_482": {
        "title": "Petition for Quashing under Section 482 CrPC / Section 528 BNSS",
        "description": "Petition to High Court to quash FIR or criminal proceedings",
    },
}


def _draft_default_bail(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    arrest_date = details.get("arrest_date", "________")
    court_name = details.get("court_name", "________")
    fir_number = details.get("fir_number", "________")
    police_station = details.get("police_station", "________")

    return f"""IN THE COURT OF {court_name.upper()}

CRIMINAL MISC. APPLICATION NO. _______ OF {datetime.now().year}

IN THE MATTER OF:

{accused}                                             ... Applicant/Accused
        Versus
State (Through {police_station})                      ... Respondent

FIR No.: {fir_number}
Police Station: {police_station}
Under Sections: {sections}

APPLICATION FOR GRANT OF DEFAULT BAIL UNDER SECTION 167(2)
OF THE CODE OF CRIMINAL PROCEDURE, 1973
(Corresponding to Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

MOST RESPECTFULLY SHOWETH:

1. That the applicant {accused} was arrested on {arrest_date} in connection with
   FIR No. {fir_number} registered at Police Station {police_station} under
   Sections {sections}.

2. That the applicant has been in judicial custody since {arrest_date} and more
   than 90 days / 60 days (as applicable) have elapsed since the date of arrest.

3. That the Investigating Officer has FAILED to file the chargesheet/final report
   under Section 173 CrPC within the statutory period prescribed under Section
   167(2) of the Code of Criminal Procedure, 1973.

4. That as per the law laid down by the Hon'ble Supreme Court in the following
   landmark judgments, the right to default bail is an INDEFEASIBLE RIGHT:

   a) Sayed Mohamed Ahmed Kazmi v. State (GNCTD) (2012) 12 SCC 1:
      "The right to default bail under Section 167(2) is an indefeasible right
      and is not merely a statutory right but a fundamental right flowing from
      Article 21 of the Constitution."

   b) Rakesh Kumar Paul v. State of Assam (2017) 15 SCC 67:
      "Once the period of 60/90 days expires without a chargesheet being filed,
      the accused acquires an indefeasible right to default bail."

   c) M. Ravindran v. Directorate of Revenue Intelligence (2021) 2 SCC 485:
      "Default bail is a right, not a concession. The indefeasible right accrues
      the moment the stipulated period expires without filing of the chargesheet."

   d) Bikramjit Singh v. State of Punjab (2020) 10 SCC 616:
      "The right to default bail continues to be enforceable even if the
      chargesheet is filed after the statutory period, provided the accused has
      already applied for or is willing to furnish bail."

5. That the maximum punishment for the offenses alleged is _______ years, and
   accordingly the statutory period for filing chargesheet is:
   - 90 days (for offenses punishable with death, imprisonment for life, or
     imprisonment for not less than 10 years)
   - 60 days (for all other offenses)

6. That the applicant is ready and willing to furnish bail bond/surety as may be
   directed by this Hon'ble Court.

7. That the applicant undertakes to:
   a) Not tamper with evidence or influence witnesses
   b) Appear before the court on every date of hearing
   c) Not leave the jurisdiction without permission of the court
   d) Cooperate with the investigation

PRAYER:

In view of the above facts and circumstances, it is most respectfully prayed
that this Hon'ble Court may graciously be pleased to:

(a) Release the applicant {accused} on default bail under Section 167(2) CrPC
    on such terms and conditions as this Hon'ble Court may deem fit and proper;

(b) Pass any other order as this Hon'ble Court may deem fit in the interest
    of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

VERIFICATION:
I, {accused}, do hereby verify that the contents of the above application are
true and correct to the best of my knowledge and belief.

Verified at _______ on this _______ day of _______ {datetime.now().year}.

                                                    _________________________
                                                    {accused}
                                                    (Applicant/Accused)

Through:
_________________________
Advocate for the Applicant
Enrollment No.: _________
"""


def _draft_anticipatory_bail(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    court_name = details.get("court_name", "________")
    fir_number = details.get("fir_number", "________")
    police_station = details.get("police_station", "________")
    incident_description = details.get("incident_description", "________")

    return f"""IN THE COURT OF {court_name.upper()}

CRIMINAL MISC. (ANTICIPATORY BAIL) APPLICATION NO. _______ OF {datetime.now().year}

IN THE MATTER OF:

{accused}                                             ... Applicant
        Versus
State (Through {police_station})                      ... Respondent

FIR No.: {fir_number}
Police Station: {police_station}
Under Sections: {sections}

APPLICATION FOR ANTICIPATORY BAIL UNDER SECTION 438 OF THE CODE OF
CRIMINAL PROCEDURE, 1973
(Corresponding to Section 482 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

MOST RESPECTFULLY SHOWETH:

1. That the applicant {accused} apprehends arrest in connection with FIR No.
   {fir_number} registered at Police Station {police_station} under Sections
   {sections}.

2. BRIEF FACTS:
   {incident_description}

3. That the applicant is innocent and has been falsely implicated in this case.
   The applicant apprehends that the police may arrest him/her despite having no
   evidence of involvement in the alleged offense.

4. GROUNDS FOR ANTICIPATORY BAIL:

   a) The applicant has no criminal antecedents and is a law-abiding citizen.

   b) The allegations are vague, unsubstantiated, and appear to be motivated
      by personal enmity / extraneous considerations.

   c) The applicant is not a flight risk and has deep roots in the community,
      being a permanent resident of _______.

   d) The applicant has no intention to tamper with evidence or influence
      witnesses. The investigation can be completed without the custody of
      the applicant.

   e) Custodial interrogation is not required as the applicant is ready and
      willing to cooperate with the investigation and join the investigation
      as and when required.

   f) The applicant is the sole breadwinner of the family and arrest would
      cause irreparable hardship to the family.

5. RELEVANT PRECEDENTS:

   a) Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1:
      "Anticipatory bail should be granted when the court is prima facie
      satisfied that the applicant has reason to believe that he may be
      arrested on an accusation of having committed a non-bailable offense."

   b) Siddharam Satlingappa Mhetre v. State of Maharashtra (2011) 1 SCC 694:
      "The following factors to be considered: nature and gravity of accusation,
      antecedents of applicant, possibility of fleeing from justice, and
      whether the accusation is made with the object of injuring or
      humiliating the applicant."

   c) Arnesh Kumar v. State of Bihar (2014) 8 SCC 273:
      "Arrest should be the last resort. For offenses punishable with
      imprisonment up to 7 years, police must be satisfied that arrest is
      necessary under Section 41(1)(b)(ii) CrPC."

6. That the applicant undertakes to:
   a) Cooperate with the investigation and appear before the IO as and when called
   b) Not leave India without permission of the court
   c) Not directly or indirectly make any inducement, threat, or promise to
      any person acquainted with the facts of the case
   d) Furnish bail bond/surety as directed by the court

PRAYER:

In view of the above submissions, it is most respectfully prayed that this
Hon'ble Court may graciously be pleased to:

(a) Grant anticipatory bail to the applicant in the event of arrest in
    connection with FIR No. {fir_number};

(b) Direct that in case of arrest, the applicant shall be released on bail
    on such terms and conditions as this Court may deem fit;

(c) Pass any other order as this Hon'ble Court may deem fit in the interest
    of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

                                                    _________________________
                                                    {accused}
                                                    (Applicant)

Through:
_________________________
Advocate for the Applicant
Enrollment No.: _________

Date: _________
Place: _________
"""


def _draft_regular_bail(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    arrest_date = details.get("arrest_date", "________")
    court_name = details.get("court_name", "________")
    fir_number = details.get("fir_number", "________")
    police_station = details.get("police_station", "________")

    return f"""IN THE COURT OF {court_name.upper()}

CRIMINAL MISC. (BAIL) APPLICATION NO. _______ OF {datetime.now().year}

IN THE MATTER OF:

{accused}                                             ... Applicant/Accused
        Versus
State (Through {police_station})                      ... Respondent

FIR No.: {fir_number}
Police Station: {police_station}
Under Sections: {sections}

APPLICATION FOR GRANT OF REGULAR BAIL UNDER SECTION 439 OF THE CODE OF
CRIMINAL PROCEDURE, 1973
(Corresponding to Section 483 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

MOST RESPECTFULLY SHOWETH:

1. That the applicant {accused} has been in judicial custody since {arrest_date}
   in connection with FIR No. {fir_number} registered at Police Station
   {police_station} under Sections {sections}.

2. That the applicant is innocent and has been falsely implicated in this case.

3. GROUNDS FOR BAIL:

   a) The applicant has been languishing in jail since {arrest_date} and the
      trial is likely to take a long time. The Hon'ble Supreme Court has
      repeatedly held that "bail is the rule, jail is the exception."
      - State of Rajasthan v. Balchand (1977) 4 SCC 308

   b) The investigation is complete and the chargesheet has already been filed.
      The applicant's continued incarceration is not necessary for the purpose
      of investigation.

   c) The applicant has no criminal antecedents and is not a habitual offender.

   d) There is no likelihood of the applicant fleeing from justice. The
      applicant has permanent roots in the community and is willing to furnish
      substantial surety.

   e) There is no apprehension of the applicant tampering with evidence or
      influencing witnesses, as the witnesses have already been examined or
      their statements have been recorded.

   f) The applicant is the sole breadwinner of the family and his/her continued
      detention is causing severe hardship to the family.

   g) The applicant is suffering from _______ (medical condition, if applicable)
      and requires medical attention which is not available in jail.

4. RELEVANT PRECEDENTS:

   a) Satender Kumar Antil v. CBI (2022) 10 SCC 51:
      "Courts must exercise the power to grant bail keeping in mind the
      fundamental principle that bail is the rule and refusal is the exception."

   b) Dataram Singh v. State of UP (2018) 3 SCC 22:
      "The gravity of the offense alone cannot be the basis for refusal of bail."

   c) Sanjay Chandra v. CBI (2012) 1 SCC 40:
      "The purpose of bail is to secure the attendance of the accused at trial.
      If the accused is not likely to abscond or misuse liberty, bail should
      be granted."

   d) P. Chidambaram v. Directorate of Enforcement (2019) 9 SCC 24:
      "The basic jurisprudence relating to bail is well-settled. The
      presumption of innocence is a facet of Article 21."

5. That the applicant is ready and willing to abide by any conditions that
   this Hon'ble Court may impose.

PRAYER:

It is most respectfully prayed that this Hon'ble Court may be pleased to:

(a) Grant regular bail to the applicant {accused} in FIR No. {fir_number}
    on such terms and conditions as this Hon'ble Court may deem fit;

(b) Pass any other order as deemed fit in the interest of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

                                                    _________________________
                                                    {accused}
                                                    (Applicant/Accused)

Through:
_________________________
Advocate for the Applicant
Enrollment No.: _________

Date: _________
Place: _________
"""


def _draft_436a_release(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    arrest_date = details.get("arrest_date", "________")
    court_name = details.get("court_name", "________")
    fir_number = details.get("fir_number", "________")
    police_station = details.get("police_station", "________")

    return f"""IN THE COURT OF {court_name.upper()}

CRIMINAL MISC. APPLICATION NO. _______ OF {datetime.now().year}

IN THE MATTER OF:

{accused}                                             ... Applicant/Accused
        Versus
State (Through {police_station})                      ... Respondent

FIR No.: {fir_number}
Police Station: {police_station}
Under Sections: {sections}

APPLICATION FOR RELEASE ON PERSONAL BOND UNDER SECTION 436A OF THE CODE OF
CRIMINAL PROCEDURE, 1973
(Corresponding to Section 479 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

MOST RESPECTFULLY SHOWETH:

1. That the applicant {accused} has been in judicial custody since {arrest_date}
   in connection with FIR No. {fir_number} registered at Police Station
   {police_station} under Sections {sections}.

2. That the applicant has been in custody for a period of _______ days/months/years,
   which is MORE THAN HALF of the maximum period of imprisonment prescribed for
   the offense(s) with which the applicant has been charged.

3. THE LAW - SECTION 436A CrPC:
   "Where a person has, during the period of investigation, inquiry or trial
   under this Code of an offence under any law (not being an offence for which
   the punishment of death has been specified as one of the punishments under
   that law) undergone detention for a period extending up to one-half of the
   maximum period of imprisonment specified for that offence under that law,
   he shall be released by the Court on his personal bond with or without
   sureties."

4. CALCULATION:
   - Date of arrest: {arrest_date}
   - Maximum punishment for Sections {sections}: _______ years
   - Half of maximum punishment: _______ years
   - Period already spent in custody: _______ years/months
   - Therefore, the applicant has served MORE THAN HALF the maximum sentence
     as an undertrial prisoner.

5. RELEVANT PRECEDENTS:

   a) Bhim Singh v. Union of India (2015) 13 SCC 605:
      "Section 436A is a beneficial provision aimed at ensuring that
      undertrials are not subjected to imprisonment beyond the period of
      punishment that could be imposed on conviction."

   b) Hussain v. Union of India (2017) -- Supreme Court directed all courts
      to implement Section 436A and identify eligible undertrials.

   c) In Re: Inhuman Conditions in 1382 Prisons (2016) -- Supreme Court
      appointed Under Trial Review Committees (UTRCs) to identify prisoners
      eligible for release under Section 436A.

6. That the applicant is unable to afford bail/surety and prays for release
   on personal bond as mandated by Section 436A.

PRAYER:

It is most respectfully prayed that this Hon'ble Court may be pleased to:

(a) Release the applicant on personal bond under Section 436A CrPC, with or
    without sureties, as this Hon'ble Court may deem fit;

(b) In the alternative, release the applicant on personal bond without
    monetary surety in view of his/her indigent status;

(c) Pass any other order as deemed fit in the interest of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

                                                    _________________________
                                                    {accused}
                                                    (Applicant/Accused)

Through:
_________________________
Advocate for the Applicant
Enrollment No.: _________
"""


def _draft_complaint_156_3(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    court_name = details.get("court_name", "________")
    police_station = details.get("police_station", "________")
    incident_description = details.get("incident_description", "________")

    return f"""IN THE COURT OF {court_name.upper()}

COMPLAINT CASE NO. _______ OF {datetime.now().year}

IN THE MATTER OF:

_______ (Complainant Name)                            ... Complainant
        Versus
{accused}                                             ... Accused

APPLICATION UNDER SECTION 156(3) OF THE CODE OF CRIMINAL PROCEDURE, 1973
(Corresponding to Section 175(3) of the Bharatiya Nagarik Suraksha Sanhita, 2023)

FOR DIRECTION TO REGISTER FIR AND INVESTIGATE

MOST RESPECTFULLY SHOWETH:

1. That the complainant is a law-abiding citizen residing at _______ and is
   filing this complaint seeking direction from this Hon'ble Court to the
   Station House Officer, Police Station {police_station}, to register an
   FIR and investigate the offenses committed by the accused.

2. BRIEF FACTS OF THE CASE:
   {incident_description}

3. That the offenses disclosed are punishable under Sections {sections} of the
   Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023, which are
   COGNIZABLE offenses.

4. That the complainant approached Police Station {police_station} on _______
   (date) and requested registration of an FIR. However, the Station House
   Officer/police officials REFUSED to register the FIR despite the complaint
   disclosing commission of cognizable offenses.

5. That the refusal of the police to register the FIR is in gross violation of:
   a) Section 154 CrPC (mandatory duty to register FIR for cognizable offenses)
   b) The directions of the Hon'ble Supreme Court in Lalita Kumari v. State of
      UP (2014) 2 SCC 1, which categorically held that registration of FIR is
      MANDATORY when information discloses commission of a cognizable offense.

6. RELEVANT PRECEDENTS:

   a) Lalita Kumari v. State of UP (2014) 2 SCC 1:
      "Registration of FIR is mandatory under Section 154 of the Code, if the
      information discloses commission of a cognizable offence and no
      preliminary inquiry is permissible in such a situation."

   b) Priyanka Srivastava v. State of UP (2015) 6 SCC 287:
      "While entertaining a complaint under Section 156(3), the Magistrate
      must apply judicial mind and should not act as a post office."

   c) Sakiri Vasu v. State of UP (2008) 2 SCC 409:
      "If a complaint is made to the Magistrate under Section 156(3) CrPC,
      the Magistrate can direct the FIR to be registered and also can direct
      proper investigation to be made."

7. That the complainant has no other efficacious remedy and is constrained
   to approach this Hon'ble Court.

PRAYER:

It is most respectfully prayed that this Hon'ble Court may be pleased to:

(a) Direct the Station House Officer, Police Station {police_station}, to
    register an FIR under Sections {sections} and investigate the matter;

(b) Direct the Investigating Officer to submit the investigation report
    within a reasonable time;

(c) Pass any other order as this Hon'ble Court may deem fit in the interest
    of justice.

AND FOR THIS ACT OF KINDNESS, THE COMPLAINANT SHALL EVER PRAY.

VERIFICATION:
I, _______, the complainant above-named, do hereby verify that the contents
of this complaint are true and correct to the best of my knowledge and belief.

Verified at _______ on this _______ day of _______ {datetime.now().year}.

                                                    _________________________
                                                    Complainant

Through:
_________________________
Advocate for the Complainant
Enrollment No.: _________

LIST OF DOCUMENTS:
1. Copy of written complaint submitted to police station (dated _______)
2. Acknowledgment receipt from police station (if any)
3. Any supporting evidence/documents
"""


def _draft_sp_complaint(details: Dict) -> str:
    police_station = details.get("police_station", "________")
    incident_description = details.get("incident_description", "________")
    sections = details.get("sections", "________")

    return f"""To,
The Superintendent of Police,
_______ District,
_______ State

Date: {datetime.now().strftime("%d-%m-%Y")}

Subject: Complaint regarding refusal to register FIR by SHO, Police Station
{police_station} -- Request for action under Section 154(3) CrPC

Respected Sir/Madam,

I, _______ (Name), S/o / D/o / W/o _______,
aged _______ years,
R/o _______ (Full Address),
Contact: _______ (Phone), _______ (Email)

do hereby submit this complaint under Section 154(3) of the Code of Criminal
Procedure, 1973 (corresponding to Section 173(4) BNSS, 2023), regarding the
refusal of the Station House Officer, Police Station {police_station}, to
register a First Information Report.

FACTS:

1. On _______ (date), the following incident occurred:
   {incident_description}

2. The above incident constitutes offenses punishable under Sections {sections}
   of the Indian Penal Code / Bharatiya Nyaya Sanhita, which are COGNIZABLE
   offenses requiring mandatory registration of FIR.

3. On _______ (date), I visited Police Station {police_station} and requested
   the SHO/Duty Officer to register an FIR. However, the SHO/Duty Officer
   REFUSED to register the FIR on the following grounds:
   (a) _______
   (b) _______

4. The refusal is in direct violation of:
   - Section 154 CrPC which mandates registration of FIR for cognizable offenses
   - The Supreme Court judgment in Lalita Kumari v. State of UP (2014) 2 SCC 1
   - Section 166A IPC which makes refusal to register FIR a punishable offense

REQUEST:

Under Section 154(3) CrPC, you are empowered to investigate the case yourself
or direct any subordinate officer to investigate. I therefore request you to:

1. Direct the SHO, Police Station {police_station}, to immediately register
   an FIR in the matter;

2. Order a proper and fair investigation;

3. Take departmental action against the erring officer who refused to register
   the FIR in violation of law.

If no action is taken within a reasonable time, I shall be constrained to:
- File a complaint under Section 156(3) CrPC before the Judicial Magistrate
- Approach the State Human Rights Commission
- File a writ petition before the Hon'ble High Court

I am enclosing herewith:
1. Copy of my written complaint submitted to Police Station {police_station}
2. Acknowledgment receipt (if received)
3. Supporting documents/evidence

Thanking you,

Yours faithfully,

_________________________
(Name)
_________________________
(Signature)
_________________________
(Address)

CC:
1. Director General of Police, _______ State
2. State Human Rights Commission
"""


def _draft_nhrc_complaint(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    incident_description = details.get("incident_description", "________")
    police_station = details.get("police_station", "________")

    return f"""NATIONAL HUMAN RIGHTS COMMISSION
Manav Adhikar Bhawan, Block-C, GPO Complex, INA, New Delhi - 110023

COMPLAINT FORM

Date: {datetime.now().strftime("%d-%m-%Y")}

1. COMPLAINANT DETAILS:
   Name: _______
   Father's/Husband's Name: _______
   Address: _______
   District: _______
   State: _______
   Pin Code: _______
   Phone: _______
   Email: _______

2. COMPLAINT AGAINST (Public Servant / Authority):
   Name & Designation: {accused}
   Department: _______
   Police Station: {police_station}
   Address: _______
   District: _______
   State: _______

3. DETAILS OF HUMAN RIGHTS VIOLATION:

   a) Date of Incident: _______
   b) Place of Incident: _______
   c) Nature of Violation: (tick applicable)
      [ ] Custodial death
      [ ] Custodial torture / ill-treatment
      [ ] Illegal detention / arrest
      [ ] Refusal to register FIR
      [ ] Encounter killing
      [ ] Disappearance
      [ ] Police inaction
      [ ] Other: _______

4. DETAILED DESCRIPTION OF THE INCIDENT:

   {incident_description}

5. HAVE YOU APPROACHED ANY OTHER AUTHORITY?
   [ ] Yes  [ ] No

   If yes, provide details:
   Authority approached: _______
   Date: _______
   Action taken (if any): _______
   Reference number: _______

6. IS THE MATTER PENDING BEFORE ANY COURT?
   [ ] Yes  [ ] No

   If yes, provide details:
   Court: _______
   Case Number: _______

7. RELIEF SOUGHT:
   a) Investigation into the human rights violation
   b) Compensation of Rs. _______ for the victim/family
   c) Disciplinary action against the erring officials
   d) Direction to the concerned authority to _______
   e) Any other relief: _______

8. LIST OF DOCUMENTS ENCLOSED:
   1. _______
   2. _______
   3. _______

9. DECLARATION:
   I, _______, hereby declare that the information given above is true and
   correct to the best of my knowledge and belief. I understand that if any
   information is found to be false, I may be liable for appropriate action.

   I also declare that the matter is not pending before any other Commission
   (State Human Rights Commission / National Commission for Women /
   National Commission for Scheduled Castes / National Commission for
   Scheduled Tribes / any other Commission).

                                                    _________________________
                                                    (Signature of Complainant)
                                                    Name: _______
                                                    Date: {datetime.now().strftime("%d-%m-%Y")}

NOTE:
- Complaints must be filed within ONE YEAR of the incident
- Anonymous complaints are not entertained
- Complaints regarding events older than one year may be entertained in
  exceptional circumstances
- NHRC does not inquire into matters pending before State HRC
- You can also file online at nhrc.nic.in or call 14433
"""


def _draft_quashing_482(details: Dict) -> str:
    accused = details.get("accused_name", "________")
    sections = details.get("sections", "________")
    court_name = details.get("court_name", "________")
    fir_number = details.get("fir_number", "________")
    police_station = details.get("police_station", "________")
    incident_description = details.get("incident_description", "________")

    return f"""IN THE HIGH COURT OF _______

CRIMINAL MISC. PETITION NO. _______ OF {datetime.now().year}

(Under Section 482 of the Code of Criminal Procedure, 1973 /
Section 528 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

IN THE MATTER OF:

{accused}                                             ... Petitioner
        Versus
State of _______ & Anr.                               ... Respondent(s)

PETITION UNDER SECTION 482 CrPC FOR QUASHING OF FIR No. {fir_number}
REGISTERED AT POLICE STATION {police_station.upper()} UNDER SECTIONS {sections}

MOST RESPECTFULLY SHOWETH:

1. That the petitioner {accused} is filing this petition under Section 482 of
   the Code of Criminal Procedure, 1973 (inherent powers of the High Court),
   seeking quashing of FIR No. {fir_number} dated _______, registered at
   Police Station {police_station} under Sections {sections}.

2. BRIEF FACTS:
   {incident_description}

3. GROUNDS FOR QUASHING:

   A. NO OFFENSE DISCLOSED:
      The FIR, even if taken at face value and accepted in entirety, does not
      disclose the commission of any offense under Sections {sections}. The
      essential ingredients of the alleged offense(s) are completely absent.

   B. ABUSE OF PROCESS OF LAW:
      The FIR has been lodged with the sole purpose of harassing and
      humiliating the petitioner. The proceedings are manifestly attended
      with mala fide and are nothing but an abuse of the process of law.

   C. CIVIL DISPUTE GIVEN CRIMINAL COLOR:
      The dispute between the parties is essentially civil in nature, and the
      respondent has given it a criminal color by invoking criminal provisions.
      The Hon'ble Supreme Court has repeatedly deprecated such practice.

   D. SETTLEMENT BETWEEN PARTIES (if applicable):
      The parties have amicably settled their disputes. Continuing criminal
      proceedings would be an exercise in futility and would burden the
      already overburdened criminal justice system.

4. RELEVANT PRECEDENTS:

   a) State of Haryana v. Bhajan Lal (1992) Supp (1) SCC 335:
      The Supreme Court laid down the following categories where Section 482
      can be invoked:
      i)   Where the allegations do not prima facie constitute any offense
      ii)  Where the allegations are absurd and improbable
      iii) Where there is an express legal bar to the institution of proceedings
      iv)  Where the criminal proceeding is manifestly mala fide
      v)   Where proceedings amount to abuse of process of court

   b) Parbatbhai Aahir v. State of Gujarat (2017) 9 SCC 641:
      "High Courts should ordinarily accept the settlement and quash
      proceedings in cases which predominantly involve a civil dispute
      which has been given a criminal color."

   c) Gian Singh v. State of Punjab (2012) 10 SCC 303:
      "Power of High Court under Section 482 CrPC is wide enough to quash
      criminal proceedings in appropriate cases to prevent abuse of process
      and to secure ends of justice."

   d) Neeharika Infrastructure Pvt. Ltd. v. State of Maharashtra (2021)
      SCC Online SC 315:
      Reaffirmed the guidelines for exercise of power under Section 482.

5. That continuation of the impugned proceedings would result in grave
   miscarriage of justice and would amount to abuse of the process of law.

PRAYER:

It is most respectfully prayed that this Hon'ble Court may be pleased to:

(a) QUASH FIR No. {fir_number} dated _______ registered at Police Station
    {police_station} under Sections {sections} and all consequent proceedings;

(b) STAY the investigation/arrest of the petitioner during the pendency
    of this petition;

(c) Pass any other order as this Hon'ble Court may deem fit in the interest
    of justice.

AND FOR THIS ACT OF KINDNESS, THE PETITIONER SHALL EVER PRAY.

                                                    _________________________
                                                    {accused}
                                                    (Petitioner)

Through:
_________________________
Advocate for the Petitioner
Enrollment No.: _________
High Court of _______

VERIFICATION:
I, {accused}, the petitioner above-named, do hereby verify that the contents
of this petition are true and correct to the best of my knowledge and belief
and nothing material has been concealed therefrom.

Verified at _______ on this _______ day of _______ {datetime.now().year}.

                                                    _________________________
                                                    Petitioner

LIST OF DATES AND EVENTS:
(Chronological summary of relevant dates to be appended)
"""


DRAFTER_FUNCTIONS = {
    "default_bail": _draft_default_bail,
    "anticipatory_bail": _draft_anticipatory_bail,
    "regular_bail": _draft_regular_bail,
    "436a_release": _draft_436a_release,
    "complaint_156_3": _draft_complaint_156_3,
    "sp_complaint": _draft_sp_complaint,
    "nhrc_complaint": _draft_nhrc_complaint,
    "quashing_482": _draft_quashing_482,
}


@router.post("/draft-document")
def draft_document(data: dict):
    """
    Generate a legal document template based on document type and case details.
    Supports: default_bail, anticipatory_bail, regular_bail, 436a_release,
    complaint_156_3, sp_complaint, nhrc_complaint, quashing_482.
    """
    document_type = data.get("document_type", "").strip()
    if not document_type:
        return {
            "error": "Provide 'document_type'",
            "available_types": list(DOCUMENT_TEMPLATES.keys()),
        }

    if document_type not in DOCUMENT_TEMPLATES:
        return {
            "error": f"Unknown document type: '{document_type}'",
            "available_types": list(DOCUMENT_TEMPLATES.keys()),
        }

    drafter_fn = DRAFTER_FUNCTIONS[document_type]
    template_info = DOCUMENT_TEMPLATES[document_type]
    document_text = drafter_fn(data)

    return {
        "document_type": document_type,
        "title": template_info["title"],
        "description": template_info["description"],
        "document": document_text,
        "instructions": [
            "Replace all blanks (________) with actual details",
            "Have a qualified advocate review the document before filing",
            "Ensure all dates, names, and section numbers are accurate",
            "Attach supporting documents as required",
            "File the appropriate number of copies as per court rules",
        ],
        "disclaimer": "This is a template for informational purposes only. It does not constitute "
                       "legal advice. Please consult a qualified advocate before filing any legal document.",
    }


# ============ DOCUMENT EXPLAINER ============

def _analyze_document_keywords(text: str) -> Dict:
    """Analyze a legal document based on keywords to generate a smart mock explanation."""
    text_lower = text.lower()

    # Detect document type
    doc_type = "Unknown Legal Document"
    if any(kw in text_lower for kw in ["bail", "release", "custody", "remand"]):
        doc_type = "Bail / Custody Order"
    elif any(kw in text_lower for kw in ["judgment", "convicted", "acquitted", "sentence"]):
        doc_type = "Court Judgment"
    elif any(kw in text_lower for kw in ["fir", "first information report", "complaint"]):
        doc_type = "FIR / Police Complaint"
    elif any(kw in text_lower for kw in ["chargesheet", "charge sheet", "final report"]):
        doc_type = "Chargesheet"
    elif any(kw in text_lower for kw in ["summon", "notice", "appear"]):
        doc_type = "Court Summons / Notice"
    elif any(kw in text_lower for kw in ["appeal", "appellate", "revision"]):
        doc_type = "Appeal / Revision Order"
    elif any(kw in text_lower for kw in ["anticipatory bail", "section 438"]):
        doc_type = "Anticipatory Bail Order"
    elif any(kw in text_lower for kw in ["quash", "482", "528"]):
        doc_type = "Quashing Order"
    elif any(kw in text_lower for kw in ["stay", "injunction", "restrain"]):
        doc_type = "Stay / Injunction Order"
    elif any(kw in text_lower for kw in ["warrant", "nbw", "non-bailable warrant"]):
        doc_type = "Arrest Warrant"

    # Detect outcome
    outcome = "Pending / Unclear"
    if any(kw in text_lower for kw in ["granted", "allowed", "accepted", "bail is granted"]):
        outcome = "Favorable (Granted / Allowed)"
    elif any(kw in text_lower for kw in ["dismissed", "rejected", "denied", "refused"]):
        outcome = "Unfavorable (Dismissed / Rejected)"
    elif "acquitted" in text_lower:
        outcome = "Acquittal -- the accused has been found not guilty"
    elif "convicted" in text_lower:
        outcome = "Conviction -- the accused has been found guilty"
    elif any(kw in text_lower for kw in ["adjourned", "next date", "listed for"]):
        outcome = "Adjourned to next date"

    # Detect sections mentioned
    ipc_sections = re.findall(r'section\s+(\d+[A-Za-z]?)\s+(?:of\s+)?(?:ipc|indian penal code|bnss|bns)', text_lower)
    crpc_sections = re.findall(r'section\s+(\d+[A-Za-z]?(?:\(\d+\))?)\s+(?:of\s+)?(?:crpc|cr\.p\.c|code of criminal procedure)', text_lower)

    # Detect dates
    dates_found = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text)
    dates_found += re.findall(r'\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}', text, re.IGNORECASE)

    # Detect monetary amounts
    amounts = re.findall(r'Rs\.?\s*[\d,]+(?:\.\d{2})?', text, re.IGNORECASE)
    amounts += re.findall(r'INR\s*[\d,]+(?:\.\d{2})?', text, re.IGNORECASE)

    # Detect conditions
    conditions = []
    if any(kw in text_lower for kw in ["shall not leave", "not leave the jurisdiction", "surrender passport"]):
        conditions.append("Travel restrictions -- must not leave the jurisdiction or surrender passport")
    if any(kw in text_lower for kw in ["report to police", "mark attendance", "mark presence"]):
        conditions.append("Must report to police station at specified intervals")
    if any(kw in text_lower for kw in ["surety", "bail bond", "personal bond"]):
        conditions.append("Must furnish bail bond / surety as specified")
    if any(kw in text_lower for kw in ["shall not tamper", "not contact", "not influence"]):
        conditions.append("Must not tamper with evidence or contact witnesses")
    if any(kw in text_lower for kw in ["next date", "next hearing"]):
        conditions.append("Must appear on the next date of hearing")

    # Detect urgency
    deadlines = []
    if "days" in text_lower:
        day_refs = re.findall(r'(\d+)\s+days', text_lower)
        for d in day_refs:
            deadlines.append(f"Action required within {d} days as mentioned in the order")
    if any(kw in text_lower for kw in ["forthwith", "immediately", "within 24 hours"]):
        deadlines.append("URGENT: Immediate action required as per the order")

    return {
        "doc_type": doc_type,
        "outcome": outcome,
        "ipc_sections": ipc_sections,
        "crpc_sections": crpc_sections,
        "dates_found": dates_found,
        "amounts": amounts,
        "conditions": conditions,
        "deadlines": deadlines,
    }


@router.post("/explain-document")
def explain_document(data: dict):
    """
    Explain a court order or legal document in plain language.
    Analyzes the text for keywords to provide smart, context-aware explanations.
    """
    text = data.get("text", "").strip()
    if not text:
        return {"error": "Provide 'text' containing the court order or legal document content"}

    if len(text) < 20:
        return {"error": "Text too short. Please paste the full document or a substantial portion."}

    analysis = _analyze_document_keywords(text)

    # Build plain language explanation
    explanation_parts = []
    explanation_parts.append(f"This appears to be a **{analysis['doc_type']}**.")
    explanation_parts.append(f"The outcome/status is: **{analysis['outcome']}**.")

    if analysis["ipc_sections"]:
        explanation_parts.append(
            f"IPC/BNS Sections mentioned: {', '.join(set(analysis['ipc_sections']))}. "
            "These are the criminal provisions under which charges have been filed."
        )

    if analysis["amounts"]:
        explanation_parts.append(
            f"Monetary amounts mentioned: {', '.join(analysis['amounts'])}. "
            "This could be bail amount, surety, fine, or compensation."
        )

    plain_explanation = " ".join(explanation_parts)

    # Key takeaways
    key_takeaways = []
    key_takeaways.append({
        "point": f"Document Type: {analysis['doc_type']}",
        "explanation": "This determines what rights and obligations apply to you.",
    })
    key_takeaways.append({
        "point": f"Result: {analysis['outcome']}",
        "explanation": "This is the main decision/direction in the document.",
    })

    if analysis["conditions"]:
        key_takeaways.append({
            "point": "Conditions Imposed",
            "explanation": "; ".join(analysis["conditions"]),
        })

    if analysis["dates_found"]:
        key_takeaways.append({
            "point": f"Important Dates: {', '.join(analysis['dates_found'][:5])}",
            "explanation": "Mark these dates in your calendar. Missing a court date can result in adverse orders.",
        })

    # What it means for you
    what_it_means = []
    if "Favorable" in analysis["outcome"]:
        what_it_means.append("The order appears to be in your favor. Ensure you comply with all conditions imposed.")
        what_it_means.append("The other party may challenge this order in a higher court, so stay prepared.")
    elif "Unfavorable" in analysis["outcome"]:
        what_it_means.append("The order appears to be against you. You should immediately consult your lawyer about filing an appeal.")
        what_it_means.append("There are usually time limits for filing appeals (30 days for High Court, 90 days for Supreme Court).")
    elif "Acquittal" in analysis["outcome"]:
        what_it_means.append("You have been acquitted (found not guilty). You are entitled to be released immediately if in custody.")
        what_it_means.append("Note: The prosecution/State can appeal against an acquittal.")
    elif "Conviction" in analysis["outcome"]:
        what_it_means.append("A conviction has been recorded. You should immediately apply for bail pending appeal (suspension of sentence).")
        what_it_means.append("File an appeal in the higher court within the prescribed limitation period.")
    else:
        what_it_means.append("The outcome is not entirely clear from the text. Consult your lawyer for proper interpretation.")

    # Next steps
    next_steps = [
        "Get a certified copy of this order from the court",
        "Discuss the order with your lawyer to understand full implications",
    ]
    if analysis["conditions"]:
        next_steps.append("Strictly comply with ALL conditions mentioned in the order")
    if analysis["deadlines"]:
        next_steps.extend(analysis["deadlines"])
    if "Unfavorable" in analysis["outcome"] or "Conviction" in analysis["outcome"]:
        next_steps.append("Consider filing an appeal in the appropriate higher court within the limitation period")
        next_steps.append("Apply for stay of the order / suspension of sentence if applicable")
    next_steps.append("Keep this order safely -- you may need it for future proceedings")

    return {
        "document_type_detected": analysis["doc_type"],
        "plain_language_explanation": plain_explanation,
        "key_takeaways": key_takeaways,
        "what_it_means": what_it_means,
        "conditions_to_follow": analysis["conditions"] if analysis["conditions"] else ["No specific conditions detected in the text"],
        "deadlines": analysis["deadlines"] if analysis["deadlines"] else ["No specific deadlines detected -- check with your lawyer"],
        "next_steps": next_steps,
        "sections_referenced": {
            "ipc_bns": list(set(analysis["ipc_sections"])),
            "crpc_bnss": list(set(analysis["crpc_sections"])),
        },
        "dates_mentioned": analysis["dates_found"][:10],
        "amounts_mentioned": analysis["amounts"],
        "disclaimer": "This is an automated analysis based on keyword detection. It is NOT legal advice. "
                       "Please consult a qualified advocate for authoritative interpretation of any legal document.",
    }


# ============ CASE STATUS TRACKER ============

CASE_LIFECYCLE_STAGES = [
    {
        "stage": "FIR Filed",
        "description": "First Information Report registered at the police station",
        "typical_duration": "1 day",
        "legal_basis": "Section 154 CrPC / Section 173 BNSS",
        "what_happens": "Police record the complaint and begin investigation. An FIR number is assigned.",
    },
    {
        "stage": "Investigation",
        "description": "Police investigate the matter, collect evidence, record statements",
        "typical_duration": "60-90 days (statutory limit for chargesheet)",
        "legal_basis": "Section 156-173 CrPC / Section 175-193 BNSS",
        "what_happens": "Police visit the crime scene, collect forensic evidence, record witness statements "
                        "under Section 161 CrPC, arrest suspects, and conduct identification proceedings.",
    },
    {
        "stage": "Chargesheet Filed",
        "description": "Police submit final report (chargesheet) to the Magistrate",
        "typical_duration": "Must be within 60 days (general) or 90 days (serious offenses) of arrest",
        "legal_basis": "Section 173 CrPC / Section 193 BNSS",
        "what_happens": "Police file a final report detailing the investigation findings, evidence collected, "
                        "witness list, and sections of law applicable. If no evidence found, a closure report is filed.",
    },
    {
        "stage": "Cognizance",
        "description": "Magistrate takes judicial notice of the offense",
        "typical_duration": "1-4 weeks after chargesheet",
        "legal_basis": "Section 190 CrPC / Section 210 BNSS",
        "what_happens": "The Magistrate examines the chargesheet and supporting documents. If satisfied that an "
                        "offense is made out, issues process (summons or warrant) to the accused.",
    },
    {
        "stage": "Charge Framing",
        "description": "Formal charges are read out to the accused",
        "typical_duration": "2-6 months after cognizance",
        "legal_basis": "Section 228/240 CrPC / Section 251/262 BNSS",
        "what_happens": "The court frames formal charges based on the chargesheet. The accused is asked whether "
                        "they plead guilty or not guilty. If not guilty, trial proceeds. The accused can also "
                        "file a discharge application at this stage.",
    },
    {
        "stage": "Prosecution Evidence",
        "description": "Prosecution presents witnesses and documentary evidence",
        "typical_duration": "6-24 months (often the longest phase)",
        "legal_basis": "Section 231-237 CrPC / Section 254-260 BNSS",
        "what_happens": "Prosecution witnesses (PW) are examined-in-chief and cross-examined by the defence. "
                        "Documentary evidence is exhibited. This is often the most time-consuming stage due to "
                        "witness availability, adjournments, and backlogs.",
        "common_bottleneck": True,
        "bottleneck_reasons": [
            "Witnesses not appearing despite summons",
            "Frequent adjournments sought by either party",
            "Court calendar congestion and backlog",
            "Transfer of judges leading to de novo proceedings",
            "Police witnesses (IO) not available for cross-examination",
        ],
    },
    {
        "stage": "Statement of Accused (Section 313)",
        "description": "Accused is questioned about incriminating evidence",
        "typical_duration": "1-2 hearings",
        "legal_basis": "Section 313 CrPC / Section 346 BNSS",
        "what_happens": "After prosecution evidence is complete, the court puts questions to the accused about "
                        "each incriminating circumstance. The accused can explain or deny. This is NOT cross-examination.",
    },
    {
        "stage": "Defence Evidence",
        "description": "Defence presents witnesses and evidence",
        "typical_duration": "2-6 months",
        "legal_basis": "Section 233 CrPC / Section 256 BNSS",
        "what_happens": "Defence witnesses (DW) are examined. The accused may also enter the witness box "
                        "(Section 315 CrPC). Documentary evidence in defence is presented.",
    },
    {
        "stage": "Final Arguments",
        "description": "Both sides present closing arguments",
        "typical_duration": "2-8 weeks",
        "legal_basis": "Section 234 CrPC / Section 257 BNSS",
        "what_happens": "Prosecution argues first, followed by defence. Both cite evidence, precedents, "
                        "and legal provisions. Written arguments may also be filed.",
    },
    {
        "stage": "Judgment",
        "description": "Court pronounces its verdict",
        "typical_duration": "1-4 weeks after final arguments (judgment reserved period)",
        "legal_basis": "Section 235/248 CrPC / Section 258/271 BNSS",
        "what_happens": "The court delivers its judgment -- either conviction or acquittal. If convicted, "
                        "the court hears arguments on sentencing and pronounces the sentence.",
    },
]


@router.get("/case-status/{case_id}")
def case_status_tracker(case_id: str):
    """
    Return mock case lifecycle data with timeline, current stage, durations, and bottleneck analysis.
    """
    # Generate deterministic mock data from case_id
    h = int(hashlib.md5(case_id.encode()).hexdigest(), 16)
    current_stage_idx = h % len(CASE_LIFECYCLE_STAGES)

    # Build timeline with dates
    base_date = datetime.now() - timedelta(days=365 + (h % 730))
    timeline = []
    cumulative_days = 0

    stage_durations_days = [1, 75, 1, 21, 90, 365, 7, 120, 45, 21]

    for i, stage_info in enumerate(CASE_LIFECYCLE_STAGES):
        if i <= current_stage_idx:
            stage_date = base_date + timedelta(days=cumulative_days)
            duration = stage_durations_days[i] + (h % 30)
            cumulative_days += duration
            timeline.append({
                "stage": stage_info["stage"],
                "date_reached": stage_date.strftime("%d-%m-%Y"),
                "status": "Completed" if i < current_stage_idx else "Current",
                "duration_spent": f"{duration} days",
                "description": stage_info["description"],
                "what_happens": stage_info["what_happens"],
                "legal_basis": stage_info["legal_basis"],
            })
        else:
            timeline.append({
                "stage": stage_info["stage"],
                "date_reached": None,
                "status": "Upcoming",
                "expected_duration": stage_info["typical_duration"],
                "description": stage_info["description"],
                "what_happens": stage_info["what_happens"],
                "legal_basis": stage_info["legal_basis"],
            })

    current_stage = CASE_LIFECYCLE_STAGES[current_stage_idx]

    # Bottleneck analysis
    bottlenecks = []
    if current_stage_idx >= 5:  # At or past prosecution evidence
        bottlenecks.append({
            "stage": "Prosecution Evidence",
            "issue": "This stage typically takes the longest in Indian courts",
            "average_duration": "6-24 months nationally",
            "reasons": [
                "Witness non-appearance and hostile witnesses",
                "Frequent adjournments",
                "Shortage of judicial officers",
                "Court backlog -- average pendency of 3-5 years in Sessions Courts",
            ],
        })

    if current_stage_idx <= 2:
        bottlenecks.append({
            "stage": "Investigation to Chargesheet",
            "issue": "If chargesheet not filed within statutory period, apply for default bail",
            "watch_for": "60-day limit (general offenses) or 90-day limit (serious offenses) from date of arrest",
        })

    # Estimated completion
    remaining_stages = len(CASE_LIFECYCLE_STAGES) - current_stage_idx - 1
    estimated_remaining_months = remaining_stages * 4

    # Statistics
    stats = {
        "average_criminal_case_duration_india": "3-7 years in trial courts",
        "supreme_court_pendency": "As of 2024, approximately 80,000 cases pending",
        "high_court_pendency": "Approximately 60 lakh cases pending across all High Courts",
        "district_court_pendency": "Approximately 4.4 crore cases pending across all district courts",
        "judge_to_population_ratio": "Approximately 21 judges per million population (recommended: 50 per million)",
    }

    return {
        "case_id": case_id,
        "current_stage": current_stage["stage"],
        "current_stage_description": current_stage["description"],
        "stages_completed": current_stage_idx,
        "total_stages": len(CASE_LIFECYCLE_STAGES),
        "progress_percentage": round((current_stage_idx / (len(CASE_LIFECYCLE_STAGES) - 1)) * 100, 1),
        "timeline": timeline,
        "estimated_remaining_time": f"Approximately {estimated_remaining_months} months (based on national averages)",
        "bottleneck_analysis": bottlenecks,
        "your_rights_at_this_stage": _get_next_steps(current_stage["stage"], "Criminal"),
        "indian_judiciary_statistics": stats,
        "tips": [
            "Attend every hearing to avoid adverse orders",
            "Keep a personal record of all hearing dates and orders",
            "If your case is delayed, you can file an application for expeditious trial",
            "Under Article 21, right to speedy trial is a fundamental right (Hussainara Khatoon v. State of Bihar, 1979)",
            "You can approach the High Court under Article 226/227 if trial court is causing undue delay",
        ],
        "disclaimer": "Case timelines are estimates based on national averages. Actual duration varies "
                       "significantly by court, state, case complexity, and other factors.",
    }


# ============ TRANSLATION ENDPOINT ============

# Hindi translations for common legal terms
_HINDI_LEGAL_TERMS: Dict[str, str] = {
    "bail": "zamanat",
    "fir": "pratham soochna report",
    "accused": "aaropee",
    "court": "adalat",
    "judge": "nyayadheesh",
    "police": "police",
    "arrest": "giraftaari",
    "lawyer": "vakeel",
    "complaint": "shikayat",
    "witness": "gawaah",
    "evidence": "saboot",
    "crime": "apradh",
    "sentence": "saza",
    "punishment": "dand",
    "rights": "adhikaar",
    "murder": "hatya",
    "theft": "chori",
    "fraud": "dhokha",
    "assault": "hamla",
    "victim": "peedit",
    "investigation": "jaanch",
    "chargesheet": "aarop patra",
    "magistrate": "nyayik magistrate",
    "petition": "yaachika",
    "appeal": "appeal",
    "hearing": "sunwai",
    "verdict": "faisla",
    "acquittal": "bari",
    "conviction": "saza",
    "custody": "hirasat",
    "remand": "remand",
    "surety": "zamanat-daar",
    "bond": "muchalka",
}

# Common Hindi phrase translations
_HINDI_PHRASES: Dict[str, str] = {
    "you have the right to remain silent": "aapko chup rehne ka adhikaar hai",
    "you have the right to a lawyer": "aapko vakeel ka adhikaar hai",
    "bail application": "zamanat avedan",
    "first information report": "pratham soochna report",
    "police station": "thana",
    "court order": "adalat ka aadesh",
    "bail is granted": "zamanat manzoor hui",
    "bail is rejected": "zamanat kharij hui",
    "file a complaint": "shikayat darj karein",
    "under arrest": "giraftaari mein",
    "not guilty": "nirdosh",
    "guilty": "doshi",
    "right to fair trial": "nyaaypoorn sunwai ka adhikaar",
    "fundamental rights": "maulik adhikaar",
    "legal aid": "vidhi sahayata",
    "free legal aid": "muft vidhi sahayata",
    "anticipatory bail": "agrim zamanat",
    "regular bail": "niyamit zamanat",
    "default bail": "vaidhanik zamanat",
    "non-bailable offense": "gair-zamaanatee apradh",
    "bailable offense": "zamaanatee apradh",
    "cognizable offense": "sangeyya apradh",
}

# Legal English formalization mappings
_LEGAL_ENGLISH_TERMS: Dict[str, str] = {
    "police must file fir": "It is incumbent upon the Station House Officer to register a First Information Report",
    "file a complaint": "lodge a formal complaint under the provisions of the Code of Criminal Procedure, 1973",
    "get bail": "seek release on bail under the applicable provisions of law",
    "go to court": "approach the competent court of jurisdiction",
    "get a lawyer": "engage the services of a legal practitioner duly enrolled under the Advocates Act, 1961",
    "arrested without reason": "apprehended without lawful authority or reasonable grounds as mandated under Section 41 CrPC",
    "can't be arrested": "arrest is impermissible without compliance with the procedural safeguards",
    "has to be released": "is entitled to be released forthwith in accordance with law",
    "police didn't help": "the law enforcement authorities failed to discharge their statutory obligations",
    "wrong charges": "erroneous or malafide charges have been levied",
    "false case": "a case founded on frivolous and vexatious allegations",
    "need bail": "an application for bail is necessitated in the facts and circumstances of the case",
    "bail hearing": "hearing of the bail application before the competent court",
    "bail conditions": "conditions imposed by the court for the grant of bail",
    "police complaint": "complaint registered with the jurisdictional police station",
    "court date": "the date fixed for hearing before the Honourable Court",
}

# Plain English simplification mappings
_PLAIN_ENGLISH_TERMS: Dict[str, str] = {
    "cognizable offense": "a crime where police can arrest without warrant",
    "cognizable offence": "a crime where police can arrest without warrant",
    "non-bailable": "bail is not automatic and requires court permission",
    "non-bailable offense": "a crime where bail is not automatic - you need the court to grant it",
    "non-bailable offence": "a crime where bail is not automatic - you need the court to grant it",
    "bailable offense": "a crime where you have the right to get bail from the police station itself",
    "bailable offence": "a crime where you have the right to get bail from the police station itself",
    "anticipatory bail": "bail you apply for before you are actually arrested",
    "default bail": "bail you are entitled to because police did not file chargesheet in time",
    "statutory bail": "bail you are entitled to because police did not file chargesheet in time",
    "chargesheet": "the formal document police file in court after completing their investigation",
    "remand": "when the court sends you to police or judicial custody for a specific period",
    "judicial custody": "being kept in jail under court's orders (not with police)",
    "police custody": "being kept with police for investigation purposes",
    "cognizance": "when the court formally takes notice of a crime and begins proceedings",
    "bail bond": "a written promise (sometimes with money) that you will appear in court when required",
    "surety": "a person who guarantees on your behalf that you will follow bail conditions",
    "first information report": "the first complaint registered at a police station about a crime (FIR)",
    "ex-parte": "a decision made by the court when one side is not present",
    "adjournment": "postponement of the hearing to a future date",
    "affidavit": "a written statement confirmed by oath for use as evidence in court",
    "summons": "an official order to appear in court on a specific date",
    "warrant": "a legal document issued by a judge authorizing police to arrest someone or search a place",
    "quashing": "when a higher court cancels or sets aside a case or FIR",
    "compounding": "when the victim and accused settle the matter and the case is closed",
    "plea bargaining": "when the accused agrees to plead guilty in exchange for a lighter punishment",
    "acquittal": "when the court declares the accused not guilty",
    "conviction": "when the court declares the accused guilty",
    "prima facie": "at first look, based on initial evidence",
    "habeas corpus": "a legal demand to bring a detained person before the court (used when someone is illegally held)",
    "mens rea": "criminal intent or guilty mind - the intention to commit a crime",
    "suo motu": "action taken by the court on its own, without anyone filing a case",
    "inter alia": "among other things",
    "locus standi": "the right to bring a case or appear in court",
    "ultra vires": "beyond one's legal power or authority",
    "res judicata": "a matter already decided by a court that cannot be raised again",
}


def _translate_to_hindi(text: str, context: Optional[str] = None) -> Dict:
    """Smart mock Hindi translation using term-by-term replacement and phrase matching."""
    translated = text

    # First try phrase-level matches (longer matches first)
    for phrase, hindi in sorted(_HINDI_PHRASES.items(), key=lambda x: -len(x[0])):
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        translated = pattern.sub(hindi, translated)

    # Then do word-level replacements for remaining terms
    for term, hindi in sorted(_HINDI_LEGAL_TERMS.items(), key=lambda x: -len(x[0])):
        pattern = re.compile(r'\b' + re.escape(term) + r'\b', re.IGNORECASE)
        translated = pattern.sub(hindi, translated)

    context_note = ""
    if context == "bail_application":
        context_note = " Context: Zamanat (bail) se sambandhit jaankari."
    elif context == "fir":
        context_note = " Context: Pratham Soochna Report (FIR) se sambandhit jaankari."
    elif context == "court_order":
        context_note = " Context: Adalat ke aadesh se sambandhit jaankari."
    elif context == "rights":
        context_note = " Context: Aapke kanuni adhikaar se sambandhit jaankari."

    return {
        "original": text,
        "translated": translated + context_note,
        "target_language": "hindi",
        "note": "This is an approximate Hindi translation. For official legal documents, please use a certified translator.",
        "terms_translated": {k: v for k, v in _HINDI_LEGAL_TERMS.items() if k.lower() in text.lower()},
    }


def _translate_to_legal_english(text: str, context: Optional[str] = None) -> Dict:
    """Convert plain language to formal legal English."""
    translated = text

    # Replace known phrases (longer matches first)
    for phrase, legal in sorted(_LEGAL_ENGLISH_TERMS.items(), key=lambda x: -len(x[0])):
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        translated = pattern.sub(legal, translated)

    # Add context-specific legal citations
    citations = []  # type: List[str]
    if context == "bail_application":
        citations = [
            "Sections 436-439 of CrPC (corresponding to Sections 478-483 of BNSS, 2023)",
            "Article 21 of the Constitution of India (Right to Life and Liberty)",
        ]
    elif context == "fir":
        citations = [
            "Section 154 of CrPC (corresponding to Section 173 of BNSS, 2023)",
            "Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1 - Mandatory registration of FIR",
        ]
    elif context == "court_order":
        citations = [
            "Section 362 of CrPC - Court not to alter judgement",
            "Order XX of CPC - Judgement and Decree",
        ]
    elif context == "rights":
        citations = [
            "Part III of the Constitution of India - Fundamental Rights",
            "D.K. Basu v. State of West Bengal (1997) - Guidelines on arrest",
        ]

    return {
        "original": text,
        "translated": translated,
        "target_language": "legal_english",
        "relevant_citations": citations,
        "note": "This is an automated conversion to formal legal language. Please have it reviewed by a qualified advocate before use in legal proceedings.",
    }


def _translate_to_plain_english(text: str, context: Optional[str] = None) -> Dict:
    """Convert legal jargon to simple, understandable language."""
    translated = text

    # Replace legal terms with plain language (longer matches first)
    for term, plain in sorted(_PLAIN_ENGLISH_TERMS.items(), key=lambda x: -len(x[0])):
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        translated = pattern.sub(plain, translated)

    # Add helpful context
    helpful_tips = []  # type: List[str]
    if context == "bail_application":
        helpful_tips = [
            "Bail means getting released from custody while your case is going on",
            "You usually need a lawyer to apply for bail, but you can also get free legal aid",
        ]
    elif context == "fir":
        helpful_tips = [
            "FIR is the first step in any criminal case - police MUST register it",
            "You can file FIR at any police station, not just the one in your area (Zero FIR)",
        ]
    elif context == "court_order":
        helpful_tips = [
            "A court order is a direction given by a judge that must be followed",
            "If you don't understand the order, ask your lawyer to explain it in simple terms",
        ]
    elif context == "rights":
        helpful_tips = [
            "You always have the right to know why you are being arrested",
            "You have the right to a lawyer - if you can't afford one, the government must provide one free",
        ]

    return {
        "original": text,
        "translated": translated,
        "target_language": "plain_english",
        "helpful_tips": helpful_tips,
        "note": "This is a simplified explanation. Legal terms can have specific technical meanings in different contexts.",
    }


@router.post("/translate")
async def translate_legal_text(data: dict):
    """
    Translate legal text between Hindi, legal English, and plain English.
    Uses AI (OpenRouter) when available, falls back to static word-mapping.
    """
    text = data.get("text", "").strip()
    target_language = data.get("target_language", "").strip().lower()
    context = data.get("context")  # type: Optional[str]

    if not text:
        return {"error": "Please provide 'text' to translate."}

    valid_languages = ["hindi", "legal_english", "plain_english"]
    if target_language not in valid_languages:
        return {"error": f"Invalid target_language. Must be one of: {', '.join(valid_languages)}"}

    valid_contexts = ["bail_application", "fir", "court_order", "rights", "general", None]
    if context and context not in valid_contexts:
        return {"error": f"Invalid context. Must be one of: bail_application, fir, court_order, rights, general"}

    if context == "general":
        context = None

    # Try AI translation first (if OpenRouter key is configured)
    ai_result = await ai_translate(text, target_language, context)
    if ai_result:
        return ai_result

    # Fallback to static translation
    if target_language == "hindi":
        return _translate_to_hindi(text, context)
    elif target_language == "legal_english":
        return _translate_to_legal_english(text, context)
    elif target_language == "plain_english":
        return _translate_to_plain_english(text, context)


# ============ ROLE-BASED RECOMMENDATIONS ENDPOINT ============

_ROLE_GUIDES: Dict[str, Dict] = {
    "citizen": {
        "recommended_tools": [
            {
                "name": "Know Your Rights",
                "path": "/tools/know-your-rights",
                "description": "Understand your fundamental and legal rights in any situation - arrest, police encounter, workplace, etc.",
            },
            {
                "name": "FIR Assistant",
                "path": "/tools/fir-assistant",
                "description": "Step-by-step help to file an FIR. Know what to include and what to expect.",
            },
            {
                "name": "Bail Calculator",
                "path": "/tools/bail-calculator",
                "description": "Check if you or a family member is eligible for bail based on the charges and time in custody.",
            },
            {
                "name": "Section Lookup",
                "path": "/tools/section-lookup",
                "description": "Understand what any IPC/BNS section means in simple language.",
            },
            {
                "name": "Legal Translator",
                "path": "/tools/translate",
                "description": "Convert confusing legal language into plain English or Hindi so you can understand your documents.",
            },
            {
                "name": "Case Timeline Tracker",
                "path": "/tools/case-timeline",
                "description": "Understand where your case stands and how long each stage typically takes.",
            },
        ],
        "quick_actions": [
            "Check my rights during a police encounter",
            "Understand charges filed against me or a family member",
            "Find out if bail is possible",
            "File an FIR - step by step guide",
            "Translate a court order to simple language",
            "Find free legal aid near me",
        ],
        "tips": [
            "Always ask for a copy of the FIR after filing - it is your legal right under Section 154(2) CrPC.",
            "You have the right to free legal aid if you cannot afford a lawyer (Article 39A of the Constitution).",
            "Police cannot arrest you without telling you the reason - this is your fundamental right under Article 22.",
            "If police refuse to file your FIR, you can send it by registered post to the SP or approach the Magistrate under Section 156(3) CrPC.",
            "Always keep copies of all legal documents - FIR, bail orders, court orders, etc.",
            "You can file a Zero FIR at any police station regardless of jurisdiction.",
            "Never sign a blank paper at the police station.",
            "You have the right to make a phone call to a family member or lawyer immediately after arrest.",
        ],
    },
    "lawyer": {
        "recommended_tools": [
            {
                "name": "Bail Calculator",
                "path": "/tools/bail-calculator",
                "description": "Quick statutory bail eligibility analysis based on sections, custody period, and chargesheet status.",
            },
            {
                "name": "Section Mapper (IPC to BNS)",
                "path": "/tools/section-mapper",
                "description": "Instantly map between old IPC sections and new BNS sections for case preparation.",
            },
            {
                "name": "FIR Draft Assistant",
                "path": "/tools/fir-assistant",
                "description": "Generate structured FIR drafts with all required elements for your client.",
            },
            {
                "name": "Legal Translator",
                "path": "/tools/translate",
                "description": "Convert between legal English, plain English, and Hindi for client communication and drafting.",
            },
            {
                "name": "Case Timeline Tracker",
                "path": "/tools/case-timeline",
                "description": "Analyze case progress, identify delays, and prepare applications for expeditious trial.",
            },
            {
                "name": "Section Lookup",
                "path": "/tools/section-lookup",
                "description": "Quick reference for IPC/BNS sections with punishment details, bail status, and case law.",
            },
        ],
        "quick_actions": [
            "Check default bail eligibility for my client",
            "Map IPC sections to new BNS provisions",
            "Draft a bail application",
            "Look up punishment and bail status for a section",
            "Translate legal documents to Hindi for client",
            "Analyze case timeline for delay arguments",
        ],
        "tips": [
            "Always check default bail eligibility under Section 167(2) CrPC / Section 187 BNSS - it is an indefeasible right.",
            "The new Bharatiya Nyaya Sanhita (BNS) 2023 replaces IPC from 1st July 2024 - use the Section Mapper to stay updated.",
            "For anticipatory bail, ensure you address the conditions under Section 438 CrPC / Section 482 BNSS.",
            "Keep track of the 60/90 day chargesheet filing deadline - missing it entitles your client to default bail.",
            "Under the new BNSS, preliminary inquiry before FIR registration has been formalized - use this to your advantage.",
            "Always cite D.K. Basu guidelines when challenging illegal arrest procedures.",
            "For bail arguments, refer to the three-pronged test: flight risk, evidence tampering, and witness influence.",
            "Use the Supreme Court's guidelines in Arnesh Kumar v. State of Bihar for arrests under Section 498A IPC.",
        ],
    },
    "police": {
        "recommended_tools": [
            {
                "name": "FIR Assistant",
                "path": "/tools/fir-assistant",
                "description": "Ensure FIRs are drafted with all mandatory elements and proper section mapping.",
            },
            {
                "name": "Section Lookup",
                "path": "/tools/section-lookup",
                "description": "Quick reference for applicable sections, punishment ranges, and cognizability status.",
            },
            {
                "name": "Section Mapper (IPC to BNS)",
                "path": "/tools/section-mapper",
                "description": "Map between IPC and new BNS sections for proper chargesheet filing under new laws.",
            },
            {
                "name": "Bail Calculator",
                "path": "/tools/bail-calculator",
                "description": "Track chargesheet filing deadlines and default bail eligibility dates.",
            },
            {
                "name": "Legal Translator",
                "path": "/tools/translate",
                "description": "Translate legal information to Hindi or plain English for communicating with complainants and public.",
            },
            {
                "name": "Case Timeline Tracker",
                "path": "/tools/case-timeline",
                "description": "Monitor investigation and case progress timelines to meet statutory deadlines.",
            },
        ],
        "quick_actions": [
            "Draft an FIR with correct sections",
            "Look up applicable sections for an incident",
            "Check chargesheet filing deadline",
            "Map old IPC sections to new BNS provisions",
            "Verify if offense is cognizable or non-cognizable",
            "Translate rights information to Hindi for the accused",
        ],
        "tips": [
            "FIR must be registered immediately for cognizable offenses - Lalita Kumari v. Govt. of U.P. (2014).",
            "Follow D.K. Basu guidelines strictly during arrest - inform the arrested person of grounds, allow legal counsel, and notify family.",
            "Chargesheet must be filed within 60 days (max 7 years punishment) or 90 days (above 7 years) to prevent default bail.",
            "Under BNSS 2023, FIR can also be filed electronically - ensure your station has the infrastructure.",
            "Zero FIR must be registered and transferred to the correct jurisdiction within 24 hours.",
            "Always provide a free copy of the FIR to the complainant - it is mandatory under law.",
            "Follow Arnesh Kumar guidelines for arrests in cases with punishment up to 7 years - arrest is not mandatory.",
            "Maintain the case diary meticulously - it can be inspected by the court under Section 172 CrPC.",
        ],
    },
}


@router.get("/role-guide/{role}")
def get_role_guide(role: str):
    """
    Get role-based recommendations for tools, quick actions, and tips.
    Roles: citizen, lawyer, police.
    """
    role = role.strip().lower()
    if role not in _ROLE_GUIDES:
        return {
            "error": f"Invalid role '{role}'. Must be one of: citizen, lawyer, police.",
            "available_roles": list(_ROLE_GUIDES.keys()),
        }

    guide = _ROLE_GUIDES[role]
    return {
        "role": role,
        "recommended_tools": guide["recommended_tools"],
        "quick_actions": guide["quick_actions"],
        "tips": guide["tips"],
        "total_tools": len(guide["recommended_tools"]),
    }
