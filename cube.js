import {clamp} from './core.js';
// Isometric projection of actual 3D coordinates; the reference is (0,0,0).
export class Cube {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.target=[0,0,0];this.current=[0,0,0];this.trail=[];this.live=false;this.last=performance.now();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;requestAnimationFrame(t=>this.draw(t));}
  reset(){this.target=[0,0,0];this.current=[0,0,0];this.trail=[];this.live=false;}
  set(point){this.target=[point[0],point[1],-point[2]];this.live=true;}
  draw(now){
    const c=this.canvas,g=this.ctx,w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
    const s=Math.min(w/5.7,(h-100)/3.4),cx=w/2,cy=h/2-10;
    const project=([x,y,z])=>[cx+(x-z)*.866*s,cy+((x+z)*.5-y)*s];
    const line=(a,b,color,width=1,dash=[])=>{const p=project(a),q=project(b);g.beginPath();g.setLineDash(dash);g.strokeStyle=color;g.lineWidth=width;g.moveTo(...p);g.lineTo(...q);g.stroke();g.setLineDash([]);};
    for(let axis=0;axis<3;axis++)for(const a of [-1,1])for(const b of [-1,1]){const p=[a,b,-1],q=[a,b,1];if(axis===0){p.splice(0,3,-1,a,b);q.splice(0,3,1,a,b);}if(axis===1){p.splice(0,3,a,-1,b);q.splice(0,3,a,1,b);}line(p,q,'#dce5e7');}
    line([-1,0,0],[1,0,0],'#bd62704d',1,[3,5]);line([0,-1,0],[0,1,0],'#3285664d',1,[3,5]);line([0,0,-1],[0,0,1],'#437db44d',1,[3,5]);
    // Three coloured edges share the lower front corner, matching the supplied axes.
    line([-1,-1,-1],[1,-1,-1],'#b85c6a',2);line([-1,-1,-1],[-1,1,-1],'#368b6b',2);line([-1,-1,-1],[-1,-1,1],'#477eb8',2);
    const label=(p,text,color,dx=0,dy=0,align='center')=>{const q=project(p);g.fillStyle=color;g.font=`${w<600?12:14}px system-ui`;g.textAlign=align;g.fillText(text,q[0]+dx,q[1]+dy);};
    label([0,1.3,0],'Louder','#258260');label([0,-1.45,0],'Softer','#258260');
    label([1.25,0,0],'Late','#a64f5e',12,0,'left');label([-1.25,0,0],'Early','#a64f5e',-12,0,'right');
    label([0,0,1.25],'Shorter','#386eaf',-12,24,'right');label([0,0,-1.25],'Longer','#386eaf',12,24,'left');
    const centre=project([0,0,0]);g.beginPath();g.arc(...centre,13,0,Math.PI*2);g.strokeStyle='#7c9b9b77';g.lineWidth=1;g.stroke();g.beginPath();g.arc(...centre,3,0,Math.PI*2);g.fillStyle='#719291';g.fill();
    const dt=Math.min((now-this.last)/1000,.1);this.last=now;const amount=this.reduced?1:1-Math.exp(-dt/.2);
    this.current=this.current.map((v,i)=>v+(this.target[i]-v)*amount);
    if(this.live)this.trail.push({p:[...this.current],t:now});
    this.trail=this.trail.filter(p=>now-p.t<6500);
    g.lineCap='round';
    for(let i=1;i<this.trail.length;i++){const a=this.trail[i-1],b=this.trail[i],alpha=clamp(1-(now-b.t)/6500,0,1);line(a.p,b.p,`rgba(38,111,117,${alpha*.8})`,1+alpha*4);}
    if(this.live){const p=project(this.current);g.beginPath();g.arc(...p,10,0,Math.PI*2);g.fillStyle='#27757c19';g.fill();g.beginPath();g.arc(...p,5,0,Math.PI*2);g.fillStyle='#27757c';g.fill();}
    requestAnimationFrame(t=>this.draw(t));
  }
}
