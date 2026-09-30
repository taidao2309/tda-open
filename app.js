const tournament = window.TDA_TOURNAMENT;
const players = tournament.players;
const teams = tournament.teams;
const matches = tournament.matches;

const grid = document.querySelector('#playerGrid');
const filters = document.querySelector('#teamFilters');
const search = document.querySelector('#playerSearch');
const count = document.querySelector('#playerCount');
let activeRank = 'all';

function renderPlayers(){
  const query = search.value.trim().toLowerCase();
  const result = players.filter(p => (activeRank === 'all' || p.rank === activeRank) && (`${p.name} ${p.rank}`).toLowerCase().includes(query));
  count.textContent = `${result.length} vận động viên`;
  grid.innerHTML = result.length ? result.map((p,i)=>`<article class="player-card" data-rank="${p.rank}"><span class="num">${String(players.indexOf(p)+1).padStart(2,'0')}</span><span class="rank-badge">RANK ${p.rank}</span><h3>${p.name}</h3></article>`).join('') : '<p class="empty">Không tìm thấy vận động viên phù hợp.</p>';
}

['S','A','B','C','D','F'].forEach(rank => filters.insertAdjacentHTML('beforeend', `<button data-rank="${rank}">Rank ${rank}</button>`));
filters.addEventListener('click', e => { if(!e.target.matches('button')) return; activeRank=e.target.dataset.rank; filters.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===e.target)); renderPlayers(); });
search.addEventListener('input',renderPlayers); renderPlayers();

const teamList=document.querySelector('#teamList'), standingRows=document.querySelector('#standingRows'), standingGroup=document.querySelector('#standingGroup'), groupSwitch=document.querySelector('#groupSwitch');
const playerById=id=>players.find(player=>player.id===id);
const teamById=id=>teams.find(team=>team.id===id);
function teamLabel(value){ return teamById(value)?.name || value; }
function renderGroup(group){
  groupSwitch.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.group===group));
  standingGroup.textContent=group;
  const groupTeams=teams.filter(team=>team.group===group);
  teamList.innerHTML=groupTeams.map(team=>{
    const members=team.playerIds.map(playerById).filter(Boolean);
    return `<article class="team-card"><div class="team-id"><span>${team.id}</span><b>${team.name}</b></div><div class="team-members">${members.length?members.map(player=>`<p><span>${player.name}</span><i>Rank ${player.rank}</i></p>`).join(''):'<p class="waiting">Chưa chia cơ thủ</p>'}</div></article>`;
  }).join('');
  const stats=groupTeams.map(team=>({team,played:0,won:0,lost:0,points:0}));
  matches.group.filter(match=>match.group===group && Number.isFinite(match.scoreHome) && Number.isFinite(match.scoreAway)).forEach(match=>{
    const home=stats.find(row=>row.team.id===match.home), away=stats.find(row=>row.team.id===match.away);
    if(!home||!away)return; home.played++;away.played++;
    if(match.scoreHome>match.scoreAway){home.won++;home.points++;away.lost++;}else if(match.scoreAway>match.scoreHome){away.won++;away.points++;home.lost++;}
  });
  stats.sort((a,b)=>b.points-a.points||b.won-a.won||a.team.name.localeCompare(b.team.name,'vi'));
  standingRows.innerHTML=stats.map((row,index)=>`<div class="standing-row ${index<2?'qualified':''}"><span><i>${index+1}</i>${row.team.name}</span><span>${row.played}</span><span>${row.won}</span><span>${row.lost}</span><b>${row.points}</b></div>`).join('');
}
groupSwitch.addEventListener('click',event=>{if(event.target.matches('button'))renderGroup(event.target.dataset.group)});renderGroup('A');

const tabs=document.querySelector('#dateTabs'), list=document.querySelector('#matchList');
const phases={group:'Vòng bảng (20)',semifinal:'Bán kết (2)',final:'Chung kết'};
function renderMatches(phase){
  tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.phase===phase));
  list.innerHTML=matches[phase].map(m=>{
    const played=Number.isFinite(m.scoreHome)&&Number.isFinite(m.scoreAway);
    const score=played?`${m.scoreHome} — ${m.scoreAway}`:'—';
    const meta=phase==='group'?`Bảng ${m.group} · Bàn ${String(m.table).padStart(2,'0')}`:`Bàn ${String(m.table).padStart(2,'0')}`;
    return `<article class="match"><span class="match-index"><small>Trận</small>${String(m.no).padStart(2,'0')}</span><span class="team">${teamLabel(m.home)}</span><span class="score ${played?'played':''}">${score}</span><span class="team away">${teamLabel(m.away)}</span><span class="table">${meta}</span></article>`;
  }).join('');
}
Object.keys(phases).forEach((phase,i)=>tabs.insertAdjacentHTML('beforeend',`<button data-phase="${phase}" class="${i?'':'active'}">${phases[phase]}</button>`));
tabs.addEventListener('click',e=>{if(e.target.matches('button'))renderMatches(e.target.dataset.phase)}); renderMatches('group');

const bracketBoard=document.querySelector('#bracketBoard');
const bracketName=value=>teamLabel(value)||'Chưa xác định';
const bracketScore=value=>Number.isFinite(value)?value:'—';
function renderBracket(){
  const semifinals=matches.semifinal||[],finalMatch=(matches.final||[])[0];
  const semifinalHtml=semifinals.length?semifinals.map(match=>`<div class="duel"><p><b>${bracketName(match.home)}</b><span>${bracketScore(match.scoreHome)}</span></p><p><b>${bracketName(match.away)}</b><span>${bracketScore(match.scoreAway)}</span></p></div>`).join(''):'<div class="duel"><p><b>Chưa xác định</b><span>—</span></p></div>';
  const finalHtml=finalMatch?`<div class="duel featured"><p><b>${bracketName(finalMatch.home)}</b><span>${bracketScore(finalMatch.scoreHome)}</span></p><p><b>${bracketName(finalMatch.away)}</b><span>${bracketScore(finalMatch.scoreAway)}</span></p><small>Bàn ${String(finalMatch.table||1).padStart(2,'0')} · Chưa thi đấu</small></div>`:'<div class="duel featured"><p><b>Chưa xác định</b><span>—</span></p></div>';
  let champion='Chưa xác định';
  if(finalMatch&&Number.isFinite(finalMatch.scoreHome)&&Number.isFinite(finalMatch.scoreAway)&&finalMatch.scoreHome!==finalMatch.scoreAway){champion=bracketName(finalMatch.scoreHome>finalMatch.scoreAway?finalMatch.home:finalMatch.away)}
  bracketBoard.innerHTML=`<div class="round"><h3>BÁN KẾT <span>01</span></h3>${semifinalHtml}</div><div class="round final-round"><h3>CHUNG KẾT <span>02</span></h3>${finalHtml}</div><div class="champion"><span>NHÀ VÔ ĐỊCH</span><div class="trophy">♛</div><h3>${champion==='Chưa xác định'?'CHƯA<br>XÁC ĐỊNH':champion}</h3></div>`;
}
renderBracket();

const nav=document.querySelector('#nav'), shade=document.querySelector('.hero-shade'), menu=document.querySelector('.menu-btn');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

let counted=false,motionTarget=window.scrollY;
function onScroll(){
  const y=window.scrollY; nav.classList.toggle('scrolled',y>40);motionTarget=y;
  if(!counted && document.querySelector('.stats').getBoundingClientRect().top<window.innerHeight*.85){
    counted=true; document.querySelectorAll('[data-count]').forEach(el=>{let n=0,target=+el.dataset.count;const step=()=>{n+=Math.max(1,Math.ceil(target/35));el.textContent=String(Math.min(n,target)).padStart(2,'0');if(n<target)requestAnimationFrame(step)};step()});
  }
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

// One requestAnimationFrame loop owns every scroll-linked transform to avoid layout thrashing.
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroPhoto=document.querySelector('.hero-photo'), heroContent=document.querySelector('.hero-content');
const orbitOne=document.querySelector('.orbit-one'), orbitTwo=document.querySelector('.orbit-two');
const heroTitle=document.querySelector('.hero h1 span'), heroYear=document.querySelector('.hero h1 strong');
const motionGuide=document.querySelector('.motion-guide'), guideBall=document.querySelector('.guide-ball');
let motionCurrent=window.scrollY,rafActive=false;
function renderMotion(){
  motionCurrent+=(motionTarget-motionCurrent)*.13;
  const vh=window.innerHeight,doc=Math.max(document.documentElement.scrollHeight-vh,1);
  const heroP=Math.min(Math.max(motionCurrent/(vh*.92),0),1);
  if(!reduceMotion&&window.innerWidth>900){
    heroTitle.style.transform=`translate3d(${heroP*-18}px,0,0)`;
    heroYear.style.transform=`translate3d(${heroP*24}px,0,0)`;
    orbitOne.style.transform=`translate3d(${heroP*22}px,${heroP*-15}px,0) rotate(${heroP*12}deg)`;
    orbitTwo.style.transform=`translate3d(${heroP*-16}px,${heroP*10}px,0) rotate(${heroP*-9}deg)`;
    shade.style.opacity=String(1-heroP*.2);
    const progress=Math.min(Math.max((motionCurrent-vh*.72)/(doc-vh*.9),0),1);
    const show=progress>0&&progress<.97;
    motionGuide.classList.toggle('visible',show);
    if(show){
      const x=(.88-0.76*progress+Math.sin(progress*Math.PI*3)*.15)*window.innerWidth;
      const y=(.08+.82*progress)*vh;
      guideBall.style.transform=`translate3d(${x-21}px,${y-21}px,0) rotate(${progress*1260}deg)`;
    }
  }
  rafActive=false;
  if(Math.abs(motionTarget-motionCurrent)>.15)requestMotion();
}
function requestMotion(){if(!rafActive){rafActive=true;requestAnimationFrame(renderMotion)}}
window.addEventListener('scroll',requestMotion,{passive:true});window.addEventListener('resize',requestMotion,{passive:true});requestMotion();

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:0,transform:'translate3d(0,26px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:720,delay:Math.min(+(entry.target.dataset.motionIndex||0)*45,270),easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});entry.target.classList.add('motion-in');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -5%'});
document.querySelectorAll('section:not(.hero):not(.ticker) h2,.format-steps article,.player-card,.team-card,.match,.duel,.bracket-board').forEach((el,index)=>{el.dataset.motionIndex=index%6;observer.observe(el)});
