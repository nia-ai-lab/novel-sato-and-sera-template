import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStoryDataSource } from "./lib/novel-project.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const storyDataPath = path.join(rootDir, "docs", "story-data.js");
const characterRefsPath = path.join(rootDir, "prompts", "scene-character-references.json");
const backgroundPromptPath = path.join(rootDir, "prompts", "background-concepts.json");
const outputPath = path.join(rootDir, "prompts", "episode-image-manifest.json");

function buildSceneCorpus(scene) {
  return [
    scene.chapterTitle,
    scene.talkTitle,
    scene.title,
    scene.partLabel,
    scene.summary,
    ...scene.beats.map((beat) => beat.rawText),
  ].join("\n");
}

function detectCast(scene, characters) {
  const corpus = buildSceneCorpus(scene);
  return characters
    .filter((entry) => {
      const aliases = [entry.name, ...(entry.aliases || [])].filter(Boolean);
      return aliases.some((alias) => corpus.includes(alias));
    })
    .map((entry) => entry.id);
}

function isSeraPart(scene) {
  return scene.partKey === "sera" || String(scene.partLabel || "").includes("セラ");
}

function buildSettingContext(scene, backgroundEntry) {
  if (!backgroundEntry?.prompt) {
    return "";
  }

  const perspectiveNote = isSeraPart(scene)
    ? "Use the same talk-level setting as the shared stage, but show it from a hidden security-side, reverse angle, blind spot, rear approach, service path, or protected backside when appropriate."
    : "Use the same talk-level setting as the public-facing stage that Sato naturally notices first.";

  return [
    `Shared talk background: ${backgroundEntry.name || backgroundEntry.id}.`,
    `Background reference prompt: ${backgroundEntry.prompt}`,
    "Preserve the same place, architecture, time of day, weather, lighting, and atmosphere unless the scene text explicitly changes them.",
    perspectiveNote,
  ].join(" ");
}

function buildPrompt(scene, refEntries, override, refsConfig, backgroundEntry) {
  const castNotes = refEntries
    .map((entry) => {
      const visualRules = entry.visualRules ? ` ${entry.visualRules}` : "";
      return `${entry.id}: ${entry.name}.${visualRules}`;
    })
    .join(" ");

  const focusNote =
    override.focusCharacterIds?.length > 0
      ? `Focus characters: ${override.focusCharacterIds.join(", ")}. Keep them clearly readable in the foreground or midground.`
      : "";

  const continuityNote =
    override.continuityNotes?.length > 0
      ? `Continuity notes: ${override.continuityNotes.join(" ")}`
      : "";

  const promptSuffix = override.promptSuffix ? ` ${override.promptSuffix}` : "";
  const settingContext = buildSettingContext(scene, backgroundEntry);

  return [
    "Create one cinematic 16:9 scene illustration for a serial web novel.",
    "Do not render any readable text, chapter numbers, talk labels, section labels, captions, subtitles, logos, or UI overlays inside the image.",
    `Story context: ${scene.chapterTitle}${scene.talkTitle ? ` / ${scene.talkTitle}` : ""}.`,
    settingContext,
    `Scene focus: ${scene.title} / ${scene.partLabel}.`,
    `Summary: ${scene.summary}`,
    `Key beats: ${scene.beats.slice(0, 4).map((beat) => beat.rawText).join(" ")}`,
    refEntries.length > 0
      ? `Use the supplied character reference images to preserve these canonical looks: ${castNotes}`
      : "No recurring character reference image is required for this scene.",
    "Compose for a 1920x1080 delivery, keep main subjects near the center, and preserve enough left/right safe margin so the image still reads well in portrait scrolling mode.",
    focusNote,
    continuityNote,
    refsConfig.spec?.promptSuffix || "",
    promptSuffix,
  ]
    .filter(Boolean)
    .join(" ");
}

function findBackgroundEntry(scene, backgrounds) {
  return (
    backgrounds.find((entry) => entry.talkKey === scene.talkKey) ||
    backgrounds.find(
      (entry) =>
        entry.chapterLabel === scene.chapterLabel &&
        entry.talkLabel === scene.talkLabel,
    ) ||
    null
  );
}

async function main() {
  const [storySource, refsSource, backgroundSource] = await Promise.all([
    readFile(storyDataPath, "utf8"),
    readFile(characterRefsPath, "utf8"),
    readFile(backgroundPromptPath, "utf8"),
  ]);

  const story = parseStoryDataSource(storySource);
  const refsConfig = JSON.parse(refsSource);
  const backgroundConfig = JSON.parse(backgroundSource);
  const characters = refsConfig.characters || [];
  const backgrounds = backgroundConfig.backgrounds || [];
  const sceneOverrides = refsConfig.sceneOverrides || {};
  const spec = {
    fixedWidth: refsConfig.spec?.fixedWidth ?? 1920,
    fixedHeight: refsConfig.spec?.fixedHeight ?? 1080,
    outputDir: refsConfig.spec?.outputDir ?? "project/assets/episodes",
    globalPrompt:
      refsConfig.spec?.globalPrompt ??
      "Create a cinematic, single-moment web novel illustration with grounded fantasy realism.",
    globalNegativePrompt:
      refsConfig.spec?.globalNegativePrompt ??
      "text, logo, watermark, split panel, multiple scenes in one image, deformed anatomy",
    defaultModel: refsConfig.spec?.defaultModel ?? "gemini-3.1-flash-image-preview",
    promptSuffix: refsConfig.spec?.promptSuffix ?? "",
  };

  const episodes = story.scenes.map((scene) => {
    const override = sceneOverrides[scene.id] || {};
    const backgroundEntry = findBackgroundEntry(scene, backgrounds);
    const detectedCast = detectCast(scene, characters);
    const referenceCharacterIds = [
      ...(override.referenceCharacterIds || []),
      ...detectedCast,
    ].filter((value, index, array) => array.indexOf(value) === index);

    const refEntries = referenceCharacterIds
      .map((id) => characters.find((entry) => entry.id === id))
      .filter(Boolean);

    return {
      id: scene.id,
      title: scene.title,
      partLabel: scene.partLabel,
      chapterTitle: scene.chapterTitle,
      chapterLabel: scene.chapterLabel,
      talkKey: scene.talkKey,
      talkTitle: scene.talkTitle,
      talkLabel: scene.talkLabel,
      sourceSummary: scene.summary,
      cast: detectedCast,
      referenceCharacterIds,
      focusCharacterIds: override.focusCharacterIds || [],
      continuityNotes: override.continuityNotes || [],
      backgroundPromptId: backgroundEntry?.id || null,
      backgroundPromptName: backgroundEntry?.name || null,
      backgroundPrompt: backgroundEntry?.prompt || null,
      model: override.model || spec.defaultModel,
      prompt: buildPrompt(scene, refEntries, override, refsConfig, backgroundEntry),
      negativePrompt:
        override.negativePrompt ||
        "Do not redesign recurring characters away from their canonical portraits.",
      output: `${spec.outputDir}/${scene.id}.webp`,
    };
  });

  const manifest = {
    spec,
    source: {
      storyData: "docs/story-data.js",
      characterReferences: "prompts/scene-character-references.json",
      backgroundPrompts: "prompts/background-concepts.json",
    },
    episodes,
  };

  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(
    `Wrote ${episodes.length} episode prompts to ${path.relative(rootDir, outputPath)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
