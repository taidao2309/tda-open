(function () {
  if (!window.SUPABASE_URL || !window.supabase) return;
  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const players = window.TDA_TOURNAMENT.players;

  let session = null;
  let votedForId = null;

  // ---- device ID (localStorage) ----

  function getDeviceId() {
    const key = 'tda_voter_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }

  const deviceId = getDeviceId();

  // ---- helpers ----

  function show(id) {
    document.querySelectorAll('.vp-step').forEach(el => el.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    window.scrollTo(0, 0);
  }

  function byId(id) { return players.find(p => p.id === id); }

  function playerBtn(p, onClick) {
    const btn = document.createElement('button');
    btn.className = 'vp-player-btn';
    btn.innerHTML = `<span class="vpb-name">${p.name}</span><span class="vpb-rank rank-pill rank-${p.rank}">${p.rank}</span>`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ---- init ----

  async function init() {
    if (window.SUPABASE_URL.includes('YOUR_')) { show('s-no-session'); return; }

    const { data, error } = await sb.from('voting_sessions')
      .select('*')
      .in('status', ['open', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) { show('s-no-session'); return; }
    session = data;

    // Check if this device already voted (ưu tiên trước khi check closed)
    const { data: existing } = await sb.from('votes')
      .select('voted_for_id')
      .eq('session_id', session.id)
      .eq('voter_id', deviceId)
      .maybeSingle();

    // Render vote list helper
    function showVoteList() {
      const list = document.getElementById('voteList');
      list.innerHTML = '';
      players.forEach(p => list.appendChild(playerBtn(p, () => confirmStep(p.id))));
      show('s-vote');
    }

    // Setup realtime TRƯỚC mọi early return — để bắt cả open lại
    sb.channel('vp_session_' + data.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'voting_sessions',
        filter: `id=eq.${data.id}`
      }, payload => {
        session = { ...session, ...payload.new };
        const st = payload.new.status;
        if (st === 'ended') { show('s-ended'); return; }
        if (st === 'closed') { show('s-closed'); return; }
        if (st === 'open') {
          // Mở lại: nếu chưa vote thì hiện list, đã vote thì giữ nguyên
          if (!existing) showVoteList();
        }
      })
      .subscribe();

    if (existing) {
      const vf = byId(existing.voted_for_id);
      document.getElementById('alreadyMsg').textContent = vf
        ? `Bạn đã bình chọn cho ${vf.name}.`
        : 'Bạn đã ghi nhận phiếu bình chọn.';
      show('s-already');
      return;
    }

    // Chưa vote mà phiên đã đóng → không cho vote nữa
    if (data.status === 'closed') { show('s-closed'); return; }

    showVoteList();
  }

  // ---- confirm step ----

  function confirmStep(id) {
    votedForId = id;
    const p = byId(id);
    document.getElementById('confirmName').innerHTML =
      `<strong>${p.name}</strong> <span class="vpb-rank rank-pill rank-${p.rank}">${p.rank}</span>`;
    show('s-confirm');
  }

  document.getElementById('btnBack').addEventListener('click', () => show('s-vote'));

  document.getElementById('btnConfirm').addEventListener('click', async () => {
    show('s-sending');
    const { error } = await sb.from('votes').insert({
      session_id: session.id,
      voter_id: deviceId,
      voted_for_id: votedForId
    });

    if (error) {
      if (error.code === '23505') {
        show('s-already');
      } else {
        alert('Lỗi khi gửi phiếu, vui lòng thử lại.');
        show('s-vote');
      }
      return;
    }

    const p = byId(votedForId);
    document.getElementById('successName').innerHTML =
      `<strong>${p.name}</strong> <span class="vpb-rank rank-pill rank-${p.rank}">${p.rank}</span>`;
    show('s-success');
  });

  init();
})();
