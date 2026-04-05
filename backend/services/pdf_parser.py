import re
from typing import Optional
from pdfminer.high_level import extract_text as pdfminer_extract


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file using pdfminer (lightweight, no Pillow/pypdfium2)."""
    try:
        text = pdfminer_extract(pdf_path)
        return text.strip() if text else ""
    except Exception as e:
        raise ValueError(f"Cannot read PDF: {str(e)}")


def parse_fir_fields(text: str) -> dict:
    """Parse standard FIR fields from extracted text using regex patterns."""
    fields = {
        "fir_number": None,
        "police_station": None,
        "district": None,
        "state": None,
        "date_filed": None,
        "complainant_name": None,
        "accused_name": None,
        "ipc_sections": None,
        "description": None,
        "offense_category": None,
    }

    # FIR Number patterns
    fir_match = re.search(
        r'(?:FIR\s*(?:No|Number|#)\.?\s*[:\-]?\s*)(\d+[/\-]\d{4}|\d+)',
        text, re.IGNORECASE
    )
    if fir_match:
        fields["fir_number"] = fir_match.group(1).strip()

    # Police Station
    ps_match = re.search(
        r'(?:P\.?S\.?|Police\s*Station)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|District|Dist)',
        text, re.IGNORECASE
    )
    if ps_match:
        fields["police_station"] = ps_match.group(1).strip()

    # District
    dist_match = re.search(
        r'(?:District|Dist\.?)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|State|Pin)',
        text, re.IGNORECASE
    )
    if dist_match:
        fields["district"] = dist_match.group(1).strip()

    # State
    state_match = re.search(
        r'(?:State)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|Pin|Date)',
        text, re.IGNORECASE
    )
    if state_match:
        fields["state"] = state_match.group(1).strip()

    # Date filed
    date_match = re.search(
        r'(?:Date|Dated?)\s*[:\-]?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
        text, re.IGNORECASE
    )
    if date_match:
        fields["date_filed"] = date_match.group(1).strip()

    # Complainant
    comp_match = re.search(
        r'(?:Complainant|Informant)\s*[:\-]?\s*([A-Za-z\s\.]+?)(?:\n|S/o|D/o|W/o|Age|,)',
        text, re.IGNORECASE
    )
    if comp_match:
        fields["complainant_name"] = comp_match.group(1).strip()

    # Accused
    acc_match = re.search(
        r'(?:Accused|Suspect)\s*[:\-]?\s*([A-Za-z\s\.]+?)(?:\n|S/o|D/o|W/o|Age|,)',
        text, re.IGNORECASE
    )
    if acc_match:
        fields["accused_name"] = acc_match.group(1).strip()

    # IPC / BNS Sections
    ipc_sections = re.findall(
        r'(?:(?:Section|Sec\.?|U/[Ss])\s*)?(\d{1,4}[A-Z]?)(?:\s*(?:of|,|/|&)\s*)?(?:IPC|BNS|Indian Penal Code|Bharatiya Nyaya Sanhita)?',
        text, re.IGNORECASE
    )
    # Also look for explicit "Section X of IPC" patterns
    explicit_sections = re.findall(
        r'(?:Section|Sec\.?)\s+(\d{1,4}[A-Z]?)\s+(?:of\s+)?(?:IPC|BNS|I\.P\.C)',
        text, re.IGNORECASE
    )
    all_sections = list(set(ipc_sections + explicit_sections))
    # Filter to only valid IPC section numbers (1-511)
    valid_sections = [s for s in all_sections if (s.isdigit() and 1 <= int(s) <= 511) or (not s.isdigit() and len(s) <= 5)]
    if valid_sections:
        fields["ipc_sections"] = ", ".join(sorted(set(valid_sections)))

    # Description - take the bulk of text after sections info
    desc_match = re.search(
        r'(?:Brief\s*Facts|Gist|Details|Description|Occurrence)\s*[:\-]?\s*([\s\S]{50,}?)(?:Signature|SD/\-|Action\s*Taken)',
        text, re.IGNORECASE
    )
    if desc_match:
        fields["description"] = desc_match.group(1).strip()[:2000]
    elif len(text) > 100:
        # Fallback: use the main body of text
        fields["description"] = text[:2000]

    # Offense category based on IPC sections
    if fields["ipc_sections"]:
        fields["offense_category"] = categorize_offense(fields["ipc_sections"])

    return fields


def categorize_offense(ipc_sections: str) -> Optional[str]:
    """Categorize the offense based on IPC section numbers."""
    sections = ipc_sections.lower().replace(" ", "")
    category_map = {
        "302": "Murder",
        "304": "Culpable Homicide / Dowry Death",
        "304B": "Dowry Death",
        "376": "Sexual Assault",
        "420": "Cheating / Fraud",
        "406": "Criminal Breach of Trust",
        "498A": "Cruelty by Husband / Relatives",
        "379": "Theft",
        "392": "Robbery",
        "395": "Dacoity",
        "307": "Attempted Murder",
        "323": "Voluntarily Causing Hurt",
        "354": "Assault on Woman",
        "506": "Criminal Intimidation",
        "120B": "Criminal Conspiracy",
        "467": "Forgery",
        "468": "Forgery for Cheating",
        "471": "Using Forged Document",
        "411": "Dishonestly Receiving Stolen Property",
        "34": "Common Intention",
    }
    for sec, category in category_map.items():
        if sec.lower() in sections:
            return category
    return "Other"
