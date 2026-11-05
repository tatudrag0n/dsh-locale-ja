defects: 2

### s0940 — low
EN: This model provides no reasoning effort levels.
JA: このモデルには推論エフォートのレベルがありません。
FIX: このモデルには推論の強度のレベルがありません。
WHY: Everywhere else in the pack "reasoning effort" is 「推論の強度」 (model.menu.effort and model.menu.aria in this very dictionary, plus eight more strings across the pack), so 「推論エフォート」 is both a katakana calque of the English and a second rendering of a term the user sees as 「推論の強度」 on the same screen.

### s2167 — low
EN: This removes “{name}” from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.
JA: 「{name}」をワークスペース一覧から削除します。フォルダーとセッションログは保持されます。このワークスペースのセッションは「未グループ」に表示されます。
FIX: 「{name}」をワークスペース一覧から削除します。フォルダーとセッションログは保持されます。このワークスペースのセッションは「未グループ化」に表示されます。
WHY: The bucket this sentence points the user to is labelled 「未グループ化」 (workspace.group.ungrouped, s2179 in my chunk 15, paired there with 「グループ化」 for Group by), so 「未グループ」 is a second, malformed rendering of the same label inside my own chunks.
