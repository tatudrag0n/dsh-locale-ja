defects: 11

### 16 / s1348 — high
EN: en
JA: 日本語
FIX: ja
WHY: This is a locale code, not display text — the same id backs `onboardingArtworkLocale` (it picks the onboarding artwork) and `sidebarExcel.language`, and the zh pack ships "zh" in exactly that slot, so 「日本語」 is not a language tag any consumer can use and the Japanese pack must report "ja".

### 16 / s1370 + 17 / s1371 — high
EN: What would you like (s1370) … to help with? (s1371)
JA: 何をしますか (s1370) … のご用件でしょうか？ (s1371)
FIX: s1370 → 何を ／ s1371 → に手伝ってもらいますか？
WHY: The onboarding heading is composed as prefix + " " + brand + " " + suffix, so the two halves currently render 「何をしますか DeepSeek Harness のご用件でしょうか？」, which is ungrammatical and uses receptionist 「ご用件」 for a product that never addresses the user that way.

### 16 / s1027 — medium
EN: Waiting for the Host to accept installation. Cancellation will retry automatically after confirmation.
JA: ホストがインストールを承認するのを待機しています。キャンセルした場合も、確認後に自動で再試行されます。
FIX: ホストがインストールを受け付けるのを待機しています。キャンセルは、確認後に自動で再試行されます。
WHY: The host is receiving the install task (zh: 接收) rather than granting an approval — 承認 is this product's word for the user's own approval prompts — and the thing retried after confirmation is the cancellation, not the installation, so the current wording promises a different retry and implies a confirmation the user must give.

### 16 / s2041 — medium
EN: Your draft changed. The transcript is preserved and can be inserted at the current cursor.
JA: 下書きが変更されました。会話ログは保持されており、現在のカーソル位置に挿入できます。
FIX: 下書きが変更されました。認識されたテキストは保持されており、現在のカーソル位置に挿入できます。
WHY: The string sits in the voice-input conflict (voice-input/conflict; zh: 识别文字), where the preserved "transcript" is the recognized speech and not the session conversation log that 「会話ログ」 names — only the former is what can be inserted at the cursor.

### 16 / s1196 — low
EN: now
JA: 今すぐ
FIX: たった今
WHY: It labels a relative timestamp (workspace/time.now; zh: 刚刚), where 「今すぐ」 means "right away" and reads as a call to action instead of elapsed time.

### 17 / s0050 — medium
EN: {count} active
JA: {count} 件有効
FIX: {count} 名が実行中
WHY: The key is the captain's own working state (agentTeams/captain.state.working; zh: {count} 人执行中), so the count is people at work rather than enabled items, and both the item counter 「件」 and 「有効」 misdescribe them.

### 17 / s0184 — medium
EN: {tasks}{more} waiting on prerequisites; other work has started
JA: {tasks} 件{more} が前提条件を待機中。他の作業は開始されています
FIX: {tasks} 件{more}が前提条件を待機中。他の作業は開始されています — with s0188 (agentTeams/task.summary.more, " and {count} more") changed from 「 他 {count} 件」 to 「、他 {count} 件」, so the composed line reads 「3 件、他 2 件が前提条件を待機中。」
WHY: {tasks} is a bare count and {more} expands to a second count, so the current template renders two unjoined numbers as 「3 件 他 2 件 が前提条件を待機中」.

### 17 / s0555 — low
EN: {count} more items available in Inspect
JA: 他 {count} 件の項目を検査で表示できます
FIX: 他 {count} 件の項目は「検証」で確認できます
WHY: The English names the Inspect affordance, which this pack labels 「検証」 (conversation/row.inspect, skill/row.inspect, cordis/action.inspect), so 「検査で表示できます」 sends the reader to a control that does not exist under that name and does not read as an openable place.

### 17 / s1110 — low
EN: {name} was saved, but a higher-priority configuration overrides it, so it is not in effect
JA: {name} は保存されましたが、優先度の高い設定が上書きするため有効になっていません
FIX: {name} は保存されましたが、優先度の高い設定に上書きされるため有効になっていません
WHY: 「上書きする」 is transitive and is left without an object here, so the clause never says what is overridden, while the passive states the intended relation — the saved value is.

### 17 / s1685 — low
EN: {count} customized
JA: {count} 件をカスタマイズ済み
FIX: {count} 件カスタマイズ済み
WHY: 「済み」 is a state suffix that takes no を object, so the badge is ungrammatical and breaks the parallel with the sibling badge 「{count} 件更新済み」 (s0716).

### 16 / s1638 (with 14 / s0940) — medium
EN: … reasoning effort … (s1638) ／ This model provides no reasoning effort levels. (s0940)
JA: 推論の強度 … (s1638) ／ このモデルには推論エフォートのレベルがありません。 (s0940)
FIX: none — explanation only: keep 「推論の強度」 (s1638 and five other strings) and change 14/s0940 to 「このモデルには推論の強度のレベルがありません。」
WHY: The feature term "reasoning effort" is the one term in this check that is rendered two different ways in user-visible labels — 「推論の強度」 here and in five sibling strings, but 「推論エフォート」 at 14/s0940, which is also the only katakana calque of the term in the pack.
