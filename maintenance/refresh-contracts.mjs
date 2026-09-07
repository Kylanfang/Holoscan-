import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data=JSON.parse(fs.readFileSync(path.join(root,'engineering','contracts.json'),'utf8'));
const p=path.join(root,'engineering','contracts.html');const lines=fs.readFileSync(p,'utf8').split('\n');
const i=lines.findIndex(s=>s.startsWith('const data='));if(i<0)throw new Error('Embedded data marker missing');
lines[i]='const data='+JSON.stringify(data.contracts)+',labels='+JSON.stringify(data.status_labels)+';';
fs.writeFileSync(p,lines.join('\n'));console.log('Updated embedded contract data. Rerun static checks and refresh package evidence.');
