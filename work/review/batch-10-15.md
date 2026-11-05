defects: 16

### 11 / s0599 — high
EN: Replaced by
JA: 置き換え元
FIX: 置き換え先
WHY: 「元」 names the source that was replaced, inverting the relation the source states (what replaced this), so the column reports the opposite direction to the reader.

### 10 / s0522 — high
EN: Previous status
JA: 変更前の状態
FIX: 前のステータス
WHY: The source is the prior status value of the record (a value sitting in a status column), but 「変更前の状態」 means "the state before the change" and drops the "previous value" sense, so a reader cannot tell it is a saved status.

### 12 / s0046 — medium
EN: Settled
JA: 完了
FIX: 確定
WHY: 「完了」 is already the rendering of "Completed" in this same batch (03/s0016, 16/s0205), so two distinct English states render identically and a settled-but-unfinished item reads as finished.

### 15 / s0168 — medium
EN: Unclaimed
JA: 未取得
FIX: 未割り当て
WHY: 「未取得」 says "not yet acquired" (about data or a lock), while the source says no owner has claimed the task — the claim state of the row is lost.

### 15 / s2230 — medium
EN: View options
JA: 表示オプション
FIX: オプションを表示
WHY: 「表示オプション」 reads as a noun phrase ("display options", i.e. the settings of the display) rather than the imperative menu item the source is, so the control looks like a settings group.

### 14 / s0940 — medium
EN: This model provides no reasoning effort levels.
JA: このモデルには推論エフォートのレベルがありません。
FIX: このモデルには推論の強度のレベルがありません。
WHY: Same term, two renderings inside one review batch: s0940 uses 「推論エフォート」 while 12/s0952 uses 「推論の強度 {effort}」 for "reasoning effort", and 「エフォート」 is not a Japanese UI term; fix both sides to one rendering (推論の強度, i.e. 12/s0121「推論の強度」).

### 12 / s2021 — medium
EN: Search trajectory
JA: トレースを検索
FIX: トラジェクトリを検索
WHY: "Trajectory" is rendered 「トラジェクトリ」 everywhere else in this batch (15/s2035, 15/s1990, 15/s2015), and 「トレース」 is the rendering of a different term in the same chunks (15/s0772 Trace event), so this label names the wrong object.

### 12 / s0019 — medium
EN: Show less
JA: 表示を減らす
FIX: 折りたたむ
WHY: 「表示を減らす」 is a literal calque that no Japanese UI uses for the collapse control paired with もっと見る (12/s0020); it reads as reducing how much is displayed rather than the toggle it is.

### 12 / s0693 — medium
EN: Send behavior while busy
JA: 実行中の送信時の動作
FIX: ビジー時の送信動作
WHY: 「実行中の〜時」 stacks two vague time qualifiers and does not say what is running, so the setting's condition (the agent is busy) is not identifiable from the label.

### 12 / s1779 — medium
EN: That directory is outside the workspace, so the sidebar will not read it.
JA: そのディレクトリはワークスペースの外部にあるため、サイドバーは読み取りません。
FIX: そのディレクトリはワークスペースの外部にあるため、サイドバーには表示されません。
WHY: 「サイドバーは読み取りません」 makes the sidebar the agent of 読み取る, which is ungrammatical in Japanese and obscures that the tree does not show the folder.

### 14 / s1728 — medium
EN: The page navigated; this carrier cannot read its new URL.
JA: ページが遷移しました。このキャリアは新しい URL を読み取れません。
FIX: ページが遷移しました。この表示枠は新しい URL を読み取れません。
WHY: 「キャリア」 is a katakana loanword read as "career" or a telecom carrier, not the embedding frame the source means, so the sentence names the wrong thing.

### 15 / s1673 — medium
EN: View and edit available shortcuts and input actions
JA: 利用可能なショートカットと入力アクションを表示・編集します
FIX: 利用可能なショートカットと入力アクションを表示および編集します
WHY: The 「・」 joining is explicitly banned by the brief ("Do not use the interpunct ・ to join Japanese words"), and 「表示・編集」 is exactly such a join.

### 14 / s1766 — low
EN: This text encoding could not be read. Save the file as UTF-8 or UTF-16 with a BOM and retry.
JA: この文字エンコーディングは読み取れませんでした。ファイルを BOM 付きの UTF-8 または UTF-16 で保存し、再試行してください。
FIX: この文字エンコーディングは読み取れませんでした。ファイルを UTF-8、または BOM 付きの UTF-16 で保存し、再試行してください。
WHY: 「BOM 付きの UTF-8 または UTF-16」 attaches the BOM requirement to both encodings, but the source requires it only for UTF-16, so a user following it saves UTF-8 with a BOM.

### 14 / s1116 — low
EN: This plugin pack contains no components.
JA: このプラグインパックにはコンポーネントが含まれていません。
FIX: このプラグインバンドルにはコンポーネントが含まれていません。
WHY: "bundle" is glossed as バンドル and is already rendered so in 09/s1121 and 14/s1083, but the plugin-pack string introduces 「パック」 for the same packaging concept; also uses half-width （） while 14/s1072 in the same chunk uses full-width.

### 13 / s0692 — medium
EN: Steer
JA: 途中指示
FIX: 割り込み
WHY: 「途中指示」 is a coined compound that is not a Japanese UI term; it heads five controls in this chunk (s0692, s0654, s0673, s0674, s0675), two of them buttons, where it reads as a garbled fragment rather than the "inject guidance mid-turn" action.

### 13 / s0197 — medium
EN: Stop team
JA: チームを停止
FIX: チームを停止する
WHY: 「チームを停止」 leaves the verb as a bare stem, so the button does not read as an actionable instruction, unlike its siblings 停止してアーカイブ (13/s2151) and 生成を停止 (13/s0655).
