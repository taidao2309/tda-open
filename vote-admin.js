(function () {
  const ADMIN_PASSWORD = '1';

  if (!window.SUPABASE_URL || !window.supabase) {
    document.getElementById('vaLoading').innerHTML =
      '<p style="color:rgba(255,255,255,.4)">Chưa cấu hình Supabase.</p>';
    return;
  }

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const players = window.TDA_TOURNAMENT.players;
  const screen = document.getElementById('vaScreen');
  const voteUrl = window.location.origin + '/vote.html';

  let resultsVisible = false;
  let currentSession = null;
  let votesCache = [];

  // ---- password modal ----

  function askPassword(title, callback) {
    const overlay = document.getElementById('pwOverlay');
    const input = document.getElementById('pwInput');
    const error = document.getElementById('pwError');
    document.getElementById('pwTitle').textContent = title;

    overlay.hidden = false;
    input.value = '';
    error.textContent = '';
    setTimeout(() => input.focus(), 50);

    function tryConfirm() {
      if (input.value === ADMIN_PASSWORD) {
        overlay.hidden = true;
        callback();
      } else {
        error.textContent = 'Mật khẩu không đúng.';
        input.select();
      }
    }

    document.getElementById('pwOk').onclick = tryConfirm;
    document.getElementById('pwCancel').onclick = () => { overlay.hidden = true; };
    input.onkeydown = e => { if (e.key === 'Enter') tryConfirm(); };
  }

  // ---- data ----

  async function getSession() {
    const { data } = await sb.from('voting_sessions')
      .select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data;
  }

  async function getVotes(sessionId) {
    const { data } = await sb.from('votes')
      .select('voted_for_id').eq('session_id', sessionId);
    return data || [];
  }

  // ---- build results HTML ----

  function buildResultsHtml(votes) {
    const counts = {};
    votes.forEach(v => { counts[v.voted_for_id] = (counts[v.voted_for_id] || 0) + 1; });
    const total = votes.length;
    const withVotes = players
      .map(p => ({ ...p, n: counts[p.id] || 0 }))
      .filter(p => p.n > 0)
      .sort((a, b) => b.n - a.n);

    return {
      total,
      html: withVotes.length === 0
        ? '<p class="va-no-votes">Chưa có phiếu nào</p>'
        : withVotes.map((p, i) => `
            <div class="va-row${i === 0 ? ' va-row-top' : ''}">
              <span class="va-pos">${i + 1}</span>
              <span class="va-pname">${p.name}</span>
              <span class="va-prank rank-pill rank-${p.rank}">${p.rank}</span>
              <div class="va-bar-w"><div class="va-bar" style="width:${total ? Math.round(p.n / total * 100) : 0}%"></div></div>
              <span class="va-pcount">${p.n}</span>
            </div>`).join('')
    };
  }

  // ---- fast update: chỉ update count + results, không rebuild QR ----

  function updateCountAndResults(votes) {
    votesCache = votes;
    const { total, html } = buildResultsHtml(votes);

    const totalEl = document.getElementById('vaVoteTotal');
    if (totalEl) totalEl.textContent = `${total} phiếu`;

    const hdEl = document.getElementById('vaResultsHd');
    if (hdEl) hdEl.textContent = `KẾT QUẢ BÌNH CHỌN (${total} phiếu)`;

    const listEl = document.getElementById('vaResultsList');
    if (listEl) listEl.innerHTML = html;
  }

  // ---- render empty ----

  function renderEmpty(prevEnded) {
    currentSession = null;
    screen.innerHTML = `
      <div class="va-state">
        <div class="va-create-box">
          <div class="va-create-icon">🗳️</div>
          <h2>Bình chọn cơ thủ ấn tượng</h2>
          <p>${prevEnded ? 'Phiên trước đã kết thúc.' : 'Chưa có phiên bình chọn nào.'} Tạo phiên mới để hiển thị QR cho cơ thủ.</p>
          <button class="va-create-btn" id="btnCreate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Tạo phiên & gen QR
          </button>
        </div>
      </div>`;

    document.getElementById('btnCreate').addEventListener('click', async () => {
      document.getElementById('btnCreate').disabled = true;
      const { data } = await sb.from('voting_sessions')
        .insert({ status: 'open' }).select().single();
      if (data) render();
    });
  }

  // ---- render active (full rebuild — chỉ gọi khi session thay đổi) ----

  function renderActive(session, votes) {
    currentSession = session;
    votesCache = votes;
    const { total, html: resultsHtml } = buildResultsHtml(votes);
    const isOpen   = session.status === 'open';
    const isClosed = session.status === 'closed';
    const isActive = isOpen || isClosed;

    const badgeClass = isOpen ? 'va-open' : isClosed ? 'va-closed' : 'va-ended';
    const badgeLabel = isOpen ? 'ĐANG MỞ'  : isClosed ? 'ĐÃ ĐÓNG VOTE' : 'ĐÃ KẾT THÚC';

    screen.innerHTML = `
      <div class="va-active">
        <p class="va-eyebrow">TDA Open 2026 · Bình chọn</p>
        <div class="va-status-row">
          <span class="va-badge ${badgeClass}">${badgeLabel}</span>
          <span class="va-vote-total" id="vaVoteTotal">${total} phiếu</span>
        </div>
        <div class="va-qr-block">
          <span class="va-qr-label">${isOpen ? 'QUÉT ĐỂ BÌNH CHỌN' : 'ĐÃ ĐÓNG NHẬN PHIẾU'}</span>
          <div id="vaQR"></div>
          <p class="va-url">${voteUrl}</p>
        </div>
        <div class="va-actions">
          ${isActive ? `<button class="va-btn va-btn-primary" id="btnAnnounce">${resultsVisible ? '🙈 Ẩn kết quả' : '📢 Xem kết quả'}</button>` : ''}
          ${isOpen   ? '<button class="va-btn va-btn-warning" id="btnClose">🔒 Đóng bình chọn</button>' : ''}
          ${isClosed ? '<button class="va-btn va-btn-ghost"   id="btnReopen">🔓 Mở lại</button>'       : ''}
          ${isActive
            ? '<button class="va-btn va-btn-danger" id="btnEnd">Kết thúc phiên</button>'
            : '<button class="va-btn va-btn-ghost"  id="btnNew">+ Tạo phiên mới</button>'}
        </div>
        <div class="va-results-wrap" id="vaResultsWrap" style="display:none">
          <div class="va-results-hd" id="vaResultsHd">KẾT QUẢ BÌNH CHỌN (${total} phiếu)</div>
          <div class="va-results" id="vaResultsList">${resultsHtml}</div>
        </div>
      </div>`;

    if (resultsVisible) {
      document.getElementById('vaResultsWrap').style.display = '';
    }

    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById('vaQR'), {
        text: voteUrl,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    document.getElementById('btnAnnounce')?.addEventListener('click', () => {
      if (resultsVisible) {
        resultsVisible = false;
        document.getElementById('vaResultsWrap').style.display = 'none';
        document.getElementById('btnAnnounce').innerHTML = '📢 Xem kết quả';
      } else {
        askPassword('📢 Xem kết quả (admin)', () => {
          resultsVisible = true;
          document.getElementById('vaResultsWrap').style.display = '';
          document.getElementById('btnAnnounce').innerHTML = '🙈 Ẩn kết quả';
        });
      }
    });

    document.getElementById('btnClose')?.addEventListener('click', () => {
      askPassword('🔒 Đóng bình chọn', async () => {
        const { error } = await sb.from('voting_sessions').update({ status: 'closed' }).eq('id', session.id);
        if (error) { alert('Lỗi: ' + error.message); return; }
        render();
      });
    });

    document.getElementById('btnReopen')?.addEventListener('click', async () => {
      await sb.from('voting_sessions').update({ status: 'open' }).eq('id', session.id);
      render();
    });

    document.getElementById('btnEnd')?.addEventListener('click', () => {
      askPassword('⚠️ Kết thúc phiên', async () => {
        const { error } = await sb.from('voting_sessions').update({ status: 'ended' }).eq('id', session.id);
        if (error) { alert('Lỗi: ' + error.message); return; }
        resultsVisible = false;
        render();
      });
    });

    document.getElementById('btnNew')?.addEventListener('click', async () => {
      const { data } = await sb.from('voting_sessions')
        .insert({ status: 'open' }).select().single();
      if (data) { resultsVisible = false; render(); }
    });
  }

  // ---- main render (full — gọi khi load hoặc session thay đổi) ----

  async function render() {
    const session = await getSession();
    if (!session || session.status === 'ended') {
      renderEmpty(!!session && session.status === 'ended');
      return;
    }
    const votes = await getVotes(session.id);
    renderActive(session, votes);
  }

  // ---- realtime ----

  sb.channel('va_admin_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' },
      async payload => {
        // Có vote mới: chỉ fetch votes rồi update UI tại chỗ, không rebuild trang
        if (!currentSession) return;
        const votes = await getVotes(currentSession.id);
        updateCountAndResults(votes);
      }
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voting_sessions' },
      () => render()  // Session thay đổi (kết thúc...) → rebuild toàn bộ
    )
    .subscribe();

  render();

  // Fallback polling mỗi 3s — chỉ update count + results, không rebuild QR
  setInterval(async () => {
    if (!currentSession) return;
    const votes = await getVotes(currentSession.id);
    updateCountAndResults(votes);
  }, 3000);
})();
