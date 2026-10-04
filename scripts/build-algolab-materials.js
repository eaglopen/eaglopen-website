#!/usr/bin/env node
/**
 * EAGLOPEN - AlgoLab course-material data builder
 * ---------------------------------------------------------------------------
 * Scans assets/files/algolab/ and merges what it finds with the hand-authored
 * manifest in scripts/algolab-materials-manifest.json, then writes the file the
 * website actually loads: assets/js/algolab-materials-data.js
 *
 * Run after adding a lecture, a video or a file:
 *
 *     npm run build:materials
 *
 * This script never writes to, renames or deletes anything inside
 * assets/files/algolab/ - it only reads.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MATERIALS_DIR = path.join(ROOT, "assets", "files", "algolab");
const MANIFEST_PATH = path.join(__dirname, "algolab-materials-manifest.json");
const TEAM_PATH = path.join(__dirname, "algolab-team-data.json");
const PROFILES_DIR = path.join(ROOT, "algolab");
const OUTPUT_PATH = path.join(ROOT, "assets", "js", "algolab-materials-data.js");

/** Extensions we are willing to link to. */
const ALLOWED_EXT = new Set([
  ".pdf",
  ".ipynb",
  ".pptx",
  ".ppt",
  ".cpp",
  ".hpp",
  ".h",
  ".py",
  ".zip",
  ".csv",
  ".md",
  ".txt",
]);

/** Human label + icon for each file extension we can render. */
const FILE_KINDS = {
  ".pdf": { kind: "pdf", icon: "fas fa-file-pdf", badge: "PDF", noun: "notes" },
  ".ipynb": { kind: "notebook", icon: "fas fa-file-code", badge: "Notebook", noun: "notebook" },
  ".pptx": { kind: "slides", icon: "fas fa-file-powerpoint", badge: "Slides", noun: "slides" },
  ".ppt": { kind: "slides", icon: "fas fa-file-powerpoint", badge: "Slides", noun: "slides" },
  ".cpp": { kind: "code", icon: "fas fa-file-code", badge: "C++", noun: "source file" },
  ".hpp": { kind: "code", icon: "fas fa-file-code", badge: "C++", noun: "header file" },
  ".h": { kind: "code", icon: "fas fa-file-code", badge: "C++", noun: "header file" },
  ".py": { kind: "code", icon: "fas fa-file-code", badge: "Python", noun: "script" },
  ".zip": { kind: "archive", icon: "fas fa-file-zipper", badge: "ZIP", noun: "archive" },
  ".csv": { kind: "data", icon: "fas fa-file-csv", badge: "CSV", noun: "dataset" },
  ".md": { kind: "doc", icon: "fas fa-file-lines", badge: "Guide", noun: "guide" },
  ".txt": { kind: "doc", icon: "fas fa-file-lines", badge: "Text", noun: "text file" },
};

const warnings = [];

/* ------------------------------------------------------------------ utils */

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/** URL-encode a repo path one segment at a time so spaces become %20. */
const encodePath = (relativePath) =>
  relativePath.split("/").map(encodeURIComponent).join("/");

/** Public URL of a course file, with every path segment URL-encoded. */
const assetUrl = (courseDir, rel) =>
  `assets/files/algolab/${courseDir}/${rel}`
    .split("/")
    .map((part, i) => (i === 0 ? part : encodeURIComponent(part)))
    .join("/");

/** Turn "week02_lec03 (2).pdf" into "week02_lec03.pdf" (display name only, never the URL). */
/** "Chapter - 4 (2) (2).pptx" -> "Chapter - 4.pptx" (display name only, never the URL). */
const duplicateSuffix = /\s*\(\d+\)(?=\.[^.]+$)/g;
/** Non-global twin, safe to use with .test() in a loop. */
const looksDuplicate = /\s*\(\d+\)(?=\.[^.]+$)/;
const stripDuplicateSuffix = (name) => name.replace(duplicateSuffix, "");

/** Recursively list files, skipping hidden folders such as .ipynb_checkpoints. */
function listFiles(dir, base = "") {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs, rel));
    else out.push({ rel, abs });
  }
  return out;
}

/** Recursively list immediate sub-folder names. */
function listDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ people */

/**
 * People come from scripts/algolab-team-data.json, which is the same file that
 * feeds algolab.html. Nothing is retyped here. Each person's public profile page
 * under algolab/ is found by matching its <title>, so the cards can link to it.
 */
function loadPeople(manifest) {
  const team = readJson(TEAM_PATH);

  // <title> of every algolab/<slug>/index.html is the person's full name.
  const profilesByName = new Map();
  for (const slug of fs.existsSync(PROFILES_DIR) ? fs.readdirSync(PROFILES_DIR) : []) {
    const page = path.join(PROFILES_DIR, slug, "index.html");
    if (!fs.existsSync(page)) continue;
    const title = fs.readFileSync(page, "utf8").match(/<title>([\s\S]*?)<\/title>/i);
    if (!title) continue;
    // Titles look like "Biniyam Aschalew | EAGLOPEN AlgoLab".
    const name = title[1].split("|")[0].trim();
    if (name) profilesByName.set(name.toLowerCase(), slug);
  }

  // The team file was written with a non-UTF8 bullet that reads as U+FFFD.
  const clean = (text) =>
    String(text || "")
      .replace(/\uFFFD/g, "\u2022")
      .replace(/\s*•\s*/g, " \u2022 ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const wanted = new Set([
    ...Object.values(manifest.courses).map((c) => c.instructor),
    ...manifest.coordinators,
  ]);

  const people = {};
  for (const member of team) {
    const slug = profilesByName.get(member.name.trim().toLowerCase());
    if (!slug || !wanted.has(slug)) continue;
    people[slug] = {
      name: member.name,
      image: member.image,
      position: member.position,
      bio: clean(member.description),
      ...(member.email ? { email: member.email } : {}),
      ...(member.linkedin ? { linkedin: member.linkedin } : {}),
      profileUrl: `algolab/${slug}`,
    };
    wanted.delete(slug);
  }

  for (const missing of wanted) {
    warnings.push(
      `people: no member with profile "${missing}" in scripts/algolab-team-data.json - the course team will show a placeholder.`
    );
  }

  return people;
}

/* -------------------------------------------------------------- file rules */

function makeMatcher(rule) {
  const source = rule.test === "." ? null : rule.test;
  if (source === null) return () => true;
  let re;
  try {
    re = new RegExp(source);
  } catch (error) {
    warnings.push(`fileRules: invalid pattern "${rule.test}" (${error.message}) - skipped.`);
    return () => false;
  }
  return (name) => re.test(name);
}

/**
 * Apply the manifest's fileRules to every file in a course folder.
 * The first rule whose folder and file name both match wins.
 */
function classifyCourse(course) {
  const courseDir = path.join(MATERIALS_DIR, course.dir);
  if (!fs.existsSync(courseDir)) {
    warnings.push(`course "${course.dir}": folder assets/files/algolab/${course.dir} is missing.`);
    return [];
  }

  const rules = (course.fileRules || []).map((rule) => ({
    ...rule,
    dir: rule.dir || ".",
    matches: makeMatcher(rule),
  }));

  const files = listFiles(courseDir);

  // Order files so the best copy of a duplicate is always seen first: real file
  // names before " (2)" copies, then the longer (more canonical) name first, so
  // "probs6b_supp.pdf" is considered before "6b_supp.pdf".
  files.sort((a, b) => {
    const an = path.basename(a.rel);
    const bn = path.basename(b.rel);
    const aDup = looksDuplicate.test(an) ? 1 : 0;
    const bDup = looksDuplicate.test(bn) ? 1 : 0;
    if (aDup !== bDup) return aDup - bDup;
    if (an.length !== bn.length) return bn.length - an.length;
    return an.localeCompare(bn, "en", { numeric: true });
  });

  const matched = new Map();
  const unclassified = [];

  for (const file of files) {
    const ext = path.extname(file.rel).toLowerCase();
    const folder = file.rel.includes("/") ? file.rel.split("/")[0] : "";
    const name = path.basename(file.rel);
    const prettyName = stripDuplicateSuffix(name);

    if (!ALLOWED_EXT.has(ext)) continue;

    const rule = rules.find((r) => (r.dir === "." || r.dir === folder) && r.matches(name));
    if (!rule) {
      unclassified.push(file.rel);
      continue;
    }

    const capture =
      rule.lecture === 1 && rule.test !== "." ? name.match(new RegExp(rule.test)) : null;
    const lecture = rule.lecture === 1 ? Number(capture && capture[1]) : 0;
    if (rule.lecture === 1 && !Number.isFinite(lecture)) {
      warnings.push(`course "${course.dir}": could not read a lecture number out of "${file.rel}".`);
      continue;
    }

    const isSolution = Boolean(rule.isSolution && capture && capture[rule.isSolution]);
    const partKey = capture && rule.part ? String(capture[rule.part]).toLowerCase() : "";
    const partName = rule.partNames && partKey ? rule.partNames[partKey] || "" : "";

    const meta = FILE_KINDS[ext];
    if (!meta) {
      warnings.push(
        `course "${course.dir}": no styling known for "${ext}" - shown as a plain download.`
      );
    }

    // Students see "Part B" or "Part A · Solutions", not "probs4b_supp.pdf".
    // The real file name is kept in the data and used as a tooltip.
    let base = prettyName;
    if (isSolution && rule.stripToken) base = base.split(rule.stripToken).join("");
    const label = rule.label || partName || base;
    const displayName = isSolution ? `${label} \u00b7 Solutions` : label;

    // One row per logical item (notes / part A / solutions) so files that were
    // uploaded twice under different names collapse into a single link.
    const key = rule.dedupe
      ? `${rule.slot}:${lecture}:${partKey}:${isSolution ? "sol" : "task"}`
      : rule.preferCleanName
        ? `${rule.slot}:${lecture}:${prettyName}`
        : `${rule.slot}:${file.rel}`;

    const previous = matched.get(key);
    if (previous) {
      const preferred = rule.prefer && rule.prefer !== "." ? new RegExp(rule.prefer).test(name) : false;
      if (!preferred) {
        warnings.push(
          `course "${course.dir}": "${file.rel}" duplicates "${previous.rel}" - linked one copy only. The original files were left untouched.`
        );
        continue;
      }
      matched.delete(key);
    }

    matched.set(key, {
      name: displayName,
      realName: name,
      slot: rule.slot,
      lecture,
      ext,
      isSolution,
      bytes: fs.statSync(file.abs).size,
      rel: file.rel,
      kind: (meta && meta.kind) || "file",
      icon: (meta && meta.icon) || "fas fa-file",
      badge: (meta && meta.badge) || ext.replace(".", "").toUpperCase(),
      noun: (meta && meta.noun) || "file",
    });
  }

  if (unclassified.length) {
    warnings.push(
      `course "${course.dir}": no fileRule matched ${unclassified.length} file(s) - ${unclassified.join(
        ", "
      )}. Add a rule to scripts/algolab-materials-manifest.json.`
    );
  }

  return [...matched.values()];
}

/* ------------------------------------------------------------------ videos */

/** Pull the 11-character id out of any YouTube link shape. */
function youtubeId(url) {
  if (!url) return "";
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return "";
}

/* ------------------------------------------------------------------- build */

function buildCourse(slug, course, files, repo) {
  const describe = (file) => {
    const repoPath = `assets/files/algolab/${course.dir}/${file.rel}`;
    const encoded = encodePath(repoPath);
    const url = assetUrl(course.dir, file.rel);
    return {
      name: file.name,
      realName: file.realName,
      ext: file.ext,
      kind: file.kind,
      icon: file.icon,
      badge: file.badge,
      noun: file.noun,
      isSolution: file.isSolution,
      url,
      // Same-origin, so the anchor's `download` attribute is all that is needed.
      downloadUrl: url,
      // One-click Colab only works for notebooks that live in a public GitHub
      // repo, which is where the website itself is published from.
      colabUrl:
        file.kind === "notebook"
          ? `https://colab.research.google.com/github/${repo.owner}/${repo.repo}/blob/${repo.branch}/${encoded}`
          : "",
      previewUrl:
        file.kind === "notebook"
          ? `https://nbviewer.org/github/${repo.owner}/${repo.repo}/blob/${repo.branch}/${encoded}`
          : "",
    };
  };

  const byName = (a, b) => a.rel.localeCompare(b.rel, "en", { numeric: true });
  // Rows read in the order a student works through them: Part A, Part A
  // solutions, Part B, ... rather than raw file-name order.
  const byLabel = (a, b) => a.name.localeCompare(b.name, "en", { numeric: true });
  const slots = ["notes", "lectureCode", "lab", "problems"];

  const lectures = [...course.lectures]
    .sort((a, b) => a.n - b.n)
    .map((lecture) => {
      const mine = files.filter((f) => f.lecture === lecture.n);
      const groups = slots
        .map((slot) => ({
          slot,
          files: mine.filter((f) => f.slot === slot).sort(byName).map(describe).sort(byLabel),
        }))
        .filter((group) => group.files.length);

      const extras = mine.filter((f) => f.slot === "extras").sort(byName).map(describe);

      const videoId = youtubeId(lecture.video);
      if (lecture.video && !videoId) {
        warnings.push(
          `course "${slug}", lecture ${lecture.n}: could not read a video id out of "${lecture.video}".`
        );
      }

      return {
        n: lecture.n,
        title: lecture.title,
        topic: lecture.topic || "",
        videoId,
        videoUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        youtubeTitle: lecture.youtubeTitle || "",
        // hqdefault is used rather than maxresdefault: several course videos
        // have no max-res thumbnail and would render as a broken image.
        thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
        groups,
        extras,
        hasVideo: Boolean(videoId),
        hasMaterials: groups.length > 0 || extras.length > 0,
      };
    });

  // Files that belong to the course as a whole rather than to one lecture.
  const extras = files
    .filter((f) => f.lecture === 0 && f.slot === "extras")
    .sort(byName)
    .map(describe)
    .sort(byLabel);

  const kindSet = new Set(
    files.filter((f) => f.lecture > 0 || f.slot === "extras").map((f) => f.kind)
  );

  return {
    slug,
    name: course.name,
    icon: course.icon,
    dir: course.dir,
    days: course.days,
    time: course.time,
    summary: course.summary,
    weeks: course.weeks,
    instructorKey: course.instructor,
    videoLibrary: course.videoLibrary,
    credit: course.credit || null,
    // Which file types this course actually ships. Drives the "how to open
    // these materials" panel, so the instructions are never generic.
    kinds: [...kindSet].sort(),
    extras,
    lectures,
  };
}

function main() {
  if (!fs.existsSync(MATERIALS_DIR)) {
    console.error(`Missing ${path.relative(ROOT, MATERIALS_DIR)}. Nothing to build.`);
    process.exit(1);
  }

  const manifest = readJson(MANIFEST_PATH);
  const repo = manifest.repo;
  const people = loadPeople(manifest);

  const courses = {};
  for (const [slug, course] of Object.entries(manifest.courses)) {
    const files = classifyCourse(course);
    courses[slug] = buildCourse(slug, course, files, repo);
  }

  const payload = {
    repo,
    coordinators: manifest.coordinators,
    people,
    slots: manifest.slots,
    comingSoon: manifest.comingSoon,
    courses,
  };

  const banner = [
    "/* GENERATED FILE - DO NOT EDIT BY HAND.",
    " *",
    " * Built by scripts/build-algolab-materials.js from",
    " * scripts/algolab-materials-manifest.json + the real files in",
    " * assets/files/algolab/. Re-run `npm run build:materials` after adding a",
    " * lecture, a video or a file.",
    " */",
  ].join("\n");

  const body = `window.ALGOLAB_MATERIALS = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n${body}`, "utf8");

  /* ----------------------------------------------------------- report out */
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}\n`);
  for (const [slug, course] of Object.entries(courses)) {
    const withVideo = course.lectures.filter((l) => l.videoId).length;
    const fileCount =
      course.extras.length +
      course.lectures.reduce(
        (sum, l) => sum + l.groups.reduce((n, g) => n + g.files.length, 0) + l.extras.length,
        0
      );
    console.log(
      `  ${slug.padEnd(10)} ${course.lectures.length} lectures · ${withVideo} videos · ${fileCount} files · [${course.kinds.join(", ")}]`
    );
  }
  const unused = listDirs(MATERIALS_DIR).filter(
    (dir) => !Object.values(manifest.courses).some((c) => c.dir.toLowerCase() === dir.toLowerCase())
  );
  if (unused.length) {
    warnings.push(
      `course folders with no manifest entry: ${unused.join(", ")} - add them to scripts/algolab-materials-manifest.json.`
    );
  }

  if (warnings.length) {
    console.log(`\n${warnings.length} note${warnings.length === 1 ? "" : "s"}:`);
    for (const warning of warnings) console.log(`  - ${warning}`);
  } else {
    console.log("\nNo notes: every file in assets/files/algolab/ was matched to a lecture.");
  }
}

main();