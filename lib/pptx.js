// PowerPoint builder — pptxgenjs, LAYOUT_16x9, per The Continent of God spec.
const PptxGenJS = require("pptxgenjs");
const { hex, lighten, TEXT } = require("./colors");

const TITLE_FONT = "Georgia";
const BODY_FONT = "Calibri";

function decorate(slide, book) {
  const bg = hex(book.bg);
  const accent = hex(book.accent);
  slide.background = { color: bg };
  // Left accent bar
  slide.addShape("rect", { x: 0, y: 0, w: 0.07, h: 5.625, fill: { color: accent } });
  // NetPraise watermark, bottom left
  slide.addText("NETPRAISE", {
    x: 0.18, y: 5.28, w: 1.5, h: 0.25, fontSize: 9, bold: true,
    charSpacing: 3, color: accent, fontFace: BODY_FONT, align: "left", valign: "middle",
  });
}

function card(slide, opts) {
  slide.addShape("roundRect", {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h, rectRadius: 0.06,
    fill: { color: opts.fill }, line: { color: opts.line || opts.fill, width: 1 },
  });
}

function build(lessonModel, book, outPath) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CONTINENT", width: 10, height: 5.625 });
  pptx.layout = "CONTINENT";
  pptx.author = "Jim Yarborough — The Continent of God · NetPraise";
  pptx.company = "NetPraise";
  pptx.subject = lessonModel.meta.refStr;
  pptx.title = `${book.name} ${lessonModel.meta.lesson.title}`;

  const accent = hex(book.accent);
  const cardFill = lighten(book.bg, 16);
  const cardFill2 = lighten(book.bg, 28);

  for (const s of lessonModel.slides) {
    const slide = pptx.addSlide();
    decorate(slide, book);
    renderSlide(pptx, slide, s, { accent, cardFill, cardFill2 });
    slide.addNotes(s.script || "");
  }

  return pptx.writeFile({ fileName: outPath });
}

function renderSlide(pptx, slide, s, c) {
  switch (s.type) {
    case "title":
      slide.addText(s.seriesLabel, { x: 0.5, y: 0.35, w: 9, h: 0.4, fontSize: 13, bold: true, color: c.accent, fontFace: BODY_FONT, charSpacing: 2 });
      slide.addText(s.title, { x: 0.5, y: 0.85, w: 9, h: 1.2, fontSize: 48, bold: true, color: TEXT, fontFace: TITLE_FONT });
      slide.addText(s.passage, { x: 0.5, y: 2.05, w: 9, h: 0.4, fontSize: 18, italic: true, color: c.accent, fontFace: TITLE_FONT });
      card(slide, { x: 0.5, y: 2.65, w: 9, h: 1.5, fill: c.cardFill, line: c.accent });
      slide.addText(s.mainIdea, { x: 0.75, y: 2.75, w: 8.5, h: 1.3, fontSize: 18, color: TEXT, fontFace: BODY_FONT, valign: "middle", align: "center" });
      slide.addText(s.memoryPreview, { x: 0.5, y: 4.35, w: 9, h: 0.4, fontSize: 11, italic: true, color: TEXT, fontFace: BODY_FONT });
      break;

    case "timeline": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 26, bold: true, color: TEXT, fontFace: TITLE_FONT });
      const n = s.stages.length;
      const totalW = 9.0;
      const segW = totalW / n;
      for (let i = 0; i < n; i++) {
        const x = 0.5 + i * segW;
        const isHere = i === s.here;
        card(slide, { x: x + 0.04, y: 1.15, w: segW - 0.08, h: 0.85, fill: isHere ? c.accent : c.cardFill, line: c.accent });
        slide.addText(s.stages[i], { x: x + 0.04, y: 1.15, w: segW - 0.08, h: 0.85, fontSize: 8.5, bold: isHere, color: TEXT, fontFace: BODY_FONT, align: "center", valign: "middle" });
        if (isHere) {
          slide.addText("▲ WE ARE HERE", { x: x - 0.2, y: 2.02, w: segW + 0.4, h: 0.3, fontSize: 9, bold: true, color: c.accent, fontFace: BODY_FONT, align: "center" });
        }
      }
      card(slide, { x: 0.5, y: 2.6, w: 9, h: 2.4, fill: c.cardFill });
      slide.addText(s.context, { x: 0.75, y: 2.75, w: 8.5, h: 2.1, fontSize: 14, color: TEXT, fontFace: BODY_FONT, valign: "top" });
      break;
    }

    case "scripture": {
      slide.addText(s.label, { x: 0.5, y: 0.3, w: 9, h: 0.4, fontSize: 13, bold: true, color: c.accent, fontFace: BODY_FONT, charSpacing: 1 });
      card(slide, { x: 0.5, y: 0.85, w: 9, h: 3.5, fill: c.cardFill, line: c.accent });
      const runs = [];
      for (const v of s.verses) {
        runs.push({ text: `${v.ref.split(":")[1]} `, options: { bold: true, color: c.accent, fontFace: TITLE_FONT } });
        runs.push({ text: `${v.text}  `, options: { italic: true, color: TEXT, fontFace: TITLE_FONT } });
      }
      slide.addText(runs, { x: 0.8, y: 1.0, w: 8.4, h: 3.2, fontSize: 16, valign: "middle", lineSpacingMultiple: 1.1 });
      slide.addText(s.keyTruth, { x: 0.5, y: 4.5, w: 9, h: 0.65, fontSize: 12, bold: true, color: c.accent, fontFace: BODY_FONT, valign: "middle" });
      break;
    }

    case "whowhatwhen": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: TITLE_FONT });
      const cols = [["WHO", s.who], ["WHAT", s.what], ["WHEN", s.when]];
      const cw = 2.93;
      cols.forEach(([head, body], i) => {
        const x = 0.5 + i * (cw + 0.08);
        card(slide, { x, y: 1.0, w: cw, h: 2.4, fill: c.cardFill, line: c.accent });
        slide.addText(head, { x, y: 1.1, w: cw, h: 0.4, fontSize: 15, bold: true, color: c.accent, fontFace: BODY_FONT, align: "center" });
        slide.addText(body, { x: x + 0.15, y: 1.55, w: cw - 0.3, h: 1.75, fontSize: 10.5, color: TEXT, fontFace: BODY_FONT, valign: "top" });
      });
      card(slide, { x: 0.5, y: 3.55, w: 9, h: 1.55, fill: c.cardFill2 });
      slide.addText([
        { text: "BIBLE TRIAGE\n", options: { bold: true, color: c.accent } },
        { text: s.triage.black + "\n", options: { color: TEXT } },
        { text: s.triage.red + "\n", options: { color: TEXT } },
        { text: s.triage.yellow, options: { color: TEXT } },
      ], { x: 0.7, y: 3.62, w: 8.6, h: 1.42, fontSize: 8.5, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.0 });
      break;
    }

    case "observe": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: TITLE_FONT });
      card(slide, { x: 0.5, y: 0.95, w: 9, h: 4.1, fill: c.cardFill });
      const bullets = s.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, color: TEXT, breakLine: true } }));
      slide.addText(bullets, { x: 0.8, y: 1.05, w: 8.4, h: 3.9, fontSize: 10.5, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.02, paraSpaceAfter: 4 });
      break;
    }

    case "today": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: TITLE_FONT });
      card(slide, { x: 0.5, y: 0.95, w: 9, h: 1.15, fill: c.cardFill2, line: c.accent });
      slide.addText(s.fcf, { x: 0.75, y: 1.02, w: 8.5, h: 1.0, fontSize: 12, bold: true, color: TEXT, fontFace: BODY_FONT, valign: "middle" });
      const qs = s.questions.map((q, i) => ({ text: `Q${i + 1}. ${q}`, options: { color: TEXT, breakLine: true, bullet: false } }));
      card(slide, { x: 0.5, y: 2.25, w: 9, h: 2.8, fill: c.cardFill });
      slide.addText(qs, { x: 0.8, y: 2.4, w: 8.4, h: 2.5, fontSize: 13, fontFace: BODY_FONT, valign: "top", paraSpaceAfter: 8 });
      break;
    }

    case "challenge": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: TITLE_FONT });
      card(slide, { x: 0.5, y: 0.95, w: 9, h: 1.0, fill: c.cardFill2, line: c.accent });
      slide.addText(s.q5, { x: 0.75, y: 1.0, w: 8.5, h: 0.9, fontSize: 12.5, bold: true, color: TEXT, fontFace: BODY_FONT, valign: "middle" });
      slide.addText(s.response, { x: 0.6, y: 2.05, w: 8.8, h: 1.0, fontSize: 11.5, color: TEXT, fontFace: BODY_FONT, valign: "top" });
      card(slide, { x: 0.5, y: 3.15, w: 9, h: 1.9, fill: c.cardFill, line: c.accent });
      slide.addText(s.challenge, { x: 0.75, y: 3.25, w: 8.5, h: 1.7, fontSize: 11.5, color: TEXT, fontFace: BODY_FONT, valign: "top" });
      break;
    }

    case "tomorrow": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 22, bold: true, color: TEXT, fontFace: TITLE_FONT });
      const pw = 4.4;
      s.points.forEach((p, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.5 + col * (pw + 0.2);
        const y = 1.0 + row * 1.75;
        card(slide, { x, y, w: pw, h: 1.6, fill: c.cardFill, line: c.accent });
        slide.addText([
          { text: p.head + "\n", options: { bold: true, color: c.accent, fontSize: 12 } },
          { text: p.body, options: { color: TEXT, fontSize: 10 } },
        ], { x: x + 0.15, y: y + 0.1, w: pw - 0.3, h: 1.4, fontFace: BODY_FONT, valign: "top" });
      });
      slide.addText(`Cross-references: ${s.xrefs.map((r) => `[LINK: ${r}]`).join("  ")}`, { x: 0.5, y: 4.65, w: 9, h: 0.4, fontSize: 9, italic: true, color: c.accent, fontFace: BODY_FONT });
      break;
    }

    case "memory": {
      slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, bold: true, color: c.accent, fontFace: BODY_FONT, charSpacing: 2 });
      card(slide, { x: 0.5, y: 0.9, w: 9, h: 2.0, fill: c.cardFill, line: c.accent });
      slide.addText(`"${s.verse}"`, { x: 0.8, y: 1.0, w: 8.4, h: 1.5, fontSize: 18, italic: true, color: TEXT, fontFace: TITLE_FONT, align: "center", valign: "middle" });
      slide.addText(`— ${s.reference}`, { x: 0.8, y: 2.45, w: 8.4, h: 0.35, fontSize: 13, bold: true, color: c.accent, fontFace: BODY_FONT, align: "center" });
      slide.addText([
        { text: "THEN: ", options: { bold: true, color: c.accent } }, { text: s.then + "\n", options: { color: TEXT } },
        { text: "TODAY: ", options: { bold: true, color: c.accent } }, { text: s.today + "\n", options: { color: TEXT } },
        { text: "TOMORROW: ", options: { bold: true, color: c.accent } }, { text: s.tomorrow, options: { color: TEXT } },
      ], { x: 0.6, y: 3.05, w: 8.8, h: 1.9, fontSize: 12, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.1, paraSpaceAfter: 6 });
      break;
    }
  }
}

module.exports = { build };
