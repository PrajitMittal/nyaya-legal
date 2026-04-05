"""Seed the database with 5 realistic sample FIRs for demo purposes."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date
from database import engine, SessionLocal, Base
from models import FIR

Base.metadata.create_all(bind=engine)

SAMPLE_FIRS = [
    {
        "fir_number": "0142/2024",
        "police_station": "Saket",
        "district": "South Delhi",
        "state": "Delhi",
        "date_filed": date(2024, 3, 15),
        "complainant_name": "Ramesh Kumar",
        "accused_name": "Sunil Sharma",
        "ipc_sections": "302, 201",
        "description": "On the night of 14th March 2024, the complainant's brother Mahesh Kumar was found dead with multiple stab wounds in his rented apartment at B-42, Saket. The accused Sunil Sharma, who is the neighbor and had a long-standing property dispute with the deceased, was seen leaving the premises by multiple witnesses around the estimated time of death. The murder weapon, a kitchen knife, was recovered from a dustbin near the accused's residence with blood stains. CCTV footage from the building shows the accused entering the deceased's floor at 11:30 PM and leaving at 12:15 AM.",
        "offense_category": "Murder",
        "source": "manual",
    },
    {
        "fir_number": "0089/2024",
        "police_station": "Cyber Crime Cell",
        "district": "Gurugram",
        "state": "Haryana",
        "date_filed": date(2024, 5, 20),
        "complainant_name": "Anita Deshmukh",
        "accused_name": "Vikram Patel, Ravi Associates Pvt Ltd",
        "ipc_sections": "420, 406, 467, 468, 471, 120B",
        "description": "The complainant Anita Deshmukh invested Rs. 45 lakhs in a real estate project 'Green Valley Heights' promoted by the accused Vikram Patel through his company Ravi Associates Pvt Ltd. The accused showed forged land ownership documents, fake RERA registration certificate, and fabricated NOCs from municipal authorities. After collecting money from 150+ investors totaling approximately Rs. 25 crores, the accused has become unreachable. The project site is actually agricultural land with no permission for construction. Multiple victims have come forward with similar complaints.",
        "offense_category": "Cheating / Fraud",
        "source": "manual",
    },
    {
        "fir_number": "0234/2024",
        "police_station": "Mahila Thana",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "date_filed": date(2024, 7, 3),
        "complainant_name": "Priya Verma (Father: Suresh Verma)",
        "accused_name": "Deepak Tiwari (Husband), Sunita Tiwari (Mother-in-law)",
        "ipc_sections": "498A, 304B, 406",
        "description": "The complainant's daughter Priya Verma (25) was found dead at her marital home on 2nd July 2024, within 2 years of marriage. The family alleges persistent dowry demands by the husband Deepak Tiwari and his mother Sunita Tiwari, demanding Rs. 15 lakhs cash and a car as additional dowry. The deceased had complained to her parents multiple times about physical and mental harassment. Bruise marks were found on the body. A suicide note was found but the family suspects it was written under coercion. The post-mortem report is awaited.",
        "offense_category": "Dowry Death",
        "source": "manual",
    },
    {
        "fir_number": "0567/2024",
        "police_station": "Koramangala",
        "district": "Bengaluru Urban",
        "state": "Karnataka",
        "date_filed": date(2024, 8, 10),
        "complainant_name": "Mohammed Irfan",
        "accused_name": "Unknown persons (3-4)",
        "ipc_sections": "379, 411, 34",
        "description": "On 9th August 2024 at approximately 2:30 AM, 3-4 unknown persons broke into the complainant's electronics showroom 'Irfan Electronics' located at 80 Feet Road, Koramangala. The accused broke the rear door lock and stole electronics worth approximately Rs. 18 lakhs including 45 smartphones, 12 laptops, and 8 tablets. CCTV footage shows masked individuals using a white Tempo vehicle. Similar break-ins have been reported at 3 other electronics shops in the area in the past month, suggesting an organized gang operation.",
        "offense_category": "Theft",
        "source": "manual",
    },
    {
        "fir_number": "0321/2024",
        "police_station": "Andheri",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "date_filed": date(2024, 6, 25),
        "complainant_name": "Dr. Kavitha Nair",
        "accused_name": "Rajesh Menon",
        "ipc_sections": "307, 323, 506, 354",
        "description": "The complainant Dr. Kavitha Nair, a 35-year-old doctor, was attacked by the accused Rajesh Menon (ex-boyfriend) with a sharp weapon outside her clinic at Andheri West on 24th June 2024. The accused inflicted deep cuts on her arms and neck causing severe blood loss. The complainant was rushed to Kokilaben Hospital where she is currently in ICU. The accused had been stalking the complainant for 6 months after their breakup. Multiple complaints of stalking and threatening calls were previously filed. The accused was apprehended at Mumbai airport while trying to flee to Dubai.",
        "offense_category": "Attempted Murder",
        "source": "manual",
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(FIR).count()
        if existing > 0:
            print(f"Database already has {existing} FIRs. Skipping seed.")
            return

        for fir_data in SAMPLE_FIRS:
            fir = FIR(**fir_data)
            db.add(fir)

        db.commit()
        print(f"Seeded {len(SAMPLE_FIRS)} sample FIRs successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
