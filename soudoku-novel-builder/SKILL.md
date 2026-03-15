---
name: soudoku-novel-builder
description: Use this skill to create Soudoku novels, an original Japanese "creative reading" approach to building a novel step by step.
---

# Soudoku Novel Builder

「創りながら読む」創読向けの小説制作スキル。全量を一気に書かず、ユーザとの対話、画像生成、レスポンシブ Web ビルド、整合性確認を反復しながら作品を育てる。

## First Moves

1. まず現在の小説ルートに `project/`, `prompts/`, `docs/`, `scripts/` が揃っているか確認する。
2. `project/` が無ければ `node scripts/init-novel-project.mjs --title="..."` を実行して雛形を作る。
3. `project/assets/characters/sato.png` と `project/assets/characters/sera.png` がある場合、それをシリーズ共通の canonical portraits とみなす。
4. canonical portraits があるシリーズ回では、本文や節画像に入る前に、その回専用の `sato-episode` / `sera-episode` 画像を必ず先に作る。
5. シリーズ回では `references/ossan-sato-series-canon.md` と `references/ossan-sato-series-structure.md` を先に確認し、共通設定と固定構成を正本として扱う。
6. シリーズ回では `references/ossan-sato-series-living-world.md` も確認し、これまでに固まった地理や recurring setting を継承する。
7. 新しい地名や recurring setting が出たら、それが `回固有` か `シリーズ共通候補` かを判定する。
8. `シリーズ共通候補` と判断したものは、本文や画像だけで終わらせず、先に `references/ossan-sato-series-living-world.md` と `references/ossan-sato-series-change-log.md` を更新する。
9. 最初の制作フェーズでは本文を先に書かない。まず「全体プロット」「主要キャラクター設定」「主要キャラクター画像」「各話背景イメージ」を揃える。
10. 初期セットが揃ったら、必ず一度ユーザ確認を入れる。承認前に第1章本文へ進まない。
11. ユーザが曖昧なら、最初に次を短く聞く: テーマ、ジャンル、核となる感情、想定ボリューム、避けたい要素、画像トーン。

## Otsusan Sato Series Template

このリポジトリは「おっさんサトーの気ままなXX」シリーズのテンプレートとしても使う。

- シリーズ共通設定は `references/ossan-sato-series-canon.md` を正本とする。
- シリーズ固定構成は `references/ossan-sato-series-structure.md` を正本とする。
- シリーズが進むにつれて固まった地理、 recurring place、生活導線、協力ラインは `references/ossan-sato-series-living-world.md` に蓄積する。
- いつどの作品で何を series canon に昇格させたかは `references/ossan-sato-series-change-log.md` に記録する。
- 新しい回では、キャラクター設定や世界観設定を毎回ゼロから作らず、共通設定を継承し、その回固有の題材・背景・事件・服装差分だけを更新する。
- canonical portraits は `project/assets/characters/sato.png` と `project/assets/characters/sera.png` を使う。
- 各回では、まず canonical portraits を元に、その回専用の立ち絵を生成する。
- その回専用立ち絵が固まるまで、節画像やタイトル画像を先に作らない。
- 1 作品の標準構成は `3章 / 6話 / 12節`、`1話 = 1事件`、`第1節 = サトーパート`、`第2節 = セラパート`。
- 同じ話のサトーパートとセラパートは同時刻の別カットであり、セラ側の防衛結果はサトー側へ「ちょっとした違和感」として必ず反映させる。
- 各話では、セラパートで回収する護衛アクションを、必ず先にサトーパートで「ちょっとした違和感」として描く。サトーはその違和感に対して、日常的な解釈で短くひとこと呟く。
- 各サトーパートでは、サトー本人の直接セリフを最低 2 つ入れる。1 つは異変を楽観的に流すためのセリフ、もう 1 つはその場の日常の快さや楽しさを言葉にするセリフで、できる限り別々に置く。
- セラの敵制圧は非致死かつ非刃物に限る。ナイフ、短剣、刃、剣、刃付きツールは使わず、必要な道具は非刃物の拘束具、解除具、通信阻害具、環境物などに限る。
- サトーの認識や独り言はサトーパートにだけ置く。セラパートでサトーの気づきや解釈を代弁しない。
- セラのセリフは、敵を叱るためではなく、その場のサトーの日常、気分、静けさ、余韻を守るために置く。短く低温で、`〜しないでください`、`〜させません`、`〜だけ残れば十分です` のような抑えた言い回しを優先する。
- セラパートの締めの一言は「何を排除したか」ではなく「サトーに何を崩さず残すか」で終える。作戦報告や勝利宣言で締めない。

## Growing Canon Rules

- `固定 canon` と `成長 canon` を分けて扱う。
- `固定 canon`: サトー、セラ、国家機密、護衛構図、標準構成など。`references/ossan-sato-series-canon.md` と `references/ossan-sato-series-structure.md` に置く。
- `成長 canon`: 地名、 recurring place、 recurring social link、 recurring lifestyle fact など。`references/ossan-sato-series-living-world.md` に置く。
- 新しい設定は次のどちらかへ分類する。
  - `回固有`: その作品でだけ使う設定
  - `シリーズ共通候補`: 今後も再利用したい設定
- `シリーズ共通候補` の例:
  - 川、橋、街区、近所の店、 recurring な生活導線
  - recurring な協力ラインや組織名
  - サトーの生活習慣として今後も使いたい事実
- `回固有` の例:
  - その回だけの事件手口
  - 一度きりの敵役
  - その回だけの服装差分
  - 一度しか使わない背景小物
- シリーズ共通候補を採用したら、本文や画像へ反映する前に `references/ossan-sato-series-living-world.md` と `references/ossan-sato-series-change-log.md` を更新する。
- 各作品側には `project/06_series_inheritance.md` を置き、その作品が制作開始時点で継承した series canon と、今回追加候補になった設定と、今回 canon へ昇格させた設定を書く。

## Composition Model

このスキルの構成単位は必ず `章 > 話 > 節` で固定する。
AI は本文、アウトライン、画像、Web 表示のすべてをこの 3 層に対応づけて扱う。

### 用語対応

- 正式な呼び方は `章`, `話`, `節` を使う。
- 実装やデータで `chapter` と書かれているものは `章` を指す。
- 実装やデータで `talk` と書かれているものは `話` を指す。
- 実装やデータで `scene` と書かれているものは `節` を指す。

### 章

- `章` は物語の大きな転換点を表す最大単位。
- `章` は 1 つ以上の `話` を含む。
- 制作上の責務は、ユーザ確認を入れる基本単位であること。
- `章` をまたぐ変更は、到達点、対立、関係性、状況の大きな変化を伴う。
- `章` の完了条件は、その章に属する `話` と `節` の本文が揃い、ユーザ確認に出せること。

### 話

- `話` は読者に一回で読ませるまとまりを表す中間単位。
- `話` は 1 つ以上の `節` を含む。
- 執筆上の責務は、1 回の本文作成で扱う最小の読み物単位であること。
- `話` の中では、ひとつの目的、問い、出来事のまとまりを保つ。
- `話` の完了条件は、その話を単独で読んでも流れが追え、所属する `節` が揃っていること。

### 節

- `節` は背景、状況、時間、視点の連続した 1 場面を表す最小単位。
- `節` は画像生成と Web 表示の最小単位。
- 各 `節` は 1 つの `scene-id` を持つ。
- `節` の完了条件は、本文上の 1 場面として独立し、必要なら対応する画像を生成できること。

### Operational Mapping

- `章`: 物語設計とレビューの単位。
- `話`: 読書体験と本文構成の単位。
- `節`: 画像生成と画面表示の単位。

### Decision Rules

- 大きな転換点が来るなら `新しい章` にする。
- 読者に一息で読ませるまとまりを分けるなら `新しい話` にする。
- 背景、状況、時間、視点が切り替わるなら `新しい節` にする。

### Boundary Examples

- 同じ目的の会話が続いていても、場所が変わるなら `同じ話 / 新しい節` にする。
- 同じ場所でも、読者に一回で読ませるまとまりを分けたいなら `新しい話` を検討する。

### Prohibited Heuristics

- 画像を増やしたいだけで `節` を増やさない。`節` は物語上の場面転換で切る。
- 読み味を細かくしたいだけで `章` を増やさない。`章` は大きな転換点で切る。
- `talk` や `scene` という実装語に引っ張られて、本文上の `話` と `節` の役割を入れ替えない。

### Invariants

- 本文を書く前に `project/04_chapter_outline.md` で `章 > 話 > 節` を定義する。
- 本文は `## 章`, `### 話`, `#### 節` を崩さない。
- `scene-id` は常に `節` に対応し、`scene-章(000)-話(000)-節(000)` 形式にする。
- `話` や `節` の追加、削除、順序変更は、先にアウトラインを更新してから行う。

## Working Rules

- `project/` 配下の設計ファイルが正本。少なくとも `project/00_project_overview.md`, `project/01_plot.md`, `project/02_characters.md`, `project/03_worldbuilding.md`, `project/04_chapter_outline.md`, `project/05_style_guide.md`, `project/manuscript/00_manuscript_overview.md` を基準にする。
- シリーズ回では `project/06_series_inheritance.md` を、その作品がどの series canon を継承しているかの記録として扱う。
- 聖典は `project/01_plot.md`, `project/02_characters.md`, `project/03_worldbuilding.md`, `project/04_chapter_outline.md`, `project/05_style_guide.md` に置く。本文を書く前にここを同期する。
- 構成単位の意味と判断ルールはこのファイルの `Composition Model` を正本とする。
- シリーズ回では、共通人物設定と共通世界観は `references/ossan-sato-series-canon.md` と矛盾させない。変更するのはその回固有の要素だけに留める。
- シリーズ回では、地理や recurring place や recurring lifestyle fact は `references/ossan-sato-series-living-world.md` とも矛盾させない。
- 節画像の `scene-id` は `scene-章(000)-話(000)-節(000)` 形式にする。例: `scene-001-002-003` は「第1章第2話第3節」に対応する `節`。
- 初回承認前に作るのは `project/01_plot.md`, `project/02_characters.md`, `project/03_worldbuilding.md`, `project/04_chapter_outline.md`, `prompts/character-portraits.json`, `prompts/background-concepts.json` とその生成物。背景画像は `各話につき 1 枚` を基本にし、タイトル画像はこの段階では作らない。
- 制作中の画像や中間生成物は常に `project/assets/` に保存する。`docs/` は配信用にビルドした結果だけを置く。
- 本文、画像、ビルドの作業中に設計との差分を見つけたら、必ずユーザへ先に指摘する。勝手に本文や画像へ反映しない。
- 設計変更が必要な場合は、必ず先に `project/` 側の該当ファイルを修正し、必要ならユーザ確認を取る。その後で本文・画像・ビルドに進む。
- アウトラインに存在しない `章・話・節` は勝手に追加しない。追加や削除や順序変更が必要なら、まず `project/04_chapter_outline.md` を直す提案を出し、承認後に更新する。
- キャラクター、世界観、語り口、到達点、構成、現在地などが `project/` の設計とズレる場合も同じ。先に設計を直し、本文は常に承認済み設計に従わせる。
- 新キャラクターや敵が出たら、まず `project/02_characters.md` と `prompts/character-portraits.json` を更新し、必要なら `node scripts/generate-character-portrait.mjs <id>` を使う。
- シリーズ回の `prompts/character-portraits.json` では、canonical portraits から派生するその回専用の `sato-episode` / `sera-episode` を最初に定義し、節画像はその派生立ち絵だけを参照する。
- 背景イメージは初期フェーズで `prompts/background-concepts.json` を更新し、各話につき 1 枚ずつ `node scripts/generate-background-concept.mjs <id|--all>` で生成する。
- 節画像では背景画像そのものを参照画像として渡さず、その話に対応する背景 prompt を `build-episode-image-manifest.mjs` でサトーパート / セラパート両方へ流用する。
- 複数枚の画像を生成する場面では、可能な限り並列生成を使う。背景、キャラクター、節画像は `--parallel=<n>` を付けて保守的に 2 枚前後ずつ並列化できる。
- 節画像を作る前に `node scripts/build-web-novel.mjs` と `node scripts/build-episode-image-manifest.mjs` を実行し、`prompts/episode-image-manifest.json` を更新する。
- 節画像は全件再生成しない。既存の `project/assets/episodes/*.webp` は保持し、新規追加または修正した `節` の画像だけを生成する。
- 節画像を再生成したいのは、対象の `節` を本文またはプロンプト上で修正した場合だけ。既存画像を上書きする必要があるときだけ `--force` を使う。
- 画像内に `第1章`, `第2話`, `第3節` のような小説の構造ラベル、字幕、キャプション、ロゴ、UI 文字を埋め込まない。文字情報は Web 側で表示し、生成画像そのものには入れない。
- タイトル画像には作品タイトル、サブタイトル、ロゴ、章話節ラベル、クレジット、UI 文字などの `後乗せの小説表示` を入れない。背景の一部として自然に存在する店名看板や街中表示は許容する。
- Web ビルドは `project/` と `project/assets/` を入力にして `docs/` を生成する。`docs/` は公開用成果物であり、作業中アセットの保管場所ではない。
- Web UI はスマホ縦と横画面で見た目を変えるが、読書操作はどちらも縦スクロールで統一する。
- 本文制作は初期承認のあとに `第1章第1話` から順に進める。少なくとも章が1つ完成するごとに止まり、ユーザ確認と修正を挟む。
- 章ごとの標準ループは「本文作成 -> ユーザ確認 -> 節画像生成 -> Web ビルド -> フィードバック反映」。
- 話が進むごとに設定変更やピボットが起こる前提で、毎回 `project/01_plot.md` と `project/manuscript/00_manuscript_overview.md` に変更理由を残す。
- フィードバックは本文、画像、Web 表示の3点で受ける。

## Standard Loop

### 1. 初期設計

- `references/project-files.md` を必要部分だけ確認する。
- シリーズ回では `references/ossan-sato-series-canon.md` と `references/ossan-sato-series-structure.md` を最初に確認する。
- シリーズ回では `references/ossan-sato-series-living-world.md` も最初に確認する。
- ヒアリング結果を `project/00_project_overview.md` と各聖典ファイルへ反映する。
- シリーズ回では `project/06_series_inheritance.md` に、今回継承した設定と今回追加候補の欄を先に作る。
- `project/04_chapter_outline.md` では本文を書く前に `章 > 話 > 節` の骨格を作る。

### 1.5. 差分確認

- 本文や画像の次の一手を決める前に、現在の要求が `project/` の設計群と一致しているかを見る。
- 差分があれば、どのファイルのどの前提とズレるかを短く明示してユーザへ確認する。
- ユーザが変更意思を示したら、先に設計ファイルを更新する。設計未更新のまま本文や画像を先行させない。

### 2. 初期ビジュアル設計

- キャラクター画像は `references/prompt-files.md` の `character-portraits.json` 形式に従って更新する。
- シリーズ回では、節画像やタイトル画像より先に、その回専用の `sato-episode` / `sera-episode` を canonical portraits から生成する。
- 背景イメージは `prompts/background-concepts.json` を更新し、各話につき 1 枚の主要背景を先に作る。

### 3. 初回承認ゲート

- ここでユーザに「プロット」「主要キャラクター」「主要キャラクター画像」「各話背景イメージ」を確認してもらう。
- 承認が出るまで本文制作へ進まない。修正が出たら聖典と画像定義を更新して再提示する。

### 4. 章制作

- 承認後に `第1章第1話` から順に作る。
- 作る対象は、承認済みの `project/04_chapter_outline.md` に存在する `章・話・節` に限る。
- その時点で扱う章の本文だけを書く。本文は `章 > 話 > 節` を崩さない。
- `project/manuscript/chapter_XX.md` と `project/manuscript/full_novel.md` を同期する。
- 新規設定は本文より先に聖典へ反映する。
- 執筆中に「話を増やしたい」「節を足したい」「設定を変えたい」と判断した場合は、本文を書き足す前に設計差分としてユーザへ提示する。

### 5. 章確認と Web 更新

- 章が1つまとまったらユーザ確認を入れる。
- 承認または修正方針が出たら、節画像を生成する。
- `node scripts/build-web-novel.mjs`
- `node scripts/build-episode-image-manifest.mjs`
- 追加または修正した `節` の `scene-id` だけを `node scripts/generate-episode-image.mjs <scene-id ...>` で生成する。既存画像を作り直さない。
- 節画像生成後に再度 `node scripts/build-web-novel.mjs`

### 5.5. 最終タイトル画像

- タイトル画像は本文、主要節画像、キャラクター像、全体トーンが固まった最後に作る。
- `prompts/title-image.json` は、その時点で確定した `project/02_characters.md`, `project/05_style_guide.md`, `project/assets/characters/*.png`, `project/assets/world/*.webp` に合わせて更新する。
- 節画像は `16:9 / 1920x1080` を正本サイズとし、スマホ縦と横画面の両方で見やすいよう中央寄せと左右安全余白を守る。
- タイトル画像は現在のキャラクター画像と印象を揃える。必要なら `referenceImages` にサトーとニャル子の最新画像を入れて `node scripts/generate-title-image.mjs` を使う。
- タイトル画像でも `第1章`, `第2話`, `第3節` のような文字情報やロゴや UI 表示を画像に埋め込まない。
- タイトル画像では作品名やサブタイトルを画像に入れない。タイトル表示は Web UI 側に限定し、生成画像は `後乗せ文字のない` キービジュアルだけにする。背景の一部として自然に存在する看板や街中表示は許容する。

### 6. 整合性確認

- `node scripts/check-project-state.mjs` を実行して不足を確認する。
- あわせて `plot`, `characters`, `worldbuilding`, `chapter_outline`, `manuscript` を横断して矛盾をレビューする。

## Commands

- プロジェクト初期化: `node scripts/init-novel-project.mjs --title="作品名"`
- 状態確認: `node scripts/check-project-state.mjs`
- Web ビルド: `node scripts/build-web-novel.mjs`
- 節画像マニフェスト生成: `node scripts/build-episode-image-manifest.mjs`
- タイトル画像生成: `node scripts/generate-title-image.mjs`
- 背景イメージ生成: `node scripts/generate-background-concept.mjs <background-id|--all>`
- キャラクター画像生成: `node scripts/generate-character-portrait.mjs <character-id|--all>`
- 節画像生成: `node scripts/generate-episode-image.mjs <scene-id ...|--all> [--force]` 。
  ここでの `scene-id` は実質的に「節」の画像 ID。通常は変更した節だけを指定し、`--all` は初回生成や欠番補完に限る。既存画像の再生成は `--force` を付けたときだけ行う。
- 複数生成時の並列化: `node scripts/generate-background-concept.mjs --all --parallel=2`, `node scripts/generate-character-portrait.mjs --all --parallel=2`, `node scripts/generate-episode-image.mjs <scene-id ...> --parallel=2`

## Read As Needed

- ファイル役割や更新順は `references/project-files.md`
- `prompts/*.json` の形式は `references/prompt-files.md`
- シリーズ共通人物設定と裏設定は `references/ossan-sato-series-canon.md`
- シリーズ固定構成は `references/ossan-sato-series-structure.md`
- シリーズが進むごとに育つ world memory は `references/ossan-sato-series-living-world.md`
- series canon への昇格履歴は `references/ossan-sato-series-change-log.md`

このスキルの目的は完成原稿だけではなく、ユーザが段階的に読み進めながら創作そのものを楽しめる状態を保つこと。
