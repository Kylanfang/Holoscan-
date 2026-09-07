import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=process.argv[2]||path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Keep Archify artifacts byte-for-byte intact. The portal loads copies through srcdoc,
// enabling same-origin offline node listeners without changing browser security flags.
const docs={};for(const file of fs.readdirSync(path.join(root,'standalone')).filter(f=>/^(\d\d)-.+\.html$/.test(f)&&!f.includes('.visual-check.')))docs['standalone/'+file]=fs.readFileSync(path.join(root,'standalone',file),'utf8');
fs.writeFileSync(path.join(root,'portal-data.js'),'const portalDocuments = '+JSON.stringify(docs)+';\n');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('<script src="portal-data.js"></script>'))html=html.replace('<script>','<script src="portal-data.js"></script>\n<script>');
html=html.replace("frame.src=p.file.startsWith('standalone/')?`${p.file}?embed=1`:p.file;",`if(p.file.startsWith('standalone/')){frame.removeAttribute('src');frame.srcdoc=portalDocuments[p.file].replace('<html ', '<html data-embed="true" ');}else{frame.removeAttribute('srcdoc');frame.src=p.file;}`);
// Keep the cards visible in standalone mode. Portal context and contracts remain outside
// the compact embedded drawing, using the renderer's documented embed mode.
fs.writeFileSync(path.join(root,'index.html'),html);
const readme=path.join(root,'README.html');fs.writeFileSync(readme,fs.readFileSync(readme,'utf8').replace('网页采用内置 postMessage 导航桥处理 file:// iframe 隔离。','门户用 srcdoc 同源嵌入处理 file:// iframe 隔离；不改浏览器安全设置。portal-data.js 保存独立图的字节副本，只在嵌入时添加 embed 属性；独立图原件和交付哈希不变。'));
console.log('Bundled '+Object.keys(docs).length+' immutable diagrams for offline portal navigation.');
