/* =====================================================================
   IBA-MBA Coach — knowledge base (community-derived, unofficial)
   Source: master system prompt v1.0. Priority tags: P1 = almost every
   year (weight 3), P2 = common (2), P3 = occasional (1).
   ===================================================================== */

const KB = {};

/* ---------- Exam facts ([VERIFY] items are labeled in the UI) ---------- */
KB.EXAM = {
  totalMarks: 100, totalMinutes: 120,
  mcqMarks: 70, mcqMinutes: 90, negPerWrong: 0.25,
  sections: [
    { id: "eng",  name: "English",                 marks: 30, minutes: "25–30" },
    { id: "math", name: "Mathematical Reasoning",  marks: 25, minutes: "35–40", altMarks: 30 },
    { id: "ana",  name: "Analytical Ability",      marks: 15, minutes: "≈20" }
  ],
  writing: { id: "wri", name: "Descriptive Writing", marks: 30, minutes: 30, pieces: 2, perPiece: 15 },
  qualifierNote: "Only roughly the top 400–500 MCQ qualifiers historically get their writing evaluated — the MCQ part is a gate. [VERIFY]",
  passNote: "Pass mark varies by year (about 40–60%); treat 60% overall AND per section as the safe zone, not a rule. [VERIFY]"
};

KB.CYCLE = {
  lastConfirmed: "2025-26 (68th batch): written test Friday 5 Dec 2025, 10:00 am; applications closed Thursday 27 Nov 2025.",
  expectation: "2026-27 cycle: circular NOT yet confirmed. Expect the circular/application around November and the test in early December — EXPECTED, NOT ANNOUNCED.",
  stages: ["Online application", "Written test", "Written result (only qualifiers get viva)", "Viva voce", "Final merit list", "Enrollment"]
};

KB.VERIFY_ITEMS = [
  "Number of options per MCQ (4 assumed) — affects guessing strategy.",
  "2026-27 circular: official test date and application deadline.",
  "Work-experience requirement for the regular MBA (not stated in last confirmed notice).",
  "Final merit weights (written / viva / academics) are unknown.",
  "Whether sectional minimum qualification exists (community reports say yes).",
  "Exact Math section marks (25 or 30) for the current cycle."
];

KB.SCOPE_GUARD = "This tool is built ONLY for the IBA, University of Dhaka MBA (full-time/part-time). It is not for the Executive MBA (separate test, 5+ years' experience), not for the BBA, and not for IBA Karachi or IBA Rajshahi. Do not mix their rules into this analysis.";

/* ---------- Topic taxonomy — use these EXACT IDs ---------- */
/* tag: 3=P1 (almost every year), 2=P2, 1=P3, 2.5 = P1–P2 / P2–P3 ranges */
KB.TAXONOMY = [
  // ENGLISH (30 marks)
  { id:"eng_sentence_completion",      sec:"eng", name:"Sentence completion",        tag:3,   tagLabel:"P1",     pq:40, tip:"Predict the word before reading options; check the logical direction (same/opposite); test each option in the full sentence." },
  { id:"eng_sentence_correction",      sec:"eng", name:"Sentence correction",        tag:3,   tagLabel:"P1",     pq:45, tip:"Eliminate options that change the meaning, then choose the most concise correct one." },
  { id:"eng_error_spotting",           sec:"eng", name:"Error spotting",             tag:3,   tagLabel:"P1",     pq:45, tip:"Check the verb first (agreement, tense), then pronouns, prepositions/articles, then parallelism." },
  { id:"eng_reading_comp",             sec:"eng", name:"Reading comprehension",      tag:2.5, tagLabel:"P1–P2",  pq:80, tip:"Read questions first; every answer must be traceable to a line; eliminate extreme words (always/never/only)." },
  { id:"eng_vocab_synonym_antonym",    sec:"eng", name:"Vocabulary / synonym-antonym",tag:2,  tagLabel:"P2",     pq:30, tip:"15–20 words/day in context sentences, spaced repetition at 1, 3, 7, 21 days." },
  { id:"eng_analogy",                  sec:"eng", name:"Analogy",                    tag:2.5, tagLabel:"P2–P3",  pq:40, tip:"State the relationship in one sentence ('X is a type of Y'), then match it." },
  { id:"eng_idioms",                   sec:"eng", name:"Idioms and phrases",         tag:1,   tagLabel:"P3",     pq:30, tip:"10 minutes of micro-practice; learn idioms in example sentences." },
  { id:"eng_voice_narration",          sec:"eng", name:"Voice / narration",          tag:1,   tagLabel:"P3",     pq:35, tip:"Revise active↔passive and direct↔indirect rules as quick drills." },
  // MATHEMATICAL REASONING (25–30 marks)
  { id:"math_percentage",              sec:"math", name:"Percentage",                tag:3, tagLabel:"P1", pq:60, tip:"Convert % to fractions (25% = 1/4); assume 100 or the LCM as base; multipliers (20% up = ×1.2)." },
  { id:"math_profit_loss",             sec:"math", name:"Profit, loss & discount",   tag:3, tagLabel:"P1", pq:60, tip:"Markup vs discount; CP/SP relations; 'x% more/less' reversal; successive change a+b+ab/100." },
  { id:"math_ratio",                   sec:"math", name:"Ratio & proportion",        tag:3, tagLabel:"P1", pq:60, tip:"Unit method: 1 part = ?; ratio to actual values." },
  { id:"math_average",                 sec:"math", name:"Average",                   tag:3, tagLabel:"P1", pq:60, tip:"Use sums (average × n); weighted average; change when adding/removing an item." },
  { id:"math_time_work",               sec:"math", name:"Time & work (pipes)",       tag:3, tagLabel:"P1", pq:75, tip:"Total work = LCM of days; rate = work/day; negative rate for leaks." },
  { id:"math_tsd",                     sec:"math", name:"Time-speed-distance",       tag:3, tagLabel:"P1", pq:75, tip:"Relative speed: same direction subtract, opposite add; equal-distance average = 2ab/(a+b); km/h × 5/18 = m/s." },
  { id:"math_interest",                sec:"math", name:"Simple & compound interest",tag:3, tagLabel:"P1", pq:60, tip:"CI−SI for 2 years = P(r/100)²; adjust for half-yearly compounding." },
  { id:"math_ages",                    sec:"math", name:"Ages",                      tag:3, tagLabel:"P1", pq:60, tip:"Age differences stay constant over time; set x, y with ratios." },
  { id:"math_partnership",             sec:"math", name:"Partnership",               tag:3, tagLabel:"P1", pq:60, tip:"Share ∝ investment × time." },
  { id:"math_mixture",                 sec:"math", name:"Mixture & alligation",      tag:3, tagLabel:"P1", pq:75, tip:"Alligation cross method for two-price mixtures; replacement formula." },
  { id:"math_numbers",                 sec:"math", name:"Number properties",         tag:2, tagLabel:"P2", pq:60, tip:"Divisibility, remainders, primes, odd/even, factors count." },
  { id:"math_lcm_hcf",                 sec:"math", name:"LCM & HCF",                 tag:2, tagLabel:"P2", pq:60, tip:"LCM×HCF = product (two numbers); word problems with bells/circles." },
  { id:"math_algebra",                 sec:"math", name:"Algebra",                   tag:2, tagLabel:"P2", pq:75, tip:"Linear/quadratic, inequalities, indices, surds. Substitute option values when equations look heavy." },
  { id:"math_geometry",                sec:"math", name:"Geometry & mensuration",    tag:2, tagLabel:"P2", pq:75, tip:"Always draw the figure; memorize triples 3-4-5, 5-12-13, 8-15-17." },
  { id:"math_probability",             sec:"math", name:"Probability & counting",    tag:2, tagLabel:"P2", pq:60, tip:"P = favourable/total; complement; cards/dice/balls." },
  { id:"math_sets",                    sec:"math", name:"Sets & Venn diagrams",      tag:1, tagLabel:"P3", pq:60, tip:"n(A∪B) = n(A)+n(B)−n(A∩B); draw the Venn first." },
  { id:"math_data_interpretation",     sec:"math", name:"Data interpretation",       tag:1, tagLabel:"P3", pq:90, tip:"Read the chart title and units first; estimate before computing." },
  // ANALYTICAL ABILITY (15 marks)
  { id:"ana_seating",                  sec:"ana", name:"Seating puzzles (linear/circular)", tag:3, tagLabel:"P1", pq:75, tip:"Place definite clues first; draw the arrangement; verify every clue at the end." },
  { id:"ana_ordering",                 sec:"ana", name:"Ordering & ranking",          tag:3, tagLabel:"P1", pq:70, tip:"Watch 'immediately next to' vs 'somewhere to the left'." },
  { id:"ana_grouping",                 sec:"ana", name:"Grouping & selection",        tag:3, tagLabel:"P1", pq:75, tip:"Build a grid; use cases when stuck." },
  { id:"ana_scheduling",               sec:"ana", name:"Scheduling & matching",       tag:3, tagLabel:"P1", pq:75, tip:"Timelines and matching tables; start with the fixed events." },
  { id:"ana_critical_reasoning",       sec:"ana", name:"Critical reasoning",          tag:2.5, tagLabel:"P1–P2", pq:60, tip:"Separate premise from conclusion; predict the answer category before reading options." },
  { id:"ana_syllogism",                sec:"ana", name:"Syllogisms & deduction",      tag:2, tagLabel:"P2", pq:55, tip:"Venn diagrams for all statements; test 'possible' vs 'definite' separately." },
  { id:"ana_data_sufficiency",         sec:"ana", name:"Data sufficiency",            tag:1, tagLabel:"P3", pq:75, tip:"5-option framework: (1) alone, (2) alone, both, either, neither. Evaluate (1) alone first." },
  { id:"ana_series",                   sec:"ana", name:"Number/letter series",        tag:1, tagLabel:"P3", pq:50, tip:"Check differences, ratios, alternating patterns, squares/primes." },
  // DESCRIPTIVE WRITING (30 marks) — skills, not question counts
  { id:"wri_argumentative",            sec:"wri", name:"Argumentative essay",   tag:3, tagLabel:"P1", pq:0, tip:"Thesis must answer the prompt directly; one counterargument paragraph." },
  { id:"wri_descriptive",              sec:"wri", name:"Descriptive / thematic piece", tag:2, tagLabel:"P2", pq:0, tip:"Concrete examples from Bangladesh context score well." },
  { id:"wri_structure",                sec:"wri", name:"PEEL structure & planning", tag:3, tagLabel:"P1", pq:0, tip:"3 min plan → 11–12 min write → 1 min proofread. 250–300 words." },
  { id:"wri_grammar",                  sec:"wri", name:"Grammar under pressure", tag:3, tagLabel:"P1", pq:0, tip:"Short sentences first; vary length; avoid fancy words you can't spell." },
  { id:"wri_vocab",                    sec:"wri", name:"Linking phrases & register", tag:2, tagLabel:"P2", pq:0, tip:"30 linking phrases: moreover, in contrast, consequently, nevertheless…" },
  { id:"wri_time",                     sec:"wri", name:"Timed-writing discipline", tag:3, tagLabel:"P1", pq:0, tip:"Practice the 12-minute write + 1-minute proofread discipline." },
  // VIVA (no written marks — tracked for readiness)
  { id:"viva_motivation",              sec:"viva", name:"Motivation (Why MBA/IBA)",  tag:3, tagLabel:"Core", pq:0, tip:"90-second 'tell me about yourself'; 60-second 'Why MBA, why IBA'." },
  { id:"viva_background",              sec:"viva", name:"Background & academics",    tag:3, tagLabel:"Core", pq:0, tip:"Degree, projects, CGPA, gaps — 2-sentence story each." },
  { id:"viva_current_affairs",         sec:"viva", name:"Current affairs",           tag:3, tagLabel:"Core", pq:0, tip:"20–30 min daily from a Bangladeshi English daily's business pages." },
  { id:"viva_business_cases",          sec:"viva", name:"Business cases & estimation", tag:2, tagLabel:"Core", pq:0, tip:"Market sizing, 'increase sales of X' — structure aloud." },
  { id:"viva_hr_behavioral",           sec:"viva", name:"Behavioral (STAR)",         tag:3, tagLabel:"Core", pq:0, tip:"6 STAR stories, 60–90 seconds each." },
  { id:"viva_english",                 sec:"viva", name:"English speaking check",    tag:3, tagLabel:"Core", pq:0, tip:"Speak English 15 min daily; record and review." }
];

KB.MASTERY = [
  { key:"not_started", label:"Not started", value:0.02, color:"#9aa0a6", rule:"<20% accuracy or <10 questions" },
  { key:"learning",    label:"Learning",    value:0.35, color:"#c2540a", rule:"20–50%" },
  { key:"developing",  label:"Developing",  value:0.60, color:"#b26a00", rule:"50–70%" },
  { key:"proficient",  label:"Proficient",  value:0.78, color:"#2456a6", rule:"70–85%" },
  { key:"mastered",    label:"Mastered",    value:0.93, color:"#1a7f4e", rule:">85% with good speed" }
];

KB.SECTION_NAMES = { eng:"English", math:"Mathematical Reasoning", ana:"Analytical Ability", wri:"Descriptive Writing", viva:"Viva" };
KB.GATES = [
  { min:65, label:"Strong",     cls:"green"  },
  { min:55, label:"Borderline", cls:"amber"  },
  { min:40, label:"Danger",     cls:"orange" },
  { min:0,  label:"Critical",   cls:"red"    }
];

/* ---------- Essay topic bank (rotate for practice) ---------- */
KB.ESSAY_BANK = {
  "Bangladesh economy": [
    "RMG dependence and the case for export diversification",
    "Taming inflation: policy choices and household impact",
    "Remittance: lifeline or crutch for the economy?",
    "LDC graduation in 2026: opportunity and risk",
    "FDI and the ease of doing business in Bangladesh",
    "Banking sector stress: causes and cures",
    "Climate adaptation finance for Bangladesh",
    "Digital Bangladesh: fintech, bKash and Nagad",
    "The SME and startup ecosystem",
    "The informal economy: challenge and opportunity",
    "Youth unemployment and the skills gap"
  ],
  "Business & management": [
    "Ethics vs profit: can they coexist?",
    "CSR: genuine responsibility or PR?",
    "Leadership vs management",
    "Innovation as survival strategy",
    "Customer focus as competitive advantage",
    "Sustainability in business",
    "Women in the workforce",
    "Remote work: the future of offices?"
  ],
  "Technology": [
    "AI and the future of jobs",
    "E-commerce in Bangladesh",
    "Cybersecurity is a business issue, not an IT issue",
    "Social media's impact on society",
    "Data privacy in the digital age"
  ],
  "Society & policy": [
    "Education quality and the job market",
    "Urbanization and Dhaka's traffic",
    "Brain drain: loss or global gain?",
    "Corruption and development",
    "Healthcare for all",
    "Gender equity in education and work",
    "Climate change and Bangladesh"
  ],
  "Global": [
    "Trade wars and supply chains",
    "The next global recession",
    "Geopolitics and South Asia",
    "The energy transition",
    "Globalization vs protectionism"
  ],
  "Quotes & abstract": [
    "\u201CFailure is the first step to success\u201D",
    "\u201CMoney cannot buy happiness\u201D",
    "\u201CTechnology makes us lonelier\u201D",
    "\u201CDiscipline beats talent\u201D",
    "\u201CA country's future is written in its classrooms\u201D"
  ]
};

/* ---------- Viva question bank ---------- */
KB.VIVA_BANK = [
  { cat:"1. Opening", qs:["Tell me about yourself.","Why an MBA?","Why IBA?","Why now?","What are your 5-year goals?"] },
  { cat:"2. Background", qs:["Walk me through your degree and thesis/projects.","Why did you choose your major?","Your CGPA is X — what happened?","Explain any gap in your timeline."] },
  { cat:"3. Work / experience", qs:["Your biggest achievement?","A failure and what you learned?","A conflict you handled?","A leadership example?","A decision you made under pressure?"] },
  { cat:"4. Business awareness", qs:["How is the Bangladesh economy doing right now?","Inflation and exchange rate — what's the trend?","State of the banking sector?","RMG: outlook after LDC graduation?","A startup you find interesting and why?","A recent business deal in the news?","A company you admire and why?"] },
  { cat:"5. Reasoning & cases", qs:["Estimate the market size for X in Dhaka.","How would you increase the sales of X?","An ethical dilemma: what would you do?","A quick brain teaser."] },
  { cat:"6. Behavioral", qs:["Your strengths and weaknesses?","How do you handle stress?","Tell me about your teamwork style.","How do you take critical feedback?"] },
  { cat:"7. English check", qs:["(Panel may switch to English only.) Speak on an abstract topic for a minute.","Give your opinion on a current issue with reasons."] }
];

KB.VIVA_RULES = [
  "Use the STAR method: Situation, Task, Action, Result.",
  "Keep answers to 60–90 seconds.",
  "Structure opinions as point → reason → example.",
  "Admit when you don't know — then reason aloud.",
  "Keep a 2-sentence story ready for each experience."
];

/* ---------- Current affairs plan ---------- */
KB.CA_PLAN = [
  "Daily (20–30 min): one Bangladeshi English daily — The Daily Star / The Business Standard — business & economy pages.",
  "Weekly: one global business piece (The Economist, FT, or HBR).",
  "Monthly: Bangladesh Bank and BBS summary indicators.",
  "Notebook: 10 key facts per month (GDP growth, inflation, policy rate, forex reserves, remittance, exports, budget changes) — with dates, verified from official sources."
];

/* ---------- Formula bank ---------- */
KB.FORMULAS = [
  { g:"Percentages", items:[
    "Fraction↔% table: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/7=14.28%, 1/8=12.5%, 1/9=11.11%, 1/10=10%, 1/11=9.09%, 1/12=8.33%, 1/13=7.69%, 1/14=7.14%, 1/15=6.67%, 1/16=6.25%, 1/18=5.56%, 1/20=5%",
    "Successive change: a + b + ab/100 (signs included)",
    "x% more ⇒ reversal: new/(1+x/100); x% less ⇒ new/(1−x/100)"
  ]},
  { g:"Profit / loss / discount", items:[
    "Profit% = (SP−CP)/CP × 100;  Loss% = (CP−SP)/CP × 100",
    "SP = CP × (1 ± m/100) × (1 − d/100)  (markup then discount)",
    "False weight: gain% = (error / (true − error)) × 100"
  ]},
  { g:"Interest", items:[
    "SI = P·R·T/100",
    "CI amount = P(1 + r/100)^n;  half-yearly: r/2, n×2;  quarterly: r/4, n×4",
    "CI − SI (2 years) = P(r/100)²"
  ]},
  { g:"Time & work", items:[
    "Total work = LCM(days);  Rate = work/day;  Combined rate = sum of rates",
    "Work = Rate × Time;  M1D1H1/W1 = M2D2H2/W2",
    "Pipe leak: negative rate"
  ]},
  { g:"Time–speed–distance", items:[
    "Relative speed: same direction −, opposite direction +",
    "Average speed (equal distances) = 2ab/(a+b)",
    "Train crossing pole: L = v·t;  platform: L_train + L_platform = v·t",
    "Boats: downstream = u + v, upstream = u − v;  km/h × 5/18 = m/s"
  ]},
  { g:"Alligation & mixture", items:[
    "Alligation: (Cheap : Dear) = (Dear − Mean) : (Mean − Cheap)",
    "Replacement: final = initial × (1 − r/V)^n"
  ]},
  { g:"Geometry & mensuration", items:[
    "Pythagorean triples: 3-4-5, 5-12-13, 8-15-17",
    "Circle: A = πr², C = 2πr, arc = (θ/360)·2πr",
    "Triangle area = ½·b·h;  equilateral = (√3/4)a²",
    "Cylinder V = πr²h;  cone = ⅓πr²h;  sphere = 4/3πr³"
  ]},
  { g:"Sets, probability, series", items:[
    "n(A∪B) = n(A) + n(B) − n(A∩B)",
    "P(E) = favourable/total;  P(not E) = 1 − P(E)",
    "AP: aₙ = a + (n−1)d,  Sₙ = n/2·(2a + (n−1)d)",
    "GP: aₙ = a·rⁿ⁻¹,  Sₙ = a(rⁿ−1)/(r−1)"
  ]}
];

KB.GRAMMAR_CHECKLIST = [
  "Tenses and sequence of tenses", "Conditionals (0/1/2/3)", "Modals",
  "Subject–verb agreement: each/every, either/neither, collective nouns, 'one of the', 'the number of / a number of'",
  "Pronoun reference and case", "Articles", "Prepositions", "Gerund vs infinitive",
  "Parallel structure", "Misplaced modifiers", "Comparison (comparatives/superlatives)",
  "Redundancy", "Conjunctions", "Countable/uncountable nouns"
];

KB.DAY_STRATEGY = [
  "Start with your strongest section; typical split: 25–30 min English, 35–40 min Math, ≈20 min Analytical.",
  "Never spend more than 90 seconds on one question (2 minutes in Math) — mark and return.",
  "Guess when you can eliminate at least one option; skip questions you cannot approach at all; never leave easy questions blank.",
  "Writing: 3 min plan, 11–12 min write, 1 min proofread per piece; the thesis must answer the prompt directly.",
  "Night before: no new material, pack ID/admit card/pens, sleep early. Morning: light breakfast, arrive early."
];

KB.STUDY_HYGIENE = [
  "Error log: question, topic, why wrong (concept/careless/time/misread), fix, retry date — revisit after 2, 7 and 21 days.",
  "One rest day per week; 7+ hours of sleep.",
  "One main source per section plus a mock source — avoid switching resources constantly.",
  "One full timed mock every week (90-min MCQ + 30-min writing) with a 60-minute error review.",
  "Resource types: grammar book, vocab builder with spaced repetition, quantitative aptitude book, logic puzzle & GMAT/GRE-style CR sets, past IBA MBA questions from graduates (unofficial)."
];

KB.DISCLAIMERS = [
  "The syllabus, question types and priority tags are COMMUNITY-DERIVED and unofficial — cross-check with the official circular and recent test-takers.",
  "Admission-chance figures are estimates from public information and an assumption model, NOT official statistics.",
  "No cut-off marks, seat counts or applicant numbers are invented; unknowns are labeled unknown.",
  "Nothing here guarantees admission or failure. Probabilistic language only."
];

/* ---------- Demo data (clearly labeled) ---------- */
KB.demoState = function () {
  const t = new Date(); const iso = (d) => d.toISOString().slice(0,10);
  const daysAgo = (n) => { const d = new Date(t); d.setDate(d.getDate()-n); return iso(d); };
  const mk = (date, type, e, m, a, w, tt) => ({ id:"m"+date, date, type, eng:{correct:e[0],wrong:e[1]}, math:{correct:m[0],wrong:m[1]}, ana:{correct:a[0],wrong:a[1]}, mathMax:25, writing:w, time_taken_min:tt, notes:"" });
  return {
    version:1, created:new Date().toISOString(),
    official_circular:{ test_date:"", application_deadline:"", merit_weights:"", work_experience_rule:"", option_count_per_mcq:null, verified_on:"" },
    profile:{ name:"Demo Student", age:23, degree_type:"4yr", university:"University of Dhaka", major:"BBA", cgpa_4:3.42, second_class:false, graduation_year:2025, ssc_gpa:4.17, hsc_gpa:4.08, third_division:false, oal_track:false, o_subjects:null, a_subjects:null, o_gpa:null, a_gpa:null, c_or_better:null, ugc_approved:true, foreign_degree:false, work_experience_years:1, industry:"Banking", role:"Management Trainee", english_background:"Medium — medium of instruction in undergrad", target_batch:"2026-27" },
    exam_date: KB.nextExpectedExamDate(), weekly_study_hours_available:22, rest_day:"Friday", math_marks:25,
    mocks:[
      mk(daysAgo(28),"Diagnostic", [17,7],[14,5],[8,4], 16, 118),
      mk(daysAgo(21),"Full",       [19,6],[15,4],[9,3], 17, 116),
      mk(daysAgo(13),"Full",       [20,5],[16,4],[9,3], 19, 114),
      mk(daysAgo(6),"Full",        [21,4],[17,3],[10,2], null, 112)
    ],
    practice:[
      {id:"p1", date:daysAgo(20), topic_id:"math_percentage",  attempted:60, correct:52, avg_time_sec:58, timed:true},
      {id:"p2", date:daysAgo(18), topic_id:"eng_error_spotting",attempted:80, correct:66, avg_time_sec:44, timed:true},
      {id:"p3", date:daysAgo(15), topic_id:"math_time_work",   attempted:40, correct:31, avg_time_sec:82, timed:true},
      {id:"p4", date:daysAgo(12), topic_id:"ana_seating",      attempted:24, correct:17, avg_time_sec:95, timed:true},
      {id:"p5", date:daysAgo(9),  topic_id:"eng_reading_comp", attempted:16, correct:11, avg_time_sec:88, timed:true},
      {id:"p6", date:daysAgo(5),  topic_id:"math_tsd",         attempted:35, correct:24, avg_time_sec:96, timed:true},
      {id:"p7", date:daysAgo(3),  topic_id:"eng_sentence_completion", attempted:45, correct:34, avg_time_sec:42, timed:true}
    ],
    study_log:[ {date:daysAgo(7),hours:4.5,topic_ids:["math_tsd","eng_vocab_synonym_antonym"]}, {date:daysAgo(6),hours:5,topic_ids:["math_percentage","ana_critical_reasoning"]}, {date:daysAgo(5),hours:3.5,topic_ids:["wri_structure"]}, {date:daysAgo(4),hours:4,topic_ids:["math_algebra","eng_reading_comp"]}, {date:daysAgo(3),hours:2.5,topic_ids:["eng_error_spotting"]} ],
    error_log:[
      {id:"e1", created:daysAgo(10), question:"Averages — replaced-item problem", topic_id:"math_average", why:"concept", fix:"Use sums, not new average directly; track the removed item's value.", resolved:false},
      {id:"e2", created:daysAgo(6),  question:"Seating — 'immediately left' misread", topic_id:"ana_ordering", why:"misread", fix:"Underline positional words before drawing the grid.", resolved:false},
      {id:"e3", created:daysAgo(4),  question:"TSD — km/h to m/s slip", topic_id:"math_tsd", why:"careless", fix:"Convert units FIRST, always ×5/18.", resolved:false}
    ],
    writing_log:[
      {id:"w1", date:daysAgo(12), prompt:"RMG dependence and the case for export diversification", theme:"Bangladesh economy", words:265, time_min:14, scores:{relevance:4,thesis:3,evidence:3,language:3,coherence:1}},
      {id:"w2", date:daysAgo(5),  prompt:"AI and the future of jobs", theme:"Technology", words:280, time_min:13, scores:{relevance:4,thesis:4,evidence:2,language:3,coherence:1}}
    ],
    viva:{ mock_interviews_done:1, self_rating_english_speaking:6, story_bank:[
      {id:"s1", title:"Led a 4-person university project team", situation:"Final-year BBA project was behind schedule", task:"Deliver in 3 weeks", action:"Split work by strength, daily 15-min check-ins", result:"Submitted on time, graded A-" }
    ], ca_habit:true, ca_notes:[ {id:"c1", date:daysAgo(2), fact:"Policy rate held at 10% amid inflation concerns [demo — verify from Bangladesh Bank]."} ] },
    self_assessment:{ stress:5, confidence:6, weak_areas_text:"TSD, reading speed, essay counterarguments" },
    plan_done:{}
  };
};

KB.nextExpectedExamDate = function () {
  const now = new Date(); let y = now.getFullYear();
  const d = new Date(y, 11, 4); if (d < now) d.setFullYear(y + 1);
  const pad = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
