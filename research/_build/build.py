#!/usr/bin/env python3
"""
Build the static researcher profile pages for eaglopen.org.

Reads  research/data/researchers.json
Uses  research/_build/profile-template.html
       research/_build/works-template.html
Writes research/<slug>/index.html     for every researcher with "approved": true
       research/<slug>/work/index.html  for the same researchers

The site header and footer are not duplicated in the works template. build.py
lifts them out of the profile template, so both pages always share one copy.

Run from the repository root:

    python research/_build/build.py

Standard library only. The host never runs this; the generated files are
committed to the repository.
"""

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.dirname(HERE)          # .../research
REPO_ROOT = os.path.dirname(RESEARCH_DIR)     # repository root
DATA_FILE = os.path.join(RESEARCH_DIR, "data", "researchers.json")
PARKED_FILE = os.path.join(RESEARCH_DIR, "data", "researchers-parked.json")
TEMPLATE_FILE = os.path.join(HERE, "profile-template.html")
WORKS_TEMPLATE_FILE = os.path.join(HERE, "works-template.html")

SITE = "https://eaglopen.org"
SLUG_RE = re.compile(r"^[a-z0-9-]+$")

# Keys that describe the record itself rather than the profile page content.
NOT_PROFILE_FIELDS = ("slug", "approved", "year", "sample")

# The site chrome is sliced out of the profile template between these markers
# and reused by the works template.
CHROME_START = '<header class="main-header">'
CHROME_END = "</footer>"


def fail(message):
    print("error: " + message, file=sys.stderr)
    sys.exit(1)


def load_template(path):
    try:
        with open(path, encoding="utf-8") as handle:
            return handle.read()
    except OSError as exc:
        fail("cannot read template {}: {}".format(path, exc))


def extract_chrome(template):
    """Return the site header + footer exactly as written in the profile template."""
    start = template.find(CHROME_START)
    end = template.rfind(CHROME_END)
    if start == -1 or end == -1 or end < start:
        fail(
            "cannot find the site chrome in the profile template "
            "(expected {!r} ... {!r})".format(CHROME_START, CHROME_END)
        )
    return template[start : end + len(CHROME_END)]


def load_data(include_parked):
    """Return the researcher records, optionally merging in the parked file.

    researchers-parked.json holds complete entries that are not published yet.
    It is ignored by default; pass --with-parked to build them too.
    """
    try:
        with open(DATA_FILE, encoding="utf-8") as handle:
            data = json.load(handle)
    except OSError as exc:
        fail("cannot read {}: {}".format(DATA_FILE, exc))
    except json.JSONDecodeError as exc:
        fail("{} is not valid JSON: {}".format(DATA_FILE, exc))

    if not isinstance(data, list):
        fail("{} must contain a JSON array".format(DATA_FILE))

    if include_parked:
        if not os.path.isfile(PARKED_FILE):
            fail("--with-parked was passed but {} does not exist".format(PARKED_FILE))
        try:
            with open(PARKED_FILE, encoding="utf-8") as handle:
                parked = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            fail("cannot read {}: {}".format(PARKED_FILE, exc))
        if not isinstance(parked, dict) or not isinstance(
            parked.get("researchers"), list
        ):
            fail(
                "{} must be an object with a \"researchers\" array".format(
                    PARKED_FILE
                )
            )
        added = len(parked["researchers"])
        print("merging {} parked researcher(s) from {}".format(added, PARKED_FILE))
        data = data + parked["researchers"]

    return data


def meta_description(record):
    """Short description for the <meta name="description"> tag."""
    headline = (record.get("headline") or "").strip().rstrip(".")
    field = (record.get("field") or "").strip().rstrip(".")
    if headline and field:
        return "{}. Field: {}.".format(headline, field)
    return (headline + ".") if headline else "Approved EAGLOPEN researcher profile."


def build_page(template, record):
    """Return the finished profile HTML for one researcher."""
    return fill(template, record, work_page=False)


def build_work_page(template, record, chrome):
    """Return the finished works HTML for one researcher."""
    return fill(template, record, work_page=True, chrome=chrome)


def fill(template, record, work_page, chrome=None):
    slug = record["slug"]
    is_sample = bool(record.get("sample"))

    # The profile object is the record without the record-only bookkeeping
    # fields. "sample" and "slug" are kept because the page script reads both.
    profile = {k: v for k, v in record.items() if k not in NOT_PROFILE_FIELDS}
    profile["sample"] = is_sample
    profile["slug"] = slug

    # Escaped so the JSON can never terminate the surrounding <script> block.
    payload = json.dumps(profile, ensure_ascii=False, indent=2)
    payload = (
        payload.replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
    )

    robots = (
        '<meta name="robots" content="noindex, follow" />'
        if is_sample
        else '<meta name="robots" content="index, follow" />'
    )

    logo = record.get("logo") or "/assets/images/hero/logo-v2.png"
    name = (record.get("name") or slug).strip()
    canonical = "{}/research/{}/".format(SITE, slug)

    if work_page:
        title = "{} work | EAGLOPEN Research".format(name)
        description = "Every project and paper by {} at EAGLOPEN: {}.".format(
            name, (record.get("headline") or "researcher profile").strip().rstrip(".")
        )
        canonical = canonical + "work/"
    else:
        title = "{} | EAGLOPEN Research".format(name)
        description = meta_description(record)

    replacements = [
        ("/*__PROFILE_JSON__*/", payload),
        ("__PAGE_TITLE__", title),
        ("__META_DESCRIPTION__", description),
        ("__CANONICAL__", canonical),
        ("__ROBOTS__", robots),
        ("__LOGO__", logo),
    ]

    if chrome is not None:
        replacements.append(("/*__SITE_CHROME__*/", chrome))

    page = template
    for token, value in replacements:
        page = page.replace(token, value)

    leftovers = re.findall(r"__[A-Z_]+__", page)
    if leftovers:
        fail("template still has unreplaced tokens: {}".format(sorted(set(leftovers))))

    return page


def main():
    parser = argparse.ArgumentParser(
        description="Build the static researcher profile and work pages."
    )
    parser.add_argument(
        "--with-parked",
        action="store_true",
        help="also build the entries parked in research/data/researchers-parked.json",
    )
    args = parser.parse_args()

    template = load_template(TEMPLATE_FILE)
    works_template = load_template(WORKS_TEMPLATE_FILE)
    chrome = extract_chrome(template)
    records = load_data(args.with_parked)

    approved = [r for r in records if r.get("approved") is True]
    if not approved:
        print("No approved researchers found, nothing to build.")
        return

    seen = set()
    written = []

    for record in approved:
        slug = record.get("slug")
        if not isinstance(slug, str) or not SLUG_RE.match(slug):
            fail("invalid slug {!r} (use lowercase letters, numbers and dashes)".format(slug))
        if slug in seen:
            fail("duplicate slug {!r}".format(slug))
        seen.add(slug)

        out_dir = os.path.join(RESEARCH_DIR, slug)
        os.makedirs(out_dir, exist_ok=True)

        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(build_page(template, record))

        work_dir = os.path.join(out_dir, "work")
        os.makedirs(work_dir, exist_ok=True)
        with open(os.path.join(work_dir, "index.html"), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(build_work_page(works_template, record, chrome))

        written.append((slug, "sample" if record.get("sample") else "live"))

    for slug, kind in written:
        print("wrote research/{}/index.html  ({})".format(slug, kind))
        print("wrote research/{}/work/index.html  ({})".format(slug, kind))

    print(
        "\nDone. {} profile page(s) and works page(s) written.".format(len(written))
    )
    print("Commit the generated folders.")
    stale = stale_folders(seen)
    if stale:
        print(
            "\nNote: these folders are no longer produced by the data file.\n"
            "If they are parked entries, that is expected: rebuild them with\n"
            "  python research/_build/build.py --with-parked\n"
            "Otherwise delete them:\n  " + "\n  ".join("research/" + s for s in stale)
        )


def stale_folders(known_slugs):
    """Folders under research/ that look like profiles but are not in the data."""
    stale = []
    for name in sorted(os.listdir(RESEARCH_DIR)):
        path = os.path.join(RESEARCH_DIR, name)
        if not os.path.isdir(path) or name in known_slugs:
            continue
        if name.startswith("_") or name in ("data", "assets"):
            continue
        if os.path.isfile(os.path.join(path, "index.html")):
            stale.append(name)
    return stale


if __name__ == "__main__":
    main()
