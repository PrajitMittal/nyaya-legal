/**
 * IPC/BNS Section Database — ported from backend/services/ipc_database.py
 * Powers: Bail Calculator, Section Mapper, FIR Assistant (offline)
 */

export const IPC_SECTIONS = {
  "302": { name: "Murder", bns: "103", punishment: "Death or life imprisonment + fine", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Murder", severity: "grave" },
  "304": { name: "Culpable Homicide not amounting to Murder", bns: "105", punishment: "Life imprisonment or up to 10 years + fine", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Culpable Homicide", severity: "grave" },
  "304A": { name: "Death by Negligence", bns: "106", punishment: "Up to 2 years + fine, or both", maxYears: 2, bailable: true, cognizable: true, compoundable: false, category: "Death by Negligence", severity: "moderate" },
  "304B": { name: "Dowry Death", bns: "80", punishment: "7 years to life imprisonment", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Dowry Death", severity: "grave" },
  "307": { name: "Attempt to Murder", bns: "109", punishment: "Up to 10 years + fine. If hurt caused, up to life imprisonment.", maxYears: 10, bailable: false, cognizable: true, compoundable: false, category: "Attempted Murder", severity: "grave" },
  "323": { name: "Voluntarily Causing Hurt", bns: "115", punishment: "Up to 1 year + fine up to Rs 1,000, or both", maxYears: 1, bailable: true, cognizable: false, compoundable: true, category: "Hurt", severity: "minor" },
  "325": { name: "Voluntarily Causing Grievous Hurt", bns: "117", punishment: "Up to 7 years + fine", maxYears: 7, bailable: true, cognizable: true, compoundable: true, category: "Grievous Hurt", severity: "moderate" },
  "354": { name: "Assault or Criminal Force on Woman", bns: "74", punishment: "1 to 5 years + fine", maxYears: 5, bailable: false, cognizable: true, compoundable: false, category: "Assault on Woman", severity: "moderate" },
  "376": { name: "Rape / Sexual Assault", bns: "63", punishment: "7 years to life imprisonment + fine", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Sexual Assault", severity: "grave" },
  "379": { name: "Theft", bns: "303", punishment: "Up to 3 years + fine, or both", maxYears: 3, bailable: true, cognizable: false, compoundable: true, category: "Theft", severity: "minor" },
  "380": { name: "Theft in Dwelling House", bns: "305(a)", punishment: "Up to 7 years + fine", maxYears: 7, bailable: false, cognizable: true, compoundable: false, category: "Theft", severity: "moderate" },
  "392": { name: "Robbery", bns: "309", punishment: "Up to 10 years + fine. If on highway: up to 14 years.", maxYears: 14, bailable: false, cognizable: true, compoundable: false, category: "Robbery", severity: "grave" },
  "395": { name: "Dacoity", bns: "310", punishment: "Up to life imprisonment + fine", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Dacoity", severity: "grave" },
  "406": { name: "Criminal Breach of Trust", bns: "316", punishment: "Up to 3 years + fine, or both", maxYears: 3, bailable: true, cognizable: false, compoundable: true, category: "Breach of Trust", severity: "minor" },
  "411": { name: "Dishonestly Receiving Stolen Property", bns: "317", punishment: "Up to 3 years + fine, or both", maxYears: 3, bailable: true, cognizable: false, compoundable: false, category: "Stolen Property", severity: "minor" },
  "420": { name: "Cheating and Dishonestly Inducing Delivery of Property", bns: "318", punishment: "Up to 7 years + fine", maxYears: 7, bailable: true, cognizable: true, compoundable: true, category: "Cheating / Fraud", severity: "moderate" },
  "467": { name: "Forgery of Valuable Security", bns: "336", punishment: "Up to 10 years + fine", maxYears: 10, bailable: false, cognizable: true, compoundable: false, category: "Forgery", severity: "grave" },
  "468": { name: "Forgery for Purpose of Cheating", bns: "337", punishment: "Up to 7 years + fine", maxYears: 7, bailable: false, cognizable: true, compoundable: false, category: "Forgery", severity: "moderate" },
  "471": { name: "Using Forged Document as Genuine", bns: "340", punishment: "Same as forgery of that document", maxYears: 7, bailable: false, cognizable: true, compoundable: false, category: "Forgery", severity: "moderate" },
  "498A": { name: "Cruelty by Husband or Relatives", bns: "85", punishment: "Up to 3 years + fine", maxYears: 3, bailable: true, cognizable: true, compoundable: false, category: "Cruelty by Husband", severity: "moderate" },
  "120B": { name: "Criminal Conspiracy", bns: "61", punishment: "Same as the offense conspired, or up to 6 months + fine", maxYears: 7, bailable: false, cognizable: true, compoundable: false, category: "Criminal Conspiracy", severity: "moderate" },
  "34": { name: "Common Intention", bns: "3(5)", punishment: "Not a standalone offense", maxYears: 0, bailable: null, cognizable: null, compoundable: null, category: "Common Intention", severity: "enhancer" },
  "506": { name: "Criminal Intimidation", bns: "351", punishment: "Up to 2 years + fine. If threat of death: up to 7 years.", maxYears: 7, bailable: true, cognizable: false, compoundable: true, category: "Criminal Intimidation", severity: "minor" },
  "509": { name: "Insulting Modesty of Woman", bns: "79", punishment: "Up to 3 years + fine", maxYears: 3, bailable: true, cognizable: true, compoundable: false, category: "Insulting Modesty", severity: "minor" },
  "279": { name: "Rash Driving on Public Way", bns: "281", punishment: "Up to 6 months + fine", maxYears: 0.5, bailable: true, cognizable: true, compoundable: true, category: "Rash Driving", severity: "minor" },
  "147": { name: "Rioting", bns: "189", punishment: "Up to 2 years + fine, or both", maxYears: 2, bailable: true, cognizable: true, compoundable: false, category: "Rioting", severity: "moderate" },
  "153A": { name: "Promoting Enmity Between Groups", bns: "196", punishment: "Up to 3 years + fine, or both", maxYears: 3, bailable: false, cognizable: true, compoundable: false, category: "Hate Speech", severity: "moderate" },
  "363": { name: "Kidnapping", bns: "137", punishment: "Up to 7 years + fine", maxYears: 7, bailable: false, cognizable: true, compoundable: false, category: "Kidnapping", severity: "grave" },
  "364A": { name: "Kidnapping for Ransom", bns: "140", punishment: "Death or life imprisonment + fine", maxYears: 99, bailable: false, cognizable: true, compoundable: false, category: "Kidnapping for Ransom", severity: "grave" },
};

export function getSection(sectionNumber) {
  return IPC_SECTIONS[String(sectionNumber).trim().toUpperCase()] || null;
}

export function getBnsEquivalent(ipcSection) {
  const sec = getSection(ipcSection);
  return sec ? sec.bns : null;
}

export function getIpcFromBns(bnsSection) {
  const bns = String(bnsSection).trim();
  for (const [ipc, data] of Object.entries(IPC_SECTIONS)) {
    if (data.bns === bns) return ipc;
  }
  return null;
}

export function getAllSectionsList() {
  return Object.entries(IPC_SECTIONS).map(([num, data]) => ({
    section: num,
    name: data.name,
    bns: data.bns,
    category: data.category,
  }));
}

export function mapIpcToBns(ipcSection) {
  const sec = getSection(ipcSection);
  if (!sec) return null;
  return {
    ipc_section: ipcSection,
    ipc_name: sec.name,
    bns_section: sec.bns,
    punishment: sec.punishment,
    bailable: sec.bailable,
    cognizable: sec.cognizable,
    key_change: "No substantive change in most sections. BNS reorganizes and renumbers the IPC.",
  };
}
