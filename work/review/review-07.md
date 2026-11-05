defects: 6

### s0207 — medium
EN: Left to right: prerequisites unlock tasks · Select for details
JA: 左から右へ: 前提条件がタスクを解放 · 詳細は選択
FIX: 左から右へ: 前提条件がタスクを解放 · 選択すると詳細を表示
WHY: The second half is a bare noun phrase ("for details, select") with no verb, so it does not read as Japanese and no longer says what selecting does.

### s1028 — low
EN: Installation is being applied and cannot be cancelled. View installation progress.
JA: インストールを適用中で、キャンセルできません。インストールの進行状況を表示します。
FIX: インストールを適用中で、キャンセルできません。インストールの進行状況を確認できます。
WHY: "View installation progress." addresses the user, but 表示します says the UI will display it, and this notice is a plain auto-dismissing toast with no view action.

### s1029 — low
EN: Installation finished. View installation details.
JA: インストールが完了しました。インストールの詳細を表示します。
FIX: インストールが完了しました。インストールの詳細を確認できます。
WHY: The same mismatch as s1028: an instruction to the user became a promise that the app will display the details.

### s1030 — low
EN: Installation failed. View installation details.
JA: インストールに失敗しました。インストールの詳細を表示します。
FIX: インストールに失敗しました。インストールの詳細を確認できます。
WHY: On the failure notice the user is told to view the details, but the Japanese instead announces that the details will be displayed.

### s1031 — medium
EN: Installation status is unconfirmed. View the installation for details.
JA: インストール状態が未確認です。詳細はインストールを表示してください。
FIX: インストール状態が未確認です。詳細は「インストールを表示」から確認してください。
WHY: インストールを表示してください is ungrammatical here (an installation is not something the user can "display") and leaves them without a way to reach the details.

### s2142 — low
EN: Interrupted {count}
JA: {count} 件を中断しました
FIX: {count} 件中断
WHY: This string is one counter in a " · "-joined status row whose siblings are state counters ({count}件完了, {count} 件実行中, {count} 件キャンセル), so a past-tense sentence reads wrong in that slot.
