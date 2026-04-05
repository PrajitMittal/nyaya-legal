"""
New module endpoints: Bail Calculator, FIR Assistant, Section Mapper, Know Your Rights.
All work WITHOUT external APIs -- pure logic + static database.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
from services.ipc_database import (
    calculate_bail_eligibility,
    get_section,
    get_incident_sections,
    get_all_sections_list,
    map_ipc_to_bns,
    get_ipc_from_bns,
    IPC_SECTIONS,
)

router = APIRouter()


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
