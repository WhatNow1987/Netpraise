// YouTube & SEO package (.txt) builder — one per lesson.
const fs = require("fs");

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

function build(lessonModel, book, outPath) {
  const m = lessonModel.meta;
  const lessonLabel = `Lesson ${m.lessonNumber}${m.partLabel ? " " + m.partLabel : ""}`;
  const title = m.lesson.title;
  const refShort = m.refStr;

  const videoTitle = truncate(`${book.name} ${lessonLabel}: ${title} | Bible Study`, 60);

  const videoDescription =
`Get off the beach. The Bible is a continent, and most Christians never leave the shallows — this is the map that takes you into the interior.

In this lesson of The Continent of God Bible Study, Jim Yarborough opens ${book.name} ${lessonLabel} — "${title}" (${refShort}, KJV). We walk the text the way we walk every passage: THEN grounds it in history, TODAY cuts it into your real life, and TOMORROW lifts your eyes to the Gospel of Jesus Christ.

You'll learn the heart of ${book.name}: ${m.book.theme}. We use Bible Triage to sort primary, secondary, and tertiary truths, read the Scripture word-for-word, and end — like every trail on this continent — at the foot of the cross and the empty tomb.

If this feeds you, do three things: SUBSCRIBE so you never miss a lesson, LIKE to help others find the map, and SHARE it with one person who needs to get off the beach. Download the full study guide and follow the whole 66-book journey in the NetPraise app.

This is the map. Let's take one more step into the interior.

#BibleStudy #${book.name.replace(/[^A-Za-z0-9]/g, "")} #Gospel #ContinentOfGod`;

  const tags = [
    "Bible study", "Christian", "Scripture", "KJV", "Bible teaching",
    "verse by verse", book.name, `${book.name} ${title}`, `${book.name} Bible study`,
    title, refShort, "Jim Yarborough", "Continent of God", "NetPraise",
    "Then Today Tomorrow", "Bible triage", "expository teaching", "Gospel",
    "Jesus", "discipleship", "Sunday school", "small group study",
    book.testament === "OT" ? "Old Testament" : "New Testament", "Christianity",
  ].slice(0, 25).join(", ");

  const metaTitle = truncate(`${book.name} ${title} Bible Study (${lessonLabel})`, 60);
  const metaDescription = truncate(
    `${book.name} ${lessonLabel}: ${title} (${refShort}). A Then/Today/Tomorrow Bible study with Jim Yarborough — get off the beach and into the Word.`, 160);

  const focusKeyword = `${book.name} ${title} Bible study`;
  const secondary = [
    refShort, `${book.name} commentary`, `${title} meaning`,
    `${book.name} ${lessonLabel}`, "verse by verse Bible study",
    "Then Today Tomorrow method", "Gospel-centered study",
  ].join(", ");

  const blogIntro =
`Here's the thing about the Bible: it isn't a pond you can wade across in an afternoon. It's a continent. And most of us, if we're honest, have spent our whole Christian lives on the beach — ankle-deep in the same few familiar verses, never once striking out into the vast interior God laid open for us. ${book.name} ${lessonLabel}, "${title}," is the next step off that beach. In this study we walk ${refShort} the way we walk every trail: we ground it in history (THEN), we let it cut into our actual lives (TODAY), and we follow it all the way to its summit in Jesus Christ (TOMORROW). ${m.book.theme.charAt(0).toUpperCase() + m.book.theme.slice(1)} — and this lesson makes it unmistakable. Don't miss this one. Watch the full video below, or download the study guide and grab your Bible, a pen, and a friend — and let's get off the beach together.`;

  const out =
`====================================================================
THE CONTINENT OF GOD — YOUTUBE & SEO PACKAGE
${book.name} ${lessonLabel} — ${title}
Passage: ${refShort} (KJV)
====================================================================

VIDEO TITLE (YouTube):
${videoTitle}

--------------------------------------------------------------------
VIDEO DESCRIPTION (YouTube):
${videoDescription}

--------------------------------------------------------------------
YOUTUBE TAGS:
${tags}

--------------------------------------------------------------------
SEO META TITLE (website):
${metaTitle}

--------------------------------------------------------------------
SEO META DESCRIPTION (website):
${metaDescription}

--------------------------------------------------------------------
FOCUS KEYWORD:
${focusKeyword}

--------------------------------------------------------------------
SECONDARY KEYWORDS:
${secondary}

--------------------------------------------------------------------
BLOG POST INTRO (150 words):
${blogIntro}
====================================================================
`;

  fs.writeFileSync(outPath, out);
}

module.exports = { build };
