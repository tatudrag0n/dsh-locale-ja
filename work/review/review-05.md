defects: 3

### s0589 — low
EN: Exited
JA: 終了しました
FIX: 終了済み
WHY: This is a value of the Status field ("Exited"), and the sibling states of the same status set are terse state nouns in this pack (削除済み s0577, 失敗 s0007, 待機中 s0590), so a past-tense です・ます clause reads wrong in a status cell.

### s1432 — low
EN: Disconnected
JA: 切断されました
FIX: 未接続
WHY: This is the compact connection-state label of the status indicator, yet it is a full です・ます sentence, and the same English term is rendered 接続が切れました in s1433 and s1842 — a bare state noun is both terse and consistent.

### s2043 — medium
EN: Discard transcript
JA: 会話ログを破棄
FIX: 認識テキストを破棄
WHY: In the voice-input panel this "transcript" is the recognized speech text (the module's Chinese copy is 丢弃识别文字, and its conflict string keeps 识别文字), not the conversation log that the glossary's 会話ログ denotes, so the control names the wrong object.
