# The Continent of God — Bible Study Curriculum Generator

> The Bible is a **continent**. Most Christians never leave the beach. This is the **map**.

A data-driven generator that produces a complete Bible study curriculum for all **66 books**,
in the teaching voice of **Jim Yarborough** for **NetPraise**.

For every lesson it builds **exactly three files**:

1. `*.pptx` — a 16×9 PowerPoint deck (full speaker script in every slide's notes)
2. `*_Script.docx` — a word-for-word teaching script
3. `*_YouTube_SEO.txt` — a YouTube + SEO publishing package

Output lands in `/ContinentOfGod/[BookName]/`, ready to sync to Google Drive.

## Quick start

```bash
npm install          # installs pptxgenjs + docx
node generate.js     # builds all 66 books into ./ContinentOfGod
```

Build a single book (or a few):

```bash
node generate.js Genesis
node generate.js "1 Samuel" Revelation
```

A full run downloads the public-domain **KJV** text once (cached in `.kjv-cache/`)
and regenerates all 738 files in well under a minute.

## What each lesson contains

Every deck follows the fixed structure: **Title → God's Story Timeline (WE ARE HERE) →
Scripture slides (2–3 verses each, KJV) → THEN (Who/What/When + Bible Triage) →
THEN (Observe) → TODAY (Q1–Q4 + Fallen Condition Focus) → TODAY (Q5 + Challenge) →
TOMORROW (Gospel Thread) → Memory Verse**.

The teaching method is **THEN / TODAY / TOMORROW** — history, present life, the Gospel —
with **Bible Triage** (Black/Red/Yellow-Green doctrine tags) woven through, and every
lesson ending at Jesus.

## Design notes / decisions

- **Color palette, fonts, watermark, and layout** follow the master spec per book
  (`data/books.js`).
- **Lesson segmentation** is the exact breakdown from the spec.
- **>20-verse rule:** any lesson covering more than 20 verses is split into **Part A**
  and **Part B** at the chapter boundary nearest the passage midpoint. Each part is a
  complete standalone lesson.
- **Very large passages** (e.g. Psalms Book I, Matthew's teachings) would otherwise
  require hundreds of scripture slides. To keep decks teachable, when a part exceeds
  ~45 verses the scripture slides present a **curated, evenly-spaced representative set**
  (real refs and real KJV text), capped near 22 scripture slides. The script `.docx`
  notes this. Tune `MAX_SCRIPTURE_SLIDES` in `lib/content.js` to change it.

## Project layout

```
data/books.js     # 66-book metadata: colors, timeline position, author/date/theme, segmentation
lib/kjv.js        # KJV download/cache + passage parsing
lib/content.js    # the content engine — Jim's voice, Then/Today/Tomorrow, triage, gospel thread
lib/colors.js     # palette helpers
lib/pptx.js       # PowerPoint builder (pptxgenjs)
lib/docxbuild.js  # teaching-script builder (docx)
lib/seo.js        # YouTube/SEO package builder
generate.js       # orchestrator
```

Scripture text: public-domain **King James Version**.
