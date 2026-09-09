import {COMPONENTS,groupReport,validPositions,imageBox,pitchName,deviationText,referenceKey} from './report-data.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
function svg(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));if(text!==undefined)el.textContent=text;return el;}
export class PracticeReport {
  constructor(){
    this.data=null;this.lesson=null;this.positions=[];this.selected=0;this.aligning=false;
    for(const c of COMPONENTS)$(`overlay-${c.key}`).onchange=()=>this.drawOverlay();
    $('reviewNote').oninput=()=>this.select(Number($('reviewNote').value));
    $('alignScore').onclick=()=>this.startAlignment();
    $('alignCancel').onclick=()=>this.endAlignment(false);
    $('alignSave').onclick=()=>this.endAlignment(true);
    $('alignIndex').oninput=()=>this.alignmentStatus();
    $('alignPrevious').onclick=()=>this.stepAlignment(-1);
    $('alignNext').onclick=()=>this.stepAlignment(1);
    $('scoreOverlay').addEventListener('click',event=>this.scoreClick(event));
    $('score').addEventListener('load',()=>this.refreshScore());
    $('score').addEventListener('error',()=>this.refreshScore());
    new ResizeObserver(()=>this.drawOverlay()).observe($('scorePage'));
    new ResizeObserver(()=>{if(this.data)this.drawTimeline();}).observe($('timelineWrap'));
  }
  reset(){
    this.data=null;this.lesson=null;this.aligning=false;this.positions=[];
    $('performanceReview').hidden=true;$('overlayControls').hidden=true;$('alignmentControls').hidden=true;
    $('scoreOverlay').replaceChildren();$('scoreOverlay').classList.remove('aligning');
  }
  show(data,lesson){
    this.reset();this.data=data;this.groups=groupReport(data.points);
    this.lesson=lesson&&referenceKey(lesson.notes)===data.referenceKey?lesson:null;
    if(this.lesson){this.storageKey=`tutor.alignment.v1.${this.lesson.id}.${data.referenceKey}`;this.positions=validPositions(this.lesson.scorePositions,this.lesson.notes.length);try{const saved=JSON.parse(localStorage.getItem(this.storageKey)||'null');if(saved)this.positions=validPositions(saved,this.lesson.notes.length);}catch{}}
    $('performanceReview').hidden=false;$('overlayControls').hidden=false;
    $('reviewTitle').textContent=`${data.demo?'Demo':'Practice'} · ${data.title}`;
    $('reviewSubtitle').textContent=`Per-note accuracy · ${Math.round(data.rate*100)}% tempo${data.interrupted?' · stopped early':''}`;
    $('reviewNote').max=Math.max(0,this.groups.length-1);$('reviewNote').value=0;$('reviewNote').disabled=!this.groups.length;
    this.selected=0;this.refreshScore();this.drawTimeline();this.select(0);
  }
  refreshScore(){
    const available=!!(this.lesson&&$('score').naturalWidth&&!$('score').hidden);
    $('alignScore').disabled=!available;
    for(const c of COMPONENTS)$(`overlay-${c.key}`).disabled=!available||!this.positions.length;
    if(this.data)$('overlayHint').textContent=!available?'A matching score image is needed for overlays.':this.positions.length?`${this.positions.length} / ${this.lesson.notes.length} score positions aligned. Larger marks indicate larger errors.`:'Align the score once to place feedback on the notes.';
    this.drawOverlay();
  }
  drawTimeline(){
    if(!this.data)return;
    const width=Math.max(480,$('timelineWrap').clientWidth),height=310,left=52,right=24,top=24,bottom=65;
    this.chart={width,height,left,right,top,bottom};
    const x=t=>left+Math.max(0,Math.min(this.data.duration,t))/Math.max(.001,this.data.duration)*(width-left-right),y=v=>top+(100-v)/100*(height-top-bottom);
    const chart=$('timeline');chart.setAttribute('viewBox',`0 0 ${width} ${height}`);chart.style.minWidth='480px';chart.replaceChildren();
    for(const value of [0,25,50,75,100]){chart.append(svg('line',{x1:left,x2:width-right,y1:y(value),y2:y(value),stroke:'#dfe7e8','stroke-dasharray':value===100?'':'3 5'}),svg('text',{x:left-10,y:y(value)+5,'text-anchor':'end',fill:'#64777b','font-size':13},`${value}%`));}
    for(let i=0;i<=6;i++){const time=this.data.duration*i/6;chart.append(svg('text',{x:x(time),y:height-20,'text-anchor':'middle',fill:'#64777b','font-size':13},`${time.toFixed(1)} s`));}
    if(this.data.interrupted&&this.data.endedAt<this.data.duration){const from=x(this.data.endedAt);chart.append(svg('rect',{x:from,y:top,width:width-right-from,height:height-top-bottom,fill:'#edf1f2','fill-opacity':.7}));}
    for(const [ci,c]of COMPONENTS.entries()){
      let d='',previous=null;
      for(const group of this.groups){const v=group.values[c.key];if(v===null){previous=null;continue;}const px=x(group.time),py=y(v);d+=`${previous?'L':'M'}${px},${py} `;previous=group;}
      chart.append(svg('path',{d,fill:'none',stroke:c.color,'stroke-width':2,'stroke-dasharray':['','7 4','2 4'][ci],'stroke-linecap':'round',opacity:.85}));
      // Small markers are only useful when the note density allows them.
      if(this.groups.length<240)for(const group of this.groups){const v=group.values[c.key];if(v!==null)chart.append(svg('circle',{cx:x(group.time),cy:y(v),r:2.4,fill:c.color}));}
    }
    for(const g of this.groups)if(g.points.some(p=>p.state==='missed')){const px=x(g.time);const mark=svg('path',{d:`M${px-3},${height-49}l6,6m-6,0l6,-6`,stroke:'#5f6e73','stroke-width':1.5});mark.append(svg('title',{},`Missed note at ${g.time.toFixed(2)} s`));chart.append(mark);}
    for(const e of this.data.extras){const px=x(e.onset),mark=svg('path',{d:`M${px},${height-41}l-4,7h8z`,fill:'#9a7654'});mark.append(svg('title',{},`Extra ${pitchName(e.pitch)} at ${e.onset.toFixed(2)} s`));chart.append(mark);}
    const cursor=svg('line',{id:'reviewCursor',x1:left,x2:left,y1:top,y2:height-bottom,stroke:'#293f4680','stroke-width':1,'stroke-dasharray':'3 4'});chart.append(cursor);
    chart.onpointermove=event=>{if(event.pointerType==='mouse')this.pickTime(event);};chart.onclick=event=>this.pickTime(event);
    this.moveCursor();
  }
  pickTime(event){
    const rect=$('timeline').getBoundingClientRect(),c=this.chart,px=(event.clientX-rect.left)*c.width/rect.width;
    const time=(px-c.left)/(c.width-c.left-c.right)*this.data.duration;
    let low=0,high=this.groups.length;while(low<high){const mid=(low+high)>>1;if(this.groups[mid].time<time)low=mid+1;else high=mid;}
    let index=Math.min(low,this.groups.length-1);if(index>0&&Math.abs(this.groups[index-1].time-time)<Math.abs(this.groups[index].time-time))index--;this.select(index);
  }
  moveCursor(){const g=this.groups?.[this.selected],c=this.chart,line=$('reviewCursor');if(!g||!c||!line)return;const x=c.left+g.time/Math.max(.001,this.data.duration)*(c.width-c.left-c.right);line.setAttribute('x1',x);line.setAttribute('x2',x);}
  select(index){
    if(!this.data||!this.groups.length)return;this.selected=Math.max(0,Math.min(this.groups.length-1,index));const group=this.groups[this.selected];
    $('reviewNote').value=this.selected;$('reviewPosition').textContent=`${group.time.toFixed(2)} s · ${group.points.map(p=>pitchName(p.pitch)).join(', ')}`;
    $('reviewNote').setAttribute('aria-valuetext',$('reviewPosition').textContent);const body=$('noteDetails');body.replaceChildren();
    for(const p of group.points){const row=document.createElement('tr');for(const value of [`${p.index+1} · ${pitchName(p.pitch)}`,...COMPONENTS.map(c=>deviationText(p,c.key))]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);}
    this.moveCursor();this.drawOverlay();
  }
  drawOverlay(){
    const layer=$('scoreOverlay');layer.replaceChildren();if(!this.data||!this.lesson||$('score').hidden)return;
    const page=$('scorePage'),img=$('score'),box=imageBox(page.clientWidth,page.clientHeight,img.naturalWidth,img.naturalHeight);if(!box)return;
    layer.setAttribute('viewBox',`0 0 ${page.clientWidth} ${page.clientHeight}`);
    const scale=box.width/794,chosen=COMPONENTS.filter(c=>$(`overlay-${c.key}`).checked);
    const positions=this.aligning?this.draft:this.positions,selectedNotes=new Set(this.groups[this.selected]?.points.map(p=>p.index)||[]);
    for(const pos of positions){
      const p=this.data.points[pos.index];if(!p)continue;const x=box.x+pos.x*box.width,y=box.y+pos.y*box.height;
      if(this.aligning){layer.append(svg('circle',{cx:x,cy:y,r:Math.max(3,7*scale),fill:'#276c7955',stroke:'#276c79','pointer-events':'none'}));continue;}
      if(!chosen.length||p.state==='not-reached')continue;
      const group=svg('g',{'data-index':p.index,tabindex:0,role:'button','aria-label':`Note ${p.index+1}, ${pitchName(p.pitch)}. ${chosen.map(c=>`${c.label}: ${deviationText(p,c.key)}`).join('. ')}`});
      group.append(svg('title',{},chosen.map(c=>`${c.label}: ${deviationText(p,c.key)}`).join('\n')));
      if(selectedNotes.has(p.index))group.append(svg('rect',{x:x-18*scale,y:y-12*scale,width:36*scale,height:40*scale,rx:5*scale,fill:'none',stroke:'#293f4666','stroke-width':1}));
      for(const c of chosen){const slot=COMPONENTS.indexOf(c),loss=1-p.values[c.key]/100,radius=Math.max(1.8,(3+6*loss)*scale);group.append(svg('circle',{cx:x+(slot-1)*16*scale,cy:y+19*scale,r:radius,fill:c.color,'fill-opacity':.2,stroke:c.color,'stroke-opacity':.3+.6*loss,'stroke-width':Math.max(.8,1.4*scale),'stroke-dasharray':p.state==='unreleased'&&c.key==='duration'?'2 2':''}));}
      if(p.state==='missed')group.append(svg('path',{d:`M${x-4*scale},${y-4*scale}l${8*scale},${8*scale}m${-8*scale},0l${8*scale},${-8*scale}`,stroke:'#475b63','stroke-width':1.3}));
      group.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.selectNote(p.index);}};layer.append(group);
    }
  }
  selectNote(index){const group=this.groups.findIndex(g=>g.points.some(p=>p.index===index));if(group>=0)this.select(group);}
  scoreClick(event){
    if(this.aligning){const page=$('scorePage'),rect=page.getBoundingClientRect(),img=$('score'),box=imageBox(page.clientWidth,page.clientHeight,img.naturalWidth,img.naturalHeight);if(!box)return;
      const x=(event.clientX-rect.left-box.x)/box.width,y=(event.clientY-rect.top-box.y)/box.height;if(x<0||x>1||y<0||y>1)return;
      const index=this.alignmentIndex();this.draft=this.draft.filter(p=>p.index!==index);this.draft.push({index,x,y});if(index<this.lesson.notes.length-1)$('alignIndex').value=index+2;this.alignmentStatus();this.drawOverlay();return;
    }
    const target=event.target.closest('[data-index]');if(target)this.selectNote(Number(target.getAttribute('data-index')));
  }
  alignmentIndex(){return Math.max(0,Math.min(this.lesson.notes.length-1,Math.trunc(Number($('alignIndex').value)||1)-1));}
  stepAlignment(delta){$('alignIndex').value=Math.max(1,Math.min(this.lesson.notes.length,this.alignmentIndex()+1+delta));this.alignmentStatus();}
  startAlignment(){if(!this.lesson)return;this.aligning=true;this.draft=this.positions.map(p=>({...p}));$('alignmentControls').hidden=false;$('alignIndex').max=this.lesson.notes.length;$('alignIndex').value=1;$('scoreOverlay').classList.add('aligning');this.alignmentStatus();this.drawOverlay();}
  alignmentStatus(){if(!this.aligning)return;const index=this.alignmentIndex(),n=this.lesson.notes[index];$('alignInstruction').textContent=`Click note ${index+1}: ${pitchName(n.pitch)} at ${n.onset.toFixed(2)} s in the reference. ${this.draft.length} / ${this.lesson.notes.length} aligned.`;}
  endAlignment(save){if(!this.aligning)return;if(save){this.positions=validPositions(this.draft,this.lesson.notes.length);try{localStorage.setItem(this.storageKey,JSON.stringify(this.positions));$('status').textContent='Score alignment saved in this browser.';}catch{$('status').textContent='Alignment works for this visit, but browser storage could not save it.';}}
    this.aligning=false;$('alignmentControls').hidden=true;$('scoreOverlay').classList.remove('aligning');this.refreshScore();
  }
}
