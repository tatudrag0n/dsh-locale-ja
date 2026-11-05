# DSH 日本語ランゲージパック

DeepSeek Harness (DSH) の Web UI に「日本語」を追加する言語パックです。

[Releases からダウンロード](https://github.com/tatudrag0n/dsh-locale-ja/releases/latest)

## 前提

- 設定済みの DSH Web プロファイル
- Node.js
- pnpm

## インストール（推奨）

1. Releases の `Assets` からアーカイブをダウンロードして展開する。
2. **DSH を停止**する。
3. 展開した `dsh-locale-ja` ディレクトリで実行する。

```sh
node install.mjs
```

プロファイルを明示する場合:

```sh
node install.mjs --profile /absolute/path/to/dsh/profiles/web
```

4. DSH を再起動し、ブラウザーを再読み込みして `Settings → General → Language` で「日本語」を選ぶ。

> `install.mjs` は `v1.0.1` 以降のアーカイブに同梱されています。`v1.0.0` の旧アーカイブには含まれません。

## トラブルシュート

- Windows で `v1.0.1` の `node install.mjs` がすぐ終了して導入されない:
  - `v1.0.1` のインストーラーには Windows の `pnpm.cmd` 実行まわりの不具合があります。
  - 修正を含む次のリリース（`v1.0.2`）が利用可能になったら更新してください。
- `pnpm was not found in PATH`:
  - pnpm をインストールして PATH を通したあと、再実行してください。
- プロファイル自動検出に失敗する / 複数候補が見つかる:
  - `--profile` で使用中の Web プロファイルを明示してください。
- `pnpm install` 失敗:
  - インストーラーは `package.json` をバックアップから復元します。
  - ただし `pnpm-lock.yaml` や `node_modules` の副作用は残る場合があります。

## 更新

1. DSH を停止する。
2. 新しいアーカイブを同じ固定パスへ展開して上書きする（または入れ替える）。
3. `node install.mjs` を再実行する。
4. DSH を再起動し、ブラウザーを再読み込みする。

`link:` 参照のため、導入後に言語パックの展開先を移動・削除しないでください。

## アンインストール

1. DSH を停止する。
2. Web プロファイルで `pnpm remove @local/dsh-locale-ja` を実行する。
3. `package.json` の `dsh.profile.bundles` から `@local/dsh-locale-ja` を削除する。
4. DSH を再起動し、ブラウザーを再読み込みする。

## 開発者向け

### 主要コマンド

```sh
node --test
node tools/check.mjs --strict
node tools/build.mjs --check
```

### リリース手順（メンテナー）

1. `package.json` の `version` を更新する。
2. `main` にマージ後、`v<version>` タグを push する（例: `v1.0.2`）。
   - もしくは GitHub Actions の `Package and release` を手動実行し、同じタグを入力する。
3. ワークフローは `package.json` の version とタグの一致を検証し、一致時のみ公開する。

### 検証範囲

このリポジトリの自動テストは辞書・生成物・インストーラーの整合性を検証します。DSH の実環境（Windows/Linux 実機）での統合動作は別途確認してください。

## ライセンス

[MIT](LICENSE)
