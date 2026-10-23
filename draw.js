(function(){
  const players = window.TDA_TOURNAMENT.players;
  const RANK_VAL = {S:1, A:2, B:3, C:4, D:5, F:6};
  const NATURAL  = [['S','F'], ['A','D'], ['B','C']];
  let currentPairs = [], currentGroups = {A:[], B:[]};

  function shuffle(a){
    const b=[...a];
    for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]]}
    return b;
  }

  function buildPairs(pl){
    const byR={};
    for(const p of pl){if(!byR[p.rank])byR[p.rank]=[];byR[p.rank].push(p)}
    for(const r in byR) byR[r]=shuffle(byR[r]);
    const used=new Set(), pairs=[];
    for(const[hi,lo]of NATURAL){
      const hp=(byR[hi]||[]).filter(p=>!used.has(p.id));
      const lp=(byR[lo]||[]).filter(p=>!used.has(p.id));
      const n=Math.min(hp.length,lp.length);
      for(let i=0;i<n;i++){pairs.push([hp[i],lp[i]]);used.add(hp[i].id);used.add(lp[i].id)}
    }
    // Pair leftover players: highest rank vs lowest rank
    const left=pl.filter(p=>!used.has(p.id)).sort((a,b)=>RANK_VAL[a.rank]-RANK_VAL[b.rank]);
    let l=0, r=left.length-1;
    while(l<r){pairs.push([left[l],left[r]]);l++;r--}
    return shuffle(pairs);
  }

  function assignGroups(pairs){
    // Sort by combined strength (stronger teams first), snake-draft A/B
    const sorted=[...pairs].map((p,i)=>({i,p,str:p.reduce((s,x)=>s+RANK_VAL[x.rank],0)}))
      .sort((a,b)=>a.str-b.str);
    const G={A:[],B:[]};
    sorted.forEach((t,i)=>G[i%2===0?'A':'B'].push(t));
    return G;
  }

  /* ── Slot machine animation ── */
  function spinSlot(nameEl, rankEl, allPl, final, dur, onDone){
    const t0=performance.now(); let last=0;
    function tick(now){
      const prog=Math.min((now-t0)/dur, 1);
      const interval=60+prog*prog*900;
      if(now-last>=interval){
        last=now;
        const r=allPl[0|Math.random()*allPl.length];
        nameEl.textContent=r.name;
        rankEl.textContent='RANK '+r.rank;
        rankEl.className='draw-slot-rank rank-color-'+r.rank;
      }
      if(prog<1){ requestAnimationFrame(tick); }
      else{
        nameEl.textContent=final.name;
        rankEl.textContent='RANK '+final.rank;
        rankEl.className='draw-slot-rank rank-color-'+final.rank;
        if(onDone) onDone();
      }
    }
    requestAnimationFrame(tick);
  }

  function revealCard(card, pair, onDone){
    card.classList.add('visible','drawing');
    const s1=card.querySelector('.slot-1'), s2=card.querySelector('.slot-2');
    s1.classList.add('spinning'); s2.classList.add('spinning');
    spinSlot(s1.querySelector('.draw-slot-name'), s1.querySelector('.draw-slot-rank'), players, pair[0], 1250, ()=>{
      s1.classList.remove('spinning'); s1.classList.add('locked');
    });
    spinSlot(s2.querySelector('.draw-slot-name'), s2.querySelector('.draw-slot-rank'), players, pair[1], 1800, ()=>{
      s2.classList.remove('spinning'); s2.classList.add('locked');
      setTimeout(()=>{
        card.classList.remove('drawing');
        card.classList.add('revealed','just-revealed');
        setTimeout(()=>card.classList.remove('just-revealed'), 900);
        if(onDone) onDone();
      }, 280);
    });
  }

  const BALL_COLORS=['#f5c400','#1a70d8','#d82020','#7030c0','#e07020','#207820','#901818','#444','#f5c400','#1a70d8'];

  function makeCard(idx){
    const el=document.createElement('div');
    el.className='draw-team-card';
    el.style.setProperty('--card-color', BALL_COLORS[idx]||'rgba(200,245,54,.5)');
    const n=String(idx+1).padStart(2,'0');
    el.innerHTML=
      `<div class="draw-card-header">
        <div class="draw-card-id">
          <div class="draw-ball" data-ball="${idx+1}"><span>${n}</span></div>
          <span class="draw-card-name">Đội ${n}</span>
        </div>
        <span class="draw-card-group-badge"></span>
      </div>
      <div class="draw-slots">
        <div class="draw-slot slot-1">
          <span class="draw-slot-rank">RANK ?</span>
          <span class="draw-slot-name">—</span>
        </div>
        <span class="draw-vs">VS</span>
        <div class="draw-slot slot-2">
          <span class="draw-slot-rank">RANK ?</span>
          <span class="draw-slot-name">—</span>
        </div>
      </div>`;
    return el;
  }

  /* ── Render player chips on intro ── */
  function renderChips(){
    const el=document.querySelector('#drawChips');
    if(!el) return;
    el.innerHTML=shuffle(players)
      .map(p=>`<span class="draw-chip"><span class="draw-chip-rank rank-color-${p.rank}">${p.rank}</span>${p.name}</span>`)
      .join('');
  }

  /* ── STEP 1: Start draw ── */
  function startDraw(){
    currentPairs  = buildPairs(players);
    currentGroups = assignGroups(currentPairs);

    const intro   = document.querySelector('#drawIntro');
    const arena   = document.querySelector('#drawArena');
    const badge  = document.querySelector('#drawLiveBadge');
    const dotsEl = document.querySelector('#drawDots');
    const grid   = document.querySelector('#drawGrid');
    const total  = currentPairs.length;

    intro.classList.add('fade-out');
    setTimeout(()=>{ intro.style.display='none'; arena.removeAttribute('hidden'); }, 460);

    // Build dot indicators
    dotsEl.innerHTML=Array.from({length:total},(_,i)=>`<span class="draw-dot" data-dot="${i}"></span>`).join('');

    grid.innerHTML='';
    const cards=currentPairs.map((_,i)=>{ const c=makeCard(i); grid.appendChild(c); return c; });
    badge.classList.add('pulsing');

    let done=0;
    function next(){
      if(done>=cards.length){
        badge.classList.remove('pulsing');
        badge.classList.add('done');
        badge.textContent='✓ BƯỚC 1 HOÀN THÀNH';
        dotsEl.querySelectorAll('.draw-dot').forEach(d=>d.classList.add('all-done'));
        setTimeout(showStep2Zone, 700);
        return;
      }
      const idx=done++;
      const dot=dotsEl.querySelector(`[data-dot="${idx}"]`);
      if(dot){ dot.classList.add('active'); }
      revealCard(cards[idx], currentPairs[idx], ()=>{
        if(dot){ dot.classList.remove('active'); dot.classList.add('filled'); }
        setTimeout(next, 380);
      });
    }
    setTimeout(next, 680);
  }

  /* ── Show "Chia bảng" button after all teams drawn ── */
  function showStep2Zone(){
    const zone  = document.querySelector('#drawStep2Zone');
    const count = document.querySelector('#drawStep2Count');
    if(count) count.textContent=`${currentPairs.length} / ${currentPairs.length}`;
    zone.removeAttribute('hidden');
    setTimeout(()=>zone.scrollIntoView({behavior:'smooth', block:'start'}), 80);
  }

  let groupRunId=0;
  function setGroupCount(g,n){
    const list=document.querySelector(g==='A'?'#drawGroupAList':'#drawGroupBList');
    const el=list&&list.closest('.draw-group').querySelector('.draw-group-count');
    if(el) el.textContent=`${n} / ${currentGroups[g].length} đội`;
  }

  /* ── STEP 2: Assign groups and reveal ── */
  function showGroups(){
    const step2Zone = document.querySelector('#drawStep2Zone');
    const wrap      = document.querySelector('#drawGroupsWrap');
    const listA     = document.querySelector('#drawGroupAList');
    const listB     = document.querySelector('#drawGroupBList');

    // Disable the step 2 button
    const btn=document.querySelector('#drawStep2Btn');
    if(btn){ btn.disabled=true; btn.style.opacity='.4'; btn.style.cursor='default'; }

    step2Zone.style.opacity='0.4';
    wrap.removeAttribute('hidden');
    listA.innerHTML=''; listB.innerHTML='';

    const allCards=document.querySelectorAll('.draw-team-card');
    const lists={A:listA,B:listB};

    // Build interleaved queue WITHOUT pre-rendering rows — rows are created on-demand to avoid leaking results
    const queue=[];
    ['A','B'].forEach(g=>setGroupCount(g,0));
    const longest=Math.max(currentGroups.A.length, currentGroups.B.length);
    for(let k=0;k<longest;k++) ['A','B'].forEach(g=>{ if(currentGroups[g][k]) queue.push({t:currentGroups[g][k],g}); });

    const runId=++groupRunId;
    const shown={A:0,B:0};
    const alive=()=>runId===groupRunId;
    const SPIN_MS=1600, HOLD_MS=1050;

    function revealNext(n){
      if(!alive()) return;
      if(n>=queue.length){ wrap.classList.add('done'); return; }

      const {t,g}=queue[n];
      const isLast=n===queue.length-1;

      // Create row only now — nothing was pre-rendered, so no data leaks while waiting
      const el=document.createElement('div');
      el.className='draw-group-team drawing g-'+g.toLowerCase();
      el.innerHTML=
        `<div class="draw-group-team-no">
          <span class="draw-gteam-word">ĐỘI</span>
          <span class="draw-group-idx">??</span>
        </div>
        <div class="draw-group-players">
          ${t.p.map(()=>`<span class="draw-group-player">
            <span class="draw-group-player-rank">?</span>
            <span class="draw-group-player-name">—</span>
          </span>`).join('')}
        </div>`;
      lists[g].appendChild(el);

      const idxEl=el.querySelector('.draw-group-idx');
      const finalIdx=String(t.i+1).padStart(2,'0');
      const playerEls=[...el.querySelectorAll('.draw-group-player')];
      const rankEls=playerEls.map(p=>p.querySelector('.draw-group-player-rank'));
      const nameEls=playerEls.map(p=>p.querySelector('.draw-group-player-name'));
      const dur=isLast?SPIN_MS+900:SPIN_MS;

      // Let entrance animation play (300ms), then start slot machine
      setTimeout(()=>{
        if(!alive()) return;
        const t0=performance.now(); let last=0;
        (function roll(now){
          if(!alive()) return;
          const prog=Math.min((now-t0)/dur,1);
          if(now-last>=60+prog*prog*380){
            last=now;
            const ri=0|Math.random()*currentPairs.length;
            const rp=currentPairs[ri];
            idxEl.textContent=String(ri+1).padStart(2,'0');
            nameEls.forEach((nEl,i)=>{
              const p=rp[i]||rp[0];
              rankEls[i].textContent=p.rank;
              rankEls[i].className='draw-group-player-rank rank-color-'+p.rank;
              nEl.textContent=p.name;
            });
          }
          if(prog<1){ requestAnimationFrame(roll); return; }

          // Landing: restore correct final values
          idxEl.textContent=finalIdx;
          t.p.forEach((p,i)=>{
            if(nameEls[i]) nameEls[i].textContent=p.name;
            if(rankEls[i]){ rankEls[i].textContent=p.rank; rankEls[i].className='draw-group-player-rank rank-color-'+p.rank; }
          });
          el.classList.remove('drawing');
          el.classList.add('slide-in','landed');
          shown[g]++;
          setGroupCount(g,shown[g]);

          const card=allCards[t.i];
          if(card){
            card.classList.add('group-'+g.toLowerCase());
            card.querySelector('.draw-card-group-badge').textContent='Bảng '+g;
          }

          setTimeout(()=>{ if(alive()) revealNext(n+1); }, HOLD_MS);
        })(performance.now());
      }, 300);
    }

    setTimeout(()=>revealNext(0), 900);
  }

  /* ── Reset to intro ── */
  function resetDraw(){
    const intro     = document.querySelector('#drawIntro');
    const arena     = document.querySelector('#drawArena');
    const step2Zone = document.querySelector('#drawStep2Zone');
    const wrap      = document.querySelector('#drawGroupsWrap');
    const badge  = document.querySelector('#drawLiveBadge');
    const dotsEl = document.querySelector('#drawDots');
    const grid   = document.querySelector('#drawGrid');
    const btn       = document.querySelector('#drawStep2Btn');

    groupRunId++;
    wrap.classList.remove('done');
    wrap.setAttribute('hidden','');
    step2Zone.setAttribute('hidden','');
    arena.setAttribute('hidden','');
    grid.innerHTML='';
    dotsEl.innerHTML='';
    badge.classList.remove('pulsing','done');
    badge.textContent='🎲 ĐANG BỐC THĂM';
    if(btn){ btn.disabled=false; btn.style.opacity=''; btn.style.cursor=''; }

    intro.style.display='';
    intro.offsetHeight; // force reflow
    intro.classList.remove('fade-out');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  /* ── Init ── */
  renderChips();
  const startBtn = document.querySelector('#drawStartBtn');
  const step2Btn = document.querySelector('#drawStep2Btn');
  const resetBtn = document.querySelector('#drawResetBtn');
  if(startBtn) startBtn.addEventListener('click', startDraw);
  if(step2Btn) step2Btn.addEventListener('click', showGroups);
  if(resetBtn) resetBtn.addEventListener('click', resetDraw);
})();
