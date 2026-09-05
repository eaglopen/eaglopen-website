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
const OUTPUT_DIR = path.join(__dirname, "..", "qrcodes");
const LOGO_PATH = path.join(__dirname, "..", "assets", "images", "hero", "logo-v2.png");

// how big the QR image is, in pixels
const QR_SIZE = 600;
// how much of the QR the logo covers, keep this under 0.25 or scanners
// can start struggling even with high error correction
const LOGO_RATIO = 0.22;

function firstNameSlug(fullName) {
  return fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fullNameSlug(fullName) {
  return fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
  const padding = Math.round(logoSize * 0.18);
  const backingSize = logoSize + padding * 2;

  const logo = logoImage.clone().resize({ w: logoSize, h: logoSize });

  // white backing square so the logo has clean contrast against the QR pattern
  const backing = new Jimp({ width: backingSize, height: backingSize, color: 0xffffffff });

  const backingPos = Math.round((QR_SIZE - backingSize) / 2);
  const logoPos = Math.round((QR_SIZE - logoSize) / 2);

  qrImage.composite(backing, backingPos, backingPos);
  qrImage.composite(logo, logoPos, logoPos);

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

  let logoImage = null;
  if (fs.existsSync(LOGO_PATH)) {
    logoImage = await Jimp.read(LOGO_PATH);
  } else {
    console.log(`Could not find a logo at ${LOGO_PATH}, making plain QR codes instead.`);
    console.log("Fix the LOGO_PATH line at the top of this file if your logo lives somewhere else.");
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const p of participants) {
    const slug = finalSlugs.get(p);
    const url = `${SITE_URL}/algolab/${slug}`;
    const outPath = path.join(OUTPUT_DIR, `${fullNameSlug(p.name)}.png`);
    const image = await makeQrWithLogo(url, logoImage);
    await image.write(outPath);
  }

  console.log(`Done. Saved ${participants.length} QR codes into the qrcodes folder.`);
}

main();
