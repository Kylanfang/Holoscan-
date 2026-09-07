import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=process.argv[2]||path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const inline=html=>[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.events={};this.value='';this.innerHTML='';this.textContent='';this.hidden=false;this.classList={toggle:()=>{}};}
 appendChild(c){this.children.push(c);return c}append(c){return this.appendChild(c)}
 addEventListener(k,f){this.events[k]=f}removeAttribute(k){delete this.attributes[k];if(k==='srcdoc')this.srcdoc='';if(k==='src')this.src=''}
 querySelectorAll(s){return s==='button'?this.children:[]}
}
function context(html){const elements={};for(const m of html.matchAll(/\bid="([^"]+)"/g))elements[m[1]]=new Element();for(const m of html.matchAll(/<input\b([^>]+)>/g)){const id=m[1].match(/id="([^"]+)"/)?.[1];if(id)elements[id].value=m[1].match(/value="([^"]*)"/)?.[1]||'';}const events={};const doc={getElementById:id=>elements[id]||(elements[id]=new Element()),createElement:t=>new Element(t),querySelectorAll:s=>s==='[data-page]'?elements.nav.children:s==='#filters button'?elements.filters.children:s==='input'?Object.values(elements).filter(e=>'oninput'in e||e.value!==''):[]};const location={hash:''},history={back:()=>{}};const win={addEventListener:(k,f)=>events[k]=f};const ctx=vm.createContext({document:doc,window:win,location,history,console});return {ctx,elements,events,location};}
const portalHtml=read('index.html'),p=context(portalHtml);
vm.runInContext(read('portal-data.js'),p.ctx);for(const script of inline(portalHtml))vm.runInContext(script,p.ctx);
const pages=vm.runInContext('pages',p.ctx),routes=vm.runInContext('nodeRoutes',p.ctx),bundled=vm.runInContext('portalDocuments',p.ctx);
assert.equal(Object.keys(pages).length,15);assert.equal(Object.keys(bundled).length,13);
const sourceFiles=fs.readdirSync(path.join(root,'source')).filter(f=>f.endsWith('.json'));const specs=sourceFiles.map(f=>JSON.parse(read('source/'+f)));
const allIds=new Set(specs.flatMap(j=>(j.components||j.states||j.participants).map(n=>n.id)));
for(const [id,target]of Object.entries(routes)){assert(allIds.has(id),'Unknown node '+id);assert(pages[target],'Unknown page '+target)}
let checkedRoutes=0;
for(const [id,page]of Object.entries(pages)){
 assert(fs.existsSync(path.join(root,page.file)),'Missing page '+page.file);p.location.hash='#/'+id;p.events.hashchange();
 if(page.file.startsWith('standalone/')){
  const artifact=read(page.file);assert.equal(bundled[page.file],artifact);assert.equal(p.elements.frame.srcdoc,artifact.replace('<html ','<html data-embed="true" '));
  const nodes=[...artifact.matchAll(/data-node-id="([^"]+)"/g)].map(m=>{const e=new Element();e.dataset={nodeId:m[1],nodeLabel:m[1]};return e});
  p.elements.frame.contentDocument={querySelectorAll:()=>nodes};p.events.hashchange();p.elements.frame.events.load();
  for(const n of nodes.filter(n=>routes[n.dataset.nodeId])){p.location.hash='#/'+id;p.events.hashchange();n.events.click();assert.equal(p.elements.enter.hidden,false);p.elements.enter.onclick();assert.equal(p.location.hash,'#/'+routes[n.dataset.nodeId]);p.location.hash='#/'+id;p.events.hashchange();n.events.dblclick({preventDefault(){},stopPropagation(){}});assert.equal(p.location.hash,'#/'+routes[n.dataset.nodeId]);checkedRoutes++}
 }else{assert.equal(p.elements.frame.src,page.file);assert.equal(p.elements.frame.srcdoc,'')}
}
p.location.hash='#/missing-page';p.events.hashchange();assert(p.elements.frame.srcdoc.includes('目标架构'));
const prior=p.location.hash;p.events.message({source:{},data:{type:'archify-node-activate',nodeId:'transport',activation:'dblclick'}});assert.equal(p.location.hash,prior);
const contracts=JSON.parse(read('engineering/contracts.json'));assert.equal(contracts.contracts.length,21);assert.equal(contracts.contracts.filter(c=>c.status==='project_verified').length,0);
const c=context(read('engineering/contracts.html'));c.elements.priority.value='all';for(const s of inline(read('engineering/contracts.html')))vm.runInContext(s,c.ctx);assert.equal(c.elements.count.textContent,'显示 21 / 21 项');
c.elements.search.value='TKEEP';c.elements.search.oninput();assert.equal(c.elements.count.textContent,'显示 1 / 21 项');c.elements.search.value='';c.elements.search.oninput();c.elements.filters.children.find(b=>b.textContent==='项目验证通过').onclick();assert.equal(c.elements.count.textContent,'显示 0 / 21 项');c.elements.filters.children.find(b=>b.textContent==='全部状态').onclick();
const budgetHtml=read('engineering/review.html'),b=context(budgetHtml);for(const s of inline(budgetHtml))vm.runInContext(s,b.ctx);assert(b.elements.budget.textContent.includes('4.976640'));assert(b.elements.budget.textContent.includes('5.529600'));b.elements.bits.value='24';vm.runInContext('calculate()',b.ctx);assert(b.elements.budget.textContent.includes('11.943936'));assert(b.elements.budget.textContent.includes('预算超载'));b.elements.efficiency.value='0';vm.runInContext('calculate()',b.ctx);assert(b.elements.budget.textContent.includes('请输入正数'));
const links=[];function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
for(const f of walk(root).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(f,'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');for(const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){const href=m[1];if(/^(?:https?:|data:|blob:|#|javascript:|about:)/i.test(href)||href.includes('${')||href.includes("'+"))continue;const rel=decodeURIComponent(href.split(/[?#]/)[0]);if(!rel)continue;const target=path.resolve(path.dirname(f),rel);if(!fs.existsSync(target))links.push({file:path.relative(root,f),href})}}
for(const c of contracts.contracts)assert(fs.existsSync(path.resolve(root,'engineering',c.diagram)),'Contract diagram missing '+c.id);
// The manifest and final validation text are written after the content checks.
const unresolved=links;assert.deepEqual(unresolved,[]);
const hashes=specs.map((j,i)=>{const stem=sourceFiles[i].replace('.json',''),artifact=read('standalone/'+stem+'.html');const receipt=JSON.parse(read('standalone/'+stem+'.visual-check.json'));assert.equal(receipt.status,'pass',stem+' browser check');assert.equal(receipt.artifact.sha256,sha(artifact),stem+' stale browser evidence');return {file:stem+'.html',sha256:sha(artifact),browser_status:receipt.status}});
const result={date:'2026-09-05',kind:'node-vm-static-and-logic-checks',status:'pass',browser_interaction:'not_executed_policy_blocked',checks:{portal_pages:15,immutable_embedded_diagrams:13,navigation_nodes_exercised:checkedRoutes,unknown_route_fallback:true,foreign_message_rejected:true,contracts:21,project_verified:0,search_filter:true,status_filter:true,budget_valid_and_invalid_inputs:true,broken_local_links:unresolved.length,artifact_receipts_match:true},artifacts:hashes};fs.writeFileSync(path.join(root,'validation','static-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.checks,null,2));
