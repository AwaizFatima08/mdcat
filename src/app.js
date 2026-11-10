(function(){
"use strict";

/* ======================================================================
   CONTENT — injected by build/build.js from content/syllabus.json and
   content/questions/<subject>/<unit>.json. Edit the content files, never
   this block.
   ====================================================================== */
/* __CONTENT_INJECTION_POINT__ */

const SET_SIZE = 10;
const LETTERS = ["A","B","C","D"];
const DIFF_LABEL = { E:"Easy", M:"Moderate", D:"Difficult" };
const SUBJECT_COLOR = { bio:"var(--bio)", chem:"var(--chem)", phy:"var(--phy)", eng:"var(--eng)", lr:"var(--lr)" };
const SUBJECT_ABBR = { bio:"Bio", chem:"Chem", phy:"Phy", eng:"Eng", lr:"LR" };

/* ======================================================================
   LOOKUPS
   ====================================================================== */
const subjectById = {}, unitById = {}, topicById = {};
for(const s of SYLLABUS.subjects){
  subjectById[s.id] = s;
  for(const u of s.units){
    unitById[u.id] = { ...u, subject:s.id };
    for(const t of u.topics) topicById[t.id] = { ...t, unit:u.id };
  }
}
const qById = {};
const qByUnit = {}, qByTopic = {}, qBySubject = {};
for(const q of QUESTIONS){
  qById[q.id] = q;
  (qByUnit[q.unit] = qByUnit[q.unit] || []).push(q);
  (qByTopic[q.topic] = qByTopic[q.topic] || []).push(q);
  const s = unitById[q.unit].subject;
  (qBySubject[s] = qBySubject[s] || []).push(q);
}

/* ======================================================================
   PROGRESS — localStorage, per device, no login.
   progress.q[id] = { n: attempts, c: correct attempts, last: 1|0 }
   ====================================================================== */
const STORE_KEY = "mdcat-prep-v1";
function loadProgress(){
  try{ const raw = localStorage.getItem(STORE_KEY); if(raw) return JSON.parse(raw); }catch(e){}
  return { q:{}, bm:{} };
}
let progress = loadProgress();
progress.q = progress.q || {}; progress.bm = progress.bm || {};
// progress.mock = { active: {id, start, ans:[idx|null], flag:[0|1], i} | null,
//                   hist: { [mockId]: [{ at, used, ans:[idx|null] }] } }
progress.mock = progress.mock || { active:null, hist:{} };
function saveProgress(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }catch(e){} }

function recordAnswer(id, isCorrect){
  const p = progress.q[id] || { n:0, c:0, last:0 };
  p.n++; if(isCorrect) p.c++; p.last = isCorrect ? 1 : 0;
  progress.q[id] = p;
  saveProgress();
}
// done = questions attempted at least once; right = last attempt correct.
function stats(list){
  let done = 0, right = 0;
  for(const q of list || []){
    const p = progress.q[q.id];
    if(p){ done++; if(p.last) right++; }
  }
  return { total:(list||[]).length, done, right, pct: done ? Math.round(100*right/done) : 0 };
}
function mistakes(){ return QUESTIONS.filter(q => progress.q[q.id] && !progress.q[q.id].last); }

/* ======================================================================
   SET PICKER — unseen first, then last-wrong, then the rest; shuffled
   within each group so repeats don't come in the same order.
   ====================================================================== */
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pickSet(pool, size){
  const unseen = [], wrong = [], rest = [];
  for(const q of pool){
    const p = progress.q[q.id];
    if(!p) unseen.push(q); else if(!p.last) wrong.push(q); else rest.push(q);
  }
  return shuffle(unseen).concat(shuffle(wrong), shuffle(rest)).slice(0, size);
}

/* ======================================================================
   ROUTER — hash based so Android back / browser back work.
   #/  #/s/bio  #/u/bio-01  #/play  #/results  #/mistakes  #/soon/<name>
   #/mocks  #/mock/<id>  #/mq  #/mgrid  #/mres/<id>/<attempt>
   #/cheats  #/cheats/<subject>  #/cheat/<card id>
   #/topics  #/topics/<subject>  #/about
   ====================================================================== */
const app = document.getElementById("app");
let session = null;   // current practice set: { title, back, items:[q], i, answers:[idx|null] }
let tick = null;      // mock timer interval, cleared on every render

function go(hash){ if(location.hash === hash) render(); else location.hash = hash; }
window.addEventListener("hashchange", render);

function esc(s){ return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function bar(title, backHash){
  return `<div class="bar">${backHash!=null ? `<button class="iconbtn" data-go="${backHash}" aria-label="Back">←</button>` : ""}<h1>${esc(title)}</h1></div>`;
}
function pbar(pct){ return `<div class="pbar"><i style="width:${pct}%"></i></div>`; }

function render(){
  const h = location.hash.replace(/^#/, "") || "/";
  const parts = h.split("/").filter(Boolean);
  window.scrollTo(0, 0);
  if(tick){ clearInterval(tick); tick = null; }
  if(parts[0] === "mocks") return renderMockList();
  if(parts[0] === "mock" && mockById[parts[1]]) return renderMockIntro(parts[1]);
  if(parts[0] === "mq" && progress.mock.active) return renderMockQ();
  if(parts[0] === "mgrid" && progress.mock.active) return renderMockGrid();
  if(parts[0] === "mres" && mockById[parts[1]]) return renderMockResults(parts[1], Number(parts[2]) || 0);
  if(parts[0] === "s" && subjectById[parts[1]]) return renderSubject(parts[1]);
  if(parts[0] === "u" && unitById[parts[1]]) return renderUnit(parts[1]);
  if(parts[0] === "play" && session) return renderPlayer();
  if(parts[0] === "results" && session) return renderResults();
  if(parts[0] === "mistakes") return renderMistakes();
  if(parts[0] === "guide") return parts[1] ? renderGuideSection(parts[1]) : renderGuide();
  if(parts[0] === "cheats") return subjectById[parts[1]] ? renderCheatSubject(parts[1]) : renderCheats();
  if(parts[0] === "cheat" && cheatById[parts[1]]) return renderCheat(parts[1]);
  if(parts[0] === "topics") return subjectById[parts[1]] ? renderTopicSubject(parts[1]) : renderTopics();
  if(parts[0] === "about") return renderAbout();
  if(parts[0] === "soon") return renderSoon(decodeURIComponent(parts[1] || ""));
  return renderHome();
}

/* ----- home ----- */
function renderHome(){
  const all = stats(QUESTIONS);
  const nMistakes = mistakes().length;
  let html = `<div class="bar"><h1>MDCAT Prep</h1></div>
  <div class="hero">
    <h2>Prepare for MDCAT</h2>
    <p>PM&amp;DC 2025 curriculum · 180 MCQs · 3 hours · no negative marking</p>
    <div class="stats">
      <div><b>${all.done}</b><span>of ${all.total} practised</span></div>
      <div><b>${all.done ? all.pct + "%" : "–"}</b><span>accuracy</span></div>
      <div><b>${nMistakes}</b><span>to review</span></div>
    </div>
  </div>
  <h3 class="section">Practice by subject</h3><div class="list">`;
  for(const s of SYLLABUS.subjects){
    const st = stats(qBySubject[s.id]);
    const avail = st.total;
    html += `<button class="row" data-go="#/s/${s.id}">
      <span class="badge" style="background:${SUBJECT_COLOR[s.id]}">${SUBJECT_ABBR[s.id]}</span>
      <span class="main"><span class="title">${esc(s.name)}</span>
        <div class="sub">${s.mcqsInPaper} MCQs in paper · ${s.units.length} units · ${avail ? `${st.done}/${avail} practised` : "questions coming soon"}</div>
        ${avail ? pbar(Math.round(100*st.done/avail)) : ""}</span>
      <span class="chev">›</span></button>`;
  }
  html += `</div>
  <h3 class="section">More</h3>
  <div class="tiles">
    <button class="tile" data-go="#/mistakes"><div class="ic">🔁</div><div class="title">Review mistakes</div><div class="sub">${nMistakes} question${nMistakes===1?"":"s"}</div></button>
    <button class="tile" data-go="#/mocks"><div class="ic">⏱️</div><div class="title">Mock exams</div><div class="sub">${progress.mock.active ? "paper in progress" : MOCKS.length ? `${MOCKS.length} full paper${MOCKS.length===1?"":"s"}` : "coming soon"}</div></button>
    <button class="tile" data-go="#/guide"><div class="ic">📋</div><div class="title">Rules &amp; guidelines</div><div class="sub">format, passing, exam day</div></button>
    <button class="tile" data-go="#/cheats"><div class="ic">🧠</div><div class="title">Memory cheats</div><div class="sub">${CHEATS.length ? `${CHEATS.length} quick cards` : "coming soon"}</div></button>
    <button class="tile" data-go="#/topics"><div class="ic">⭐</div><div class="title">Important topics</div><div class="sub">${TOPICS.length ? "ranked by unit" : "coming soon"}</div></button>
    <button class="tile" data-go="#/about"><div class="ic">ℹ️</div><div class="title">About</div><div class="sub">privacy, version, contact</div></button>
  </div>`;
  app.innerHTML = html;
}

/* ----- subject ----- */
function renderSubject(sid){
  const s = subjectById[sid];
  let html = bar(s.name, "#/") + `<p class="note">${s.mcqsInPaper} of 180 MCQs in the real paper (${Math.round(s.mcqsInPaper/1.8)}%).</p><div class="list">`;
  for(const u of s.units){
    const st = stats(qByUnit[u.id]);
    const has = st.total > 0;
    html += `<button class="row${has ? "" : " disabled"}" ${has ? `data-go="#/u/${u.id}"` : ""}>
      <span class="badge" style="background:${SUBJECT_COLOR[sid]}">${u.n}</span>
      <span class="main"><span class="title">${esc(u.name)}</span>
        <div class="sub">${has ? `${st.done}/${st.total} practised${st.done ? ` · ${st.pct}% right` : ""}` : `<span class="tag soon">coming soon</span>`}</div>
        ${has ? pbar(Math.round(100*st.done/st.total)) : ""}</span>
      ${has ? `<span class="chev">›</span>` : ""}</button>`;
  }
  app.innerHTML = html + `</div>`;
}

/* ----- unit ----- */
function renderUnit(uid){
  const u = unitById[uid];
  const st = stats(qByUnit[uid]);
  let html = bar(`${u.n}. ${u.name}`, `#/s/${u.subject}`) +
    `<div class="card" style="padding:16px;margin-top:14px">
      <div class="sub" style="color:var(--muted);font-size:14px">${st.done}/${st.total} practised${st.done ? ` · ${st.pct}% right` : ""}</div>
      ${pbar(st.total ? Math.round(100*st.done/st.total) : 0)}
      <div class="actions"><button class="btn" data-start="unit:${uid}">Practise ${Math.min(SET_SIZE, st.total)} questions</button></div>
    </div>
    <h3 class="section">Topics</h3><div class="list">`;
  for(const t of u.topics){
    const tq = qByTopic[t.id] || [];
    const ts = stats(tq);
    html += `<button class="row${tq.length ? "" : " disabled"}" ${tq.length ? `data-start="topic:${t.id}"` : ""}>
      <span class="main"><span class="title">${esc(t.name)}</span>
        <div class="sub">${tq.length ? `${ts.done}/${tq.length} practised${ts.done ? ` · ${ts.pct}% right` : ""}` : "no questions yet"}</div>
        <ul class="lo">${(t.los||[]).map(lo => `<li><code>${esc(lo.code)}</code>${esc(lo.text)}</li>`).join("")}</ul></span>
      ${tq.length ? `<span class="chev">▶</span>` : ""}</button>`;
  }
  app.innerHTML = html + `</div>`;
}

/* ----- practice ----- */
function startSession(kind, id){
  let pool, title, back;
  if(kind === "unit"){ const u = unitById[id]; pool = qByUnit[id]; title = u.name; back = `#/u/${id}`; }
  else if(kind === "topic"){ const t = topicById[id]; pool = qByTopic[id]; title = t.name; back = `#/u/${t.unit}`; }
  else if(kind === "mistakes"){ pool = mistakes(); title = "Review mistakes"; back = "#/"; }
  if(!pool || !pool.length) return;
  session = { kind, id, title, back, items: pickSet(pool, SET_SIZE), i:0, answers:[] };
  go("#/play");
}

function renderPlayer(){
  const s = session, q = s.items[s.i], picked = s.answers[s.i];
  const answered = picked != null;
  const u = unitById[q.unit];
  let html = bar(s.title, s.back) +
    `<div class="qprog"><i style="width:${Math.round(100*(s.i + (answered?1:0))/s.items.length)}%"></i></div>
    <div class="qmeta"><span>Question ${s.i+1} of ${s.items.length}</span>
      <span class="tag">${esc(q.lo)}</span><span class="tag">${DIFF_LABEL[q.d]}</span>
      <button class="iconbtn" data-bm="${q.id}" aria-label="Bookmark" style="margin-left:auto">${progress.bm[q.id] ? "★" : "☆"}</button></div>
    <div class="qtext">${esc(q.q)}</div><div class="opts">`;
  q.o.forEach((opt, i) => {
    let cls = "opt";
    if(answered){ cls += " locked"; if(i === q.a) cls += " correct"; else if(i === picked) cls += " wrong"; }
    html += `<button class="${cls}" ${answered ? "" : `data-pick="${i}"`}><span class="k">${LETTERS[i]}</span><span>${esc(opt)}</span></button>`;
  });
  html += `</div>`;
  if(answered){
    const ok = picked === q.a;
    html += `<div class="explain"><b class="${ok ? "verdict-ok" : "verdict-bad"}">${ok ? "✓ Correct" : `✗ Not quite — the answer is ${LETTERS[q.a]}`}</b>${esc(q.x)}</div>
      <div class="actions"><button class="btn" data-next>${s.i+1 < s.items.length ? "Next question" : "See results"}</button></div>`;
  }
  html += `<p class="note">${esc(subjectById[u.subject].name)} · Unit ${u.n}: ${esc(u.name)}</p>`;
  app.innerHTML = html;
}

function pick(i){
  const s = session, q = s.items[s.i];
  if(s.answers[s.i] != null) return;
  s.answers[s.i] = i;
  recordAnswer(q.id, i === q.a);
  renderPlayer();
}
function next(){
  if(session.i + 1 < session.items.length){ session.i++; renderPlayer(); window.scrollTo(0,0); }
  else { go("#/results"); adBreak("set"); }
}

function renderResults(){
  const s = session;
  const right = s.items.filter((q, i) => s.answers[i] === q.a).length;
  const n = s.items.length;
  let html = bar("Results", s.back) +
    `<div class="card score"><div class="big">${right}/${n}</div><div class="of">${Math.round(100*right/n)}% correct · ${esc(s.title)}</div></div>
    <div class="actions">
      ${s.kind !== "mistakes" ? `<button class="btn" data-start="${s.kind}:${s.id}">Next ${SET_SIZE} questions</button>` : ""}
      <button class="btn secondary" data-go="${s.back}">Done</button>
    </div><h3 class="section">Review</h3>`;
  s.items.forEach((q, i) => {
    const ok = s.answers[i] === q.a;
    html += `<div class="card review"><div class="q">${i+1}. ${esc(q.q)}</div>
      <div class="ans ${ok ? "verdict-ok" : "verdict-bad"}">${ok ? "✓" : "✗"} ${s.answers[i] != null ? `You: ${LETTERS[s.answers[i]]}. ${esc(q.o[s.answers[i]])}` : "Not answered"}</div>
      ${ok ? "" : `<div class="ans verdict-ok">Answer: ${LETTERS[q.a]}. ${esc(q.o[q.a])}</div>`}
      <div class="x">${esc(q.x)}</div></div>`;
  });
  app.innerHTML = html;
}

/* ----- mistakes ----- */
function renderMistakes(){
  const list = mistakes();
  let html = bar("Review mistakes", "#/");
  if(!list.length){
    app.innerHTML = html + `<div class="empty">No mistakes to review yet.<br>Questions you get wrong will collect here until you answer them right.</div>`;
    return;
  }
  html += `<div class="card" style="padding:16px;margin-top:14px"><div>${list.length} question${list.length===1?"":"s"} you last got wrong.</div>
    <div class="actions"><button class="btn" data-start="mistakes:all">Practise ${Math.min(SET_SIZE, list.length)} of them</button></div></div>
    <h3 class="section">By unit</h3><div class="list">`;
  const byUnit = {};
  for(const q of list) byUnit[q.unit] = (byUnit[q.unit] || 0) + 1;
  for(const [uid, n] of Object.entries(byUnit)){
    const u = unitById[uid];
    html += `<button class="row" data-go="#/u/${uid}"><span class="badge" style="background:${SUBJECT_COLOR[u.subject]}">${u.n}</span>
      <span class="main"><span class="title">${esc(u.name)}</span><div class="sub">${esc(subjectById[u.subject].name)} · ${n} to review</div></span><span class="chev">›</span></button>`;
  }
  app.innerHTML = html + `</div>`;
}

/* ----- rules & guidelines ----- */
function renderGuide(){
  let html = bar("Rules & guidelines", "#/") + `<div class="list" style="margin-top:14px">`;
  for(const s of GUIDE.sections){
    html += `<button class="row" data-go="#/guide/${s.id}"><span class="badge" style="background:var(--brand-soft);font-size:22px">${s.icon}</span>
      <span class="main"><span class="title">${esc(s.title)}</span><div class="sub">${esc(s.summary)}</div></span><span class="chev">›</span></button>`;
  }
  html += `</div><p class="note">${esc(GUIDE.disclaimer)}</p><p class="note">Last checked: ${esc(GUIDE.updated)}</p>
    <h3 class="section">Official sources</h3><ul class="srcs">${GUIDE.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul>`;
  app.innerHTML = html;
}

function guideBlock(b){
  switch(b.type){
    case "p": return `<p>${esc(b.text)}</p>`;
    case "h": return `<h4>${esc(b.text)}</h4>`;
    case "tip": return `<div class="callout tip">💡 ${esc(b.text)}</div>`;
    case "warn": return `<div class="callout warn">⚠️ ${esc(b.text)}</div>`;
    case "mn": return `<div class="mn"><div class="phrase">${esc(b.text)}</div><ul>${b.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
    case "list": return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
    case "table": return `<table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  return "";
}

function renderGuideSection(id){
  const i = GUIDE.sections.findIndex(s => s.id === id);
  if(i < 0) return renderGuide();
  const s = GUIDE.sections[i], nextS = GUIDE.sections[i+1];
  app.innerHTML = bar(s.title, "#/guide") +
    `<article class="card guide">${s.blocks.map(guideBlock).join("")}</article>
    ${nextS ? `<div class="actions"><button class="btn secondary" data-go="#/guide/${nextS.id}">Next: ${esc(nextS.title)} ›</button></div>` : ""}
    <p class="note">${esc(GUIDE.disclaimer)}</p>`;
}

/* ----- memory cheats: short revision cards, subject → unit → card ----- */
const CHEAT_ICON = { mnemonic:"🧩", table:"📊", formula:"📐", map:"🗺️", rule:"📏", trick:"🎯" };
const cheatById = {};
CHEATS.forEach((c, i) => { cheatById[c.id] = { ...c, i }; });

function renderCheats(){
  let html = bar("Memory cheats", "#/") + `<p class="note">Short cards to revise in a minute each: mnemonics, tables, formula sheets, reaction maps, rules and tricks.</p><div class="list">`;
  for(const s of SYLLABUS.subjects){
    const n = CHEATS.filter(c => unitById[c.unit].subject === s.id).length;
    html += `<button class="row${n ? "" : " disabled"}" ${n ? `data-go="#/cheats/${s.id}"` : ""}>
      <span class="badge" style="background:${SUBJECT_COLOR[s.id]}">${SUBJECT_ABBR[s.id]}</span>
      <span class="main"><span class="title">${esc(s.name)}</span><div class="sub">${n ? `${n} card${n===1?"":"s"}` : "coming soon"}</div></span>
      ${n ? `<span class="chev">›</span>` : ""}</button>`;
  }
  app.innerHTML = html + `</div>`;
}

function renderCheatSubject(sid){
  const s = subjectById[sid];
  let html = bar(`${s.name} cheats`, "#/cheats");
  for(const u of s.units){
    const cards = CHEATS.filter(c => c.unit === u.id);
    if(!cards.length) continue;
    html += `<h3 class="section">${u.n}. ${esc(u.name)}</h3><div class="list">` + cards.map(c =>
      `<button class="row" data-go="#/cheat/${c.id}"><span class="badge" style="background:var(--brand-soft);font-size:20px">${CHEAT_ICON[c.kind]}</span>
        <span class="main"><span class="title">${esc(c.title)}</span><div class="sub">${c.kind}</div></span><span class="chev">›</span></button>`).join("") + `</div>`;
  }
  app.innerHTML = html;
}

// Prev/Next stay inside the subject; cards are in syllabus order from the build.
function renderCheat(id){
  const c = cheatById[id], u = unitById[c.unit];
  const prev = CHEATS[c.i-1], next = CHEATS[c.i+1];
  const same = x => x && unitById[x.unit].subject === u.subject;
  app.innerHTML = bar(c.title, `#/cheats/${u.subject}`) +
    `<p class="note">${CHEAT_ICON[c.kind]} ${c.kind} · ${SUBJECT_ABBR[u.subject]} unit ${u.n}: ${esc(u.name)}</p>
    <article class="card guide cheat">${c.blocks.map(guideBlock).join("")}</article>
    <div class="cnav">
      <button class="btn secondary" ${same(prev) ? `data-go="#/cheat/${prev.id}"` : "disabled"}>‹ Prev</button>
      ${(qByUnit[c.unit] || []).length ? `<button class="btn" data-start="unit:${c.unit}">Practise unit ${u.n}</button>` : ""}
      <button class="btn secondary" ${same(next) ? `data-go="#/cheat/${next.id}"` : "disabled"}>Next ›</button>
    </div>`;
}

/* ----- important topics: every unit in a tier, best first, with focus LOs ----- */
const TIER = { 1:["Must-know","Big share of the syllabus or asked in most papers. Start here."],
  2:["Important","A solid share and regularly asked."],
  3:["Quick wins","Small units: quick to learn, still worth marks."] };
const TOPICS_NOTE = "Our estimate, not official PM&DC weightage. PM&DC sets marks per subject only; we rank units by their share of the official learning outcomes (LOs) and by what MDCAT papers usually stress.";
const loByCode = {};
for(const u of Object.values(unitById)) for(const t of u.topics) for(const lo of t.los) loByCode[lo.code] = lo;
function loCount(u){ return u.topics.reduce((n, t) => n + t.los.length, 0); }

function renderTopics(){
  let html = bar("Important topics", "#/") + `<p class="note">${esc(TOPICS_NOTE)}</p><div class="list">`;
  for(const s of SYLLABUS.subjects){
    const mine = TOPICS.filter(e => unitById[e.unit].subject === s.id);
    const must = mine.filter(e => e.tier === 1).length;
    html += `<button class="row${mine.length ? "" : " disabled"}" ${mine.length ? `data-go="#/topics/${s.id}"` : ""}>
      <span class="badge" style="background:${SUBJECT_COLOR[s.id]}">${SUBJECT_ABBR[s.id]}</span>
      <span class="main"><span class="title">${esc(s.name)}</span><div class="sub">${mine.length ? `${must} must-know of ${mine.length} units · ${s.mcqsInPaper} MCQs in paper` : "coming soon"}</div></span>
      ${mine.length ? `<span class="chev">›</span>` : ""}</button>`;
  }
  app.innerHTML = html + `</div>`;
}

function renderTopicSubject(sid){
  const s = subjectById[sid];
  const totalLos = s.units.reduce((n, u) => n + loCount(u), 0);
  let html = bar(`${s.name}: important topics`, "#/topics") + `<p class="note">${esc(TOPICS_NOTE)}</p>`;
  for(const tier of [1, 2, 3]){
    const list = TOPICS.filter(e => e.tier === tier && unitById[e.unit].subject === sid);
    if(!list.length) continue;
    html += `<h3 class="section">${TIER[tier][0]}</h3><p class="note tnote">${TIER[tier][1]}</p>`;
    for(const e of list){
      const u = unitById[e.unit], st = stats(qByUnit[u.id]);
      const weak = st.done >= 10 && st.pct < 60;
      html += `<div class="card topic">
        <div class="thead"><span class="badge" style="background:${SUBJECT_COLOR[sid]}">${u.n}</span>
          <span class="main"><span class="title">${esc(u.name)}</span><div class="sub">${loCount(u)} of ${totalLos} LOs</div></span></div>
        <p class="why">${esc(e.why)}</p>
        <div class="flabel">Focus on</div>
        <ul class="lo">${e.focus.map(c => `<li><code>${esc(c)}</code>${esc(loByCode[c].text)}</li>`).join("")}</ul>
        <div class="sub mine">${st.done ? `You: ${st.done}/${st.total} practised · ${st.pct}% right` : "You haven't practised this unit yet"}${weak ? ` <span class="tag fail">needs work</span>` : ""}</div>
        <div class="tbtns">
          ${st.total ? `<button class="btn" data-start="unit:${u.id}">Practise</button>` : ""}
          <button class="btn secondary" data-go="#/u/${u.id}">Open unit</button>
        </div>
      </div>`;
    }
  }
  app.innerHTML = html;
}

/* ======================================================================
   MOCK EXAMS — a full 180-question paper, 3 hours, no negative marking.
   The clock is wall-clock from the start time, so closing the app does not
   pause it (as in the real exam). Answers are saved on every tap.
   ====================================================================== */
const MOCK_MS = 3 * 60 * 60 * 1000;
const PASS = { MBBS: 99, BDS: 90 };   // 55% and 50% of 180
const mockById = {};
for(const m of MOCKS) mockById[m.id] = m;
let mockReview = "all";               // results filter: all | wrong | blank | flagged
let mockConfirm = false;              // grid page: showing the submit confirmation

function msLeft(a){ return a.start + MOCK_MS - Date.now(); }
function fmtTime(ms){
  const t = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function mockScore(m, ans){ return m.questions.reduce((n, q, i) => n + (ans[i] === q.a ? 1 : 0), 0); }
function subjectOfQ(q){ return unitById[q.unit].subject; }

// Starts the visible countdown; submits the paper automatically at zero.
function startTick(){
  const a = progress.mock.active;
  const upd = () => {
    const el = document.getElementById("mtimer");
    const left = msLeft(a);
    if(left <= 0){ submitMock(true); return; }
    if(el){ el.textContent = fmtTime(left); el.classList.toggle("low", left < 10 * 60 * 1000); }
  };
  upd();
  tick = setInterval(upd, 1000);
}

function renderMockList(){
  let html = bar("Mock exams", "#/") +
    `<p class="note">Each mock is a full paper like the real MDCAT: 180 MCQs in 3 hours (Biology 81, Chemistry 45, Physics 36, English 9, Logical Reasoning 9), no negative marking.</p>`;
  const a = progress.mock.active;
  if(a && mockById[a.id]){
    html += `<div class="card" style="padding:16px;margin-top:14px"><b>${esc(mockById[a.id].title)} is in progress</b>
      <div class="sub" style="color:var(--muted);font-size:14px">${fmtTime(msLeft(a))} left · ${a.ans.filter(x => x != null).length}/180 answered</div>
      <div class="actions"><button class="btn" data-go="#/mq">Resume paper</button></div></div>`;
  }
  if(!MOCKS.length) return void (app.innerHTML = html + `<div class="empty">The 20 mock papers are being prepared and will arrive in an update.</div>`);
  html += `<div class="list" style="margin-top:14px">`;
  MOCKS.forEach((m, i) => {
    const hist = progress.mock.hist[m.id] || [];
    const best = hist.length ? Math.max(...hist.map(h => mockScore(m, h.ans))) : null;
    html += `<button class="row" data-go="#/mock/${m.id}"><span class="badge" style="background:var(--brand)">${i+1}</span>
      <span class="main"><span class="title">${esc(m.title)}</span>
        <div class="sub">${hist.length ? `Best ${best}/180 · ${hist.length} attempt${hist.length===1?"":"s"}` : "Not attempted"}</div></span>
      <span class="chev">›</span></button>`;
  });
  app.innerHTML = html + `</div>`;
}

function renderMockIntro(id){
  const m = mockById[id], a = progress.mock.active;
  const hist = progress.mock.hist[id] || [];
  let html = bar(m.title, "#/mocks") + `<article class="card guide" style="margin-top:14px">
    <h4>Before you start</h4>
    <ul><li>180 questions, 3 hours. The clock keeps running if you leave the app, like the real exam.</li>
      <li>No negative marking: answer every question.</li>
      <li>Move freely between questions, change answers, and flag ones to come back to.</li>
      <li>You see your score and every explanation after you submit. The paper submits itself when time runs out.</li>
      <li>Sit it like the real thing: one sitting, no phone, no notes.</li></ul></article><div class="actions">`;
  if(a && a.id === id) html += `<button class="btn" data-go="#/mq">Resume paper (${fmtTime(msLeft(a))} left)</button>`;
  else if(a) html += `<p class="note">Finish or submit ${esc(mockById[a.id] ? mockById[a.id].title : "your current paper")} before starting another.</p><button class="btn secondary" data-go="#/mq">Go to paper in progress</button>`;
  else html += `<button class="btn" data-mstart="${id}">Start the 3-hour paper</button>`;
  html += `</div>`;
  if(hist.length){
    html += `<h3 class="section">Your attempts</h3><div class="list">`;
    hist.forEach((h, n) => {
      const sc = mockScore(m, h.ans);
      html += `<button class="row" data-go="#/mres/${id}/${n}"><span class="main"><span class="title">${sc}/180 · ${Math.round(100*sc/180)}%</span>
        <div class="sub">${new Date(h.at).toLocaleDateString()} · ${fmtTime(h.used)} used</div></span><span class="chev">›</span></button>`;
    });
    html += `</div>`;
  }
  app.innerHTML = html;
}

function startMock(id){
  if(progress.mock.active) return go("#/mq");
  progress.mock.active = { id, start: Date.now(), ans: Array(180).fill(null), flag: Array(180).fill(0), i: 0 };
  saveProgress();
  go("#/mq");
}

function renderMockQ(){
  const a = progress.mock.active, m = mockById[a.id];
  if(!m){ progress.mock.active = null; saveProgress(); return go("#/mocks"); }
  const q = m.questions[a.i], picked = a.ans[a.i], sid = subjectOfQ(q);
  const answered = a.ans.filter(x => x != null).length;
  let html = `<div class="bar"><button class="iconbtn" data-go="#/mock/${m.id}" aria-label="Back">←</button>
      <h1>${esc(m.title)}</h1><span class="timer" id="mtimer"></span></div>
    <div class="qprog"><i style="width:${Math.round(100*answered/180)}%"></i></div>
    <div class="qmeta"><span class="tag" style="background:${SUBJECT_COLOR[sid]};color:#fff">${SUBJECT_ABBR[sid]}</span>
      <span>Question ${a.i+1} of 180</span>
      <button class="iconbtn flagbtn${a.flag[a.i] ? " on" : ""}" data-mflag aria-label="Flag for review" style="margin-left:auto">⚑</button></div>
    <div class="qtext">${esc(q.q)}</div><div class="opts">`;
  q.o.forEach((opt, i) => {
    html += `<button class="opt${picked === i ? " chosen" : ""}" data-mpick="${i}"><span class="k">${LETTERS[i]}</span><span>${esc(opt)}</span></button>`;
  });
  html += `</div><div class="mnav">
      <button class="btn secondary" data-mnav="-1" ${a.i === 0 ? "disabled" : ""}>‹ Previous</button>
      <button class="btn secondary" data-go="#/mgrid">All questions</button>
      <button class="btn" data-mnav="1" ${a.i === 179 ? "disabled" : ""}>Next ›</button></div>
    <p class="note">${answered}/180 answered${a.flag.some(Boolean) ? ` · ${a.flag.filter(Boolean).length} flagged` : ""}</p>`;
  app.innerHTML = html;
  startTick();
}

function mockPick(i){
  const a = progress.mock.active;
  a.ans[a.i] = a.ans[a.i] === i ? null : i;   // tap again to clear
  saveProgress();
  renderMockQ();
}
function mockMove(d){
  const a = progress.mock.active;
  a.i = Math.min(179, Math.max(0, a.i + d));
  saveProgress();
  renderMockQ(); window.scrollTo(0, 0);
}

function renderMockGrid(){
  const a = progress.mock.active, m = mockById[a.id];
  const answered = a.ans.filter(x => x != null).length, blank = 180 - answered;
  let html = `<div class="bar"><button class="iconbtn" data-go="#/mq" aria-label="Back">←</button>
      <h1>All questions</h1><span class="timer" id="mtimer"></span></div>
    <p class="note">${answered} answered · ${blank} not answered · ${a.flag.filter(Boolean).length} flagged. Tap a number to go to it.</p>`;
  let start = 0;
  for(const s of SYLLABUS.subjects){
    const n = m.questions.filter(q => subjectOfQ(q) === s.id).length;
    if(!n) continue;
    html += `<h3 class="section">${esc(s.name)}</h3><div class="mgrid">`;
    for(let i = start; i < start + n; i++){
      html += `<button class="cell${a.ans[i] != null ? " done" : ""}${a.flag[i] ? " flag" : ""}${i === a.i ? " cur" : ""}" data-mjump="${i}">${i+1}</button>`;
    }
    html += `</div>`;
    start += n;
  }
  html += `<div class="actions">` + (mockConfirm
    ? `<div class="card" style="padding:16px"><b>Submit the paper?</b><div class="sub" style="color:var(--muted);font-size:14px;margin:6px 0 12px">${blank ? `${blank} question${blank===1?" is":"s are"} not answered. With no negative marking, a guess can only help.` : "All questions answered."} You can't change answers after submitting.</div>
        <button class="btn" data-msubmit="yes">Yes, submit</button><button class="btn secondary" data-msubmit="no">Keep working</button></div>`
    : `<button class="btn" data-msubmit="ask">Submit paper</button>`) + `</div>`;
  app.innerHTML = html;
  startTick();
}

function submitMock(auto){
  const a = progress.mock.active;
  if(!a) return;
  const used = Math.min(MOCK_MS, Date.now() - a.start);
  const hist = progress.mock.hist[a.id] = progress.mock.hist[a.id] || [];
  hist.push({ at: Date.now(), used, ans: a.ans, flag: a.flag, auto: auto ? 1 : 0 });
  progress.mock.active = null;
  mockConfirm = false; mockReview = "all";
  saveProgress();
  // Replace, so Back from the results never lands on the finished paper.
  location.replace(`#/mres/${a.id}/${hist.length - 1}`);
  adBreak("mock");
}

function renderMockResults(id, n){
  const m = mockById[id], h = (progress.mock.hist[id] || [])[n];
  if(!h) return go(`#/mock/${id}`);
  const score = mockScore(m, h.ans);
  const bySubj = {}, byUnit = {};
  m.questions.forEach((q, i) => {
    const sid = subjectOfQ(q), ok = h.ans[i] === q.a ? 1 : 0;
    (bySubj[sid] = bySubj[sid] || { r:0, n:0 }); bySubj[sid].r += ok; bySubj[sid].n++;
    (byUnit[q.unit] = byUnit[q.unit] || { r:0, n:0 }); byUnit[q.unit].r += ok; byUnit[q.unit].n++;
  });
  const pass = (k) => score >= PASS[k];
  let html = bar("Mock results", `#/mock/${id}`) +
    `<div class="card score"><div class="big">${score}/180</div><div class="of">${Math.round(100*score/180)}% · ${esc(m.title)}</div>
      <div class="passrow"><span class="tag ${pass("MBBS") ? "" : "fail"}">MBBS pass (99): ${pass("MBBS") ? "✓ passed" : `✗ ${PASS.MBBS - score} short`}</span>
      <span class="tag ${pass("BDS") ? "" : "fail"}">BDS pass (90): ${pass("BDS") ? "✓ passed" : `✗ ${PASS.BDS - score} short`}</span></div>
      <div class="of" style="margin-top:8px">Time used ${fmtTime(h.used)} of 3:00:00${h.auto ? " · submitted when time ran out" : ""}</div></div>
    <h3 class="section">By subject</h3><div class="card"><table class="mtable"><thead><tr><th>Subject</th><th>Right</th><th>%</th></tr></thead><tbody>`;
  for(const s of SYLLABUS.subjects){
    const b = bySubj[s.id]; if(!b) continue;
    html += `<tr><td>${esc(s.name)}</td><td>${b.r}/${b.n}</td><td>${Math.round(100*b.r/b.n)}%</td></tr>`;
  }
  html += `</tbody></table></div>`;
  // Weak units: at least 2 questions in this paper and under 60% right.
  const weak = Object.entries(byUnit).filter(([, b]) => b.n >= 2 && b.r / b.n < 0.6)
    .sort((x, y) => x[1].r / x[1].n - y[1].r / y[1].n);
  if(weak.length){
    html += `<h3 class="section">Units to practise</h3><div class="list">`;
    for(const [uid, b] of weak.slice(0, 8)){
      const u = unitById[uid];
      html += `<button class="row" data-go="#/u/${uid}"><span class="badge" style="background:${SUBJECT_COLOR[u.subject]}">${u.n}</span>
        <span class="main"><span class="title">${esc(u.name)}</span><div class="sub">${esc(subjectById[u.subject].name)} · ${b.r}/${b.n} right in this paper</div></span><span class="chev">›</span></button>`;
    }
    html += `</div>`;
  }
  html += `<h3 class="section">By unit</h3><div class="card"><table class="mtable"><thead><tr><th>Unit</th><th>Right</th></tr></thead><tbody>`;
  for(const s of SYLLABUS.subjects) for(const u of s.units){
    const b = byUnit[u.id]; if(!b) continue;
    html += `<tr><td>${SUBJECT_ABBR[s.id]} ${u.n}. ${esc(u.name)}</td><td>${b.r}/${b.n}</td></tr>`;
  }
  html += `</tbody></table></div>
    <h3 class="section">Estimated aggregate (optional)</h3>
    <div class="card" style="padding:16px"><div class="sub" style="color:var(--muted);font-size:14px">Common formula: MDCAT 50% + FSc 40% + Matric 10%. Your university may use another — check its prospectus.</div>
      <div class="agg"><label>FSc %<input type="number" min="0" max="100" inputmode="decimal" data-agg="fsc" value="${esc(progress.fsc || "")}"></label>
      <label>Matric %<input type="number" min="0" max="100" inputmode="decimal" data-agg="matric" value="${esc(progress.matric || "")}"></label></div>
      <div class="aggout" id="aggout" data-mdcat="${(100*score/180).toFixed(2)}"></div></div>`;
  // Review with a filter.
  const flags = h.flag || [];
  const keep = (q, i) => mockReview === "wrong" ? h.ans[i] != null && h.ans[i] !== q.a
    : mockReview === "blank" ? h.ans[i] == null : mockReview === "flagged" ? !!flags[i] : true;
  html += `<h3 class="section">Review</h3><div class="filters">` +
    [["all","All"],["wrong","Wrong"],["blank","Not answered"],["flagged","Flagged"]].map(([k, l]) =>
      `<button class="chip${mockReview === k ? " on" : ""}" data-mfilter="${k}">${l}</button>`).join("") + `</div>`;
  let shown = 0;
  m.questions.forEach((q, i) => {
    if(!keep(q, i)) return;
    shown++;
    const ok = h.ans[i] === q.a;
    html += `<div class="card review"><div class="q">${i+1}. ${esc(q.q)}</div>
      <div class="ans ${ok ? "verdict-ok" : "verdict-bad"}">${ok ? "✓" : "✗"} ${h.ans[i] != null ? `You: ${LETTERS[h.ans[i]]}. ${esc(q.o[h.ans[i]])}` : "Not answered"}</div>
      ${ok ? "" : `<div class="ans verdict-ok">Answer: ${LETTERS[q.a]}. ${esc(q.o[q.a])}</div>`}
      <div class="x">${esc(q.x)}</div></div>`;
  });
  if(!shown) html += `<div class="empty">Nothing in this list.</div>`;
  app.innerHTML = html + `<div class="actions"><button class="btn secondary" data-go="#/mocks">Back to mock exams</button></div>`;
  updateAgg();
}

function updateAgg(){
  const out = document.getElementById("aggout");
  if(!out) return;
  const f = parseFloat(progress.fsc), mt = parseFloat(progress.matric), md = parseFloat(out.dataset.mdcat);
  const ok = v => !isNaN(v) && v >= 0 && v <= 100;
  out.textContent = ok(f) && ok(mt) ? `Estimated aggregate: ${(0.5*md + 0.4*f + 0.1*mt).toFixed(2)}%` : "Enter your FSc and Matric percentages to see an estimate.";
}

function renderSoon(name){
  app.innerHTML = bar(name || "Coming soon", "#/") + `<div class="empty">${esc(name)} is being built and will arrive in an update.</div>`;
}

/* ======================================================================
   EVENTS — one delegated listener for the whole app.
   ====================================================================== */
app.addEventListener("click", e => {
  const el = e.target.closest("[data-go],[data-start],[data-pick],[data-next],[data-bm],[data-mstart],[data-mpick],[data-mnav],[data-mflag],[data-mjump],[data-msubmit],[data-mfilter]");
  if(!el || el.disabled) return;
  if(el.dataset.go != null) return go(el.dataset.go);
  const d = el.dataset;
  if(d.mstart) return startMock(d.mstart);
  if(d.mpick != null) return mockPick(Number(d.mpick));
  if(d.mnav) return mockMove(Number(d.mnav));
  if(d.mflag != null){ const a = progress.mock.active; a.flag[a.i] = a.flag[a.i] ? 0 : 1; saveProgress(); return renderMockQ(); }
  if(d.mjump != null){ progress.mock.active.i = Number(d.mjump); saveProgress(); return go("#/mq"); }
  if(d.msubmit === "ask"){ mockConfirm = true; return renderMockGrid(); }
  if(d.msubmit === "no"){ mockConfirm = false; return renderMockGrid(); }
  if(d.msubmit === "yes") return submitMock(false);
  if(d.mfilter){ mockReview = d.mfilter; return render(); }
  if(el.dataset.start){ const [k, id] = el.dataset.start.split(":"); return startSession(k, id); }
  if(el.dataset.pick != null) return pick(Number(el.dataset.pick));
  if(el.dataset.next != null) return next();
  if(el.dataset.bm){ const id = el.dataset.bm; if(progress.bm[id]) delete progress.bm[id]; else progress.bm[id] = 1; saveProgress(); renderPlayer(); }
});

// Android back button (Capacitor App plugin): step back through the hash
// history; from Home, close the app. The WebView can report no history on a
// non-home screen (seen on the Tab S9 after the results page replaced its
// entry), so in that case go Home rather than closing the app.
(function(){
  const AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if(!AppPlugin || !AppPlugin.addListener) return;
  AppPlugin.addListener("backButton", ({ canGoBack }) => {
    const home = !location.hash || location.hash === "#/" || location.hash === "#";
    if(home) AppPlugin.exitApp();
    else if(canGoBack) history.back();
    else location.replace("#/");
  });
})();

// A paper whose 3 hours ran out while the app was closed is submitted on launch.
(function closeExpiredMock(){
  const a = progress.mock.active;
  if(!a) return;
  if(!mockById[a.id]){ progress.mock.active = null; saveProgress(); return; }
  if(msLeft(a) > 0) return;
  const hist = progress.mock.hist[a.id] = progress.mock.hist[a.id] || [];
  hist.push({ at: a.start + MOCK_MS, used: MOCK_MS, ans: a.ans, flag: a.flag, auto: 1 });
  progress.mock.active = null;
  saveProgress();
})();

app.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.agg;
  if(!k) return;
  progress[k] = e.target.value; saveProgress(); updateAgg();
});

/* ======================================================================
   ADS — one AdMob interstitial at a natural break only: after every 2nd
   finished practice set and after each finished mock, never within 3 min
   of the last one, never during a set or a mock. Google UMP consent first.
   In the browser there is no plugin, so all of this is a no-op.
   ====================================================================== */
const AD_GAP_MS = 3 * 60 * 1000, AD_SETS = 2, AD_KEY = "mdcat-ads-v1";
const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
let adReady = false, adOn = false, adPrivacy = false, adNpa = false;
function adState(){ try{ return JSON.parse(localStorage.getItem(AD_KEY)) || { sets:0, last:0 }; }catch(e){ return { sets:0, last:0 }; } }
function adSave(st){ try{ localStorage.setItem(AD_KEY, JSON.stringify(st)); }catch(e){} }
function adLoad(){
  if(!adOn || adReady) return;
  AdMob.prepareInterstitial({ adId: ADS.unit, isTesting: ADS.test, npa: adNpa }).then(() => { adReady = true; }).catch(() => {});
}
// Called once when a set or a mock has just finished.
function adBreak(kind){
  const st = adState();
  if(kind === "set") st.sets++;
  const due = (kind === "mock" || st.sets >= AD_SETS) && Date.now() - st.last >= AD_GAP_MS;
  if(due && adOn && adReady){
    adReady = false;
    // The next ad loads only once this one is dismissed: the plugin drops an
    // ad prepared while another is still on screen. The cap counts only an ad
    // that really showed.
    setTimeout(() => AdMob.showInterstitial()
      .then(() => { const s = adState(); s.sets = 0; s.last = Date.now(); adSave(s); })
      .catch(adLoad), 400);
  }
  adSave(st);
}
(async function adStart(){
  if(!AdMob) return;
  // If the consent check itself fails (offline, or no AdMob message set up),
  // fall back to non-personalised ads rather than none.
  try{
    let info = await AdMob.requestConsentInfo();
    if(info.status === "REQUIRED" && info.isConsentFormAvailable) info = await AdMob.showConsentForm();
    adPrivacy = info.privacyOptionsRequirementStatus === "REQUIRED";
    if(!info.canRequestAds) return;
  }catch(e){ adNpa = true; }
  try{
    await AdMob.initialize();
    adOn = true;
    AdMob.addListener && AdMob.addListener("interstitialAdDismissed", adLoad);
    adLoad();
  }catch(e){}
})();

/* ----- about ----- */
const SITE = "https://mdcat.homilabs.org";
function renderAbout(){
  app.innerHTML = bar("About", "#/") + `<div class="card guide" style="padding:16px;margin-top:14px">
    <h3 style="margin-top:0">MDCAT Prep</h3>
    <p>Version ${esc(APP_VERSION)} · by HomiLabs</p>
    <p>Practice for MDCAT on the PM&amp;DC 2025 curriculum: ${QUESTIONS.length.toLocaleString()} practice MCQs, ${MOCKS.length} full mock papers, memory cheats and important topics. Works offline; your progress stays on this phone.</p>
    <p class="note">MDCAT Prep is independent practice material. It is not affiliated with, endorsed by or connected to the Pakistan Medical &amp; Dental Council (PM&amp;DC), any university or any admissions body. All questions are original practice items, not real or recalled papers. Always check pmdc.pk for official dates, fees and rules.</p>
    <p class="note">Free with ads. Ads appear only between sessions, never during a question, a practice set or a mock.</p>
  </div>
  <div class="list" style="margin-top:14px">
    <a class="row" href="${SITE}/privacy.html" target="_blank" rel="noopener"><span class="main"><span class="title">Privacy policy</span></span><span class="chev">›</span></a>
    <a class="row" href="${SITE}/terms.html" target="_blank" rel="noopener"><span class="main"><span class="title">Terms of use</span></span><span class="chev">›</span></a>
    ${adPrivacy ? `<button class="row" data-adprivacy="1"><span class="main"><span class="title">Privacy &amp; ad choices</span><div class="sub">change your ad consent</div></span><span class="chev">›</span></button>` : ""}
    <a class="row" href="mailto:homilabs.smc@gmail.com?subject=MDCAT%20Prep"><span class="main"><span class="title">Contact us</span><div class="sub">homilabs.smc@gmail.com</div></span><span class="chev">›</span></a>
  </div>`;
}
app.addEventListener("click", e => {
  if(e.target.closest("[data-adprivacy]") && AdMob) AdMob.showPrivacyOptionsForm().catch(() => {});
});

render();
})();
