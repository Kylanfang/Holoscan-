import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cli=process.env.ARCHIFY_CLI||'C:/Users/LEGION/.codex/skills/archify/bin/archify.mjs';
const deliver=process.argv.includes('--deliver');const receipts=[];
for(const f of fs.readdirSync(path.join(root,'source')).filter(f=>f.endsWith('.json')).sort()){
 const source=path.join(root,'source',f),spec=JSON.parse(fs.readFileSync(source,'utf8').replace(/^\uFEFF/,''));
 const html=path.join(root,'standalone',f.replace(/\.json$/,'.html'));
 for(const command of deliver?['validate','deliver','visual-check']:['validate']){
  const args=command==='visual-check'?[cli,command,html,'--json']:[cli,command,spec.diagram_type,source,...(command==='deliver'?[html]:[]),'--quality','showcase','--json'];
  const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
  let result;try{result=JSON.parse(r.stdout)}catch{console.error(r.stdout,r.stderr);process.exit(1)}
  if(r.status!==0||!result.ok){console.error(JSON.stringify(result,null,2));process.exit(1)}
  if(command==='deliver')receipts.push(result);
  console.log(command+' PASS '+f);
 }
}
if(deliver){
 fs.writeFileSync(path.join(root,'validation','final-delivery.json'),JSON.stringify({receipts},null,2)+'\n');
 const r=spawnSync(process.execPath,[path.join(root,'maintenance','build-embed.mjs'),root],{stdio:'inherit',windowsHide:true});if(r.status!==0)process.exit(1);
 console.log('人工 / 图像视觉审查仍需重新执行；需更新验证说明、文件清单和 ZIP，不能沿用旧签收。');
}
