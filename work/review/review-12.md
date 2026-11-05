defects: 5

### s1053 — low
EN: Something went wrong during the install; the details say what
JA: インストール中に問題が発生しました。詳細に内容が記載されています。
FIX: インストール中に問題が発生しました。原因はインストールの詳細に記載されています。
WHY: 詳細に内容が記載されています only says the details have some content, dropping the clause that tells the user the cause is there, and it ignores the namespace's established wording インストールの詳細 (zh reference: 原因见安装详情).

### s1453 — low
EN: Shows trajectory, code diffs, and all Agent presets
JA: トレース、コード差分、すべてのエージェントプリセットを表示します
FIX: トラジェクトリ、コード差分、すべてのエージェントプリセットを表示します
WHY: Same term mismatch as s2021 — this setting turns on the view the pack names トラジェクトリ (s2035 trajectory/view.trajectory), so "trajectory" must not be renamed トレース here.

### s2021 — low
EN: Search trajectory
JA: トレースを検索
FIX: トラジェクトリを検索
WHY: The pack renders this view as トラジェクトリ everywhere else (s2035 トラジェクトリ, s2015 トラジェクトリツールバー, s1990 トラジェクトリのタイムライン, s1926 トラジェクトリを読み込み中…), so トレース renames the feature inside its own toolbar.

### s2220 — medium
EN: Session archived. You can 
JA: セッションをアーカイブしました。 
FIX: セッションをアーカイブしました。次の操作ができます: 
WHY: The string is a prefix the UI joins with toast.archivedUndo (s2224 元に戻す), toast.archivedOr (s2223 または) and toast.archivedFilter (s2221 アーカイブ済みセッションを絞り込む), and dropping "You can" leaves the assembled toast as "…しました。 元に戻す または アーカイブ済みセッションを絞り込む", which is not a Japanese sentence; keep the trailing space so the links still join.

### s2227 — medium
EN: Session stopped and archived. You can 
JA: セッションを停止してアーカイブしました。 
FIX: セッションを停止してアーカイブしました。次の操作ができます: 
WHY: Same concatenation defect as s2220 — the clause that introduces the following 元に戻す／または links is missing, so the toast ends as a dangling fragment (keep the trailing space).
