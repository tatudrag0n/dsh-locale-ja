defects: 7

### s1371 — high
EN: to help with?
JA: のご用件でしょうか？
FIX: に手伝ってもらいますか？
WHY: The heading is rendered as `{prefix} {brand} {suffix}`, so this half must follow the brand name: with s1370 as 「何を」 the heading reads 「何を DeepSeek Harness に手伝ってもらいますか？」, while the current suffix renders as 「何をしますか DeepSeek Harness のご用件でしょうか？」.

### s0184 — medium
EN: {tasks}{more} waiting on prerequisites; other work has started
JA: {tasks} 件{more} が前提条件を待機中。他の作業は開始されています
FIX: {tasks} 件と、{more}が前提条件を待機中。他の作業は開始されています
WHY: `{more}` expands to 「 他 {count} 件」, so the current template renders as 「3 件 他 2 件 が前提条件を待機中」; the second count needs a と、 join, and s0188 (task.summary.more) should lose its leading space.

### s0050 — medium
EN: {count} active
JA: {count} 件有効
FIX: {count} 名が実行中
WHY: The count is working team members (ZH: 人执行中), so the item counter 「件」 and 「有効」 ("enabled") misdescribe them.

### s0829 — low
EN: too large
JA: サイズが大きすぎます
FIX: サイズ超過
WHY: This is a terse per-file stat inside the changed-files row, so a complete です・ます sentence is the wrong register and far longer than the source.

### s0555 — low
EN: {count} more items available in Inspect
JA: 他 {count} 件の項目を検査で表示できます
FIX: 他 {count} 件の項目は「検証」で確認できます
WHY: The English names the Inspect affordance, whose Japanese label in this pack is 「検証」 (row.inspect), while 「検査で表示」 neither matches that label nor reads as a place the user can open.

### s1110 — low
EN: {name} was saved, but a higher-priority configuration overrides it, so it is not in effect
JA: {name} は保存されましたが、優先度の高い設定が上書きするため有効になっていません
FIX: {name} は保存されましたが、優先度の高い設定に上書きされるため有効になっていません
WHY: 「設定が上書きする」 leaves the transitive verb without its object, and the passive form states the intended relation — the saved value is overridden.

### s1685 — low
EN: {count} customized
JA: {count} 件をカスタマイズ済み
FIX: {count} 件カスタマイズ済み
WHY: 「済み」 is a state suffix, so the object particle 「を」 is wrong in a count badge and inconsistent with the parallel 「{count} 件更新済み」.
