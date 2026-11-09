// Simple proof-of-work blockchain used as the vote ledger.
const crypto = require('crypto');
const fs = require('fs');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

class Block {
  constructor(index, timestamp, data, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return sha256(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.nonce);
  }
  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor(file, difficulty = 3) {
    this.file = file;
    this.difficulty = difficulty;
    this.chain = [];
    this.load();
  }
  load() {
    if (fs.existsSync(this.file)) {
      const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.chain = raw.map((b) => {
        const blk = new Block(b.index, b.timestamp, b.data, b.previousHash);
        blk.nonce = b.nonce;
        blk.hash = b.hash;
        return blk;
      });
    }
    if (this.chain.length === 0) {
      const genesis = new Block(0, new Date().toISOString(), { type: 'GENESIS', note: 'Warangal election ledger' }, '0');
      genesis.mine(this.difficulty);
      this.chain.push(genesis);
      this.save();
    }
  }
  save() { fs.writeFileSync(this.file, JSON.stringify(this.chain, null, 2)); }
  latest() { return this.chain[this.chain.length - 1]; }
  addBlock(data) {
    const block = new Block(this.chain.length, new Date().toISOString(), data, this.latest().hash);
    block.mine(this.difficulty);
    this.chain.push(block);
    this.save();
    return block;
  }
  hasVoted(voterHash) {
    return this.chain.some((b) => b.data.type === 'VOTE' && b.data.voterHash === voterHash);
  }
  findVote(voterHash) {
    return this.chain.find((b) => b.data.type === 'VOTE' && b.data.voterHash === voterHash);
  }
  isValid() {
    const target = '0'.repeat(this.difficulty);
    for (let i = 0; i < this.chain.length; i++) {
      const b = this.chain[i];
      if (b.hash !== b.calculateHash()) return { valid: false, brokenAt: i, reason: 'Block data was changed' };
      if (!b.hash.startsWith(target)) return { valid: false, brokenAt: i, reason: 'Proof of work missing' };
      if (i > 0 && b.previousHash !== this.chain[i - 1].hash) return { valid: false, brokenAt: i, reason: 'Chain link broken' };
    }
    return { valid: true };
  }
  tally() {
    const t = {};
    for (const b of this.chain) {
      if (b.data.type === 'VOTE') t[b.data.candidateId] = (t[b.data.candidateId] || 0) + 1;
    }
    return t;
  }
}

module.exports = { Blockchain, sha256 };
