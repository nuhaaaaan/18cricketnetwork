import {scoreHero,showMoments,clearMoments} from './score-studio.js';
import {createMomentTracker} from './score-moments.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=new URLSearchParams(location.search).get('match'),connection=document.querySelector('#displayConnection'),tracker=createMomentTracker();let latest=0,busy=false;
document.querySelector('#ledFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{connection.textContent='Use your browser’s fullscreen control.'}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){tracker.reset();clearMoments()}});
async function refresh(){
  if(busy||document.hidden)return;
  if(!id){connection.textContent='Select a recorded match from Match centre → LED / fullscreen.';return}busy=true;
  try{
    const response=await fetch('/api/scorecard/'+encodeURIComponent(id),{cache:'no-store'}),m=await response.json();
    if(!response.ok)throw Error(m.error||'Sign in on this display device to view the match.');
    const v=m.score,s=v.state;
    document.querySelector('#ledScore').innerHTML=`<section class="future-score broadcast-score">${scoreHero(m,v)}<div class="score-command-bar"><span>LIVE DISPLAY · RECORDED SCORECARD</span><button data-score-motion>Toggle match animations</button></div><div class="led-situation">${esc(v.situation)}</div><div class="led-players">${[s.strikerId,s.nonStrikerId].filter(Boolean).map(id=>{const p=s.batters[id];return `<div><b>${esc(p.name)}${id===s.strikerId?' *':''}</b><strong>${p.runs}<small>(${p.balls})</small></strong></div>`}).join('')}${s.bowlerId?`<div><b>${esc(s.bowlers[s.bowlerId].name)}</b><strong>${s.bowlers[s.bowlerId].wickets}/${s.bowlers[s.bowlerId].runs}<small>(${s.bowlers[s.bowlerId].overs})</small></strong></div>`:''}</div></section>`;
    const moments=tracker.observe(m);if(tracker.corrected)clearMoments();showMoments(moments);
    latest=Date.now();connection.textContent='Connected · source version '+m.version+' · refreshes every 5 seconds';
    document.querySelector('#lastUpdated').textContent='Updated '+new Date(latest).toLocaleTimeString();
  }catch(error){connection.textContent='Connection interrupted · '+error.message;tracker.reset();if(latest)document.querySelector('#lastUpdated').textContent='Last received '+new Date(latest).toLocaleTimeString();}
  finally{busy=false;}
}
refresh();setInterval(refresh,5000);
