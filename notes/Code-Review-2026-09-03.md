# Code review, 2026-09-03: the inspector's uncommitted batch

Range reviewed: the uncommitted working tree on `main` at `e58a763`.
HEAD equals `origin/main`, so there is no committed-but-unshipped work in the range.
Files: `tools/rocket-inspector/content.js` (249 lines changed) and `project-os/History.md`.
The tree moved once during the review (the bubble-size lock landed); every finding
was re-checked against the file after that. Another session is still editing the
file, so line numbers may drift; each finding also names its function.

How it was checked: the whole file was read, then the real script was driven in
the in-app browser pane on a probe page, `.tmp/swap-probe-inline.html`. The pane
tab is hidden, which throttles its timers and freezes its animation clock, so the
content element's `animate` and the page's `setTimeout` were replaced by
controllable fakes and the script's own state machine was stepped by hand.
T1, T2, T3 and T5 are confirmed that way. T4 was observed with real animations in
the hidden tab. The real extension in a focused tab was not driven.

Verdict vocabulary: fix / drop / backlog. One verdict per task.

## 🟠 Important

```
T1 · A mouse move during the return swap replaces the confirmation abruptly
Where:   tools/rocket-inspector/content.js:792, in flash, the `flashTimer = 0` before the second swapContent
Problem: the sentinel is released before the panel has faded out, so paint (line 650) redraws the
         facts while the panel's fade-out is still running; the panel vanishes mid-fade, then the
         facts fade out and rise back in. Confirmed: the probe's hook read the facts text with the
         fade-out animation still running.
Fix:     move `flashTimer = 0` into the second build callback, beside unlockBubbleSize, so the panel
         owns the bubble until the facts are actually rebuilt. stopInspect already handles -1.
Verify:  with the panel showing, keep the mouse moving as it returns: the facts may appear only
         through the rise-in, never mid-fade. In the probe, T1's hook must read the panel text.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

```
T2 · Two quick clicks stack two swaps and bring the facts back twice
Where:   tools/rocket-inspector/content.js:783, flash
Problem: while a swap is in flight flashTimer is -1, so a second click cannot cancel the first.
         Two fade-outs run over each other, both builds start their own 700ms hold, and the facts
         return twice. dblclick is swallowed, but a double-click still fires two click events.
         Confirmed: two clicks produced 2 fade-outs, 2 hold timers, 2 return swaps.
Fix:     two options. (a) In flash, return early when flashTimer === -1: the copy already happened
         and the confirmation is already on its way. (b) Keep the second flash but, in the first
         build callback, clear a still-pending hold timer before setting the new one. If the
         failure state must always win, keep the last `ok` in a variable the build reads.
Verify:  double-click an element: one confirmation, one return. In the probe, T2 reports 1 and 1.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

```
T3 · Releasing the key during the swap leaves a stale confirmation for the next press
Where:   tools/rocket-inspector/content.js:787-791, the first build callback in flash; :817 stopInspect
Problem: stopInspect sets the sentinel to 0 and hides, but the fade-out's onfinish still runs the
         build: it puts the panel into the bubble and starts a 700ms hold. A press inside that
         window shows "Specs copied!" (or "Failed, try again") for the newly hovered element, at
         the panel's own narrow width, since hide released the lock. Confirmed: after stop, the
         hold timer was 1 and the re-press showed the panel text at 88px wide.
Fix:     the first build callback returns early unless flashTimer === -1 (the stop reset it to 0).
         finish still calls place, which hides because there is no target.
Verify:  click, release the key at once, press again within half a second: the hovered element's
         facts must show. In the probe, T3's re-press text starts with the element's tag.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

## 🟡 Nit

```
T4 · A stalled animation clock leaves the bubble's content invisible
Where:   tools/rocket-inspector/content.js:758, the rise-in animation in swapContent
Problem: the comment promises the content is never left invisible, and the fade-out is guarded,
         but the rise-in starts at opacity 0 with no guard. When the clock does not advance (a
         hidden or throttled tab) the content stays at 0. Observed in the hidden pane: content
         opacity 0 with the rise-in frozen at time 0. fadeInBubble (line 472) guards its own fade
         with a 400ms cancel. Rare in real use: the key is held in a focused tab.
Fix:     hold the rise-in animation and cancel it on a short timer, the way fadeGuard does.
Verify:  run the probe with real animations in the hidden pane; content opacity must end at 1.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

```
T5 · Named grid lines are counted as columns
Where:   tools/rocket-inspector/content.js:977, layoutOf
Problem: computed grid-template-columns keeps line names in brackets, so
         `[full-start] 100px [content-start] 200px [content-end] 100px [full-end]` reads as
         7 tracks and prints `cols [full-start], 100px, ...`. Confirmed in the pane.
Fix:     strip `[...]` tokens before splitting; treat `subgrid` as no track list.
Verify:  a grid with named lines reads `3 cols` or the three widths only.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

```
T6 · The comp: line bypasses the card's one-field-per-line contract
Where:   tools/rocket-inspector/content.js:1057, idCard
Problem: a component name is page-controlled text (displayName can be any string); the
         `< 60` guard does not stop a newline or a tab, and the card promises no field carries
         one. flat already exists three lines below.
Fix:     `lines.push('comp:    ' + flat(comp))`.
         Pre-existing, same gap: the file: line from sourceOf (line 1055).
Verify:  every page-derived value in idCard passes through flat or ownWords.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

```
T7 · A local nameOf shadows the module nameOf
Where:   tools/rocket-inspector/content.js:938, componentOf
Problem: the inner arrow nameOf(type) shares its name with nameOf(el) at line 867, which idCard
         calls for the parent line; reading either now needs a second look.
Fix:     rename the inner one, e.g. typeName.
Verify:  syntax check; parent and comp lines unchanged on the probe page.
Status:  [ ] open
```

```
T8 · Stale comments and inert leftovers
Where:   tools/rocket-inspector/content.js:781 (flash comment), :26 (bubbleDisplay comment),
         :23-24 FLASH_OK and FLASH_FAIL, :683 checkIcon, :773 resetBubbleChrome,
         :982 `cs.flexDirection === 'row' ? 'row' : cs.flexDirection` (a no-op ternary)
Problem: the flash comment still describes a pill in two colours; the five names are inert
         since the swap landed. The History row already names them for the owner; listed here
         so the verdict has one place.
Fix:     owner's call: delete the inert five and fix the two comments, or keep them and fix the
         comments only. Either way drop the no-op ternary.
Verify:  syntax check; bubbleDisplay's one reader is place (line 491), which then reads 'block'.
Status:  [x] done, fixed in 28c9f59 and confirmed by the probe on 2026-09-03
```

## Pre-existing, flagged only

```
P1 · History.md has fourteen scan rows filed inside the appendix table
Where:   project-os/History.md:164-177 and :197-198
Problem: since 2026-09-01, scan rows (the `| date | tools | **bold** |` shape) have been appended
         at the file's end, inside the appendix table, and the newest appendix row sits after a
         blank line, which breaks that table. The scan log proper ends at line 104, so a reader
         of the scan log misses every row since 2026-09-01.
Fix:     move the fourteen scan rows verbatim up to the end of the scan table and remove the
         blank line at 197. Verbatim, per the file's own rule. Not done here: rule 18, and the
         file is under edit by another session.
Verify:  the scan table and the appendix table each render as one table.
Status:  [x] done, the rows moved back in 28c9f59
```
