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
   ====================================================================== */
const app = document.getElementById("app");
let session = null;   // current practice set: { title, back, items:[q], i, answers:[idx|null] }

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
  if(parts[0] === "s" && subjectById[parts[1]]) return renderSubject(parts[1]);
  if(parts[0] === "u" && unitById[parts[1]]) return renderUnit(parts[1]);
  if(parts[0] === "play" && session) return renderPlayer();
  if(parts[0] === "results" && session) return renderResults();
  if(parts[0] === "mistakes") return renderMistakes();
  if(parts[0] === "guide") return parts[1] ? renderGuideSection(parts[1]) : renderGuide();
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
    <button class="tile" data-go="#/soon/Mock%20exams"><div class="ic">⏱️</div><div class="title">Mock exams</div><div class="sub">20 full papers · coming soon</div></button>
    <button class="tile" data-go="#/guide"><div class="ic">📋</div><div class="title">Rules &amp; guidelines</div><div class="sub">format, passing, exam day</div></button>
    <button class="tile" data-go="#/soon/Memory%20cheats"><div class="ic">🧠</div><div class="title">Memory cheats</div><div class="sub">coming soon</div></button>
    <button class="tile" data-go="#/soon/Important%20topics"><div class="ic">⭐</div><div class="title">Important topics</div><div class="sub">coming soon</div></button>
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
  else go("#/results");
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

function renderSoon(name){
  app.innerHTML = bar(name || "Coming soon", "#/") + `<div class="empty">${esc(name)} is being built and will arrive in an update.</div>`;
}

/* ======================================================================
   EVENTS — one delegated listener for the whole app.
   ====================================================================== */
app.addEventListener("click", e => {
  const el = e.target.closest("[data-go],[data-start],[data-pick],[data-next],[data-bm]");
  if(!el) return;
  if(el.dataset.go != null) return go(el.dataset.go);
  if(el.dataset.start){ const [k, id] = el.dataset.start.split(":"); return startSession(k, id); }
  if(el.dataset.pick != null) return pick(Number(el.dataset.pick));
  if(el.dataset.next != null) return next();
  if(el.dataset.bm){ const id = el.dataset.bm; if(progress.bm[id]) delete progress.bm[id]; else progress.bm[id] = 1; saveProgress(); renderPlayer(); }
});

render();
})();
