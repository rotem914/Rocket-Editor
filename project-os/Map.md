# Rocket Editor — Map

The architecture snapshot: the stack in a line, the folder tree, where the data
lives, what owns what.

Read it at task pickup to find your way around. Keep it true, because a map that
lies costs more than no map.

## How you maintain this file

- **Update it in the same change** that adds, moves or removes a folder, a route,
  a data store, or a major file. Never as a follow-up task — a follow-up is a
  task that does not happen.
- One line per entry: what it is, not how it works. The how lives in the code.
- Paths are relative to `J:\Projects\Rocket Editor`.
- This is a snapshot, not a plan. Nothing here describes work that has not landed.

## Stack

A local web app, running on this machine rather than a hosted service. No
application code exists yet, so the framework is not pinned; the reasoning is in
`project-os/Decisions.md`.

The plan behind this project is `notes/Rocket-Editor-Plan.md`. It is a plan, not a
snapshot, so nothing in it belongs in this file until it has landed here as real
code.

| Setting | Value |
|---|---|
| Project root | `J:\Projects\Rocket Editor` |
| Runs locally at | none yet |
| Checks | none yet |

Fill the two blank rows in the same change that adds the first application code,
and mirror them in the table at the top of `CLAUDE.md`.

## Tree

The whole project as it stands today.

```text
Rocket Editor/
├── .gitignore             # keeps the .tmp/ scratch folder out of git
├── CLAUDE.md              # entry file, read first
├── notes/                 # free-standing documents
│   ├── Rocket-Editor-Plan.md          # the product plan: phases, research, open decisions
│   ├── Rocket-Editor-Architecture.md  # the lean product: read-only Rocket, Claude writes
│   ├── Rocket-Editor-Writing-Track.md # superseded full architecture, kept as dated spec
│   ├── Rocket-Editor-Build-Plan.md   # 32 small tasks, each ending in an owner check
│   ├── Rocket-Editor-Review-Pack-2026-08-30.md  # the whole plan compressed for outside AI reviewers
│   ├── Plan-Review-2026-08-30.md      # findings against the plan, awaiting owner verdicts
│   └── Decision-Verification-2026-08-30.md  # every decision checked against the world, plus the questions list
├── project-os/            # the process docs
│   ├── Workflow.md        # the path every task walks
│   ├── Map.md             # this file
│   ├── QA.md              # the standing checklist
│   ├── Conversations.md   # how replies are written
│   ├── History.md         # what changed, one row per task
│   ├── Decisions.md       # why a non-obvious path was chosen
│   ├── Backlog.md         # the owner's open items
│   ├── Code_review.md     # the review calibration
│   ├── Visual_QA.md       # how the running app gets used and tested
│   ├── BugAtlas.md        # recurring bug classes
│   ├── Mistakes.md        # corrections waiting to become rules
│   └── mcp/               # per-server rules, read before the first call
│       ├── Figma/
│       └── Google_analytics/
└── tools/                 # standalone helper tools, not the app
    └── class-copy/        # Chrome extension: hover an element, copy its ID card
```

## Data

Where state lives and who is allowed to write it.

| What | Where | Format | Written by |
|---|---|---|---|
| none yet | | | |

Two kinds of state are coming, and they are worth keeping apart from the start:
this app's OWN data, and the client project files it edits. The second one is
somebody else's repository, and it is the reason this product needs a backup and
an undo in place before it writes anything.

## Ownership

Which area owns which files. Use this to answer "who owns this?" before changing
anything.

| Area | Files | Notes |
|---|---|---|
| Process docs | `project-os/*` | The governance kit. `CLAUDE.md` points at it and carries no reply or process rules of its own. |
| Plan | `notes/Rocket-Editor-Plan.md` | The product plan. A plan, never a description of what exists; nothing here is built until it lands as code. |
| Architecture | `notes/Rocket-Editor-Architecture.md` | The lean product: read-only Rocket, browser-held session record, report to Claude Code. A proposal; ratified choices move to `project-os/Decisions.md`. |
| Writing track | `notes/Rocket-Editor-Writing-Track.md` | The superseded full architecture, kept unedited as the dated spec for a version where Rocket writes code. |
| Build plan | `notes/Rocket-Editor-Build-Plan.md` | The lean product broken into 32 small tasks, each with the owner check that closes it. |
| Review pack | `notes/Rocket-Editor-Review-Pack-*.md` | Self-contained compression of the whole plan for external AI review, one file per round. |
| Plan reviews | `notes/Plan-Review-*.md` | Findings from a requested review of the plan docs, one file per pass, awaiting owner verdicts. |
| Decision verification | `notes/Decision-Verification-*.md` | Research-backed verdicts on the architecture decisions, and the owner questions list. |
| Helper tools | `tools/class-copy/*` | Rocket Class Copy, a standalone Chrome extension: arm a tab, hold the key left of 1, hover for design facts, click to copy an element ID card for Claude. A helper, not the app; the app rows above stay empty. |
| Application | none yet | Fill this in with the first real code. |
