#!/usr/bin/env node
// The Continent of God — full curriculum generator.
// Usage:
//   node generate.js            -> all 66 books
//   node generate.js Genesis    -> one book
//   node generate.js Genesis Exodus
const fs = require("fs");
const path = require("path");
const { BOOKS } = require("./data/books");
const kjv = require("./lib/kjv");
const content = require("./lib/content");
const pptx = require("./lib/pptx");
const docxbuild = require("./lib/docxbuild");
const seo = require("./lib/seo");

const OUT_ROOT = path.join(__dirname, "ContinentOfGod");
const SPLIT_THRESHOLD = 20; // verses; >20 => Part A / Part B

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function fileSafe(title) {
  return title.replace(/&/g, "and").replace(/[^A-Za-z0-9]+/g, "");
}

function refObjFromVerses(verses) {
  const a = verses[0];
  const b = verses[verses.length - 1];
  return { sc: a.ch, sv: a.v, ec: b.ch, ev: b.v };
}

// Split a verse list into Part A / Part B at the chapter boundary nearest the midpoint.
function splitVerses(verses) {
  const mid = Math.floor(verses.length / 2);
  let splitIdx = mid;
  let bestDist = Infinity;
  for (let i = 1; i < verses.length; i++) {
    if (verses[i].ch !== verses[i - 1].ch) {
      const d = Math.abs(i - mid);
      if (d < bestDist) {
        bestDist = d;
        splitIdx = i;
      }
    }
  }
  // If no interior chapter boundary, fall back to the raw midpoint.
  if (bestDist === Infinity) splitIdx = mid;
  return [verses.slice(0, splitIdx), verses.slice(splitIdx)];
}

async function processLesson(book, lesson, flat, lessonNumber, log) {
  const bookDir = path.join(OUT_ROOT, book.name);
  ensureDir(bookDir);

  const baseRef = kjv.parseRef(lesson.ref);
  const allVerses = kjv.versesForRange(flat, baseRef);
  if (allVerses.length === 0) {
    log(`  ! No verses found for ${book.name} ${lesson.ref} — skipping`);
    return 0;
  }

  let parts;
  if (allVerses.length > SPLIT_THRESHOLD) {
    const [a, b] = splitVerses(allVerses);
    parts = [
      { label: "Part A", verses: a },
      { label: "Part B", verses: b },
    ];
  } else {
    parts = [{ label: null, verses: allVerses }];
  }

  let built = 0;
  for (const part of parts) {
    const refObj = refObjFromVerses(part.verses);
    const refStr = kjv.refString(book.name, refObj);
    const model = content.buildLesson({
      book, lesson, refObj, refStr, verses: part.verses,
      lessonNumber, partLabel: part.label,
    });

    const partTag = part.label ? "_" + part.label.replace(" ", "") : "";
    const baseName = `${fileSafe(book.name)}_${lesson.id}_${fileSafe(lesson.title)}${partTag}`;
    const pptxPath = path.join(bookDir, `${baseName}.pptx`);
    const docxPath = path.join(bookDir, `${baseName}_Script.docx`);
    const seoPath = path.join(bookDir, `${baseName}_YouTube_SEO.txt`);

    await pptx.build(model, book, pptxPath);
    await docxbuild.build(model, book, docxPath);
    seo.build(model, book, seoPath);

    log(`Built: ${path.basename(pptxPath)} ✓  (${part.verses.length} verses${model.meta.curated ? ", curated" : ""}, ${model.slides.length} slides)`);
    log(`Built: ${path.basename(docxPath)} ✓`);
    log(`Built: ${path.basename(seoPath)} ✓`);
    built += 3;
  }
  return built;
}

function lessonNumberLabel(lesson) {
  // "Lesson4a" -> "4a", "Lesson1" -> "1"
  return lesson.id.replace(/^Lesson/, "");
}

async function processBook(book, log) {
  log(`\n========== ${book.name} ==========`);
  const bookData = await kjv.loadBook(book.name);
  const flat = kjv.flatten(bookData);
  let total = 0;
  for (const lesson of book.lessons) {
    total += await processLesson(book, lesson, flat, lessonNumberLabel(lesson), log);
  }
  return total;
}

async function main() {
  const args = process.argv.slice(2);
  let target = BOOKS;
  if (args.length) {
    const want = args.map((a) => a.toLowerCase());
    target = BOOKS.filter((b) => want.includes(b.name.toLowerCase()));
    if (!target.length) {
      console.error(`No matching books for: ${args.join(", ")}`);
      process.exit(1);
    }
  }

  ensureDir(OUT_ROOT);
  const log = (m) => console.log(m);
  let grandTotal = 0;
  const start = Date.now();
  for (const book of target) {
    grandTotal += await processBook(book, log);
  }
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  log(`\n==================================================`);
  log(`DONE. ${grandTotal} files across ${target.length} book(s) in ${secs}s.`);
  log(`Output: ${OUT_ROOT}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
