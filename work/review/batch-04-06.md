defects: 4

### 05 / s1439 — low
EN: Downloading update: {percent}%\nTarget version: {version}
JA: アップデートをダウンロード中: {percent}%\n対象バージョン: {version}
FIX: 更新をダウンロード中: {percent}%\n対象バージョン: {version}
WHY: Every other line of the same desktop-update card renders "update" as 更新 — 04 / s1448 更新はインストールされていません, s1440 更新をダウンロードできませんでした, s1442 更新をインストールできませんでした, s1447 更新を再試行, s1451 更新ファイルを検証中 — so this progress line (together with s1438) is the only place where the same update is called アップデート.

### 05 / s0664 — low
EN: Edit queued message
JA: 送信待ちメッセージを編集
FIX: キュー内のメッセージを編集
WHY: The pack names the same messages キュー内のメッセージ on every neighbouring queued-message control (s0669 キュー内のメッセージを削除, s0671 キュー内のメッセージを保存, s0663 キュー内のメッセージ {n} 件, s0673 キュー内のメッセージに途中指示, s0668 キュー内のメッセージ画像) and キュー済み in the status field, so 送信待ち renames the item inside its own menu.

### 04 / s1713 — low
EN: Default bindings are active.
JA: デフォルトのキー割り当てが有効です。
FIX: none — explanation only; this string is the consistent form, so align s1712 to 最後に正常に読み込まれたキー割り当てが有効なままです。 and s1707 to 保存する前に最新のキー割り当てを確認してください。
WHY: "bindings" is rendered キー割り当て here, バインド in s1712 (shortcuts.using-accepted) and 割り当て in s1707 (shortcuts.stale), three names for one thing across three status lines of the same shortcuts panel.

### 05 / s1747 — low
EN: Enter an HTTP(S) address to start browsing
JA: ブラウズを開始するにはHTTP(S)アドレスを入力してください
FIX: 閲覧を開始するにはHTTP(S)アドレスを入力してください
WHY: The same browser pane renders "browse" as 閲覧 in its own empty-state guide (s1737 Web ページを閲覧), so the pane names the act two ways.
