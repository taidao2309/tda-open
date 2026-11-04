(function () {
  if (!window.SUPABASE_URL || !window.supabase) return;
  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const players = window.TDA_TOURNAMENT.players;

  let session = null;
  let voterId = null;
  let votedForId = null;

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
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) { show('s-no-session'); return; }
    session = data;

    if (data.result_announced) { await renderResults(); return; }

    renderIdentityList();
    show('s-identity');

    // Listen for session updates (announcement / end)
    sb.channel('vp_session_' + data.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'voting_sessions',
        filter: `id=eq.${data.id}`
      }, async payload => {
        session = { ...session, ...payload.new };
        if (payload.new.result_announced) {
          await renderResults();
        } else if (payload.new.status === 'ended') {
          show('s-ended');
        }
      })
      .subscribe();
  }

  // ---- step 1: identity ----

  function renderIdentityList() {
    const list = document.getElementById('identityList');
    list.innerHTML = '';
    players.forEach(p => list.appendChild(playerBtn(p, () => selectIdentity(p.id))));
  }

  async function selectIdentity(id) {
    voterId = id;

    // Check already voted
    const { data } = await sb.from('votes')
      .select('voted_for_id')
      .eq('session_id', session.id)
      .eq('voter_id', id)
      .maybeSingle();

    if (data) {
      const vf = byId(data.voted_for_id);
      document.getElementById('alreadyMsg').textContent = vf
        ? `Bạn đã bình chọn cho ${vf.name}.`
        : 'Bạn đã bình chọn trong phiên này.';
      show('s-already');
      return;
    }

    // Render vote list (exclude self)
    const p = byId(id);
    document.getElementById('identityBar').innerHTML =
      `Bình chọn với tư cách: <strong>${p.name}</strong> <span class="vpb-rank rank-pill rank-${p.rank}">${p.rank}</span>`;

    const list = document.getElementById('voteList');
    list.innerHTML = '';
    players.filter(pl => pl.id !== id).forEach(pl =>
      list.appendChild(playerBtn(pl, () => confirmStep(pl.id)))
    );

    show('s-vote');
  }

  // ---- step 2: confirm ----

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
      voter_id: voterId,
      voted_for_id: votedForId
    });

    if (error) {
      if (error.code === '23505') {
        document.getElementById('alreadyMsg').textContent = 'Bạn đã bình chọn trong phiên này.';
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

  // ---- results ----

  async function renderResults() {
    const { data: votes } = await sb.from('votes')
      .select('voted_for_id')
      .eq('session_id', session.id);

    const counts = {};
    (votes || []).forEach(v => { counts[v.voted_for_id] = (counts[v.voted_for_id] || 0) + 1; });
    const total = (votes || []).length;

    const sorted = players
      .map(p => ({ ...p, n: counts[p.id] || 0 }))
      .filter(p => p.n > 0)
      .sort((a, b) => b.n - a.n);

    document.getElementById('resultsDisplay').innerHTML = sorted.map((p, i) => `
      <div class="vr-row${i === 0 ? ' vr-top' : ''}">
        <span class="vr-pos">${i + 1}</span>
        <div class="vr-info">
          <span class="vr-name">${p.name}</span>
          <span class="vpb-rank rank-pill rank-${p.rank}">${p.rank}</span>
        </div>
        <div class="vr-bar-wrap">
          <div class="vr-bar" style="width:${total ? Math.round(p.n / total * 100) : 0}%"></div>
        </div>
        <span class="vr-count">${p.n}</span>
      </div>
    `).join('');

    show('s-results');
  }

  init();
})();
