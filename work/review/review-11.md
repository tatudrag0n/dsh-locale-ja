defects: 5

### s0599 — medium
EN: Replaced by
JA: 置き換え元
FIX: 置き換え先
WHY: 置き換え元 is the event that was replaced (the origin), while "Replaced by" names its replacement (zh reference: 被替换为), so the label points at the wrong end of the chain — its partner s0601 already covers the replaced side as 置き換えられたイベント.

### s0069 — low
EN: Removed
JA: 削除しました
FIX: 削除済み
WHY: cordis/status.removed is a terse status badge, and the brief keeps terse labels out of です・ます; the pack's other badge states are noun/state forms (準備完了, 実行中, 承認待ち, and 済み forms such as スキップ済み, キャンセル済み).

### s1549 — low
EN: Restore defaults
JA: デフォルトを復元
FIX: デフォルトに戻す
WHY: The same "Restore default(s)" control is rendered デフォルトに戻す (s1695) and すべてデフォルトに戻す (s1696) in this chunk, and its failure message is デフォルトに戻せませんでした (s1698), so the models screen uses a second wording for one action.

### s1693 — medium
EN: Release the keys to save. Tab moves between actions; Esc cancels.
JA: キーを離すと保存します。Tab で操作を移動、Esc でキャンセルします。
FIX: キーを離すと保存します。Tab で操作を切り替え、Esc でキャンセルします。
WHY: 操作を移動 says the action itself is moved (zh reference: Tab 切换操作), whereas the English says Tab moves between the actions, so the key's behaviour is described wrongly.

### s1745 — medium
EN: Sandbox restrictions are disabled; the page can navigate the top-level app and use downloads, modal dialogs, and input locks.
JA: サンドボックス制限が無効になっています。ページは最上位アプリを移動でき、ダウンロード、モーダルダイアログ、入力ロックを使用できます。
FIX: サンドボックス制限が無効になっています。ページは最上位アプリを遷移させることができ、ダウンロード、モーダルダイアログ、入力ロックを使用できます。
WHY: 移動 means the page physically moves the app (zh reference: 导航顶层应用), but the warning is about top-level navigation, so the verb has to be 遷移（させる）.
