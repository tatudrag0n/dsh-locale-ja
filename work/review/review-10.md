defects: 3

### s0667 — medium
EN: Queued file {name}
JA: ファイル {name} をキューに追加しました
FIX: キュー内のファイル {name}
WHY: conversation/queue.file is the label of a file that is waiting in the queue (its siblings are キュー内のメッセージ s0669/s0671 and キュー済み s0591), so the past-tense announcement says something the English does not.

### s0668 — medium
EN: Queued message image
JA: メッセージ画像をキューに追加しました
FIX: キュー内のメッセージ画像
WHY: Same defect as s0667 — a queued-item label is rendered as a completed action, which misstates the item's state.

### s0726 — low
EN: Preparing content {kilobytes}KB
JA: コンテンツを準備しています {kilobytes}KB
FIX: {kilobytes}KB のコンテンツを準備しています
WHY: The size is left dangling after an already finished clause; the placeholder has to move in front of コンテンツ for the status line to read as Japanese (the brief allows moving it for naturalness).
