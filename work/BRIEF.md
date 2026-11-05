# Translation brief — DSH Web UI, English → Japanese

You are translating user-interface strings from the DeepSeek Harness (DSH) web
UI into Japanese. The result ships as a language pack, so consistency across
files matters as much as individual wording.

## Input and output

- Read your assigned chunk: `work/chunks/chunk-NN.json` — a JSON object mapping
  a stable id (`s0001`) to one English source string.
- Write `work/chunks/out-NN.json` with **exactly the same ids** and the Japanese
  translation as the value. No comments, no extra keys, valid JSON, UTF-8.

## Hard rules

1. **Ids are frozen.** Every id in the input must appear in the output exactly
   once. Never invent or drop an id.
2. **Placeholders are frozen.** `{name}`, `{count}`, `{tokens}` … must appear
   verbatim, in a position that reads naturally in Japanese.
3. **Keep whitespace, punctuation frames, and markup exact.** If the source is
   `" and {count} more"`, the leading space stays. Keep `·`, `…`, `:`, `—`,
   `«»`, `<b>`, and similar framing characters where they carry layout meaning.
   Empty or whitespace-only sources (`""`, `" "`) stay byte-identical.
4. **Do not translate product and technical names**: DSH, GitHub, Git, LM Studio,
   Ollama, llama.cpp, Markdown, JSON, MCP, PTC, SSH, CLI, API, URL, PDF, Excel,
   CSV, npm, pnpm, Node.js, Windows, macOS, Linux, VS Code, PTC mode.
   Keep model and provider names in Latin script.
5. **Length discipline.** These strings sit in buttons, tabs, menus, and rows.
   Prefer the short, conventional Japanese UI term over a literal phrase. Never
   pad with explanatory wording.
6. **One English string, one Japanese string.** The same source id always maps
   to one translation; do not vary by guessed context.
7. **No half-translated output.** Never leave an English sentence as-is because
   it looks hard. If a source is a bare identifier or a code-ish token with no
   Japanese convention (for example `toolu_…`, `stdout`, a file-glob), keep it
   as-is deliberately — that is allowed, silence is not.

## Glossary (use these renderings consistently)

| English | Japanese |
|---|---|
| session | セッション |
| turn | ターン |
| step | ステップ |
| task | タスク |
| agent | エージェント |
| subagent | サブエージェント |
| preset | プリセット |
| skill | スキル |
| tool / tool call | ツール / ツール呼び出し |
| plugin | プラグイン |
| bundle | バンドル |
| workspace | ワークスペース |
| working directory | 作業ディレクトリ |
| sidebar | サイドバー |
| composer | 入力欄 |
| transcript | 会話ログ |
| token | トークン |
| context | コンテキスト |
| compaction | 圧縮 |
| reasoning | 推論 |
| thinking | 思考 |
| approval | 承認 |
| permission | 権限 |
| settings | 設定 |
| provider | プロバイダー |
| model | モデル |
| route | ルート |
| delegation / delegate | 委譲 / 委譲する |
| background job | バックグラウンドジョブ |
| goal | ゴール |
| plan | プラン |
| workflow | ワークフロー |
| schedule | スケジュール |
| attachment | 添付ファイル |
| reference | 参照 |
| shortcut | ショートカット |
| command | コマンド |
| terminal | ターミナル |
| browser | ブラウザ |
| file | ファイル |
| folder / directory | フォルダー / ディレクトリ |
| message | メッセージ |
| reply | 返信 |
| search | 検索 |
| copy | コピー |
| retry | 再試行 |
| cancel | キャンセル |
| close | 閉じる |
| delete | 削除 |
| remove | 削除 |
| enable / disable | 有効化 / 無効化 |
| loaded / unloaded | 読み込み済み / 未読み込み |

## Tone

- Buttons, menu items, tabs, and labels: noun or plain verb form
  (「キャンセル」「再試行」「設定」「もっと見る」).
- Full sentences (descriptions, empty states, errors): です・ます調.
- Errors lead with what happened, then what to do, as the English does.
- Use full-width Japanese punctuation (、。「」（）) inside Japanese text, but keep
  ASCII punctuation for code, paths, and versions.
- Do not use the interpunct ・ to join Japanese words; write them closed up
  (入力欄, not 入力・欄).

## Self-check before writing

- JSON parses.
- Key set equals the input key set.
- Every `{placeholder}` from the source is present in the translation.
- Nothing but the output file was written.
