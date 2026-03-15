import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, slugify, writeFileIfMissing } from "./lib/novel-project.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const options = {
    title: "新しい創読プロジェクト",
    subtitle: "",
    author: "",
    genre: "",
    logline: "",
    slug: "",
    series: "sato-kimama",
  };

  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const separatorIndex = arg.indexOf("=");
    const key = separatorIndex === -1 ? arg.slice(2) : arg.slice(2, separatorIndex);
    const value = separatorIndex === -1 ? "true" : arg.slice(separatorIndex + 1);

    if (key in options) {
      options[key] = value;
    }
  }

  return options;
}

function isSatoSeries(options) {
  return options.series !== "generic";
}

function buildOverviewTemplate(options, nowIso) {
  if (isSatoSeries(options)) {
    const slug = options.slug || slugify(options.title);
    return `---
title: "${options.title}"
subtitle: "${options.subtitle}"
author: "${options.author}"
genre: "${options.genre || "現代スパイ日常コメディ"}"
slug: "${slug}"
status: "planning"
updatedAt: "${nowIso}"
---

# Project Overview

## Series Context
- シリーズ名: おっさんサトーの気ままなXX
- 今回の回で固定継承するもの: サトーとセラの基本設定、国家機密の裏設定、サトーは事件に気づかないという構図、3章6話12節の標準構成
- 今回の回で更新するもの: タイトル、サブタイトル、主題となる日常行為、季節、背景、各話の事件、各回専用の服装差分
- canonical portraits: project/assets/characters/sato.png / project/assets/characters/sera.png

## Logline
${options.logline || "サトーが気ままに楽しむ今回の題材を書き、その裏でセラが極秘に拉致阻止を続ける。"}

## Audience
- 想定読者: 季節感のある日常描写と、気づかれない護衛アクションの落差を楽しみたい読者
- 読後感: サトーの穏やかな満足と、それが過剰に守られていた可笑しさが同時に残ること
- 連載ペース: 章ごとに確認しながら進める創読形式

## Creative Intent
- この回でやりたいこと:
- 絶対に入れたい要素:
- 避けたい要素:

## Product Intent
- 創読としてどんな体験にしたいか: サトーと一緒に気持ちよく題材を味わいながら、各話のセラパートで裏の事件の正体が見えてくる構成にする
- 画像生成の方針: canonical portraits を元に、この回専用の sato-episode と sera-episode を先に生成し、その後に背景・節画像・タイトル画像を作る
- モバイル Web での見せ方: 各話2節の因果が縦スクロールで自然につながるように、サトー節は気分、セラ節は回収を明確に見せる

## Initial Approval Gate
- まず確認してもらうもの:
  - 全体プロット
  - 主要キャラクター設定
  - 今回専用のサトー画像
  - 今回専用のセラ画像
  - 背景イメージ
- タイトル画像は最後に作る:
- 本文開始の条件:

## Current Focus
- 今回進める範囲:
- 未確定事項:
- 次に決めること:
`;
  }

  const slug = options.slug || slugify(options.title);
  return `---
title: "${options.title}"
subtitle: "${options.subtitle}"
author: "${options.author}"
genre: "${options.genre}"
slug: "${slug}"
status: "planning"
updatedAt: "${nowIso}"
---

# Project Overview

## Logline
${options.logline || "ここに作品の核となる一文要約を書く。"}

## Audience
- 想定読者:
- 読後感:
- 連載ペース:

## Creative Intent
- この作品でやりたいこと:
- 絶対に入れたい要素:
- 避けたい要素:

## Product Intent
- 創読としてどんな体験にしたいか:
- 画像生成の方針:
- モバイル Web での見せ方:

## Initial Approval Gate
- まず確認してもらうもの:
- 主要キャラクター画像:
- 背景イメージ:
- タイトル画像は最後に作る:
- 本文開始の条件:

## Current Focus
- 今回進める範囲:
- 未確定事項:
- 次に決めること:
`;
}

function buildPlotTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Plot

## Series Inheritance
- 主人公: サトー（佐藤一）。45歳、東京在住の中年男性
- 裏の主人公: セラ。サトーを秘匿護衛する実働担当
- 共通秘密: サトーは国家防衛の極秘システムを起動できる最後の生体認証鍵
- 共通脅威: 敵対勢力はサトーを生きたまま拉致し、非常時に使えない状態へ置こうとする

## Core Conflict
- 今回のサトーの気ままな目的:
- 今回の主舞台:
- 今回の障害:
- 今回失敗したときに汚される日常:

## Arc Overview
### Beginning

### Middle

### Ending

## Episode Incidents
- 第1章第1話の事件:
- 第1章第2話の事件:
- 第2章第1話の事件:
- 第2章第2話の事件:
- 第3章第1話の事件:
- 第3章第2話の事件:

## Pivot Log
- 変更があれば日付と理由を書く
`;
  }

  return `# Plot

## Core Conflict
- 主人公:
- 欲望:
- 障害:
- 失敗コスト:

## Arc Overview
### Beginning

### Middle

### Ending

## Pivot Log
- 変更があれば日付と理由を書く
`;
}

function buildCharactersTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Characters

## Cast Rules
- シリーズ共通の正本キャラクター画像は project/assets/characters/sato.png と project/assets/characters/sera.png
- 各回では canonical portraits を元に、その回専用の sato-episode / sera-episode を先に生成する
- 各キャラクターは「共通設定」と「今回の差分」を分けて書く
- 画像生成後は見た目の定義をここに固定する

## Main Cast

### character_id: sato
- 名前: 佐藤一（さとうはじめ）。本文中の表記はサトー
- 役割: 表の主人公。東京在住の中年男性
- 年齢・立場: 45歳。バツイチ独身、子なし。現在は民間の監査・資料整理系の仕事をしている
- 秘匿経歴: かつて国家防衛の極秘システム開発責任者だったが、本人は終わった仕事として扱っている
- 外見: 身長175cm前後。やや長身で細マッチョ。黒髪長髪を後ろで束ね、口ひげと顎ひげがある
- 共通性格: 温厚、几帳面、観察眼はあるが危険への想像力だけが日常寄り
- 共通話し方: 落ち着いていて丁寧。少し自虐的
- 共通弱点: 違和感を平和な理由へ解釈して流しやすい
- 今回の欲望:
- 今回の恐れ:
- 今回の服装・持ち物:
- 今回の変化:
- 画像プロンプト要約: canonical portrait の顔立ち・体格を厳守しつつ、その回の題材に合わせて服装だけを更新する

### character_id: sera
- 名前: セラ
- 役割: 裏の主人公。サトーを秘匿護衛する実働担当
- 年齢・立場: 見た目は20代半ば。内閣系秘匿警護部門の現場要員
- 任務前提: サトー本人に真相を知らせず、敵対勢力による拉致と連行を導線ごと阻止する
- 外見: 身長160cm前後。銀灰色の髪、金色の目、しなやかな体つき
- 共通装備: 猫耳カチューシャ型の警護支援ユニットを常時装着する
- 共通性格: 忠実、冷静、毒舌気味。サトーの小さな幸福を本気で守っている
- 共通話し方: 短く要点だけ。独り言でだけ感情が少し漏れる
- 今回の欲望:
- 今回の恐れ:
- 今回の服装・持ち物:
- 今回の変化:
- 画像プロンプト要約: canonical portrait の顔立ち・髪色・猫耳装備を厳守しつつ、その回の題材に合わせて服装差分だけを更新する

## Supporting Cast
- 敵役は毎回、今回の舞台に自然に紛れ込む一般人の偽装として設計する
- 固定の脇役を出す場合も、サトーの日常の気分を壊さない範囲に留める
`;
  }

  return `# Characters

## Cast Rules
- 各キャラクターは「役割」「内面」「外見」「口調」「変化」を必ず持たせる
- 画像生成後は見た目の定義をここに固定する

## Main Cast

### character_id: protagonist
- 名前:
- 役割:
- 年齢・立場:
- 外見:
- 服装・持ち物:
- 性格:
- 話し方:
- 欲望:
- 恐れ:
- 変化:
- 画像プロンプト要約:

## Supporting Cast
`;
}

function buildWorldTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Worldbuilding

## Setting Summary
現代日本によく似た世界。一般市民の日常と、サトーを守る国家規模の秘匿警護任務が同時進行している。毎回の作品では舞台や季節は変わるが、サトーの気ままな日常と、裏でそれを守るセラの任務が重なる構造は固定する。

## Key Background Concepts
- 今回の背景 01:
- 今回の背景 02:
- 今回の背景 03:

## Rules
- 魔法・技術: 超常要素はない。すべて現代的な諜報、拉致工作、事故偽装、通信妨害、拘束具で成立する
- 社会: 平和な日常の奥で、国家安全保障の最深部だけがサトーの扱いに神経を尖らせている
- 国家機密: 防衛の切り札となる極秘システムは、最終起動に登録済み本人の全身生体認証を必要とする
- 隠蔽構造: 登録事故は公表されておらず、政府内部は非常時だけ秘密裏にサトーを確保すればよいという危うい運用で問題を棚上げしている
- 国際情勢: 第三国はこの秘密を把握しており、サトーを生きたまま拉致して使用不能にすることを狙う
- 叙述方針: 国家機密は設定上の正本として保持し、本文では直接説明しすぎない
- 地理:
- 季節:
- 建築:
- 禁則:

## Sensory Notes
- 色:
- 質感:
- 音:
- 匂い:

## Open Questions
`;
  }

  return `# Worldbuilding

## Setting Summary

## Key Background Concepts
- 初期確認で見せる背景 01:
- 初期確認で見せる背景 02:

## Rules
- 魔法・技術:
- 社会:
- 地理:
- 禁則:

## Sensory Notes
- 色:
- 質感:
- 音:
- 匂い:

## Open Questions
`;
}

function buildChapterOutlineTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Chapter Outline

## Release Strategy
- 1回で見せる分量: 3章6話12節
- 章あたりの体験: 日常行為の導入、中盤の充実、終盤の余韻で空気を変える
- 話あたりの役割: 1話につき1事件だけを扱う
- 節あたりの役割: 第1節は必ずサトーパート、第2節は必ずセラパート
- 話内連動ルール: 第1節のサトーには、第2節の防衛結果が「ちょっとした違和感」として必ず先に見える。サトーはそれをお気楽に日常へ解釈して流す
- 画像生成の最小単位: 節

## Initial Package
- 初回承認前に確定するもの:
  - 全体プロット
  - 主要キャラクター
  - 今回専用のサトー画像
  - 今回専用のセラ画像
  - 背景イメージ

## Chapters

### 第1章
- 章テーマ:
- 到達点:
- ユーザ確認ポイント:

#### 第1話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:

#### 第2話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:

### 第2章
- 章テーマ:
- 到達点:
- ユーザ確認ポイント:

#### 第1話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:

#### 第2話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:

### 第3章
- 章テーマ:
- 到達点:
- ユーザ確認ポイント:

#### 第1話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:

#### 第2話
- 話テーマ:
- 到達点:

##### 第1節
- 節テーマ:
- 視点: サトーパート
- 到達点:

##### 第2節
- 節テーマ:
- 視点: セラパート
- 到達点:
`;
  }

  return `# Chapter Outline

## Release Strategy
- 1回で見せる分量:
- 章あたりの体験:
- 話あたりの役割:
- 画像生成の最小単位: 節

## Initial Package
- 初回承認前に確定するもの:
  - 全体プロット
  - 主要キャラクター
  - 主要キャラクター画像
  - 背景イメージ

## Chapters

### 第1章
- 章テーマ:
- 到達点:
- ユーザ確認ポイント:

#### 第1話
- 話テーマ:
- 到達点:

##### 第1節
- 背景:
- 画面ショットの目的:
`;
}

function buildStyleGuideTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Style Guide

## Narrative Voice
- 地の文: 各話は必ず第1節のサトーパートから始め、第2節のセラパートで同一事件の裏側を返す
- サトーパート: 朝の空気、生活感、今回の気ままな題材の楽しさを丁寧に積む
- サトーパート: 必ず「ちょっとした違和感」を1つ以上入れる。サトーはそれを事件と思わず、日常的な理由へ丸めて流す
- サトーパート: サトー本人の直接セリフを最低2つ入れる。1つは異変を楽観的に流すセリフ、もう1つはその場の日常の良さを言葉にするセリフで、できる限り役割を分ける
- セラパート: 直前の違和感の正体を短く鋭く回収する
- セラパート: 敵制圧に刃物を使わない。必要な道具は非刃物に限り、身体操作や環境利用を優先する
- 会話文: 量は多すぎず、空気を支えるために使う。サトーは穏やか、セラは短く辛辣
- テンポ: 日常描写はゆるやかに、護衛処理は短く確実に切る

## Reading Experience
- スマホで読みやすい段落長: 2〜4文程度を基本にする
- 1話の気持ちよい流れ: 第1節でサトーの気分を作り、第2節で読者だけが真相を知る
- 次を読みたくなるフック: サトーののどかな結論と、セラの静かな処理の落差

## Image Direction
- タイトル画像: 全話と主要節画像が固まった最後に作る
- キャラクター画像: canonical portraits を元に、その回専用の sato-episode / sera-episode を先に生成する
- 節画像: 第1節はサトー主体、第2節はセラ主体
- サトーパート画像: セラが見えても遠景や遮蔽物の陰に留め、同伴者に見せない
- セラパート画像: サトーは背景で無自覚、事件の方向を見ない

## Continuity Rules
- 固定設定: サトーは最後までセラの正体に気づかない
- 固定設定: セラの対処は非致死かつ非刃物に限る
- 固定設定: 1話の2節は同一事件の表裏であり、別事件を混ぜない
- 固定設定: canonical portraits の顔立ちと装備解釈を崩さない
- 後から変えてよい設定: 季節、舞台、題材、服装差分、各話の事件、脇役の顔ぶれ
`;
  }

  return `# Style Guide

## Narrative Voice
- 地の文:
- 会話文:
- テンポ:

## Reading Experience
- スマホで読みやすい段落長:
- 1節の気持ちよい終わり方:
- 次を読みたくなるフック:

## Image Direction
- タイトル画像: 全話と節画像が固まった最後に作る
- キャラクター画像:
- 節画像:

## Continuity Rules
- 固定設定:
- 後から変えてよい設定:
`;
}

function buildManuscriptOverviewTemplate(options) {
  if (isSatoSeries(options)) {
    return `# Manuscript Overview

## Canon
- 主人公の現在地: 今回の回の終点を書く
- 主要キャラクターの関係: サトーはセラを知らない。セラはサトーを守る
- シリーズ共通裏設定: サトーは国家防衛の極秘システムを起動できる最後の生体認証鍵
- 未回収の伏線:

## Review Loop
- 初回承認前: 共通設定を継承し、今回専用のキャラクター画像と背景イメージまでを確認する
- 現在レビュー中の章:
- 次に画像化する節:

## Drafting Log
- 新規執筆や修正を行うたびに記録する
`;
  }

  return `# Manuscript Overview

## Canon
- 主人公の現在地:
- 主要キャラクターの関係:
- 未回収の伏線:

## Review Loop
- 初回承認前:
- 現在レビュー中の章:
- 次に画像化する節:

## Drafting Log
- 新規執筆や修正を行うたびに記録する
`;
}

function buildSeriesInheritanceTemplate(options) {
  if (!isSatoSeries(options)) {
    return `# Series Inheritance

## Status
- この作品は generic テンプレートで初期化された
`;
  }

  return `# Series Inheritance

## Inherited Canon
- canonical portraits: project/assets/characters/sato.png / project/assets/characters/sera.png
- fixed canon source: soudoku-novel-builder/references/ossan-sato-series-canon.md
- fixed structure source: soudoku-novel-builder/references/ossan-sato-series-structure.md
- living world source: soudoku-novel-builder/references/ossan-sato-series-living-world.md
- change log source: soudoku-novel-builder/references/ossan-sato-series-change-log.md

## Canon Snapshot At Project Start
- 固定人物設定を継承する
- 国家機密の裏設定を継承する
- 3章6話12節 / 1話1事件 / 第1節サトー / 第2節セラ を継承する
- living world に登録済みの地理と recurring place を継承する

## Newly Introduced This Installment
- ここに今回新しく出た設定を書く

## Candidate For Series Promotion
- ここに「今後も使いたいので series canon へ昇格候補」の設定を書く

## Promoted To Series Canon In This Installment
- ここに今回 canon へ昇格させた設定を書く
`;
}

function buildFullNovelTemplate(title, options) {
  if (isSatoSeries(options)) {
    return `# ${title}

## 第1章　章題

### 第1話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。

### 第2話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。

## 第2章　章題

### 第1話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。

### 第2話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。

## 第3章　章題

### 第1話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。

### 第2話　話題

#### 第1節　節題
サトーパート

ここにサトー側の本文を書く。

#### 第2節　節題
セラパート

ここにセラ側の本文を書く。
`;
  }

  return `# ${title}

## 第1章　朝

### 第1話　休日のはじまり

#### 第1節
ここから本文を書く。
`;
}

function buildTitlePromptTemplate(options) {
  return {
    spec: {
      globalPrompt:
        "Create a photorealistic cinematic illustration for a modern web novel. Keep lighting, materials, anatomy, and faces grounded in live-action realism. Maintain a unified realistic visual language across all generated assets.",
      globalNegativePrompt:
        "anime, manga, cel shading, cartoon, illustration with flat shading, text, logo, watermark, collage, split panel, deformed anatomy, low detail face, extra limbs",
      fixedWidth: 1920,
      fixedHeight: 1080,
    },
    titleImage: {
      id: "title-cover",
      model: "gemini-3.1-flash-image-preview",
      outputDir: "project/assets/title",
      referenceImages: [],
      prompt: isSatoSeries(options)
        ? `${options.title} の世界観と読後感が一目で伝わるタイトルビジュアルを生成する。canonical portraits を元に作った今回専用のサトー画像とセラ画像、背景イメージ、本文トーンが固まった最後に更新する。画像の中には作品タイトル、サブタイトル、ロゴ、章話節ラベル、UI 文字、クレジットなどの後乗せ文字を入れず、作品のキービジュアルとして成立させる。背景の一部として自然に存在する店名看板や街中表示は許容する。`
        : `${options.title} の世界観と読後感が一目で伝わるタイトルビジュアルを生成する。これは最終工程で使う。キャラクター画像と世界観が固まった後で更新する。画像の中には作品タイトル、サブタイトル、ロゴ、章話節ラベル、UI 文字、クレジットなどの後乗せ文字を入れず、作品のキービジュアルとして成立させる。背景の一部として自然に存在する店名看板や街中表示は許容する。`,
      negativePrompt:
        "avoid generic fantasy poster layout, embedded cover title, embedded subtitle, poster logo, floating typography, chapter label overlay, UI overlay, floating credits",
    },
  };
}

function buildCharacterPromptTemplate(options) {
  if (isSatoSeries(options)) {
    return {
      spec: {
        globalPrompt:
          "Create a photorealistic cinematic full-body character portrait for a modern web novel. Preserve silhouette clarity, costume readability, realistic anatomy, realistic fabric texture, and a consistent live-action visual language shared with all other generated assets.",
        globalNegativePrompt:
          "anime, manga, cel shading, cartoon, text, logo, watermark, deformed anatomy, extra limbs, duplicate body parts, cropped head, doll-like face",
        fixedWidth: 1080,
        fixedHeight: 1920,
        outputDir: "project/assets/characters",
        defaultModel: "gemini-3.1-flash-image-preview",
      },
      characters: [
        {
          id: "sato-episode",
          name: "サトー",
          model: "gemini-3.1-flash-image-preview",
          prompt:
            "Full-body portrait of Sato for this installment of the Otsusan Sato series. Preserve the exact face, age, body impression, ponytail, mustache, and chin beard from the supplied canonical portrait. Redesign only the clothing, carry items, and mood so they match the installment-specific activity, season, and setting defined in project/00_project_overview.md and project/02_characters.md.",
          negativePrompt:
            "young idol look, clean-shaven face, short hair, exaggerated bodybuilder muscles, fantasy armor, flashy race costume, denim, office suit, anime pretty-boy look",
          referenceImage: "project/assets/characters/sato.png",
          sourceRefs: [
            "project/02_characters.md",
            "soudoku-novel-builder/references/ossan-sato-series-canon.md"
          ]
        },
        {
          id: "sera-episode",
          name: "セラ",
          model: "gemini-3.1-flash-image-preview",
          prompt:
            "Full-body portrait of Sera for this installment of the Otsusan Sato series. Preserve the exact face, silver-gray hair, golden eyes, disciplined expression, and visible cat-ear headband support-security unit from the supplied canonical portrait. Redesign only the clothing and practical gear so they match the installment-specific activity, season, and setting defined in project/00_project_overview.md and project/02_characters.md while remaining elegant, functional, and faintly maid-inspired if appropriate to the installment.",
          negativePrompt:
            "oversexualized maid, tactical armor, combat bodysuit, sci-fi combat suit, comedy chibi style, soft helpless expression, anime heroine look, doll face, giant visible weapons, indoor maid dress",
          referenceImage: "project/assets/characters/sera.png",
          sourceRefs: [
            "project/02_characters.md",
            "soudoku-novel-builder/references/ossan-sato-series-canon.md"
          ]
        }
      ],
    };
  }

  return {
    spec: {
      globalPrompt:
        "Create a photorealistic cinematic full-body character portrait for a modern web novel. Preserve silhouette clarity, costume readability, realistic anatomy, realistic fabric texture, and a consistent live-action visual language shared with all other generated assets.",
      globalNegativePrompt:
        "anime, manga, cel shading, cartoon, text, logo, watermark, deformed anatomy, extra limbs, duplicate body parts, cropped head, doll-like face",
      fixedWidth: 1080,
      fixedHeight: 1920,
      outputDir: "project/assets/characters",
      defaultModel: "gemini-3.1-flash-image-preview",
    },
    characters: [],
  };
}

function buildTalkBackgroundEntries() {
  return [
    {
      id: "talk-001-stage",
      talkKey: "chapter-01-talk-01",
      chapterLabel: "第1章",
      talkLabel: "第1話",
      name: "第1章第1話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 1 talk 1. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
    {
      id: "talk-002-stage",
      talkKey: "chapter-01-talk-02",
      chapterLabel: "第1章",
      talkLabel: "第2話",
      name: "第1章第2話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 1 talk 2. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
    {
      id: "talk-003-stage",
      talkKey: "chapter-02-talk-01",
      chapterLabel: "第2章",
      talkLabel: "第1話",
      name: "第2章第1話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 2 talk 1. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
    {
      id: "talk-004-stage",
      talkKey: "chapter-02-talk-02",
      chapterLabel: "第2章",
      talkLabel: "第2話",
      name: "第2章第2話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 2 talk 2. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
    {
      id: "talk-005-stage",
      talkKey: "chapter-03-talk-01",
      chapterLabel: "第3章",
      talkLabel: "第1話",
      name: "第3章第1話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 3 talk 1. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
    {
      id: "talk-006-stage",
      talkKey: "chapter-03-talk-02",
      chapterLabel: "第3章",
      talkLabel: "第2話",
      name: "第3章第2話の前庭背景",
      model: "gemini-3.1-flash-image-preview",
      prompt:
        "Public-facing establishing environment for chapter 3 talk 2. Base this on the place Sato first sees in his part of the talk. Emphasize architecture, approach path, weather, lighting, time of day, quiet daily atmosphere, and the visible front side of the setting.",
      negativePrompt:
        "combat, action pose, readable text, collage, split panel, heavy crowd, obvious threat",
      sourceRefs: [
        "project/01_plot.md",
        "project/03_worldbuilding.md",
        "project/04_chapter_outline.md",
      ],
    },
  ];
}

function buildBackgroundConceptTemplate(options) {
  return {
    spec: {
      globalPrompt:
        "Create a photorealistic cinematic environment image for a modern web novel. Emphasize atmosphere, lighting, believable architecture, realistic materials, and a unified live-action visual language shared with all other generated assets.",
      globalNegativePrompt:
        "anime, manga, cel shading, cartoon, text, logo, watermark, character close-up, deformed architecture, low detail",
      fixedWidth: 1920,
      fixedHeight: 1080,
      outputDir: "project/assets/world",
      defaultModel: "gemini-3.1-flash-image-preview",
    },
    backgrounds: isSatoSeries(options) ? buildTalkBackgroundEntries() : [],
  };
}

function buildSceneCharacterReferencesTemplate(options) {
  if (isSatoSeries(options)) {
    return {
      spec: {
        globalPrompt:
          "Create one photorealistic cinematic 16:9 scene image for a modern web novel. Keep the style consistent with the title, character, and talk-level background prompts. Use realistic anatomy, realistic materials, and live-action-like lighting.",
        globalNegativePrompt:
          "anime, manga, cel shading, cartoon, text, logo, watermark, collage, split panel, multiple moments in one frame, deformed anatomy",
        fixedWidth: 1920,
        fixedHeight: 1080,
        outputDir: "project/assets/episodes",
        defaultModel: "gemini-3.1-flash-image-preview",
        promptSuffix:
          "Use the installment-specific episode portraits rather than the canonical portraits directly. For Sato-side images, Sato is dominant and any Sera presence must stay clearly separate and unreadable as a companion. For Sera-side images, Sera is dominant, the attacker must not resemble Sato, and Sato must remain an unaware background figure looking elsewhere. Compose for a 1920x1080 delivery with the main subjects near the center and safe margins on both sides so the image also works in portrait scrolling layouts."
      },
      characters: [
        {
          id: "sato-episode",
          name: "サトー",
          aliases: ["佐藤一", "佐藤", "サトーさん"],
          referenceImage: "project/assets/characters/sato-episode.png",
          visualRules:
            "Keep him consistent with the episode-specific portrait generated from the canonical Sato image."
        },
        {
          id: "sera-episode",
          name: "セラ",
          aliases: ["猫耳メイド", "並走者", "護衛"],
          referenceImage: "project/assets/characters/sera-episode.png",
          visualRules:
            "Keep her consistent with the episode-specific portrait generated from the canonical Sera image, including the visible cat-ear support-security unit."
        }
      ],
      sceneOverrides: {},
    };
  }

  return {
    spec: {
      globalPrompt:
        "Create one photorealistic cinematic 16:9 scene image for a modern web novel. Keep the style consistent with the title, character, and talk-level background prompts. Use realistic anatomy, realistic materials, and live-action-like lighting.",
      globalNegativePrompt:
        "anime, manga, cel shading, cartoon, text, logo, watermark, collage, split panel, multiple moments in one frame, deformed anatomy",
      fixedWidth: 1920,
      fixedHeight: 1080,
      outputDir: "project/assets/episodes",
      defaultModel: "gemini-3.1-flash-image-preview",
    },
    characters: [],
    sceneOverrides: {},
  };
}

async function main() {
  const options = parseArgs(process.argv);
  const nowIso = new Date().toISOString();
  const manuscriptDir = path.join(rootDir, "project", "manuscript");

  await Promise.all([
    ensureDir(path.join(rootDir, "docs")),
    ensureDir(path.join(rootDir, "project", "assets", "title")),
    ensureDir(path.join(rootDir, "project", "assets", "characters")),
    ensureDir(path.join(rootDir, "project", "assets", "episodes")),
    ensureDir(path.join(rootDir, "project", "assets", "world")),
    ensureDir(manuscriptDir),
    ensureDir(path.join(rootDir, "prompts")),
  ]);

  const created = [];

  if (
    await writeFileIfMissing(
      path.join(rootDir, "project", "00_project_overview.md"),
      buildOverviewTemplate(options, nowIso),
    )
  ) {
    created.push("project/00_project_overview.md");
  }

  if (await writeFileIfMissing(path.join(rootDir, "project", "01_plot.md"), buildPlotTemplate(options))) {
    created.push("project/01_plot.md");
  }

  if (
    await writeFileIfMissing(path.join(rootDir, "project", "02_characters.md"), buildCharactersTemplate(options))
  ) {
    created.push("project/02_characters.md");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "project", "03_worldbuilding.md"),
      buildWorldTemplate(options),
    )
  ) {
    created.push("project/03_worldbuilding.md");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "project", "04_chapter_outline.md"),
      buildChapterOutlineTemplate(options),
    )
  ) {
    created.push("project/04_chapter_outline.md");
  }

  if (
    await writeFileIfMissing(path.join(rootDir, "project", "05_style_guide.md"), buildStyleGuideTemplate(options))
  ) {
    created.push("project/05_style_guide.md");
  }

  if (
    await writeFileIfMissing(
      path.join(manuscriptDir, "00_manuscript_overview.md"),
      buildManuscriptOverviewTemplate(options),
    )
  ) {
    created.push("project/manuscript/00_manuscript_overview.md");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "project", "06_series_inheritance.md"),
      buildSeriesInheritanceTemplate(options),
    )
  ) {
    created.push("project/06_series_inheritance.md");
  }

  if (
    await writeFileIfMissing(
      path.join(manuscriptDir, "chapter_01.md"),
      isSatoSeries(options)
        ? "## 第1章　章題\n\n### 第1話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n\n### 第2話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n"
        : "## 第1章　はじまり\n\n### Scene 01\nここから本文を書く。\n",
    )
  ) {
    created.push("project/manuscript/chapter_01.md");
  }

  if (isSatoSeries(options)) {
    if (
      await writeFileIfMissing(
        path.join(manuscriptDir, "chapter_02.md"),
        "## 第2章　章題\n\n### 第1話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n\n### 第2話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n",
      )
    ) {
      created.push("project/manuscript/chapter_02.md");
    }

    if (
      await writeFileIfMissing(
        path.join(manuscriptDir, "chapter_03.md"),
        "## 第3章　章題\n\n### 第1話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n\n### 第2話　話題\n\n#### 第1節　節題\nサトーパート\n\nここにサトー側の本文を書く。\n\n#### 第2節　節題\nセラパート\n\nここにセラ側の本文を書く。\n",
      )
    ) {
      created.push("project/manuscript/chapter_03.md");
    }
  }

  if (
    await writeFileIfMissing(
      path.join(manuscriptDir, "full_novel.md"),
      buildFullNovelTemplate(options.title, options),
    )
  ) {
    created.push("project/manuscript/full_novel.md");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "prompts", "title-image.json"),
      `${JSON.stringify(buildTitlePromptTemplate(options), null, 2)}\n`,
    )
  ) {
    created.push("prompts/title-image.json");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "prompts", "character-portraits.json"),
      `${JSON.stringify(buildCharacterPromptTemplate(options), null, 2)}\n`,
    )
  ) {
    created.push("prompts/character-portraits.json");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "prompts", "background-concepts.json"),
      `${JSON.stringify(buildBackgroundConceptTemplate(options), null, 2)}\n`,
    )
  ) {
    created.push("prompts/background-concepts.json");
  }

  if (
    await writeFileIfMissing(
      path.join(rootDir, "prompts", "scene-character-references.json"),
      `${JSON.stringify(buildSceneCharacterReferencesTemplate(options), null, 2)}\n`,
    )
  ) {
    created.push("prompts/scene-character-references.json");
  }

  if (await writeFileIfMissing(path.join(rootDir, "docs", ".nojekyll"), "")) {
    created.push("docs/.nojekyll");
  }

  process.stdout.write(
    created.length === 0
      ? "Project scaffold already existed.\n"
      : `Created ${created.length} files:\n- ${created.join("\n- ")}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
