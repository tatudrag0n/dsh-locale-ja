defects: 2

### s1703 — medium
EN: Modified
JA: 更新日時
FIX: 変更しました
WHY: This string is the "saved" notice shown as a toast when shortcut bindings are saved, so "Modified" means changed — 更新日時 ("last updated" timestamp) is a different meaning in the wrong register for a confirmation.

### s1255 — medium
EN: No inactive automation tasks
JA: 無効な自動化タスクはありません
FIX: 非アクティブな自動化タスクはありません
WHY: 無効 means disabled or invalid, not inactive: this empty state belongs to the screen's Inactive filter, and the same pack renders "Inactive" as 非アクティブ (schedule.manager status.inactive and timing.inactive), so the message contradicts the filter the user selected.
