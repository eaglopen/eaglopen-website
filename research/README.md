# Researchers

The approved researcher profiles live here. Every profile is a plain HTML file,
so the site host runs nothing.

The path through the feature:

| Page                | URL                        | What it is                                  |
| ------------------- | -------------------------- | ------------------------------------------- |
| Researchers         | `/research/`               | Directory. One card per researcher, each with a **View his work** button |
| Work                | `/research/<slug>/work/`   | One card per project by that person, each with a **View his work** button |
| Profile             | `/research/<slug>/`        | The full profile: about, impact, work, journey |

A reader goes `research.html` → **View all researchers** → `/research/` →
**View his work** → `/research/<slug>/work/` → **View his work** →
`/research/<slug>/#work`.

- All the content: `/research/data/researchers.json`
- Sample page: `/research/yourname/`

## Adding a researcher

**1. Add one entry to `research/data/researchers.json`**

Copy the `"yourname"` entry, paste it after it, and change these values:

| Field            | What to put                                              |
| ---------------- | -------------------------------------------------------- |
| `slug`           | lowercase letters, numbers and dashes only, e.g. `abebe-kebede` |
| `approved`       | `true` — only approved entries are ever shown or built    |
| `sample`         | `false` for a real person                                 |
| `year`           | the year they were selected, e.g. `2026`                   |
| `name`           | their full name                                           |
| `photo`          | `/assets/images/researchers/<slug>.jpg` (see step 2)      |
| `logo`           | `/assets/images/hero/logo-v2.png`                         |

Fill in `headline`, `university`, `field`, `about`, `works`, `impact`,
`skills`, `timeline` and the rest. Keep the `slug` and `photo` matched to each
other.

**2. Put their photo in the repo**

Save the image as `assets/images/researchers/<slug>.jpg` and make sure
`photo` in the data file points at it.

**3. Build the page**

From the repository root:

```
python research/_build/build.py
```

This writes two files per researcher:

```
research/<slug>/index.html          the profile
research/<slug>/work/index.html     that person's work cards
```

Python 3, standard library only, no installs.

**4. Commit and deploy**

```
git add research assets/images/researchers
git commit -m "Add researcher profile for <name>"
git push
```

## Unapproving or removing someone

1. In `research/data/researchers.json`, set `"approved": false` (or delete the
   whole entry).
2. Run `python research/_build/build.py` again.
3. Delete their folder: `research/<slug>/`
4. Commit and deploy.

Step 3 matters: `build.py` never deletes anything, so a profile that is
unapproved stops being listed and stops being linked, but the old pages would
still be reachable if you left the folder in place. The script prints the names
of any folders that are no longer in the data file so you know which to remove.

## Parking a researcher

Sometimes you want a finished profile kept on disk but not public yet. That is
what `research/data/researchers-parked.json` is for. Right now it holds the
three founding-team researchers (`lencho-taye`, `tadele-negash`,
`tadesse-hailu`), so the directory and the site currently show only the sample.

Parking is just "not in `researchers.json`". Nothing is commented out and
nothing is lost, because the parked file is plain JSON with a `_readme` string
at the top explaining how to bring them back.

To bring them back, without moving any data:

```
python research/_build/build.py --with-parked
```

That merges the parked entries into the build, so all four profiles appear.
Run `python research/_build/build.py` again to park them once more.

To publish someone for good instead, move their entry out of the `researchers`
array in `researchers-parked.json` and into the array in `researchers.json`.

**After building with `--with-parked`, or after parking people again, delete the
folders you do not want public** (`research/<slug>/`, including its `work/`
subfolder). `build.py` never deletes, so a parked person's pages stay reachable
at their URL until you remove the folder. The script prints a reminder naming
those folders, and says that parked entries are expected there.

## Notes

- Only `approved: true` entries are built or shown.
- **`"cardTitle"` is optional.** Set it when the card on `/research/` should read
  something other than the person's name — the sample uses
  `"cardTitle": "Build Your Profile"` so the card shows the placeholder role
  instead of "Your Name". It changes the card only; the profile page `h1` still
  uses `name`.
- **The sample shows in the directory, first and badged.** Set `"sample": true`
  and the card appears at the top with a "Sample · not a real person" badge and
  a dashed border, and the count reads like `3 researchers + 1 sample`. Set it
  to `false` and the card looks like any other, with no badge. Nothing else
  changes either way.
- The sample page is `noindex, follow`, so search engines skip it. Real
  profiles are indexable and carry `Person` structured data.
- **`"placeholder": true` on a work** puts a yellow "Needs content" badge on
  that card. Use it for anything you have not written yet, so no half-written
  project is ever published. The parked `lencho-taye`, `tadele-negash` and
  `tadesse-hailu` entries are real people whose bios came from the Research
  Team section of `research.html`. Their programme and leadership work is
  written; **one work each is still a `placeholder`** where a real paper
  citation is needed, so no paper title was invented. Replace those before
  publishing.
- Every image path lives in the data file, never in the page markup, so
  swapping a photo is a one-line change.
- The profile design lives in `research/_build/profile-template.html`. The work
  cards live in `research/_build/works-template.html`. Those are the only files
  to edit if you want to change how a page looks. Both are scoped (`.rp` and
  `.rwk`) so they cannot affect any other page on the site.
- **The site header and footer are not duplicated in the works template.**
  `build.py` lifts them out of the profile template, so there is one copy. If
  you change the header or footer in `profile-template.html`, the works pages
  pick it up automatically. If you change the header on a real site page, copy
  that same change into `profile-template.html`.
- Do not hand-edit anything in `research/<slug>/`. Rerun `build.py` instead, or
  your changes will be overwritten.

## The block on research.html

`research.html` has one small block between these two comments:

```
<!-- RESEARCHERS SECTION START -->
<!-- RESEARCHERS SECTION END -->
```

It stays hidden until `researchers.json` contains at least one approved,
non-sample researcher. It also hides itself if the fetch fails, so it never
shows an error. Delete everything between the two comments to remove it.
