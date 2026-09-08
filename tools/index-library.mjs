// Run before publishing so new folders appear in the lesson selector automatically.
import {readdir,writeFile,access} from 'node:fs/promises';
import {validLessonId} from '../library.js';
const root=new URL('../library/',import.meta.url),ids=[];
for(const entry of await readdir(root,{withFileTypes:true})){
 if(!entry.isDirectory()||!validLessonId(entry.name))continue;
 const folder=new URL(entry.name+'/',root);
 try{await access(new URL('lesson.json',folder));ids.push(entry.name);}
 catch{try{await access(new URL(entry.name+'.mid',folder));ids.push(entry.name);}catch{}}
}
ids.sort((a,b)=>a==='test'?-1:b==='test'?1:a.localeCompare(b));
await writeFile(new URL('index.json',root),JSON.stringify(ids,null,2)+'\n');
console.log(`Indexed ${ids.length} library lessons.`);
