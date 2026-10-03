# AlgoLab 2026 course-material library

These folders are the source of truth for every lecture video, note, lab and
problem set shown on `algolab-materials.html`.

**Nothing here is hand-edited by the website, and nothing here should be
renamed or deleted to make the page look different.** The page is generated
from a manifest plus a scan of these folders, so a link that looks wrong is
almost always a manifest entry to correct, not a file to move.

## How the page is built

```text
scripts/algolab-materials-manifest.json   hand-written: courses, lectures, video IDs
scripts/build-algolab-materials.js        reads the manifest + scans these folders
assets/js/algolab-materials-data.js       generated - do not edit, regenerate instead
assets/js/algolab-materials.js            renders the page from that data
```

Regenerate after adding or uploading anything:

```bash
npm run build:materials
```

The script prints a lecture / video / file count per course and lists anything
it skipped. A skipped file is not lost — it is simply not linked until the
manifest says where it belongs.

## Adding a lecture

1. Put the files in the course folder, in the existing structure. Keep the
   naming style already used there, e.g.

   ```text
   assets/files/algolab/Python/lectures/AddisCoder_lecture_3B.pdf
   assets/files/algolab/AI and ML/lecture/lec04_code.ipynb
   assets/files/algolab/C++/Practice/Lab Lecture 4.pptx
   ```

2. Add a lecture to `scripts/algolab-materials-manifest.json`. `n` is the
   lecture number and must be unique; `title` is what the card shows. Only add
   a video if the recording actually exists — paste the real YouTube id.

   ```json
   { "n": 14, "video": "https://youtu.be/VIDEOID", "title": "Lecture 14" }
   ```

3. List the files under `groups`, keyed by slot. The slots a course uses are
   derived from its data, so a slot that no lecture has is never shown:

   | slot          | holds                                     | extensions      |
   | ------------- | ----------------------------------------- | --------------- |
   | `notes`       | lecture notes, slides, worksheets         | `.pdf` `.pptx`  |
   | `lectureCode` | worked-example code from the lecture      | `.ipynb`        |
   | `lab`         | lab sheets and lab exercises              | `.ipynb` `.pptx`|
   | `problems`    | problem sets and their solutions          | `.pdf`          |

   `extras` is for a file that belongs to that lecture but is not one of the
   four slots; `course.extras` is for material not tied to any lecture.

4. Run `npm run build:materials` and reload the page.

Anything a lecture is missing shows as **coming soon** automatically, so it is
fine to add a lecture before its files are uploaded. Duplicated uploads such as
`week02_lec03 (2).pdf` are linked once and reported by the build.

## Adding a course

Add an entry to `courses` in the manifest with its slug, display name, icon,
meeting `days` / `time`, `summary`, `weeks`, and its lectures, then rebuild.
The course switcher, the per-course directions panel and the lecture cards are
all generated, so a new course needs no HTML or CSS changes. Keep the `summary`
and `weeks` wording in step with the course description on `algolab.html`.

## Schedule reflected in the library

- Python and C++: Monday, Wednesday, Friday (9 learning days each)
- AI & Machine Learning and Aerospace: Tuesday, Thursday (6 learning days each)
- Practical laboratory: 10:30 AM–12:00 PM every weekday
- Open lab / practice: 4:30–5:00 PM every weekday