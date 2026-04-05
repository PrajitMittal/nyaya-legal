/**
 * Legal rights data — ported from backend/routers/tools.py
 * Runs entirely in the browser. No API call needed.
 */

export const RIGHTS_DATA = {
  arrest: {
    title: "Your Rights When Arrested",
    rights: [
      {
        right: "Right to know grounds of arrest",
        detail: "Under Article 22(1) of the Constitution and Section 50 CrPC, the police MUST inform you of the grounds of arrest immediately.",
        what_to_do: "Ask the police officer: 'Why am I being arrested? Under which sections?'",
      },
      {
        right: "Right to inform someone",
        detail: "Under Section 50A CrPC, the police MUST inform a family member or friend of your arrest and the place of detention.",
        what_to_do: "Insist that the police call your family member immediately. Give them the number.",
      },
      {
        right: "Right to a lawyer",
        detail: "Under Article 22(1) of the Constitution, you have the right to consult a legal practitioner of your choice from the moment of arrest.",
        what_to_do: "Say: 'I want to speak to my lawyer before saying anything.' Do not sign any document without legal advice.",
      },
      {
        right: "Right to free legal aid",
        detail: "Under Section 304 CrPC and Article 39A, if you cannot afford a lawyer, the state MUST provide one free of charge.",
        what_to_do: "Tell the Magistrate: 'I cannot afford a lawyer. I need free legal aid.'",
      },
      {
        right: "Must be produced before Magistrate within 24 hours",
        detail: "Under Article 22(2) and Section 57 CrPC, you must be produced before the nearest Magistrate within 24 hours of arrest (excluding travel time).",
        what_to_do: "Note the time of arrest. If 24 hours pass without being taken to court, it's illegal detention.",
      },
      {
        right: "Right against torture and inhuman treatment",
        detail: "Under Article 21, no person can be subjected to torture, cruel, or degrading treatment. Police CANNOT beat you, threaten you, or force a confession.",
        what_to_do: "If tortured, tell the Magistrate immediately. Ask for a medical examination. File complaint with NHRC.",
      },
      {
        right: "Right to medical examination",
        detail: "Under Section 54 CrPC, you have the right to be medically examined to record injuries.",
        what_to_do: "Request medical examination at the time of arrest, especially if you have any existing injuries.",
      },
      {
        right: "Right to silence",
        detail: "Under Article 20(3) of the Constitution, no person accused of an offense can be compelled to be a witness against themselves.",
        what_to_do: "You can refuse to answer questions that may incriminate you. Say: 'I will answer in the presence of my lawyer.'",
      },
      {
        right: "Women: Cannot be arrested after sunset and before sunrise",
        detail: "Under Section 46(4) CrPC, a woman cannot be arrested after sunset and before sunrise except in exceptional circumstances with a written order from a first class Magistrate.",
        what_to_do: "If you are a woman being arrested at night, ask for the Magistrate's written order.",
      },
    ],
    emergency_contacts: {
      police: "100",
      women_helpline: "1091 / 181",
      nhrc: "14433",
      legal_aid: "15100 (NALSA)",
      child_helpline: "1098",
    },
  },
  fir: {
    title: "Your Rights When Filing an FIR",
    rights: [
      {
        right: "FIR registration is mandatory for cognizable offenses",
        detail: "Under Lalita Kumari v. State of UP (2014), police MUST register FIR. No preliminary inquiry allowed for cognizable offenses.",
        what_to_do: "Clearly state the facts. Insist on an FIR, not just a 'complaint' or 'DD entry'.",
      },
      {
        right: "Zero FIR - File anywhere",
        detail: "You can file an FIR at ANY police station in India regardless of jurisdiction.",
        what_to_do: "Go to the nearest police station. Don't let them send you elsewhere.",
      },
      {
        right: "Free copy of FIR",
        detail: "You are entitled to a free copy immediately.",
        what_to_do: "Ask for the FIR copy before leaving the police station.",
      },
      {
        right: "FIR in your language",
        detail: "The FIR can be written in any language. You can dictate in your language.",
        what_to_do: "Speak in the language you are comfortable with.",
      },
      {
        right: "Read before signing",
        detail: "The FIR must be read back to you before you sign it.",
        what_to_do: "Listen carefully. Correct any mistakes. Do not sign if the facts are wrong.",
      },
    ],
  },
  bail: {
    title: "Your Rights Regarding Bail",
    rights: [
      {
        right: "Bail is the rule, jail is the exception",
        detail: "The Supreme Court has repeatedly held that bail should be the norm. State of Rajasthan v. Balchand (1977): 'The basic rule is bail, not jail.'",
        what_to_do: "Apply for bail at the earliest opportunity.",
      },
      {
        right: "Bailable offenses: Bail is a RIGHT",
        detail: "For bailable offenses, bail CANNOT be refused. The police station itself can grant bail.",
        what_to_do: "For bailable offenses, tell the police: 'I am applying for bail. This is a bailable offense.'",
      },
      {
        right: "Default bail if chargesheet not filed on time",
        detail: "If police don't file chargesheet within 60/90 days, you get automatic bail.",
        what_to_do: "Count the days from arrest. Apply for default bail the day the deadline passes.",
      },
      {
        right: "Release if served half of maximum sentence (436A)",
        detail: "If you've served half the maximum sentence as an undertrial, you MUST be released on personal bond.",
        what_to_do: "Calculate half of maximum sentence. Apply under Section 436A.",
      },
      {
        right: "Cannot be denied bail due to poverty",
        detail: "Moti Ram v. State of MP (1978): Bail conditions should not be so onerous that the poor cannot meet them.",
        what_to_do: "If bail is granted but you can't afford surety, apply for personal bond.",
      },
    ],
  },
  search: {
    title: "Your Rights During a Police Search",
    rights: [
      {
        right: "Search warrant required for private premises",
        detail: "Under Section 93-98 CrPC, police generally need a search warrant from a Magistrate to search your home.",
        what_to_do: "Ask to see the search warrant. Note the warrant number and Magistrate's name.",
      },
      {
        right: "Search in presence of independent witnesses",
        detail: "Under Section 100 CrPC, search must be conducted in the presence of two independent witnesses from the locality.",
        what_to_do: "Insist on independent witnesses. Call your neighbors.",
      },
      {
        right: "Women: Search by woman officer only",
        detail: "Under Section 51(2) CrPC, search of a woman must be made by another woman with strict regard to decency.",
        what_to_do: "Refuse search by male officers. Request a woman officer.",
      },
      {
        right: "List of seized items",
        detail: "Police must prepare a detailed list (panchnama) of all items seized during the search.",
        what_to_do: "Insist on a panchnama. Read it. Get a copy. Note if anything is missing or incorrectly listed.",
      },
    ],
  },
};

export function getRights(situation) {
  return RIGHTS_DATA[situation.toLowerCase().trim()] || null;
}
