/* =====================================================================
   IBA-MBA Coach — UI application (vanilla JS, no dependencies)
   State lives in localStorage; export/import mirrors the master
   prompt's user-input schema.
   ===================================================================== */
"use strict";

/* ---------------- state ---------------- */
const LS_KEY = "iba_mba_coach_v1";
function freshState() {
  return {
    version: 1, created: new Date().toISOString(),
    official_circular: { test_date:"", application_deadline:"", merit_weights:"", work_experience_rule:"", option_count_per_mcq:"", verified_on:"" },
    profile: { name:"", age:"", degree_type:"4yr", university:"", major:"", cgpa_4:"", second_class:false, graduation_year:"", ssc_gpa:"", hsc_gpa:"", third_division:false, oal_track:false, o_subjects:"", a_subjects:"", o_gpa:"", a_gpa:"", c_or_better:"", ugc_approved:true, foreign_degree:false, work_experience_years:"", industry:"", role:"", english_background:"", target_batch:"2026-27" },
    exam_date: KB.nextExpectedExamDate(),
    weekly_study_hours_available: 15,
    rest_day: "Friday",
    math_marks: 25,
    mocks: [], practice: [], study_log: [], error_log: [], writing_log: [],
    viva: { mock_interviews_done:0, self_rating_english_speaking:5, story_bank:[], ca_habit:false, ca_notes:[] },
    self_assessment: { stress:5, confidence:5, weak_areas_text:"" },
    plan_done: {}
  };
}
function load() {
  try { const raw = localStorage.getItem(LS_KEY); if (!raw) return null; const s = JSON.parse(raw); return (s && s.version) ? s : null; }
  catch (e) { console.error("load failed", e); return null; }
}
let S = load() || freshState();
let A = null;
let route = "dashboard";
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { toast("Could not save locally: " + e.message); } }
function refresh() { A = ENGINE.analyze(S); save(); render(); }

/* ---------------- helpers ---------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
function esc(v) { return String(v === null || v === undefined ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
const num = ENGINE.num;
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt1(v) { return v === null || v === undefined ? "—" : (Math.round(v * 10) / 10).toFixed(1); }
function fmt0(v) { return v === null || v === undefined ? "—" : String(Math.round(v)); }
function fmtDate(iso) { if (!iso) return "—"; try { return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return iso; } }
function todayISO() { return ENGINE.todayISO(); }
function gateChip(pct) { const gg = gateOf(pct); return `<span class="chip ${gg.cls}">${gg.label}${pct !== null ? " · " + Math.round(pct) + "%" : ""}</span>`; }
function gateOf(pct) {
  if (pct === null || pct === undefined) return { label: "No data", cls: "grey" };
  const g = KB.GATES.find(g => pct >= g.min);
  return { label: g.label, cls: g.cls };
}
function masteryChip(m) { return `<span class="chip" style="background:${m.color}22;color:${m.color}">${m.label}</span>`; }
function topicById(id) { return KB.TAXONOMY.find(t => t.id === id); }
function topicName(id) { const t = topicById(id); return t ? t.name : id; }
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add("hidden"), 2600); }
function openModal(html) { $("#modal-card").innerHTML = html; $("#modal-overlay").classList.remove("hidden"); }
function closeModal() { $("#modal-overlay").classList.add("hidden"); }
function bar(pct, color) { const p = pct === null ? 0 : Math.max(2, Math.min(100, pct)); return `<div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color || "var(--maroon)"}"></div></div>`; }
function secColor(sec) { return { eng:"#7a1533", math:"#2456a6", ana:"#1a7f4e", wri:"#b26a00", mcq:"#1e2229" }[sec] || "#5a6472"; }

/* ---------------- charts ---------------- */
function lineChart(series, labels) {
  const w = 720, h = 230, pl = 34, pr = 12, pt = 12, pb = 26;
  const iw = w - pl - pr, ih = h - pt - pb;
  const n = Math.max(labels.length, 2);
  const x = (i) => pl + (labels.length === 1 ? iw / 2 : i * iw / (labels.length - 1));
  const y = (v) => pt + ih - (v / 100) * ih;
  let s = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">`;
  [0, 25, 50, 75, 100].forEach(g => {
    s += `<line x1="${pl}" y1="${y(g)}" x2="${w - pr}" y2="${y(g)}" stroke="#e5e8ee" stroke-width="1"/>`;
    s += `<text x="${pl - 6}" y="${y(g) + 4}" font-size="10" fill="#5a6472" text-anchor="end">${g}</text>`;
  });
  labels.forEach((lb, i) => { if (labels.length <= 8 || i % 2 === 0) s += `<text x="${x(i)}" y="${h - 8}" font-size="9.5" fill="#5a6472" text-anchor="middle">${esc(lb)}</text>`; });
  series.forEach(sr => {
    const pts = sr.values.map((v, i) => v === null ? null : `${x(i)},${y(v)}`).filter(Boolean);
    if (pts.length > 1) s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${sr.color}" stroke-width="2.2" ${sr.dash ? 'stroke-dasharray="5 4"' : ""}/>`;
    sr.values.forEach((v, i) => { if (v !== null) s += `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="${sr.color}"/>`; });
  });
  return s + "</svg>";
}
function donut(pct, label, sub) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - (pct || 0) / 100);
  const col = pct >= 65 ? "#1a7f4e" : pct >= 45 ? "#b26a00" : "#b3261e";
  return `<svg viewBox="0 0 130 130" style="width:130px;height:130px;flex:0 0 130px">
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="#edeff4" stroke-width="13"/>
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 65 65)"/>
    <text x="65" y="62" text-anchor="middle" font-size="24" font-weight="700" fill="#1e2229">${Math.round(pct || 0)}</text>
    <text x="65" y="80" text-anchor="middle" font-size="10" fill="#5a6472">${esc(label || "")}</text>
    ${sub ? `<text x="65" y="94" text-anchor="middle" font-size="9" fill="#9aa0a6">${esc(sub)}</text>` : ""}
  </svg>`;
}

/* ---------------- nav & shell ---------------- */
const NAVS = [
  { sep: "Overview" },
  { id: "dashboard", ico: "◎", label: "Dashboard" },
  { sep: "Setup" },
  { id: "profile", ico: "◍", label: "Profile & Eligibility" },
  { sep: "Practice" },
  { id: "mocks", ico: "▤", label: "Mocks & Analysis" },
  { id: "practice", ico: "◈", label: "Topics & Drills" },
  { id: "errors", ico: "✎", label: "Error Log" },
  { id: "writing", ico: "✒", label: "Writing Lab" },
  { sep: "Growth" },
  { id: "plan", ico: "▦", label: "Study Plan" },
  { id: "viva", ico: "☰", label: "Viva Studio" },
  { sep: "Reference" },
  { id: "guide", ico: "❖", label: "Exam Guide & Formulas" },
  { id: "data", ico: "⛁", label: "Data (Export / Import)" }
];
const SUBTITLES = {
  dashboard: "Honest ranges, not promises — every estimate follows the labeled assumption model.",
  profile: "Eligibility rules are from the last confirmed cycle (2025-26). [VERIFY] against the current circular.",
  mocks: "Net marks = correct − 0.25 × wrong. Current level weighs the last 3 mocks 50/30/20.",
  practice: "Topic IDs follow the master taxonomy. Mastery: <10 attempts = Not started.",
  errors: "Revisit every error after 2, 7 and 21 days.",
  writing: "Two pieces × 15 marks × 30 minutes at the real test. Rubric: relevance 4 · thesis 4 · evidence 3 · language 3 · coherence 1.",
  plan: "Built from the 30-day mastery roadmap, scaled to your remaining days and hours.",
  viva: "STAR stories, 60–90 seconds each. Admit what you don't know — then reason aloud.",
  guide: "Community-derived reference. Nothing here is official; verify with the IBA circular.",
  data: "All data stays in this browser. Export regularly — clearing site data erases it."
};
const PAGE_TITLES = {
  dashboard: "Dashboard", profile: "Profile & Eligibility", mocks: "Mocks & Analysis", practice: "Topics & Drills",
  errors: "Error Log", writing: "Writing Lab", plan: "Study Plan", viva: "Viva Studio", guide: "Exam Guide", data: "Your Data"
};

function renderNav() {
  $("#nav").innerHTML = NAVS.map(n => n.sep
    ? `<div class="nav-sep">${n.sep}</div>`
    : `<button class="nav-item ${route === n.id ? "active" : ""}" data-action="nav" data-route="${n.id}"><span class="ico">${n.ico}</span>${n.label}</button>`
  ).join("");
}
function renderShell() {
  renderNav();
  $("#page-title").textContent = PAGE_TITLES[route] || "";
  $("#page-sub").textContent = SUBTITLES[route] || "";
  const actions = [];
  if (route === "dashboard") { actions.push(`<button class="btn primary" data-action="new-mock">+ Log mock</button>`); actions.push(`<button class="btn" data-action="new-studylog">+ Study hours</button>`); }
  if (route === "mocks") actions.push(`<button class="btn primary" data-action="new-mock">+ Add mock</button>`);
  if (route === "practice") actions.push(`<button class="btn primary" data-action="new-practice">+ Log practice</button>`);
  if (route === "errors") actions.push(`<button class="btn primary" data-action="new-error">+ Log error</button>`);
  if (route === "writing") actions.push(`<button class="btn primary" data-action="new-piece">+ New timed piece</button>`);
  if (route === "viva") actions.push(`<button class="btn primary" data-action="new-story">+ STAR story</button>`);
  $("#topbar-actions").innerHTML = actions.join("");
  // sidebar countdown
  const d = A ? A.daysLeft : null;
  const official = S.official_circular && S.official_circular.test_date;
  $("#side-countdown").innerHTML = d === null ? "Set your exam date in Profile."
    : d >= 0 ? `Exam in <b>${d}</b> day${d === 1 ? "" : "s"}<br><span style="opacity:.7">${fmtDate(S.exam_date)}${official ? "" : " · expected, not announced"}</span>`
    : `<b>Test date passed</b> — update your exam date.`;
}

function render() {
  renderShell();
  const v = $("#view");
  const R = { dashboard: renderDashboard, profile: renderProfile, mocks: renderMocks, practice: renderPractice, errors: renderErrors, writing: renderWriting, plan: renderPlan, viva: renderViva, guide: renderGuide, data: renderData };
  v.innerHTML = (R[route] || renderDashboard)();
  if (route === "guide") updateEV();
  v.scrollTop = 0; window.scrollTo(0, 0);
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
  if (!S.profile.name) {
    return `<div class="card" style="text-align:center;padding:40px 24px">
      <h2 style="margin:0 0 8px">Welcome to IBA-MBA Coach</h2>
      <p class="muted" style="max-width:560px;margin:0 auto 18px">An unofficial coach for the <b>IBA, University of Dhaka MBA</b> admission test only. Start by setting up your profile and eligibility, or explore with clearly-labeled demo data.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn primary" data-action="nav" data-route="profile">Set up my profile</button>
        <button class="btn" data-action="load-demo">Explore with demo data</button>
        <button class="btn ghost" data-action="nav" data-route="guide">Read the exam guide</button>
      </div>
      <p class="hint" style="margin-top:16px">${esc(KB.SCOPE_GUARD)}</p>
    </div>`;
  }
  const a = A;
  const tiles = `
    <div class="tiles">
      <div class="tile"><div class="t-label">Days to test</div><div class="t-value">${a.daysLeft === null ? "—" : (a.daysLeft >= 0 ? a.daysLeft : "✓")}</div><div class="t-hint">${fmtDate(S.exam_date)}${S.official_circular.test_date ? " · official" : " · expected"}</div></div>
      <div class="tile"><div class="t-label">Readiness</div><div class="t-value">${a.readiness}<span style="font-size:14px;color:var(--ink-soft)">/100</span></div><div class="t-hint">composite of mocks, topics, writing, viva</div></div>
      <div class="tile"><div class="t-label">Chance band (assumption)</div><div class="t-value" style="font-size:17px">${a.chance.band === "Unknown" ? "Unknown" : a.chance.band}</div><div class="t-hint">${a.chance.range ? a.chance.range[0] + "–" + a.chance.range[1] + "% · confidence: " + a.chance.confidence : "log a diagnostic mock first"}</div></div>
      <div class="tile"><div class="t-label">Mocks logged</div><div class="t-value">${a.mocks.length}</div><div class="t-hint">${a.mocks.length ? "last: " + fmtDate(a.mocks[a.mocks.length-1].date) : "Day-1 diagnostic is the first step"}</div></div>
    </div>`;

  const secRow = (name, pct, trKey) => {
    const g = gateOf(pct);
    const tr = A.trend[trKey];
    const arrow = tr === "up" ? `<span class="chip green">▲ ${tr}</span>` : tr === "down" ? `<span class="chip red">▼ ${tr}</span>` : tr === "flat" ? `<span class="chip grey">– flat</span>` : `<span class="chip grey">no trend yet</span>`;
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
        <b style="font-size:13px">${name}</b>
        <span style="display:flex;gap:6px;align-items:center">${gateChip(pct)} ${arrow}</span>
      </div>${bar(pct, secColor(trKey))}</div>`;
  };
  const levels = `<div class="card"><h3>Current level</h3><p class="card-sub">Weighted 50/30/20 across the last 3 mocks. Gates: ≥65 Strong · 55–64 Borderline · 40–54 Danger · &lt;40 Critical.</p>
    ${secRow("English (30)", a.cur.eng, "eng")}
    ${secRow("Mathematical Reasoning (" + (num(S.math_marks) || 25) + ")", a.cur.math, "math")}
    ${secRow("Analytical Ability (15)", a.cur.ana, "ana")}
    ${secRow("Descriptive Writing (30)", a.wri.pct, "wri")}
    <div class="callout info" style="margin-bottom:0">${a.wri.pct === null ? "<b>Writing is unmeasured.</b> 30% of the test — log timed pieces in the Writing Lab or enter writing marks in your mocks." : `Writing estimate source: ${esc(a.wri.src)}.`}</div>
  </div>`;

  const c = a.chance;
  const chance = `<div class="card"><h3>Admission chance — assumption model</h3><p class="card-sub">Written predicted total = projected MCQ (70) + estimated writing (30). Bands: Safe ≥70 & all gates ≥60 · Competitive 60–69 · Borderline 50–59 · Unlikely &lt;50 or any gate &lt;40.</p>
    ${c.range ? `<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
      <div style="font-size:34px;font-weight:800;color:var(--maroon)">${c.range[0]}–${c.range[1]}%</div>
      <div><span class="chip maroon" style="font-size:12px">${esc(c.band)}</span><br><span class="hint">confidence: ${esc(c.confidence)}</span></div>
    </div>
    ${c.factors && c.factors.length ? `<div class="small muted" style="margin-bottom:6px">${c.factors.map(esc).join(" · ")}</div>` : ""}
    <div class="kv"><span>MCQ now → projected</span><b>${fmt0(c.mcqCurMarks)} → ${fmt0(c.mcqProjMarks)} / 70</b></div>
    <div class="kv"><span>Writing estimate</span><b>${a.wri.pct === null ? "unknown (" + c.range[0] + "–" + c.range[1] + "% band uses 12–20 marks)" : fmt0(a.wri.pct / 100 * 30) + " / 30"}</b></div>
    <div class="kv"><span>Projected written total range</span><b>${fmt0(c.low)}–${fmt0(c.high)} / 100</b></div>`
    : `<div class="empty-note">No mock data yet. Log your Day-1 diagnostic mock to unlock the estimate.</div>`}
    <div class="callout warn" style="margin:12px 0 0;font-size:12px">${esc(c.disclaimer)}</div>
  </div>`;

  const flagsCard = `<div class="card"><h3>Pattern flags</h3><p class="card-sub">Automatic detection from your logs.</p>
    ${a.flags.length ? a.flags.map(f => `<div class="flag-row"><span class="chip ${f.sev === "danger" ? "red" : f.sev === "warn" ? "amber" : "blue"}">${esc(f.title)}</span><div><div>${esc(f.detail)}</div><div class="hint">→ ${esc(f.action)}</div></div></div>`).join("") : `<div class="empty-note" style="padding:14px">No flags — keep logging mocks and practice.</div>`}
  </div>`;

  const prio = `<div class="card"><h3>Top priorities — next 7 days</h3><p class="card-sub">Weight = section marks × frequency tag (P1=3, P2=2, P3=1) × (1 − mastery).</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Topic</th><th>Tag</th><th>Mastery</th><th class="num">Target Qs</th><th class="num">Limit</th></tr></thead><tbody>
    ${a.prior.slice(0, 5).map(p => `<tr><td>${esc(p.topic.name)}</td><td><span class="pill chip grey">${esc(p.topic.tagLabel)}</span></td><td>${masteryChip(p.mastery)}</td><td class="num">${p.targetQ}</td><td class="num">${p.timeLimit ? p.timeLimit + "s/q" : "—"}</td></tr>`).join("")}
    </tbody></table></div>
    <button class="btn ghost sm" data-action="nav" data-route="practice" style="margin-top:8px">All topics →</button>
  </div>`;

  const today = a.plan7.days[0];
  const todayCard = `<div class="card"><h3>Today · ${today.weekday} ${fmtDate(today.date)}</h3><p class="card-sub">${today.mock ? "MOCK DAY — full timed simulation + 60-min review." : today.rest ? "Rest day — light revision only." : `${a.plan7.dailyMin} min planned · built from your top topics.`}</p>
    ${today.tasks.map((t, i) => {
      const done = (S.plan_done[today.date] || []).includes(i);
      return `<div class="task-row"><input type="checkbox" ${done ? "checked" : ""} data-action="toggle-task" data-date="${today.date}" data-idx="${i}"><span>${esc(t.name)}</span>${t.questions ? `<span class="task-nums">${t.minutes} min${t.questions ? " · " + t.questions + (t.questions === 1 ? " piece" : " Qs") : ""}</span>` : ""}</div>`;
    }).join("")}
    <div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" data-action="nav" data-route="plan">Full 7-day plan →</button></div>
  </div>`;

  const risks = `<div class="card"><h3>What the engine needs / watches</h3>
    <b class="small">Missing data</b>
    ${a.missingData.length ? `<ul class="list-plain">${a.missingData.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : `<p class="small" style="color:var(--green)">✓ All key data present.</p>`}
    <b class="small" style="display:block;margin-top:10px">Verify with the official circular</b>
    <ul class="list-plain">${a.verifyList.slice(0, 4).map(v => `<li>${esc(v)}</li>`).join("")}</ul>
  </div>`;

  const stress = num(S.self_assessment.stress);
  const well = stress !== null && stress >= 7 ? `<div class="callout danger"><b>Check in with yourself.</b> You reported stress ${stress}/10. It's okay to lighten the plan — consistency beats intensity. Talk to someone you trust.</div>` : "";

  return `${tiles}<div class="grid g2">${levels}${chance}</div>
  ${well}
  <div class="grid g2">${todayCard}${prio}</div>
  <div class="grid g2">${flagsCard}${risks}</div>`;
}

/* ================= PROFILE ================= */
function renderProfile() {
  const p = S.profile, oc = S.official_circular, sa = S.self_assessment;
  const el = A.eligibility;
  const statusChip = el.status === "ELIGIBLE" ? "green" : el.status === "AT RISK" ? "amber" : el.status === "NOT ELIGIBLE" ? "red" : "grey";
  return `
  <div class="grid g32">
    <form data-form="profile" class="card">
      <h3>Your profile</h3><p class="card-sub">Used for eligibility, chance adjustments and viva coaching. Nothing leaves your browser.</p>
      <div class="frow fr2">
        <div class="field"><label>Name</label><input name="name" value="${esc(p.name)}"></div>
        <div class="field"><label>Age</label><input name="age" type="number" min="0" value="${esc(p.age)}"></div>
      </div>
      <div class="frow fr2">
        <div class="field"><label>Degree structure</label>
          <select name="degree_type">
            <option value="4yr" ${p.degree_type === "4yr" ? "selected" : ""}>4-year bachelor's</option>
            <option value="3yr" ${p.degree_type === "3yr" ? "selected" : ""}>3-year bachelor + 1-year master's</option>
            <option value="other" ${p.degree_type === "other" ? "selected" : ""}>Other / not sure</option>
          </select></div>
        <div class="field"><label>University</label><input name="university" value="${esc(p.university)}"></div>
      </div>
      <div class="frow fr3">
        <div class="field"><label>Major</label><input name="major" value="${esc(p.major)}"></div>
        <div class="field"><label>CGPA /4.00</label><input name="cgpa_4" type="number" step="0.01" min="0" max="4" value="${esc(p.cgpa_4)}"></div>
        <div class="field"><label>Graduation year</label><input name="graduation_year" type="number" value="${esc(p.graduation_year)}"></div>
      </div>
      <div class="checkbox-line"><input type="checkbox" name="second_class" ${p.second_class ? "checked" : ""}> <span>My result is a 2nd class / equivalent (instead of a 4.00-scale CGPA)</span></div>
      <div class="frow fr2" style="margin-top:10px">
        <div class="field"><label>SSC GPA /5.00</label><input name="ssc_gpa" type="number" step="0.01" min="0" max="5" value="${esc(p.ssc_gpa)}"></div>
        <div class="field"><label>HSC GPA /5.00</label><input name="hsc_gpa" type="number" step="0.01" min="0" max="5" value="${esc(p.hsc_gpa)}"></div>
      </div>
      <div class="checkbox-line"><input type="checkbox" name="third_division" ${p.third_division ? "checked" : ""}> <span>I have a third division/class at any level (SSC, HSC or bachelor's)</span></div>
      <fieldset style="margin-top:14px"><legend>O / A Levels (only if applicable)</legend>
        <div class="checkbox-line"><input type="checkbox" name="oal_track" ${p.oal_track ? "checked" : ""}> <span>I studied O/A Levels</span></div>
        <div class="frow fr4" style="margin-top:10px">
          <div class="field"><label>O-level subjects</label><input name="o_subjects" type="number" value="${esc(p.o_subjects)}"></div>
          <div class="field"><label>O-level GPA</label><input name="o_gpa" type="number" step="0.01" value="${esc(p.o_gpa)}"></div>
          <div class="field"><label>A-level subjects</label><input name="a_subjects" type="number" value="${esc(p.a_subjects)}"></div>
          <div class="field"><label>A-level GPA</label><input name="a_gpa" type="number" step="0.01" value="${esc(p.a_gpa)}"></div>
        </div>
        <div class="field"><label>Subjects with grade C or better</label><input name="c_or_better" type="number" value="${esc(p.c_or_better)}"></div>
      </fieldset>
      <div class="checkbox-line"><input type="checkbox" name="ugc_approved" ${p.ugc_approved ? "checked" : ""}> <span>My degree is UGC-approved</span></div>
      <div class="checkbox-line" style="margin-top:6px"><input type="checkbox" name="foreign_degree" ${p.foreign_degree ? "checked" : ""}> <span>Foreign degree (needs IBA Equivalence Committee clearance)</span></div>
      <div class="frow fr3" style="margin-top:14px">
        <div class="field"><label>Work experience (years)</label><input name="work_experience_years" type="number" step="0.1" value="${esc(p.work_experience_years)}"></div>
        <div class="field"><label>Industry</label><input name="industry" value="${esc(p.industry)}"></div>
        <div class="field"><label>Role</label><input name="role" value="${esc(p.role)}"></div>
      </div>
      <div class="field"><label>English background</label><input name="english_background" value="${esc(p.english_background)}" placeholder="e.g., English medium, IELTS 7.0, Bengali medium with strong reading"></div>

      <fieldset><legend>Exam & schedule</legend>
        <div class="frow fr3">
          <div class="field"><label>Exam date</label><input name="exam_date" type="date" value="${esc(S.exam_date)}"></div>
          <div class="field"><label>Weekly study hours</label><input name="weekly_study_hours_available" type="number" min="1" max="80" value="${esc(S.weekly_study_hours_available)}"></div>
          <div class="field"><label>Rest day</label><select name="rest_day">${["Friday","Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday"].map(d => `<option ${S.rest_day === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
        </div>
        <div class="field"><label>Math section marks</label><select name="math_marks"><option value="25" ${S.math_marks == 25 ? "selected" : ""}>25 [VERIFY each cycle]</option><option value="30" ${S.math_marks == 30 ? "selected" : ""}>30</option></select></div>
        <div class="hint">Default exam date is the <b>expected</b> early-December Friday — the 2026-27 circular is not announced yet.</div>
      </fieldset>

      <fieldset><legend>Official circular (when you verify it — overrides all assumptions)</legend>
        <div class="frow fr3">
          <div class="field"><label>Official test date</label><input name="oc_test_date" type="date" value="${esc(oc.test_date)}"></div>
          <div class="field"><label>Application deadline</label><input name="oc_application_deadline" type="date" value="${esc(oc.application_deadline)}"></div>
          <div class="field"><label>Verified on</label><input name="oc_verified_on" type="date" value="${esc(oc.verified_on)}"></div>
        </div>
        <div class="frow fr2">
          <div class="field"><label>Options per MCQ</label><select name="oc_option_count_per_mcq"><option value="" ${!oc.option_count_per_mcq ? "selected" : ""}>Unknown [VERIFY]</option><option value="4" ${oc.option_count_per_mcq == 4 ? "selected" : ""}>4</option><option value="5" ${oc.option_count_per_mcq == 5 ? "selected" : ""}>5</option></select></div>
          <div class="field"><label>Merit weights (if stated)</label><input name="oc_merit_weights" value="${esc(oc.merit_weights)}" placeholder="e.g., written 70 / viva 30"></div>
        </div>
        <div class="field"><label>Work-experience rule (if stated)</label><input name="oc_work_experience_rule" value="${esc(oc.work_experience_rule)}"></div>
      </fieldset>

      <fieldset><legend>Self check-in (for flags & wellbeing)</legend>
        <div class="frow fr2">
          <div class="field"><label>Stress: <output id="out-stress">${esc(sa.stress)}</output>/10</label><input type="range" name="stress" min="1" max="10" value="${esc(sa.stress)}" data-range-out="out-stress"></div>
          <div class="field"><label>Confidence: <output id="out-conf">${esc(sa.confidence)}</output>/10</label><input type="range" name="confidence" min="1" max="10" value="${esc(sa.confidence)}" data-range-out="out-conf"></div>
        </div>
        <div class="field"><label>Weak areas (free text)</label><textarea name="weak_areas_text">${esc(sa.weak_areas_text)}</textarea></div>
      </fieldset>
      <button class="btn primary" type="submit">Save profile</button>
    </form>
    <div>
      <div class="card">
        <h3>Eligibility — <span class="chip ${statusChip}" style="font-size:13px">${esc(el.status)}</span></h3>
        <p class="card-sub">${esc(el.verifyNote)}</p>
        ${el.issues.length ? el.issues.map(i => `<div class="callout danger">${esc(i)}</div>`).join("") : ""}
        ${el.risks.length ? el.risks.map(i => `<div class="callout warn">${esc(i)}</div>`).join("") : ""}
        ${el.missing.length ? `<div class="callout info"><b>To decide:</b> ${el.missing.map(esc).join(" · ")}</div>` : ""}
        ${el.status === "ELIGIBLE" && !el.risks.length ? `<div class="callout ok">All last-cycle criteria pass. Keep documents ready — eligibility is confirmed only by IBA after application.</div>` : ""}
        ${el.status === "NOT ELIGIBLE" ? `<div class="callout"><b>If this is you:</b> recheck with the current circular (rules change); alternatives include improving the result, other MBA/EMBA paths later, or foreign-degree GMAT/GRE routes. This tool can still help you build the skills.</div>` : ""}
      </div>
      <div class="card">
        <h3>Last confirmed cycle & process</h3>
        <div class="kv"><span>Last confirmed</span><b style="text-align:right">${esc(KB.CYCLE.lastConfirmed)}</b></div>
        <div class="kv"><span>2026-27</span><b style="text-align:right">${esc(KB.CYCLE.expectation)}</b></div>
        <b class="small" style="display:block;margin:8px 0 4px">Stages</b>
        <div class="small">${KB.CYCLE.stages.map((s, i) => `${i + 1}. ${esc(s)}`).join(" → ")}</div>
      </div>
    </div>
  </div>`;
}

/* ================= MOCKS ================= */
function renderMocks() {
  const a = A;
  const labels = a.mocks.map(m => new Date(m.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  const series = [
    { label: "English", color: secColor("eng"), values: a.mocks.map(m => m.eng.pct) },
    { label: "Math", color: secColor("math"), values: a.mocks.map(m => m.math.pct) },
    { label: "Analytical", color: secColor("ana"), values: a.mocks.map(m => m.ana.pct) },
    { label: "MCQ total", color: secColor("mcq"), dash: true, values: a.mocks.map(m => m.mcq.pct) }
  ];
  const chart = a.mocks.length ? `<div class="card"><h3>Score trajectory (% of section maximum)</h3>
    <div class="small muted" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px">${series.map(s => `<span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${s.color}"></span> ${s.label}</span>`).join("")}</div>
    ${lineChart(series, labels)}</div>` : "";
  const table = `<div class="card"><h3>Mock history</h3>
    ${a.mocks.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Type</th><th class="num">Eng/30</th><th class="num">Math</th><th class="num">Ana/15</th><th class="num">MCQ/70</th><th class="num">Wri/30</th><th class="num">Acc</th><th class="num">−0.25 loss</th><th class="num">Total</th><th></th></tr></thead><tbody>
      ${a.mocks.map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(m.type)}</td>
        <td class="num">${m.eng.net === null ? "—" : fmt1(m.eng.net)}</td>
        <td class="num">${m.math.net === null ? "—" : fmt1(m.math.net) + "/" + m.math.max}</td>
        <td class="num">${m.ana.net === null ? "—" : fmt1(m.ana.net)}</td>
        <td class="num"><b>${m.mcq.net === null ? "—" : fmt1(m.mcq.net)}</b></td>
        <td class="num">${m.wri.net === null ? "—" : m.wri.net}</td>
        <td class="num">${m.mcq.acc === null ? "—" : Math.round(m.mcq.acc * 100) + "%"}</td>
        <td class="num" style="color:var(--red)">${m.mcq.loss ? "−" + fmt1(m.mcq.loss) : "0"}</td>
        <td class="num">${m.total === null ? "—" : fmt1(m.total)}</td>
        <td><button class="btn sm danger" data-action="del-mock" data-id="${m.id}">×</button></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty-note">No mocks yet. Start with a full timed diagnostic: 90-min MCQ + 30-min writing.</div>`}
  </div>`;
  const analysis = `<div class="card"><h3>Section gates & projection</h3><p class="card-sub">Projection caps gains at ≈1.5 percentage points/week unless your trend shows more.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Section</th><th>Gate</th><th>Trend</th><th class="num">Now %</th><th class="num">Projected %</th></tr></thead><tbody>
    ${["eng","math","ana"].map(s => { const c = a.cur[s], pr = a.proj[s], g = gateOf(c); const tr = a.trend[s];
      const trTxt = tr === "up" ? "▲ up" : tr === "down" ? "▼ down" : tr === "flat" ? "– flat" : "no data";
      return `<tr><td>${esc(KB.SECTION_NAMES[s])}</td><td><span class="chip ${g.cls}">${g.label}</span></td><td>${trTxt}</td><td class="num">${c === null ? "—" : Math.round(c) + "%"}</td><td class="num">${pr === null ? "—" : Math.round(pr) + "%"}</td></tr>`; }).join("")}
    <tr><td>Writing</td><td><span class="chip ${a.wri.pct === null ? "grey" : "blue"}">${a.wri.pct === null ? "unmeasured" : Math.round(a.wri.pct) + "%"}</span></td><td>—</td><td class="num">${a.wri.pct === null ? "—" : Math.round(a.wri.pct) + "%"}</td><td class="num">—</td></tr>
    </tbody></table></div>
    ${a.cur.eng !== null && Object.values(a.gates).some(g => ["Danger","Critical"].includes(g.label)) ? `<div class="callout danger" style="margin-top:10px"><b>#1 risk:</b> a Danger/Critical section cannot be compensated by strong sections — sectional gates come first.</div>` : ""}
  </div>`;
  return `${chart}${table}${analysis}`;
}

function mockFormHtml(presetDate) {
  return `<form data-form="mock">
    <h3>Log a mock</h3>
    <div class="frow fr2">
      <div class="field"><label>Date</label><input name="date" type="date" value="${presetDate || todayISO()}" required></div>
      <div class="field"><label>Type</label><select name="type"><option>Diagnostic</option><option selected>Full</option><option>Sectional</option></select></div>
    </div>
    <fieldset><legend>English (out of 30) — enter correct + wrong, or net marks directly</legend>
      <div class="frow fr3">
        <div class="field"><label>Correct</label><input name="eng_correct" type="number" min="0" max="30"></div>
        <div class="field"><label>Wrong</label><input name="eng_wrong" type="number" min="0" max="30"></div>
        <div class="field"><label>…or net marks</label><input name="eng_direct" type="number" step="0.25"></div>
      </div>
    </fieldset>
    <fieldset><legend>Mathematical Reasoning</legend>
      <div class="frow fr4">
        <div class="field"><label>Total marks</label><select name="mathMax"><option value="25" selected>25</option><option value="30">30</option></select></div>
        <div class="field"><label>Correct</label><input name="math_correct" type="number" min="0" max="30"></div>
        <div class="field"><label>Wrong</label><input name="math_wrong" type="number" min="0" max="30"></div>
        <div class="field"><label>…or net</label><input name="math_direct" type="number" step="0.25"></div>
      </div>
    </fieldset>
    <fieldset><legend>Analytical Ability (out of 15)</legend>
      <div class="frow fr3">
        <div class="field"><label>Correct</label><input name="ana_correct" type="number" min="0" max="15"></div>
        <div class="field"><label>Wrong</label><input name="ana_wrong" type="number" min="0" max="15"></div>
        <div class="field"><label>…or net</label><input name="ana_direct" type="number" step="0.25"></div>
      </div>
    </fieldset>
    <fieldset><legend>Writing (out of 30, if evaluated) & timing</legend>
      <div class="frow fr2">
        <div class="field"><label>Writing marks</label><input name="writing" type="number" min="0" max="30"></div>
        <div class="field"><label>Time taken (min)</label><input name="time_taken_min" type="number"></div>
      </div>
    </fieldset>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Save mock</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}

/* ================= PRACTICE / TOPICS ================= */
function renderPractice() {
  const a = A;
  const prioRows = a.prior.slice(0, 8).map((p, i) => `<tr>
    <td><b>${i + 1}. ${esc(p.topic.name)}</b><div class="hint">${esc(p.topic.id)}</div></td>
    <td><span class="pill chip grey">${esc(p.topic.tagLabel)}</span></td>
    <td>${masteryChip(p.mastery)}</td>
    <td class="num">${p.st ? p.st.attempted : 0}</td>
    <td class="num">${p.st && p.st.acc !== null ? Math.round(p.st.acc * 100) + "%" : "—"}</td>
    <td class="num">${p.st && p.st.avg_time_sec ? p.st.avg_time_sec + "s" : "—"}</td>
    <td class="num"><b>${p.targetQ}</b></td>
    <td class="num">${p.timeLimit ? p.timeLimit + "s/q" : "—"}</td>
    <td><button class="btn sm" data-action="new-practice" data-topic="${p.topic.id}">+ log</button></td>
  </tr>`).join("");
  const groups = ["eng","math","ana","wri"].map(sec => {
    const topics = KB.TAXONOMY.filter(t => t.sec === sec);
    return `<div class="section-head"><h3>${esc(KB.SECTION_NAMES[sec])}</h3><div class="rule"></div></div>
    <div class="topic-grid">${topics.map(t => {
      const st = a.tstats[t.id]; const m = ENGINE.masteryOf(st);
      return `<div class="topic-chip" data-action="new-practice" data-topic="${t.id}" title="${esc(t.tip)}">
        <div class="tc-name"><span>${esc(t.name)}</span><span class="pill chip grey">${esc(t.tagLabel)}</span></div>
        <div class="tc-meta">${masteryChip(m)} ${st ? `${st.attempted} att · ${Math.round(st.acc * 100)}% · ${st.avg_time_sec}s` : "no attempts yet"}</div>
      </div>`; }).join("")}</div>`;
  }).join("");
  const recent = (S.practice || []).slice(-12).reverse().map(p => `<tr><td>${fmtDate(p.date)}</td><td>${esc(topicName(p.topic_id))}</td><td class="num">${p.attempted}</td><td class="num">${p.correct} (${Math.round(p.correct / Math.max(1, p.attempted) * 100)}%)</td><td class="num">${p.avg_time_sec || "—"}s</td><td>${p.timed ? '<span class="chip blue">timed</span>' : '<span class="chip grey">untimed</span>'}</td><td><button class="btn sm danger" data-action="del-practice" data-id="${p.id}">×</button></td></tr>`).join("");
  const studyLog = (S.study_log || []).slice(-8).reverse().map(l => `<tr><td>${fmtDate(l.date)}</td><td class="num">${l.hours}h</td><td class="small">${esc((l.topic_ids || []).map(topicName).join(", "))}</td><td><button class="btn sm danger" data-action="del-studylog" data-id="${l.id}">×</button></td></tr>`).join("");
  return `
  <div class="card"><h3>Weighted priorities (auto-computed)</h3><p class="card-sub">Study-time weight = section marks share × frequency tag × (1 − mastery). Targets are questions for the next 7 days.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Topic</th><th>Tag</th><th>Mastery</th><th class="num">Attempts</th><th class="num">Acc</th><th class="num">Avg time</th><th class="num">Target Qs /7d</th><th class="num">Time limit</th><th></th></tr></thead><tbody>${prioRows}</tbody></table></div>
  </div>
  ${groups}
  <div class="grid g2" style="margin-top:6px">
    <div class="card"><h3>Recent practice</h3>${recent ? `<div class="tbl-wrap"><table class="tbl">${recent}</table></div>` : `<div class="empty-note" style="padding:14px">No practice logged yet — click any topic above.</div>`}</div>
    <div class="card"><h3>Study log</h3><p class="card-sub">Hours feed schedule adherence & burnout flags.</p>
      <form data-form="studylog" class="frow fr3" style="align-items:end">
        <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}"></div>
        <div class="field"><label>Hours</label><input name="hours" type="number" step="0.5" min="0" required></div>
        <div class="field"><button class="btn primary" type="submit" style="width:100%">+ Add</button></div>
      </form>
      ${studyLog ? `<div class="tbl-wrap"><table class="tbl">${studyLog}</table></div>` : ""}
    </div>
  </div>`;
}

/* ================= ERRORS ================= */
function renderErrors() {
  const dueInfo = (created) => [2, 7, 21].map(d => {
    const due = ENGINE.addDays(created, d);
    const dd = ENGINE.diffDays(due, todayISO());
    const label = d === 2 ? "2-day" : d === 7 ? "7-day" : "21-day";
    if (dd < 0) return `<span class="chip green">${label} ✓</span>`;
    if (dd === 0) return `<span class="chip red">${label} DUE</span>`;
    return `<span class="chip grey">${label} in ${dd}d</span>`;
  }).join(" ");
  const rows = (S.error_log || []).slice().reverse().map(e => `<tr style="${e.resolved ? "opacity:.55" : ""}">
    <td>${fmtDate(e.created)}</td>
    <td>${esc(e.question)}<div class="hint">${esc(topicName(e.topic_id))}</div></td>
    <td><span class="chip ${e.why === "concept" ? "red" : e.why === "careless" ? "orange" : e.why === "time" ? "amber" : "grey"}">${esc(e.why)}</span></td>
    <td class="small">${esc(e.fix)}</td>
    <td style="white-space:nowrap">${e.resolved ? '<span class="chip green">resolved</span>' : dueInfo(e.created)}</td>
    <td>${e.resolved ? "" : `<button class="btn sm" data-action="resolve-error" data-id="${e.id}">✓ fixed</button> `}<button class="btn sm danger" data-action="del-error" data-id="${e.id}">×</button></td>
  </tr>`).join("");
  const open = (S.error_log || []).filter(e => !e.resolved).length;
  return `
  <div class="callout info">Fix-and-retry discipline: every error gets a <b>fix</b>, then retries at <b>2, 7 and 21 days</b>. Concept errors → relearn the rule; careless errors → timed drills; time errors → skipping drills.</div>
  <div class="grid g32">
    <div class="card"><h3>Error log (${open} open)</h3>
      ${rows ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Logged</th><th>Question / topic</th><th>Why</th><th>Fix</th><th>Retries</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-note">Empty — log every mock/practice mistake. The error log is the highest-leverage habit in the whole plan.</div>`}
    </div>
    <div class="card"><h3>Add error</h3>
      <form data-form="error">
        <div class="field"><label>What went wrong (question summary)</label><textarea name="question" required></textarea></div>
        <div class="field"><label>Topic</label><select name="topic_id">${KB.TAXONOMY.filter(t => t.sec !== "viva").map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Why wrong</label><select name="why"><option>concept</option><option>careless</option><option>time</option><option>misread</option></select></div>
        <div class="field"><label>The fix (rule/method to remember)</label><textarea name="fix" required></textarea></div>
        <button class="btn primary" type="submit">Log error</button>
      </form>
    </div>
  </div>`;
}

/* ================= WRITING ================= */
function renderWriting() {
  const logs = (S.writing_log || []).slice().reverse();
  const avg = logs.length ? logs.reduce((a, l) => a + (l.scores.relevance + l.scores.thesis + l.scores.evidence + l.scores.language + l.scores.coherence), 0) / logs.length : null;
  const bank = Object.entries(KB.ESSAY_BANK).map(([theme, topics]) => `
    <details class="acc"><summary>${esc(theme)} <span class="hint">(${topics.length} prompts)</span></summary>
      <div class="acc-body">${topics.map(t => `<div class="task-row"><span>${esc(t)}</span><button class="btn sm" data-action="new-piece" data-prompt="${esc(t)}" data-theme="${esc(theme)}">practice</button></div>`).join("")}</div>
    </details>`).join("");
  const history = logs.map(l => { const sc = l.scores.relevance + l.scores.thesis + l.scores.evidence + l.scores.language + l.scores.coherence;
    return `<tr><td>${fmtDate(l.date)}</td><td>${esc(l.prompt)}<div class="hint">${esc(l.theme || "")}</div></td><td class="num">${l.words || "—"}</td><td class="num">${l.time_min || "—"}m</td><td class="num"><b>${sc}/15</b></td><td><button class="btn sm danger" data-action="del-piece" data-id="${l.id}">×</button></td></tr>`; }).join("");
  return `
  <div class="grid g2">
    <div class="card"><h3>How the 30 marks are won</h3>
      <div class="kv"><span>Pieces</span><b>2 × 15 marks in 30 min total</b></div>
      <div class="kv"><span>Time per piece</span><b>3 plan · 11–12 write · 1 proofread</b></div>
      <div class="kv"><span>Length</span><b>250–300 words</b></div>
      <b class="small" style="display:block;margin-top:10px">PEEL structure</b>
      <ul class="list-plain"><li><b>Intro</b> (3–4 lines): hook + context + thesis that answers the prompt directly</li><li><b>Body 1–3:</b> Point → Evidence/example → Explanation → Link back</li><li><b>Counterargument:</b> 1 short paragraph</li><li><b>Conclusion:</b> restate thesis + final insight</li></ul>
      <b class="small" style="display:block;margin-top:10px">Self-score rubric (max 15)</b>
      <div class="small muted">Relevance 4 · Thesis/structure 4 · Evidence 3 · Language 3 · Coherence 1</div>
      <b class="small" style="display:block;margin-top:10px">Common errors</b>
      <div class="small muted">Memorized essays that ignore the prompt · no thesis · one-sided argument · long introductions · run-on sentences · no conclusion</div>
    </div>
    <div class="card"><h3>${logs.length ? "Your average: " + fmt1(avg) + " /15" : "Start timed practice"}</h3>
      ${logs.length ? `${bar(avg / 15 * 100, secColor("wri"))}<p class="card-sub">${logs.length} pieces logged. Target: 20+/30 on test day — i.e., 10+/15 per piece.</p>` : `<p class="card-sub">One timed piece per day from week 2; two per day on mock days.</p>`}
      <button class="btn primary" data-action="new-piece">+ New timed piece</button>
      <div style="margin-top:14px"><b class="small">Content bank tip:</b> keep 8 theme folders with 5 facts + 2 examples each (Bangladesh economy, ethics/CSR, technology/AI, education, climate/urbanization, youth employment, gender, global trade).</div>
    </div>
  </div>
  <div class="section-head"><h3>Prompt bank — rotate for practice</h3><div class="rule"></div></div>
  ${bank}
  <div class="section-head"><h3>History</h3><div class="rule"></div></div>
  <div class="card">${history ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Prompt</th><th class="num">Words</th><th class="num">Time</th><th class="num">Rubric</th><th></th></tr></thead><tbody>${history}</tbody></table></div>` : `<div class="empty-note">No pieces yet. Pick a prompt above and beat the 15-minute clock.</div>`}</div>`;
}

/* ================= PLAN ================= */
function renderPlan() {
  const a = A;
  const days = a.plan7.days.map((d, di) => {
    const done = S.plan_done[d.date] || [];
    return `<div class="day-card ${di === 0 ? "today" : ""}">
      <div class="day-head"><b>${d.weekday} · ${fmtDate(d.date)}</b>
        <span>${d.mock ? '<span class="chip maroon">MOCK DAY</span>' : ""}${d.rest ? '<span class="chip green">REST</span>' : ""}<span class="hint">${d.tasks.reduce((s, t) => s + t.minutes, 0)} min</span></span></div>
      ${d.tasks.map((t, i) => { const isDone = done.includes(i);
        return `<div class="task-row ${isDone ? "done" : ""}"><input type="checkbox" ${isDone ? "checked" : ""} data-action="toggle-task" data-date="${d.date}" data-idx="${i}"><span>${esc(t.name)}${t.tag ? ` <span class="pill chip grey">${esc(t.tag)}</span>` : ""}</span><span class="task-nums">${t.minutes} min${t.questions ? " · " + t.questions + (t.questions === 1 ? " piece" : " Qs") : ""}</span></div>`; }).join("")}
    </div>`; }).join("");
  const weeks = a.weeklyPlan.map(w => `<details class="acc"><summary>Week ${w.week} — ${esc(w.focus)} <span class="hint">~${w.hours} h/week</span></summary>
    <div class="acc-body"><ul class="list-plain">${w.tasks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div></details>`).join("");
  const hrs = num(S.weekly_study_hours_available) || 0;
  return `
  <div class="grid g4" style="margin-bottom:14px">
    <div class="tile"><div class="t-label">Days remaining</div><div class="t-value">${a.daysLeft === null ? "—" : Math.max(0, a.daysLeft)}</div></div>
    <div class="tile"><div class="t-label">Daily budget</div><div class="t-value">${a.plan7.dailyMin}<span style="font-size:13px"> min</span></div><div class="t-hint">from ${hrs} h/week</div></div>
    <div class="tile"><div class="t-label">Next mock due</div><div class="t-value" style="font-size:16px">${a.plan7.mockDue ? fmtDate(a.plan7.mockDue) : "on cadence"}</div><div class="t-hint">every 7 days (3 in final 10)</div></div>
    <div class="tile"><div class="t-label">Rest day</div><div class="t-value" style="font-size:16px">${esc(S.rest_day)}</div><div class="t-hint">non-negotiable — 1/week</div></div>
  </div>
  ${a.daysLeft !== null && a.daysLeft < 30 ? `<div class="callout warn"><b>Compressed mode (under 30 days):</b> all [P3] topics dropped first, then [P2] depth halved; minimum 2 full mocks kept; last 48 hours stay light. ${hrs < 15 ? "Your weekly hours are below 15 — priority is [P1] math & English topics, puzzles, and one essay every two days. Be honest with yourself about the risk this carries." : ""}</div>` : ""}
  <div class="section-head"><h3>Next 7 days</h3><div class="rule"></div></div>
  ${days}
  <div class="section-head"><h3>4-week roadmap (auto-scaled)</h3><div class="rule"></div></div>
  ${weeks}
  <div class="callout info" style="margin-top:12px"><b>Daily skeleton behind this plan:</b> English 60 · Math 90 · Analytical 60 · Writing 30 (from week 2) · Vocab + current affairs 30 · Error-log review 15 (minutes, scaled to your weekly hours). Mock cadence: Day 1, then every 7 days, then every 3 days in the final 10.</div>`;
}

/* ================= VIVA ================= */
function renderViva() {
  const v = S.viva;
  const pct = A.vivaReady;
  const stories = (v.story_bank || []).slice().reverse().map(s => `
    <details class="acc"><summary>${esc(s.title)}</summary><div class="acc-body">
      <div class="kv"><span>Situation</span><span style="text-align:right">${esc(s.situation)}</span></div>
      <div class="kv"><span>Task</span><span style="text-align:right">${esc(s.task)}</span></div>
      <div class="kv"><span>Action</span><span style="text-align:right">${esc(s.action)}</span></div>
      <div class="kv"><span>Result</span><span style="text-align:right">${esc(s.result)}</span></div>
      <button class="btn sm danger" data-action="del-story" data-id="${s.id}" style="margin-top:8px">delete</button>
    </div></details>`).join("");
  const caNotes = (v.ca_notes || []).slice().reverse().map(c => `<div class="flag-row"><span class="chip grey">${fmtDate(c.date)}</span><div>${esc(c.fact)}</div><button class="btn sm danger" data-action="del-ca" data-id="${c.id}">×</button></div>`).join("");
  const bank = KB.VIVA_BANK.map(g => `<details class="acc"><summary>${esc(g.cat)} <span class="hint">${g.qs.length} questions</span></summary><div class="acc-body"><ul class="list-plain">${g.qs.map(q => `<li>${esc(q)}</li>`).join("")}</ul></div></details>`).join("");
  return `
  <div class="grid g2">
    <div class="card"><h3>Viva readiness</h3>
      <div class="gauge-wrap">${donut(pct, "viva", "readiness")}
        <div style="flex:1">
          <div class="kv"><span>Mock interviews</span><b style="display:flex;gap:6px;align-items:center"><button class="btn sm" data-action="viva-int" data-d="-1">−</button> ${v.mock_interviews_done} <button class="btn sm" data-action="viva-int" data-d="1">+</button><span class="hint" style="margin-left:6px">target ≥4</span></b></div>
          <div class="field" style="margin-top:8px"><label>English speaking: <output id="out-spk">${v.self_rating_english_speaking}</output>/10</label><input type="range" min="1" max="10" value="${v.self_rating_english_speaking}" data-range-out="out-spk" data-save-viva="self_rating_english_speaking"></div>
          <div class="checkbox-line"><input type="checkbox" ${v.ca_habit ? "checked" : ""} data-save-viva-check="ca_habit"> <span>Daily current-affairs habit active (20–30 min)</span></div>
        </div>
      </div>
      <div class="callout info" style="margin-bottom:0"><b>Assessed on:</b> English proficiency, reasoning, confidence/communication and presentation. The viva has its own pass mark.</div>
    </div>
    <div class="card"><h3>Coaching rules</h3>
      <ul class="list-plain">${KB.VIVA_RULES.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <div class="callout warn" style="margin-bottom:0"><b>Story bank: ${(v.story_bank || []).length}/6 STAR stories.</b> Two-sentence versions count — capture now, polish later.</div>
    </div>
  </div>
  <div class="section-head"><h3>STAR story bank</h3><div class="rule"></div><button class="btn sm primary" data-action="new-story">+ Add</button></div>
  ${stories || `<div class="empty-note">6 stories needed: achievement, failure, conflict, leadership, decision under pressure, teamwork.</div>`}
  <div class="grid g2" style="margin-top:8px">
    <div class="card"><h3>Current-affairs notebook</h3><p class="card-sub">10 key facts per month, with dates, verified from official sources (Bangladesh Bank, BBS).</p>
      <form data-form="ca" class="frow" style="grid-template-columns:1fr 3fr auto;align-items:end">
        <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}"></div>
        <div class="field"><label>Fact</label><input name="fact" required placeholder="e.g., Policy rate 10% — verify at Bangladesh Bank"></div>
        <div class="field"><button class="btn primary" type="submit">+</button></div>
      </form>
      ${caNotes || `<div class="hint">No facts yet.</div>`}
    </div>
    <div class="card"><h3>Question bank</h3><p class="card-sub">Generate answers as point → reason → example. Never memorize scripts.</p>${bank}</div>
  </div>`;
}

/* ================= GUIDE ================= */
function renderGuide() {
  const formulas = KB.FORMULAS.map(f => `<details class="acc"><summary>${esc(f.g)}</summary><div class="acc-body">${f.items.map(i => `<div class="formula">${i}</div>`).join("")}</div></details>`).join("");
  return `
  <div class="card"><h3>Written test structure <span class="chip amber">last confirmed cycle [VERIFY]</span></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Part</th><th>Marks</th><th>Time</th><th>Notes</th></tr></thead><tbody>
      <tr><td><b>Part 1 — MCQ</b></td><td><b>70</b></td><td>90 min</td><td>English 30 · Math 25 (some years 30) · Analytical 15</td></tr>
      <tr><td><b>Part 2 — Descriptive writing</b></td><td><b>30</b></td><td>30 min</td><td>Two essay-type pieces, 15 each</td></tr>
      <tr><td>Negative marking</td><td>−0.25/wrong MCQ</td><td></td><td>Options per question: 4 assumed [VERIFY]</td></tr>
      <tr><td>Sectional qualification</td><td></td><td></td><td>Probably exists — a minimum in EACH MCQ section [VERIFY]</td></tr>
      <tr><td>Writing evaluation</td><td></td><td></td><td>Only ~top 400–500 MCQ qualifiers historically [VERIFY]</td></tr>
    </tbody></table></div>
    <div class="callout warn" style="margin-bottom:0">${esc(KB.EXAM.passNote)}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Negative-marking calculator</h3><p class="card-sub">Should you guess? Expected value = p×1 − (1−p)×0.25.</p>
      <div class="frow fr2">
        <div class="field"><label>Options per question</label><select id="ev-options"><option value="4" selected>4 (assumed)</option><option value="5">5</option></select></div>
        <div class="field"><label>Options you can eliminate</label><select id="ev-elim"><option value="0" selected>0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
      </div>
      <div id="ev-result" class="callout ok" style="margin-bottom:0"></div>
    </div>
    <div class="card"><h3>Exam-day strategy</h3><ul class="list-plain">${KB.DAY_STRATEGY.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  </div>
  <div class="section-head"><h3>Math formula bank (memorize)</h3><div class="rule"></div></div>
  ${formulas}
  <div class="section-head"><h3>English toolkit</h3><div class="rule"></div></div>
  <div class="grid g2">
    <div class="card"><h3>Grammar checklist</h3><div class="topic-grid">${KB.GRAMMAR_CHECKLIST.map(g => `<span class="chip grey">${esc(g)}</span>`).join("")}</div></div>
    <div class="card"><h3>Vocabulary plan</h3><ul class="list-plain"><li>15–20 new words/day from a GRE/GMAT-lite list, learned in sentences</li><li>Spaced repetition: review at 1, 3, 7, 21 days</li><li>Learn root/prefix/suffix families</li><li>Target: 400+ words in 30 days at ≥80% retention</li><li>1 editorial daily + one-line summary (feeds RC speed)</li></ul></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Current affairs & reading habits</h3><ul class="list-plain">${KB.CA_PLAN.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Study hygiene & resources</h3><ul class="list-plain">${KB.STUDY_HYGIENE.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Scope guard</h3><div class="callout danger" style="margin-bottom:0">${esc(KB.SCOPE_GUARD)}</div></div>
    <div class="card"><h3>Honesty rules of this tool</h3><ul class="list-plain">${KB.DISCLAIMERS.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>
  </div>
  <div class="card"><h3>Verify list — check against the official circular</h3><ul class="list-plain">${KB.VERIFY_ITEMS.map(v => `<li>${esc(v)}</li>`).join("")}</ul><p class="hint" style="margin-top:8px">Official portal: www.iba-du.edu. When you enter verified data on the Profile page, it overrides every assumption in this app.</p></div>`;
}

/* ================= DATA ================= */
function renderData() {
  const bytes = new Blob([localStorage.getItem(LS_KEY) || ""]).size;
  return `
  <div class="grid g2">
    <div class="card"><h3>Export / backup</h3><p class="card-sub">Downloads all your data as JSON (mirrors the coach's user-input schema). Store a copy in Drive or email — browser data can be wiped.</p>
      <button class="btn primary" data-action="export">⭳ Download JSON</button>
    </div>
    <div class="card"><h3>Import</h3><p class="card-sub">Restores a previously exported file. This replaces current data.</p>
      <input type="file" id="import-file" accept="application/json">
      <button class="btn" data-action="import" style="margin-top:10px">⭱ Import file</button>
    </div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Sample data</h3><p class="card-sub">Loads a clearly-labeled demo profile, 4 mocks, practice logs and more — for exploring the app. Your current data will be replaced.</p>
      <button class="btn" data-action="load-demo">Load demo data</button>
    </div>
    <div class="card"><h3>Danger zone</h3><p class="card-sub">Current storage: ${(bytes / 1024).toFixed(1)} KB. Everything is local to this browser.</p>
      <button class="btn danger" data-action="reset">Erase all data</button>
    </div>
  </div>
  <div class="card"><h3>Privacy</h3><p class="small muted">This app has no server, no account and no analytics. Your profile, scores and notes never leave your browser unless you export the file yourself.</p></div>`;
}

/* ---------------- modals ---------------- */
function practiceModal(topicId) {
  const t = topicById(topicId) || KB.TAXONOMY[0];
  return `<form data-form="practice">
    <h3>Log practice — ${esc(t.name)}</h3>
    <p class="hint" style="margin-top:-8px">${esc(t.tip)}</p>
    <input type="hidden" name="topic_id" value="${t.id}">
    <div class="frow fr2">
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}"></div>
      <div class="field"><label>Questions attempted</label><input name="attempted" type="number" min="1" required></div>
      <div class="field"><label>Correct</label><input name="correct" type="number" min="0" required></div>
      <div class="field"><label>Avg time (sec/question)</label><input name="avg_time_sec" type="number" min="0"></div>
    </div>
    <div class="checkbox-line" style="margin-bottom:12px"><input type="checkbox" name="timed" checked> <span>Timed practice</span></div>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}
function pieceModal(prompt, theme) {
  return `<form data-form="piece">
    <h3>Timed writing piece</h3>
    <div class="field"><label>Prompt</label><textarea name="prompt" required>${esc(prompt || "")}</textarea></div>
    <div class="frow fr3">
      <div class="field"><label>Theme</label><input name="theme" value="${esc(theme || "")}"></div>
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}"></div>
      <div class="field"><label>Time (min)</label><input name="time_min" type="number" value="15"></div>
    </div>
    <div class="field"><label>Word count</label><input name="words" type="number"></div>
    <div class="frow fr3">
      <div class="field"><label>Relevance /4</label><input name="relevance" type="number" min="0" max="4" value="3"></div>
      <div class="field"><label>Thesis & structure /4</label><input name="thesis" type="number" min="0" max="4" value="3"></div>
      <div class="field"><label>Evidence /3</label><input name="evidence" type="number" min="0" max="3" value="2"></div>
      <div class="field"><label>Language /3</label><input name="language" type="number" min="0" max="3" value="2"></div>
      <div class="field"><label>Coherence /1</label><input name="coherence" type="number" min="0" max="1" value="1"></div>
    </div>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Save piece</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}
function storyModal() {
  return `<form data-form="story">
    <h3>STAR story</h3>
    <div class="field"><label>Title</label><input name="title" required placeholder="e.g., Led the university fundraising drive"></div>
    <div class="field"><label>Situation</label><textarea name="situation" required></textarea></div>
    <div class="field"><label>Task</label><textarea name="task" required></textarea></div>
    <div class="field"><label>Action</label><textarea name="action" required></textarea></div>
    <div class="field"><label>Result</label><textarea name="result" required></textarea></div>
    <p class="hint">60–90 seconds spoken. Keep numbers in the Result.</p>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Save story</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}
function errorModal() {
  return `<form data-form="error">
    <h3>Log an error</h3>
    <div class="field"><label>What went wrong</label><textarea name="question" required></textarea></div>
    <div class="field"><label>Topic</label><select name="topic_id">${KB.TAXONOMY.filter(t => t.sec !== "viva").map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Why wrong</label><select name="why"><option>concept</option><option>careless</option><option>time</option><option>misread</option></select></div>
    <div class="field"><label>The fix</label><textarea name="fix" required></textarea></div>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Log error</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}
function studyLogModal() {
  return `<form data-form="studylog">
    <h3>Log study hours</h3>
    <div class="frow fr2">
      <div class="field"><label>Date</label><input name="date" type="date" value="${todayISO()}"></div>
      <div class="field"><label>Hours</label><input name="hours" type="number" step="0.5" min="0" required></div>
    </div>
    <div class="field"><label>Topics covered (optional)</label><select name="topic_id"><option value="">—</option>${KB.TAXONOMY.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
    <div style="display:flex;gap:8px"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-action="close-modal">Cancel</button></div>
  </form>`;
}

/* ---------------- EV calculator ---------------- */
function updateEV() {
  const opts = +($("#ev-options") ? $("#ev-options").value : 4);
  const elim = +($("#ev-elim") ? $("#ev-elim").value : 0);
  const remaining = Math.max(1, opts - elim);
  const p = 1 / remaining;
  const ev = p * 1 - (1 - p) * 0.25;
  const el = $("#ev-result");
  if (!el) return;
  const verdict = ev > 0.05 ? `<b>Guess — clearly positive EV (+${ev.toFixed(3)}).</b> Blind guessing with ${opts} options is already +${(1 / opts - (1 - 1 / opts) * 0.25).toFixed(3)}; eliminating ${elim} more option(s) improves it.`
    : ev > 0 ? `<b>Guess — slightly positive EV (+${ev.toFixed(3)}).</b>`
    : ev === 0 ? `<b>Break-even (EV = 0).</b> With ${opts} options a blind guess is exactly break-even — only guess after eliminating at least one option.`
    : `<b>Skip (EV = ${ev.toFixed(3)}).</b> Negative expected value at this confidence.`;
  el.innerHTML = `P(correct) if guessing among ${remaining}: <b>${(p * 100).toFixed(0)}%</b> · EV per guess: <b>${ev >= 0 ? "+" : ""}${ev.toFixed(3)}</b> marks.<br>${verdict}`;
}

/* ---------------- event delegation ---------------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (e.target.id === "modal-overlay") { closeModal(); return; }
  if (!el) return;
  const act = el.dataset.action;
  const num_ = (v) => num(v);
  switch (act) {
    case "nav": route = el.dataset.route; render(); break;
    case "close-modal": closeModal(); break;
    case "new-mock": openModal(mockFormHtml()); break;
    case "new-practice": openModal(practiceModal(el.dataset.topic)); break;
    case "new-error": openModal(errorModal()); break;
    case "new-piece": openModal(pieceModal(el.dataset.prompt, el.dataset.theme)); break;
    case "new-story": openModal(storyModal()); break;
    case "new-studylog": openModal(studyLogModal()); break;
    case "load-demo": S = KB.demoState(); S.plan_done = {}; refresh(); toast("Demo data loaded — every demo value is synthetic."); route = "dashboard"; render(); break;
    case "reset": if (confirm("Erase ALL data from this browser? This cannot be undone.")) { S = freshState(); refresh(); toast("All data erased."); } break;
    case "export": {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(blob);
      a2.download = `iba-mba-coach-${todayISO()}.json`;
      a2.click(); URL.revokeObjectURL(a2.href);
      toast("Exported."); break;
    }
    case "import": {
      const f = $("#import-file") && $("#import-file").files[0];
      if (!f) { toast("Choose a file first."); break; }
      const r = new FileReader();
      r.onload = () => { try { const s = JSON.parse(r.result); if (!s || !s.version) throw new Error("Not a coach export file"); S = s; refresh(); toast("Imported."); } catch (err) { toast("Import failed: " + err.message); } };
      r.readAsText(f); break;
    }
    case "del-mock": if (confirm("Delete this mock?")) { S.mocks = S.mocks.filter(m => m.id !== el.dataset.id); refresh(); } break;
    case "del-practice": S.practice = S.practice.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "del-studylog": S.study_log = S.study_log.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "del-error": S.error_log = S.error_log.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "resolve-error": S.error_log = S.error_log.map(p => p.id === el.dataset.id ? { ...p, resolved: true } : p); refresh(); toast("Marked fixed — the spaced retries will clear."); break;
    case "del-piece": S.writing_log = S.writing_log.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "del-story": S.viva.story_bank = S.viva.story_bank.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "del-ca": S.viva.ca_notes = S.viva.ca_notes.filter(p => p.id !== el.dataset.id); refresh(); break;
    case "viva-int": S.viva.mock_interviews_done = Math.max(0, (num_(S.viva.mock_interviews_done) || 0) + (+el.dataset.d)); refresh(); break;
    case "toggle-task": {
      const d = el.dataset.date, idx = +el.dataset.idx;
      S.plan_done[d] = S.plan_done[d] || [];
      const i = S.plan_done[d].indexOf(idx);
      if (i >= 0) S.plan_done[d].splice(i, 1); else S.plan_done[d].push(idx);
      save(); render(); break;
    }
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("[data-save-viva]")) { S.viva[t.dataset.saveViva] = +t.value; refresh(); }
  if (t.matches("[data-save-viva-check]")) { S.viva[t.dataset.saveVivaCheck] = t.checked; refresh(); }
  if (t.id === "ev-options" || t.id === "ev-elim") updateEV();
  if (t.id === "import-file") { /* wait for button */ }
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.matches("[data-range-out]")) { const out = document.getElementById(t.dataset.rangeOut); if (out) out.textContent = t.value; }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const fd = new FormData(form);
  const v = Object.fromEntries(fd.entries());
  const kind = form.dataset.form;
  if (kind === "profile") {
    const p = S.profile;
    p.name = v.name.trim(); p.age = v.age; p.degree_type = v.degree_type; p.university = v.university; p.major = v.major;
    p.cgpa_4 = v.cgpa_4; p.graduation_year = v.graduation_year; p.second_class = fd.has("second_class");
    p.ssc_gpa = v.ssc_gpa; p.hsc_gpa = v.hsc_gpa; p.third_division = fd.has("third_division");
    p.oal_track = fd.has("oal_track"); p.o_subjects = v.o_subjects; p.o_gpa = v.o_gpa; p.a_subjects = v.a_subjects; p.a_gpa = v.a_gpa; p.c_or_better = v.c_or_better;
    p.ugc_approved = fd.has("ugc_approved"); p.foreign_degree = fd.has("foreign_degree");
    p.work_experience_years = v.work_experience_years; p.industry = v.industry; p.role = v.role; p.english_background = v.english_background;
    S.exam_date = v.exam_date || S.exam_date;
    S.weekly_study_hours_available = num(v.weekly_study_hours_available) || S.weekly_study_hours_available;
    S.rest_day = v.rest_day; S.math_marks = +v.math_marks || 25;
    S.official_circular = { test_date: v.oc_test_date, application_deadline: v.oc_application_deadline, verified_on: v.oc_verified_on, option_count_per_mcq: v.oc_option_count_per_mcq, merit_weights: v.oc_merit_weights, work_experience_rule: v.oc_work_experience_rule };
    S.self_assessment = { stress: +v.stress || 5, confidence: +v.confidence || 5, weak_areas_text: v.weak_areas_text };
    refresh(); toast("Profile saved — eligibility rechecked.");
  }
  if (kind === "mock") {
    const m = { id: uid(), date: v.date, type: v.type, mathMax: +v.mathMax || 25,
      eng: { correct: v.eng_correct, wrong: v.eng_wrong, direct: v.eng_direct },
      math: { correct: v.math_correct, wrong: v.math_wrong, direct: v.math_direct },
      ana: { correct: v.ana_correct, wrong: v.ana_wrong, direct: v.ana_direct },
      writing: v.writing, time_taken_min: v.time_taken_min, notes: "" };
    const hasData = ["eng_correct","eng_wrong","eng_direct","math_correct","math_wrong","math_direct","ana_correct","ana_wrong","ana_direct","writing"].some(k => v[k] !== "" && v[k] !== undefined && v[k] !== null);
    if (!hasData) { toast("Enter at least one section score."); return; }
    S.mocks.push(m); refresh(); closeModal(); toast("Mock saved.");
  }
  if (kind === "practice") {
    S.practice.push({ id: uid(), date: v.date, topic_id: v.topic_id, attempted: +v.attempted, correct: +v.correct, avg_time_sec: num(v.avg_time_sec) || null, timed: fd.has("timed") });
    refresh(); closeModal(); toast("Practice logged.");
  }
  if (kind === "studylog") {
    S.study_log.push({ id: uid(), date: v.date, hours: +v.hours, topic_ids: v.topic_id ? [v.topic_id] : [] });
    S.study_log.sort((a2, b2) => a2.date.localeCompare(b2.date));
    refresh(); closeModal(); toast("Study hours logged.");
  }
  if (kind === "error") {
    S.error_log.push({ id: uid(), created: todayISO(), question: v.question.trim(), topic_id: v.topic_id, why: v.why, fix: v.fix.trim(), resolved: false });
    refresh(); closeModal(); toast("Error logged — retries at 2/7/21 days.");
  }
  if (kind === "piece") {
    S.writing_log.push({ id: uid(), date: v.date, prompt: v.prompt.trim(), theme: v.theme, words: num(v.words), time_min: num(v.time_min), scores: { relevance: +v.relevance || 0, thesis: +v.thesis || 0, evidence: +v.evidence || 0, language: +v.language || 0, coherence: +v.coherence || 0 } });
    refresh(); closeModal(); toast("Piece saved — compare against a model answer weekly.");
  }
  if (kind === "story") {
    S.viva.story_bank.push({ id: uid(), title: v.title.trim(), situation: v.situation.trim(), task: v.task.trim(), action: v.action.trim(), result: v.result.trim() });
    refresh(); closeModal(); toast("Story added — rehearse it aloud at 60–90 seconds.");
  }
  if (kind === "ca") {
    S.viva.ca_notes.push({ id: uid(), date: v.date, fact: v.fact.trim() });
    refresh(); toast("Fact saved.");
  }
});

/* ---------------- init ---------------- */
A = ENGINE.analyze(S);
render();
if (A.chance.band !== "Unknown" && !localStorage.getItem(LS_KEY + "_seen")) {
  localStorage.setItem(LS_KEY + "_seen", "1");
}
