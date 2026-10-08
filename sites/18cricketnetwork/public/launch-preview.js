// Show the actual independent deployment capability boundary, including auth.
fetch('/api/status').then(r=>r.json()).then(status=>{
  if(status.mode!=='public-preview')return;
  const connection=document.getElementById('connection');
  if(connection){
    const update=()=>{
      if(connection.textContent.includes('Browsing preview'))return;
      connection.replaceChildren();
      const note=document.createElement('div');note.className='notice';
      note.textContent='Browsing preview · Explore features and researched venues. Registration, bookings, orders and uploads will open after account and storage services are connected.';
      connection.append(note);
    };
    new MutationObserver(update).observe(connection,{childList:true});update();
  }
  const identity=document.getElementById('identityArea');
  if(identity){identity.textContent='Registration is not open on this preview. You can explore roles below and browse the network.';identity.classList.add('notice');}
  const divider=document.querySelector('.auth-divider span');if(divider)divider.textContent='BROWSING PREVIEW';
}).catch(()=>{});
