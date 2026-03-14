import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exists, listChapterFiles, readTextIfExists, splitFrontmatter } from "./lib/novel-project.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const storyDataPath = path.join(docsDir, "story-data.js");
const manuscriptDir = path.join(rootDir, "project", "manuscript");
const fullNovelPath = path.join(manuscriptDir, "full_novel.md");
const projectOverviewPath = path.join(rootDir, "project", "00_project_overview.md");
const projectAssetsDir = path.join(rootDir, "project", "assets");
const templateDir = path.join(rootDir, "soudoku-novel-builder", "assets", "mobile-reader");

const palettes = [
  { mood: "sunrise" },
  { mood: "grove" },
  { mood: "mist" },
  { mood: "river" },
  { mood: "ember" },
  { mood: "twilight" },
  { mood: "night" },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toSceneId(chapterNumber, talkNumber, sectionNumber) {
  return `scene-${String(chapterNumber).padStart(3, "0")}-${String(talkNumber).padStart(3, "0")}-${String(sectionNumber).padStart(3, "0")}`;
}

function toPartKey(label) {
  if (label.includes("サトー")) {
    return "sato";
  }
  if (label.includes("セラ")) {
    return "sera";
  }
  return (
    label
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "part"
  );
}

function normalizeParagraph(buffer) {
  const keepLineBreaks =
    buffer.length > 1 &&
    buffer.every((line) => /^(?:――|—)/.test(line));

  return buffer.join(keepLineBreaks ? "\n" : "").trim();
}

function classifyBeat(text) {
  if (/^[「『]/.test(text)) {
    return "dialogue";
  }
  if (/^(?:――|—|---|《|###?)/.test(text) || text.includes("――")) {
    return "emphasis";
  }
  return "narration";
}

function buildSummary(paragraphs) {
  const combined = paragraphs.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
  if (combined.length <= 88) {
    return combined;
  }
  return `${combined.slice(0, 88)}…`;
}

function buildTitleDisplayLines(title, subtitle) {
  if (subtitle) {
    return [title, "", subtitle];
  }

  const commaIndex = title.indexOf("、");
  if (commaIndex !== -1 && commaIndex < title.length - 1) {
    return [title.slice(0, commaIndex + 1), title.slice(commaIndex + 1)];
  }

  const separatorIndex = title.indexOf(" - ");
  if (separatorIndex !== -1) {
    return [title.slice(0, separatorIndex), title.slice(separatorIndex + 3)];
  }

  return [title];
}

async function loadManuscript() {
  const fullNovel = await readTextIfExists(fullNovelPath);
  if (fullNovel.trim()) {
    return fullNovel;
  }

  const chapterFiles = await listChapterFiles(manuscriptDir);
  const chapters = await Promise.all(
    chapterFiles.map((fileName) => readFile(path.join(manuscriptDir, fileName), "utf8")),
  );
  return chapters.join("\n\n");
}

function isPartLine(line) {
  return (
    line.startsWith("##### ") ||
    line === "サトーパート" ||
    line === "セラパート"
  );
}

function partLabelFromLine(line) {
  return line.startsWith("##### ") ? line.replace(/^#####\s+/, "").trim() : line.trim();
}

function parseMarkdown(markdown, fallbackTitle = "Web Novel") {
  const lines = markdown.split(/\r?\n/);
  let title = fallbackTitle;
  let chapterCount = 0;
  let talkCount = 0;
  let currentChapter = null;
  let currentTalk = null;
  let currentSection = null;
  let currentPart = null;
  let paragraphBuffer = [];
  const scenes = [];

  function ensureChapter() {
    if (currentChapter) {
      return currentChapter;
    }
    chapterCount += 1;
    currentChapter = {
      key: `chapter-${String(chapterCount).padStart(2, "0")}`,
      label: `第${chapterCount}章`,
      title: `第${chapterCount}章`,
      number: chapterCount,
      index: chapterCount - 1,
    };
    return currentChapter;
  }

  function ensureTalk() {
    if (currentTalk) {
      return currentTalk;
    }
    const chapter = ensureChapter();
    const chapterTalkIndex = (currentChapter?.talkIndex ?? 0) + 1;
    currentChapter.talkIndex = chapterTalkIndex;
    talkCount += 1;
    currentTalk = {
      key: `${chapter.key}-talk-${String(chapterTalkIndex).padStart(2, "0")}`,
      label: `第${chapterTalkIndex}話`,
      title: `第${chapterTalkIndex}話`,
      number: chapterTalkIndex,
      chapterKey: chapter.key,
      chapterLabel: chapter.label,
      chapterTitle: chapter.title,
      chapterNumber: chapter.number,
      chapterIndex: chapter.index,
      index: talkCount - 1,
      sectionIndex: 0,
    };
    return currentTalk;
  }

  function flushParagraph() {
    if (!currentPart || paragraphBuffer.length === 0) {
      return;
    }

    const paragraph = normalizeParagraph(paragraphBuffer);
    paragraphBuffer = [];
    if (paragraph) {
      currentPart.paragraphs.push(paragraph);
    }
  }

  function flushPart() {
    flushParagraph();
    if (!currentPart) {
      return;
    }
    if (currentPart.paragraphs.length > 0) {
      scenes.push(currentPart);
    }
    currentPart = null;
  }

  function flushSection() {
    flushPart();
    currentSection = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "").trim();
      continue;
    }

    if (line.startsWith("## ")) {
      flushSection();
      chapterCount += 1;
      currentChapter = {
        key: `chapter-${String(chapterCount).padStart(2, "0")}`,
        label: `第${chapterCount}章`,
        title: line.replace(/^##\s+/, "").trim(),
        number: chapterCount,
        index: chapterCount - 1,
        talkIndex: 0,
      };
      currentTalk = null;
      continue;
    }

    if (line.startsWith("### ")) {
      flushSection();
      const chapter = ensureChapter();
      const chapterTalkIndex = (chapter.talkIndex ?? 0) + 1;
      chapter.talkIndex = chapterTalkIndex;
      talkCount += 1;
      currentTalk = {
        key: `${chapter.key}-talk-${String(chapterTalkIndex).padStart(2, "0")}`,
        label: `第${chapterTalkIndex}話`,
        title: line.replace(/^###\s+/, "").trim(),
        number: chapterTalkIndex,
        chapterKey: chapter.key,
        chapterLabel: chapter.label,
        chapterTitle: chapter.title,
        chapterNumber: chapter.number,
        chapterIndex: chapter.index,
        index: talkCount - 1,
        sectionIndex: 0,
      };
      continue;
    }

    if (line.startsWith("#### ")) {
      flushSection();
      const talk = ensureTalk();
      const sectionNumber = (talk.sectionIndex ?? 0) + 1;
      talk.sectionIndex = sectionNumber;
      currentSection = {
        id: toSceneId(talk.chapterNumber, talk.number, sectionNumber),
        title: line.replace(/^####\s+/, "").trim(),
        sectionLabel: line.replace(/^####\s+/, "").trim().split(/[　 ]/)[0] || `第${sectionNumber}節`,
        chapterKey: talk.chapterKey,
        chapterLabel: talk.chapterLabel,
        chapterTitle: talk.chapterTitle,
        chapterIndex: talk.chapterIndex,
        talkKey: talk.key,
        talkLabel: talk.label,
        talkTitle: talk.title,
        talkIndex: talk.index,
      };
      continue;
    }

    if (isPartLine(line)) {
      flushPart();
      if (!currentSection) {
        continue;
      }

      const partLabel = partLabelFromLine(line);
      const partKey = toPartKey(partLabel);
      currentPart = {
        id: `${currentSection.id}-${partKey}`,
        sectionId: currentSection.id,
        title: currentSection.title,
        sectionLabel: currentSection.sectionLabel,
        partKey,
        partLabel,
        chapterKey: currentSection.chapterKey,
        chapterLabel: currentSection.chapterLabel,
        chapterTitle: currentSection.chapterTitle,
        chapterIndex: currentSection.chapterIndex,
        talkKey: currentSection.talkKey,
        talkLabel: currentSection.talkLabel,
        talkTitle: currentSection.talkTitle,
        talkIndex: currentSection.talkIndex,
        paragraphs: [],
      };
      continue;
    }

    if (!currentPart) {
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushSection();

  return { title, scenes };
}

async function cleanDocsDir() {
  const entries = await readdir(docsDir).catch(() => []);
  await Promise.all(
    entries.map((entry) => rm(path.join(docsDir, entry), { recursive: true, force: true })),
  );
}

async function copyGeneratedAssets(sceneIds = []) {
  const titleSource = path.join(projectAssetsDir, "title", "title-cover.webp");
  if (await exists(titleSource)) {
    await mkdir(path.join(docsDir, "images", "title"), { recursive: true });
    await copyFile(titleSource, path.join(docsDir, "images", "title", "title-cover.webp"));
  }

  const characterDir = path.join(projectAssetsDir, "characters");
  if (await exists(characterDir)) {
    const characterFiles = (await readdir(characterDir)).filter(
      (fileName) => /\.png$/i.test(fileName) && !/\.raw\./i.test(fileName),
    );
    await mkdir(path.join(docsDir, "images", "characters"), { recursive: true });
    for (const fileName of characterFiles) {
      await copyFile(
        path.join(characterDir, fileName),
        path.join(docsDir, "images", "characters", fileName),
      );
    }
  }

  const worldDir = path.join(projectAssetsDir, "world");
  if (await exists(worldDir)) {
    const worldFiles = (await readdir(worldDir)).filter((fileName) => /\.webp$/i.test(fileName));
    await mkdir(path.join(docsDir, "images", "world"), { recursive: true });
    for (const fileName of worldFiles) {
      await copyFile(
        path.join(worldDir, fileName),
        path.join(docsDir, "images", "world", fileName),
      );
    }
  }

  const episodeDir = path.join(projectAssetsDir, "episodes");
  if (await exists(episodeDir)) {
    const allowed = new Set(sceneIds.map((id) => `${id}.webp`));
    const episodeFiles = (await readdir(episodeDir)).filter(
      (fileName) => /\.webp$/i.test(fileName) && (allowed.size === 0 || allowed.has(fileName)),
    );
    await mkdir(path.join(docsDir, "images", "episodes"), { recursive: true });
    for (const fileName of episodeFiles) {
      await copyFile(
        path.join(episodeDir, fileName),
        path.join(docsDir, "images", "episodes", fileName),
      );
    }
  }
}

async function loadTemplates() {
  const [indexTemplate, appJs, stylesCss] = await Promise.all([
    readFile(path.join(templateDir, "index.html"), "utf8"),
    readFile(path.join(templateDir, "app.js"), "utf8"),
    readFile(path.join(templateDir, "styles.css"), "utf8"),
  ]);
  return { indexTemplate, appJs, stylesCss };
}

async function main() {
  const [overviewSource, manuscript, templates] = await Promise.all([
    readTextIfExists(projectOverviewPath),
    loadManuscript(),
    loadTemplates(),
  ]);

  const { attributes: meta } = splitFrontmatter(overviewSource || "");
  const parsed = parseMarkdown(manuscript, meta.title || "Web Novel");
  const title = meta.title || parsed.title || "Web Novel";
  const subtitle = meta.subtitle || "";
  const titleImagePath = path.join(projectAssetsDir, "title", "title-cover.webp");

  const story = {
    title,
    subtitle,
    author: meta.author || "",
    genre: meta.genre || "",
    slug: meta.slug || "",
    status: meta.status || "draft",
    updatedAt: new Date().toISOString(),
    titleDisplayLines: buildTitleDisplayLines(title, subtitle),
    titleImage: (await exists(titleImagePath)) ? "./images/title/title-cover.webp" : null,
    titleImageAlt: `${title} のタイトルビジュアル`,
    generatedAt: new Date().toISOString(),
    talkCount: new Set(parsed.scenes.map((scene) => scene.talkKey)).size,
    sceneCount: parsed.scenes.length,
    scenes: [],
  };

  for (const [index, scene] of parsed.scenes.entries()) {
    const palette = palettes[scene.chapterIndex % palettes.length];
    const beats = scene.paragraphs.map((text, beatIndex) => ({
      id: `${scene.id}-beat-${String(beatIndex + 1).padStart(3, "0")}`,
      index: beatIndex,
      kind: classifyBeat(text),
      rawText: text,
    }));

    story.scenes.push({
      id: scene.id,
      index,
      mood: palette.mood,
      chapterKey: scene.chapterKey,
      chapterLabel: scene.chapterLabel,
      chapterTitle: scene.chapterTitle,
      talkKey: scene.talkKey,
      talkLabel: scene.talkLabel,
      talkTitle: scene.talkTitle,
      talkIndex: scene.talkIndex,
      sectionLabel: scene.sectionLabel,
      partKey: scene.partKey,
      partLabel: scene.partLabel,
      title: scene.title,
      summary: buildSummary(scene.paragraphs),
      image: `./images/episodes/${scene.id}.webp`,
      alt: `${scene.chapterTitle}の${scene.title} ${scene.partLabel}をイメージしたビジュアルカード`,
      beatCount: beats.length,
      beats,
    });
  }

  await mkdir(docsDir, { recursive: true });
  await cleanDocsDir();
  await copyGeneratedAssets(parsed.scenes.map((scene) => scene.id));

  const description = `${title}を、画像付きの縦スクロールWeb小説として読める静的サイト。`;
  const indexHtml = templates.indexTemplate
    .replace("__TITLE__", escapeHtml(title))
    .replace("__DESCRIPTION__", escapeHtml(description));

  await Promise.all([
    writeFile(storyDataPath, `window.STORY_DATA = ${JSON.stringify(story, null, 2)};\n`, "utf8"),
    writeFile(path.join(docsDir, "index.html"), indexHtml, "utf8"),
    writeFile(path.join(docsDir, "app.js"), templates.appJs, "utf8"),
    writeFile(path.join(docsDir, "styles.css"), templates.stylesCss, "utf8"),
    writeFile(path.join(docsDir, ".nojekyll"), "", "utf8"),
  ]);

  process.stdout.write(`Built mobile web novel: ${story.sceneCount} scenes -> docs\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
