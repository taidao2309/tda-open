(function () {
  const ADMIN_PASSWORD = '123456';

  if (!window.SUPABASE_URL || !window.supabase) {
    document.getElementById('vaLoading').innerHTML =
      '<p style="color:rgba(255,255,255,.4)">Chưa cấu hình Supabase.</p>';
    return;
  }

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const players = window.TDA_TOURNAMENT.players;
  const screen = document.getElementById('vaScreen');
  const voteUrl = window.location.origin + '/vote.html';

  // Trạng thái ẩn/hiện kết quả — chỉ local, không lưu DB
  let resultsVisible = false;

  // ---- password modal ----

  function askPassword(callback) {
    const overlay = document.getElementById('pwOverlay');
    const input = document.getElementById('pwInput');
    const error = document.getElementById('pwError');

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

  // ---- render empty ----

  function renderEmpty(prevEnded) {
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

  // ---- render active ----

  function renderActive(session, votes) {
    const counts = {};
    votes.forEach(v => { counts[v.voted_for_id] = (counts[v.voted_for_id] || 0) + 1; });
    const total = votes.length;

    const sorted = players
      .map(p => ({ ...p, n: counts[p.id] || 0 }))
      .sort((a, b) => b.n - a.n);
    const withVotes = sorted.filter(p => p.n > 0);

    const resultsHtml = withVotes.length === 0
      ? '<p class="va-no-votes">Chưa có phiếu nào</p>'
      : withVotes.map((p, i) => `
          <div class="va-row${i === 0 ? ' va-row-top' : ''}">
            <span class="va-pos">${i + 1}</span>
            <span class="va-pname">${p.name}</span>
            <span class="va-prank rank-pill rank-${p.rank}">${p.rank}</span>
            <div class="va-bar-w"><div class="va-bar" style="width:${total ? Math.round(p.n / total * 100) : 0}%"></div></div>
            <span class="va-pcount">${p.n}</span>
          </div>`).join('');

    const isOpen = session.status === 'open';
    const btnAnnounceLabel = resultsVisible ? '🙈 Ẩn kết quả' : '📢 Xem kết quả';

    screen.innerHTML = `
      <div class="va-active">
        <p class="va-eyebrow">TDA Open 2026 · Bình chọn</p>
        <div class="va-status-row">
          <span class="va-badge ${isOpen ? 'va-open' : 'va-ended'}">${isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</span>
          <span class="va-vote-total">${total} / ${players.length} phiếu</span>
        </div>
        <div class="va-qr-block">
          <span class="va-qr-label">QUÉT ĐỂ BÌNH CHỌN</span>
          <div id="vaQR"></div>
          <p class="va-url">${voteUrl}</p>
        </div>
        <div class="va-actions">
          ${isOpen ? `<button class="va-btn va-btn-primary" id="btnAnnounce">${btnAnnounceLabel}</button>` : ''}
          ${isOpen
            ? '<button class="va-btn va-btn-danger" id="btnEnd">Kết thúc phiên</button>'
            : '<button class="va-btn va-btn-ghost" id="btnNew">+ Tạo phiên mới</button>'}
        </div>
        <div class="va-results-wrap" id="vaResultsWrap" style="display:none">
          <div class="va-results-hd">KẾT QUẢ BÌNH CHỌN (${total} phiếu)</div>
          <div class="va-results">${resultsHtml}</div>
        </div>
      </div>`;

    // Khôi phục trạng thái ẩn/hiện sau mỗi lần re-render
    if (resultsVisible) {
      document.getElementById('vaResultsWrap').style.display = '';
    }

    // Generate QR
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

    // Toggle ẩn/hiện kết quả — lần đầu hỏi mật khẩu, sau đó toggle tự do
    document.getElementById('btnAnnounce')?.addEventListener('click', () => {
      if (resultsVisible) {
        // Đang hiện → ẩn đi (không cần password)
        resultsVisible = false;
        document.getElementById('vaResultsWrap').style.display = 'none';
        document.getElementById('btnAnnounce').innerHTML = '📢 Xem kết quả';
      } else {
        // Đang ẩn → hỏi password rồi hiện
        askPassword(() => {
          resultsVisible = true;
          document.getElementById('vaResultsWrap').style.display = '';
          document.getElementById('btnAnnounce').innerHTML = '🙈 Ẩn kết quả';
        });
      }
    });

    document.getElementById('btnEnd')?.addEventListener('click', () => {
      askPassword(async () => {
        await sb.from('voting_sessions').update({ status: 'ended' }).eq('id', session.id);
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

  // ---- main render ----

  async function render() {
    const session = await getSession();

    if (!session || session.status === 'ended') {
      renderEmpty(!!session);
      return;
    }

    const votes = await getVotes(session.id);
    renderActive(session, votes);
  }

  // ---- realtime ----

  sb.channel('va_admin_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, render)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voting_sessions' }, render)
    .subscribe();

  render();
  setInterval(render, 15000);
})();
