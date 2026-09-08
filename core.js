// MIDI files and performance evaluation. Times are seconds, velocity is 1–127.
export function parseMidi(buffer) {
  const a = new Uint8Array(buffer); let p = 0;
  const need = n => { if (p + n > a.length) throw Error('The MIDI file is truncated.'); };
  const u8 = () => { need(1); return a[p++]; };
  const u16 = () => (u8()<<8)|u8();
  const u32 = () => u8()*16777216 + u8()*65536 + u8()*256 + u8();
  const str = () => String.fromCharCode(u8(),u8(),u8(),u8());
  const vlq = () => { let v=0; for(let i=0;i<4;i++){const b=u8();v=v*128+(b&127);if(!(b&128))return v;}throw Error('Invalid MIDI variable length value.'); };
  if(str()!=='MThd')throw Error('Choose a Standard MIDI file (.mid).');
  const header=u32(), format=u16(), tracks=u16(), ppq=u16();
  if(header<6 || format>1 || !ppq || (ppq&32768))throw Error('Use a format 0 or 1 MIDI file with musical (PPQ) timing.');
  need(header-6);p+=header-6;
  const events=[], tempos=[{tick:0,us:500000}]; let orphan=0;
  for(let track=0;track<tracks;track++){
    if(str()!=='MTrk')throw Error('Missing MIDI track.');
    const len=u32();need(len);const end=p+len;let tick=0,running=0;
    while(p<end){
      tick+=vlq();let status=u8();
      if(status<128){if(!running)throw Error('Invalid MIDI running status.');p--;status=running;}
      if(status===255){running=0;const type=u8(),n=vlq();need(n);if(type===81 && n===3){const us=a[p]*65536+a[p+1]*256+a[p+2];if(!us)throw Error('Invalid tempo.');tempos.push({tick,us});}p+=n;}
      else if(status===240 || status===247){running=0;const n=vlq();need(n);p+=n;}
      else if(status>=128 && status<240){running=status;const kind=status>>4,channel=status&15,note=u8();const v=(kind===12||kind===13)?0:u8();if(note>127||v>127)throw Error('Invalid MIDI data.');if(kind===8||kind===9)events.push({tick,track,channel,note,velocity:v,on:kind===9&&v>0});}
      else throw Error('Unsupported MIDI event.');
      if(p>end)throw Error('MIDI event exceeds track length.');
    }
  }
  tempos.sort((a,b)=>a.tick-b.tick);let seconds=0,last=0,us=500000;
  for(const t of tempos){seconds+=(t.tick-last)*us/ppq/1e6;t.seconds=seconds;last=t.tick;us=t.us;}
  const time=tick=>{let lo=0,hi=tempos.length;while(lo+1<hi){const m=(lo+hi)>>1;if(tempos[m].tick<=tick)lo=m;else hi=m;}const t=tempos[lo];return t.seconds+(tick-t.tick)*t.us/ppq/1e6;};
  events.sort((a,b)=>a.tick-b.tick);const active=new Map(),notes=[];
  for(const e of events){const key=`${e.track}:${e.channel}:${e.note}`;if(e.on){if(!active.has(key))active.set(key,[]);active.get(key).push(e);}else{const start=active.get(key)?.shift();if(start){const onset=time(start.tick),duration=time(e.tick)-onset;if(duration>0)notes.push({pitch:e.note,velocity:start.velocity,onset,duration,track:e.track,channel:e.channel});}}}
  for(const q of active.values())orphan+=q.length;
  notes.sort((a,b)=>a.onset-b.onset||a.pitch-b.pitch);
  if(!notes.length)throw Error('This file contains no complete notes.');
  return {notes,bpm:60e6/tempos.filter(t=>t.tick===0).at(-1).us,duration:Math.max(...notes.map(n=>n.onset+n.duration)),warning:orphan?`${orphan} notes without releases were omitted.`:''};
}
export const clamp = (x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
export class Performance {
  constructor(notes,rate=1){this.notes=notes.map(n=>({...n,onset:n.onset/rate,duration:n.duration/rate}));this.matches=[];this.used=new Set();this.active=new Map();this.extra=0;this.window=.5;}
  on(pitch,velocity,time,channel=0){
    let best=-1,distance=this.window;
    this.notes.forEach((n,i)=>{const d=Math.abs(n.onset-time);if(n.pitch===pitch&&!this.used.has(i)&&d<=distance){distance=d;best=i;}});
    const key=`${channel}:${pitch}`;if(!this.active.has(key))this.active.set(key,[]);
    if(best<0){this.extra++;this.active.get(key).push(null);return null;}
    this.used.add(best);const n=this.notes[best];const m={index:best,pitch,velocity,onset:time,timing:time-n.onset,dynamics:velocity-n.velocity,duration:null};
    this.matches.push(m);this.active.get(key).push(m);return m;
  }
  off(pitch,time,channel=0){const m=this.active.get(`${channel}:${pitch}`)?.shift();if(m){m.held=Math.max(0,time-m.onset);m.duration=(m.held-this.notes[m.index].duration)/this.notes[m.index].duration;}return m;}
  point(m,previous=[0,0,0]){return [clamp(m.timing/.25),clamp(m.dynamics/32),m.duration===null?previous[2]:clamp(m.duration)];}
  result(){
    const denominator=this.notes.length+this.extra;
    const accuracy=(key,tolerance)=>100*this.matches.reduce((s,m)=>s+(m[key]===null?0:Math.max(0,1-Math.abs(m[key])/tolerance)),0)/denominator;
    return {dynamics:accuracy('dynamics',32),timing:accuracy('timing',.25),duration:accuracy('duration',1),matched:this.matches.length,missing:this.notes.length-this.matches.length,extra:this.extra,unreleased:this.matches.filter(m=>m.duration===null).length,total:this.notes.length};
  }
}
