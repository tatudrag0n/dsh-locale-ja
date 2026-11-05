defects: 5

### s1348 — high
EN: en
JA: 日本語
FIX: ja
WHY: This is a locale code, not display text — it feeds the `lang` attribute of the onboarding section and the spreadsheet preview and the `locale === "zh"` artwork switch, so 「日本語」 is neither a valid language tag nor the value a Japanese pack should report.

### s1370 — high
EN: What would you like
JA: 何をしますか
FIX: 何を
WHY: The heading is rendered as `{prefix} {brand} {suffix}`, so this half produces 「何をしますか DeepSeek Harness のご用件でしょうか？」; the prefix must lead into the brand name, with s1371 changed to 「に手伝ってもらいますか？」 to read 「何を DeepSeek Harness に手伝ってもらいますか？」.

### s1027 — medium
EN: Waiting for the Host to accept installation. Cancellation will retry automatically after confirmation.
JA: ホストがインストールを承認するのを待機しています。キャンセルした場合も、確認後に自動で再試行されます。
FIX: ホストがインストールを受け付けるのを待機しています。キャンセル操作は、確認後に自動で再試行されます。
WHY: The source (and the ZH pack) says the cancellation itself is retried, but the subjectless 「自動で再試行されます」 reads as the installation being retried — implying a cancel may be undone — and 「承認」 is this product's word for user approval, which suggests a prompt the user must answer.

### s2041 — medium
EN: Your draft changed. The transcript is preserved and can be inserted at the current cursor.
JA: 下書きが変更されました。会話ログは保持されており、現在のカーソル位置に挿入できます。
FIX: 下書きが変更されました。認識されたテキストは保持されており、現在のカーソル位置に挿入できます。
WHY: In the voice-input conflict this "transcript" is the recognized speech text (ZH: 识别文字), not the conversation log, so 「会話ログ」 names the wrong object.

### s1196 — low
EN: now
JA: 今すぐ
FIX: たった今
WHY: The string labels a relative timestamp (session/reference time), where 「今すぐ」 means "immediately" and reads as a call to action rather than elapsed time.
