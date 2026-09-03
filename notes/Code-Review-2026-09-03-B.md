# Code review, 2026-09-03 B: the four commits since the morning review

Range reviewed: `e58a763..7759097` on `main`, the four commits that landed after
the morning review (`28c9f59`, `695ec33`, `b9a5161`, `7759097`). HEAD equals
`origin/main` and the working tree is clean, so there is no uncommitted work and
nothing committed-but-unpushed; the range is what the morning review did not see,
which the owner has already pushed.
Files: `tools/rocket-inspector/content.js` (469 lines changed), `project-os/History.md`,
`project-os/Decisions.md`, `project-os/Conversations.md`, `project-os/Mistakes.md`.
Reviewed by one pass, one reviewer, no fan-out; nothing ran degraded.

How it was checked: the whole script was read, then the real committed script was
driven in the in-app browser pane on a probe page, `.tmp/review-probe-2.html`,
with the page's timers on a virtual clock and the content's `animate` faked, since
the pane tab is hidden and freezes both. T1, T2, T3, T4, T5 and P1 are confirmed
that way, each against the exact input named below. T6 is confirmed by reading and
was already named by the owner. D1 is confirmed by reading the file. The real
extension in a focused tab was not driven.

Verdict vocabulary: fix / drop / backlog. One verdict per task.

## 🟠 Important

```
T1 · Releasing the key before the copy resolves leaves a stale confirmation for the next press
Where:   tools/rocket-inspector/content.js:929, flash; :1323, the click handler's .then
Problem: the click handler checks `inspecting` at click time, but the clipboard write is a
         promise, and flash runs when it resolves. If the key is released in between,
         stopInspect has already run, and flash then takes the fresh-panel path with the bubble
         hidden: the panel is built into the hidden bubble and a 2.4s hold starts. The next press
         inside that hold shows "Specs copied!" for the newly hovered element, in flex layout.
         This is the morning review's T3 symptom back through a second door. Confirmed: after
         release-then-resolve, the re-press over element B read "Specs copied!", display flex,
         one hold timer live. Narrow window in practice: the write usually resolves in a few ms.
Fix:     first line of flash: `if (!inspecting) return;`. Nothing is on screen to confirm into.
Verify:  in the probe, T1's re-press text must start with the hovered element's tag; in the
         real extension, click and release the key at once, press again within two seconds:
         the element's facts show, never the panel.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

```
T2 · The card names a minified component on every production React site
Where:   tools/rocket-inspector/content.js:1102, componentOf
Problem: the gate is "starts with a capital and under 60 characters", which a production
         build's minified names pass: a fiber whose type is `function Ko` prints
         `comp:    Ko`. That name exists in no source file, so the agent that receives the
         card searches for it and finds nothing, and the card's own rule is that unknown is
         never guessed (the sourceOf comment). Confirmed on a hand-built production-shaped
         fiber: `comp:    Ko`; the dev-shaped one read `comp:    SaveButton`.
Fix:     only trust a fiber that carries a dev-only field: `if (!('_debugOwner' in f)) break;`
         at the top of the fiber walk. React 18 and 19 dev builds stamp `_debugOwner` on every
         fiber; production builds have no `_debug*` keys at all. A cheaper but weaker gate is
         `name.length >= 3`, which still lets `Wqz` through.
Verify:  the probe's production-shaped fiber yields no comp line; the dev-shaped one still
         reads `comp:    SaveButton`. On a real production React site (any Meta page) the
         card has no comp line; on a Vite dev server it still does.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

## 🟡 Nit

```
T3 · A flick to another element inside the swap window keeps the confirmation for the full hold
Where:   tools/rocket-inspector/content.js:920, endFlash; :1283, the settle callback in aimAt
Problem: endFlash only acts when a hold is running (`flashTimer > 0`). During the 144ms swap
         the sentinel is -1, so a cursor that settles on B in that window changes the target,
         and the panel then lands anyway, over B, at A's locked size, for the full 2.4s.
         Confirmed: click A, move to B, settle at 60ms, swap ends: bubble reads "Specs copied!",
         one hold timer, minWidth still 214px from A. The intent written above endFlash is that
         the element under the cursor beats the message about the one just left.
Fix:     capture `const el = target` in flash; in its build callback treat `target !== el` like
         an overtaken generation: `flashTimer = 0; unlockBubbleSize(); drawnSignature = '';
         return false;` and let the next paint draw B's facts. Or drop: an 80ms flick is rare
         and the panel is still true about A.
Verify:  in the probe, T3 must read B's facts and zero hold timers.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

```
T4 · A subgrid with named lines reads "1 cols subgrid"
Where:   tools/rocket-inspector/content.js:1124, layoutOf
Problem: the guard is an exact match on `subgrid`, but the computed value carries the line
         names: `subgrid [a] [b] [c] [d]`. After the bracket strip one token is left and the
         card prints `layout:  grid, 1 cols subgrid`. Confirmed in the pane.
Fix:     `cols.indexOf('subgrid') !== 0` instead of `cols !== 'subgrid'`.
Verify:  the probe's #sub prints `layout:  grid` with no cols part.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

```
T5 · An image with padding gets the padding wash while its bubble hides the padding row
Where:   tools/rocket-inspector/content.js:673, drawBands calls drawPadding for every kind;
         :475, fillBubble skips the Padding row for images
Problem: the bubble decided an image's padding is not news, the bands decided it is. On an
         <img> with 10px padding the pane drew four orange washes with numbers and a bubble
         with no Padding row. Cosmetic, and only on padded images, which are rare.
Fix:     owner's call: either `if (kindOf(el) !== 'image') drawPadding(el)` or put the Padding
         row back for images. Either way the two should agree.
Verify:  hover a padded <img>: washes and row both present, or both absent.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

```
T6 · The panel keeps its first outcome while it is up
Where:   tools/rocket-inspector/content.js:930, the hold-running branch in flash
Problem: a click while the panel shows only restarts the hold, so a copy that fails after
         one that succeeded still reads "Specs copied!". Already named by the owner in the
         2026-09-03 History row for 7759097 as not covered; listed here so it has a verdict.
Fix:     in that branch, when `ok` differs from the panel's outcome, rebuild the panel's text
         in place (no swap), or drop: a second write rarely fails where the first succeeded.
Verify:  stub the clipboard to fail on the second call: the panel reads "Failed, try again".
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

```
D1 · The scan log is broken by a blank line again, and the review row sits above older rows
Where:   project-os/History.md:128 (blank line) and :104 (the morning review's scan row)
Problem: line 128 is blank, so the last scan row (the click-restarts-hold row from 7759097)
         renders outside the scan table, the same defect as the morning review's P1. And when
         P1's fourteen rows were moved back, they landed after the review row that had been
         appended at line 104, so the log now runs 09-01, 08-31, 09-03, 09-01, ..., which
         breaks "newest at the bottom". Rows are verbatim and correct; only their placement is off.
Fix:     delete the blank line at 128; move the row at 104 verbatim to sit after the last
         2026-09-02 row. Both are placement edits, not rewrites, which the file's own rule allows.
         Not done here: rule 18.
Verify:  the scan table renders as one table, dates never go backwards down the log.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```

## Pre-existing, flagged only

```
P1 · The card calls a dark Tailwind v4 page "light"
Where:   tools/rocket-inspector/content.js:1076, pageTheme
Problem: pageTheme parses the body background with an rgb() regex, and Chrome reports an
         oklch() background as oklch(), which Tailwind v4 emits for every colour. The regex
         misses, the function defaults to light, and the view line lies about the theme the
         owner's eyes saw. Confirmed: body `oklch(0.13 0.028 261.7)` printed `view: ... light`.
         Predates this range; the 2026-09-01 colour fix taught toHex and isTransparent to
         paint modern colours but missed this reader.
Fix:     `return isDarkColor(c) ? 'dark' : 'light'` using the isDarkColor that 7759097's
         range added for the band numbers; it already paints through the canvas.
Verify:  the probe's oklch body prints `view: ... dark`; an rgb(255,255,255) body still light.
Status:  [x] done, fixed on 2026-09-03 after the owner's "fix all", confirmed by the probe
```
