# おっさんサトーの気ままなシリーズ テンプレート

このリポジトリは、`おっさんサトーの気ままなXX` シリーズを Codex と一緒に増やしていくためのテンプレートです。  
汎用の創読テンプレートではなく、**サトー / セラ / 国家機密 / 気づかれない護衛** というシリーズ共通資産を最初から持った母体として使います。

## このテンプレートで固定されるもの

- サトーとセラの共通設定
- サトーが国家防衛の極秘システムの最後の生体認証鍵である裏設定
- セラがサトーに知られないまま護衛する構図
- `3章 / 各章2話 / 各話2節` の固定構成
- `1話 = 1事件`
- `第1節 = サトーパート`, `第2節 = セラパート`
- サトーパートには、セラの防衛結果が「ちょっとした違和感」として出るが、サトー本人は事件に気づかないという因果ルール

## canonical portraits

シリーズ共通の正本キャラクター画像は次です。

- `project/assets/characters/sato.png`
- `project/assets/characters/sera.png`

新しい回を作るときは、まずこの 2 枚を元にして、その回専用の派生立ち絵を作ります。

例:

- `sato-episode`
- `sera-episode`
- `sato-jogging`
- `sera-jogging`

節画像とタイトル画像は、必ずその回専用の派生立ち絵を参照します。  
`sato.png / sera.png` をそのまま全シーンへ直接使う前提ではありません。

## 何を毎回変えるか

各回で更新するのは、主に次です。

- タイトル / サブタイトル
- サトーが気ままに楽しむ題材
- 季節
- 舞台
- 各話の背景イメージ
- その回専用の服装
- 各話の事件内容

一方で、キャラクターの核や世界観の裏設定は毎回ゼロから作り直しません。

## 必要なもの

- Node.js 18 以上
- npm
- Codex CLI
- Gemini API キー

## セットアップ

### 1. 依存を入れる

```bash
npm install
```

### 2. Gemini API キーを設定する

```bash
cp .env.example .env
```

`.env` に `GEMINI_API_KEY` を設定します。

```env
GEMINI_API_KEY=your_api_key
```

### 3. Codex を開く

```bash
codex
```

## 基本の作り方

このテンプレートでは、毎回だいたい次の順で進めます。

1. 今回の題材、季節、舞台を決める
2. 共通設定を継承したまま、その回固有の `project/` 設計を作る
3. `sato.png / sera.png` を元に、その回専用のサトー画像とセラ画像を生成する
4. 各話の背景イメージを作る
5. `3章6話12節` のアウトラインを作る
6. 本文を書く
7. 節画像を作る
8. `docs/` をビルドする
9. 最後にタイトル画像を作る

## 画像と Web 表示の考え方

- キャラクター画像は従来どおり縦長の参照素材として使う
- 背景画像は各話につき 1 枚、標準構成では 6 枚だけ作る
- 背景画像はサトーパート側の見えている舞台を基準にする
- 節画像は背景画像そのものではなく、その背景画像を作った prompt を同じ話のサトーパート / セラパートで共有して使う
- 節画像とタイトル画像は `16:9 / 1920x1080` で生成する
- Web UI はレスポンシブで、スマホ縦も PC / スマホ横も縦スクロールで読み進める
- スマホ縦では、節画像が左から右へパンする
- PC / スマホ横では、`1920x1080` の節画像をフル表示しながら本文を重ねて読む

## シリーズ標準構成

1作品の標準構成は次です。

- 第1章
- 第2章
- 第3章

各章は 2 話です。  
各話は 2 節です。

各話の構造は固定です。

- 第1節: サトーパート
- 第2節: セラパート

そして、**1話につき1事件だけ** を扱います。

読者体験としては、

- サトー側で小さな違和感が見える
- サトーは「春風のせいだろう」「機械の調子でも悪いのだろう」と日常に解釈して流す
- 次のセラ側で、その違和感の正体が「拉致未遂を処理した結果だった」と分かる

という流れを全話で繰り返します。

## 初期化テンプレート

このリポジトリの `init` は、デフォルトでこのシリーズ向け雛形を作ります。

```bash
npm run init:project -- --title="おっさんサトーの気ままな散歩"
```

または直接:

```bash
node scripts/init-novel-project.mjs --title="おっさんサトーの気ままな散歩"
```

これで次のようなシリーズ前提の初期値が入ります。

- 共通設定を継承する `project/01_plot.md`
- サトー / セラの共通設定を持つ `project/02_characters.md`
- 国家機密を含む `project/03_worldbuilding.md`
- `3章6話12節` を前提にした `project/04_chapter_outline.md`
- サトー節 / セラ節のルールを持つ `project/05_style_guide.md`
- `sato-episode / sera-episode` を前提にした `prompts/character-portraits.json`

汎用テンプレートとして使いたい場合だけ、`--series=generic` を指定します。

```bash
node scripts/init-novel-project.mjs --series=generic --title="汎用作品"
```

## Codex への依頼例

### 新しい回を始める

```text
このテンプレートでシリーズ新作を作ります。
タイトルは「おっさんサトーの気ままな散歩」です。
秋の夕方の川沿いが舞台です。
まず共通設定を継承したまま、今回のプロット、背景、専用キャラクター画像を作ってください。
```

### その回専用の立ち絵から始める

```text
今回は温泉街編にします。
まず canonical portraits の sato.png と sera.png を元に、
今回専用のサトー画像とセラ画像を生成してください。
その後でアウトラインへ進めてください。
```

### 節画像だけ直す

```text
scene-002-001-002-sera.webp を作り直してください。
プロンプトはそのままで良いです。
```

### docs まで反映する

```text
この修正内容で節画像を更新して、docs ビルドまで進めてください。
```

## 重要なファイル

- `project/`: 設計と本文の正本
- `project/assets/characters/sato.png`: サトーの canonical portrait
- `project/assets/characters/sera.png`: セラの canonical portrait
- `prompts/character-portraits.json`: その回専用の派生立ち絵定義
- `prompts/background-concepts.json`: 各話ごとの背景 prompt と背景画像定義
- `prompts/scene-character-references.json`: 節画像参照定義
- `docs/`: 公開用成果物
- `soudoku-novel-builder/SKILL.md`: Codex が従う制作ルール
- `soudoku-novel-builder/references/ossan-sato-series-canon.md`: シリーズ共通設定
- `soudoku-novel-builder/references/ossan-sato-series-structure.md`: シリーズ固定構成

## 画像生成コスト

キャラクター画像、背景画像、節画像、タイトル画像はすべて Gemini API の画像生成を使います。  
そのため、作り直すたびにコストが発生します。

現在使っている画像モデル:

- `gemini-3.1-flash-image-preview`

## GitHub Pages

`docs/` はそのまま GitHub Pages で公開できます。

1. GitHub に push する
2. `Settings`
3. `Pages`
4. `Deploy from a branch`
5. branch に `main`
6. folder に `/docs`

## 補足

- 制作中データは `project/` に蓄積されます
- 配信用成果物は `docs/` に出力されます
- 節画像は必要なものだけ再生成する運用が前提です
- タイトル画像は最後に作る想定です
