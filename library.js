import {parseMidi} from './core.js';
export const validLessonId=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id);
const filename=(name,extensions)=>typeof name==='string'&&/^[^/\\?#]+$/.test(name)&&!name.startsWith('.')&&extensions.some(ext=>name.toLowerCase().endsWith(ext));
export async function loadLibraryLesson(id,request=fetch){
 if(!validLessonId(id))throw Error('Invalid library folder name.');
 const folder=`./library/${encodeURIComponent(id)}/`;let config={};
 const meta=await request(folder+'lesson.json');
 if(meta.ok){config=await meta.json();if(!config||typeof config!=='object'||Array.isArray(config))throw Error(`Invalid lesson.json in ${id}.`);}else if(meta.status!==404)throw Error(`Could not load settings for ${id}.`);
 const midi=config.midi||`${id}.mid`;if(!filename(midi,['.mid','.midi']))throw Error(`Invalid MIDI filename in ${id}.`);
 const response=await request(folder+encodeURIComponent(midi));if(!response.ok)throw Error(`MIDI file not found: library/${id}/${midi}`);
 const buffer=await response.arrayBuffer();if(buffer.byteLength>5e6)throw Error(`MIDI file too large: ${id}.`);const parsed=parseMidi(buffer);if(parsed.notes.length>20000)throw Error(`Too many notes in ${id}.`);
 let image=null;
 if(config.image){if(!filename(config.image,['.png','.jpg','.jpeg','.webp','.svg']))throw Error(`Invalid score filename in ${id}.`);image=folder+encodeURIComponent(config.image);}
 else if(config.image!==null){const candidates=[`${id}.svg`,`${id}.png`,`${id}.jpg`,`${id}.webp`,'score.svg','score.png','score.jpg','score.webp'];const found=await Promise.all(candidates.map(async name=>{try{const r=await request(folder+encodeURIComponent(name),{method:'HEAD'});return r.ok?folder+encodeURIComponent(name):null;}catch{return null;}}));image=found.find(Boolean)||null;}
 return {id,title:typeof config.title==='string'?config.title:id,...parsed,image,shared:true};
}
