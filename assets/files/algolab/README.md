# AlgoLab 2026 course-material library

The course cards on `algolab.html` now open the day-by-day materials library
instead of downloading a single syllabus file.

## Add resources using this structure

Each course has three weeks. Every scheduled day can show several downloads:

```text
assets/files/algolab/
  python/week-1/day-1-lesson-notes.pdf
  python/week-1/day-1-practice-files.zip
  python/week-1/day-1-activity.pdf
  cpp/week-1/day-1-lesson-notes.pdf
  ai-ml/week-1/day-1-lesson-notes.pdf
  aerospace/week-1/day-1-lesson-notes.pdf
```

The website automatically links to the same pattern for every course, week,
and day. Use the exact names below for each day:

- `day-N-lesson-notes.pdf` — slides, notes, or reading
- `day-N-practice-files.zip` — starter code, data, or project files
- `day-N-activity.pdf` — exercise, lab sheet, or challenge

`N` restarts at 1 for each week. Add more resources by duplicating one of the
download links in `algolab-materials.html` and changing its label and file path.

## Schedule reflected in the library

- Python and C++: Monday, Wednesday, Friday (9 learning days each)
- AI & Machine Learning and Aerospace: Tuesday, Thursday (6 learning days each)
- Practical laboratory: 10:30 AM–12:00 PM every weekday
- Open lab / practice: 4:30–5:00 PM every weekday
