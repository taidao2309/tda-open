// referee.js — Referee admin page logic
// Depends on: supabase (CDN global), window.TDA_TOURNAMENT, window.SUPABASE_URL, window.SUPABASE_ANON_KEY, window.REFEREE_PASSWORD

// Dismiss keyboard when tapping outside any input
document.addEventListener('touchstart', e => {
  if (!e.target.matches('input, button')) document.activeElement?.blur();
}, { passive: true });

const { createClient } = supabase;
let sb;
const t = window.TDA_TOURNAMENT;
const teams = t.teams;
const players = t.players;
const allMatches = t.matches;

function teamPlayersHtml(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return '';
  return team.playerIds
    .map(pid => players.find(p => p.id === pid)?.name || '')
    .filter(Boolean)
    .map(escHtml)
    .join('<br>');
}

// --- Login ---
const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const pwInput = document.getElementById('passwordInput');
const loginErr = document.getElementById('loginError');

document.getElementById('loginBtn').addEventListener('click', tryLogin);
pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

function tryLogin() {
  if (pwInput.value === window.REFEREE_PASSWORD) {
    localStorage.setItem('ref_auth', '1');
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    initAdmin();
  } else {
    loginErr.textContent = 'Mật khẩu không đúng';
    pwInput.select();
  }
}

// Auto-login nếu đã xác thực trước đó
if (localStorage.getItem('ref_auth') === '1') {
  loginScreen.style.display = 'none';
  adminScreen.style.display = 'block';
  initAdmin();
}

// --- Admin init ---
async function initAdmin() {
  sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  setSync('connecting', 'Đang kết nối...');

  const { data: scores, error } = await sb.from('match_scores').select('*');
  if (error) {
    setSync('error', 'Lỗi kết nối');
    return;
  }

  const scoreMap = buildScoreMap(scores);
  renderAdmin(scoreMap);
  setSync('ok', 'Đã kết nối');
  document.getElementById('saveAllBtn').addEventListener('click', saveAll);

  sb.channel('referee_sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, payload => {
      const { phase, match_no, score_home, score_away } = payload.new;
      const key = `${phase}_${match_no}`;
      const card = document.querySelector(`[data-key="${key}"]`);
      if (!card) return;
      const homeInp = card.querySelector('[data-side="home"]');
      const awayInp = card.querySelector('[data-side="away"]');
      if (score_home !== null && score_home !== undefined) {
        homeInp.value = score_home;
        homeInp.classList.add('has-value');
      }
      if (score_away !== null && score_away !== undefined) {
        awayInp.value = score_away;
        awayInp.classList.add('has-value');
      }
      markSaved(card, score_home !== null && score_away !== null);
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setSync('ok', 'Realtime ●');
    });
}

function buildScoreMap(scores) {
  const map = {};
  scores?.forEach(s => { map[`${s.phase}_${s.match_no}`] = s; });
  return map;
}

function setSync(state, text) {
  const el = document.getElementById('syncStatus');
  el.className = 'sync-status ' + state;
  document.getElementById('syncText').textContent = text;
}

// --- Render ---
function teamName(id) {
  return teams.find(team => team.id === id)?.name || id;
}

function renderAdmin(scoreMap) {
  const container = document.getElementById('matchAdmin');
  let html = '';

  // Group stage — grouped by round
  html += '<div class="phase-section">';
  html += '<div class="phase-title">VÒNG BẢNG</div>';
  const rounds = [...new Set(allMatches.group.map(m => m.round))].sort((a, b) => a - b);
  rounds.forEach(round => {
    html += `<div class="round-label">Vòng ${round}</div>`;
    allMatches.group.filter(m => m.round === round).forEach(m => {
      html += matchCard(
        'group', m,
        teamName(m.home), teamName(m.away),
        `V${m.round} · Bảng ${m.group} · Bàn ${String(m.table).padStart(2, '0')}`,
        scoreMap[`group_${m.no}`],
        m.home, m.away
      );
    });
  });
  html += '</div>';

  // Semifinal
  html += '<div class="phase-section">';
  html += '<div class="phase-title">BÁN KẾT</div>';
  allMatches.semifinal.forEach(m => {
    html += matchCard(
      'semifinal', m,
      m.home, m.away,
      `Bàn ${String(m.table).padStart(2, '0')}`,
      scoreMap[`semifinal_${m.no}`]
    );
  });
  html += '</div>';

  // Final
  html += '<div class="phase-section">';
  html += '<div class="phase-title">CHUNG KẾT</div>';
  allMatches.final.forEach(m => {
    html += matchCard(
      'final', m,
      m.home, m.away,
      `Bàn ${String(m.table).padStart(2, '0')}`,
      scoreMap[`final_${m.no}`]
    );
  });
  html += '</div>';

  container.innerHTML = html;

  container.querySelectorAll('.match-card').forEach(card => {
    card.querySelector('.save-btn').addEventListener('click', () => {
      saveScore(card, card.dataset.phase, parseInt(card.dataset.no, 10));
    });

    card.querySelectorAll('.score-input').forEach(inp => {
      inp.addEventListener('input', () => {
        inp.classList.toggle('has-value', inp.value !== '');
      });
    });
  });
}

function matchCard(phase, m, homeName, awayName, meta, score, homeId, awayId) {
  const key = `${phase}_${m.no}`;
  const isSaved = score && score.score_home !== null && score.score_away !== null;
  const homeVal = isSaved ? score.score_home : '';
  const awayVal = isSaved ? score.score_away : '';
  const label = phase === 'group'
    ? `TRẬN ${String(m.no).padStart(2, '0')}`
    : phase === 'semifinal' ? `BÁN KẾT ${m.no}` : 'CHUNG KẾT';

  const escHome = escHtml(homeName);
  const escAway = escHtml(awayName);
  const escMeta = escHtml(meta);
  const escLabel = escHtml(label);
  const homePlayers = homeId ? teamPlayersHtml(homeId) : '';
  const awayPlayers = awayId ? teamPlayersHtml(awayId) : '';

  return `<div class="match-card${isSaved ? ' is-saved' : ''}" data-key="${key}" data-phase="${phase}" data-no="${m.no}">
  <div class="card-header">
    <span class="match-label">${escLabel}</span>
    <span class="card-meta">${escMeta}</span>
    <button class="save-btn">LƯU</button>
  </div>
  <div class="teams-row">
    <div class="team-col">
      <span class="team-name">${escHome}</span>${homePlayers ? `<span class="team-players">${homePlayers}</span>` : ''}
    </div>
    <span class="vs-sep">vs</span>
    <div class="team-col away">
      <span class="team-name">${escAway}</span>${awayPlayers ? `<span class="team-players">${awayPlayers}</span>` : ''}
    </div>
  </div>
  <div class="score-row">
    <input type="number" class="score-input${homeVal !== '' ? ' has-value' : ''}" data-side="home" value="${homeVal}" min="0" max="9" placeholder="—" inputmode="numeric">
    <span class="score-dash">—</span>
    <input type="number" class="score-input${awayVal !== '' ? ' has-value' : ''}" data-side="away" value="${awayVal}" min="0" max="9" placeholder="—" inputmode="numeric">
  </div>
</div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Save single ---
async function saveScore(card, phase, matchNo) {
  const btn = card.querySelector('.save-btn');
  const homeVal = card.querySelector('[data-side="home"]').value;
  const awayVal = card.querySelector('[data-side="away"]').value;

  const row = {
    phase,
    match_no: matchNo,
    score_home: homeVal !== '' ? parseInt(homeVal, 10) : null,
    score_away: awayVal !== '' ? parseInt(awayVal, 10) : null,
  };

  btn.disabled = true;
  btn.textContent = '...';

  try {
    const { error } = await sb.from('match_scores').upsert(row, { onConflict: 'phase,match_no' });
    if (error) throw error;
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = 'LƯU'; }, 1500);
    markSaved(card, row.score_home !== null && row.score_away !== null);
  } catch (e) {
    console.error('saveScore error:', e.message || e);
    btn.textContent = '✗';
    setTimeout(() => { btn.textContent = 'LƯU'; }, 2500);
  } finally {
    btn.disabled = false;
  }
}


// --- Save all ---
async function saveAll() {
  const btn = document.getElementById('saveAllBtn');
  const rows = [];

  document.querySelectorAll('.match-card').forEach(card => {
    const homeVal = card.querySelector('[data-side="home"]').value;
    const awayVal = card.querySelector('[data-side="away"]').value;
    rows.push({
      phase: card.dataset.phase,
      match_no: parseInt(card.dataset.no, 10),
      score_home: homeVal !== '' ? parseInt(homeVal, 10) : null,
      score_away: awayVal !== '' ? parseInt(awayVal, 10) : null,
    });
  });

  btn.disabled = true;
  btn.textContent = 'ĐANG LƯU...';

  try {
    const { error } = await sb.from('match_scores').upsert(rows, { onConflict: 'phase,match_no' });
    if (error) throw error;
    rows.forEach(r => {
      const card = document.querySelector(`[data-phase="${r.phase}"][data-no="${r.match_no}"]`);
      if (card) markSaved(card, r.score_home !== null && r.score_away !== null);
    });
    btn.textContent = `✓ ĐÃ LƯU ${rows.length} TRẬN`;
    setTimeout(() => { btn.textContent = 'LƯU TẤT CẢ'; }, 2500);
  } catch (e) {
    console.error('saveAll error:', e.message || e);
    btn.textContent = '✗ LỖI — THỬ LẠI';
    setTimeout(() => { btn.textContent = 'LƯU TẤT CẢ'; }, 3000);
  } finally {
    btn.disabled = false;
  }
}

function markSaved(card, saved) {
  card.classList.toggle('is-saved', saved);
}
