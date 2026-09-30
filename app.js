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
    const reserve=playerById(team.substituteId);
    return `<article class="team-card"><div class="team-id"><span>${team.id}</span><b>${team.name}</b></div><div class="team-members">${members.length?members.map(player=>`<p><span>${player.name}</span><i>Rank ${player.rank}</i></p>`).join(''):'<p class="waiting">Chưa chia cơ thủ</p>'}</div><div class="team-reserve"><small>Dự bị</small><span>${reserve?.name||'—'}</span></div></article>`;
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
const phases={group:'Vòng bảng · 20 trận',semifinal:'Bán kết · 2 trận',final:'Chung kết'};
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

const nav=document.querySelector('#nav'), shade=document.querySelector('.hero-shade'), menu=document.querySelector('.menu-btn');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

let counted=false;
function onScroll(){
  const y=window.scrollY; nav.classList.toggle('scrolled',y>40);
  const progress=Math.min(y/(window.innerHeight*.75),1); shade.style.clipPath=`inset(0 ${progress*52}% 0 0)`;
  if(!counted && document.querySelector('.stats').getBoundingClientRect().top<window.innerHeight*.85){
    counted=true; document.querySelectorAll('[data-count]').forEach(el=>{let n=0,target=+el.dataset.count;const step=()=>{n+=Math.max(1,Math.ceil(target/35));el.textContent=String(Math.min(n,target)).padStart(2,'0');if(n<target)requestAnimationFrame(step)};step()});
  }
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

const glow=document.querySelector('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'},{passive:true});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'none'}],{duration:700,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});observer.unobserve(entry.target)}}),{threshold:.1});
document.querySelectorAll('section:not(.hero):not(.ticker) h2,.format-steps article,.player-card,.match,.duel').forEach(el=>observer.observe(el));
