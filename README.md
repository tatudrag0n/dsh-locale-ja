# 日本語ランゲージパック（dsh-locale-ja）

DeepSeek Harness の Web UI に **日本語** を追加する言語パックです。
`設定 → 一般 → 言語` の一覧に「日本語」が並び、選ぶと UI の文言が日本語に切り替わります。

- 言語の登録はロケールサービスの `addLanguage` 経由。設定欄の一覧はここから作られるので、選択肢に「日本語」が出ます
- 文言は**クライアントプラグインが登録している名前空間ごとの辞書**として `ja` を足す方式。既存の `zh` / `en` を置き換えず、3 列目を追加します
- 訳が無いキーは `fallback: 'en'` で英語のまま表示されるため、**部分的に訳が当たっていない状態でも UI は壊れません**
- 辞書は DSH 本体のインストール先から静的に抽出したキー集合が基準。DSH を更新したら再抽出して差分だけ訳せば追従できます
- 同じ英語文字列は 1 回だけ訳し、同じ訳を全キーに配ります（「Cancel」が画面ごとに違う日本語にならない）

## インストール

プラグイン一式は `C:\root\dsh-locale-ja` にあります。プロファイルの `package.json` にリンクを追加し、`dsh.profile.bundles` の末尾に入れます。

```jsonc
// $DSH_HOME/profiles/web/package.json
"dependencies": {
  "@local/dsh-locale-ja": "link:C:/root/dsh-locale-ja"
},
"dsh": {
  "profile": {
    "bundles": [
      // …
      "@local/dsh-locale-ja"
    ]
  }
}
```

```powershell
pnpm install --dir "$env:DSH_HOME\profiles\web"
```

HMR が有効なプロファイルなら `dsh.profile.bundles` の変更を検知して再構成します。検知しない場合は Harness を再起動してください。
反映後、`設定 → 一般 → 言語` に「日本語」が現れます。ブラウザ側のモジュールグラフはページ読み込み時に組まれるので、**一度ページを再読み込み**してください。

## 仕組み

```js
// client.js（client.src.js から生成）
ctx.effect(() => ctx.locale.addLanguage({ id: 'ja', label: '日本語', fallback: 'en' }), 'locale-ja: language')
for (const [namespace, dictionary] of Object.entries(DICTIONARIES)) {
  ctx.effect(() => ctx.locale.register(namespace, 'ja', dictionary), `locale-ja: ${namespace}`)
}
```

- `addLanguage` … 言語カタログに `ja` を追加。`fallback: 'en'` なので、訳の無いキーは英語に落ちます
- `register(ns, 'ja', dict)` … 名前空間ごとの 1 言語ぶんの辞書登録。言語パック向けの公式な入口です
- どちらも `ctx.effect` が所有するので、プラグインを外せば選択肢も文言も元に戻ります
- 既に同じ `(名前空間, ja)` を主張しているプラグインがあっても、その名前空間だけ落として残りは読み込みます

## 辞書の更新フロー

```powershell
cd C:\root\dsh-locale-ja
node tools/extract.mjs        # DSH インストール先からキーと zh/en を抽出（既存の ja は保持）
node tools/make-work.mjs      # 未訳の英語文字列を重複排除して作業チャンクに分割
#   work/chunks/chunk-NN.json を訳して work/chunks/out-NN.json に書く
node tools/apply-translations.mjs --strict
node tools/build.mjs          # client.js を再生成
node --test                   # 整合性チェック
```

| ファイル | 役割 |
| --- | --- |
| `client.src.js` | クライアント Half のロジック（ビルド時のテンプレート） |
| `client.js` | 生成物。ブラウザが読む唯一のファイル。直接編集しない |
| `dictionaries/<名前空間>.json` | 抽出した `keys`（英語）・`zh`・`ja`。訳の正本 |
| `tools/extract.mjs` | DSH インストール先の `lib/client.js` を静的に解析して辞書を回収 |
| `tools/literal.mjs` | バンドル内のオブジェクトリテラルを読む小さなパーサ |
| `tools/make-work.mjs` | 重複排除した翻訳作業チャンクを作る |
| `tools/apply-translations.mjs` | チャンクの訳を辞書へ書き戻す（id と原文の一致を検査） |
| `tools/set-translation.mjs` | レビュー指摘などの訳文修正をチャンクへ書き戻す |
| `tools/build.mjs` | 辞書を `client.src.js` に埋め込んで `client.js` を生成 |
| `tools/check.mjs` | カバレッジと欠陥（プレースホルダ欠落・未訳・空訳）を検査 |
| `tools/variants.mjs` | 同じ語の表記ゆれ（ユーザー/ユーザ など）を検出 |
| `tools/lookup.mjs` | id から名前空間とキーを逆引き |
| `tools/list-registers.mjs` | どのパッケージがどの名前空間を登録しているかの一覧 |
| `tools/verify-install.mjs` | プロファイル側の配線（依存・bundles・解決・バンドル）を実地検証 |

`work/` は翻訳作業の記録です（作業チャンク・ブリーフ・レビュー・修正差分）。配布物には含まれませんが、訳の由来を追うために残しています。

## 検証

```powershell
node --test                   # パーサ・生成物・辞書のすべて
node tools/check.mjs --strict # カバレッジと欠陥（0 件で終了コード 0）
node tools/build.mjs --check  # client.js が辞書と一致しているか
node tools/variants.mjs       # 表記ゆれの検出
node tools/verify-install.mjs --profile "$env:DSH_PROFILE_DIR"
```

`test/pack.test.mjs` は `client.js` を実際にモジュールローダのスタブへ通し、登録される言語と辞書を検査します（生成物そのものを検証し、ソースの再計算では済ませません）。

## 既知の制約

- **訳が無いキーは英語のまま**。網羅率は `node tools/check.mjs` で確認できます
- 抽出の基準は**このマシンに入っている DSH のバージョン**です。DSH 側でキーが増えたら再抽出が必要です
- 登録時点の文言を保持する箇所（コマンド一覧の説明など、スロット描画を経由しない文字列）は、言語を切り替えても再登録まで元の言語のままです。これはロケール側の仕様です
- 複数形の使い分けや双方向レイアウトは持ちません（これもロケール側の仕様）

## ライセンス

MIT
