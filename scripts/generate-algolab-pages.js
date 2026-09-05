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

function buildPage(participant) {
  const name = escapeHtml(participant.name);
  const image = participant.image.startsWith("/")
    ? participant.image
    : "/" + participant.image;
  const description = escapeHtml(participant.description);
  const cohort = escapeHtml(participant.cohort);
  const certificateId = escapeHtml(participant.id || "");
  const role = participant.role || "Participant";
  const position = participant.position || `AlgoLab ${cohort} Participant`;
  const badgeText = role === "Participant" ? "Verified Certificate" : `Verified ${role}`;
  const metaLabel = role === "Participant" ? "participant" : role.toLowerCase();
  const backTarget = role === "Participant"
    ? "/algolab-participants.html"
    : "/algolab.html#algolab-team";
  const backLabel = role === "Participant"
    ? "Back to participants"
    : "Back to the AlgoLab team";

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
        color: #666666;
        letter-spacing: 0.03em;
        margin: 0 0 1em;
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
          ${certificateId ? `<p class="al-certificate-id">Certificate ID: ${certificateId}</p>` : ""}
          <h1>${name}</h1>
          <span class="al-alumni-cohort">${escapeHtml(position)}</span>
          <p>${description}</p>
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
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(p));
  }

  for (const member of team) {
    const slug = finalSlugs.get(member);
    const dir = path.join(OUTPUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(member));
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
