# 日本語ランゲージパック（dsh-locale-ja）

DeepSeek Harness（DSH）の Web UI に「日本語」を追加する言語パックです。
導入後、`設定 → 一般 → 言語` から「日本語」を選択できます。
既存の英語・中国語の辞書は置き換えず、訳がないキーは英語にフォールバックします。

## インストール

作者と同じフォルダー構成にする必要はありません。公開されているこのリポジトリを取得し、自分の DSH の Web プロファイルに登録してください。npm レジストリへの公開は行っていません。

### 必要なもの

- インストール済みの DeepSeek Harness と Web プロファイル
- Node.js と、その DSH 環境で使用している pnpm
- Git（ZIP で取得する場合は不要）

このパックは DSH のロケールサービス `@deepseek-ai/dsh-client-locale` を使用します。DSH のすべてのバージョンでの動作を保証するものではありません。

### 1. 言語パックを取得する

任意の作業フォルダーで実行します。

```sh
git clone https://github.com/tatudrag0n/dsh-locale-ja.git
```

Git を使わない場合は、このページの `Code → Download ZIP` から取得して展開してください。
`package.json` と `client.js` が直接入っているフォルダーが言語パックのフォルダーです。
生成済みの `client.js` を同梱しているため、通常の導入に翻訳辞書の再生成やビルドは不要です。

### 2. Web プロファイルに依存関係を追加する

DSH を停止し、使用中の Web プロファイルの `package.json` をバックアップしてください。
通常の配置例は `$DSH_HOME/profiles/web/package.json` ですが、環境変数が設定されているとは限りません。実際に使用しているプロファイルを指定してください。

Web プロファイルのフォルダーへ移動し、取得した言語パックの絶対パスで実行します。

Windows / PowerShell の例（パスは自分の環境に置き換える）：

```powershell
Set-Location 'C:\path\to\dsh\profiles\web'
pnpm add '@local/dsh-locale-ja@link:C:/path/to/dsh-locale-ja'
```

macOS / Linux の例（パスは自分の環境に置き換える）：

```sh
cd /path/to/dsh/profiles/web
pnpm add '@local/dsh-locale-ja@link:/path/to/dsh-locale-ja'
```

`link:` は手元のフォルダーを参照します。導入後も言語パックのフォルダーを削除・移動しないでください。Windows の依存指定では `/` 区切りを使用します。

### 3. bundles に登録する

同じ Web プロファイルの `package.json` にある `dsh.profile.bundles` の末尾へ `@local/dsh-locale-ja` を追加します。既存の依存関係・設定・bundles は残してください。同じ項目を二重に追加しないでください。

以下は構造の例です。ファイル全体をこの例で置き換えないでください。

```json
{
  "dependencies": {
    "@local/dsh-locale-ja": "link:/absolute/path/to/dsh-locale-ja"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@local/dsh-locale-ja"
      ]
    }
  }
}
```

`dependencies` の実際のパスは手順 2 の `pnpm add` で設定されます。Windows なら `link:C:/path/to/dsh-locale-ja` のような値になります。

### 4. 再起動して日本語を選ぶ

DSH を起動し、ブラウザーのページを再読み込みします。
`設定 → 一般 → 言語` で「日本語」を選んでください。

### 日本語が表示されない場合

- 編集した `package.json` が、実際に起動している Web プロファイルのものか確認する。
- `dependencies` と `dsh.profile.bundles` の両方に `@local/dsh-locale-ja` があるか確認する。
- `link:` の参照先に `package.json` と `client.js` があるか確認する。
- DSH を再起動し、ブラウザーを再読み込みする。
- ロケールサービスやプラグイン読み込みのエラーが出ていないか確認する。

配線の確認用ツールもあります。言語パックのフォルダーから実行し、対象プロファイルを明示してください。

```sh
node tools/verify-install.mjs --profile /absolute/path/to/dsh/profiles/web
```

## 更新・アンインストール

### 更新

Git で取得した場合は、言語パックのフォルダーで実行します。

```sh
git pull --ff-only
```

ZIP で取得した場合は、新しい ZIP を展開し、参照先の言語パックを更新してください。ローカルで変更したファイルは事前にバックアップしてください。
更新後は DSH を再起動し、ブラウザーを再読み込みします。

### アンインストール

1. 必要に応じて UI の言語を英語に戻し、DSH を停止する。
2. Web プロファイルの `dsh.profile.bundles` から `@local/dsh-locale-ja` だけを削除する。
3. Web プロファイルのフォルダーで `pnpm remove @local/dsh-locale-ja` を実行する。
4. DSH を起動し、ブラウザーを再読み込みする。

参照を解除した後は、取得した言語パックのフォルダーも削除できます。

## 仕組み

`client.js` は `client.src.js` と辞書から生成します。

```js
ctx.effect(() => ctx.locale.addLanguage({ id: 'ja', label: '日本語', fallback: 'en' }), 'locale-ja: language')
for (const [namespace, dictionary] of Object.entries(DICTIONARIES)) {
  ctx.effect(() => ctx.locale.register(namespace, 'ja', dictionary), `locale-ja: ${namespace}`)
}
```

- `addLanguage` で言語一覧に `ja` を追加します。
- `register` で名前空間ごとの日本語辞書を登録します。
- 登録は `ctx.effect` が管理し、プラグインを外すと解除されます。
- 同じ名前空間の日本語辞書が競合した場合は、その名前空間をスキップして残りを読み込みます。

## 開発・翻訳更新

通常の利用者は以下の作業を行う必要はありません。
言語パックのフォルダーで実行してください。抽出には DSH 本体のインストール環境が必要です。環境固有の設定は各ツールを確認してください。

```sh
node tools/extract.mjs
node tools/make-work.mjs
# work/chunks/chunk-NN.json を訳し、out-NN.json に保存
node tools/apply-translations.mjs --strict
node tools/build.mjs
node --test
```

| ファイル | 役割 |
| --- | --- |
| `client.src.js` | クライアント処理のテンプレート |
| `client.js` | ブラウザーが読み込む生成物。直接編集しない |
| `dictionaries/` | 名前空間別の英語キー・中国語・日本語辞書 |
| `tools/extract.mjs` | DSH のクライアントバンドルから辞書を抽出 |
| `tools/literal.mjs` | オブジェクトリテラルのパーサー |
| `tools/make-work.mjs` | 英語文字列を重複排除し翻訳チャンクを生成 |
| `tools/apply-translations.mjs` | 原文と ID を検証して訳を反映 |
| `tools/set-translation.mjs` | 訳文修正をチャンクに反映 |
| `tools/build.mjs` | 辞書から `client.js` を生成 |
| `tools/check.mjs` | カバレッジ・未訳・空訳・プレースホルダーを検査 |
| `tools/variants.mjs` | 表記ゆれを検出 |
| `tools/lookup.mjs` | ID から名前空間とキーを逆引き |
| `tools/list-registers.mjs` | 名前空間の登録元を一覧表示 |
| `tools/verify-install.mjs` | プロファイルの依存・bundles・解決・バンドルを検証 |

`work/` は翻訳作業の記録で、パッケージの配布対象には含まれません。
同じ英語文字列は一度だけ訳し、各キーに同じ訳を適用します。

## 検証

```sh
node --test
node tools/check.mjs --strict
node tools/build.mjs --check
node tools/variants.mjs
```

`test/pack.test.mjs` は生成された `client.js` をモジュールローダーのスタブで実行し、言語と辞書の登録を検査します。

## 既知の制約

- 訳のないキーは英語で表示されます。
- 辞書は抽出時点の DSH を基準にしているため、本体更新で追加されたキーには再抽出・翻訳が必要です。
- コマンド説明など、登録時点の文言を保持する箇所は、言語変更後に再登録や再起動が必要な場合があります。
- この言語パックは複数形の使い分けや双方向レイアウトを追加するものではありません。
- Windows・macOS・Linux それぞれの実環境での導入確認は別途必要です。

## ライセンス

MIT
