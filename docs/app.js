const novel = document.getElementById("novel");
const progressBar = document.getElementById("progressBar");
const deviceScroll = document.getElementById("deviceScroll");
const menuToggle = document.getElementById("menuToggle");
const copyVisibilityToggle = document.getElementById("copyVisibilityToggle");
const menuBackdrop = document.getElementById("menuBackdrop");
const chapterMenu = document.getElementById("chapterMenu");
const chapterMenuList = document.getElementById("chapterMenuList");

const story = window.STORY_DATA;

let sceneElements = [];
let activeSceneIndex = 0;
let ticking = false;
let talkTargets = [];
let sceneMidpoints = [];
let talkOffsets = [];
let currentTalkKey = null;
let talkLinkElements = [];
let copyPanels = [];
let landscapeCopyOffset = 0;
let landscapeCopyMinOffset = 0;
let landscapeCopyMaxOffset = 0;
let copyHiddenPreference = false;
let copyDragState = null;

function stripLeadingLabel(title, label) {
  if (typeof title !== "string" || !title) {
    return "";
  }

  if (title.startsWith(label)) {
    return title.slice(label.length).replace(/^[\s　]+/, "") || title;
  }

  return title;
}

function isLandscapeViewport() {
  return window.innerWidth > window.innerHeight;
}

function applyLayoutMode() {
  document.body.dataset.layout = isLandscapeViewport() ? "landscape" : "portrait";
}

function isLandscapeLayout() {
  return document.body.dataset.layout === "landscape";
}

function clampLandscapeCopyOffset(value) {
  return Math.min(landscapeCopyMaxOffset, Math.max(landscapeCopyMinOffset, value));
}

function applyLandscapeCopyOffset() {
  const activeOffset = isLandscapeLayout() ? landscapeCopyOffset : 0;
  document.documentElement.style.setProperty("--landscape-copy-offset", `${activeOffset}px`);
}

function applyCopyVisibilityState() {
  const isHidden = isLandscapeLayout() && copyHiddenPreference;
  document.body.classList.toggle("copy-hidden", isHidden);

  if (!copyVisibilityToggle) {
    return;
  }

  copyVisibilityToggle.classList.toggle("is-hidden", isHidden);
  copyVisibilityToggle.setAttribute("aria-pressed", String(isHidden));
  const nextActionLabel = isHidden ? "本文を表示" : "本文を隠す";
  copyVisibilityToggle.setAttribute("aria-label", nextActionLabel);
  copyVisibilityToggle.title = nextActionLabel;
}

function updateLandscapeCopyBounds() {
  if (!isLandscapeLayout() || copyPanels.length === 0) {
    landscapeCopyMinOffset = 0;
    landscapeCopyMaxOffset = 0;
    applyLandscapeCopyOffset();
    return;
  }

  const panel =
    copyPanels[activeSceneIndex] ||
    copyPanels.find((candidate) => candidate instanceof HTMLElement);
  const container = panel?.parentElement;
  if (!panel || !container) {
    landscapeCopyMinOffset = 0;
    landscapeCopyMaxOffset = 0;
    applyLandscapeCopyOffset();
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportPadding = Math.max(14, Math.round(viewportWidth * 0.012));
  const baseLeft = panelRect.left - landscapeCopyOffset;
  const baseRight = panelRect.right - landscapeCopyOffset;

  landscapeCopyMinOffset = viewportPadding - baseLeft;
  landscapeCopyMaxOffset = viewportWidth - viewportPadding - baseRight;

  if (landscapeCopyMinOffset > landscapeCopyMaxOffset) {
    const midpoint = (landscapeCopyMinOffset + landscapeCopyMaxOffset) / 2;
    landscapeCopyMinOffset = midpoint;
    landscapeCopyMaxOffset = midpoint;
  }

  landscapeCopyOffset = clampLandscapeCopyOffset(landscapeCopyOffset);
  applyLandscapeCopyOffset();
}

function finishCopyDrag(pointerId = null) {
  if (!copyDragState || (pointerId !== null && copyDragState.pointerId !== pointerId)) {
    return;
  }

  if (copyDragState.dragging) {
    copyDragState.source?.releasePointerCapture?.(copyDragState.pointerId);
  }

  copyDragState = null;
  document.body.classList.remove("copy-dragging");
}

function onCopyPanelPointerDown(event) {
  if (!isLandscapeLayout() || copyHiddenPreference) {
    return;
  }

  if (typeof event.button === "number" && event.button !== 0) {
    return;
  }

  copyDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originOffset: landscapeCopyOffset,
    dragging: false,
    source: event.currentTarget,
  };
}

function onWindowPointerMove(event) {
  if (!copyDragState || copyDragState.pointerId !== event.pointerId) {
    return;
  }

  if (!isLandscapeLayout()) {
    finishCopyDrag(event.pointerId);
    return;
  }

  const deltaX = event.clientX - copyDragState.startX;
  const deltaY = event.clientY - copyDragState.startY;

  if (!copyDragState.dragging) {
    if (Math.abs(deltaX) < 10) {
      return;
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      finishCopyDrag(event.pointerId);
      return;
    }

    copyDragState.dragging = true;
    copyDragState.source?.setPointerCapture?.(event.pointerId);
    document.body.classList.add("copy-dragging");
  }

  event.preventDefault();
  landscapeCopyOffset = clampLandscapeCopyOffset(copyDragState.originOffset + deltaX);
  applyLandscapeCopyOffset();
}

function onWindowPointerUp(event) {
  finishCopyDrag(event.pointerId);
}

function lineElement(text, kind = "narration") {
  const element = document.createElement(kind === "part" ? "h3" : "p");
  element.className = kind === "part" ? "beat-part-label" : "beat-line";
  element.textContent = text;
  return element;
}

function beatElement(beat, beatIndex) {
  const article = document.createElement("article");
  article.className = `beat beat-${beat.kind}`;
  article.dataset.beatIndex = String(beatIndex);

  const inner = document.createElement("div");
  inner.className = "beat-inner";
  inner.append(lineElement(beat.rawText, beat.kind));

  article.append(inner);
  return article;
}

function chapterMarker(scene) {
  const section = document.createElement("section");
  section.className = "chapter-marker";
  section.id = `talk-${scene.talkKey}`;
  section.dataset.talkKey = scene.talkKey;

  const chapterRow = document.createElement("div");
  chapterRow.className = "chapter-marker-row";

  const label = document.createElement("p");
  label.className = "chapter-marker-index";
  label.textContent = scene.chapterLabel;

  const title = document.createElement("h2");
  title.className = "chapter-marker-title";
  title.textContent = stripLeadingLabel(scene.chapterTitle, scene.chapterLabel);

  const talkRow = document.createElement("div");
  talkRow.className = "chapter-marker-talk-row";

  const talkLabel = document.createElement("p");
  talkLabel.className = "chapter-marker-talk-index";
  talkLabel.textContent = scene.talkLabel;

  const talkTitle = document.createElement("p");
  talkTitle.className = "chapter-marker-talk-title";
  talkTitle.textContent = stripLeadingLabel(scene.talkTitle, scene.talkLabel);

  chapterRow.append(label, title);
  talkRow.append(talkLabel, talkTitle);
  section.append(chapterRow, talkRow);
  return section;
}

function titlePage(storyData) {
  const section = document.createElement("section");
  section.className = "title-page";

  const card = document.createElement("div");
  card.className = "title-page-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "title-page-eyebrow";
  eyebrow.textContent = "Illustrated Web Novel";

  const heading = document.createElement("h1");
  heading.className = "title-page-title";
  if (Array.isArray(storyData.titleDisplayLines) && storyData.titleDisplayLines.length > 0) {
    heading.append(
      ...storyData.titleDisplayLines.map((line, index) => {
        const span = document.createElement("span");
        span.className = line ? "title-page-title-line" : "title-page-title-spacer";
        if (line) {
          span.dataset.lineIndex = String(index);
          if (line.length > 18) {
            span.classList.add("is-long");
          }
        }
        span.textContent = line || " ";
        return span;
      }),
    );
  } else {
    heading.textContent = storyData.title;
  }

  if (storyData.titleImage) {
    const artWrap = document.createElement("div");
    artWrap.className = "title-page-art";

    const art = document.createElement("img");
    art.className = "title-page-image";
    art.src = storyData.titleImage;
    art.alt = storyData.titleImageAlt || storyData.title;
    art.loading = "eager";
    art.decoding = "async";

    const overlay = document.createElement("div");
    overlay.className = "title-page-overlay";
    overlay.append(eyebrow, heading);

    artWrap.append(art, overlay);
    card.append(artWrap);
  } else {
    card.append(eyebrow, heading);
  }

  const meta = document.createElement("p");
  meta.className = "title-page-meta";
  meta.textContent = `${storyData.talkCount ?? storyData.sceneCount}話収録`;

  card.append(meta);
  section.append(card);
  return section;
}

function chapterMenuItem(scene, index) {
  const button = document.createElement("button");
  button.className = "chapter-link";
  button.type = "button";
  button.dataset.talkKey = scene.talkKey;
  button.innerHTML = `
    <span class="chapter-link-talk-index">${scene.talkLabel}</span>
    <span class="chapter-link-talk-title">${stripLeadingLabel(scene.talkTitle, scene.talkLabel)}</span>
  `;
  button.addEventListener("click", () => {
    const target = talkTargets.find((item) => item.talkKey === scene.talkKey);
    if (target) {
      deviceScroll.scrollTo({
        top: Math.max(0, target.element.offsetTop - 12),
        behavior: "smooth",
      });
    }
    setMenuOpen(false);
  });
  if (index === 0) {
    button.classList.add("is-current");
  }
  return button;
}

function chapterMenuGroup(chapterScene, talkScenes, startIndex) {
  const section = document.createElement("section");
  section.className = "chapter-menu-group";

  const header = document.createElement("div");
  header.className = "chapter-menu-group-header";
  header.innerHTML = `
    <p class="chapter-menu-group-index">${chapterScene.chapterLabel}</p>
    <h3 class="chapter-menu-group-title">${stripLeadingLabel(chapterScene.chapterTitle, chapterScene.chapterLabel)}</h3>
  `;

  const list = document.createElement("div");
  list.className = "chapter-menu-group-list";
  const buttons = talkScenes.map((scene, index) => chapterMenuItem(scene, startIndex + index));
  list.replaceChildren(...buttons);

  section.append(header, list);
  return { section, buttons };
}

function setMenuOpen(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "章メニューを閉じる" : "章メニューを開く");
  chapterMenu.setAttribute("aria-hidden", String(!isOpen));
  menuBackdrop.hidden = !isOpen;
}

function updateActiveChapter() {
  if (talkOffsets.length === 0) {
    return;
  }

  const scrollTop = deviceScroll.scrollTop;
  let nextTalkKey = talkOffsets[0].talkKey;

  talkOffsets.forEach((target) => {
    if (target.top - 80 <= scrollTop) {
      nextTalkKey = target.talkKey;
    }
  });

  if (nextTalkKey === currentTalkKey) {
    return;
  }

  currentTalkKey = nextTalkKey;
  talkLinkElements.forEach((element) => {
    element.classList.toggle("is-current", element.dataset.talkKey === currentTalkKey);
  });
}

function sceneElement(scene, sceneIndex) {
  const section = document.createElement("section");
  section.className = "scene";
  section.dataset.sceneIndex = String(sceneIndex);
  section.dataset.mood = scene.mood;

  const visual = document.createElement("div");
  visual.className = "scene-visual";

  const backdrop = document.createElement("img");
  backdrop.className = "scene-image-backdrop";
  backdrop.src = scene.image;
  backdrop.alt = "";
  backdrop.ariaHidden = "true";
  backdrop.loading = sceneIndex < 2 ? "eager" : "lazy";
  backdrop.decoding = "async";

  const image = document.createElement("img");
  image.className = "scene-image";
  image.src = scene.image;
  image.alt = scene.alt;
  image.loading = sceneIndex < 2 ? "eager" : "lazy";
  image.decoding = "async";

  const veil = document.createElement("div");
  veil.className = "scene-veil";

  const grain = document.createElement("div");
  grain.className = "scene-grain";

  const meta = document.createElement("div");
  meta.className = "scene-meta";

  const chapterLabel = document.createElement("p");
  chapterLabel.className = "scene-chapter";
  chapterLabel.textContent = scene.chapterTitle;

  const talkLabel = document.createElement("p");
  talkLabel.className = "scene-talk-index";
  talkLabel.textContent = `${scene.talkLabel} ${stripLeadingLabel(scene.talkTitle, scene.talkLabel)}`;

  const sectionLabel = document.createElement("p");
  sectionLabel.className = "scene-section-index";
  sectionLabel.textContent = scene.sectionLabel;

  const title = document.createElement("h2");
  title.className = "scene-title";
  title.textContent = stripLeadingLabel(scene.title, scene.sectionLabel);

  const partLabel = document.createElement("p");
  partLabel.className = "scene-part-index";
  partLabel.textContent = scene.partLabel;

  meta.append(chapterLabel, talkLabel, sectionLabel, title, partLabel);
  visual.append(backdrop, image, veil, grain, meta);

  const copy = document.createElement("div");
  copy.className = "scene-copy";
  const copyPanel = document.createElement("div");
  copyPanel.className = "scene-copy-panel";

  const copyHandle = document.createElement("div");
  copyHandle.className = "scene-copy-handle";
  copyHandle.setAttribute("aria-hidden", "true");
  copyHandle.innerHTML = "<span></span>";

  copyPanel.append(copyHandle, ...scene.beats.map((beat, beatIndex) => beatElement(beat, beatIndex)));
  copyPanel.addEventListener("pointerdown", onCopyPanelPointerDown);
  copy.append(copyPanel);

  section.append(visual, copy);
  return section;
}

function setActiveScene(index) {
  if (sceneElements.length === 0) {
    return;
  }

  const previousIndex = activeSceneIndex;
  activeSceneIndex = index;
  document.body.dataset.mood = story.scenes[index].mood;
  sceneElements[previousIndex]?.classList.remove("is-active");
  sceneElements[index]?.classList.add("is-active");
  updateLandscapeCopyBounds();
}

function nearestSceneIndex() {
  if (sceneMidpoints.length === 0) {
    return 0;
  }

  const anchor = deviceScroll.scrollTop + deviceScroll.clientHeight * 0.42;
  let low = 0;
  let high = sceneMidpoints.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (sceneMidpoints[mid] < anchor) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (low === 0) {
    return 0;
  }

  return Math.abs(sceneMidpoints[low] - anchor) < Math.abs(sceneMidpoints[low - 1] - anchor)
    ? low
    : low - 1;
}

function sceneScrollProgress(element) {
  const scrollSpan = Math.max(1, element.offsetHeight - deviceScroll.clientHeight);
  const raw = (deviceScroll.scrollTop - element.offsetTop) / scrollSpan;
  return Math.max(0, Math.min(1, raw));
}

function updateScenePan() {
  const isLandscape = document.body.dataset.layout === "landscape";

  sceneElements.forEach((element) => {
    const progress = isLandscape ? 0.5 : sceneScrollProgress(element);
    const focusX = isLandscape ? 50 : 18 + progress * 64;
    const image = element.querySelector(".scene-image");
    const backdrop = element.querySelector(".scene-image-backdrop");

    if (image) {
      image.style.objectPosition = `${focusX}% center`;
    }
    if (backdrop) {
      backdrop.style.objectPosition = `${focusX}% center`;
    }

    element.style.setProperty("--pan-progress", progress.toFixed(4));
  });
}

function cacheLayoutMetrics() {
  const viewportHeight = deviceScroll.clientHeight;
  sceneMidpoints = sceneElements.map(
    (element) => element.offsetTop + Math.min(element.offsetHeight, viewportHeight) * 0.5,
  );
  talkOffsets = talkTargets.map((target) => ({
    talkKey: target.talkKey,
    top: target.element.offsetTop,
  }));
  updateScenePan();
}

function updateProgress() {
  const maxScroll = deviceScroll.scrollHeight - deviceScroll.clientHeight;
  const ratio = maxScroll <= 0 ? 0 : deviceScroll.scrollTop / maxScroll;
  progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;

  const nextActiveIndex = nearestSceneIndex();
  if (nextActiveIndex !== activeSceneIndex) {
    setActiveScene(nextActiveIndex);
  }
  updateActiveChapter();
  updateScenePan();
}

function syncReaderHeight() {
  applyLayoutMode();
  novel.style.setProperty("--reader-height", `${deviceScroll.clientHeight}px`);
  cacheLayoutMetrics();
  updateLandscapeCopyBounds();
  applyCopyVisibilityState();
}

function onScroll() {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    updateProgress();
    ticking = false;
  });
}

function render(storyData) {
  if (!storyData || !Array.isArray(storyData.scenes) || storyData.scenes.length === 0) {
    novel.innerHTML = '<div class="loading-state">表示できるシーンがありません。</div>';
    return;
  }

  document.title = storyData.title;
  const fragment = document.createDocumentFragment();
  fragment.append(titlePage(storyData));
  let previousTalkKey = null;

  storyData.scenes.forEach((scene, index) => {
    if (scene.talkKey !== previousTalkKey) {
      fragment.append(chapterMarker(scene));
      previousTalkKey = scene.talkKey;
    }
    fragment.append(sceneElement(scene, index));
  });

  const footer = document.createElement("footer");
  footer.className = "novel-footer";
  footer.innerHTML = `
    <p class="novel-finish-title">${storyData.title}</p>
    <p class="novel-finish">完</p>
  `;
  fragment.append(footer);

  novel.replaceChildren(fragment);
  sceneElements = [...document.querySelectorAll(".scene")];
  copyPanels = [...document.querySelectorAll(".scene-copy-panel")];
  talkTargets = [...document.querySelectorAll(".chapter-marker")].map((element) => ({
    talkKey: element.dataset.talkKey,
    element,
  }));
  const menuTalkScenes = storyData.scenes.filter(
    (scene, index, scenes) =>
      index === scenes.findIndex((candidate) => candidate.talkKey === scene.talkKey),
  );
  const menuGroups = [];
  talkLinkElements = [];

  menuTalkScenes.forEach((scene) => {
    const group = menuGroups[menuGroups.length - 1];
    if (!group || group.chapterKey !== scene.chapterKey) {
      menuGroups.push({
        chapterKey: scene.chapterKey,
        chapterScene: scene,
        talkScenes: [scene],
      });
      return;
    }
    group.talkScenes.push(scene);
  });

  const groupElements = menuGroups.map((group, index) => {
    const startIndex = menuGroups
      .slice(0, index)
      .reduce((count, item) => count + item.talkScenes.length, 0);
    const { section, buttons } = chapterMenuGroup(group.chapterScene, group.talkScenes, startIndex);
    talkLinkElements.push(...buttons);
    return section;
  });

  chapterMenuList.replaceChildren(...groupElements);
  syncReaderHeight();
  currentTalkKey = null;
  setActiveScene(0);
  updateProgress();
}

deviceScroll.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  syncReaderHeight();
  onScroll();
});
window.addEventListener("load", () => {
  syncReaderHeight();
  onScroll();
});
window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
window.addEventListener("pointerup", onWindowPointerUp);
window.addEventListener("pointercancel", onWindowPointerUp);

menuToggle.addEventListener("click", () => {
  setMenuOpen(chapterMenu.getAttribute("aria-hidden") === "true");
});

copyVisibilityToggle?.addEventListener("click", () => {
  copyHiddenPreference = !copyHiddenPreference;
  applyCopyVisibilityState();
});

menuBackdrop.addEventListener("click", () => {
  setMenuOpen(false);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

render(story);
