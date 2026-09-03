# Rocket Editor — Mistakes

The waiting room for Claude's own mistakes.

A mistake corrected in chat lives as long as the session does, and the next
session repeats it. This file is where a correction waits until it has proven
it needs to become a law.

The mechanism is two steps, and it is the whole file:

1. A slip happens and is corrected. It gets ONE row here.
2. The same slip happens again. It stops being a row and becomes a RULE, in
   the file that owns that behavior. The row moves to Promoted.

## What belongs here

Mistakes in HOW you worked:

- you broke a rule that is already written down,
- you decided something that was Rotem's to decide,
- you skipped a step the process requires,
- you assumed instead of asking,
- you reported something as done, or as checked, when it was not.

## What does not

- **A code bug** goes to `project-os/BugAtlas.md`. That file maps bugs in the
  product; this one maps bugs in the way you work.
- **What changed** goes to `project-os/History.md`.
- **A product opinion Rotem simply overruled.** His call, not your
  error. Disagreement is not a mistake.
- **A slip whose rule home is obvious.** Write the rule immediately, in its
  own file, and skip the waiting room. This file is for slips with no clear
  home yet, or where it is not yet clear a law is warranted.

## How you use it

- **Write the row in the same reply where the correction landed**, before the
  work continues. A mistake recorded later is a mistake recorded never.
- **Read this file at task pickup.** It stays short on purpose, so there is no
  excuse to skip it.
- **On a repeat, promote it.** Write the rule into the file that owns the
  behavior, then move the row to Promoted with that file named:

| The slip is about | Its rule goes to |
|---|---|
| How you write replies | `project-os/Conversations.md` |
| A step of the process | `project-os/Workflow.md` |
| What counts as checked | `project-os/QA.md` |
| Deciding, scope, permission | `CLAUDE.md` working rules |
| A review's severity or blind spot | `project-os/Code_review.md` |
| Using an outside tool | that server's file under `project-os/mcp/` |

- **Never let it grow into a diary.** It has exactly two ways out: promoted to
  a rule, or retired unrepeated. Nothing accumulates.
- **It is not a confession log and carries no apology.** One line of fact,
  because the next session needs the fact and not the feeling.

## Open

| Date | What Claude did | What Rotem wanted | Home if it repeats | Times |
|---|---|---|---|---|
| 2026-09-01 | He said the digits were moving in front of his eyes; that was the product's bubble flickering, and it was read as a complaint about the length of the replies. A defect report was filed as a style correction | When a comment could be about the product or about the reply, it is about the product. Ask before recording it as a correction | Already law in spirit; on repeat, write it into Conversations.md | 1 |
| 2026-08-30 | Turned a request about the current task, ask the open decisions one at a time, into a permanent working rule in the reply-format file | Do the thing that was asked, for the case it was asked about. A working preference becomes a standing rule only when Rotem says it is one | CLAUDE.md rule 18 | 1 |
| 2026-08-30 | Wrote a shell command whose text contained backticks and passed it unquoted, so the shell substituted them and executed their contents. One was a git checkout, which silently reverted this very file and undid the project rename inside it | Multi-line content with backticks, quotes or apostrophes goes in a file the script reads, never inline in a shell argument. That is the pattern already used for History rows | project-os/Workflow.md step 7 | 1 |

## Promoted

| Date | The slip | Where its rule now lives |
|---|---|---|
| 2026-08-30 | Wrote for a designer in developer terms. Twice: first a whole report named internal parts without saying what they are, then a decision question gave three options with no explanation of what was being decided or what changed for him | `project-os/Conversations.md` rule 14, which gained a clause requiring every decision question to carry what the thing is, what it does for him, and what changes by his answer, before the options |
| 2026-08-31 | Read a finished-sounding spec discussion as a build order and started writing files, twice in one day | `CLAUDE.md` rule 1, "A discussion is not a work order" |
| 2026-09-03 | Long multi-section replies, a second time: a design discussion ran to five sections with long dashes throughout, when the ceiling was three lines | `project-os/Conversations.md` rule 1, which now names opinions and design talk as replies under the same ceiling |

## Retired

| Date | The slip | Why it left |
|---|---|---|
