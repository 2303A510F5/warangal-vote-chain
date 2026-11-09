# Warangal Vote Chain – Blockchain Voting Machine

A full voting project built from scratch with **Node.js only (no npm install needed)**.

## Run in VS Code
1. Unzip and open the folder in VS Code (File > Open Folder).
2. Install Node.js (v16+) from https://nodejs.org if not installed.
3. Open the terminal (Ctrl + `) and run:  `node server.js`   (or `npm start`)
4. Open http://localhost:3000

## Features
- Sign up / Log in (passwords hashed with scrypt, voter must be 18+)
- Locations: Warangal West, Warangal East (3 candidates each: INC, BJP, BRS)
- Candidate page with party and service period (location based)
- One vote per voter, only in own location; vote stored as a mined block (proof of work)
- Voter IDs stored only as SHA-256 hashes on the chain
- Blockchain explorer with integrity validation
- Results page with live count; polling date = today, result date = tomorrow (auto-updates every day)

## Files
- server.js – HTTP server + API
- blockchain.js – Block / chain / mining / validation
- candidates.js – edit leaders, parties, service details here
- public/ – front end (index.html, style.css, app.js)
- data/ – chain.json and users.json are created automatically (delete them to reset)
