defects: 2

### s1279 — medium
EN:  (system)
JA:  (システム)
FIX:  （システム）
WHY: Half-width parentheses wrap Japanese text even though the brief requires full-width punctuation inside Japanese text, and my other chunks render the same parenthetical device as （…）.

### s0475 — low
EN: Ask question
JA: 質問する
FIX: 返信する
WHY: This control is the reply action on a posed question, and 回答 is already used for "Answer" (s0473/s1180) in this chunk, so 回答 would collide; the brief glosses reply as 返信.

## Same defect, other ids in this chunk

The half-width-parenthesis defect above also affects these strings; each needs the same ASCII→full-width repair:

- s0377 `EN:  ({tokens} reasoning)` / `JA:  (推論 {tokens})` → ` （推論 {tokens}）`
- s1187 `EN: (no cwd)` / `JA: (作業ディレクトリなし)` → `（作業ディレクトリなし）`
- s0936 `EN: (no output)` / `JA: (出力なし)` → `（出力なし）`
- s0812 `EN: (no purpose given)` / `JA: (目的の指定なし)` → `（目的の指定なし）`
- s0705 `EN: (send input)` / `JA: (入力を送信)` → `（入力を送信）`
- s1958 `EN: (tool call only)` / `JA: (ツール呼び出しのみ)` → `（ツール呼び出しのみ）`
- s2232 `EN: All conversations (show archived)` / `JA: すべての会話 (アーカイブを表示)` → `すべての会話（アーカイブを表示）`
