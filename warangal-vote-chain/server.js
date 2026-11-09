// Warangal Vote Chain - zero dependency Node.js server
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Blockchain, sha256 } = require('./blockchain');
const config = require('./candidates');

const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data');
const PUBLIC = path.join(__dirname, 'public');
const SECRET = 'warangal-vote-chain-secret'; // used to anonymise voter IDs on the chain
fs.mkdirSync(DATA, { recursive: true });

const chain = new Blockchain(path.join(DATA, 'chain.json'), 3);
const usersFile = path.join(DATA, 'users.json');
let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : [];
const saveUsers = () => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
const sessions = new Map(); // token -> voterId

const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const voterHash = (id) => sha256(id.toUpperCase() + SECRET);

function electionInfo() {
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return { today: fmt(today), pollingDate: fmt(today), resultDate: fmt(tomorrow) };
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 10000) { reject(new Error('Too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(new Error('Invalid JSON')); } });
  });
}
function authUser(req) {
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  const id = sessions.get(token);
  return id ? { token, user: users.find((u) => u.voterId === id) } : null;
}

function results(constituency) {
  const t = chain.tally();
  return config.candidates
    .filter((c) => !constituency || c.constituency === constituency)
    .map((c) => ({ ...c, votes: t[c.id] || 0 }));
}

async function api(req, res, url) {
  const route = url.pathname.replace('/api/', '');
  const m = req.method;

  if (m === 'GET' && route === 'info') return send(res, 200, electionInfo());
  if (m === 'GET' && route === 'constituencies') return send(res, 200, config.constituencies);
  if (m === 'GET' && route === 'candidates') {
    const c = url.searchParams.get('constituency');
    return send(res, 200, config.candidates.filter((x) => !c || x.constituency === c));
  }
  if (m === 'GET' && route === 'results') {
    const out = {};
    for (const c of config.constituencies) {
      const list = results(c);
      const total = list.reduce((a, b) => a + b.votes, 0);
      const max = Math.max(...list.map((x) => x.votes));
      out[c] = { total, candidates: list, leading: total && list.filter((x) => x.votes === max).length === 1 ? list.find((x) => x.votes === max) : null };
    }
    return send(res, 200, { ...electionInfo(), results: out });
  }
  if (m === 'GET' && route === 'chain') return send(res, 200, { blocks: chain.chain, difficulty: chain.difficulty });
  if (m === 'GET' && route === 'validate') return send(res, 200, chain.isValid());

  if (m === 'POST' && route === 'signup') {
    const b = await readBody(req);
    const name = String(b.name || '').trim();
    const voterId = String(b.voterId || '').trim().toUpperCase();
    const age = parseInt(b.age, 10);
    const password = String(b.password || '');
    if (name.length < 3) return send(res, 400, { error: 'Enter your full name (min 3 letters).' });
    if (!/^[A-Z0-9]{6,12}$/.test(voterId)) return send(res, 400, { error: 'Voter ID must be 6-12 letters/numbers.' });
    if (!(age >= 18)) return send(res, 400, { error: 'You must be 18 or older to register.' });
    if (!config.constituencies.includes(b.constituency)) return send(res, 400, { error: 'Select your location.' });
    if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
    if (users.some((u) => u.voterId === voterId)) return send(res, 409, { error: 'This Voter ID is already registered.' });
    const salt = crypto.randomBytes(16).toString('hex');
    users.push({ name, voterId, age, constituency: b.constituency, salt, passwordHash: hashPw(password, salt) });
    saveUsers();
    return send(res, 201, { ok: true });
  }
  if (m === 'POST' && route === 'login') {
    const b = await readBody(req);
    const voterId = String(b.voterId || '').trim().toUpperCase();
    const u = users.find((x) => x.voterId === voterId);
    if (!u || hashPw(String(b.password || ''), u.salt) !== u.passwordHash) return send(res, 401, { error: 'Wrong Voter ID or password.' });
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, u.voterId);
    return send(res, 200, { token });
  }
  if (m === 'POST' && route === 'logout') {
    const a = authUser(req);
    if (a) sessions.delete(a.token);
    return send(res, 200, { ok: true });
  }

  // ----- authenticated -----
  const a = authUser(req);
  if (!a || !a.user) return send(res, 401, { error: 'Please log in.' });
  const u = a.user;

  if (m === 'GET' && route === 'me') {
    const blk = chain.findVote(voterHash(u.voterId));
    return send(res, 200, {
      name: u.name, voterId: u.voterId, constituency: u.constituency, age: u.age,
      voted: !!blk,
      receipt: blk ? { block: blk.index, hash: blk.hash, time: blk.timestamp } : null
    });
  }
  if (m === 'POST' && route === 'vote') {
    const b = await readBody(req);
    const cand = config.candidates.find((c) => c.id === b.candidateId);
    if (!cand) return send(res, 400, { error: 'Select a candidate.' });
    if (cand.constituency !== u.constituency) return send(res, 403, { error: 'You can only vote in ' + u.constituency + '.' });
    const vh = voterHash(u.voterId);
    if (chain.hasVoted(vh)) return send(res, 409, { error: 'You have already voted.' });
    const blk = chain.addBlock({ type: 'VOTE', voterHash: vh, constituency: u.constituency, candidateId: cand.id, party: cand.party });
    return send(res, 201, { ok: true, receipt: { block: blk.index, hash: blk.hash, time: blk.timestamp } });
  }
  return send(res, 404, { error: 'Not found' });
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.normalize(path.join(PUBLIC, p));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
}).listen(PORT, () => console.log('Warangal Vote Chain running at http://localhost:' + PORT));
