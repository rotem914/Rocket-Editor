# Rocket Editor — Bug Atlas

The map of this project's recurring bug classes.

`project-os/History.md` records that a bug was fixed. This file records the
PATTERN, so the next session recognizes it in minutes instead of rediscovering
it in hours. Read the matching row before writing a fix.

## When a bug earns a row

Add or update a row when:

- the same bug pattern appears a second time,
- a fix took several attempts because the real root cause was hidden,
- a library or API behaves in a known dangerous way,
- a future session is likely to reach for the same WRONG fix again.

A one-off typo earns nothing. The atlas is for classes, not incidents.

## How to use it

1. Name the symptom you see.
2. Search this table for a matching row.
3. If a row matches, follow its fix and checklist before debugging anew.
4. If nothing matches, debug normally.
5. If the issue turns out to be a pattern, add the row in the same task.

## Atlas

| # | Symptom | Root cause | The fix that holds | Times bitten | Where recorded |
|---|---|---|---|---|---|
| 1 | The inspector shows a stale "Specs copied!" for an element that was never copied, on the next key press | The confirmation is built by an async chain (a fade-out's `onfinish`, or the clipboard promise) that runs after `stopInspect` already hid the bubble, so the panel lands in a hidden bubble with a live hold timer, and the next `paint` skips the facts because a flash "owns" the bubble | Every entry point that builds the panel re-checks `inspecting` and `target` at build time, not at click time: the generation counter `flashGen` for the swap callback, and the `!inspecting || !target` guard at the top of `flash` for the promise. When adding a third async step, guard it the same way | 2 (2026-09-03 morning review T3, 2026-09-03 second review T1) | `notes/Code-Review-2026-09-03.md` T3, `notes/Code-Review-2026-09-03-B.md` T1 |
