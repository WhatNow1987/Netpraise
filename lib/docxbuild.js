// Teaching script (.docx) builder — full word-for-word script, one per lesson.
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Header, Footer, BorderStyle,
} = require("docx");
const fs = require("fs");

const NAVY = "0A1A2F";
const GOLD = "B89442";

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after != null ? opts.after : 120 },
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size || 22, font: opts.font || "Calibri" })],
  });
}

function slideHeading(num, title, accent) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { color: accent, space: 2, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text: `Slide ${num} — ${title}`, bold: true, color: NAVY, size: 26, font: "Georgia" })],
  });
}

// Split a script into paragraphs, keeping [PAUSE]/[PRAY]/[LINK] markers visible.
function scriptParagraphs(script) {
  const blocks = script.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    const isMarker = /^\[(PAUSE|PRAY)\]/.test(b);
    return new Paragraph({
      spacing: { after: 140 },
      children: [new TextRun({ text: b, italics: isMarker, color: isMarker ? GOLD : "222222", size: 22, font: "Calibri" })],
    });
  });
}

function build(lessonModel, book, outPath) {
  const m = lessonModel.meta;
  const accent = book.accent.replace("#", "");
  const lessonLabel = `Lesson ${m.lessonNumber}${m.partLabel ? " " + m.partLabel : ""}`;

  const children = [];
  children.push(new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: `${book.name} ${lessonLabel} — ${m.lesson.title}`, bold: true, color: NAVY, size: 40, font: "Georgia" })],
  }));
  children.push(para("Teaching Script", { italics: true, color: accent, size: 26, font: "Georgia", after: 60 }));
  children.push(para(`Passage: ${m.refStr} (KJV)`, { color: "555555", size: 20 }));
  children.push(para(`Main idea: ${m.mainIdea}`, { color: "555555", size: 20, italics: true, after: 200 }));
  if (m.curated) {
    children.push(para("Note: This lesson covers a large passage; scripture slides present a curated, representative set of verses across the full range so the teaching stays focused.", { color: "777777", size: 18, italics: true, after: 200 }));
  }

  lessonModel.slides.forEach((s, i) => {
    children.push(slideHeading(i + 1, slideTitleOf(s), accent));
    scriptParagraphs(s.script).forEach((p) => children.push(p));
  });

  const doc = new Document({
    creator: "Jim Yarborough — The Continent of God · NetPraise",
    title: `${book.name} ${lessonLabel} — ${m.lesson.title} — Teaching Script`,
    sections: [{
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "The Continent of God Bible Curriculum · Jim Yarborough", color: NAVY, size: 18, bold: true, font: "Georgia" })],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "NetPraise · continentofgod.com", color: GOLD, size: 18, font: "Calibri" })],
        })] }),
      },
      children,
    }],
  });

  return Packer.toBuffer(doc).then((buf) => fs.writeFileSync(outPath, buf));
}

function slideTitleOf(s) {
  switch (s.type) {
    case "title": return `Title — ${s.title}`;
    case "timeline": return s.title;
    case "scripture": return s.label;
    default: return s.title;
  }
}

module.exports = { build };
