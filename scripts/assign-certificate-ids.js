// assign-certificate-ids.js
//
// Run this once now, and again any time you add new students who do
// not yet have a certificate id:
//   node scripts/assign-certificate-ids.js
//
// It reads algolab-participants-data.json, gives every student who
// does not already have one a certificate id like AL2026-7K4X, and
// saves it straight back into that same file. A student who already
// has an id keeps that exact id forever, this never changes one that
// already exists, so it is always safe to run again later.

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "algolab-participants-data.json");

// no 0, O, 1, I, or L, so nobody misreads a printed certificate
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;

function randomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function main() {
  const participants = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  const usedIds = new Set(participants.filter((p) => p.id).map((p) => p.id));

  let assigned = 0;
  for (const p of participants) {
    if (p.id) continue;
    let id;
    do {
      id = `AL${p.cohort}-${randomCode()}`;
    } while (usedIds.has(id));
    usedIds.add(id);
    p.id = id;
    assigned++;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(participants, null, 2));

  if (assigned === 0) {
    console.log("Everyone already has a certificate id, nothing to do.");
  } else {
    console.log(`Done. Gave a new certificate id to ${assigned} student(s).`);
  }
}

main();
