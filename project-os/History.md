# Live Editor — History

The change log. Every completed change lands here, in two layers: a scan table
you always read, and an appendix you read only when digging.

The scan table answers "what happened lately". The appendix answers "what exactly
did that change do, and how do I undo it".

## How you maintain this file

- **After every completed change**, add one scan row AND one appendix row. Both,
  in the same change that did the work.
- **One change = one row.** Not one row per file, not one row per session. A log
  that has to be reassembled from fragments is a log nobody reads.
- Write the scan row for a reader who was not there. Name the behavior that
  changed, not the files.
- Keep appendix rows short — a few lines, not an essay. The full story is in the
  commit diff; a real decision belongs in `project-os/Decisions.md`.
- Record the commit SHA from **before** the change. That is the rollback target.
- Never rewrite or delete a past row. Correct a wrong one by adding a new row —
  an edited log cannot be trusted about anything.
- A `medium` or `high` risk row names its review result under **What was
  checked**: findings found, findings fixed, pre-existing ones flagged. A
  medium-or-higher row without that is a task that is not finished.
- Never write "tested" or "QA passed". Those phrases record nothing. Name the
  input, the screen, and what happened.
- When this file gets long, move the oldest rows into an archive file beside it.
  Create that file the first time you need it. Move rows **verbatim** — never
  rewritten, never summarized, never merged, because the detail you drop is the
  one the next reader needed.

## Risk scale

The scale's one home is `project-os/Workflow.md` step 2 — read it there, so the
two files can never disagree. State the level at task pickup; the owner's
override wins.

## Scan log

Newest at the bottom.

| Date | Area | What changed |
|---|---|---|
| 2026-08-27 | process | **The project got its rules.** A fresh, empty repository was created for Live Editor and the ProjectOS kit installed into it: the entry file that names the project and its owner, and the ten process docs plus two tool-server docs. Nothing about the product itself was built, and no stack was chosen — the assistant now has a process to follow the moment building starts. |
| 2026-08-27 | process | **The project has a plan and a direction.** The product plan moved in from DS Tiger and now lives at `notes/Live-Editor-Plan.md`. Live Editor will be a local web app, not a desktop app and not an editor extension, and that choice plus the client-folder write carve-out are both written down as decisions. The one-time install instructions were deleted and the GitHub remote was added. |

## Appendix — deep rows

Newest at the bottom, same as the scan log.

| Date | Task | What changed | What was checked | Result | Risk | Commit before | Rollback |
|---|---|---|---|---|---|---|---|
| 2026-08-27 | Install ProjectOS into a new Live Editor repository | Created `J:\Projects\Live Editor` and initialized git on `main`. Copied in `CLAUDE.md`, `Installation.md` and `project-os/` from the ProjectOS kit. Replaced every placeholder: project name, owner and role, project root. Wrote the product description in `CLAUDE.md`, set the reply language to English and kept the kit's length dial, calibrated the `Go commit` flow (assistant commits, Rotem pushes), added a rule-12 note that writing into an attached client folder is the product's one sanctioned outside-the-root write, and made rule 16 cover the client's dev server too. Rewrote `Map.md` with the real tree and honest empty stack rows. Set both tool-server setup tables to "not wired". Deleted the example blocks from Map, History, Decisions, Backlog and BugAtlas; the ones inside Code_review and Visual_QA carry their own instruction and stay. | Read the whole kit before editing, per `Installation.md` step 1. Searched every file for surviving curly-brace placeholder tokens after the edits: none left outside `Installation.md`, which documents them. Re-copied `project-os/` from source and redid the substitutions after the first pass double-encoded every em dash; confirmed the repaired files hold real em dashes and no mojibake. Confirmed the tree in `Map.md` matches what is on disk. No application code exists, so there was nothing to build, run or browser-check. | Pass | low | none — first change in a fresh repository | Delete the `J:\Projects\Live Editor` folder. Nothing outside it was touched. |
| 2026-08-27 | Post-install: plan moved in, stack direction set, remote added | Moved `Live-Editor-Plan.md` out of DS Tiger into `notes/`, with a note at its top saying it was written when this was going to be a DS Tiger section, so its architecture part needs re-scoping. Recorded two entries in `Decisions.md`: local web app over desktop app or editor extension, and the narrow carve-out that lets the product write into an attached client folder. Updated the stack line and plan path in `CLAUDE.md` and `Map.md`, added the `notes/` folder to the tree and ownership table. Deleted `Installation.md` at Rotem request. Added the `origin` remote. | Grepped both docs for stale references to the old DS Tiger path and to `Installation.md`: none left. Re-read the plan file top after the edit to confirm the new note is its own paragraph. Confirmed the tree in `Map.md` still matches disk. Nothing runs yet, so no build or browser check applies. | Pass | low | none — still the first commit | Delete the folder; the plan file is recoverable from DS Tiger git history. |
