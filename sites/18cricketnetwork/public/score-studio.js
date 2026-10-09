import {matchDetails} from './match-setup.js';
import {scorer as classicScorer} from './cricket-experience.js';
import {calculateMatch} from './scoring-engine.js';
import {createMomentTracker} from './score-moments.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tracker=createMomentTracker();let timer,queue=[],active=false;
let motion=true;try{motion=localStorage.getItem('18-score-motion')!=='off'}catch{}
const field=()=>`<div class="score-field" aria-hidden="true"><div class="score-orbit orbit-one"></div><div class="score-orbit orbit-two"></div><div class="score-pitch"><i></i><b></b></div>${Array.from({length:7},(_,i)=>`<span class="field-dot dot-${i}"></span>`).join('')}<span class="field-label">18 / MATCH THEATRE</span></div>`;
export function scoreHero(m,v){const s=v.state;return `<div class="score-hero"><div class="score-hero-copy"><div class="score-channel"><span></span>18 NETWORK / MATCHDAY 2126</div><h2>${esc(m.teamA)} <em>vs</em> ${esc(m.teamB)}</h2><p>${esc(m.name)}${m.location?' · '+esc(m.location):''}</p><div class="score-primary"><span>${s.runs}<small>/${s.wickets}</small></span><div><b>${esc(s.team)}</b><small>${v.rules.key==='Hundred'?s.balls+' balls':s.overs+' overs'} · ${esc(v.result?'Complete':v.status)}</small></div></div><div class="score-telemetry"><div><small>RUN RATE</small><b>${s.rate.toFixed(2)}</b></div><div><small>${v.target?'REQUIRED RATE':'PARTNERSHIP'}</small><b>${v.target?v.requiredRate.toFixed(2):s.partnershipRuns}</b></div><div><small>${v.target?'TARGET':'FORMAT'}</small><b>${v.target?v.target:esc(v.rules.label)}</b></div></div></div>${field()}</div>`}
export function scorer(m,c){
  if(!m.proScoring)return classicScorer(m,c);
  const v=calculateMatch(m),ducks=Object.values(v.state.batters).filter(p=>p.status==='out'&&p.runs===0&&p.dismissal!=='timed_out'&&p.dismissal!=='retired_out');
  if(typeof document!=='undefined')queueMicrotask(()=>{if(document.querySelector('.future-score')?.dataset.match===m.id){const moments=tracker.observe(m);if(tracker.corrected)clearMoments();showMoments(moments);}});
  return `<section class="future-score" data-match="${esc(m.id)}">${scoreHero(m,v)}<div class="score-command-bar"><span>${c.own(m)?'SCORER COMMAND DECK':'SPECTATOR SCORECARD'} · RECORDED MATCH DATA</span><button type="button" data-score-motion aria-pressed="${motion}">Match animations: ${motion?'on':'off'}</button></div>${ducks.length?`<div class="score-annotations">${ducks.map(p=>`<span>DUCK · ${esc(p.name)} · 0 (${p.balls})</span>`).join('')}</div>`:''}${matchDetails(m,c)}${classicScorer(m,c)}</section>`;
}
export function showMoments(moments,preview=false){
  if(typeof document==='undefined'||document.visibilityState==='hidden')return;
  queue.push(...moments.map(m=>({...m,preview})));queue=queue.slice(-6);if(!active)playNext();
}
function playNext(){
  const m=queue.shift();if(!m){active=false;return}active=true;
  let box=document.querySelector('#scoreMoment');if(!box){box=document.createElement('section');box.id='scoreMoment';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.append(box)}
  const reduced=!motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  box.className=`score-moment moment-${m.kind}${reduced?' moment-static':''}`;
  box.innerHTML=`<button type="button" data-moment-dismiss aria-label="Dismiss match moment">×</button><small>${m.preview?'VISUAL PREVIEW · NOT A MATCH EVENT':'18 / RECORDED MATCH MOMENT'}</small><div class="moment-rings" aria-hidden="true"></div><div class="moment-emblem" aria-hidden="true">${esc(({four:'4',six:'6',wicket:'W',duck:'0',hattrick:'III',fivefor:'5',freehit:'↗'})[m.kind]||'✦')}</div><strong>${esc(m.title)}</strong><p>${esc(m.detail)}</p><span class="moment-line" aria-hidden="true"></span>`;
  box.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{box.hidden=true;playNext()},reduced?2500:2100);
}
export function clearMoments(){clearTimeout(timer);queue=[];active=false;const box=document.querySelector('#scoreMoment');if(box)box.hidden=true;}
if(typeof document!=='undefined'){
  document.addEventListener('click',ev=>{
    if(ev.target.closest('[data-moment-dismiss]'))clearMoments();
    const toggle=ev.target.closest('[data-score-motion]');if(toggle){motion=!motion;try{localStorage.setItem('18-score-motion',motion?'on':'off')}catch{}toggle.setAttribute('aria-pressed',String(motion));toggle.textContent='Match animations: '+(motion?'on':'off');clearMoments();}
    const sample=ev.target.closest('[data-score-preview]');if(sample){clearMoments();showMoments([{kind:sample.dataset.scorePreview,title:sample.textContent,detail:'Animation preview only. No score or player record is changed.'}],true);}
  });
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')clearMoments()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearMoments();tracker.reset()}});
  const watch=new MutationObserver(()=>{
    if(!document.querySelector('.future-score'))tracker.reset();
    const view=document.querySelector('#view');
    if(view&&document.querySelector('#crumb')?.textContent==='Match centre'&&!view.querySelector('.match-theatre-intro')){
      view.insertAdjacentHTML('afterbegin',`<section class="match-theatre-intro"><div><span class="score-channel">18 / MATCH THEATRE · 2126</span><h1>Every ball.<br><em>A bigger moment.</em></h1><p>Your match deserves a world-stage scorecard. Open a recorded match to score, follow the innings or send it to the big screen.</p><div class="score-preview-controls"><small>VISUAL EFFECT PREVIEW · NO MATCH DATA</small>${[['four','FOUR'],['six','SIX'],['wicket','WICKET'],['duck','DUCK'],['hattrick','HAT-TRICK'],['milestone','CENTURY']].map(([k,n])=>`<button data-score-preview="${k}">${n}</button>`).join('')}</div></div>${field()}</section>`);
    }
  });watch.observe(document.body,{childList:true,subtree:true});
}
