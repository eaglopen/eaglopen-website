// generate-qr-codes.js
//
// Run this once from your project root:
//   npm install qrcode jimp
//   node scripts/generate-qr-codes.js
//
// It reads the same participant list as generate-algolab-pages.js, makes
// one QR code per student pointing at their algolab page, and pastes the
// EAGLOPEN logo in the middle of each one, same as other orgs do.
//
// Change SITE_URL below if you test this before the domain is live.
// Change LOGO_PATH if your logo file lives somewhere else.

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { Jimp } = require("jimp");

const SITE_URL = "https://eaglopen.org";
const DATA_FILE = path.join(__dirname, "algolab-participants-data.json");
const TEAM_FILE = path.join(__dirname, "algolab-team-data.json");
const OUTPUT_DIR = path.join(__dirname, "..", "qrcodes");
const LOGO_PATH = path.join(__dirname, "..", "assets", "images", "hero", "logo-v2.png");

// how big the QR image is, in pixels
const QR_SIZE = 600;
// how much of the QR the logo covers, keep this under 0.25 or scanners
// can start struggling even with high error correction
const LOGO_RATIO = 0.2;
// white breathing room around the logo, as a fraction of the logo size
const LOGO_PADDING_RATIO = 0.12;
// thickness of the gold ring around the logo badge, in pixels on a 600px QR
const RING_WIDTH = 8;
// EAGLOPEN brand gold ring around the logo badge
const RING_COLOR = 0xc9a84cff;
const WHITE = 0xffffffff;

function firstNameSlug(fullName) {
  return fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fullNameSlug(fullName) {
  return fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function writeWithRetry(image, outPath, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await image.write(outPath);
      return;
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 250 * i));
    }
  }
}

async function makeQrWithLogo(url, logoImage) {
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    width: QR_SIZE,
    margin: 2,
  });
  const qrImage = await Jimp.read(qrBuffer);

  if (!logoImage) return qrImage;

  const logoSize = Math.round(QR_SIZE * LOGO_RATIO);
  const padding = Math.round(logoSize * LOGO_PADDING_RATIO);
  const backingSize = logoSize + padding * 2;
  const badgeSize = backingSize + RING_WIDTH * 2;

  // logo cropped to a clean circle
  const logo = logoImage.clone().resize({ w: logoSize, h: logoSize }).circle();

  // build the logo badge on its own layer: gold ring + white circle + logo.
  // the badge is much tighter than before so it barely touches the QR pattern.
  const badge = new Jimp({ width: badgeSize, height: badgeSize, color: RING_COLOR }).circle();

  const backing = new Jimp({ width: backingSize, height: backingSize, color: WHITE }).circle();
  const backingOffset = Math.round((badgeSize - backingSize) / 2);
  badge.composite(backing, backingOffset, backingOffset);

  const logoOffset = Math.round((backingSize - logoSize) / 2);
  badge.composite(logo, backingOffset + logoOffset, backingOffset + logoOffset);

  const badgePos = Math.round((QR_SIZE - badgeSize) / 2);
  qrImage.composite(badge, badgePos, badgePos);

  return qrImage;
}

async function main() {
  const participants = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  const bySlug = new Map();
  for (const p of participants) {
    const slug = firstNameSlug(p.name);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(p);
  }
  const finalSlugs = new Map();
  for (const group of bySlug.values()) {
    if (group.length === 1) {
      finalSlugs.set(group[0], firstNameSlug(group[0].name));
    } else {
      for (const p of group) finalSlugs.set(p, fullNameSlug(p.name));
    }
  }

  let people = participants;
  const team = fs.existsSync(TEAM_FILE)
    ? JSON.parse(fs.readFileSync(TEAM_FILE, "utf8"))
    : [];
  for (const member of team) {
    finalSlugs.set(member, fullNameSlug(member.name));
    people = people.concat(member);
  }

  let logoImage = null;
  if (fs.existsSync(LOGO_PATH)) {
    logoImage = await Jimp.read(LOGO_PATH);
  } else {
    console.log(`Could not find a logo at ${LOGO_PATH}, making plain QR codes instead.`);
    console.log("Fix the LOGO_PATH line at the top of this file if your logo lives somewhere else.");
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const p of people) {
    const slug = finalSlugs.get(p);
    const url = `${SITE_URL}/algolab/${slug}`;
    const outPath = path.join(OUTPUT_DIR, `${slug}.png`);
    const image = await makeQrWithLogo(url, logoImage);
    await writeWithRetry(image, outPath);
  }

  console.log(`Done. Saved ${people.length} QR codes (${participants.length} participants + ${team.length} team) into the qrcodes folder.`);
}

main();
