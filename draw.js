(function(){
  const players = window.TDA_TOURNAMENT.players;
  const RANK_VAL = {S:1, A:2, B:3, C:4, D:5, F:6};
  const NATURAL  = [['S','F'], ['A','D'], ['B','C']];
  let currentPairs = [], currentGroups = {A:[], B:[]}, currentSchedule = [];

  function shuffle(a){
    const b=[...a];
    for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]]}
    return b;
  }

  function buildPairs(pl){
    // Shuffle within each rank for randomness, then sort all players strongest→weakest
    const byR={};
    for(const p of pl){if(!byR[p.rank])byR[p.rank]=[];byR[p.rank].push(p)}
    for(const r in byR) byR[r]=shuffle(byR[r]);
    const sorted=['S','A','B','C','D','F'].flatMap(r=>byR[r]||[]);
    // Pair position 0 (strongest) with position N-1 (weakest), always
    const pairs=[];
    let lo=0, hi=sorted.length-1;
    while(lo<hi){pairs.push([sorted[lo],sorted[hi]]);lo++;hi--;}
    return shuffle(pairs);
  }

  function assignGroups(pairs){
    // Spread teams by strength, but randomly choose which group gets the extra team.
    const sorted=[...pairs].map((p,i)=>({i,p,str:p.reduce((s,x)=>s+RANK_VAL[x.rank],0)}))
      .sort((a,b)=>a.str-b.str);
    const G={A:[],B:[]};
    const firstGroup=Math.random()<.5?'A':'B';
    const secondGroup=firstGroup==='A'?'B':'A';
    sorted.forEach((t,i)=>G[i%2===0?firstGroup:secondGroup].push(t));
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

  const BALL_COLORS=['#f5c400','#1a70d8','#d82020','#7030c0','#e07020','#207820','#901818','#444','#f5c400','#1a70d8','#d82020'];

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
      if(n>=queue.length){ wrap.classList.add('done'); currentSchedule=generateSchedule(); return; }

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

  /* ── Round-robin schedule generator ── */
  function buildRoundRobin(teams){
    const arr=[...teams];
    if(arr.length%2!==0) arr.push(null); // bye slot
    const m=arr.length;
    const rotating=arr.slice(1);
    const rounds=[];
    for(let r=0;r<m-1;r++){
      const current=[arr[0],...rotating];
      const round=[];
      for(let i=0;i<m/2;i++){
        const h=current[i], a=current[m-1-i];
        if(h!==null && a!==null) round.push([h,a]);
      }
      rounds.push(round);
      rotating.unshift(rotating.pop()); // rotate: move last to front
    }
    return rounds;
  }

  function generateSchedule(){
    const roundsB=buildRoundRobin(currentGroups.B);
    const roundsA=buildRoundRobin(currentGroups.A);
    const fixtures=[];
    const nr=Math.max(roundsA.length,roundsB.length);
    for(let r=0;r<nr;r++){
      (roundsB[r]||[]).forEach(pair=>{
        fixtures.push({group:'B',
          home:'T'+String(pair[0].i+1).padStart(2,'0'),
          away:'T'+String(pair[1].i+1).padStart(2,'0'),
          scoreHome:null,scoreAway:null});
      });
      (roundsA[r]||[]).forEach(pair=>{
        fixtures.push({group:'A',
          home:'T'+String(pair[0].i+1).padStart(2,'0'),
          away:'T'+String(pair[1].i+1).padStart(2,'0'),
          scoreHome:null,scoreAway:null});
      });
    }
    const sessions=[];
    fixtures.forEach(match=>{
      let sessionIndex=sessions.findIndex(session=>session.length<4&&
        !session.some(game=>[game.home,game.away].some(team=>team===match.home||team===match.away)));
      if(sessionIndex<0){sessionIndex=sessions.length;sessions.push([])}
      sessions[sessionIndex].push(match);
    });
    return sessions.flatMap((session,roundIndex)=>session.map((match,tableIndex)=>(
      {...match,round:roundIndex+1,table:tableIndex+1}
    ))).map((match,index)=>({...match,no:index+1}));
  }

  /* ── Export tournament-data.js ── */
  function exportData(){
    const src=window.TDA_TOURNAMENT;
    const teams=currentPairs.map((pair,i)=>{
      const n=String(i+1).padStart(2,'0');
      let g='A';
      for(const [grp,arr] of Object.entries(currentGroups)){
        if(arr.some(t=>t.i===i)){g=grp;break;}
      }
      return{id:'T'+n,name:'Đội '+n,group:g,playerIds:pair.map(p=>p.id)};
    });
    const groupMatches=generateSchedule();

    function indent(obj,pad){
      return JSON.stringify(obj,null,2).split('\n').map((l,i)=>i?pad+l:l).join('\n');
    }

    const out=
`
window.TDA_TOURNAMENT = {
  settings: ${indent(src.settings,'  ')},

  players: ${indent(src.players,'  ')},

  teams: ${indent(teams,'  ')},

  matches: {
    group: ${indent(groupMatches,'    ')},
    semifinal: ${indent(src.matches.semifinal,'    ')},
    final: ${indent(src.matches.final,'    ')}
  }
};
`;
    const blob=new Blob([out],{type:'text/javascript'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='tournament-data.js';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Export Excel ── */
  function exportExcel(){
    const teamLabel=i=>`${String.fromCharCode(0x0110,0x1ed9,0x69)} ${String(i+1).padStart(2,'0')}`;
    const xmlEscape=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
    const cell=value=>value===''||value==null?'<Cell/>':`<Cell><Data ss:Type="${typeof value==='number'?'Number':'String'}">${xmlEscape(value)}</Data></Cell>`;
    const worksheet=(name,rows)=>`<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows.map(row=>`<Row>${row.map(cell).join('')}</Row>`).join('')}</Table></Worksheet>`;
    const groupA=currentGroups.A||[],groupB=currentGroups.B||[];
    const headers=['\u0110\u1ed9i','C\u01a1 th\u1ee7 1','H\u1ea1ng','C\u01a1 th\u1ee7 2','H\u1ea1ng'];
    const groupRows=[
      ['B\u1ea2NG A','','','','','','B\u1ea2NG B'],
      [...headers,'',...headers]
    ];
    const maxTeams=Math.max(groupA.length,groupB.length);
    for(let i=0;i<maxTeams;i++){
      const rowFor=t=>t?[teamLabel(t.i),t.p[0]?.name||'',t.p[0]?.rank||'',t.p[1]?.name||'',t.p[1]?.rank||'']:['','','','',''];
      groupRows.push([...rowFor(groupA[i]),'',...rowFor(groupB[i])]);
    }

    const rosterRows=[['\u0110\u1ed9i','B\u1ea3ng','C\u01a1 th\u1ee7 1','H\u1ea1ng','C\u01a1 th\u1ee7 2','H\u1ea1ng']];
    const groupForIndex=new Map(Object.entries(currentGroups).flatMap(([group,list])=>list.map(t=>[t.i,group])));
    currentPairs.forEach((pair,i)=>rosterRows.push([teamLabel(i),groupForIndex.get(i)||'',pair[0]?.name||'',pair[0]?.rank||'',pair[1]?.name||'',pair[1]?.rank||'']));

    const matchRows=[['Tr\u1eadn','V\u00f2ng','B\u1ea3ng','B\u00e0n','\u0110\u1ed9i nh\u00e0','\u0110\u1ed9i kh\u00e1ch','T\u1ec9 s\u1ed1 nh\u00e0','T\u1ec9 s\u1ed1 kh\u00e1ch']];
    currentSchedule.forEach(m=>matchRows.push([m.no,m.round,m.group,m.table,teamLabel(parseInt(m.home.slice(1),10)-1),teamLabel(parseInt(m.away.slice(1),10)-1),'','']));

    const workbook=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheet('Groups',groupRows)}${worksheet('Teams',rosterRows)}${worksheet('Schedule',matchRows)}</Workbook>`;
    const blob=new Blob([workbook],{type:'application/vnd.ms-excel;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='tda-open-2026.xls';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Schedule preview ── */
  function renderSchedulePreview(){
    const preview=document.querySelector('#drawSchedulePreview');
    const btn=document.querySelector('#drawPreviewBtn');
    if(!preview) return;

    const isHidden=preview.hasAttribute('hidden');
    if(!isHidden){ preview.setAttribute('hidden',''); if(btn) btn.textContent='Preview lịch đấu'; return; }

    preview.removeAttribute('hidden');
    if(btn) btn.textContent='Ẩn lịch đấu';
    if(preview.dataset.rendered) return; // already built
    preview.dataset.rendered='1';

    const RANK_COLOR={S:'#c8f536',A:'#ffd166',B:'#67d5ff',C:'#66e0b5',D:'#c3a6ff',F:'#ff9c7a'};

    function teamCell(tid){
      const idx=parseInt(tid.slice(1),10)-1;
      const pair=currentPairs[idx]||[];
      return `<div class="sp-team"><span class="sp-tid">Đội ${tid.slice(1)}</span><div class="sp-players">${
        pair.map(p=>`<span class="sp-player"><b class="sp-rank" style="background:${RANK_COLOR[p.rank]||'#888'};color:#07110d">${p.rank}</b>${p.name}</span>`).join('')
      }</div></div>`;
    }

    let html='<div class="sp-wrap">';
    const scheduleRounds=[];
    currentSchedule.forEach((match,index)=>{
      const roundNo=match.round||Math.floor(index/4)+1;
      (scheduleRounds[roundNo-1]||(scheduleRounds[roundNo-1]=[])).push(match);
    });
    scheduleRounds.forEach((round,index)=>{
      html+=`<div class="sp-round"><div class="sp-round-label">Vòng ${index+1}</div>`;
      round.forEach(m=>{
        const ga=m.group==='A';
        html+=`<div class="sp-match sp-g-${m.group.toLowerCase()}">
          <span class="sp-no">${String(m.no).padStart(2,'0')}</span>
          <span class="sp-table">Bàn ${m.table}</span>
          <span class="sp-gbadge" style="color:${ga?'var(--acid)':'#67d5ff'}">${m.group}</span>
          ${teamCell(m.home)}
          <span class="sp-vs">VS</span>
          ${teamCell(m.away)}
        </div>`;
      });
      html+='</div>';
    });
    html+='</div>';
    preview.innerHTML=html;
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
  const exportBtn=document.querySelector('#drawExportBtn');
  if(exportBtn) exportBtn.addEventListener('click', exportData);
  const excelBtn=document.querySelector('#drawExcelBtn');
  if(excelBtn) excelBtn.addEventListener('click', exportExcel);
  const previewBtn=document.querySelector('#drawPreviewBtn');
  if(previewBtn) previewBtn.addEventListener('click', renderSchedulePreview);
})();
