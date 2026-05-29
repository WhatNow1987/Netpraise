// KJV text access: download & cache public-domain KJV JSON per book,
// parse passage references, and extract ordered verse lists.
const fs = require("fs");
const path = require("path");
const https = require("https");

const CACHE_DIR = path.join(__dirname, "..", ".kjv-cache");
const BASE = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master";

function fileNameFor(book) {
  return book.replace(/ /g, "") + ".json";
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function fetchWithRetry(url, tries = 4) {
  let delay = 2000;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

async function loadBook(book) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, fileNameFor(book));
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  }
  const raw = await fetchWithRetry(`${BASE}/${fileNameFor(book)}`);
  fs.writeFileSync(cachePath, raw);
  return JSON.parse(raw);
}

// Build a flat ordered list of {ch, v, text} for a whole book.
function flatten(bookData) {
  const out = [];
  for (const ch of bookData.chapters) {
    const c = parseInt(ch.chapter, 10);
    for (const ve of ch.verses) {
      out.push({ ch: c, v: parseInt(ve.verse, 10), text: ve.text });
    }
  }
  return out;
}

// Parse "1:1-2:25" or "1:1-21" (single chapter) into {sc,sv,ec,ev}.
function parseRef(ref) {
  const [start, end] = ref.split("-");
  const [sc, sv] = start.split(":").map(Number);
  let ec, ev;
  if (end.includes(":")) {
    [ec, ev] = end.split(":").map(Number);
  } else {
    ec = sc;
    ev = Number(end);
  }
  return { sc, sv, ec, ev };
}

function inRange(item, r) {
  if (item.ch < r.sc || item.ch > r.ec) return false;
  if (item.ch === r.sc && item.v < r.sv) return false;
  if (item.ch === r.ec && item.v > r.ev) return false;
  return true;
}

function versesForRange(flat, r) {
  return flat.filter((it) => inRange(it, r));
}

// Format a ref object back to a human string, given a book name.
function refString(book, r) {
  if (r.sc === r.ec) return `${book} ${r.sc}:${r.sv}-${r.ev}`;
  return `${book} ${r.sc}:${r.sv}-${r.ec}:${r.ev}`;
}

module.exports = {
  loadBook,
  flatten,
  parseRef,
  versesForRange,
  refString,
  inRange,
};
