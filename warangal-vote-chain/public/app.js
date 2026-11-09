/* Warangal Vote Chain - front end */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const PARTY = {
  INC: { c: '#2f7f9e', n: 'Indian National Congress' },
  BJP: { c: '#e08a2e', n: 'Bharatiya Janata Party' },
  BRS: { c: '#c2467a', n: 'Bharat Rashtra Samithi' }
};
const badge = (p) => `<span class="party"><i style="background:${PARTY[p].c}"></i>${esc(p)}</span>`;
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  info: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
};

let token = sessionStorage.getItem('token');
let me = null, info = null, constituencies = [], allCands = [];
let view = 'candidates', authMode = 'login', pickLoc = null, profileId = null;

async function api(path, body) {
  const r = await fetch('/api/' + path, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function confirmModal({ title, text, cand, ok }) {
  return new Promise((resolve) => {
    const m = $('#modal');
    m.innerHTML = `<div class="mbox"><h2>${esc(title)}</h2><p>${esc(text)}</p>
      ${cand ? `<div class="mpick"><div class="avatar" style="width:46px;height:46px;font-size:16px">${esc(initials(cand.name))}</div><div><b>${esc(cand.name)}</b>${badge(cand.party)}</div></div>` : ''}
      <div class="mrow"><button class="btn ghost" id="mno">Cancel</button><button class="btn" id="myes">${esc(ok)}</button></div></div>`;
    m.hidden = false;
    const close = (v) => { m.hidden = true; resolve(v); };
    $('#mno').onclick = () => close(false); $('#myes').onclick = () => close(true);
    m.onclick = (e) => { if (e.target === m) close(false); };
  });
}

async function boot() {
  info = await api('info');
  constituencies = await api('constituencies');
  allCands = await api('candidates');
  pickLoc = constituencies[0];
  $('#datebar').innerHTML = `<span>Today: <b>${esc(info.today)}</b></span><span>Polling date: <b>${esc(info.pollingDate)}</b></span><span>Result date: <b>${esc(info.resultDate)}</b></span>`;
  if (token) { try { me = await api('me'); pickLoc = me.constituency; } catch { token = null; sessionStorage.removeItem('token'); } }
  render();
}

function render() {
  $('#userbox').innerHTML = me
    ? `<div class="chip"><div class="av">${esc(initials(me.name))}</div><span class="n">${esc(me.name)}</span></div><button class="btn ghost" id="logout">Log out</button>` : '';
  if (me) $('#logout').onclick = async () => {
    try { await api('logout', {}); } catch {}
    token = null; me = null; sessionStorage.removeItem('token'); authMode = 'login'; render(); window.scrollTo(0, 0);
  };
  me ? renderApp() : renderAuth();
}

/* ---------------- auth / landing ---------------- */
function renderAuth() {
  const login = authMode === 'login';
  $('#app').innerHTML = `
  <section class="hero"><div class="wrap hero-in">
    <div>
      <span class="pill">Blockchain powered voting</span>
      <h1>Your vote. <em>Verified.</em><br>Permanent.</h1>
      <p class="lead">A secure digital ballot for Warangal West and Warangal East. Meet the leaders, cast one vote, and see it sealed on a tamper-proof ledger.</p>
      <div class="stats"><div><b>2</b><span>Locations</span></div><div><b>6</b><span>Leaders</span></div><div><b>3</b><span>Parties</span></div></div>
      <div class="chainviz"><div class="blk">#0</div><div class="ln"></div><div class="blk">#1</div><div class="ln"></div><div class="blk">#2</div><div class="ln"></div><div class="blk">#3</div></div>
    </div>
    <div class="auth-card">
      <h2>${login ? 'Welcome back' : 'Create your voter account'}</h2>
      <p class="sub">${login ? 'Log in with your Voter ID to continue.' : 'Register once. You must be 18 or older.'}</p>
      <form id="f" novalidate>
        ${login ? '' : `<div class="two"><div><label for="name">Full name</label><input id="name" autocomplete="name" placeholder="Your full name"></div>
          <div><label for="age">Age</label><input id="age" type="number" min="1" max="120" placeholder="18+"></div></div>
          <label for="loc">Your location</label><select id="loc">${constituencies.map((c) => `<option>${esc(c)}</option>`).join('')}</select>`}
        <label for="vid">Voter ID</label><input id="vid" placeholder="e.g. ABC1234567" autocomplete="username">
        <label for="pw">Password</label><input id="pw" type="password" placeholder="${login ? 'Your password' : 'At least 6 characters'}" autocomplete="${login ? 'current-password' : 'new-password'}">
        <label class="show"><input type="checkbox" id="sp"> Show password</label>
        <button class="btn block" type="submit">${login ? 'Log in' : 'Create account'}</button>
        <div class="msg" id="msg"></div>
      </form>
      <p class="switch">${login ? 'New voter?' : 'Already registered?'} <button class="link" id="sw">${login ? 'Create an account' : 'Log in'}</button></p>
    </div>
  </div></section>
  <section class="how wrap">
    <h2>How it works</h2><p class="sub">Three simple steps from registration to a verified vote.</p>
    <div class="steps">
      <div class="step"><div class="ic">${ICON.user}</div><h3>Register</h3><p>Sign up with your Voter ID and choose Warangal West or Warangal East as your location.</p></div>
      <div class="step"><div class="ic">${ICON.list}</div><h3>Know your leaders</h3><p>Open each leader's profile to see their party, serving period and work for the area.</p></div>
      <div class="step"><div class="ic">${ICON.lock}</div><h3>Vote securely</h3><p>Your vote becomes a mined block on the chain. It cannot be changed or repeated.</p></div>
    </div>
  </section>`;
  $('#sw').onclick = () => { authMode = login ? 'signup' : 'login'; renderAuth(); };
  $('#sp').onchange = (e) => { $('#pw').type = e.target.checked ? 'text' : 'password'; };
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const msg = $('#msg'); msg.className = 'msg'; msg.textContent = '';
    const btn = $('#f .btn'); btn.disabled = true;
    try {
      if (login) {
        const d = await api('login', { voterId: $('#vid').value, password: $('#pw').value });
        token = d.token; sessionStorage.setItem('token', token);
        me = await api('me'); pickLoc = me.constituency; view = 'candidates'; render(); window.scrollTo(0, 0);
        toast('Welcome, ' + me.name.split(' ')[0]);
      } else {
        await api('signup', { name: $('#name').value, age: $('#age').value, constituency: $('#loc').value, voterId: $('#vid').value, password: $('#pw').value });
        authMode = 'login'; renderAuth(); toast('Registration complete. Please log in.');
      }
    } catch (err) { msg.className = 'msg err'; msg.textContent = err.message; btn.disabled = false; }
  };
}

/* ---------------- app shell ---------------- */
function renderApp() {
  const tabs = [['candidates', 'Leaders'], ['vote', 'Vote'], ['results', 'Results'], ['chain', 'Blockchain']];
  const active = view === 'profile' ? 'candidates' : view;
  $('#app').innerHTML = `
  <div class="banner"><div class="wrap banner-in">
    <div><small>Welcome back</small><h1>${esc(me.name)}</h1><p>${esc(me.constituency)} &middot; Voter ID ${esc(me.voterId.slice(0, 3))}${'*'.repeat(Math.max(me.voterId.length - 3, 3))}</p></div>
    <div class="status ${me.voted ? 'done' : ''}"><i></i>${me.voted ? 'Your vote is recorded' : 'You have not voted yet'}</div>
  </div></div>
  <div class="wrap">
    <nav class="tabs">${tabs.map(([k, l]) => `<button class="tab ${active === k ? 'active' : ''}" data-v="${k}">${l}</button>`).join('')}</nav>
    <div id="view"></div>
  </div>`;
  document.querySelectorAll('.tab').forEach((b) => (b.onclick = () => { view = b.dataset.v; renderApp(); }));
  ({ candidates: viewCandidates, vote: viewVote, results: viewResults, chain: viewChain, profile: viewProfile })[view]();
}

function openProfile(id) { profileId = id; view = 'profile'; renderApp(); window.scrollTo(0, 0); }
function bindOpen() { document.querySelectorAll('[data-open]').forEach((el) => (el.onclick = (e) => { e.stopPropagation(); openProfile(el.dataset.open); })); }

/* ---------------- leaders ---------------- */
function viewCandidates() {
  const list = allCands.filter((c) => c.constituency === pickLoc);
  $('#view').innerHTML = `
    <div class="vhead"><h2>Leaders by location</h2><p>Select a location to see who is standing there. Click a card to read the full profile.</p></div>
    <div class="seg">${constituencies.map((c) => `<button class="${c === pickLoc ? 'on' : ''}" data-loc="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="grid">${list.map((c) => `
      <div class="card lcard" data-open="${c.id}">
        <div class="top2"><div class="avatar">${esc(initials(c.name))}</div>${badge(c.party)}</div>
        <h3>${esc(c.name)}</h3>
        <div class="focus">${esc(c.focus)}</div>
        <div class="foot"><span class="years">Served <b>${c.serviceFrom} - ${c.serviceTo}</b></span><span class="go">View profile &rsaquo;</span></div>
      </div>`).join('')}</div>`;
  document.querySelectorAll('[data-loc]').forEach((b) => (b.onclick = () => { pickLoc = b.dataset.loc; viewCandidates(); }));
  bindOpen();
}

function viewProfile() {
  const c = allCands.find((x) => x.id === profileId);
  if (!c) { view = 'candidates'; return renderApp(); }
  const min = 2005, max = 2030, left = ((c.serviceFrom - min) / (max - min)) * 100, w = ((c.serviceTo - c.serviceFrom) / (max - min)) * 100;
  $('#view').innerHTML = `
    <div class="crumb"><button class="link" id="back">Leaders</button> &nbsp;/&nbsp; ${esc(c.constituency)} &nbsp;/&nbsp; ${esc(c.name)}</div>
    <div class="pbanner">
      <div class="avatar big">${esc(initials(c.name))}</div>
      <div style="position:relative;z-index:1"><h1>${esc(c.name)}</h1>${badge(c.party)}<span class="pn">${esc(PARTY[c.party].n)}</span></div>
    </div>
    <div class="facts">
      <div class="fact"><small>Constituency</small><b>${esc(c.constituency)}</b></div>
      <div class="fact"><small>Serving period</small><b>${c.serviceFrom} - ${c.serviceTo}</b></div>
      <div class="fact"><small>Total tenure</small><b>${c.serviceTo - c.serviceFrom} years</b></div>
      <div class="fact"><small>Main focus</small><b>${esc(c.focus)}</b></div>
    </div>
    <div class="card"><h2 style="font-size:19px">Service timeline</h2>
      <div class="tl"><i style="left:${left}%;width:${w}%"></i><em style="left:${left}%">${c.serviceFrom}</em><em style="left:${left + w}%">${c.serviceTo}</em></div>
      <div class="tl-l"><span>${min}</span><span>${max}</span></div></div>
    <h2 class="sec">About</h2>
    <div class="card"><p>${esc(c.about)}</p></div>
    <h2 class="sec">Contribution to ${esc(c.constituency)}</h2>
    <div class="works">${c.works.map(([t, d]) => `<div class="work"><div class="ic">${ICON.check}</div><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></div>`).join('')}</div>
    <div class="disc">Profile details are sample content prepared for this academic demonstration and are not verified records.</div>`;
  $('#back').onclick = () => { view = 'candidates'; pickLoc = c.constituency; renderApp(); window.scrollTo(0, 0); };
}

/* ---------------- vote ---------------- */
async function viewVote() {
  me = await api('me');
  const v = $('#view');
  if (me.voted) {
    v.innerHTML = `<div class="card done-card"><div class="tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>
      <h2>Vote recorded</h2><p style="color:var(--muted);margin-top:8px">Your vote is sealed on the blockchain. Thank you for taking part. You cannot vote again.</p>
      <div class="receipt"><b>Receipt</b><div style="margin:6px 0">Block #${me.receipt.block} &middot; ${new Date(me.receipt.time).toLocaleString()}</div><div class="hash">${esc(me.receipt.hash)}</div></div></div>`;
    return;
  }
  const list = allCands.filter((c) => c.constituency === me.constituency);
  v.innerHTML = `<div class="vhead"><h2>Cast your vote</h2><p>You are registered in <b>${esc(me.constituency)}</b>. Choose one leader, then confirm. Polling date: ${esc(info.pollingDate)}.</p></div>
    <form id="vf">
      ${list.map((c) => `<label class="card choice"><input type="radio" name="cand" value="${c.id}"><span class="radio"></span>
        <div class="avatar" style="width:50px;height:50px;font-size:17px">${esc(initials(c.name))}</div>
        <div class="info"><h3>${esc(c.name)}</h3><div class="m">Served ${c.serviceFrom} - ${c.serviceTo} &middot; <button type="button" class="link" data-open="${c.id}" style="font-size:13px">View profile</button></div></div>${badge(c.party)}</label>`).join('')}
      <button class="btn" type="submit" style="min-width:220px;margin-top:8px">Review and confirm</button>
      <div class="msg" id="msg"></div>
    </form>`;
  document.querySelectorAll('input[name=cand]').forEach((r) => (r.onchange = () => {
    document.querySelectorAll('.choice').forEach((x) => x.classList.remove('sel')); r.closest('.choice').classList.add('sel');
  }));
  bindOpen();
  $('#vf').onsubmit = async (e) => {
    e.preventDefault();
    const sel = document.querySelector('input[name=cand]:checked'), msg = $('#msg');
    if (!sel) { msg.className = 'msg err'; msg.textContent = 'Please select a leader first.'; return; }
    const cand = allCands.find((c) => c.id === sel.value);
    const yes = await confirmModal({ title: 'Confirm your vote', text: 'This cannot be changed after it is recorded on the blockchain.', cand, ok: 'Confirm vote' });
    if (!yes) return;
    const btn = $('#vf .btn'); btn.disabled = true; btn.textContent = 'Mining block...';
    try { await api('vote', { candidateId: sel.value }); me = await api('me'); renderApp(); toast('Your vote has been recorded'); window.scrollTo(0, 0); }
    catch (err) { msg.className = 'msg err'; msg.textContent = err.message; btn.disabled = false; btn.textContent = 'Review and confirm'; }
  };
}

/* ---------------- results ---------------- */
async function viewResults() {
  const d = await api('results');
  $('#view').innerHTML = `
    <div class="vhead"><h2>Election results</h2></div>
    <div class="notice">${ICON.info}<div>Counting date: <b>${esc(d.pollingDate)}</b><br>Final result declaration: <b>${esc(d.resultDate)}</b><br><span style="color:var(--muted)">Figures below are the live count read from the blockchain.</span></div></div>
    <div class="rgrid">${Object.entries(d.results).map(([loc, r]) => {
      let acc = 0;
      const seg = r.total ? r.candidates.filter((c) => c.votes).map((c) => { const s = acc, e = acc + (c.votes / r.total) * 100; acc = e; return `${PARTY[c.party].c} ${s}% ${e}%`; }).join(',') : '#e5e8ef 0% 100%';
      return `<div class="card"><div class="rhead">
        <div class="donut" style="background:conic-gradient(${seg})"><div><span><b>${r.total}</b><br><small>votes</small></span></div></div>
        <div><h2>${esc(loc)}</h2><div class="lead-t">${r.leading ? 'Currently leading: <b>' + esc(r.leading.name) + '</b> (' + esc(r.leading.party) + ')' : r.total ? 'Currently tied' : 'No votes counted yet'}</div></div></div>
        ${r.candidates.map((c) => { const pc = r.total ? Math.round((c.votes / r.total) * 100) : 0; return `<div class="res"><div class="r1">
          <span><button class="nm" data-open="${c.id}">${esc(c.name)}</button> ${badge(c.party)}${r.leading && r.leading.id === c.id ? '<span class="lead-badge">Leading</span>' : ''}</span>
          <b>${c.votes}<span class="pc">${pc}%</span></b></div>
          <div class="bar"><i style="width:${pc}%;background:${PARTY[c.party].c}"></i></div></div>`; }).join('')}
      </div>`;
    }).join('')}</div>`;
  bindOpen();
}

/* ---------------- blockchain ---------------- */
async function viewChain() {
  const [c, val] = await Promise.all([api('chain'), api('validate')]);
  const votes = c.blocks.filter((b) => b.data.type === 'VOTE').length;
  $('#view').innerHTML = `
    <div class="vhead"><h2>Blockchain ledger</h2><p>Every vote is a mined block linked to the one before it. Voter IDs appear only as hashes.</p></div>
    <div class="cstats">
      <div class="cs"><small>Total blocks</small><b>${c.blocks.length}</b></div>
      <div class="cs"><small>Votes recorded</small><b>${votes}</b></div>
      <div class="cs"><small>Mining difficulty</small><b>${c.difficulty}</b></div>
      <div class="cs ${val.valid ? 'ok' : 'bad'}"><small>Chain status</small><b>${val.valid ? 'Verified' : 'Broken at #' + val.brokenAt}</b></div>
    </div>
    <div class="chain">${[...c.blocks].reverse().map((b) => `<div class="card bl">
      <div class="t"><b>Block #${b.index}</b><span>${new Date(b.timestamp).toLocaleString()}</span></div>
      <div class="d">${b.data.type === 'VOTE' ? `<span class="tag">${esc(b.data.constituency)}</span><span class="tag">${esc(b.data.party)}</span><span class="tag">${esc(b.data.candidateId)}</span>` : '<span class="tag">Genesis block</span>'}</div>
      <div class="hash">hash: ${esc(b.hash)}<br>prev: ${esc(b.previousHash)}<br>nonce: ${b.nonce}</div></div>`).join('')}</div>`;
}

$('#brand').onclick = () => { if (me) { view = 'candidates'; renderApp(); window.scrollTo(0, 0); } };
boot();
