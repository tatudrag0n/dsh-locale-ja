defects: 8

### 04 / s0946 — low
EN: DeepSeek Account
JA: DeepSeek アカウント
FIX: DeepSeek Account
WHY: This is a provider name (model.provider.account, settings.models.deepSeekAccount) and provider names stay in Latin script per the brief, yet the same provider is kept as "DeepSeek Account" in 08 / s1661, so the pack spells it two ways.

### 05 / s0589 — low
EN: Exited
JA: 終了しました
FIX: 終了済み
WHY: This is the value of the Status field (conversation.detail.status.exited) and every sibling in that set is a state, not a sentence (開始済み, 承認済み, 削除済み, キュー済み), so a past-tense clause reads wrong in a status cell.

### 06 / s0186 — low
EN: Final: {completed} delivered · {cancelled} cancelled · {failed} failed
JA: 最終: {completed}件完了 · {cancelled}件キャンセル · {failed}件失敗
FIX: 最終: {completed}件配信済み · {cancelled}件キャンセル · {failed}件失敗
WHY: "delivered" is 配信 throughout this pack (04 / s0065 配信済み, 07 / s0568 メッセージを配信しました), so 完了 swaps in a different state and breaks the delivered · cancelled · failed parallel.

### 06 / s0680 — low
EN: Inspect
JA: 検証
FIX: 検査
WHY: The same verb is translated 検査 in the five other in-scope strings (07 / s0870 呼び出しを検査, s0742 シンボルを検査, s0744, s0745, s1587), so one of the two renderings has to go.

### 06 / s1571 — high
EN: From
JA: 開始
FIX: 提供元
WHY: This label belongs to settings.pluginInventory.fromPreset — it names the preset a plugin comes from, not a start time, so 開始 tells the user the field is something it is not.

### 09 / s0035 — low
EN: Plan discarded · Archived history
JA: プラン破棄 · 履歴はアーカイブ済み
FIX: プラン破棄 · アーカイブ済み履歴
WHY: The parallel chip for the same archive strip renders the identical English fragment as a noun phrase (05 / s0036 終了 · アーカイブ済み履歴), while this one turns it into a clause, so the two chips no longer read as a pair.

### 09 / s1598 — low
EN: Panel roles
JA: パネルの役割
FIX: パネルのロール
WHY: "role(s)" is ロール in the five other in-scope strings of this same pstack panel (06 / s1592, s1611; 07 / s1603; 08 / s1594, s1597), so the group header uses a different term than the controls under it.

### 09 / s2002 — medium
EN: Output tokens unavailable
JA: 出力トークンを取得できません
FIX: 出力トークンは利用できません
WHY: "unavailable" is 利用できません in nine in-scope strings including the label this one sits beside (06 / s1998 初回トークンは利用できません), whereas 取得できません asserts a failed fetch the English does not claim (also 07 / s1099, s1032).
