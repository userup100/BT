// Minimal accessible tabs: top tabs toggle their panels.
(function(){
  const tablist = document.querySelector('.tablist');
  if(!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  function activateTab(tab){
    // tabs
    tabs.forEach(t => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true':'false');
      t.tabIndex = t === tab ? 0 : -1;
    });
    // panels
    panels.forEach(p => {
      const active = p.id === tab.getAttribute('aria-controls');
      p.toggleAttribute('hidden', !active);
      p.classList.toggle('is-active', active);
    });
  }

  tablist.addEventListener('click', (e)=>{
    const btn = e.target.closest('[role="tab"]');
    if(!btn) return;
    activateTab(btn);
  });

  // Keyboard support: ArrowLeft/ArrowRight
  tablist.addEventListener('keydown', (e)=>{
    const idx = tabs.findIndex(t => t.classList.contains('is-active'));
    if(e.key === 'ArrowRight'){
      const next = tabs[(idx+1) % tabs.length];
      next.focus(); activateTab(next);
    } else if(e.key === 'ArrowLeft'){
      const prev = tabs[(idx-1+tabs.length) % tabs.length];
      prev.focus(); activateTab(prev);
    }
  });
})();
