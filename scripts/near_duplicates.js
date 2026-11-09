#!/usr/bin/env node
// near_duplicates.js — lists pairs of Biology stems with high word overlap (run from the project root).
// Lists pairs of stems (any bio units) with high word overlap.
const fs=require("fs");const dir="content/questions/bio/";
const all=[];for(const f of fs.readdirSync(dir))for(const q of JSON.parse(fs.readFileSync(dir+f)))all.push(q);
const stop=new Set("the a an of in is are which following to and by for on as that with from its it be this at or".split(" "));
const toks=s=>new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w&&!stop.has(w)));
const T=all.map(q=>({q,t:toks(q.q),k:toks(q.o[q.a])}));
for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i].t,b=T[j].t;let n=0;for(const w of a)if(b.has(w))n++;const jac=n/(a.size+b.size-n);
const sameKey=[...T[i].k].join()===[...T[j].k].join();if(jac>=0.6||(jac>=0.45&&sameKey))console.log(jac.toFixed(2),sameKey?"SAMEKEY":"",T[i].q.id,"|",T[i].q.q,"||",T[j].q.id,"|",T[j].q.q);}
console.log("total",all.length);
