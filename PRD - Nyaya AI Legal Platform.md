# Nyaya -- India's AI Legal Copilot
## Product Requirements Document (PRD)
### Version 1.0 | April 2026

---

## 1. Executive Summary

India's criminal justice system is broken at every seam. 50 million cases pending, 75.8% prisoners unconvicted, 61% hearings wasted on adjournments, Rs 4.57/person/year on legal aid, and zero integration between police, courts, and prisons. Citizens pay bribes to file FIRs. Undertrials rot in jail despite qualifying for bail. Lawyers spend more time waiting in corridors than arguing cases. Police use crash-prone software from 2009.

**Nyaya** is an AI-powered legal intelligence platform that serves three users -- citizens, lawyers, and police -- across the entire criminal justice lifecycle: from FIR filing to investigation, bail, trial, and case resolution.

The platform doesn't replace lawyers or police. It makes them dramatically more effective, and gives citizens the information they're legally entitled to but practically denied.

### Why Now
- Claude/LLM capabilities are mature enough to parse legal documents, understand IPC/BNS sections, and generate structured legal analysis
- India's legal data is increasingly digitized (eCourts, Indian Kanoon, NCRB) but nobody is connecting the dots
- BNS/BNSS transition (2024) has created confusion -- even lawyers struggle with new section mappings. An AI that knows both old and new law has immediate value
- 900M+ smartphone users in India. Legal information delivery via WhatsApp/mobile is now viable at scale

### Business Model (Phase 2+)
- **Free tier**: Citizens -- FIR assistant, bail calculator, case explainer (ad-supported or freemium)
- **Pro tier**: Lawyers -- Rs 999-2999/month for AI research, drafting, hearing tracker
- **Enterprise tier**: Law firms, legal aid orgs, police departments -- custom pricing
- **Government contracts**: Legal Services Authorities (NALSA/DLSA), State Police departments

---

## 2. User Personas

### 2.1 Ravi -- The Common Citizen
- **Who**: 35, small shop owner in Lucknow. Hindi-speaking. No legal knowledge.
- **Scenario**: His shop was burgled. He goes to the police station. The SHO tells him "yeh FIR ka case nahi hai" (this isn't an FIR matter) and asks him to file a general complaint. Ravi doesn't know that theft IS a cognizable offense and the police MUST register an FIR. He loses Rs 3 lakhs of stock with no legal recourse.
- **What he needs**: Know his rights BEFORE going to the police station. Know which sections apply. Know what to do if police refuse. A paper trail.
- **Language**: Hindi, possibly broken English
- **Tech comfort**: WhatsApp, basic smartphone apps

### 2.2 Priya -- The Undertrial's Wife
- **Who**: 28, homemaker in rural Bihar. Her husband Manoj was arrested 14 months ago for a Section 323 (voluntarily causing hurt) case. Maximum sentence: 1 year. He's been in jail for 14 months -- longer than the maximum sentence itself.
- **Scenario**: Nobody told her that under Section 436A CrPC, Manoj qualifies for mandatory release (served more than half of maximum sentence). The legal aid lawyer assigned to Manoj has met him once in 14 months. She doesn't know how to find a better lawyer or even what questions to ask.
- **What she needs**: A bail eligibility check that tells her IN HER LANGUAGE "your husband qualifies for release under Section 436A. Here's what to do. Here's a draft application. Here's where to file it."
- **Language**: Hindi/Bhojpuri
- **Tech comfort**: WhatsApp only

### 2.3 Adv. Sharma -- The Litigation Lawyer
- **Who**: 42, practices in Delhi District Courts and Delhi High Court. Handles 40+ active cases. Solo practitioner, one junior.
- **Scenario**: Monday: 6 cases listed across Saket, Patiala House, and DHC. 4 will be adjourned. He doesn't know which 4 until he physically reaches each court. He spends 8 hours, achieves meaningful progress on 2 cases. His clients call asking "kya hua?" (what happened?) -- he doesn't have time to update all of them. By evening, he needs to prepare for tomorrow's arguments but has to manually search Indian Kanoon for precedents.
- **What he needs**: A system that predicts which hearings will actually happen, auto-updates clients after each hearing, and does his legal research in 10 minutes instead of 3 hours.
- **Language**: English + Hindi
- **Tech comfort**: Laptop, smartphone, comfortable with apps

### 2.4 Adv. Meera -- The Legal Aid Lawyer
- **Who**: 29, empaneled with DLSA Delhi. Earns Rs 5,000/month from legal aid. Handles 200+ cases because nobody else will.
- **Scenario**: She has 200 undertrial clients she's supposed to represent. She's met 30 of them. She doesn't have a list of which ones qualify for bail under various provisions. She doesn't have time to research each case individually. When she goes to court, she has 3 minutes to argue before the judge moves to the next case.
- **What she needs**: An AI that scans all 200 cases and says "these 47 qualify for default bail (chargesheet not filed in 90 days), these 23 qualify under 436A (served half sentence), these 15 have bailable offenses and should never have been in jail." Auto-generated bail applications for each.
- **Language**: English
- **Tech comfort**: High

### 2.5 SI Rajesh -- The Investigating Officer
- **Who**: 38, Sub-Inspector at a Delhi police station. Handles 15-20 active investigations simultaneously.
- **Scenario**: He registered an FIR under Sections 420/406/468 IPC 75 days ago. He's drowning in other cases. He forgot that the 90-day chargesheet deadline is approaching. If he misses it, the accused gets default bail and his superiors will be furious. Meanwhile, he's maintaining case diaries manually in a register, and the CCTNS system crashed again last week so nothing is digitally updated.
- **What he needs**: A dashboard showing all his cases with countdown timers to chargesheet deadline. An investigation checklist per IPC section. A digital case diary that works on his phone. Alert: "15 days left to file chargesheet in FIR 089/2024."
- **Language**: Hindi + English
- **Tech comfort**: Smartphone, basic computer

### 2.6 DSP Verma -- The Station House Officer
- **Who**: 52, DSP overseeing 4 police stations in Gurugram. 200+ cases under his jurisdiction.
- **Scenario**: He needs to know: How many cases are approaching chargesheet deadline? Which investigations are stalled? Are there duplicate FIRs for the same incident? What's the disposal rate of his stations compared to district average? He currently gets this information by calling each SHO individually.
- **What he needs**: A command dashboard. Red/amber/green status for every case. Anomaly detection (why hasn't this IO visited the crime scene in 30 days?). Aggregate stats for reporting to SP.
- **Language**: English + Hindi
- **Tech comfort**: Laptop

---

## 3. Product Architecture

### 3.1 Platform Overview

```
                              NYAYA PLATFORM
                                   |
            ------------------------------------------------
            |                      |                       |
      CITIZEN PORTAL         LAWYER PORTAL          POLICE PORTAL
      (Mobile-first)         (Web + Mobile)         (Web + Mobile)
            |                      |                       |
            ------------------------------------------------
                                   |
                          CORE AI ENGINE
                    (Claude + Embeddings + RAG)
                                   |
            ------------------------------------------------
            |              |              |               |
       FIR Module    Case Tracker    Legal Research   Investigation
                                                       Module
            |              |              |               |
            ------------------------------------------------
                                   |
                          DATA LAYER
            ------------------------------------------------
            |          |           |          |           |
         eCourts   Indian      NCRB        Case        User
          API      Kanoon     Stats       Archive      Data
                    API
```

### 3.2 Core AI Engine

The AI engine is the brain of Nyaya. It handles:

**Document Understanding**
- Parse FIR PDFs (handwritten OCR + printed text extraction)
- Parse court orders, bail applications, chargesheets
- Extract structured data: sections, dates, parties, charges, outcomes

**Legal Intelligence**
- Map IPC sections <-> BNS sections (critical during transition period)
- Classify offense type, severity, bailability, compoundability
- Calculate statutory deadlines (chargesheet filing, bail eligibility)
- Predict case outcomes based on historical data and section-specific conviction rates

**Language**
- Accept input in Hindi, English, and 10+ regional languages
- Generate outputs in user's preferred language
- Legal jargon -> plain language translation

**Search & Similarity**
- Semantic search across Indian Kanoon case database
- Find precedents by fact pattern similarity (not just keyword match)
- Rank results by relevance, recency, court hierarchy, and outcome

---

## 4. Feature Specifications

### MODULE 1: FIR FILING ASSISTANT (Citizens)

**Problem it solves**: 42% of citizens pay bribes to police. Many don't know their rights. Police routinely refuse FIRs for cognizable offenses.

#### 4.1.1 "What Happened?" Conversational Interface

**How it works**:
1. User describes incident in their language (text or voice)
   - "Mere dukaan mein chhori ho gayi kal raat" (My shop was burgled last night)
2. AI asks clarifying questions conversationally:
   - "Kya kuch tod-phod hui?" (Was there any breaking/forced entry?)
   - "Kitne ka nuqsaan hua?" (What was the estimated loss?)
   - "Kya CCTV footage hai?" (Is there CCTV footage?)
3. AI determines:
   - Applicable IPC/BNS sections (e.g., 380 IPC - theft in dwelling house, 457 - lurking house-trespass by night)
   - Whether offense is cognizable (police MUST register FIR) or non-cognizable
   - Whether it's bailable or non-bailable
4. AI generates:
   - Draft FIR complaint in proper legal language
   - "Know Your Rights" card:
     - "Under Section 154 CrPC, police MUST register an FIR for cognizable offenses"
     - "If they refuse, you can: (a) Send complaint by post to SP, (b) File before Magistrate under 156(3), (c) Contact State Human Rights Commission"
     - "Under Lalita Kumari v. State of UP (2014), Supreme Court ruled that FIR registration is MANDATORY"
   - Nearest police station with jurisdiction
   - WhatsApp-shareable summary

**Input**: Text/voice in any Indian language
**Output**: Draft complaint, applicable sections, rights card, next steps
**Data needed**: IPC/BNS section database, cognizability table, police station geo-database

#### 4.1.2 Zero FIR Tracker

**How it works**:
- After FIR is filed, user enters FIR number
- System tracks: Has the FIR been transferred to the correct jurisdiction?
- Alert if: FIR not transferred within 24 hours (violation of protocol)
- Show: Current status, IO assigned, next expected action

#### 4.1.3 FIR Refusal Escalation Workflow

**How it works**:
1. If police refuse to file FIR, user taps "Police Refused"
2. System generates:
   - Written complaint to Superintendent of Police (auto-filled with incident details)
   - Application under Section 156(3) CrPC to Magistrate
   - Complaint to State/National Human Rights Commission
3. User can email/print/WhatsApp these documents
4. System logs the refusal with timestamp and location (builds evidence trail)

**Why this matters**: This feature alone could reduce police corruption significantly by arming citizens with knowledge.

---

### MODULE 2: BAIL ELIGIBILITY CALCULATOR (Citizens + Lawyers)

**Problem it solves**: 24,879 people are in jail RIGHT NOW despite being granted bail because nobody told them. 75.8% of prisoners are undertrials. Many have served more time than their potential sentence.

#### 4.2.1 Instant Bail Check

**How it works**:
1. Input: IPC/BNS sections charged, date of arrest, whether chargesheet filed, date of chargesheet (if filed)
2. AI calculates and displays:

**Default Bail (Section 167(2) CrPC / Section 187 BNSS)**:
- If chargesheet NOT filed within 60 days (punishment up to 10 years) or 90 days (punishment > 10 years): "ELIGIBLE FOR DEFAULT BAIL"
- Shows: Days since arrest, deadline date, days remaining/overdue
- Generates: Draft default bail application
- Critical note: "Default bail is an INDEFEASIBLE RIGHT. It cannot be denied if chargesheet deadline is missed."

**Section 436A Release (Half-Sentence Rule)**:
- If undertrial has served half of maximum sentence for the offense: "ELIGIBLE FOR MANDATORY RELEASE"
- Shows: Maximum sentence for sections charged, time served, eligibility date
- Generates: Draft application under 436A
- Example: Section 323 IPC (max 1 year). Arrested 7 months ago. "Your client has served more than half of maximum sentence. Eligible for release under Section 436A."

**Regular Bail Assessment**:
- Based on sections, criminal history, flight risk factors
- AI generates: Bail likelihood score (based on similar cases)
- Shows: Relevant precedents where bail was granted/denied for same sections
- Generates: Draft bail application with supporting precedents

**Anticipatory Bail Advisor**:
- If not yet arrested but anticipating arrest
- AI assesses: Is anticipatory bail viable for these sections?
- Shows: Success rate of anticipatory bail for these sections in the relevant High Court
- Generates: Draft anticipatory bail application

#### 4.2.2 Bulk Bail Scanner (For Legal Aid Lawyers)

**How it works**:
- Upload a list of undertrial clients (name, sections, date of arrest, chargesheet status)
- System scans ALL cases and categorizes:
  - RED: Eligible for release RIGHT NOW (default bail/436A)
  - AMBER: Approaching eligibility in next 30 days
  - GREEN: Not yet eligible
- Generates bail applications for ALL red cases in one batch
- Priority-sorted by urgency

**Why this matters**: A legal aid lawyer with 200 clients can identify ALL eligible-for-release clients in 5 minutes instead of weeks of manual review.

#### 4.2.3 Bail Bond Assistance

**How it works**:
- If bail is granted but person can't afford surety
- Shows: Provisions for personal bond (Section 441 CrPC)
- Shows: NGOs and legal aid organizations that help with bail bonds
- Generates: Application to court requesting personal bond instead of surety bond
- Cites: Moti Ram v. State of MP (1978) -- "bail should not be denied merely because the accused is poor"

---

### MODULE 3: CASE EXPLAINER (Citizens)

**Problem it solves**: 99.9% of citizens cannot understand court proceedings. 7 of 15 litigants felt lawyers never briefed them. Proceedings in English, litigants speak Hindi/regional.

#### 4.3.1 Plain Language Case Status

**How it works**:
1. User enters eCourts case number OR CNR number
2. System fetches case data from eCourts
3. AI translates EVERY field into plain language in user's language:

**Instead of**:
```
Next Date: 15/05/2026
Purpose: Arguments on IA 234/2025
Stage: Evidence (PW)
```

**Shows**:
```
Aapka agla court date 15 May 2026 hai.
Kya hoga: Judge ek application pe sunwai karega jo doosri party ne daali hai.
Case kahan hai: Gawahon ke bayaan ho rahe hain. Sarkari paksh ke gawaah
ab tak bol chuke hain. Ab aapki taraf ke gawaahon ki baari aa sakti hai.
Kitna time aur lag sakta hai: Aam taur pe is stage mein 6-12 mahine lagte hain.
```

(Translation: Your next court date is May 15, 2026. What will happen: Judge will hear an application filed by the other party. Where the case is: Witness examination is ongoing. Prosecution witnesses have testified. Your side's witnesses may come next. How much more time: Typically 6-12 months at this stage.)

#### 4.3.2 Case Timeline Visualization

**How it works**:
- Visual timeline showing every hearing date, what happened, what's next
- Color-coded: Green (progress made), Red (adjourned), Yellow (procedural)
- Predicted end date based on historical data for similar cases
- "Your case has been adjourned 12 times. Average for this type of case is 8."

#### 4.3.3 "What Does This Order Mean?" Document Explainer

**How it works**:
1. User uploads/photographs a court order
2. AI reads the order and explains:
   - What the judge decided
   - What it means for you specifically
   - What you need to do next
   - Deadline for any action (e.g., appeal period)
3. Flags urgent items: "You have 30 days to file an appeal. After that, this order becomes final."

---

### MODULE 4: SMART HEARING TRACKER (Lawyers)

**Problem it solves**: Lawyers handle 20-50+ cases across multiple courts. 61% of hearings are adjournments. No tool helps them prioritize which court to be in.

#### 4.4.1 Multi-Court Cause List Aggregator

**How it works**:
1. Lawyer registers their cases (by case number, court, client)
2. System scrapes cause lists from all registered courts daily
3. Dashboard shows:
   - Today's hearings sorted by time
   - Court + bench + room number
   - Co-listed cases (same bench, can be batched)
   - Conflict alerts: "Case A (Saket) and Case B (Patiala House) both listed at 10:30 AM"

#### 4.4.2 Adjournment Probability Predictor

**How it works**:
- For each hearing, AI predicts likelihood of adjournment based on:
  - Historical adjournment rate for this bench/judge
  - Whether the other side has a pattern of seeking adjournments
  - Stage of case (early stages have higher adjournment rates)
  - Whether witnesses are summoned (witness absence = likely adjournment)
- Display: "87% chance of adjournment -- consider sending junior"
- Helps lawyer decide WHERE to be physically present

**Data needed**: Historical hearing data from eCourts (date, purpose, outcome, judge)

#### 4.4.3 Auto Client Updates

**How it works**:
1. After each hearing, lawyer fills a quick form (1-2 minutes):
   - Outcome: Adjourned / Arguments heard / Order reserved / Order passed
   - Next date
   - Brief notes
2. AI generates plain-language update in client's preferred language
3. Sends via WhatsApp/SMS/Email:
   ```
   Sharma Ji, aaj aapke case mein sunwai hui.
   Kya hua: Doosri party ke vakeel ne ek aur tareekh maangi. Judge ne de di.
   Agli tareekh: 22 June 2026
   Kya karna hai: Kuch nahi. Hum taiyaar hain. Agli baar arguments honge.
   ```
4. Client can reply with questions (AI answers basic ones, escalates complex ones to lawyer)

#### 4.4.4 Deadline & Limitation Tracker

**How it works**:
- For each case, auto-calculates all statutory deadlines:
  - Appeal filing deadline (30/60/90 days depending on court)
  - Written statement filing deadline
  - Document filing deadline
  - Limitation period for new claims
- Alert escalation: 30 days -> 15 days -> 7 days -> 3 days -> 1 day
- "CRITICAL: Appeal deadline for Case X expires in 3 days. File today."

---

### MODULE 5: AI LEGAL RESEARCH (Lawyers)

**Problem it solves**: Legal research takes hours. Indian Kanoon has no relevance ranking. Paid tools cost Rs 10,000-50,000/year. No tool searches in vernacular.

#### 4.5.1 Semantic Case Search

**How it works**:
1. Lawyer describes the legal question in natural language:
   - "Can a person be convicted under Section 302 based purely on circumstantial evidence when there are no eyewitnesses?"
2. AI searches across:
   - Indian Kanoon (free case law database)
   - Uploaded judgment PDFs (firm's own library)
   - Our growing case database
3. Returns results ranked by:
   - Fact pattern similarity (not just keyword match)
   - Court hierarchy (Supreme Court > High Court > District)
   - Recency (newer precedents weighted higher)
   - Relevance to the specific legal question asked
4. Each result shows:
   - Case name, court, date
   - AI-generated 3-line summary of the holding
   - How it's relevant to the user's question
   - Key paragraph extracted (the ratio decidendi)

#### 4.5.2 Vernacular Legal Research

**How it works**:
- Search in Hindi: "Kya darwaza todkar ghus ke chori karna alag jurm hai?"
  (Is breaking in and stealing a separate offense?)
- AI understands intent, searches English case law, returns results with Hindi summaries
- Supports: Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia

#### 4.5.3 IPC-to-BNS Section Mapper

**How it works**:
- Critical during the transition period (2024-2030+)
- Input: "Section 302 IPC"
- Output: "Now Section 103 BNS (Bharatiya Nyaya Sanhita, 2023). Key differences: [none/minor/major]. Cases filed under IPC continue under IPC. New cases use BNS."
- Reverse mapping also works
- Shows both old and new section precedents

#### 4.5.4 Auto-Draft Generator

**How it works**:
1. Lawyer selects document type:
   - Bail Application (Regular / Anticipatory / Default / 436A)
   - Written Statement
   - Written Arguments
   - Criminal Appeal
   - Writ Petition
   - Complaint under 156(3)
   - Quashing Petition under 482
2. Inputs case-specific facts
3. AI generates first draft with:
   - Proper formatting for the target court
   - Relevant precedents auto-inserted
   - Arguments structured per court practice
   - Prayer clause with standard reliefs
4. Lawyer reviews, edits, and finalizes

**Not a replacement for lawyers** -- a first-draft generator that saves 2-3 hours per document.

---

### MODULE 6: INVESTIGATION MANAGEMENT (Police)

**Problem it solves**: CCTNS is broken. 60% of arrests are unnecessary. Chargesheets routinely miss deadlines. Case diaries are manual. Evidence gets lost.

#### 4.6.1 Case Dashboard with Deadline Countdown

**How it works**:
- IO logs in and sees ALL their active cases
- Each case shows:
  - FIR number, date, sections, accused status (arrested/bailed/absconding)
  - **CHARGESHEET COUNTDOWN**: Bold timer showing days remaining
    - Green: 60+ days remaining
    - Yellow: 30-60 days remaining
    - Orange: 15-30 days remaining
    - Red: <15 days remaining
    - Black/Flashing: OVERDUE -- accused eligible for default bail
  - Investigation completion percentage (based on checklist)
  - Last activity date (flags stale investigations)

#### 4.6.2 Investigation Playbook per IPC Section

**How it works**:
- For each combination of IPC sections in an FIR, AI generates a customized investigation checklist:

**Example: FIR under Section 302 (Murder)**
```
INVESTIGATION CHECKLIST:
[ ] Scene of crime visit and panchnama
[ ] Photographs and videography of scene
[ ] Post-mortem report (send body within 24 hours)
[ ] Inquest report under Section 174 CrPC
[ ] Statements of all eyewitnesses (161 CrPC)
[ ] Statement of complainant/informant
[ ] Statement of last person to see deceased alive
[ ] Motive investigation -- property dispute? personal enmity? financial?
[ ] CDR analysis of accused and deceased (last 30 days)
[ ] CCTV footage collection (radius: 500m from scene)
[ ] Tower dump analysis (cell towers near scene, time of incident)
[ ] Weapon recovery and FSL referral
[ ] Blood/DNA sample collection and FSL referral
[ ] Fingerprint lifting from scene
[ ] Digital evidence: social media, messages, emails
[ ] Financial records if money motive suspected
[ ] Arrest memo with proper documentation
[ ] Identification parade (TIP) if witness-based identification
[ ] Supplementary statements as investigation progresses
[ ] Section 164 CrPC statement of key witnesses before Magistrate
[ ] File chargesheet by Day 90 (deadline: [auto-calculated date])
```

Each item has:
- Legal basis (which section of CrPC requires it)
- Best practice notes
- Common mistakes to avoid
- Evidence that courts expect to see

#### 4.6.3 Digital Case Diary

**How it works**:
- Mobile app for IOs to maintain case diary digitally
- Each entry: Date, time (auto), location (GPS auto), activity, persons contacted, findings
- Photo/document attachment capability
- Cannot be backdated (blockchain-style timestamping)
- Auto-generates the formal case diary format for court submission
- Supervisor (SHO/DSP) can review entries remotely

#### 4.6.4 Evidence Chain-of-Custody Tracker

**How it works**:
1. When evidence is collected:
   - IO photographs it in situ
   - Assigns a unique evidence ID (QR code)
   - Logs: Who collected, when, where, witnesses present
2. Every transfer logged:
   - IO -> Malkhana (evidence room)
   - Malkhana -> FSL
   - FSL -> Court
3. Any gap in chain flagged immediately
4. Court can verify complete chain via QR code scan

#### 4.6.5 Duplicate FIR Detector

**How it works**:
- When new FIR is being registered, system checks:
  - Similar incident description within same PS jurisdiction (last 30 days)
  - Same accused name across district
  - Same location + time pattern
- Flags potential duplicates for SHO review
- Also identifies serial offenders: "This accused has 3 other FIRs in neighboring police stations"

#### 4.6.6 SHO/DSP Command Dashboard

**How it works**:
- Aggregate view of all cases across station(s)
- Key metrics:
  - Cases approaching chargesheet deadline
  - Stalled investigations (no activity in 15+ days)
  - Arrest vs. non-arrest ratio
  - Chargesheet filing rate
  - Case disposal rate vs. district average
- Anomaly alerts:
  - "IO [name] has 5 cases with no activity in 20+ days"
  - "FIR [number] has 3 adjournments due to IO absence"
  - "Chargesheet deadline missed for 2 cases this month"

---

### MODULE 7: CROSS-SYSTEM INTELLIGENCE (Platform-wide)

**Problem it solves**: Police, courts, and prisons operate in complete silos. No single view of a case exists across the justice chain.

#### 4.7.1 Case Lifecycle Tracker

**How it works**:
- Single timeline view from FIR to final disposal:
  ```
  FIR Filed (Day 0) -> Investigation -> Chargesheet (Day 87) ->
  Cognizance (Day 120) -> Charge Framing (Day 200) ->
  Prosecution Evidence (Day 200-500) -> Defense Evidence (Day 500-700) ->
  Arguments (Day 700-800) -> Judgment (Day 850)
  ```
- At each stage, shows:
  - Current status
  - Expected duration (based on historical data for this court + section)
  - Deadlines
  - Responsible party (IO / Prosecutor / Defense / Court)
  - Bottleneck identification: "Case has been at evidence stage for 400 days. Average is 180 days."

#### 4.7.2 Undertrial Release Alert System

**How it works**:
- Continuously monitors all undertrial cases in the system
- Auto-flags when ANY of these conditions are met:
  1. Chargesheet not filed within statutory period (default bail eligible)
  2. Undertrial has served half of maximum sentence (436A eligible)
  3. Undertrial is in jail for bailable offense (should not be in jail at all)
  4. Bail granted but not released (surety bond issue)
  5. Case involves minor offense but person has been in jail 1+ year
- Sends alerts to: Legal aid lawyer, DLSA, prison superintendent, relevant court
- Generates ready-to-file bail applications

**Impact**: This single feature could free thousands of people who are illegally imprisoned.

#### 4.7.3 Recidivism & Pattern Detection

**How it works**:
- Tracks accused persons across cases
- Flags: "This person has been accused in 5 theft cases across 3 districts"
- Identifies: Geographic crime hotspots, time-of-day patterns, MO similarities
- For police: "3 similar burglaries in Koramangala this month -- possibly same gang. Compare MOs."
- For courts: Prior case history of accused for bail/sentencing consideration

---

### MODULE 8: WHATSAPP BOT (Citizens -- Mass Access)

**Problem it solves**: 75% of rural citizens don't know about legal aid. Smartphone app adoption is slow. But EVERYONE uses WhatsApp.

#### 4.8.1 WhatsApp Interface

**How it works**:
- Citizens message the Nyaya WhatsApp number
- Available commands (in Hindi/English/regional):
  ```
  1. "Meri complaint" / "My complaint" -> FIR Filing Assistant
  2. "Bail check" / "Zamanat" -> Bail Eligibility Calculator
  3. "Case status" -> Case Explainer (enter CNR number)
  4. "Vakeel chahiye" / "Need lawyer" -> Lawyer Finder
  5. "Rights" / "Mere adhikaar" -> Know Your Rights guides
  6. "Emergency" -> Nearest police station, women's helpline, legal aid
  ```
- Conversational AI in user's language
- Document sharing via WhatsApp (photos of orders, FIRs)
- Voice message support (for low-literacy users)

**Why WhatsApp**: 500M+ users in India. Zero download friction. Works on cheap phones. Already trusted.

---

## 5. Data Architecture

### 5.1 Data Sources

| Source | Data | Access Method | Reliability |
|--------|------|---------------|-------------|
| eCourts (ecourts.gov.in) | Case status, hearing dates, orders | API + scraping | Medium (data quality issues) |
| Indian Kanoon | Case law, judgments | API (token-based) | Medium (scraping errors possible) |
| NCRB | Crime statistics, prison data | Published reports (2yr delay) | Low (outdated) |
| Bare Acts | IPC, BNS, CrPC, BNSS text | Static database | High |
| IPC-BNS Mapping | Section equivalence table | Static database | High |
| Police Station Geo-DB | Station locations, jurisdictions | Government data + OSM | Medium |
| User Uploads | FIRs, orders, chargesheets | Direct upload | High |

### 5.2 Database Schema (Extended)

```
-- Core tables
users (id, name, phone, email, role, language, state, district, created_at)
firs (id, user_id, fir_number, ps, district, state, date_filed, sections, description, ...)
cases (id, fir_id, cnr_number, court, judge, stage, next_date, ...)
analyses (id, fir_id, similar_cases, ai_analysis, ...)

-- Bail module
bail_checks (id, fir_id, accused_name, arrest_date, sections, chargesheet_date,
             max_sentence, time_served, default_bail_eligible, s436a_eligible, ...)

-- Lawyer module
lawyers (id, name, bar_council_id, courts, sections_expertise, languages, rating, ...)
hearing_schedule (id, case_id, lawyer_id, date, court, bench, purpose, outcome, ...)
client_updates (id, case_id, lawyer_id, update_text, language, sent_via, sent_at, ...)

-- Police module
investigations (id, fir_id, io_id, chargesheet_deadline, status, completion_pct, ...)
case_diary_entries (id, investigation_id, date, time, location, activity, attachments, ...)
evidence_items (id, investigation_id, type, description, collected_by, collected_at,
                current_custodian, chain_of_custody_log, ...)

-- Cross-system
case_lifecycle (id, fir_id, stage, entered_at, expected_duration, actual_duration, ...)
alerts (id, case_id, type, severity, message, target_user, acknowledged, ...)
```

### 5.3 AI Pipeline

```
User Input (text/voice/PDF/image)
     |
     v
Language Detection -> Translation (if needed)
     |
     v
Intent Classification
  - FIR filing query
  - Bail eligibility check
  - Case status lookup
  - Legal research query
  - Document analysis
     |
     v
Entity Extraction
  - IPC/BNS sections
  - Dates, names, locations
  - Court names, case numbers
     |
     v
Domain-Specific Processing
  - Section database lookup
  - eCourts API call
  - Indian Kanoon search
  - Bail calculation engine
     |
     v
Claude AI Analysis
  - Structured prompt with extracted entities + retrieved context
  - JSON response with analysis, recommendations, drafts
     |
     v
Response Generation
  - Translate to user's language
  - Format for channel (web/WhatsApp/app)
  - Attach generated documents (PDF drafts)
     |
     v
User receives response
```

---

## 6. Technical Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI (async, high-performance)
- **Database**: PostgreSQL (production) / SQLite (dev)
- **ORM**: SQLAlchemy 2.0
- **Task Queue**: Celery + Redis (for async AI calls, scraping)
- **Search**: PostgreSQL full-text search (MVP) -> Elasticsearch (scale)

### AI/ML
- **Primary LLM**: Claude API (anthropic SDK) -- legal analysis, drafting, summarization
- **Embeddings**: Voyage AI or OpenAI embeddings -- semantic search
- **Vector DB**: pgvector (PostgreSQL extension) -- precedent similarity
- **OCR**: Tesseract + PaddleOCR (for handwritten Hindi FIRs)
- **Speech-to-Text**: Whisper (for voice input in WhatsApp bot)

### Frontend
- **Web**: React + Vite + Tailwind CSS
- **Mobile**: React Native or Flutter (Phase 2)
- **WhatsApp**: WhatsApp Business API via Twilio/Gupshup

### Infrastructure
- **Hosting**: AWS / Railway (MVP) -> AWS ECS (production)
- **CDN**: CloudFront
- **Monitoring**: Sentry + PostHog
- **CI/CD**: GitHub Actions

### Data Ingestion
- **eCourts Scraper**: Python + Playwright (headless browser)
- **Indian Kanoon**: Official API + fallback scraper
- **Cause List Scraper**: Per-court scrapers (cause lists published daily as PDFs)

---

## 7. Phased Rollout

### Phase 1: MVP (Weeks 1-4) -- CURRENT
**What we have**: FIR upload, PDF parsing, Indian Kanoon search, Claude analysis
**Add**:
- Bail Eligibility Calculator (high-impact, low-complexity)
- IPC-BNS Section Mapper (static database, very useful)
- Plain Language Case Explainer (eCourts integration)
- Seed data expansion (50+ sample cases covering all major IPC sections)
- Basic WhatsApp bot (FIR assistant + bail check)

**Target users**: Citizens, legal aid lawyers
**Success metric**: 100 bail eligibility checks, 50 FIR drafts generated

### Phase 2: Lawyer Tools (Weeks 5-10)
- Smart Hearing Tracker with cause list scraping (start with Delhi courts)
- Auto Client Update generator
- Semantic case search with vector embeddings
- Auto-Draft generator (bail applications first)
- Deadline & limitation tracker

**Target users**: Litigation lawyers in Delhi
**Success metric**: 50 active lawyer users, 500 hearings tracked

### Phase 3: Police Module (Weeks 11-16)
- Investigation Dashboard with chargesheet countdown
- Digital Case Diary
- Investigation Playbook per IPC section
- Evidence chain-of-custody tracker
- Duplicate FIR detector

**Target users**: Police stations (pilot with 2-3 stations)
**Success metric**: 10 IOs using daily, 100% chargesheet deadline compliance in pilot stations

### Phase 4: Scale (Weeks 17-24)
- WhatsApp bot public launch
- Regional language support (Hindi + 4 more languages)
- Cross-system intelligence (case lifecycle tracker)
- Undertrial release alert system
- Mobile app (React Native)
- Expand cause list scraping to all major courts

**Target users**: National
**Success metric**: 10,000 monthly active users, 500 bail applications generated

### Phase 5: Platform (Months 7-12)
- Lawyer marketplace with verified outcomes
- Legal aid integration (NALSA/DLSA partnership)
- Government dashboard (for district legal services authorities)
- API for third-party integrations
- Predictive analytics (case duration, outcome probability)

---

## 8. Competitive Landscape

| Product | What it does | Gap Nyaya fills |
|---------|-------------|-----------------|
| Indian Kanoon | Free case law search | No relevance ranking, no vernacular, no analysis |
| SCC Online | Paid case law database | Expensive (Rs 30,000+/yr), no AI analysis |
| Manupatra | Paid legal research | Same as SCC. No case management. |
| LegitQuest | AI-powered legal search | Expensive, English only, no citizen-facing features |
| Vakil Search | Lawyer directory | No outcome data, no case management |
| eCourts | Government case status | Raw data, no plain language, no analysis |
| CaseMine | AI case search | No Indian language support, no FIR/bail features |
| MyAdvo | Lawyer marketplace | No AI features, limited verification |
| CCTNS | Police case management | Crash-prone, no AI, no deadline tracking |

**Nyaya's moat**: First platform to serve ALL three stakeholders (citizen + lawyer + police) with AI across the FULL case lifecycle (FIR -> investigation -> bail -> trial -> resolution) in VERNACULAR languages.

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI hallucination on legal advice | CRITICAL | Always show source citations. Disclaimer: "This is information, not legal advice." Human lawyer review for high-stakes outputs (bail apps). |
| eCourts scraping blocked | HIGH | Build official relationship with eCourts. Cache data. Fallback to manual case number entry. |
| Indian Kanoon API limits | MEDIUM | Rate limiting, caching, build own judgment database over time. |
| Police department resistance | HIGH | Start with tech-forward states (Telangana, Karnataka). Build for IO benefit first (deadline tracking saves them). |
| Data privacy / DPDPA compliance | HIGH | Encrypt all PII. User consent for data storage. Data deletion on request. No sharing across users. |
| Legal liability for AI-generated drafts | HIGH | Clear disclaimers. Drafts marked as "template -- review by lawyer required." No unauthorized practice of law. |
| WhatsApp Business API costs at scale | MEDIUM | Freemium model. Limit free messages. Sponsored messages for monetization. |
| Low tech literacy of target users | HIGH | Voice-first interface. Minimal text input. WhatsApp as primary channel. |
| Accuracy of bail calculations | CRITICAL | Double-check logic against bare act text. Unit tests for every section/deadline combination. Legal review of calculator logic. |

---

## 10. Success Metrics

### Impact Metrics (What Actually Matters)
- Number of undertrials identified as eligible for release
- Number of bail applications generated that led to actual release
- Number of citizens who filed FIRs after being initially refused (using our tools)
- Average time saved per lawyer per week on research and client updates
- Chargesheet deadline compliance rate in pilot police stations

### Product Metrics
- Monthly Active Users (MAU) by role
- Bail checks performed / month
- FIR drafts generated / month
- AI analyses completed / month
- Lawyer hearings tracked / month
- Client updates sent / month
- WhatsApp conversations / month

### Quality Metrics
- AI analysis accuracy (human review sample)
- Bail eligibility calculation accuracy (100% target -- no room for error)
- User satisfaction (NPS by role)
- Document draft acceptance rate (% used without major edits)

---

## 11. Team Requirements

### Phase 1-2 (MVP + Lawyer Tools)
- 1 Full-stack developer (Python/React)
- 1 AI/ML engineer (prompt engineering, embeddings, RAG)
- 1 Legal domain expert (practicing lawyer, ideally criminal law)
- 1 Product designer (mobile-first, multi-language UI)

### Phase 3+ (Police Module + Scale)
- +1 Backend engineer (scraping, data pipelines)
- +1 Mobile developer (React Native)
- +1 DevOps/Infrastructure
- +1 Legal aid coordinator (NGO/DLSA relationships)
- +1 Hindi/Regional language QA

---

*Document authored: April 2026*
*Status: Living document -- will be updated as features are built and user feedback is incorporated*
