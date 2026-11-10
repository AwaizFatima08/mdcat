#!/usr/bin/env node
// Takes the Play Store phone screenshots (1080×1920) of www/ with headless Chrome.
// Needs the preview server on :8767 (python3 -m http.server 8767 --directory www).
// Seeds some demo progress so the screens look in use; nothing leaves this machine.
// Usage: node scripts/store_screenshots.js
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "store-assets", "screenshots");
const BASE = "http://localhost:8767/";
const PORT = 9444;
const SHOTS = [
  ["01-home", "#/"],
  ["02-question", "PLAY"],
  ["03-unit", "#/u/bio-11"],
  ["04-mock", "#/mres/mock-01/0"],
  ["05-cheat", "#/cheat/bio-11-c01"],
  ["06-topics", "#/topics/chem"],
];

// Demo progress, built from the content files: ~30–50% of each subject
// answered (~76% right) and one finished mock.
function seedScript() {
  const root = path.join(__dirname, "..", "content");
  const share = { bio: 0.4, chem: 0.3, phy: 0.25, eng: 0.5, lr: 0.5 };
  const p = { q: {}, bm: {}, mock: { active: null, hist: {} } };
  let k = 0;
  for (const sid of Object.keys(share)) {
    for (const f of fs.readdirSync(path.join(root, "questions", sid)).sort()) {
      for (const q of JSON.parse(fs.readFileSync(path.join(root, "questions", sid, f), "utf8"))) {
        k++;
        if (((k * 7919) % 1000) / 1000 < share[sid]) { const ok = (k * 104729) % 100 < 76; p.q[q.id] = { n: 1, c: ok ? 1 : 0, last: ok ? 1 : 0 }; }
      }
    }
  }
  const m = JSON.parse(fs.readFileSync(path.join(root, "mocks", "mock-01.json"), "utf8"));
  p.mock.hist[m.id] = [{ at: Date.now() - 864e5, used: 9900000, ans: m.questions.map((q, i) => ((i * 37) % 100 < 74 ? q.a : (q.a + 1) % 4)), flag: [], auto: 0 }];
  return `localStorage.setItem("mdcat-prep-v1", ${JSON.stringify(JSON.stringify(p))}); ${Object.keys(p.q).length}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const dir = fs.mkdtempSync("/tmp/mdcat-shots-");
  const chrome = spawn("google-chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, "--hide-scrollbars", "--window-size=360,640", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 50 && !list; i++) { await sleep(200); try { list = await (await fetch(`http://localhost:${PORT}/json`)).json(); } catch (e) {} }
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const wait = {};
  ws.onmessage = (m) => { const r = JSON.parse(m.data); if (wait[r.id]) { wait[r.id](r.result); delete wait[r.id]; } };
  const send = (method, params = {}) => new Promise((r) => { wait[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 3, mobile: true });
  await send("Page.navigate", { url: BASE });
  await sleep(1500);
  console.log("seeded answers:", await evaluate(seedScript()));
  await send("Page.reload");   // the app reads progress only at start-up
  await sleep(1500);

  for (const [name, hash] of SHOTS) {
    await send("Page.navigate", { url: BASE + "#/" });
    await sleep(1200);
    if (hash === "PLAY") {
      // A Biology set with the first answer picked, so the explanation shows.
      await evaluate(`location.hash = "#/u/bio-05"; 1`); await sleep(400);
      await evaluate(`document.querySelector('[data-start^="unit:"]').click(); 1`); await sleep(400);
      await evaluate(`(() => { const b = document.querySelectorAll('[data-pick]'); b[0].click(); return b.length; })()`); await sleep(400);
    } else {
      await evaluate(`location.hash = ${JSON.stringify(hash)}; 1`); await sleep(700);
    }
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(shot.data, "base64"));
    console.log("wrote", name);
  }
  ws.close();
  await new Promise((r) => { chrome.on("exit", r); chrome.kill(); });
  await sleep(300);
  fs.rmSync(dir, { recursive: true, force: true });
})();
