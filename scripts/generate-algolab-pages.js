// generate-algolab-pages.js
//
// Run this from your project root with: node scripts/generate-algolab-pages.js
//
// What it does:
// - reads scripts/algolab-participants-data.json
// - builds one real static page per student, at algolab/<name>/index.html
// - each page shows the same profile look as participant-profile.html,
//   but with a Verified badge, and the data typed directly into the page
//   (no query string, no lookup, no server)
//
// Nothing in your existing site files is touched. This only adds a new
// "algolab" folder full of pages, one per student.

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "algolab-participants-data.json");
const TEAM_FILE = path.join(__dirname, "algolab-team-data.json");
const OUTPUT_ROOT = path.join(__dirname, "..", "algolab");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// turns "Mathias Amsalu" into "mathias"
function firstNameSlug(fullName) {
  const first = fullName.trim().split(/\s+/)[0];
  return first
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// turns "Mathias Amsalu" into "mathias-amsalu", used only when the
// short slug would collide with someone else
function fullNameSlug(fullName) {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPage(participant, slug) {
  const name = escapeHtml(participant.name);
  const image = participant.image.startsWith("/")
    ? participant.image
    : "/" + participant.image;
  const description = escapeHtml(participant.description);
  const cohort = escapeHtml(participant.cohort);
  const certificateId = escapeHtml(participant.id || "");
  const certificate = participant.certificate
    ? (participant.certificate.startsWith("/")
        ? participant.certificate
        : "/" + participant.certificate)
    : "";
  const role = participant.role || "Participant";
  const position = participant.position || `AlgoLab ${cohort} Participant`;
  const badgeText = role === "Participant" ? "Verified Profile" : `Verified ${role}`;
  const metaLabel = role === "Participant" ? "participant" : role.toLowerCase();
  const backTarget = role === "Participant"
    ? "/algolab-participants.html"
    : "/algolab.html#algolab-team";
  const backLabel = role === "Participant"
    ? "Back to participants"
    : "Back to the AlgoLab team";

  const certificateIdLine = certificateId
    ? `<p class="al-certificate-id">Certificate ID: ${certificateId}</p>`
    : "";
  const certificateHtml = certificate
    ? `<section class="al-certificate">
        <span class="al-verified-badge al-certificate-badge"><i class="fa-solid fa-certificate" aria-hidden="true"></i> Verified Certificate</span>
        ${certificateIdLine}
        <figure class="al-certificate-figure">
          <img src="${certificate}" alt="${name}'s EAGLOPEN AlgoLab verified certificate" />
        </figure>
        <a class="al-certificate-download" href="${certificate}" download="${slug || "certificate"}-EAGLOPEN-Algolab-Certificate.png" aria-label="Download ${name}'s verified certificate">
          <i class="fa-solid fa-download" aria-hidden="true"></i> <span>Download Certificate</span>
        </a>
      </section>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <link rel="icon" type="image/png" href="/assets/images/hero/logo-v2.png" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${name} is a verified EAGLOPEN AlgoLab ${cohort} ${metaLabel}." />
    <title>${name} | EAGLOPEN AlgoLab</title>
    <script src="https://kit.fontawesome.com/bc43529ae8.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="/assets/css/base.css" />
    <link rel="stylesheet" href="/assets/css/header.css" />
    <link rel="stylesheet" href="/assets/css/footer.css" />
    <link rel="stylesheet" href="/assets/css/algolab.css" />
    <style>
      .al-verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        background: #1c8a4c;
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.35em 0.9em;
        border-radius: 999px;
        margin: 0.5em 0 1em;
      }
      .al-verified-badge i {
        font-size: 0.9em;
      }
      .al-certificate-id {
        font-family: monospace;
        font-size: 0.85rem;
        color: #bbbbbb;
        letter-spacing: 0.03em;
        margin: 0 0 1em;
      }
      .al-certificate {
        margin-top: 40px;
        padding-top: 34px;
        border-top: 1px solid rgba(255, 255, 255, 0.16);
      }
      .al-verified-badge.al-certificate-badge {
        background: #c9a84c;
        color: #14202e;
        margin-bottom: 0.35em;
      }
      .al-certificate-figure {
        width: 100%;
        max-width: 560px;
        margin: 16px auto 20px;
        padding: 8px;
        background: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 14px;
        box-shadow: 0 24px 50px -30px rgba(0, 0, 0, 0.85);
      }
      .al-profile-view .al-certificate-figure img {
        width: 100%;
        height: auto;
        object-fit: contain;
        border: none;
        border-radius: 8px;
        outline: none;
      }
      .al-certificate-download {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 22px;
        border-radius: 999px;
        background: linear-gradient(110deg, #c9a84c, #f0d98f);
        box-shadow: 0 14px 28px -16px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.5);
        color: #14202e;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-decoration: none;
        transition: transform 0.3s var(--ease-expo), box-shadow 0.3s ease;
      }
      .al-certificate-download i {
        color: #14202e;
      }
      .al-certificate-download:hover {
        transform: translateY(-2px);
        box-shadow: 0 22px 38px -18px rgba(201, 168, 76, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.5);
      }
      .al-certificate-download:active {
        transform: translateY(-1px) scale(0.98);
      }
      .al-certificate-download:focus-visible {
        outline: 3px solid var(--color-secondary-light);
        outline-offset: 4px;
      }
    </style>
  </head>
  <body>
    <header class="main-header">
      <div class="container">
        <a class="logo" href="/index.html" aria-label="EAGLOPEN home"><img src="/assets/images/hero/logo-v2.png" alt="" /><span>EAGLOPEN</span></a>
        <nav class="nav" aria-label="Primary navigation"><ul><li><a href="/algolab.html">ALGOLAB</a></li><li><a href="/algolab-participants.html">PARTICIPANTS</a></li></ul></nav>
      </div>
    </header>
    <main class="al-profile-page">
      <div class="container">
        <article class="al-profile-view" id="participant-profile" aria-live="polite">
          <img src="${image}" alt="${name}" />
          <span class="al-verified-badge"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${badgeText}</span>
          ${certificate ? "" : certificateIdLine}
          <h1>${name}</h1>
          <span class="al-alumni-cohort">${escapeHtml(position)}</span>
          <p>${description}</p>
          ${certificateHtml}
          <a class="al-profile-back" href="${backTarget}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${backLabel}</a>
        </article>
      </div>
    </main>
    <script src="/assets/js/clean-routes.js"></script>
  </body>
</html>
`;
}

function main() {
  const participants = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const team = fs.existsSync(TEAM_FILE)
    ? JSON.parse(fs.readFileSync(TEAM_FILE, "utf8"))
    : [];

  // work out a slug for everyone, first name only by default
  const bySlug = new Map();
  for (const p of participants) {
    const slug = firstNameSlug(p.name);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(p);
  }

  const finalSlugs = new Map(); // participant -> slug
  const collisions = [];
  for (const [slug, group] of bySlug.entries()) {
    if (group.length === 1) {
      finalSlugs.set(group[0], slug);
    } else {
      collisions.push(slug);
      for (const p of group) {
        finalSlugs.set(p, fullNameSlug(p.name));
      }
    }
  }

  // instructors and coordinators always get a full "first-last" URL so that
  // nobody shares a page with a student (e.g. /algolab/fikir-solomon)
  for (const member of team) {
    finalSlugs.set(member, fullNameSlug(member.name));
  }

  if (!fs.existsSync(OUTPUT_ROOT)) fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  for (const p of participants) {
    const slug = finalSlugs.get(p);
    const dir = path.join(OUTPUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(p, slug));
  }

  for (const member of team) {
    const slug = finalSlugs.get(member);
    const dir = path.join(OUTPUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(member, slug));
  }

  console.log(`Done. Wrote ${participants.length} participant pages and ${team.length} team pages into the algolab folder.`);
  if (collisions.length) {
    console.log("");
    console.log("Heads up, these first names were shared by more than one student,");
    console.log("so those specific students got a full name link instead of just the first name:");
    for (const slug of collisions) {
      const names = bySlug.get(slug).map((p) => `${p.name} -> /algolab/${finalSlugs.get(p)}`);
      console.log(`  ${slug}: ${names.join(", ")}`);
    }
  }
}

main();
