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

    if (data.status === 'closed') { show('s-closed'); return; }

    // Check if this device already voted
    const { data: existing } = await sb.from('votes')
      .select('voted_for_id')
      .eq('session_id', session.id)
      .eq('voter_id', deviceId)
      .maybeSingle();

    if (existing) {
      const vf = byId(existing.voted_for_id);
      document.getElementById('alreadyMsg').textContent = vf
        ? `Bạn đã bình chọn cho ${vf.name}.`
        : 'Bạn đã ghi nhận phiếu bình chọn.';
      show('s-already');
      return;
    }

    // Render vote list (all players)
    const list = document.getElementById('voteList');
    list.innerHTML = '';
    players.forEach(p => list.appendChild(playerBtn(p, () => confirmStep(p.id))));
    show('s-vote');

    // Listen for session end
    sb.channel('vp_session_' + data.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'voting_sessions',
        filter: `id=eq.${data.id}`
      }, payload => {
        session = { ...session, ...payload.new };
        if (payload.new.status === 'closed') show('s-closed');
        else if (payload.new.status === 'ended') show('s-ended');
      })
      .subscribe();
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
