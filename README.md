# DSH 日本語ランゲージパック

DeepSeek Harness（DSH）の Web UI に日本語を追加する言語パックです。
設定画面で「日本語」を選ぶと、対応する画面のメニューやメッセージを日本語で表示します。未翻訳の項目は英語で表示されます。

[ダウンロード（Releases）](https://github.com/tatudrag0n/dsh-locale-ja/releases/latest)

## 必要なもの

- セットアップ済みの DSH と Web プロファイル
- Node.js と pnpm（使用中の DSH 環境に合わせてください）

DSH 本体は付属しません。言語パックはビルド済みなので、Git のインストールやビルド作業は不要です。

## インストール

### 1. ダウンロードして展開

[Releases](https://github.com/tatudrag0n/dsh-locale-ja/releases/latest) の `Assets` から、OS に合ったファイルをダウンロードします。

| OS | ダウンロードするファイル |
| --- | --- |
| Windows | `dsh-locale-ja-<バージョン>-windows.zip` |
| Linux | `dsh-locale-ja-<バージョン>-linux.tar.gz` |

展開した `dsh-locale-ja` フォルダーを、今後も保存しておく場所へ置いてください。このフォルダー内に `package.json` と `client.js` があれば準備完了です。

### 2. DSH に登録

DSH を停止し、使用中の Web プロファイルの `package.json` をバックアップします。
Web プロファイルは通常 `DSH のホーム/profiles/web` にあります。複数のプロファイルがある場合は、実際に使用しているものを選んでください。

以下のパスを自分の環境に置き換えて実行します。

#### Windows（PowerShell）

```powershell
# DSH の Web プロファイルへ移動
Set-Location 'C:\path\to\dsh\profiles\web'

# 展開した言語パックを登録（link: のパスは / 区切り）
pnpm add '@local/dsh-locale-ja@link:C:/path/to/dsh-locale-ja'
```

#### Linux（ターミナル）

```sh
# DSH の Web プロファイルへ移動
cd '/path/to/dsh/profiles/web'

# 展開した言語パックを登録
pnpm add '@local/dsh-locale-ja@link:/path/to/dsh-locale-ja'
```

続いて、同じ Web プロファイルの `package.json` を開き、`dsh` → `profile` → `bundles` の配列の末尾に、次の文字列を追加します。

```json
"@local/dsh-locale-ja"
```

既存の項目は削除せず、直前の項目との間にカンマを入れてください。すでに登録されている場合は追加不要です。依存関係の欄は、上の `pnpm add` が設定します。

> `link:` は展開先をそのまま参照します。導入後に言語パックのフォルダーを移動・削除しないでください。

### 3. 日本語を選ぶ

DSH を起動し、ブラウザーを再読み込みします。
`Settings → General → Language`（設定 → 一般 → 言語）で「日本語」を選んで完了です。

## よくある質問

### ダウンロードしただけで使えますか？

DSH 側への登録が必要です。上記の手順 2 と 3 を実施してください。配布物は言語パックであり、自動インストーラーではありません。

### 「日本語」が表示されません

次の点を確認してください。

- 編集したのが、起動中の DSH で使用している Web プロファイルの `package.json` であること
- `dependencies` と `dsh.profile.bundles` の両方に `@local/dsh-locale-ja` があること
- `link:` の参照先に `package.json` と `client.js` があること
- DSH の再起動と、ブラウザーの再読み込みを行ったこと

解決しない場合は、DSH のログでプラグインやロケールサービスの読み込みエラーを確認してください。

### 一部だけ英語のままです

未翻訳の項目や、DSH の更新で追加された項目は英語で表示されます。また、コマンドの説明など一部の表示は、言語変更後に DSH の再起動が必要な場合があります。

### 対応バージョンは？

DSH のロケールサービス `@deepseek-ai/dsh-client-locale` を使用します。すべての DSH バージョンでの動作や、Windows・Linux の実環境での互換性を保証するものではありません。

## 更新

1. DSH を停止する。
2. 新しい Release をダウンロードして展開し、現在の言語パックのフォルダーを新しい内容に置き換える。
3. DSH を起動し、ブラウザーを再読み込みする。

展開先のパスが同じなら再登録は不要です。パスを変更した場合は、新しいパスでインストール手順 2 を実行してください。自分で変更した辞書などがある場合は、更新前にバックアップしてください。

## アンインストール

1. 必要に応じて表示言語を英語へ戻し、DSH を停止する。
2. Web プロファイルの `package.json` の `dsh.profile.bundles` から `@local/dsh-locale-ja` を削除する。
3. Web プロファイルのフォルダーで次を実行する。

```sh
pnpm remove @local/dsh-locale-ja
```

DSH を起動し、ブラウザーを再読み込みします。その後、言語パックのフォルダーも削除できます。

## 不具合報告

[Issues](https://github.com/tatudrag0n/dsh-locale-ja/issues) に、OS、DSH のバージョン、言語パックのバージョン、再現手順、エラーメッセージを添えて報告してください。ログに含まれる API キーや個人情報は削除してください。

## 開発・翻訳への参加

通常のインストールでは、以下の作業は不要です。

### 主なファイル

| ファイル | 内容 |
| --- | --- |
| `client.js` | 日本語辞書を含む生成済みクライアント。直接編集しない |
| `client.src.js` | 言語・辞書の登録処理 |
| `dictionaries/` | 名前空間ごとの翻訳辞書 |
| `index.js` / `cordis.patch.yml` | DSH への組み込み |
| `tools/` | 辞書抽出・翻訳反映・ビルド・検証ツール |
| `test/` | パーサー・辞書・生成物のテスト |
| `work/` | 翻訳作業の記録。Release パッケージには含まれない |

### 仕組み

`ctx.locale.addLanguage` で「日本語」を追加し、`ctx.locale.register` で名前空間ごとに日本語辞書を登録します。既存の英語・中国語辞書は置き換えません。登録は `ctx.effect` で管理されます。

### 翻訳の更新

リポジトリのルートで実行します。辞書の再抽出には DSH 本体のインストール環境が必要です。環境固有の設定は各ツールを確認してください。

```sh
node tools/extract.mjs
node tools/make-work.mjs
# work/chunks/chunk-NN.json を訳し、out-NN.json に保存
node tools/apply-translations.mjs --strict
node tools/build.mjs
```

辞書は抽出時点の DSH を基準にしています。同じ英語文字列は重複を除いて翻訳し、各キーに適用します。

### 検証

```sh
node --test
node tools/check.mjs --strict
node tools/build.mjs --check
node tools/variants.mjs
```

`test/pack.test.mjs` は生成済みの `client.js` をモジュールローダーのスタブで実行し、言語・辞書の登録を検査します。これらの検査は DSH 実環境での動作確認に代わるものではありません。

プロファイルへの登録状態は、言語パックのフォルダーから次のコマンドで確認できます。

```sh
node tools/verify-install.mjs --profile /absolute/path/to/dsh/profiles/web
```

その他の補助ツール：`tools/set-translation.mjs`（訳文修正）、`tools/lookup.mjs`（ID の逆引き）、`tools/list-registers.mjs`（名前空間の登録元）、`tools/literal.mjs`（抽出用パーサー）。このパックは複数形処理や双方向レイアウトを追加するものではありません。

## ライセンス

[MIT](LICENSE)
