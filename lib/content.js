// Content engine — composes every lesson in Jim Yarborough's teaching voice.
const { TIMELINE } = require("../data/books");

// Deterministic pseudo-random so output is varied but reproducible per lesson.
function seeded(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

const MAX_SCRIPTURE_SLIDES = 22;

// A handful of well-known verses to prefer for memory work when in range.
const FAMOUS = {
  "Genesis 1:1": 1, "Genesis 1:27": 1, "Genesis 3:15": 1, "Genesis 12:3": 1, "Genesis 50:20": 1,
  "Exodus 14:14": 1, "Exodus 20:3": 1, "Exodus 34:6": 1,
  "Joshua 1:9": 1, "Joshua 24:15": 1,
  "Ruth 1:16": 1,
  "1 Samuel 16:7": 1, "Psalms 23:1": 1, "Psalms 1:1": 1, "Psalms 51:10": 1, "Psalms 119:105": 1,
  "Proverbs 1:7": 1, "Proverbs 3:5": 1, "Ecclesiastes 12:13": 1,
  "Isaiah 9:6": 1, "Isaiah 40:31": 1, "Isaiah 53:5": 1,
  "Jeremiah 29:11": 1, "Jeremiah 31:33": 1, "Lamentations 3:22": 1,
  "Ezekiel 36:26": 1, "Daniel 2:21": 1, "Micah 6:8": 1, "Habakkuk 2:4": 1, "Zephaniah 3:17": 1,
  "Malachi 3:10": 1, "Matthew 5:16": 1, "Matthew 6:33": 1, "Matthew 28:19": 1,
  "Mark 10:45": 1, "Luke 19:10": 1, "John 1:1": 1, "John 3:16": 1, "John 14:6": 1,
  "Acts 1:8": 1, "Romans 1:16": 1, "Romans 3:23": 1, "Romans 8:28": 1, "Romans 8:1": 1,
  "1 Corinthians 13:13": 1, "1 Corinthians 15:3": 1, "2 Corinthians 5:17": 1,
  "Galatians 2:20": 1, "Ephesians 2:8": 1, "Philippians 4:13": 1, "Colossians 1:16": 1,
  "1 Thessalonians 4:16": 1, "2 Timothy 3:16": 1, "Titus 2:11": 1,
  "Hebrews 11:1": 1, "Hebrews 12:1": 1, "James 1:22": 1, "1 Peter 2:24": 1,
  "1 John 1:9": 1, "1 John 4:8": 1, "Jude 1:24": 1, "Revelation 3:20": 1, "Revelation 21:4": 1,
};

const KEYWORDS = ["god", "lord", "christ", "jesus", "faith", "love", "grace",
  "life", "saved", "salvation", "righteous", "holy", "covenant", "believe",
  "spirit", "redeem", "mercy", "glory", "king", "promise", "sin", "blood"];

function selectMemoryVerse(book, verses) {
  let best = null;
  let bestScore = -1;
  for (const v of verses) {
    const ref = `${book} ${v.ch}:${v.v}`;
    let score = 0;
    if (FAMOUS[ref]) score += 100;
    const lower = v.text.toLowerCase();
    for (const k of KEYWORDS) if (lower.includes(k)) score += 3;
    const len = v.text.length;
    if (len >= 50 && len <= 190) score += 4;
    else if (len > 190) score -= Math.floor((len - 190) / 40);
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best || verses[0];
}

// Group verses into 2-3 per slide; curate when a part is very large.
function groupScripture(verses) {
  let working = verses;
  let curated = false;
  if (Math.ceil(verses.length / 2) > MAX_SCRIPTURE_SLIDES) {
    curated = true;
    const keep = MAX_SCRIPTURE_SLIDES * 3;
    const step = verses.length / keep;
    const sampled = [];
    for (let i = 0; i < keep; i++) {
      sampled.push(verses[Math.min(verses.length - 1, Math.floor(i * step))]);
    }
    // de-dup while preserving order
    const seen = new Set();
    working = sampled.filter((v) => {
      const k = `${v.ch}:${v.v}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  const groups = [];
  let i = 0;
  while (i < working.length) {
    const size = (groups.length % 2 === 0) ? 3 : 2;
    groups.push(working.slice(i, i + size));
    i += size;
  }
  return { groups, curated };
}

function rangeLabel(book, group) {
  const first = group[0];
  const last = group[group.length - 1];
  if (group.length === 1) return `${book} ${first.ch}:${first.v}`;
  if (first.ch === last.ch) return `${book} ${first.ch}:${first.v}-${last.v}`;
  return `${book} ${first.ch}:${first.v}-${last.ch}:${last.v}`;
}

function keyTruthFor(text, theme, rng) {
  const lower = text.toLowerCase();
  const truths = [];
  if (/(god said|let there be|created|made)/.test(lower))
    truths.push("God speaks, and what was not, is. His word is the engine of reality.");
  if (/(faith|believe|trust)/.test(lower))
    truths.push("Faith is not a feeling — it is taking God at His word and acting on it.");
  if (/(love|loved|kindness|mercy)/.test(lower))
    truths.push("The love of God is not soft sentiment; it is covenant loyalty that will not let go.");
  if (/(sin|wicked|evil|iniquity|transgress)/.test(lower))
    truths.push("Sin is never small. It always costs more than we planned to pay.");
  if (/(holy|holiness|clean|sanctif)/.test(lower))
    truths.push("Holiness is not God's mood; it is His nature. We come on His terms or not at all.");
  if (/(king|reign|throne|kingdom)/.test(lower))
    truths.push("There is a throne behind the thrones, and the One who sits on it never abdicates.");
  if (/(covenant|promise|swore|oath)/.test(lower))
    truths.push("God's promises are not hopes; they are guarantees signed in His own faithfulness.");
  if (/(christ|jesus|saviour|redeem|blood|cross)/.test(lower))
    truths.push("Every line of Scripture is a road, and every road runs to the cross.");
  if (truths.length === 0)
    truths.push(`Don't miss this — ${theme}.`);
  return pick(truths, rng);
}

function triageFor(book) {
  // Primary doctrinal anchor varies by testament/theme; provide all three tiers.
  return {
    black: `BLACK TAG — Primary: The character and authority of God revealed here is non-negotiable. ${book.theme.charAt(0).toUpperCase() + book.theme.slice(1)} stands on who God is. Die on this hill.`,
    red: `RED TAG — Secondary: How a local church orders its life around this truth (worship, leadership, practice) is worth careful conviction, but it shapes church family rather than salvation.`,
    yellow: `YELLOW/GREEN TAG — Tertiary: Timing details, cultural specifics, and disputed minor points here are worth exploring with an open hand. Study them; don't divide over them.`,
  };
}

function buildObservations(book, refStr, verses, rng) {
  const sample = verses.slice(0, 3).map((v) => v.text).join(" ");
  const obs = [
    `THE TEXT ITSELF: Read ${refStr} slowly. Notice God is the acting subject — He initiates before anyone responds. Write this down: grace always moves first.`,
    `STRUCTURE: This passage is built with intention, not accident. Mark the repeated words and the turning point — the Holy Spirit underlines what matters most.`,
    `Leaders of the conservative movement note that ${book.name} must be read in its covenant context, not lifted out as isolated proverbs. The whole book argues one case: ${book.theme}.`,
    `Conservative scholars observe that the original audience — ${book.audience} — heard this as a word for their crisis, not a timeless abstraction. Get the THEN right and the TODAY lands true.`,
    `Watch the contrast between human failure and divine faithfulness. The people stumble; God does not. [LINK: ${book.xrefs[0]}]`,
    `Look at what God is doing here: He is not merely correcting behavior, He is forming a people for His own glory. [LINK: ${book.xrefs[1] || book.xrefs[0]}]`,
    `Here's the thing — this passage refuses to leave you neutral. It diagnoses the heart and then offers the only cure. [LINK: ${book.xrefs[2] || book.xrefs[0]}]`,
    `Every detail is a step off the beach and into the interior. This is the map: ${book.theme}.`,
  ];
  return obs;
}

function buildToday(book, lesson, rng) {
  const fcf = `FALLEN CONDITION FOCUS: This passage exposes our tendency to ${pick([
    "trust our own management of life instead of the God who actually runs it",
    "treat God's clear word as a suggestion we can edit",
    "want the gifts of God while keeping our distance from God Himself",
    "hide our sin and manage our image rather than confess and be cleansed",
    "settle on the beach of easy religion when God is calling us into the deep",
  ], rng)}.`;
  const q = [
    `Where in ${lesson.title.toLowerCase()} do you see your own heart described — not someone else's?`,
    `What does this passage say is true about God that, if you really believed it on Monday morning, would change how you live?`,
    `Be specific: name one place this week where you have been living as if this text were not true.`,
    `What would repentance actually look like here — not in theory, but in your calendar, your wallet, your words?`,
  ];
  return { fcf, questions: q };
}

function buildChallenge(book, lesson, rng) {
  const q5 = `Q5 — PROCLAMATION: Who in your life needs to hear what ${book.name} ${lesson.title} reveals about God, and what is keeping you from telling them this week?`;
  const response = `Here's the thing: a truth this big was never meant to die in a notebook. ${book.theme.charAt(0).toUpperCase() + book.theme.slice(1)} — that is news, and news is for sharing. You don't have to be a scholar. You just have to point at the map and say, "Come and see."`;
  const challenge = `CHALLENGE: This week, get off the beach. Take one concrete step into the interior of God's character that this lesson opened up — and take one person with you. Don't miss this: every trail in ${book.name} runs to the same summit. The God who acts in this passage is the God who put on flesh, went to a cross, and walked out of a tomb so that you could be His. [LINK: ${book.xrefs[0]}] That is where this ends. That is where it always ends — at Jesus.`;
  return { q5, response, challenge };
}

function buildTomorrow(book, lesson) {
  return [
    { head: "THE PROMISE OPENED", body: `${book.name} does not stand alone. It is a thread in one tapestry, and the tapestry is Christ. What is begun here strains forward toward the One who fulfills it. [LINK: ${book.xrefs[0]}]` },
    { head: "THE NEED EXPOSED", body: `This passage shows us a gap no human effort can close — between a holy God and an unholy people. That gap is the silhouette of a cross. The diagnosis here is precisely the wound the gospel heals.` },
    { head: "THE SHADOW AND THE SUBSTANCE", body: `Conservative scholars observe that the patterns here — covenant, sacrifice, kingship, deliverance — are shadows cast backward by Jesus. See the shadow, then look up and find the One casting it. [LINK: ${book.xrefs[1] || book.xrefs[0]}]` },
    { head: "THE SUMMIT", body: `Every trail leads to the same summit. ${lesson.title} lifts our eyes from history, through our own hearts, to the risen Christ who reigns now and is coming again. [LINK: ${book.xrefs[2] || book.xrefs[0]}]` },
  ];
}

// ---- Word-for-word scripts (Jim's voice) ----

function titleScript(book, lesson, lessonNumber, mainIdea, partLabel) {
  return [
    `Welcome back to The Continent of God. I'm Jim, and I want to say it again the way I say it every single week: the Bible is not a pond, it is a continent. And most Christians — good, sincere, church-going Christians — never leave the beach. They wade in ankle-deep, get a little wet, and go home.`,
    `[PAUSE]`,
    `Not us. Not today. Today we get off the beach. This is ${book.name}, Lesson ${lessonNumber}${partLabel ? ", " + partLabel : ""} — ${lesson.title}. And this is the map.`,
    `Here's our main idea, and I want you to write this down: ${mainIdea}`,
    `That is the trail we are walking today. So grab your Bible, grab a pen, and let's take one more step into the interior.`,
    `[PRAY] Father, get us off the beach. Open the Book and open our hearts, and lead us all the way to Your Son. In Jesus' name, amen.`,
  ].join("\n\n");
}

function timelineScript(book, lesson, tlIndex, ctx) {
  return [
    `Before we read a word, you have to know where you are standing on the map. The whole story of God runs in one line: Creation and Fall, then Abraham and the Promise, then the Exodus and the Law, then Kings and the Temple, then Exile and Return, then Jesus fulfills it all, then the Church and the Spirit, and finally the New Creation.`,
    `Right here — ${TIMELINE[tlIndex]} — that's where we are. That's the "you are here" pin on the map.`,
    ctx,
    `Don't miss this: you cannot understand what God is saying until you know who He was saying it to and what He was doing in that moment. Get the THEN right, and the TODAY and the TOMORROW will land with full weight.`,
  ].join("\n\n");
}

function scriptureScript(book, label, group, keyTruth, rng) {
  const verseRead = group.map((v) => `Verse ${v.v}: "${v.text}"`).join(" ");
  return [
    `Look with me at ${label}. Follow along in the King James as I read.`,
    verseRead,
    `[PAUSE]`,
    `Now here's the thing — look at what God is doing here. ${keyTruth}`,
    `Read it again in your heart and let it settle. This is not religious decoration. This is the living word of God, and it is doing surgery on us right now.`,
  ].join("\n\n");
}

function whoWhatWhenScript(book, refStr) {
  return [
    `Let's slow down and do a little Bible triage on the facts. THEN — the who, the what, and the when.`,
    `WHO. ${book.name} comes to us through ${book.author}, written to ${book.audience}. Real people, real place, real pressure.`,
    `WHAT. The heartbeat of this book is one thing: ${book.theme}. Everything in ${refStr} serves that one argument.`,
    `WHEN. We are looking at roughly ${book.date}. Hold that date in your mind — it keeps us honest and keeps the text in its own world before we drag it into ours.`,
    `Write this down: context is not optional. It is the floor we stand on.`,
  ].join("\n\n");
}

function observeScript(book, observations) {
  return [
    `Now we observe. Before we apply anything, we have to actually see what is on the page. So let's walk the trail slowly.`,
    observations.map((o, i) => `Observation ${i + 1}. ${o.replace(/\[LINK: [^\]]+\]/g, "").trim()}`).join("\n\n"),
    `Do you see it? This is what I mean by getting off the beach. The treasure was never in the shallows. It is right here in the details of the text.`,
  ].join("\n\n");
}

function todayScript(book, lesson, today) {
  return [
    `That was THEN. Now TODAY. Because if all we do is learn ancient history, we have missed the whole point. This Book reads us.`,
    today.fcf,
    `So let's get personal. Four questions — and don't answer the easy way.`,
    today.questions.map((q, i) => `Question ${i + 1}. ${q}`).join("\n\n"),
    `[PAUSE] Sit in that. Don't rush past the discomfort. That discomfort is the Surgeon's hand.`,
  ].join("\n\n");
}

function challengeScript(book, lesson, challenge) {
  return [
    challenge.q5,
    challenge.response,
    challenge.challenge,
  ].join("\n\n");
}

function tomorrowScript(book, lesson, tomorrow) {
  return [
    `THEN grounded us. TODAY cut us. Now TOMORROW lifts us — because every trail on this continent leads to one summit, and His name is Jesus.`,
    tomorrow.map((t) => `${t.head}. ${t.body.replace(/\[LINK: [^\]]+\]/g, "").trim()}`).join("\n\n"),
    `Don't miss this: the Old shadows and the New light are one story. This is the map, and the map ends at an empty tomb.`,
  ].join("\n\n");
}

function memoryScript(book, lesson, mv, summaries) {
  return [
    `Let's seal it with the memory verse. Hide this one in your heart: "${mv.text}" — that's ${book.name} ${mv.ch}:${mv.v}.`,
    `Here is the whole trail in three sentences. THEN: ${summaries.then} TODAY: ${summaries.today} TOMORROW: ${summaries.tomorrow}`,
    `[PRAY] Father, thank You for taking us off the beach today. Write this word on our hearts. Make us doers and not hearers only, and let everything we have seen drive us deeper into Jesus, in whose name we pray, amen.`,
    `That's Lesson done. Keep walking. The interior is wide, and the King is good. I'll see you on the next trail.`,
  ].join("\n\n");
}

function buildLesson({ book, lesson, refObj, refStr, verses, lessonNumber, partLabel }) {
  const seed = `${book.name}|${lesson.id}|${partLabel || ""}`;
  const rng = seeded(seed);
  const tlIndex = lesson.tl != null ? lesson.tl : book.tl;

  const mainIdea = `${capitalize(book.theme)} — and ${lesson.title} is the place God makes it unmistakable.`;
  const mv = selectMemoryVerse(book.name, verses);
  const { groups, curated } = groupScripture(verses);

  const ctx = `${capitalize(book.audience)} stood at a hinge of history. ${capitalize(book.theme)}. God was not speaking into a vacuum; He was speaking into their crisis, their hope, and their need — and the same God speaks to us through these very words.`;

  const observations = buildObservations(book, refStr, verses, rng);
  const today = buildToday(book, lesson, rng);
  const challenge = buildChallenge(book, lesson, rng);
  const tomorrow = buildTomorrow(book, lesson);
  const triage = triageFor(book);

  const summaries = {
    then: `${capitalize(book.author)} delivered ${lesson.title} to ${book.audience} around ${book.date}.`,
    today: `It exposes our hearts and calls us off the beach into real repentance and trust.`,
    tomorrow: `And it points, like every passage, straight to the risen Christ.`,
  };

  const slides = [];

  // Slide 1 — Title
  slides.push({
    type: "title",
    seriesLabel: `${book.name.toUpperCase()} BIBLE STUDY · LESSON ${lessonNumber}${partLabel ? " · " + partLabel.toUpperCase() : ""}`,
    title: lesson.title,
    passage: refStr,
    mainIdea,
    memoryPreview: `Memory Verse: ${book.name} ${mv.ch}:${mv.v}`,
    script: titleScript(book, lesson, lessonNumber, mainIdea, partLabel),
  });

  // Slide 2 — Timeline
  slides.push({
    type: "timeline",
    title: "God's Story — The Timeline",
    stages: TIMELINE,
    here: tlIndex,
    context: ctx,
    script: timelineScript(book, lesson, tlIndex, ctx),
  });

  // Scripture slides
  for (const group of groups) {
    const label = rangeLabel(book.name, group);
    const kt = keyTruthFor(group.map((v) => v.text).join(" "), book.theme, rng);
    slides.push({
      type: "scripture",
      label: `SCRIPTURE · ${label} (KJV)`,
      verses: group.map((v) => ({ ref: `${v.ch}:${v.v}`, text: v.text })),
      keyTruth: `KEY TRUTH: ${kt}`,
      script: scriptureScript(book, label, group, kt, rng),
    });
  }

  // THEN — Who/What/When
  slides.push({
    type: "whowhatwhen",
    title: "THEN · WHO / WHAT / WHEN",
    who: `Author: ${book.author}\nAudience: ${book.audience}\nKey people emerge through the narrative of ${lesson.title}.`,
    what: `Key theme: ${capitalize(book.theme)}.\nKey structure: ${refStr}.\nKey doctrine: the character and saving purpose of God.`,
    when: `Date: ${book.date}.\nStage: ${TIMELINE[tlIndex]}.\nContext: ${book.audience}.`,
    triage,
    script: whoWhatWhenScript(book, refStr),
  });

  // THEN — Observe
  slides.push({
    type: "observe",
    title: "THEN · OBSERVE",
    bullets: observations,
    script: observeScript(book, observations),
  });

  // TODAY — Q1-Q4
  slides.push({
    type: "today",
    title: "TODAY · DIAGNOSIS (Q1-Q4)",
    fcf: today.fcf,
    questions: today.questions,
    script: todayScript(book, lesson, today),
  });

  // TODAY — Q5 + Challenge
  slides.push({
    type: "challenge",
    title: "TODAY · Q5 + CHALLENGE",
    q5: challenge.q5,
    response: challenge.response,
    challenge: challenge.challenge,
    script: challengeScript(book, lesson, challenge),
  });

  // TOMORROW — Gospel thread
  slides.push({
    type: "tomorrow",
    title: "TOMORROW · THE GOSPEL THREAD",
    points: tomorrow,
    xrefs: book.xrefs,
    script: tomorrowScript(book, lesson, tomorrow),
  });

  // Memory verse
  slides.push({
    type: "memory",
    title: "MEMORY VERSE",
    verse: mv.text,
    reference: `${book.name} ${mv.ch}:${mv.v}`,
    then: summaries.then,
    today: summaries.today,
    tomorrow: summaries.tomorrow,
    script: memoryScript(book, lesson, mv, summaries),
  });

  return {
    meta: { book, lesson, refStr, mainIdea, mv, curated, lessonNumber, partLabel, tlIndex },
    slides,
  };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = { buildLesson };
