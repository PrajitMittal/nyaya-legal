/**
 * Bail eligibility calculator — ported from backend/services/ipc_database.py
 * Runs entirely in the browser. No API call needed.
 */
import { getSection } from '../data/ipcSections';

export function calculateBailEligibility(sections, arrestDateStr, chargesheetFiled, chargesheetDateStr = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arrestDate = new Date(arrestDateStr);
  arrestDate.setHours(0, 0, 0, 0);
  const daysInCustody = Math.floor((today - arrestDate) / (1000 * 60 * 60 * 24));

  let maxPunishment = 0;
  let allBailable = true;
  const sectionDetails = [];

  for (const secNum of sections) {
    const sec = getSection(secNum.trim());
    if (sec) {
      sectionDetails.push({
        section: secNum.trim(),
        name: sec.name,
        max_years: sec.maxYears,
        bailable: sec.bailable,
        punishment: sec.punishment,
      });
      if (sec.maxYears && sec.maxYears > maxPunishment) maxPunishment = sec.maxYears;
      if (sec.bailable === false) allBailable = false;
    }
  }

  const chargesheetDeadlineDays = (maxPunishment > 10 || maxPunishment >= 99) ? 90 : 60;

  const result = {
    sections_analysis: sectionDetails,
    days_in_custody: daysInCustody,
    max_punishment_years: maxPunishment,
    all_offenses_bailable: allBailable,
    chargesheet_deadline_days: chargesheetDeadlineDays,
    eligibility: [],
  };

  // 1. Bailable offenses
  if (allBailable) {
    result.eligibility.push({
      type: "Bailable Offense",
      eligible: true,
      urgency: "IMMEDIATE",
      explanation: "All charged sections are bailable offenses. Bail is a MATTER OF RIGHT under Section 436 CrPC. The police station itself should have granted bail. You do not need court permission.",
      legal_basis: "Section 436 CrPC / Section 478 BNSS",
      action: "Apply for bail at the police station. If refused, apply before the Magistrate. Bail CANNOT be denied for bailable offenses.",
      precedent: "Rasiklal v. Kishore (2009) - Bail in bailable offenses is a right, not a privilege.",
    });
  }

  // 2. Default bail (Section 167(2) CrPC)
  if (!chargesheetFiled) {
    const deadlineDate = new Date(arrestDate);
    deadlineDate.setDate(deadlineDate.getDate() + chargesheetDeadlineDays);
    const daysRemaining = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      result.eligibility.push({
        type: "Default Bail (Chargesheet not filed)",
        eligible: true,
        urgency: "IMMEDIATE",
        overdue_by_days: Math.abs(daysRemaining),
        explanation: `Chargesheet has NOT been filed within the mandatory ${chargesheetDeadlineDays}-day period. The accused has an INDEFEASIBLE RIGHT to default bail under Section 167(2) CrPC. This right CANNOT be taken away even if chargesheet is filed after the deadline. The accused must apply for default bail BEFORE the chargesheet is filed.`,
        legal_basis: "Section 167(2) CrPC / Section 187 BNSS",
        action: "File default bail application IMMEDIATELY before the Magistrate. Mention that the statutory period has expired and the right to default bail has accrued.",
        precedent: "Uday Mohanlal Acharya v. State of Maharashtra (2001) - Default bail is an indefeasible right. Sayed Mohammad Ahmad Kazmi v. State (GNCTD) (2012) - Right accrues even if chargesheet filed later.",
        draft_available: true,
      });
    } else {
      result.eligibility.push({
        type: "Default Bail (Chargesheet not filed)",
        eligible: false,
        urgency: "WATCH",
        days_remaining: daysRemaining,
        deadline_date: deadlineDate.toISOString().split('T')[0],
        explanation: `Chargesheet deadline is ${chargesheetDeadlineDays} days from arrest. ${daysRemaining} days remaining. If police don't file chargesheet by ${deadlineDate.toISOString().split('T')[0]}, the accused will have an indefeasible right to default bail.`,
        legal_basis: "Section 167(2) CrPC / Section 187 BNSS",
        action: `Monitor closely. Mark ${deadlineDate.toISOString().split('T')[0]} on calendar. If no chargesheet by that date, file default bail application IMMEDIATELY.`,
      });
    }
  }

  // 3. Section 436A — half of maximum sentence
  if (maxPunishment > 0 && maxPunishment < 99) {
    const halfSentenceDays = Math.floor(maxPunishment * 365 / 2);
    const daysRemaining436a = halfSentenceDays - daysInCustody;

    if (daysRemaining436a <= 0) {
      result.eligibility.push({
        type: "Section 436A Release (Half Sentence Served)",
        eligible: true,
        urgency: "IMMEDIATE",
        explanation: `The accused has served ${daysInCustody} days in custody, which exceeds HALF of the maximum sentence (${maxPunishment} years = ${maxPunishment * 365} days, half = ${halfSentenceDays} days). Under Section 436A CrPC, the accused MUST be released on personal bond. This is MANDATORY — the court has no discretion to refuse.`,
        legal_basis: "Section 436A CrPC / Section 479 BNSS",
        action: "File application under Section 436A before the trial court. The court SHALL release the accused on personal bond with or without sureties.",
        precedent: "Bhim Singh v. Union of India (2015) - Supreme Court directed release of all undertrials who have served half of maximum sentence. Hussainara Khatoon v. State of Bihar (1979) - Right to speedy trial is a fundamental right.",
        draft_available: true,
      });
    } else if (daysRemaining436a <= 30) {
      const eligDate = new Date(arrestDate);
      eligDate.setDate(eligDate.getDate() + halfSentenceDays);
      result.eligibility.push({
        type: "Section 436A Release (Half Sentence Served)",
        eligible: false,
        urgency: "APPROACHING",
        days_remaining: daysRemaining436a,
        eligibility_date: eligDate.toISOString().split('T')[0],
        explanation: `The accused will become eligible for mandatory release under Section 436A in ${daysRemaining436a} days. Half of maximum sentence = ${halfSentenceDays} days. Currently served: ${daysInCustody} days.`,
        legal_basis: "Section 436A CrPC / Section 479 BNSS",
        action: "Prepare application now. File on the eligibility date.",
      });
    }
  }

  // 4. Life imprisonment note
  if (maxPunishment >= 99) {
    result.eligibility.push({
      type: "Section 436A Note",
      eligible: false,
      urgency: "INFO",
      explanation: "For offenses punishable with death or life imprisonment, Section 436A does not automatically apply. However, if the accused has been in custody for a period exceeding the average sentence awarded by courts, a bail application can still be made citing undue delay and right to speedy trial under Article 21.",
      legal_basis: "Article 21 of Constitution, Section 436A proviso",
      action: "Apply for regular bail citing delay in trial and Article 21 rights. Cite period already served as a strong ground.",
    });
  }

  // 5. Summary
  const hasImmediate = result.eligibility.some(e => e.urgency === "IMMEDIATE");
  result.summary = {
    immediate_action_required: hasImmediate,
    strongest_ground: result.eligibility.find(e => e.eligible)?.type || "Regular bail application",
    recommendation: hasImmediate
      ? "FILE BAIL APPLICATION IMMEDIATELY - Strong legal grounds exist!"
      : "Monitor deadlines and prepare bail application.",
  };

  return result;
}
