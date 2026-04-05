"""
Comprehensive IPC/BNS Section Database.
Powers: Bail Calculator, FIR Assistant, Case Analysis, Section Mapper.
No external API needed -- pure static data.
"""
from typing import Optional, List, Dict

# IPC Section -> Full metadata
# Sources: Bare Acts, NCRB conviction data, legal textbooks
IPC_SECTIONS = {
    # --- OFFENSES AGAINST BODY ---
    "302": {
        "name": "Murder",
        "bns_equivalent": "103",
        "description": "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
        "punishment": "Death or life imprisonment + fine",
        "max_years": 99,  # life = treated as 99 for calculation
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Murder",
        "severity": "grave",
        "conviction_rate": 38.2,
        "avg_case_duration_years": 7.5,
        "bail_difficulty": "Very Hard",
        "investigation_checklist": [
            "Scene of crime visit and panchnama with photographs/videography",
            "Inquest report under Section 174 CrPC",
            "Post-mortem report (body to mortuary within 24 hours)",
            "Collect blood/DNA samples from scene",
            "Lift fingerprints from scene and weapon",
            "Recover murder weapon and send to FSL",
            "Record statements of all eyewitnesses (161 CrPC)",
            "Record dying declaration if victim was alive (32(1) Evidence Act)",
            "Obtain CDR/tower dump of accused and deceased (30 days)",
            "Collect CCTV footage within 500m radius",
            "Investigate motive: property/personal enmity/financial/relationship",
            "Conduct Test Identification Parade (TIP) if needed",
            "Get 164 CrPC statements of key witnesses before Magistrate",
            "Send all forensic evidence to FSL",
            "File chargesheet within 90 days",
        ],
        "key_evidence": ["Post-mortem report", "Murder weapon", "Eyewitness testimony", "Forensic evidence (DNA/blood)", "CCTV footage", "Motive evidence", "CDR/digital evidence"],
        "relevant_precedents": [
            "Sharad Birdhichand Sarda v. State of Maharashtra (1984) - Five golden principles of circumstantial evidence",
            "Trimukh Maroti Kirkan v. State of Maharashtra (2006) - Last seen theory",
            "Anwar Ali v. State of HP (2020) - Sole testimony of eyewitness sufficient if credible",
        ],
    },
    "304": {
        "name": "Culpable Homicide not amounting to Murder",
        "bns_equivalent": "105",
        "description": "Culpable homicide not amounting to murder.",
        "punishment": "Life imprisonment or up to 10 years + fine",
        "max_years": 99,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Culpable Homicide",
        "severity": "grave",
        "conviction_rate": 32.5,
        "avg_case_duration_years": 6.0,
        "bail_difficulty": "Hard",
        "investigation_checklist": ["Same as Section 302 with focus on intent vs knowledge distinction"],
        "key_evidence": ["Medical evidence", "Circumstantial evidence", "Intent vs knowledge analysis"],
        "relevant_precedents": ["Pulicherla Nagaraju v. State of AP (2006) - Distinction between 302 and 304"],
    },
    "304A": {
        "name": "Death by Negligence",
        "bns_equivalent": "106",
        "description": "Causing death by rash or negligent act not amounting to culpable homicide.",
        "punishment": "Up to 2 years + fine, or both",
        "max_years": 2,
        "bailable": True,
        "cognizable": True,
        "compoundable": False,
        "category": "Death by Negligence",
        "severity": "moderate",
        "conviction_rate": 25.0,
        "avg_case_duration_years": 3.0,
        "bail_difficulty": "Easy",
        "investigation_checklist": ["Establish rashness or negligence", "Expert opinion on standard of care", "Witness statements"],
        "key_evidence": ["Expert opinion", "Witness statements", "Medical report"],
        "relevant_precedents": ["Jacob Mathew v. State of Punjab (2005) - Medical negligence guidelines"],
    },
    "304B": {
        "name": "Dowry Death",
        "bns_equivalent": "80",
        "description": "Death of woman within 7 years of marriage under abnormal circumstances with evidence of dowry demand.",
        "punishment": "7 years to life imprisonment",
        "max_years": 99,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Dowry Death",
        "severity": "grave",
        "conviction_rate": 34.5,
        "avg_case_duration_years": 6.5,
        "bail_difficulty": "Very Hard",
        "investigation_checklist": [
            "Record statement of deceased's parents/siblings",
            "Collect evidence of dowry demand (messages, witnesses, receipts)",
            "Obtain post-mortem report",
            "Check if death occurred within 7 years of marriage",
            "Record statements of neighbors about cruelty/harassment",
            "Seize stridhan (woman's property) records",
            "Check for prior complaints of domestic violence",
            "Investigate suicide note authenticity if found",
            "Record 164 CrPC statements of key witnesses",
        ],
        "key_evidence": ["Post-mortem report", "Evidence of dowry demand", "Testimony of natal family", "Prior complaints", "Marriage duration proof"],
        "relevant_precedents": [
            "Kans Raj v. State of Punjab (2000) - Presumption under 304B",
            "Pawan Kumar v. State of Haryana (1998) - 'Soon before death' interpretation",
        ],
    },
    "307": {
        "name": "Attempt to Murder",
        "bns_equivalent": "109",
        "description": "Whoever does any act with intent or knowledge that it would cause death.",
        "punishment": "Up to 10 years + fine. If hurt caused, up to life imprisonment.",
        "max_years": 10,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Attempted Murder",
        "severity": "grave",
        "conviction_rate": 32.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Hard",
        "investigation_checklist": [
            "Medical examination of victim (nature and severity of injuries)",
            "Record victim's statement (dying declaration if critical)",
            "Recover weapon used",
            "CCTV footage collection",
            "Eyewitness statements",
            "Establish intent to kill (not just hurt)",
            "CDR analysis",
        ],
        "key_evidence": ["Medical report showing life-threatening injuries", "Weapon", "Eyewitness testimony", "Intent evidence"],
        "relevant_precedents": ["State of MP v. Kashiram (2009) - Nature of weapon and injury determines intent"],
    },
    "323": {
        "name": "Voluntarily Causing Hurt",
        "bns_equivalent": "115",
        "description": "Whoever voluntarily causes hurt shall be punished.",
        "punishment": "Up to 1 year + fine up to Rs 1,000, or both",
        "max_years": 1,
        "bailable": True,
        "cognizable": False,
        "compoundable": True,
        "category": "Hurt",
        "severity": "minor",
        "conviction_rate": 22.0,
        "avg_case_duration_years": 2.0,
        "bail_difficulty": "Very Easy",
        "investigation_checklist": ["Medical examination of victim", "Record statements", "Photographs of injuries"],
        "key_evidence": ["Medical report", "Witness statements"],
        "relevant_precedents": [],
    },
    "325": {
        "name": "Voluntarily Causing Grievous Hurt",
        "bns_equivalent": "117",
        "description": "Whoever voluntarily causes grievous hurt.",
        "punishment": "Up to 7 years + fine",
        "max_years": 7,
        "bailable": True,
        "cognizable": True,
        "compoundable": True,
        "category": "Grievous Hurt",
        "severity": "moderate",
        "conviction_rate": 25.0,
        "avg_case_duration_years": 3.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Detailed medical report showing grievous hurt", "Weapon recovery", "Witness statements"],
        "key_evidence": ["Medical report classifying injury as grievous", "Weapon"],
        "relevant_precedents": [],
    },
    "354": {
        "name": "Assault or Criminal Force on Woman with Intent to Outrage Modesty",
        "bns_equivalent": "74",
        "description": "Assault or criminal force to woman with intent to outrage her modesty.",
        "punishment": "1 to 5 years + fine",
        "max_years": 5,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Assault on Woman",
        "severity": "moderate",
        "conviction_rate": 24.0,
        "avg_case_duration_years": 3.5,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Record victim's statement", "Medical examination", "CCTV footage", "Witness statements", "164 CrPC statement"],
        "key_evidence": ["Victim's testimony", "Medical report", "CCTV/witness corroboration"],
        "relevant_precedents": ["Vishaka v. State of Rajasthan (1997) - Sexual harassment guidelines"],
    },
    "376": {
        "name": "Rape / Sexual Assault",
        "bns_equivalent": "63",
        "description": "Whoever commits rape.",
        "punishment": "7 years to life imprisonment + fine",
        "max_years": 99,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Sexual Assault",
        "severity": "grave",
        "conviction_rate": 27.2,
        "avg_case_duration_years": 4.5,
        "bail_difficulty": "Very Hard",
        "investigation_checklist": [
            "Record FIR by woman officer (mandatory)",
            "Medical examination of victim within 24 hours",
            "Medical examination of accused",
            "Collect DNA samples, clothing, biological evidence",
            "Record 164 CrPC statement before Magistrate",
            "Seize electronic devices of accused",
            "CCTV footage near crime scene",
            "Check for prior complaints/FIRs against accused",
            "Investigate relationship between parties (if known to each other)",
            "Send forensic evidence to FSL on priority",
            "Investigation by officer not below rank of Inspector (mandatory)",
            "Complete investigation within 2 months (mandatory under law)",
        ],
        "key_evidence": ["Medical examination report", "DNA/forensic evidence", "Victim's 164 CrPC statement", "Digital evidence", "CCTV footage"],
        "relevant_precedents": [
            "State of Punjab v. Gurmit Singh (1996) - Victim's testimony sufficient for conviction",
            "Tukaram v. State of Maharashtra (1979) - Mathura case, led to law reform",
            "State of Rajasthan v. NK (2000) - No corroboration needed for victim's testimony",
        ],
    },
    # --- OFFENSES AGAINST PROPERTY ---
    "379": {
        "name": "Theft",
        "bns_equivalent": "303",
        "description": "Whoever commits theft.",
        "punishment": "Up to 3 years + fine, or both",
        "max_years": 3,
        "bailable": True,
        "cognizable": False,
        "compoundable": True,
        "category": "Theft",
        "severity": "minor",
        "conviction_rate": 42.1,
        "avg_case_duration_years": 2.0,
        "bail_difficulty": "Easy",
        "investigation_checklist": [
            "Scene of crime inspection",
            "List of stolen property with values",
            "CCTV footage collection",
            "Check pawn shops and online marketplaces",
            "Fingerprint lifting",
            "Check for similar MO in area",
        ],
        "key_evidence": ["Stolen property recovery", "CCTV footage", "Fingerprints", "Witness identification"],
        "relevant_precedents": [],
    },
    "380": {
        "name": "Theft in Dwelling House",
        "bns_equivalent": "305(a)",
        "description": "Theft in any building used as human dwelling or for custody of property.",
        "punishment": "Up to 7 years + fine",
        "max_years": 7,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Theft",
        "severity": "moderate",
        "conviction_rate": 38.0,
        "avg_case_duration_years": 2.5,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Same as 379 plus: Point of entry examination", "Check for break-in marks", "Neighbor statements"],
        "key_evidence": ["Break-in evidence", "Stolen property", "CCTV", "Fingerprints"],
        "relevant_precedents": [],
    },
    "392": {
        "name": "Robbery",
        "bns_equivalent": "309",
        "description": "Whoever commits robbery.",
        "punishment": "Up to 10 years + fine. If on highway between sunset and sunrise: up to 14 years.",
        "max_years": 14,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Robbery",
        "severity": "grave",
        "conviction_rate": 30.0,
        "avg_case_duration_years": 4.0,
        "bail_difficulty": "Hard",
        "investigation_checklist": ["Victim statement", "Medical examination if hurt", "CCTV/witness statements", "Vehicle identification", "TIP if accused unknown"],
        "key_evidence": ["Victim testimony", "Stolen property recovery", "Weapon", "CCTV", "TIP"],
        "relevant_precedents": [],
    },
    "395": {
        "name": "Dacoity",
        "bns_equivalent": "310",
        "description": "Whoever commits dacoity (robbery by 5 or more persons).",
        "punishment": "Up to life imprisonment + fine",
        "max_years": 99,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Dacoity",
        "severity": "grave",
        "conviction_rate": 25.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Very Hard",
        "investigation_checklist": ["Identify all 5+ accused", "Gang linkage investigation", "Weapon recovery", "Stolen property recovery"],
        "key_evidence": ["Evidence of 5+ persons acting together", "Weapons", "Stolen property"],
        "relevant_precedents": [],
    },
    "406": {
        "name": "Criminal Breach of Trust",
        "bns_equivalent": "316",
        "description": "Whoever commits criminal breach of trust.",
        "punishment": "Up to 3 years + fine, or both",
        "max_years": 3,
        "bailable": True,
        "cognizable": False,
        "compoundable": True,
        "category": "Breach of Trust",
        "severity": "minor",
        "conviction_rate": 20.0,
        "avg_case_duration_years": 4.0,
        "bail_difficulty": "Easy",
        "investigation_checklist": ["Entrustment evidence", "Misappropriation proof", "Financial records", "Agreement/contract copies"],
        "key_evidence": ["Entrustment documents", "Financial trail", "Witness testimony"],
        "relevant_precedents": [],
    },
    "411": {
        "name": "Dishonestly Receiving Stolen Property",
        "bns_equivalent": "317",
        "description": "Whoever dishonestly receives or retains stolen property.",
        "punishment": "Up to 3 years + fine, or both",
        "max_years": 3,
        "bailable": True,
        "cognizable": False,
        "compoundable": False,
        "category": "Stolen Property",
        "severity": "minor",
        "conviction_rate": 35.0,
        "avg_case_duration_years": 2.0,
        "bail_difficulty": "Easy",
        "investigation_checklist": ["Trace stolen property", "Prove knowledge that property was stolen", "Financial records of purchase"],
        "key_evidence": ["Stolen property in possession", "Knowledge of theft"],
        "relevant_precedents": [],
    },
    # --- FRAUD AND FORGERY ---
    "420": {
        "name": "Cheating and Dishonestly Inducing Delivery of Property",
        "bns_equivalent": "318",
        "description": "Whoever cheats and thereby dishonestly induces the person deceived to deliver property.",
        "punishment": "Up to 7 years + fine",
        "max_years": 7,
        "bailable": True,
        "cognizable": True,
        "compoundable": True,
        "category": "Cheating / Fraud",
        "severity": "moderate",
        "conviction_rate": 28.5,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": [
            "Collect all documents showing inducement (brochures, emails, messages)",
            "Bank statements showing money trail",
            "Company registration and RERA details (if real estate)",
            "Record statements of multiple victims",
            "Verify claims made by accused (fake documents, certificates)",
            "Digital forensics on accused's devices",
            "Property/asset attachment if fraud amount is large",
            "Check for similar complaints in other jurisdictions",
        ],
        "key_evidence": ["Documents showing false representation", "Money trail", "Multiple victim statements", "Fake documents/certificates"],
        "relevant_precedents": [
            "Hridaya Ranjan v. State of Bihar (2003) - Distinction between cheating and breach of contract",
            "Vir Prakash Sharma v. Anil Kumar (2007) - Mere breach of contract not cheating",
        ],
    },
    "467": {
        "name": "Forgery of Valuable Security",
        "bns_equivalent": "336",
        "description": "Whoever forges a valuable security or will.",
        "punishment": "Up to 10 years + fine",
        "max_years": 10,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Forgery",
        "severity": "grave",
        "conviction_rate": 22.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Handwriting expert examination", "Document forensics", "Original vs forged comparison", "Chain of custody of document"],
        "key_evidence": ["Forged document", "Handwriting expert report", "Original document for comparison"],
        "relevant_precedents": [],
    },
    "468": {
        "name": "Forgery for Purpose of Cheating",
        "bns_equivalent": "337",
        "description": "Whoever commits forgery intending to be used for cheating.",
        "punishment": "Up to 7 years + fine",
        "max_years": 7,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Forgery",
        "severity": "moderate",
        "conviction_rate": 22.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Same as 467 plus: Establish cheating intent"],
        "key_evidence": ["Forged document", "Evidence of cheating intent"],
        "relevant_precedents": [],
    },
    "471": {
        "name": "Using Forged Document as Genuine",
        "bns_equivalent": "340",
        "description": "Whoever fraudulently or dishonestly uses as genuine any document known to be forged.",
        "punishment": "Same as forgery of that document",
        "max_years": 7,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Forgery",
        "severity": "moderate",
        "conviction_rate": 22.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Prove document is forged", "Prove accused knew it was forged", "Prove accused used it as genuine"],
        "key_evidence": ["Forged document", "Evidence of knowledge", "Evidence of use"],
        "relevant_precedents": [],
    },
    # --- DOWRY AND DOMESTIC VIOLENCE ---
    "498A": {
        "name": "Cruelty by Husband or Relatives of Husband",
        "bns_equivalent": "85",
        "description": "Whoever, being the husband or relative of the husband, subjects a woman to cruelty.",
        "punishment": "Up to 3 years + fine",
        "max_years": 3,
        "bailable": True,
        "cognizable": True,
        "compoundable": False,
        "category": "Cruelty by Husband / Relatives",
        "severity": "moderate",
        "conviction_rate": 15.8,
        "avg_case_duration_years": 4.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": [
            "Record detailed statement of wife/complainant",
            "Collect evidence of cruelty (photos, medical records, messages)",
            "Statements from neighbors, friends, natal family",
            "Check for prior complaints or protection orders",
            "Financial records if dowry demand involved",
            "Record statements of accused and in-laws",
        ],
        "key_evidence": ["Victim's testimony", "Medical records of injuries", "Messages/communications showing cruelty", "Witness statements", "Prior complaints"],
        "relevant_precedents": [
            "Arnesh Kumar v. State of Bihar (2014) - No automatic arrest in 498A cases",
            "Rajesh Sharma v. State of UP (2017) - Family Welfare Committee to examine complaints first",
            "Social Action Forum v. Union of India (2018) - Section 498A is not unconstitutional",
        ],
    },
    # --- CRIMINAL CONSPIRACY AND ABETMENT ---
    "120B": {
        "name": "Criminal Conspiracy",
        "bns_equivalent": "61",
        "description": "Whoever is a party to a criminal conspiracy.",
        "punishment": "Same as the offense conspired, or up to 6 months + fine if not a serious offense",
        "max_years": 7,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Criminal Conspiracy",
        "severity": "moderate",
        "conviction_rate": 25.0,
        "avg_case_duration_years": 5.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Establish agreement between conspirators", "Communication records", "Financial links", "Meeting evidence"],
        "key_evidence": ["Communication records", "Financial trail", "Witness testimony of agreement"],
        "relevant_precedents": ["State v. Nalini (1999) - Rajiv Gandhi assassination, conspiracy law explained"],
    },
    "34": {
        "name": "Common Intention",
        "bns_equivalent": "3(5)",
        "description": "When a criminal act is done by several persons in furtherance of common intention of all, each is liable as if done by him alone.",
        "punishment": "Not a standalone offense -- adds to the main charge",
        "max_years": 0,
        "bailable": None,
        "cognizable": None,
        "compoundable": None,
        "category": "Common Intention",
        "severity": "enhancer",
        "conviction_rate": None,
        "avg_case_duration_years": None,
        "bail_difficulty": "Depends on main offense",
        "investigation_checklist": ["Establish pre-arranged plan", "Prove participation in execution", "Prove shared intention"],
        "key_evidence": ["Evidence of pre-arrangement", "Participation evidence"],
        "relevant_precedents": ["Pandurang v. State of Hyderabad (1955) - Common intention requires prior meeting of minds"],
    },
    # --- CRIMINAL INTIMIDATION AND HURT ---
    "506": {
        "name": "Criminal Intimidation",
        "bns_equivalent": "351",
        "description": "Whoever commits criminal intimidation shall be punished.",
        "punishment": "Up to 2 years + fine. If threat of death/grievous hurt/fire/etc: up to 7 years + fine.",
        "max_years": 7,
        "bailable": True,
        "cognizable": False,
        "compoundable": True,
        "category": "Criminal Intimidation",
        "severity": "minor",
        "conviction_rate": 18.0,
        "avg_case_duration_years": 2.5,
        "bail_difficulty": "Easy",
        "investigation_checklist": ["Record threat (messages, calls, witnesses)", "Establish fear of harm", "Check for pattern of threats"],
        "key_evidence": ["Threat messages/recordings", "Witness testimony"],
        "relevant_precedents": [],
    },
    "509": {
        "name": "Word, Gesture or Act Intended to Insult Modesty of Woman",
        "bns_equivalent": "79",
        "description": "Whoever intends to insult the modesty of any woman by word, sound, gesture, or exhibiting any object.",
        "punishment": "Up to 3 years + fine",
        "max_years": 3,
        "bailable": True,
        "cognizable": True,
        "compoundable": False,
        "category": "Insulting Modesty",
        "severity": "minor",
        "conviction_rate": 15.0,
        "avg_case_duration_years": 2.0,
        "bail_difficulty": "Easy",
        "investigation_checklist": ["Record victim's statement", "Witnesses", "CCTV if available"],
        "key_evidence": ["Victim testimony", "Witness corroboration"],
        "relevant_precedents": [],
    },
    # --- SPECIAL LAWS (commonly used with IPC) ---
    "279": {
        "name": "Rash Driving on Public Way",
        "bns_equivalent": "281",
        "description": "Whoever drives any vehicle rashly or negligently on any public way.",
        "punishment": "Up to 6 months + fine of Rs 1,000, or both",
        "max_years": 0.5,
        "bailable": True,
        "cognizable": True,
        "compoundable": True,
        "category": "Rash Driving",
        "severity": "minor",
        "conviction_rate": 50.0,
        "avg_case_duration_years": 1.0,
        "bail_difficulty": "Very Easy",
        "investigation_checklist": ["Accident spot inspection", "Vehicle examination", "Blood alcohol test", "CCTV", "Witness statements"],
        "key_evidence": ["Accident report", "Medical report", "CCTV footage", "Vehicle inspection report"],
        "relevant_precedents": [],
    },
    "147": {
        "name": "Rioting",
        "bns_equivalent": "189",
        "description": "Whoever is guilty of rioting.",
        "punishment": "Up to 2 years + fine, or both",
        "max_years": 2,
        "bailable": True,
        "cognizable": True,
        "compoundable": False,
        "category": "Rioting",
        "severity": "moderate",
        "conviction_rate": 20.0,
        "avg_case_duration_years": 3.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Identify 5+ persons in unlawful assembly", "Video evidence", "Witness statements", "Property damage assessment"],
        "key_evidence": ["Video footage", "Witness identification", "Property damage evidence"],
        "relevant_precedents": [],
    },
    "153A": {
        "name": "Promoting Enmity Between Groups",
        "bns_equivalent": "196",
        "description": "Promoting enmity between different groups on grounds of religion, race, language, etc.",
        "punishment": "Up to 3 years + fine, or both",
        "max_years": 3,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Hate Speech",
        "severity": "moderate",
        "conviction_rate": 10.0,
        "avg_case_duration_years": 4.0,
        "bail_difficulty": "Moderate",
        "investigation_checklist": ["Collect speech/writing/post content", "Context analysis", "Impact on public order"],
        "key_evidence": ["Content of speech/writing", "Context evidence", "Public order impact"],
        "relevant_precedents": ["Amish Devgan v. Union of India (2020) - Hate speech guidelines"],
    },
    "363": {
        "name": "Kidnapping",
        "bns_equivalent": "137",
        "description": "Whoever kidnaps any person.",
        "punishment": "Up to 7 years + fine",
        "max_years": 7,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Kidnapping",
        "severity": "grave",
        "conviction_rate": 30.0,
        "avg_case_duration_years": 3.5,
        "bail_difficulty": "Hard",
        "investigation_checklist": ["Immediate search operation", "CDR/tower dump", "CCTV of last known location", "Vehicle tracking", "Ransom call tracing"],
        "key_evidence": ["Recovery of victim", "Ransom evidence", "CCTV", "CDR", "Witness testimony"],
        "relevant_precedents": [],
    },
    "364A": {
        "name": "Kidnapping for Ransom",
        "bns_equivalent": "140",
        "description": "Whoever kidnaps or abducts any person and threatens to cause death or hurt for ransom.",
        "punishment": "Death or life imprisonment + fine",
        "max_years": 99,
        "bailable": False,
        "cognizable": True,
        "compoundable": False,
        "category": "Kidnapping for Ransom",
        "severity": "grave",
        "conviction_rate": 35.0,
        "avg_case_duration_years": 4.0,
        "bail_difficulty": "Very Hard",
        "investigation_checklist": ["Ransom call tracing", "Negotiation recording", "Money trail", "All of 363 checklist"],
        "key_evidence": ["Ransom demand evidence", "Money trail", "Recovery of victim"],
        "relevant_precedents": [],
    },
}


# --- Utility Functions ---

def get_section(section_number: str) -> Optional[dict]:
    """Get full metadata for an IPC section."""
    section = section_number.strip().upper()
    return IPC_SECTIONS.get(section)


def get_bns_equivalent(ipc_section: str) -> Optional[str]:
    """Get BNS equivalent of an IPC section."""
    sec = get_section(ipc_section)
    return sec["bns_equivalent"] if sec else None


def get_ipc_from_bns(bns_section: str) -> Optional[str]:
    """Get IPC section from BNS section number."""
    bns = bns_section.strip()
    for ipc_num, data in IPC_SECTIONS.items():
        if data.get("bns_equivalent") == bns:
            return ipc_num
    return None


def is_bailable(section_number: str) -> Optional[bool]:
    """Check if an offense under given section is bailable."""
    sec = get_section(section_number)
    return sec["bailable"] if sec else None


def is_cognizable(section_number: str) -> Optional[bool]:
    """Check if an offense under given section is cognizable (police MUST register FIR)."""
    sec = get_section(section_number)
    return sec["cognizable"] if sec else None


def get_max_punishment_years(section_number: str) -> Optional[float]:
    """Get maximum punishment in years for a section."""
    sec = get_section(section_number)
    return sec["max_years"] if sec else None


def calculate_bail_eligibility(sections: List[str], arrest_date_str: str,
                                chargesheet_filed: bool, chargesheet_date_str: Optional[str] = None,
                                today_str: Optional[str] = None) -> dict:
    """
    Calculate bail eligibility under various provisions.
    Returns detailed analysis with eligibility status and reasoning.
    """
    from datetime import datetime, date

    today = datetime.strptime(today_str, "%Y-%m-%d").date() if today_str else date.today()
    arrest_date = datetime.strptime(arrest_date_str, "%Y-%m-%d").date()
    days_in_custody = (today - arrest_date).days

    chargesheet_date = None
    if chargesheet_date_str:
        chargesheet_date = datetime.strptime(chargesheet_date_str, "%Y-%m-%d").date()

    # Find the most serious section
    max_punishment = 0
    all_bailable = True
    section_details = []

    for sec_num in sections:
        sec = get_section(sec_num.strip())
        if sec:
            section_details.append({
                "section": sec_num.strip(),
                "name": sec["name"],
                "max_years": sec["max_years"],
                "bailable": sec["bailable"],
                "punishment": sec["punishment"],
            })
            if sec["max_years"] and sec["max_years"] > max_punishment:
                max_punishment = sec["max_years"]
            if sec["bailable"] is False:
                all_bailable = False

    # Determine chargesheet deadline
    if max_punishment > 10 or max_punishment >= 99:
        chargesheet_deadline_days = 90
    else:
        chargesheet_deadline_days = 60

    result = {
        "sections_analysis": section_details,
        "days_in_custody": days_in_custody,
        "max_punishment_years": max_punishment,
        "all_offenses_bailable": all_bailable,
        "chargesheet_deadline_days": chargesheet_deadline_days,
        "eligibility": [],
    }

    # 1. Check if all offenses are bailable
    if all_bailable:
        result["eligibility"].append({
            "type": "Bailable Offense",
            "eligible": True,
            "urgency": "IMMEDIATE",
            "explanation": "All charged sections are bailable offenses. Bail is a MATTER OF RIGHT under Section 436 CrPC. The police station itself should have granted bail. You do not need court permission.",
            "legal_basis": "Section 436 CrPC / Section 478 BNSS",
            "action": "Apply for bail at the police station. If refused, apply before the Magistrate. Bail CANNOT be denied for bailable offenses.",
            "precedent": "Rasiklal v. Kishore (2009) - Bail in bailable offenses is a right, not a privilege.",
        })

    # 2. Default Bail (Section 167(2) CrPC)
    if not chargesheet_filed:
        days_since_arrest = days_in_custody
        deadline_date = arrest_date
        from datetime import timedelta
        deadline_date = arrest_date + timedelta(days=chargesheet_deadline_days)
        days_remaining = (deadline_date - today).days

        if days_remaining <= 0:
            result["eligibility"].append({
                "type": "Default Bail (Chargesheet not filed)",
                "eligible": True,
                "urgency": "IMMEDIATE",
                "overdue_by_days": abs(days_remaining),
                "explanation": f"Chargesheet has NOT been filed within the mandatory {chargesheet_deadline_days}-day period. "
                               f"The accused has an INDEFEASIBLE RIGHT to default bail under Section 167(2) CrPC. "
                               f"This right CANNOT be taken away even if chargesheet is filed after the deadline. "
                               f"The accused must apply for default bail BEFORE the chargesheet is filed.",
                "legal_basis": "Section 167(2) CrPC / Section 187 BNSS",
                "action": "File default bail application IMMEDIATELY before the Magistrate. "
                          "Mention that the statutory period has expired and the right to default bail has accrued.",
                "precedent": "Uday Mohanlal Acharya v. State of Maharashtra (2001) - Default bail is an indefeasible right. "
                             "Sayed Mohammad Ahmad Kazmi v. State (GNCTD) (2012) - Right accrues even if chargesheet filed later.",
                "draft_available": True,
            })
        else:
            result["eligibility"].append({
                "type": "Default Bail (Chargesheet not filed)",
                "eligible": False,
                "urgency": "WATCH",
                "days_remaining": days_remaining,
                "deadline_date": deadline_date.isoformat(),
                "explanation": f"Chargesheet deadline is {chargesheet_deadline_days} days from arrest. "
                               f"{days_remaining} days remaining. If police don't file chargesheet by {deadline_date.isoformat()}, "
                               f"the accused will have an indefeasible right to default bail.",
                "legal_basis": "Section 167(2) CrPC / Section 187 BNSS",
                "action": f"Monitor closely. Mark {deadline_date.isoformat()} on calendar. "
                          f"If no chargesheet by that date, file default bail application IMMEDIATELY.",
            })

    # 3. Section 436A - Half of maximum sentence served
    if max_punishment > 0 and max_punishment < 99:  # Not applicable for life imprisonment
        half_sentence_days = int(max_punishment * 365 / 2)
        days_remaining_436a = half_sentence_days - days_in_custody

        if days_remaining_436a <= 0:
            result["eligibility"].append({
                "type": "Section 436A Release (Half Sentence Served)",
                "eligible": True,
                "urgency": "IMMEDIATE",
                "explanation": f"The accused has served {days_in_custody} days in custody, which exceeds HALF of the "
                               f"maximum sentence ({max_punishment} years = {max_punishment * 365} days, half = {half_sentence_days} days). "
                               f"Under Section 436A CrPC, the accused MUST be released on personal bond. "
                               f"This is MANDATORY -- the court has no discretion to refuse.",
                "legal_basis": "Section 436A CrPC / Section 479 BNSS",
                "action": "File application under Section 436A before the trial court. The court SHALL release the "
                          "accused on personal bond with or without sureties.",
                "precedent": "Bhim Singh v. Union of India (2015) - Supreme Court directed release of all undertrials who have served half of maximum sentence. "
                             "Hussainara Khatoon v. State of Bihar (1979) - Right to speedy trial is a fundamental right.",
                "draft_available": True,
            })
        elif days_remaining_436a <= 30:
            result["eligibility"].append({
                "type": "Section 436A Release (Half Sentence Served)",
                "eligible": False,
                "urgency": "APPROACHING",
                "days_remaining": days_remaining_436a,
                "eligibility_date": (arrest_date + __import__('datetime').timedelta(days=half_sentence_days)).isoformat(),
                "explanation": f"The accused will become eligible for mandatory release under Section 436A in {days_remaining_436a} days. "
                               f"Half of maximum sentence = {half_sentence_days} days. Currently served: {days_in_custody} days.",
                "legal_basis": "Section 436A CrPC / Section 479 BNSS",
                "action": "Prepare application now. File on the eligibility date.",
            })

    # 4. Life imprisonment cases - 436A still applies differently
    if max_punishment >= 99:
        result["eligibility"].append({
            "type": "Section 436A Note",
            "eligible": False,
            "urgency": "INFO",
            "explanation": "For offenses punishable with death or life imprisonment, Section 436A does not automatically apply. "
                           "However, if the accused has been in custody for a period exceeding the average sentence "
                           "awarded by courts for the specific offense (based on NCRB data), a bail application can still be made "
                           "citing undue delay and right to speedy trial under Article 21.",
            "legal_basis": "Article 21 of Constitution, Section 436A proviso",
            "action": "Apply for regular bail citing delay in trial and Article 21 rights. "
                      "Cite period already served as a strong ground.",
        })

    # 5. Summary
    has_immediate = any(e["urgency"] == "IMMEDIATE" for e in result["eligibility"])
    result["summary"] = {
        "immediate_action_required": has_immediate,
        "strongest_ground": next((e["type"] for e in result["eligibility"] if e.get("eligible")), "Regular bail application"),
        "recommendation": "FILE BAIL APPLICATION IMMEDIATELY - Strong legal grounds exist!" if has_immediate
                          else "Monitor deadlines and prepare bail application.",
    }

    return result


def get_incident_sections(incident_type: str) -> List[dict]:
    """
    Given an incident type description, suggest likely IPC sections.
    Used by FIR Filing Assistant.
    """
    incident_map = {
        "murder": ["302", "201", "34"],
        "killing": ["302", "304", "34"],
        "death": ["302", "304", "304A"],
        "stabbing": ["307", "324", "34"],
        "attack": ["307", "323", "324", "34"],
        "beating": ["323", "325", "34"],
        "assault": ["323", "325", "354"],
        "rape": ["376", "354", "506"],
        "sexual assault": ["376", "354"],
        "molestation": ["354", "509"],
        "eve teasing": ["354", "509", "506"],
        "stalking": ["354D", "506", "509"],
        "theft": ["379", "380", "411"],
        "burglary": ["380", "457", "458", "379"],
        "robbery": ["392", "394", "397"],
        "dacoity": ["395", "396", "397"],
        "snatching": ["379", "356"],
        "fraud": ["420", "406", "120B"],
        "cheating": ["420", "406"],
        "forgery": ["467", "468", "471", "420"],
        "online fraud": ["420", "66C", "66D"],
        "cyber crime": ["420", "66", "66C", "66D"],
        "dowry": ["498A", "304B", "406"],
        "domestic violence": ["498A", "323", "506"],
        "cruelty": ["498A", "323"],
        "dowry death": ["304B", "498A", "306"],
        "kidnapping": ["363", "365", "366"],
        "kidnap ransom": ["364A", "365"],
        "abduction": ["363", "366"],
        "threat": ["506", "503"],
        "intimidation": ["506", "507"],
        "extortion": ["383", "384", "506"],
        "accident": ["279", "304A", "337", "338"],
        "road accident": ["279", "304A", "337", "338"],
        "hit and run": ["279", "304A", "337"],
        "riot": ["147", "148", "149", "323"],
        "arson": ["435", "436"],
        "trespass": ["441", "447", "448"],
        "defamation": ["499", "500"],
        "land dispute": ["420", "447", "406"],
        "property dispute": ["420", "406", "447"],
        "corruption": ["120B", "420"],
        "bribe": ["120B", "420"],
        "conspiracy": ["120B"],
        "hate speech": ["153A", "295A", "505"],
    }

    # Add aliases for fuzzy matching
    aliases = {
        "burglary": ["burglar", "burgled", "broke in", "break in", "breaking in", "broken into"],
        "theft": ["stole", "stolen", "steal", "stealing", "thief", "chor", "chori"],
        "robbery": ["robbed", "looted", "loot"],
        "murder": ["killed", "murdered", "dead body", "found dead"],
        "assault": ["hit me", "punched", "slapped", "attacked"],
        "rape": ["raped", "sexually assaulted", "molested"],
        "fraud": ["scam", "scammed", "cheated", "duped", "conned"],
        "cheating": ["cheated", "deceived", "tricked"],
        "kidnapping": ["kidnapped", "abducted", "missing child", "taken away"],
        "threat": ["threatened", "threatening", "death threat"],
        "domestic violence": ["husband beat", "in-laws", "dowry demand", "tortured by husband"],
        "accident": ["car accident", "bike accident", "vehicle accident", "crashed"],
        "stalking": ["stalked", "following me", "harassing"],
        "extortion": ["extorted", "demanding money", "blackmail", "blackmailed"],
        "dowry": ["dahej", "dowry demand", "dowry harassment"],
    }

    incident_lower = incident_type.lower().strip()
    matched_section_nums = set()
    matched_keys = set()

    # First check aliases for better fuzzy matching
    for key, alias_list in aliases.items():
        for alias in alias_list:
            if alias in incident_lower:
                if key in incident_map and key not in matched_keys:
                    matched_keys.add(key)
                    for s in incident_map[key]:
                        matched_section_nums.add(s)

    # Then check direct keyword matches (find ALL matching keywords)
    for key, sections in incident_map.items():
        if key in incident_lower and key not in matched_keys:
            matched_keys.add(key)
            for s in sections:
                matched_section_nums.add(s)

    # Build results from all matched sections
    results = []
    seen = set()
    for s in matched_section_nums:
        if s not in seen:
            seen.add(s)
            sec = get_section(s)
            if sec:
                results.append({
                    "section": s,
                    "name": sec["name"],
                    "bailable": sec["bailable"],
                    "cognizable": sec["cognizable"],
                    "punishment": sec["punishment"],
                })

    # Sort by severity (non-bailable first, then by section number)
    results.sort(key=lambda x: (x.get("bailable", True), x["section"]))

    return results


def get_all_sections_list() -> List[dict]:
    """Get a simplified list of all IPC sections."""
    return [
        {"section": num, "name": data["name"], "bns": data["bns_equivalent"], "category": data["category"]}
        for num, data in IPC_SECTIONS.items()
    ]


def map_ipc_to_bns(ipc_section: str) -> Optional[dict]:
    """Get detailed IPC to BNS mapping."""
    sec = get_section(ipc_section)
    if not sec:
        return None
    return {
        "ipc_section": ipc_section,
        "ipc_name": sec["name"],
        "bns_section": sec["bns_equivalent"],
        "punishment": sec["punishment"],
        "key_change": "No substantive change in most sections. BNS reorganizes and renumbers the IPC.",
    }
