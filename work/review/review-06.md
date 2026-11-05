defects: 3

### s0186 — low
EN: Final: {completed} delivered · {cancelled} cancelled · {failed} failed
JA: 最終: {completed}件完了 · {cancelled}件キャンセル · {failed}件失敗
FIX: 最終: {completed}件配信済み · {cancelled}件キャンセル · {failed}件失敗
WHY: The same English term is rendered 配信済み (s0065), 配信失敗 (s0869) and 配信記録 (s1246) in my chunks, so 完了 drops the delivery meaning from this delivery summary and breaks that pairing.

### s1570 — low
EN: Failed to start
JA: 起動に失敗しました
FIX: 起動失敗
WHY: This is the plugin's terse phase tag shown in the card's Status row, where the pack uses bare state nouns (配信失敗 s0869, 失敗 s0007), so a です・ます sentence is the wrong register for a status value.

### s1571 — medium
EN: From
JA: 開始
FIX: 提供元
WHY: This is the plugin card's preset-origin fact (fromPreset) whose value is a preset name, so 開始 ("start") names a time range the string does not mean, and 提供元 gives the intended sense.
