// Show the actual independent deployment capability boundary, including auth.
fetch('/api/status').then(r=>r.json()).then(status=>{
  if(status.mode!=='public-preview')return;
  const connection=document.getElementById('connection');
  if(connection){
    const update=()=>{
      if(connection.textContent.includes('Browsing preview'))return;
      connection.replaceChildren();
      const note=document.createElement('div');note.className='notice';
      note.textContent='Welcome preview · Sign-in and storage activation are required before feature access opens.';
      connection.append(note);
    };
    new MutationObserver(update).observe(connection,{childList:true});update();
  }
  const identity=document.getElementById('identityArea');
  if(identity){identity.textContent='Sign-in is not configured on this standalone preview. Features remain locked until account and storage services are activated.';identity.classList.add('notice');}
  const divider=document.querySelector('.auth-divider span');if(divider)divider.textContent='BROWSING PREVIEW';
}).catch(()=>{});
