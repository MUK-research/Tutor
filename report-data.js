// Report data is indexed by reference notes: playing late must not move a problem
// to the next place in the score. Values come from raw MIDI, never the cube trail.
export const COMPONENTS = [
  {key:'dynamics',label:'Dynamics',color:'#258260',tolerance:32},
  {key:'timing',label:'Timing',color:'#b24e5c',tolerance:.25},
  {key:'duration',label:'Key duration',color:'#386eaf',tolerance:1}
];
export function referenceKey(notes){
  let hash=2166136261;
  for(const n of notes)for(const c of `${n.pitch},${n.velocity},${n.onset},${n.duration};`){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return `${notes.length}-${hash>>>0}`;
}
export function makeReport(engine,{title,rate,duration,endedAt,interrupted=false,demo=false,reference}){
  const matches=new Map(engine.matches.map(m=>[m.index,m]));
  const points=engine.notes.map((n,index)=>{
    const m=matches.get(index),state=m?(m.duration===null?'unreleased':'matched'):interrupted&&n.onset>endedAt?'not-reached':'missed';
    const raw=Object.fromEntries(COMPONENTS.map(c=>[c.key,m?.[c.key]??null]));
    const values=Object.fromEntries(COMPONENTS.map(c=>[c.key,state==='not-reached'?null:raw[c.key]===null?0:100*Math.max(0,1-Math.abs(raw[c.key])/c.tolerance)]));
    return {index,time:n.onset,pitch:n.pitch,state,raw,values,playedAt:m?.onset??null};
  });
  return {version:1,title,rate,duration,endedAt,interrupted,demo,referenceKey:referenceKey(reference),points,extras:engine.extraNotes||[]};
}
export function groupReport(points){
  const groups=[];
  for(const p of points){let g=groups.at(-1);if(!g||Math.abs(g.time-p.time)>1e-7){g={time:p.time,points:[]};groups.push(g);}g.points.push(p);}
  return groups.map(g=>({...g,values:Object.fromEntries(COMPONENTS.map(c=>{const v=g.points.map(p=>p.values[c.key]).filter(Number.isFinite);return [c.key,v.length?v.reduce((a,b)=>a+b,0)/v.length:null];}))}));
}
export function validPositions(input,noteCount){
  if(!Array.isArray(input))return [];
  const unique=new Map();
  for(const p of input)if(p&&Number.isInteger(p.index)&&p.index>=0&&p.index<noteCount&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1)unique.set(p.index,{index:p.index,x:p.x,y:p.y});
  return [...unique.values()].sort((a,b)=>a.index-b.index);
}
// The image is object-fit:contain, centred horizontally and aligned to the top.
export function imageBox(pageWidth,pageHeight,imageWidth,imageHeight){
  if(!imageWidth||!imageHeight)return null;
  const scale=Math.min(pageWidth/imageWidth,pageHeight/imageHeight),width=imageWidth*scale,height=imageHeight*scale;
  return {x:(pageWidth-width)/2,y:0,width,height};
}
export const pitchName=p=>`${['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][p%12]}${Math.floor(p/12)-1}`;
export function deviationText(point,key){
  const value=point.raw[key];
  if(point.state==='not-reached')return 'Not reached';
  if(point.state==='missed')return 'Missed note';
  if(value===null)return 'Key not released';
  const score=`${Math.round(point.values[key])}%`;
  if(Math.abs(value)<1e-8)return `${score} · exact match`;
  if(key==='dynamics')return `${score} · ${Math.abs(value)} velocity ${value>0?'louder':'softer'}`;
  if(key==='timing')return `${score} · ${Math.round(Math.abs(value)*1000)} ms ${value>0?'late':'early'}`;
  return `${score} · ${Math.round(Math.abs(value)*100)}% ${value>0?'longer':'shorter'}`;
}
