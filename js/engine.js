/* =====================================================================
   IBA-MBA Coach — analysis engine
   Implements the master prompt's Steps 1–10 with the labeled
   ASSUMPTION MODEL. Deterministic, no fabrication: unknowns stay null.
   ===================================================================== */
const ENGINE = (() => {
  "use strict";
  const NEG = 0.25;
  let chanceFactors = [];
  const num = (v) => (v === null || v === undefined || v === "" || isNaN(v)) ? null : +v;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- date helpers ---------- */
  const todayISO = () => { const d = new Date(); const p = (n)=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  function diffDays(a, b) { // a - b in days
    const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
    return Math.round((da - db) / 86400000);
  }
  function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); const p=(x)=>String(x).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }

  /* ---------- STEP 1: eligibility ---------- */
  function eligibility(S) {
    const p = S.profile, issues = [], risks = [], missing = [];
    const g = (v) => num(v);
    if (g(p.cgpa_4) === null && !p.second_class) missing.push("Bachelor's CGPA (or 2nd class declaration)");
    if (g(p.ssc_gpa) === null) missing.push("SSC GPA");
    if (g(p.hsc_gpa) === null) missing.push("HSC GPA");
    if (p.degree_type === "other") missing.push("Degree structure detail (4-year, or 3-year bachelor + 1-year master's)");
    if (p.oal_track) {
      if (g(p.o_subjects) === null || g(p.a_subjects) === null) missing.push("O/A Level subject counts");
      if (g(p.o_gpa) === null || g(p.a_gpa) === null) missing.push("O/A Level GPA");
    }
    let status = "ELIGIBLE";
    if (missing.length >= 3 || (g(p.cgpa_4) === null && !p.second_class && g(p.ssc_gpa) === null && g(p.hsc_gpa) === null)) status = "UNKNOWN";

    const cg = g(p.cgpa_4);
    if (cg !== null) {
      if (cg < 2.5) { status = "NOT ELIGIBLE"; issues.push(`Bachelor's CGPA ${cg} < 2.50/4.00 (or 2nd class) — last cycle rule [VERIFY].`); }
      else if (cg < 2.65 && !p.second_class) risks.push(`CGPA ${cg} is just above the 2.50 floor — borderline [VERIFY].`);
    }
    const s = g(p.ssc_gpa), h = g(p.hsc_gpa);
    [[ "SSC", s ], ["HSC", h ]].forEach(([k, v]) => {
      if (v !== null) {
        if (v < 3.0) { status = "NOT ELIGIBLE"; issues.push(`${k} GPA ${v} < 3.00/5.00 — last cycle rule [VERIFY].`); }
        else if (v < 3.2) risks.push(`${k} GPA ${v} is close to the 3.00 floor — keep documents ready [VERIFY].`);
      }
    });
    if (p.third_division) { status = "NOT ELIGIBLE"; issues.push("Third division/class at any level disqualifies (last cycle rule) [VERIFY]."); }
    if (p.oal_track) {
      const o = g(p.o_subjects), a = g(p.a_subjects), og = g(p.o_gpa), ag = g(p.a_gpa), c = g(p.c_or_better);
      if (o !== null && o < 5) { status = "NOT ELIGIBLE"; issues.push(`O Levels: ${o} subjects < minimum 5 [VERIFY].`); }
      if (a !== null && a < 2) { status = "NOT ELIGIBLE"; issues.push(`A Levels: ${a} subjects < minimum 2 [VERIFY].`); }
      if (og !== null && og < 2) { status = "NOT ELIGIBLE"; issues.push(`O Level GPA ${og} < 2.00 [VERIFY].`); }
      if (ag !== null && ag < 2) { status = "NOT ELIGIBLE"; issues.push(`A Level GPA ${ag} < 2.00 [VERIFY].`); }
      if (c !== null && c < 4) { status = "NOT ELIGIBLE"; issues.push(`Only ${c} subjects with grade C or better (minimum 4) [VERIFY].`); }
    }
    if (!p.ugc_approved) { if (status === "ELIGIBLE") status = "AT RISK"; issues.push("Degree must be UGC-approved — confirm equivalency."); }
    if (p.foreign_degree) { if (status === "ELIGIBLE") status = "AT RISK"; risks.push("Foreign certificates need IBA Equivalence Committee clearance; a strong GMAT/GRE may exempt the written test but viva still applies [VERIFY]."); }
    if (p.degree_type === "other" || p.degree_type === "3yr") risks.push("Bachelor's must be 4 years, or 3-year bachelor + 1-year master's [VERIFY].");
    if (S.official_circular && S.official_circular.verified_on) issues.push(""); // no-op keeps shape simple
    return { status, issues: issues.filter(Boolean), risks, missing, verifyNote: "Rules above are from the LAST CONFIRMED cycle (2025-26). Always check the current official circular." };
  }

  /* ---------- STEP 2: normalize mocks ---------- */
  function netOf(sec) {
    if (!sec) return null;
    const d = num(sec.direct);
    if (d !== null) return d;
    const c = num(sec.correct), w = num(sec.wrong);
    if (c === null && w === null) return null;
    return (c || 0) - NEG * (w || 0);
  }
  function normalizeMock(m) {
    const engMax = 30, anaMax = 15, mathMax = num(m.mathMax) || 25, wriMax = 30;
    const e = netOf(m.eng), ma = netOf(m.math), an = netOf(m.ana), w = num(m.writing);
    const att = (s) => (s && num(s.correct) !== null) ? (num(s.correct) || 0) + (num(s.wrong) || 0) : null;
    const pct = (net, max) => net === null ? null : clamp(net / max * 100, 0, 100);
    const secPct = (net, max, s) => {
      const a = att(s);
      return { net, max, pct: pct(net, max), att: a, acc: (a && num(s.correct) !== null && a > 0) ? (num(s.correct) || 0) / a : null,
               loss: (s && num(s.wrong)) ? (num(s.wrong) || 0) * NEG : 0 };
    };
    const E = secPct(e, engMax, m.eng), M = secPct(ma, mathMax, m.math), AN = secPct(an, anaMax, m.ana);
    const mcqNet = [E.net, M.net, AN.net].every(x => x === null) ? null : (E.net||0)+(M.net||0)+(AN.net||0);
    const mcqAtt = [E.att, M.att, AN.att].every(x => x === null) ? null : (E.att||0)+(M.att||0)+(AN.att||0);
    const mcqCor = [E.att, M.att, AN.att].every(x => x === null) ? null :
      ((num(m.eng&&m.eng.correct)||0)+(num(m.math&&m.math.correct)||0)+(num(m.ana&&m.ana.correct)||0));
    return {
      id: m.id, date: m.date, type: m.type || "Full",
      eng: E, math: M, ana: AN,
      wri: { net: w, max: wriMax, pct: w === null ? null : clamp(w / wriMax * 100, 0, 100) },
      mcq: { net: mcqNet, max: 70, pct: pct(mcqNet, 70), att: mcqAtt, acc: (mcqAtt && mcqCor !== null && mcqAtt > 0) ? mcqCor / mcqAtt : null,
             loss: (E.loss||0)+(M.loss||0)+(AN.loss||0) },
      total: (mcqNet === null && w === null) ? null : (mcqNet||0) + (w||0),
      time: num(m.time_taken_min)
    };
  }

  /* ---------- STEP 4: trend ---------- */
  function trend(mocks, field) {
    const pts = mocks.slice(-5).map(field).filter(v => v !== null && v !== undefined);
    if (pts.length < 3) return "no data";
    const n = pts.length, xm = (n - 1) / 2, ym = pts.reduce((a, b) => a + b, 0) / n;
    let numr = 0, den = 0;
    pts.forEach((y, i) => { numr += (i - xm) * (y - ym); den += (i - xm) ** 2; });
    const slope = den ? numr / den : 0;
    return slope > 0.75 ? "up" : slope < -0.75 ? "down" : "flat";
  }

  /* ---------- topic stats, mastery, priorities (STEP 7) ---------- */
  function topicStats(S) {
    const agg = {};
    (S.practice || []).forEach(p => {
      if (!agg[p.topic_id]) agg[p.topic_id] = { attempted: 0, correct: 0, timeW: 0, timedAcc: null, untimedAcc: null };
      const a = agg[p.topic_id];
      a.attempted += num(p.attempted) || 0;
      a.correct += num(p.correct) || 0;
      a.timeW += (num(p.avg_time_sec) || 0) * (num(p.attempted) || 0);
      const acc = (num(p.correct) || 0) / Math.max(1, num(p.attempted) || 1);
      if (p.timed) { a.timedAcc = a.timedAcc === null ? acc : (a.timedAcc + acc) / 2; }
      else { a.untimedAcc = a.untimedAcc === null ? acc : (a.untimedAcc + acc) / 2; }
    });
    Object.values(agg).forEach(a => { a.acc = a.attempted ? a.correct / a.attempted : null; a.avg_time_sec = a.attempted ? Math.round(a.timeW / a.attempted) : null; });
    return agg;
  }
  function masteryOf(st) {
    if (!st || st.attempted < 10 || st.acc === null) return KB.MASTERY[0];
    const a = st.acc * 100;
    if (a > 85) return KB.MASTERY[4];
    if (a >= 70) return KB.MASTERY[3];
    if (a >= 50) return KB.MASTERY[2];
    if (a >= 20) return KB.MASTERY[1];
    return KB.MASTERY[0];
  }
  function priorities(S, tstats, mocks) {
    const secMarks = { eng: 30, math: num(S.math_marks) || 25, ana: 15, wri: 30 };
    const count = { eng: 0, math: 0, ana: 0, wri: 0 };
    KB.TAXONOMY.forEach(t => { if (count[t.sec] !== undefined) count[t.sec]++; });
    const rows = KB.TAXONOMY.filter(t => t.sec !== "viva").map(t => {
      const st = tstats[t.id] || null;
      const m = masteryOf(st);
      const marksShare = secMarks[t.sec] / count[t.sec];
      const weight = marksShare * t.tag * (1 - m.value);
      return { topic: t, st, mastery: m, weight, marksShare };
    });
    const total = rows.reduce((a, r) => a + r.weight, 0) || 1;
    const dailyMin = Math.max(45, (num(S.weekly_study_hours_available) || 10) * 60 / 7);
    const totalQ7 = Math.round(7 * clamp(dailyMin / 285, 0.3, 1.6) * 80);
    rows.forEach(r => {
      r.share = r.weight / total;
      r.targetQ = Math.max(10, Math.round(r.share * totalQ7 / 5) * 5);
      r.timeLimit = r.topic.pq || 0;
    });
    rows.sort((a, b) => b.weight - a.weight);
    return rows;
  }

  /* ---------- viva readiness ---------- */
  function vivaReadiness(S) {
    const v = S.viva || {};
    const iv = Math.min(1, (num(v.mock_interviews_done) || 0) / 4) * 40;
    const rt = clamp((num(v.self_rating_english_speaking) || 0) / 10, 0, 1) * 30;
    const sb = Math.min(1, ((v.story_bank || []).length) / 6) * 15;
    const ca = v.ca_habit ? 15 : 0;
    return Math.round(iv + rt + sb + ca);
  }

  /* ---------- writing estimate ---------- */
  function writingPct(S, mocks) {
    const w = weightedAvg(mocks, m => m.wri.pct);
    if (w !== null) return { pct: w, src: "mock" };
    const logs = S.writing_log || [];
    if (logs.length) {
      const tot = logs.slice(-3).reduce((a, l) => a + (l.scores ? (l.scores.relevance + l.scores.thesis + l.scores.evidence + l.scores.language + l.scores.coherence) : 0), 0);
      const max = logs.slice(-3).length * 15;
      return { pct: tot / max * 100, src: "self-rubric (Low confidence)" };
    }
    return { pct: null, src: "unknown — 30% of the test is unmeasured" };
  }

  /* ---------- STEP 10: pattern flags ---------- */
  function flags(S, tstats, mocks, cur, prior) {
    const out = [];
    const recent = mocks.slice(-3);
    const mockAcc = recent.map(m => m.mcq.acc).filter(v => v !== null);
    const prAcc = Object.values(tstats).map(t => t.acc).filter(v => v !== null);
    if (mockAcc.length && prAcc.length) {
      const mA = mockAcc.reduce((a, b) => a + b, 0) / mockAcc.length;
      const pA = prAcc.reduce((a, b) => a + b, 0) / prAcc.length;
      if (pA >= 0.85 && mA < 0.70) out.push({ id:"careless", sev:"warn", title:"Careless-error pattern", detail:`Untimed practice accuracy ${(pA*100).toFixed(0)}% but timed mock accuracy ${(mA*100).toFixed(0)}%.`, action:"Prescribe timed drills: 20-question sets at 45–60 sec/question." });
    }
    const sinks = Object.entries(tstats).filter(([id, t]) => t.avg_time_sec > 120 && t.attempted >= 5).map(([id]) => id);
    if (sinks.length) out.push({ id:"time_sink", sev:"warn", title:"Time sink", detail:`Topics over 2 min/question on average: ${sinks.join(", ")}.`, action:"Prescribe skipping drills — attempt, mark, return. Cap at 2 minutes per question." });
    const wrongs = recent.map(m => ({ att: m.mcq.att, acc: m.mcq.acc })).filter(x => x.att >= 20 && x.acc !== null);
    if (wrongs.length) {
      const wRate = wrongs.reduce((a, x) => a + (1 - x.acc), 0) / wrongs.length;
      if (wRate > 0.10) out.push({ id:"guessing", sev:"warn", title:"Guessing losses", detail:`${(wRate*100).toFixed(0)}% of attempted questions were wrong in recent mocks (target <10% in the final month).`, action:"Elimination practice: cross out clearly wrong options before choosing." });
    }
    const pcts = ["eng","math","ana"].map(s => cur[s]).filter(v => v !== null);
    if (pcts.length === 3) {
      const spread = Math.max(...pcts) - Math.min(...pcts);
      if (spread > 20) out.push({ id:"imbalance", sev:"warn", title:"Section imbalance", detail:`${Math.round(spread)} percentage points between strongest and weakest MCQ section. A failed gate cannot be compensated.`, action:"Shift daily minutes toward the weakest section until it crosses 55%." });
    }
    const hasWri = recent.some(m => m.wri.net !== null) || (S.writing_log || []).length > 0;
    if (mocks.length >= 2 && !hasWri) out.push({ id:"no_writing", sev:"danger", title:"No writing practice", detail:"30% of the test (Descriptive Writing) is unmeasured.", action:"One timed 15-minute piece per day from this week; self-score with the rubric." });
    const v = S.viva || {};
    if (!(v.mock_interviews_done) && !(v.story_bank || []).length && mocks.length >= 2) out.push({ id:"no_viva", sev:"info", title:"No viva practice yet", detail:"Viva runs in parallel and intensifies in weeks 3–4.", action:"Build the 6-story STAR bank; hold a mock interview every 5 days from week 3." });
    const stress = num(S.self_assessment && S.self_assessment.stress);
    if (stress !== null && stress >= 8) out.push({ id:"burnout", sev:"danger", title:"Burnout risk", detail:"Self-reported stress is 8+/10.", action:"Lighten the plan: keep mocks, cut drill volume. Talk to someone you trust. Never shame — progress reframing helps." });
    const wk = studyHours(S, 7), wkPrev = studyHours(S, 14, 7);
    if (wkPrev >= 5 && wk < wkPrev * 0.5) out.push({ id:"hours_drop", sev:"warn", title:"Study hours dropped", detail:`${wk.toFixed(1)}h this week vs ${wkPrev.toFixed(1)}h last week.`, action:"Check for blockers; reschedule around them rather than abandoning the plan." });
    return out;
  }
  function studyHours(S, uptoDays, fromDays = 0) {
    const today = todayISO();
    let h = 0;
    (S.study_log || []).forEach(l => { const d = diffDays(today, l.date); if (d > fromDays && d <= uptoDays) h += num(l.hours) || 0; });
    return h;
  }

  /* ---------- STEP 9: plan ---------- */
  function next7(S, prior, mocks) {
    const today = todayISO();
    const daysLeft = diffDays(S.exam_date, today);
    const top = prior.slice(0, 6);
    const dailyMin = Math.max(60, Math.round((num(S.weekly_study_hours_available) || 10) * 60 / 7));
    // mock cadence: diagnostic now if none; else last +7 days (or +3 in final 10)
    let mockDue = null;
    if (!mocks.length) mockDue = today;
    else {
      const last = mocks[mocks.length - 1].date;
      const gap = daysLeft <= 10 ? 3 : 7;
      const due = addDays(last, gap);
      if (diffDays(due, today) >= 0) mockDue = due;
    }
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const wd = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
      const isRest = wd === S.rest_day;
      const tasks = [];
      let minutes = isRest ? Math.min(60, dailyMin * 0.35) : dailyMin;
      if (date === mockDue) {
        tasks.push({ topic_id: null, name: "FULL MOCK (90-min MCQ + 30-min writing) + 60-min error review", minutes: 180, questions: 0, mock: true });
      } else if (isRest) {
        tasks.push({ topic_id: "eng_vocab_synonym_antonym", name: "Vocab review (spaced repetition)", minutes: 25, questions: 20 });
        tasks.push({ topic_id: null, name: "Error-log review", minutes: 20, questions: 0 });
        tasks.push({ topic_id: null, name: "Rest — light revision only", minutes: 15, questions: 0 });
      } else {
        // 55% top topics, 15% writing, 15% vocab/CA, 15% error review
        const tt = Math.round(minutes * 0.55), wr = Math.round(minutes * 0.15), ca = Math.round(minutes * 0.15), er = minutes - tt - wr - ca;
        const k = i % Math.max(2, Math.min(4, top.length));
        for (let j = 0; j < 3; j++) {
          const p = top[(k + j * 2) % top.length];
          const m = Math.round(tt / 3);
          if (m >= 10) tasks.push({ topic_id: p.topic.id, name: p.topic.name, minutes: m, questions: p.topic.pq ? Math.max(5, Math.round(m / p.topic.pq * 60)) : 0, tag: p.topic.tagLabel });
        }
        tasks.push({ topic_id: i % 2 === 0 ? "wri_structure" : "wri_argumentative", name: i % 2 === 0 ? "Essay: plan + PEEL outline" : "Timed 15-min essay + rubric self-score", minutes: wr, questions: i % 2 === 0 ? 0 : 1 });
        tasks.push({ topic_id: "eng_vocab_synonym_antonym", name: "Vocab (15–20 new words) + current affairs reading", minutes: ca, questions: 20 });
        tasks.push({ topic_id: null, name: "Error-log review & fixes", minutes: er, questions: 0 });
      }
      days.push({ date, weekday: wd, rest: isRest, mock: date === mockDue, tasks });
    }
    return { days, dailyMin, daysLeft, mockDue };
  }

  function weeklyPlan(S, daysLeft, prior) {
    const hrs = Math.round((num(S.weekly_study_hours_available) || 10));
    const compress = daysLeft < 30;
    const top3 = prior.slice(0, 3).map(p => p.topic.name).join(", ");
    const weeks = [
      { week: 1, focus: "Diagnose & build foundation", hours: hrs, tasks: [
        "Day 1: full timed diagnostic mock (90 + 30 min); analyze by topic; start the error log.",
        "English: error-spotting rules, sentence completion, vocab (15–20 words/day), 1 RC/day.",
        `Math: percentage, profit-loss, ratio, average, ages + daily mental-math tables. Weak-topic focus: ${top3}.`,
        "Analytical: seating & ordering puzzles (2–3 sets/day), intro to critical reasoning.",
        compress ? "COMPRESSED MODE: drop all P3 topics; halve P2 depth; keep every mock." : "End of week: sectional timed test + weekly review."
      ]},
      { week: 2, focus: "Core skills & timed practice", hours: hrs, tasks: [
        "English: correction, RC at 8 min/passage, analogy, idioms.",
        "Math: time-work, TSD, interest, partnership, mixture, numbers, LCM/HCF.",
        "Analytical: grouping/scheduling, CR question types, syllogisms.",
        "Writing: 1 timed 15-min piece per day, rubric self-score.",
        "End of week: full mock + 60-min review; compare with Day 1."
      ]},
      { week: 3, focus: "Mixed sets, weakness repair & viva start", hours: hrs, tasks: [
        "Mixed timed sets on alternate days (Eng 20q/30m, Math 25q/35m, Ana 15q/20m).",
        "Remaining math topics: algebra, geometry/mensuration, probability, sets, DI.",
        "40% of study time on the two weakest taxonomy topics from the error log.",
        "Viva: story bank (6 STAR stories), tell-me-about-yourself, mock interview #1."
      ]},
      { week: 4, focus: "Simulation, polish & taper", hours: Math.max(8, Math.round(hrs * 0.7)), tasks: [
        "Full mocks at 10:00 am (real exam time); review errors deeply.",
        "Formula/grammar-rule revision from the error log; 2 timed essays/day.",
        "Last 48 hours: light revision only (≤2h), no new topics, sleep 7–8 h.",
        "Final day: rest, one page of notes, exam-strategy rehearsal only."
      ]}
    ];
    return weeks;
  }

  /* ---------- MAIN ---------- */
  function analyze(S) {
    S = S || {};
    const today = todayISO();
    const daysLeft = S.exam_date ? diffDays(S.exam_date, today) : null;
    const mocks = (S.mocks || []).slice().sort((a, b) => a.date.localeCompare(b.date)).map(normalizeMock);
    const tstats = topicStats(S);
    const prior = priorities(S, tstats, mocks);
    const cur = {
      eng: weightedAvg(mocks, m => m.eng.pct), math: weightedAvg(mocks, m => m.math.pct), ana: weightedAvg(mocks, m => m.ana.pct), mcq: weightedAvg(mocks, m => m.mcq.pct)
    };
    const gates = { eng: gateOf(cur.eng), math: gateOf(cur.math), ana: gateOf(cur.ana) };
    const tr = { eng: trend(mocks, m => m.eng.pct), math: trend(mocks, m => m.math.pct), ana: trend(mocks, m => m.ana.pct) };
    // projection: cap gains at ~1.5 pp/week
    const weeks = daysLeft === null ? 0 : Math.max(0, daysLeft / 7);
    const proj = {};
    ["eng","math","ana"].forEach(s => {
      const c = cur[s];
      proj[s] = c === null ? null : Math.min(c + 1.5 * weeks, 90);
    });
    const wri = writingPct(S, mocks);
    const mcqCurMarks = cur.mcq === null ? null : cur.mcq / 100 * 70;
    const mcqProjMarks = proj.eng === null ? null : (proj.eng/100*30 + proj.math/100*(num(S.math_marks)||25) + proj.ana/100*15);
    const wriLow = wri.pct === null ? 12 : wri.pct * 0.85 / 100 * 30;
    const wriHigh = wri.pct === null ? 20 : wri.pct / 100 * 30;
    const chanceLow = mcqCurMarks === null ? null : mcqCurMarks + wriLow;
    const chanceHigh = mcqProjMarks === null ? null : mcqProjMarks + wriHigh;

    // scenario banding (ASSUMPTION MODEL)
    let band = "Unknown", range = null, confidence = "Low";
    const secVals = [cur.eng, cur.math, cur.ana];
    const anyCritical = secVals.some(v => v !== null && v < 40);
    const mid = (chanceLow !== null) ? (chanceLow + (chanceHigh||chanceLow)) / 2 : null;
    if (mcqCurMarks === null) { band = "Unknown"; }
    else if (anyCritical || mid < 50) band = "Unlikely";
    else if (mid >= 70 && secVals.every(v => v === null ? false : v >= 60)) band = "Safe";
    else if (mid >= 60) band = "Competitive";
    else band = "Borderline";
    const BANDS = { "Safe":[60,80], "Competitive":[35,60], "Borderline":[10,35], "Unlikely":[0,10] };
    if (BANDS[band]) {
      // ±5–10 adjustment for academics, experience, viva, trend
      let adj = 0; const factors = [];
      const cg = num(S.profile && S.profile.cgpa_4);
      if (cg !== null && cg >= 3.5) { adj += 3; factors.push("+ strong academics (CGPA ≥ 3.5)"); }
      else if (cg !== null && cg >= 3.0) { adj += 1.5; factors.push("+ solid academics (CGPA ≥ 3.0)"); }
      const wx = num(S.profile && S.profile.work_experience_years);
      if (wx !== null && wx >= 1) { adj += 1.5; factors.push("+ relevant work experience"); }
      const vr = vivaReadiness(S);
      if (vr >= 60) { adj += 3; factors.push("+ viva readiness"); } else if (vr < 30) { adj -= 3; factors.push("− viva not yet prepared"); }
      if (tr.eng === "up" || tr.math === "up" || tr.ana === "up") { adj += 2; factors.push("+ upward mock trend"); }
      if (tr.eng === "down" || tr.math === "down" || tr.ana === "down") { adj -= 4; factors.push("− downward mock trend"); }
      const b = BANDS[band];
      range = [clamp(Math.round(b[0] + adj), 0, 92), clamp(Math.round(b[1] + adj), 0, 95)];
      chanceFactors = factors;
    }
    // confidence per quality rules
    const nMocks = mocks.length;
    confidence = nMocks >= 5 && wri.pct !== null && (S.practice || []).length >= 8 ? "High" : (nMocks >= 3 ? "Medium" : "Low");
    if (wri.pct === null) confidence = confidence === "High" ? "Medium" : "Low";

    // readiness score
    const p1Topics = KB.TAXONOMY.filter(t => t.sec !== "viva" && t.tag >= 2.5);
    const covered = p1Topics.filter(t => tstats[t.id] && tstats[t.id].attempted >= 10).length / p1Topics.length;
    const acad = (["eng","math","ana"].map(s => cur[s] || 0).reduce((a,b)=>a+b,0)) / 3;
    const target = Math.min(1, ((num(S.weekly_study_hours_available)||10)) || 10);
    const hrsWk = studyHours(S, 7);
    const adherence = clamp(hrsWk / (target * 1), 0, 1) * 100;
    const readiness = Math.round(
      0.35 * (mcqCurMarks === null ? 0 : clamp(acad,0,100)) +
      0.15 * (wri.pct === null ? 25 : clamp(wri.pct,0,100)) +
      0.15 * covered * 100 +
      0.15 * Math.min(1, nMocks / 6) * 100 +
      0.10 * clamp(adherence,0,100) +
      0.10 * vivaReadiness(S)
    );

    // missing data
    const missing = [];
    if (!mocks.length) missing.push("No mocks logged — a Day-1 diagnostic mock is the single highest-value action.");
    if (wri.pct === null) missing.push("No writing score — 30% of the test is unmeasured.");
    if (!(S.practice || []).length) missing.push("No topic-level practice data — priorities currently use syllabus weights only.");
    if (!(S.study_log || []).length) missing.push("No study-log entries — schedule adherence can't be verified.");
    if (!S.official_circular || !S.official_circular.verified_on) missing.push("Official circular not verified — dates and rules are from the last confirmed cycle.");

    const flagsOut = flags(S, tstats, mocks, cur, prior);
    const plan7 = next7(S, prior, mocks);
    const wp = weeklyPlan(S, daysLeft === null ? 30 : daysLeft, prior);
    const elig = eligibility(S);

    return { today, daysLeft, mocks, tstats, prior, cur, gates, trend: tr, proj, wri,
      chance: { band, range, confidence, low: chanceLow, high: chanceHigh, mcqCurMarks, mcqProjMarks, factors: chanceFactors || [],
        disclaimer: "These bands are estimates from public information and the labeled assumption model — NOT official statistics. No cut-offs, seat counts or applicant numbers are published reliably; unknowns stay unknown." },
      readiness, missingData: missing, flags: flagsOut, plan7, weeklyPlan: wp, eligibility: elig, vivaReady: vivaReadiness(S),
      verifyList: KB.VERIFY_ITEMS };
  }

  function gateOf(pct) {
    if (pct === null) return { label: "No data", cls: "grey" };
    const g = KB.GATES.find(g => pct >= g.min);
    return { label: g.label, cls: g.cls };
  }
  function weightedAvg(mocks, fn) {
    const vals = mocks.slice(-3).reverse().map(fn).filter(v => v !== null && v !== undefined);
    if (!vals.length) return null;
    const wts = [0.5, 0.3, 0.2];
    let sw = 0, acc = 0;
    vals.forEach((v, i) => { const w = wts[i] || 0.2; acc += v * w; sw += w; });
    return acc / sw;
  }

  return { analyze, netOf, normalizeMock, eligibility, masteryOf, todayISO, diffDays, addDays, num, clamp };
})();
