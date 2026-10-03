# Canvas Capture, lessons for Rocket

Read on 2026-09-23 at Rotem's request: https://github.com/Ofirushinek/canvas-capture,
at commit `eb27671`. Reading that repository was the owner-named exception to
CLAUDE.md rule 21, for this evaluation only.

How it was read. Four readers took one angle each: the capture engine, the
return to code, how the author drives Claude agents, and product strategy. A
skeptic then checked every claim against the cited lines and against Rocket's
own documents, and a completeness pass looked for what all of them missed.
Their code was read, never run. Line numbers quoted from Rocket's own files are
as of commit `60d4235` plus the uncommitted 2026-09-21 Inspector change,
content.js and its History rows, before the five plan changes below moved them.

Licence: Business Source License 1.1. Techniques only; no code from the
repository is copied into Rocket, and its wording appears here only as short
cited evidence.

## The short version

It photographs a public page into Claude's own design canvas, and edits happen
on that copy. The way back into code is a 72-line list of rules, never revised
and never measured, and its open problems, which element was edited and whether
a value is written in the code or comes from live data, are what Rocket's
fingerprints and project search exist for. It supports Rocket's bet rather than
competing with it. Its
real value is the hard-won list of traps in reading a live page.

## What went into the plan

Five lessons, at Rotem's word on 2026-09-23:

1. The landed check switches off the sent group's own preview before reading.
2. It reads a settled page, against a match rule written per property.
3. A "just this one" change is checked for spread to its look-alikes.
4. A selection's values are read at rest, never in hover styling.
5. The text search compares words, not characters.

Everything else below is reference, not a commitment.

## Verified lessons (35)

Each one survived the skeptic: the claim about canvas-capture holds, and it can
work under Rocket's rules. "Already in Rocket" means the idea is written down
somewhere in our documents, not that it is built.

### Checking that a change landed

#### A1 · A settle gate before every landed check and every re-find after reload

**Lesson.** Before a landed check or a draft re-find, wait for the page to settle, scoped to the group's own elements: document.fonts ready or status, the element's own getAnimations() finished (bounded, and ignoring infinite loops), then two reads a beat apart that agree. canvas-capture shows each ingredient (fonts.ready mjs:455-463, a bounded 8s document-wide getAnimations drain :284-301, a 15s spinner wait :255-282, a whole-document two-sample check on geometry plus computed values :465-510), but its sampling loop gives up after five samples and captures anyway.

**Why it matters.** Landed verification is the moment the loop's trust is decided, and it runs right after a fresh load. That is exactly when theme classes flip under transition-colors, webfonts swap in (width and height are two of the 15 properties) and data widgets shift the layout. A single read gives false 'off' verdicts and false 'unfindable' drafts. Rocket adding or removing its own preview rules also sets off the element's own transitions. Adapt rather than copy: scope the gate to the group's own elements (el.getAnimations(), document.fonts.status, two agreeing reads, bounded). Never freeze the page, because the helper is passive (invariant 2, Architecture line 386).

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:455-463 (fonts.ready and why), :284-301 (getAnimations drain, bounded to 8s), :255-282 (infinite-spinner wait), :465-510 (two-sample computed-value fingerprint); skills/1-ui-to-canvas-capture/SKILL.md:267-278 (an icon measured mid-transition at 1424x1424)

**Rocket today.** After a reload, Rocket re-reads rendered values once and marks the group landed or off (notes/Rocket-Editor-Architecture.md §6 lines 242-250). It re-finds drafts by fingerprint (lines 252-258; Build Plan R-22b lines 170-177, R-22c lines 179-186). Neither step has any notion of waiting for the page to settle.

**Verdict.** adapt, medium effort, already in Rocket: no.

**Skeptic's check.** The cited lines check out, with one correction. The two-sample loop does not 'proceed only when both reads agree': mjs:504-510 breaks on a match OR gives up after 4 retries, logging 'capturing anyway'. The hydration-transition theory behind it is unconfirmed: the same comment says getAnimations showed nothing running, and SKILL.md:185-195 (#20) calls that margin flip 'NOT a timing issue a longer wait fixes'. So fonts.ready and the animation drain are well founded, and the two-sample part rests on thin evidence. Rocket today: Architecture:242-250 and 252-258 and Build-Plan R-22b/R-22c read once, with no settle step. The Writing-Track (line 920) only waited for hot reload or a timeout, and Visual_QA.md:92 ('re-check anything you saw mid-transition') is a rule for the assistant's own QA, not product behaviour. The case is stronger than stated: with HMR there is no reload at all, so the element's own transition-colors animates the landed value in place. The gate is read-only, so it fits invariant 2.

**In the plan.** Architecture section 6, "It reads only a settled page"; Build Plan R-22c.

#### A3 · Detect a broken site before judging a group

**Lesson.** Check that the site itself is healthy before judging a sent group. canvas-capture fails loudly on a non-2xx navigation (mjs:194-210; SKILL.md:234-243). Rocket's helper can read the navigation entry's responseStatus and look for a framework build-error dialog, then hold verification as 'site broken' rather than marking the group off or every draft unfindable.

**Why it matters.** When Claude's edit breaks the build, Vite and Next typically keep the old DOM under an error overlay (vite-error-overlay, nextjs-portal) or serve a 500 page. The landed re-read then sees the old values and marks the group 'off', or every re-find fails and every draft is flagged as lost. That is the wrong verdict exactly when the designer needs the right one. A small check comes first: the navigation response status, or a known framework error overlay being present. If either shows, report 'site is broken' and hold the verification.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:194-210; skills/1-ui-to-canvas-capture/SKILL.md:234-243

**Rocket today.** After Claude lands a group and the site reloads, Rocket marks the group landed, landed with a deviation, or off, and flags any draft it cannot re-find (Architecture §6 lines 242-258, invariant 4 lines 393-397; Build Plan R-22c lines 179-186). The docs have no state for 'the site itself is broken right now'.

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** The canvas-capture citation is exact. The lean Architecture (242-258, 393-397) has no broken-site state. The retired Writing-Track did have one: 'unverified with its reason' (lines 1818-1820, 2112, invariant 16 at 2424-2427), plus dev-server-down detection (1836-1848), but only for a server that is down, not a build that is broken under an overlay. Precision fixes: (1) after an HMR compile error there is no navigation, so the status is still the old 200 and the overlay check is what counts; (2) Next 15+ renders its always-on dev indicator inside nextjs-portal, so the check must look for the error dialog, not just that element; (3) if the root layout that holds the helper line breaks, the helper goes silent, which the panel must also read as 'site broken'. All of these checks are passive reads.

#### B2 · Never verify through your own preview layer

**Lesson.** canvas-capture learned that two outputs of the same pipeline can agree and both be wrong. Rocket's version of that risk is its own preview rule still winning the pixel during the landed read. The rule already exists in Rocket's deferred writing track (tear down the preview before re-reading, plus an 'unverified, no reload arrived' state). It needs porting into the lean R-22c: read with the sent group's preview rules disabled, and never mark landed without a detected update.

**Why it matters.** Rocket's preview is an injected style rule keyed to a marker that deliberately survives re-renders (Architecture.md:142-149). Under hot reload the page often never fully reloads, so the sent group's own rule still wins the pixel when Rocket re-reads it, and every group reads 'landed' whether or not Claude's edit worked. Restore the teardown step and an 'unverified, no reload seen' state in R-22c before it is built.

**Their evidence.** .claude/commands/capture.md:74-79, 80-90

**Rocket today.** Landed is read from rendered values after the reload (Architecture.md:242-251), and drafts are re-applied by fingerprint after every reload (Architecture.md:252-258). The lean docs never say that a sent group's injected preview rules are removed before that read, and they assume a full reload happens. The writing track had exactly this rule: 'preview teardown is part of Apply... a write that landed on the wrong node would look correct', with an 'unverified because no reload arrived' outcome (Writing-Track.md:917-925). The lean Architecture and R-22c dropped it.

**Verdict.** adapt, small effort, already in Rocket: yes.

**Skeptic's check.** capture.md:74-79 (same-pipeline false match) and 80-90 (screenshot parity is not proof that the canvas will render) are accurate. Already written down in Rocket: Writing-Track.md:917-925 (teardown, 'unverified because no reload arrived') and the older Plan.md:223-226 ('a staged preview always wins'). The lean Architecture drops it: it assumes a full reload wipes previews (Architecture.md:252-255), and R-22c says only 'after a sent group's reload' (Build-Plan.md:180). The gap is real under HMR or fast refresh, where no full reload happens and the helper's injected rule plus re-marking watcher (Architecture.md:142-149) keep the preview live. A read-only fix fits the passive helper: toggle the group's rule off, read the computed style, toggle it back on. Classed as already-have (port forward), not a new lesson from canvas-capture.

**In the plan.** Architecture section 6, "The landed check reads Claude's code"; Build Plan R-22c.

#### B7 · Give the landed check a noise floor and an explicit verdict before R-22c is built

**Lesson.** canvas-capture made its pixel check usable with an empirical noise floor and a named 'known variance' class that ends investigation. R-22c needs the value-level equivalent written before it is built: a per-property equality rule that handles fractional px from rem, colour-space round trips (oklch vs rgb strings), shadow serialization and 'normal' line height. Without it, 'off' fires on correct landings.

**Why it matters.** Without a written tolerance per property (sub-pixel values, rem rounding, colour-space round trips, shadow serialization order, 'normal' line height), 'off' fires on correct landings and the designer learns to ignore it. That kills the verification. The state vocabulary is already a verdict; only the equality rule is missing.

**Their evidence.** skills/1-ui-to-canvas-capture/diff-screenshots.py:44-59, 117-121; .claude/commands/capture.md:65-68

**Rocket today.** R-22c marks a group landed 'when they match' what was approved (Build-Plan.md:179-186; Architecture.md:244-246), with no tolerance defined. The Inspector already meets this variance: colours can come back in oklch and have to be painted and measured (content.js:1315), and rem values resolve to fractional px.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** diff-screenshots.py:44-59 (THRESHOLD=24, GOOD_ENOUGH=8.0) and 117-121, and capture.md:65-68 (≤2px wrap variance), are accurate. Rocket: R-22c says 'when they match' with no tolerance (Build-Plan.md:179-186; Architecture.md:244-246). A grep for tolerance, rounding and normalization found nothing relevant. content.js:1315 accurately shows the Inspector already hitting oklch values. The transfer is conceptual: Rocket compares computed values, not pixels, so the fix is normalization plus per-property epsilons, not a percentage threshold.

**In the plan.** Architecture section 6, "against a written rule for each property"; Build Plan R-22c.

#### C1 · Read the landed value with Rocket's own preview removed, and confirm it through a second pipeline

**Lesson.** canvas-capture documents a same-pipeline trap. A capture and its 'live' reference matched each other while both were wrong, and the root cause was confirmed by measuring the same elements outside the pipeline (capture.md:74-79, SKILL.md:274-276, commit 530daa7). Rocket's writing track already solved the matching problem: it removes the written entries from the preview style, waits for hot reload or a bounded timeout, re-reads, and otherwise marks the change unverified (Writing-Track.md:917-925). The lean landed check dropped that step (Architecture.md:242-250, Build-Plan R-22c). Under hot reload the group's injected preview rule survives, so the re-read confirms Rocket's own preview. Port the teardown into Architecture section 6 and R-22c, and run the R-22c sabotage check under hot reload.

**Why it matters.** The one verdict Rocket shows Rotem would confirm itself in the most common dev setup. Port the writing-track teardown into Architecture section 6 and R-22c: drop the group's preview rules, wait, then read. Run the R-22c sabotage check under hot reload with no full reload. Do the S-LOOP eye check in a plain tab outside Rocket, so it is an independent second pipeline.

**Their evidence.** capture.md:74-79; commit 530daa7 message ('confirmed against the live page with standalone verification scripts (not just self-consistent before/after screenshots, which is what let the broken capture through step 3)'); SKILL.md:274-276 (finding 28)

**Rocket today.** Architecture.md:142-149 puts the preview in an injected style rule keyed to a marker. Architecture.md:242-250 marks a group landed by re-reading rendered values after 'the site reloads', and :252-258 re-applies drafts after each reload. Nothing says the sent group's own preview rule is removed before that read. Dev servers usually hot-swap CSS and components without a full reload, so the injected rule and the marker can survive, and the re-read returns Rocket's own preview: landed, whatever Claude wrote. The writing track had this guard: Writing-Track.md:917-925 removes those entries from the preview style, waits for hot reload or a bounded timeout, then re-reads, because 'a write that landed on the wrong node would look correct'. The lean architecture lost it. The sabotage check in Build-Plan R-22c:185-186 catches the problem only if it runs under hot reload with the preview still live. R-23:191-192 scores against Rotem's eyes, which look through the same preview layer.

**Verdict.** adapt, small effort, already in Rocket: yes.

**Skeptic's check.** Evidence checks out. capture.md:74-77 says both screenshots came from the same script. The 530daa7 message matches the quote. SKILL.md:274-276 describes the standalone measurement. One overstatement: 'found only by' a standalone script. Per 530daa7, the broken capture was first noticed because it looked broken, and the standalone scripts then confirmed the root causes. already_in_rocket=true because the idea exists at Writing-Track.md:917-925. The lean Architecture, the Decisions entry on group handoff and R-22c all lack it, so the gap is real. It is a regression inside Rocket's own design, not something new learned from canvas-capture. Lean Architecture.md:243-245 and R-22b assume 'the site reloads'. Vite and Next Fast Refresh usually hot-swap without a full reload, so the injected style rule and its marker persist. Porting has one catch: the writing track's teardown was triggered by the Apply moment, and lean Rocket has none, with no repo watcher (Architecture.md:343). So the port needs its own trigger, such as a 'check now' action or a detected hot-update, before it drops the preview and reads. Removing its own injected rule is not a file write and stays within the passive helper's preview remit.

**Completeness pass.** Duplicate of B2 (tear down the preview before the landed read, ported from Writing-Track.md:917-925). Merge them, keeping C1's point that lean Rocket has no Apply moment, so the teardown needs its own trigger.

**In the plan.** Architecture section 6, "The landed check reads Claude's code"; Build Plan R-22c.

#### C2 · Catch collateral changes, not only the target: a before/after diff with a noise floor that points at where things changed

**Lesson.** canvas-capture's diff script scores every pixel of the region the two screenshots share. It ignores differences below a 24/255 per-channel noise floor and names the five worst 100px bands, so the agent knows where to look (diff-screenshots.py:44-52, 83-89, 101-112). It was validated once, on a known 70px button offset (87fc1fe). The Rocket analog: the landed check re-reads only the group's own elements, so a scope leak would still read landed. One example is a 'just this one' change that Claude applies to a shared component. S-LOOP's zero-wrong-element bar has no detector. The fix is a read-only sweep of the fifteen properties on the current page before sending and after landing. Elements under live previews are excluded, and the sweep carries its own noise policy for live data and animation. It would flag and locate changes outside the group, always stated as 'on this page'.

**Why it matters.** A scope leak is the likeliest executor error given Rocket's local-versus-everywhere intent, and a per-element check cannot see it. Rocket can do this read-only and more cheaply than a pixel diff. Before sending and after landing, snapshot the fifteen properties of every element on the current page, keyed by the stable fingerprint half. Flag and locate anything outside the group that changed. That also gives S-LOOP a real wrong-element count instead of an eyeball guess.

**Their evidence.** diff-screenshots.py:44-52 (noise floor 24/255 and why), :83-89 (per-pixel max across channels), :101-112 (top 5 worst bands, near-empty bands dropped); capture.md:65-66; commit 87fc1fe (validated on a known 70px button offset)

**Rocket today.** The S-LOOP bar demands 'zero edits touch a wrong element' (Architecture.md:448, Build-Plan R-23:193-194), but no method detects such an edit. R-22c (Build-Plan:179-186) and Architecture.md:242-250 re-read only the group's own elements. Suppose Rotem chose 'just this one' and Claude edits the shared component, restyling all twenty cards (Architecture.md:194-198). The check would still read landed.

**Verdict.** adapt, medium effort, already in Rocket: no.

**Skeptic's check.** The mechanics are accurate, with two caveats. First, the script compares only the shared top region (diff-screenshots.py:78-81), not literally 'the whole page'. Second, 'collateral changes' is Rocket's framing: canvas-capture compares a capture with the live page, not before with after, and has no notion of 'parts expected to change'. Rocket today: nothing in the lean Architecture, Build-Plan or Decisions detects wrong-element edits, as the Architecture.md:448 / R-23:193-194 citation says. Partial prior art: Writing-Track.md:2949 (spike S-F2) already asks for the 'cost of the two-snapshot property sweep over one to five thousand elements', so the mechanism and its cost question are written down, but for a different purpose. Feasibility caveats the lesson omits. (1) Rotem keeps designing while Claude works, so drafts' previews change other elements. The sweep must read with previews removed, which depends on C1. (2) Live data, timers and animations will produce changes the group did not cause, so this needs its own noise floor, which is canvas-capture's actual lesson. (3) Weighted fingerprint matching across thousands of elements can mis-pair them and raise false flags. (4) Coverage is the current page only. (5) An 'everywhere' group legitimately changes many elements, so the expected set must come from the recorded intent.

**Completeness pass.** This is B1 with a heavier mechanism. canvas-capture compares a capture against the live page, not a before against an after. Its page-wide aggregate score is exactly what the B weakness 'a page-wide pass threshold can wave through a local miss' warns against. A sweep of fifteen properties over every element on the page, matched by weighted fuzzy fingerprints while drafts are live and data changes, will be noisy. B1's look-alike set is the right scope; merge C2 into it.

**In the plan.** Architecture section 6, "A just this one change is also checked for spread"; Build Plan R-22c.

#### C3 · Judge only a settled, healthy page, and give 'could not verify' its own verdict

**Lesson.** canvas-capture reported false defects when it read too early. verify-capture now waits for document.fonts.ready instead of a fixed 1200ms (verify-capture.mjs:45-57, f97d40f). The capture waits up to 8s for getAnimations() to drain and pauses infinite CSS animations (SKILL.md findings 28 and 40). The live page's HTTP status is only logged as a warning (verify-capture.mjs:73-75). canvas-capture has no 'could not verify' verdict. For Rocket, bring back the writing track's 'unverified, with its reason' state (Writing-Track.md:921-923, 1818-1820, 1844-1849) into the lean landed check. Read only when fonts are ready, a bounded animation drain has finished, no dev-server error overlay is showing, and every element in the group was re-found. Otherwise show 'not verified' instead of 'off'.

**Why it matters.** Suppose a font is still loading, a transition is mid-flight, the dev server shows an error overlay, or a group's elements were not re-found. Showing 'off' in any of these cases sends Rotem and Claude to fix code that is correct. Add a fourth state, 'not verified', with the reason. Read only when fonts are ready, animations have drained (bounded), there is no error overlay, and every element in the group was re-found.

**Their evidence.** verify-capture.mjs:45-57 and commit f97d40f; verify-capture.mjs:73-75; SKILL.md:267-278 (finding 28); SKILL.md:388-399 (finding 40)

**Rocket today.** Architecture.md:242-250 and R-22c (Build-Plan:179-186) define three verdicts: landed, deviation, off. There is no settle rule and no page-health check. The writing track had both: 'unverified because no reload arrived' (Writing-Track.md:921-923) and 'verification capability is a separate axis' (Writing-Track.md:1844-1849). Visual_QA.md:91-94 has a settle rule, but only for human QA passes. History.md:249 shows a real case: console probing failed because the dashboard was not on screen in that tab.

**Verdict.** adapt, small effort, already in Rocket: yes.

**Skeptic's check.** Mostly accurate. Only the fonts case was verification itself producing a false defect. Findings 28 and 40 are capture bugs that baked the wrong state into the output, not verification false alarms. The HTTP check does not stop the run or change the verdict. The live-page side of verify-capture waits only for networkidle, fonts and scrolling, not for animations to drain. A failed navigation also continues (verify-capture.mjs:69-72). The 'could not verify' verdict in the title is Rocket's own idea, already written in the writing track, not something canvas-capture does. So already_in_rocket=true for the fourth state, which the lean architecture lost. Architecture.md:242 lists draft, sent, landed, deviation and off. New from canvas-capture: the specific readiness checks. Rocket has no fonts.ready or getAnimations use anywhere, and Visual_QA.md:91-94 is a human-QA settle rule only. Constraint: the passive helper may wait and read, but it should not freeze the client's animations just to verify, because that changes what Rotem sees. It should wait for a bounded time, then read or mark not verified. The History.md:249 citation is a weak example: it was a human console probe on a tab that was not showing the target.

#### C7 · Write down what 'match' means per property before building the landed check

**Lesson.** diff-screenshots.py fixes its two numbers in code, a 24/255 per-channel noise floor and an 8% good-enough bar, and the tool, not the agent, applies them (lines 44-59, 117-121). The 8% was chosen from the same session's clean runs (997bb5a). Rocket already fixes the S-LOOP bar before the run, but R-22c's 'landed when they match' has no comparison rule. Write a normalization and tolerance table per property into the R-22c spec before the calibration runs. Colours are compared as normalized RGBA: Chrome returns oklch() for Tailwind v4 colours, not rgb(), and content.js colorRGBA already does this conversion. Lengths are compared in px within a stated tolerance, and 'normal' line height and weight keywords are resolved. Snap-to-scale matching defines the deviation state.

**Why it matters.** Without a stated tolerance per property, the landed check will either flag noise as 'off' or get loosened by eye run after run. Write the normalization and tolerance table into the R-22c spec before the build and before the calibration runs, for example colors compared as normalized RGBA and lengths within 0.5px.

**Their evidence.** diff-screenshots.py:44-52, :54-59, :117-121

**Rocket today.** The S-LOOP bar is already fixed before the run (Architecture.md:448; Build-Plan R-23:192-194). That is stronger than canvas-capture, whose 8% was set after watching the same session's clean runs. What is missing is the comparison rule itself: R-22c says only 'marks the group landed when they match' (Build-Plan:180-181). Colors come back as rgb() when the designer picked hex or a token, rem values resolve to fractional px (0.83rem is 13.28px), line height can read 'normal', and weight keywords come back as numbers.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** The canvas-capture lines are accurate. Rocket-side correction: the lesson says 'colors come back as rgb()', but Rocket's own review found Chrome reports oklch() for Tailwind v4 colours (Code-Review-2026-09-03-B.md:134-138). The Inspector already has canvas-based normalization (content.js:149-177 colorRGBA, 183-201 toHex, 236-240 pxLabel), so the table can reuse proven code. No tolerance or normalization rule exists for the landed check in the Architecture, Build-Plan or Writing-Track. The deviation state (a snap-permitted 13 that lands at 16) also needs a rule for 'matched a scale step', which belongs in the same table. Applicable: it is a spec written before building, all read-only.

**Completeness pass.** Duplicate of B7. Merge them, keeping C7's corrected statement: Chrome returns oklch() for Tailwind v4 colours, and content.js colorRGBA can be reused.

**In the plan.** Architecture section 6, "against a written rule for each property"; Build Plan R-22c.

#### C10 · Test output in the consumer that actually uses it, not a more forgiving stand-in

**Lesson.** canvas-capture learned that a matching screenshot proves visual fidelity, not that the strict Design-canvas parser will accept the file. A nested `<body>` rendered fine in Chromium, while the canvas silently dropped the whole board (capture.md:80-90; SKILL.md findings 31 and 38; commit 3876561). Rocket already tests its outputs in their real consumers: the extension in real Chrome via the owner checklist (QA.md:36), the handoff with Claude Code on a calibration repo (R-23), and the backup by actually restoring it (R-28). The one soft spot is R-22's check, where a human reads the handoff (Build-Plan:167-168). Keep one real-consumer test for each new output.

**Why it matters.** Nothing new to adopt. Keep the pattern as new outputs appear: every file or block Rocket hands over gets one test in its real consumer, not only a human read. That includes the clipboard block, the backup file and the clean-check verdict.

**Their evidence.** capture.md:80-90; SKILL.md:298-306 (finding 31), :374-382 (finding 38); commit 3876561

**Rocket today.** Rocket already covers this where it counts. QA.md:36 sends the real extension load, key, clipboard and badge to an owner checklist, because the pane is a forgiving stand-in. The handoff is tested with its real consumer, Claude Code on a calibration repo (Build-Plan R-23). Backup restore is tested by actually restoring (R-28:226-230). One small gap: R-22's check is Rotem reading the handoff (Build-Plan:167-168), and a human reader is the forgiving one.

**Verdict.** already-have, small effort, already in Rocket: yes.

**Skeptic's check.** All citations verified. The classification as already-have is correct. The clean check (R-26) is also tested against a real project with the line in and out (Build-Plan:217-218). Nothing new to adopt.

#### D8 · Wait for transitions and fonts to settle before the landed re-read

**Lesson.** canvas-capture waits up to 8 seconds for document.getAnimations({subtree:true}) to empty before measuring, after catching a 10px icon mid-transition at 1424px. Its verifier waits for document.fonts.ready instead of a fixed timer. It then pauses all CSS animations unconditionally. Rocket's R-22c read-back should use a bounded, read-only settle wait scoped to the group's own elements (el.getAnimations() and fonts.ready) before comparing values, because a page-wide drain never finishes while any looping animation runs. Do not adopt the global pause.

**Why it matters.** Hot reload swaps CSS in place, so an element with a transition on padding or colour animates from the old value to the new one. A read mid-flight marks a correctly landed group 'off', the false alarm that most damages trust in verification. Adopt the bounded wait for animations to finish plus fonts.ready; both only read. Do not adopt the animation freeze: it changes what the page shows and does not fit a passive helper.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:284-301, 317; skills/1-ui-to-canvas-capture/SKILL.md:267-278, 388-399; skills/1-ui-to-canvas-capture/verify-capture.mjs:45-56; commit f97d40f

**Rocket today.** R-22c re-reads rendered values after a sent group's reload and marks landed, deviation or off (notes/Rocket-Editor-Build-Plan.md:179-186; notes/Rocket-Editor-Architecture.md:242-251). No settle condition is written. R-22b re-finds drafts after the same reload (Build-Plan.md:170-177).

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: mjs:284-301 and 317, SKILL.md:267-278 and 388-399, verify-capture.mjs:44-56, commit f97d40f. One inaccuracy: the pause at mjs:317 is not 'only a last resort'. It runs every time after the drain wait, whether the wait succeeded or not. canvas-capture's own finding 40 (SKILL.md:388-393) shows the document-wide drain always times out when a looping animation exists, hence the element-scoped correction. No settle condition exists in the lean docs. Writing-Track.md:920 waited only for 'hot reload or a bounded timeout', which is a reload wait, not an animation settle. A related gap this surfaces: CSS hot reload in Vite or Next swaps styles without a page reload. Architecture.md:252-255 assumes a full reload wipes previews, but under hot reload Rocket's injected preview rules survive and would mask the landed code. The Writing-Track's 'preview teardown is part of Apply' (Writing-Track.md:917-925) has no lean equivalent in R-22c.

**Completeness pass.** Overlaps A1 (a settle gate scoped to the element) and C3 (a 'not verified' state). On its own it adds nothing beyond them; merge it.

**In the plan.** Architecture section 6, "It reads only a settled page"; Build Plan R-22c.

### Rocket Inspector

#### A2 · The cursor is part of the measurement: the Inspector reads hover state and values caught mid-transition

**Lesson.** The Inspector reads getComputedStyle and the transformed bounding rect of the element under the cursor, so :hover rules and in-flight hover transitions (first read 60ms after entering the element) leak into the bubble and the copied card. canvas-capture notes that computed style includes hover state (mjs:756-757, 776-777) and captures hover only through an explicit hover: step (:412). The cheap fixes are to re-read when target.getAnimations() finish and to take size from layoutBox. A 'while hovered' flag needs the matched-rule walk.

**Why it matters.** On a button with hover:bg-* plus Tailwind's default 150ms transition-colors, the bubble shows either the hover colour or a colour partway through the change, and the copied card hands the hover colour to Claude as the background. A card with hover:scale-105 reports a size 5% too big. The future panel's click-to-select (Build Plan R-10, lines 76-79) reads while the element is hovered too. Cheap fixes: re-read when target.getAnimations() finishes. Mark a reading as 'while hovered' when a matched :hover rule applies (this needs A4's rule walk). For the Inspector, optionally put a pointer shield under the cursor so the page element returns to rest.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:750-759 and :776-777 (computed style reflects :hover, 'hover state included'), :412 (hover as a deliberate step), :294-298 (getAnimations covers transitions as well as animations); skills/1-ui-to-canvas-capture/SKILL.md:36-37

**Rocket today.** The highlight box and the bubble are pointer-events none (tools/rocket-inspector/content.js:36, :44), so the page element under the cursor is in :hover while fillBubble reads getComputedStyle and getBoundingClientRect (:451-453). The bubble reads once, 60ms after the cursor settles (:1527, :1543-1549), and again only on mouse movement (:1552-1561). The size row and the card's box line use the transformed rect (:453, :1418-1421), not layoutBox (:249-254). States are out of scope in the product (Architecture §5 lines 200-205).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** Verified in content.js: the box and bubble are pointer-events none (:36, :44), and swallow() (:1568-1573, :1605-1607) blocks only down/up/click events, so CSS :hover and the page's own hover handlers stay active. aimAt adopts after 60ms counted from ENTERING the element, not from settling (:1537-1549), and the first element is adopted with no wait (:1536). paint() re-reads on every mousemove (:859). The size comes from getBoundingClientRect (:452-453, :1418-1421). Rocket docs have no mention of this: Architecture:200-205 puts states out of product scope, and Decision-Verification Q11 is about flagging hover-overridden values, which is a different issue. Caveat on the 'pointer shield': it would un-hover the page, so hover-opened menus close and could no longer be inspected. That cost needs an owner call, so it is not a free fix.

**In the plan.** Architecture section 5, the paragraph after the states rule; Build Plan R-10. The Inspector itself is not changed.

#### A4 · Walk the stylesheets recursively to find the declaration behind a value (tokens, fallback fonts)

**Lesson.** When Rocket builds its already-planned matched-rule reading (Backlog:28, the variable behind a value; Backlog:31, the Fallback flag; the Plan's Phase 3 matched-rule resolution), the walk must recurse into every rule that holds cssRules (@layer, @media, @supports, @container, and nested style rules) and try/catch cross-origin sheets, because Tailwind v4 puts utilities inside @layer. canvas-capture's recursive walk (mjs:340-359) and its document.fonts status matching (:369-376) exist only to choose which @font-face files to download.

**Why it matters.** Tailwind v4, the version current shadcn projects ship, puts every utility inside @layer utilities, so a flat cssRules scan finds nothing on exactly Rotem's main stack. The matched declaration 'background-color: var(--color-primary)' names the token outright, where matching a hex against the theme guesses (two tokens can share a value). The same walk also answers 'is this auto?' (A8) and 'is a :hover rule active?' (A2). One caveat: a locally installed system font has no document.fonts entry, and that case must stay 'unknown', not 'fallback'.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:319-358 (recursive walk, cross-origin try/catch), :360-381 (document.fonts status matching), :750-755 (var(--token) resolves to nothing once replayed); skills/1-ui-to-canvas-capture/SKILL.md:123-129

**Rocket today.** The Inspector reads only getComputedStyle. fontName prints the first family in the stack whether or not it loaded (tools/rocket-inspector/content.js:230-234). The Backlog asks for both 'the variable behind a value, read from the matched rule' (project-os/Backlog.md:28) and a 'Fallback' flag (Backlog.md:31). The product labels values by matching them against theme-file values (Architecture §8 lines 337-339) and detects shared values for R-19 (Build Plan lines 138-145).

**Verdict.** adopt, medium effort, already in Rocket: yes.

**Skeptic's check.** The mechanics are accurate: the recursive walk, cross-origin try/catch, the flat-loop trap (SKILL.md:123-129) and loaded-font matching with normalised weight. One misread: mjs:750-755 does not say computed style loses var(--token). It says a raw var() or :hover-driven SVG attribute resolves to nothing once the stylesheet is gone, and the fix is to bake the computed value. canvas-capture never finds the declaration behind a value. The idea is already in Rocket: Backlog:28 and :31, Decisions 2026-08-27 Consequences (lines 103-105, 'walking the stylesheets it loaded'), and Plan.md ~234-236. So the only new thing here is the recursion trap. Extra trap: Tailwind v4 variants use native CSS nesting (&:hover inside @media (hover:hover)), so matching needs nested-rule handling beyond element.matches on flat selectors. The verifier's caveat stands: a system font has no FontFace entry (and document.fonts.check returns true for unknown families), so the flag must fall back to 'unknown'.

#### A5 · What paints the text is not always `color` or the DOM text: icon ligatures and text-fill-color

**Lesson.** What paints text is not always `color`. canvas-capture captures -webkit-text-fill-color (for a code-editor textarea) and font-feature-settings and font-variation-settings (for icon-ligature fonts) (mjs:112; SKILL.md:130-135, 209-216). The Inspector reads only color and calls any element with its own text 'text'. It should say 'Gradient text' when background-clip is text with a transparent color or fill, and should classify an icon-font span (by family, e.g. Material Symbols) as an icon, so R-20 never offers 'settings' as editable copy.

**Why it matters.** Gradient headings (background-clip:text with a transparent text fill) are common on startup landing pages. Today the bubble shows either an unpainted colour or 'Transparent', a text-colour control that edits color would change nothing visible, and the planned contrast row (Backlog.md:33) would compute nonsense. An icon ligature would pass R-20's search ('settings' is in the JSX) and be offered as editable text, where editing it swaps or breaks the icon. Two small checks: read webkitTextFillColor and backgroundClip and say 'Gradient text'; classify a loaded icon font or active liga as an icon, not text.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:112 (PROPS: fontFeatureSettings, fontVariationSettings, webkitTextFillColor), :319-326 (icon names are literal text), :1387-1391; skills/1-ui-to-canvas-capture/SKILL.md:130-135, :209-216

**Rocket today.** The text-colour row and the card's type line read only tcs.color (tools/rocket-inspector/content.js:480, :1454). kindOf calls any element with its own text 'text' (:100-105), so an icon span is text and its card quotes 'settings' as the element's words (:1394, :1411). The product decides whether text is editable by searching the project for that exact string (Architecture §5 lines 161-171; Build Plan R-20 lines 147-153).

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** The canvas-capture claims are exact. Gradient text is the verifier's own extension: canvas-capture lacks backgroundClip entirely. Rocket confirmed: the colour rows read tcs.color only (content.js:480, :1454), kindOf is at :100-105, and there is no text-fill, clip or ligature handling anywhere in the docs. Correction to the 'why': Tailwind's bg-clip-text text-transparent sets color: transparent, not the text-fill property. In that idiom a colour control WOULD change something: it paints solid text over the gradient. 'Changes nothing visible' holds only for the -webkit-text-fill-color idiom. 'Active liga' is a weak signal because ligatures are on by default, so detect by font family. Icon-ligature fonts are uncommon on shadcn/lucide stacks, which lowers priority.

#### A6 · Treat an icon or an embed as one unit, and report what actually paints it

**Lesson.** canvas-capture treats an `<svg>` as one unit, baking its live computed fill, stroke and dash onto every paintable node (mjs:743-800) and pinning its size and inlining `<use>` targets (:808-884). It treats canvas, iframe and video as opaque pictures (:888-908). The Inspector should promote a hover on SVG internals to the outer `<svg>`, show its fill and stroke with 'follows text colour' when they equal the computed color, and name Canvas and embeds.

**Why it matters.** Icon colour is one of a designer's most common requests, and today the Inspector never shows it. Rocket's 15 properties include text colour but no fill, so whether an icon's fill equals its computed color (currentColor) decides whether the text-colour control can recolour it at all. The panel needs that fact at selection time. Fix: promote a hover on SVG internals to the outer `<svg>`, show fill and stroke plus 'follows text colour' when they match, and name Canvas and Embed. For images, use currentSrc for the size row.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:743-748 (svg as one unit), :760-800 (computed fill and stroke regardless of source), :808-823 (pinned size), :824-884 (`<use>` resolution), :888-908 (canvas, iframe and video), :921-926 (currentSrc, naturalWidth and naturalHeight)

**Rocket today.** Hovering an icon lands on its `<path>`, which kindOf classes as a 'box' (tools/rocket-inspector/content.js:71, :100-105). The bubble then reads 'Path · No class' with a bounding size and no colour. Fill is read only to detect invisible cover layers (:1146-1155). IMAGE_TAGS has no IFRAME (:71), and the manifest's content_scripts entry has no all_frames (tools/rocket-inspector/manifest.json), so an embed is measured as a padded box. The Backlog asks for 'Canvas' (project-os/Backlog.md:27) and for natural against rendered image size (Backlog.md:36).

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** All the citations are accurate. Rocket today: IMAGE_TAGS includes SVG but not PATH or IFRAME (content.js:71). A hover on a stroke lands on `<path>` and reads as a 'box' (:100-105), and a hover between strokes lands on `<svg>`, which reads as an 'image'. Neither shows any colour. Fill is read only by isSvgCover (:1146-1155). The manifest has no all_frames. Partly already in Rocket: 'Canvas' is Backlog:27 and natural against rendered image size is Backlog:36. Icon colour and the path-to-svg promotion are new. Correction: 'use currentSrc for the size row' is muddled, because naturalWidth and naturalHeight already reflect the chosen currentSrc. Lucide icons are stroke=currentColor with fill none, so it is the stroke that should be compared to the color.

#### A7 · Measure the tree the browser lays out, not el.children: display:contents and shadow roots

**Lesson.** A display:contents parent has a 0×0 box, so any 'distance to the parent's edge' is meaningless (canvas-capture skips its margin geometry there, mjs:618-629). Open shadow roots and slots decide what actually renders (:675-702, :975-983). In the Inspector, drawOutward's walls and drawBands' child list should see through contents wrappers. In the product, a document-level preview rule cannot style elements inside a shadow root, so previews there need per-root injection or an honest 'cannot preview here'.

**Why it matters.** Under a display:contents parent, the top and left walls sit at the viewport origin, so the Inspector draws an outward band to the edge of the screen carrying a large wrong number. The real flex items inside a contents wrapper are dropped from the gap bands, which is worth checking against the 'missing 8px gaps' tab row (Backlog.md:25). On the product side, a document-level rule never crosses a shadow boundary. A preview on an element inside a web component would therefore silently do nothing, which is the failure the preview design calls 'product-killing'. It would need injection per shadow root (adoptedStyleSheets).

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:618-629 (display:contents has no box, bogus 320px margins on stateofjs.com), :675-702 and :975-983 (shadow root and slot flattening); skills/1-ui-to-canvas-capture/SKILL.md:196-208

**Rocket today.** drawOutward uses parent.getBoundingClientRect() as the wall (tools/rocket-inspector/content.js:816-819). drawBands keeps only el.children that have a non-zero rect (:728-738). visibleText walks childNodes (:1104). deepestAt and composedPath can target elements inside an open shadow root (:1204, :1556). The product's preview is a style rule injected at document level and keyed to a marker attribute (Architecture §5 lines 142-149).

**Verdict.** adopt, medium effort, already in Rocket: no.

**Skeptic's check.** The citations are accurate. Rocket confirmed: parent.getBoundingClientRect() as the wall (content.js:816-819), children with zero rects dropped (:728-738), and visibleText walking light-DOM childNodes only (:1104). Already handled: deepestAt steps into open shadow roots (:1204; History.md:245). The verifier's pointer to 'the missing 8px gaps tab row (Backlog.md:25)' is refuted: History.md:249 diagnosed it as a single-child span, not display:contents. Both cases (contents wrappers outside Astro, web components) are uncommon on React/Next/Tailwind startup sites, so this is low priority, but the shadow-root preview gap is a silent failure the preview design calls product-killing (Architecture:148-149).

#### C4 · Commit one Inspector QA harness instead of rebuilding probes every session

**Lesson.** canvas-capture shipped one shared verify script after at least 8 field runs each hand-wrote their own and hit the same two setup bugs: the package would not resolve outside the repo, and the proxy/TLS config was missing (verify-capture.mjs:1-18, 33-42; capture.md:48-54; commit 6ded0e4). Rocket's Inspector QA page (.tmp/class-copy-test.html, 'QA page v47'), its inliner (.tmp/mkqa.py) and the pane workarounds exist only in the gitignored .tmp/ folder. History rows keep re-recording the same pane quirks: a 0-by-0 window, an empty elementsFromPoint, stubbed viewport and clipboard, and a dispatched keydown (History.md:244, 250, 252, 255). With Rotem's go-ahead, commit the page, the inliner and the shims under tools/rocket-inspector/, with expected-versus-actual rows per fixture. It supplements the owner checklist for the real extension (QA.md:36) and does not replace it.

**Why it matters.** The QA page is already Rocket's regression suite, and it exists on one disk only, outside git. Move it, with the inliner and the pane shims (viewport stub, elementsFromPoint feed, clipboard recorder, key dispatch), into tools/rocket-inspector/qa/. Have it print expected versus actual bubble rows per fixture as a PASS/FAIL list. That becomes the project's first check, and no session has to re-learn the 0-by-0 pane. Per rule 18, this needs Rotem's go-ahead.

**Their evidence.** verify-capture.mjs:1-18, :33-42; capture.md:48-54; commit 6ded0e4

**Rocket today.** QA.md:36 says to drive the content script on a test page in the pane. The harness lives in gitignored scratch (.gitignore:1). .tmp/ holds about 27 probe pages, a 'QA page v47' (.tmp/class-copy-test.html) and an inliner (.tmp/mkqa.py). History rows rediscover the same pane quirks: the window measures 0 by 0 and elementsFromPoint is empty (History.md:244), the viewport had to be overridden (:250) or stubbed (:252), and the clipboard was stubbed with a keydown dispatched (:255). CLAUDE.md:40 records no checks.

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** All canvas-capture citations are literally accurate. Rocket side verified: .gitignore:1 is '.tmp/', 27 .html files sit in .tmp/, mkqa.py inlines content.js into qa-inline.html, and CLAUDE.md:40 says 'Checks: none yet'. No doc proposes committing the Inspector QA page; the Writing-Track fixtures at 2522-2591 are for the future engine. Caveats. (1) It runs in the pane browser, not as a CLI command, so calling it 'the project's first check' in the CLAUDE.md/Go commit sense needs a runner decision, which may bring a dependency. That is Rotem's call. (2) The pane shims fake the environment, so a pass proves logic, not the real extension. (3) Rule 21: the QA page looks synthetic (example.com, 'Build faster with Rocket'), but check it for reproduced client material before committing. (4) Under Backlog rules and rule 18, this is offered in chat, not added on Claude's own initiative.

### The session record and re-finding elements

#### A9 · Absent is not lost: lazy sections and transient layers need a 'waiting' state

**Lesson.** An element missing right after a reload is not necessarily lost. Lazy sections mount only on scroll (canvas-capture mjs:223-253; SKILL.md:156-161, 289-296), and tooltips and popovers live in body-level fixed layers that exist only after an interaction (mjs:1024-1033, and the hover step at :1394-1397). Rocket should record at selection time that an element sits in a portal or lazy region, keep its drafts 'waiting to appear', and let the existing re-mark watcher apply them on mount, rather than auto-scrolling.

**Why it matters.** Drafts on a below-the-fold lazy section, a modal, a dropdown or a closed tab panel are legitimately absent right after a reload. Flagging them as 'unfindable' is noise, and it invites the designer to redo work that is not lost. Reject their fix, because auto-scrolling acts on the client's app (invariant 2). Adapt the insight instead: record at selection time that an element sits in a portal or fixed layer, keep its drafts in a 'waiting to appear' state, and let the existing re-mark watcher re-apply them when the element mounts.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:223-253 (scroll-through, scrollHeight re-read each step), :1024-1033 (fixed floaters live outside the root, appended to body); skills/1-ui-to-canvas-capture/SKILL.md:156-161, :289-296

**Rocket today.** A draft that cannot be re-found after a reload is flagged, never dropped (Architecture §6 lines 252-258, invariant 4 lines 393-397; Build Plan R-22b line 174). A watcher re-marks elements the app re-creates (Architecture §5 lines 147-148).

**Verdict.** adapt, medium effort, already in Rocket: no.

**Skeptic's check.** The citations are accurate. Rocket today: an unfindable draft is flagged, never dropped (Architecture:252-258, 393-397; R-22b:174), with no distinction between absent and lost. Rejecting canvas-capture's auto-scroll is correct under invariant 2 (Architecture:386-387), since scrolling triggers the client's own fetches. Browser scroll restoration on reload partly mitigates this for the section the designer was on, but not for drafts elsewhere, or in modals and menus.

#### A10 · Add stable attribute handles to the fingerprint's key half

**Lesson.** canvas-capture's operator guidance ranks data-testid, aria-label, role and semantic tags above generated classes as identity that survives re-renders, and warns that a hidden duplicate silently wins querySelector (SKILL.md:64-74). Rocket's ID card already copies these attributes (content.js:1465-1471), but the fingerprint's stable key half (Architecture:264-266) does not. Adding them as weighted keys, excluding auto-generated ids, would help re-finds survive a wrapper Claude inserts.

**Why it matters.** The structural path is exactly what Claude disturbs when it adds a wrapper or splits a component, while a data-testid or role survives a restyle. Adding these handles, weighted, to the key half makes re-finding survive the most common restructure. Leave out auto-generated ids (React useId ':r1:', Radix 'radix-:R...'), since those change between renders.

**Their evidence.** skills/1-ui-to-canvas-capture/SKILL.md:64-68 (stable identity over generated classes), :69-74 (a hidden duplicate wins querySelector)

**Rocket today.** The stable half of the fingerprint is page, structural path, kind, sibling position and nearby words; classes are evidence only (Architecture §6 lines 260-277; Build Plan R-22b lines 172-173). Treating classes as volatile and 'a tie is a flag' already match their advice. The ID card already collects id, data-testid, aria-label, name and role (tools/rocket-inspector/content.js:1465-1471), but the stable half does not list them.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** The source is guidance for a human choosing capture selectors, not a re-find engine. The claim reports it faithfully. Partial precedent in Rocket: Decisions 2026-08-31 Consequences (lines 921-922) anticipated 'adding stable ids or data attributes' to the card, and History.md:204 added the attrs line. The product fingerprint key still lacks them. The hidden-duplicate warning maps onto Rocket's existing 'a tie is a flag' rule (Architecture:271-273). Caveat: aria-label can change when R-20 edits the visible words, so weight it below data-testid and role.

**Completeness pass.** Duplicate of B5, the same lesson and evidence (capture SKILL.md:64-74; content.js:1465-1471). Merge them, keeping B5's corrected statement and the caveat that aria-label should be weighted low.

#### B5 · Stable identity: move the ID card's semantic handles into the record's re-find key

**Lesson.** canvas-capture's own guide says to find elements by data-testid, aria-label and role rather than hashed classes, yet its output drops every one of them, which is why its identity problem stays unsolved. Rocket should add those handles (id, data-testid/data-test, aria-label, name, role, which the Inspector's ID card already reads) as weighted evidence in the fingerprint's stable half, not revive stamping.

**Why it matters.** Test ids and aria handles survive a restyle, and they are also what Claude searches the code for. The structural path is the part most likely to shift when Claude wraps an element. Adding them as weighted stable evidence costs one line in the fingerprint definition and uses code that already exists. Do not revive stamping.

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:63-65; skills/1-ui-to-canvas-capture/SKILL.md:64-68; skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:910-915, 1548-1560

**Rocket today.** Largely answered already: fingerprints split into a stable and a volatile half, with weighted matching and a refresh on every re-find (Architecture.md:260-277). But the stable half lists only page, structural path, kind, sibling position and nearby words (Architecture.md:263-266). The Inspector's ID card already reads id, data-testid, data-test, aria-label, name and role, plus the dev-build source file:line or component name (content.js:1273-1357, 1461-1471; Decisions.md:890-922). Stamping ids was built once and deleted as element labelling (Architecture.md:405-408).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** Accurate: SKILL.md(return):63-65; capture SKILL.md:64-68; ui-to-canvas-capture.mjs:910-915 and 1548-1560. Minor misses: render also emits rowspan (1559), and the node later gains geometry, alt, href, placeholder and type (916-930), but never id, class, data-* or aria. Rocket refs verified: stable half = page, path, kind, sibling position, nearby words (Architecture.md:263-266); ID card handles at content.js:1466-1470; sourceOf/componentOf at content.js:1273-1357; Decisions.md:921-922 already anticipated 'adding stable ids or data attributes' to the card. Correction: element labelling was designed and deleted, never built (Architecture.md:405-408; Plan.md:61-66). Caveat: aria-label can be text-derived and change with a text edit, so weight it below data-testid and id.

### Preview and text

#### B6 · 'Found in the project' is not 'rendered from there'

**Lesson.** canvas-capture says only the source that actually produced the page can tell a literal from live data, and Rocket already answers that for text with a project-wide exact-string search. The refinement worth taking: a hit in a test, mock, fixture, story or seed file is not proof that this page renders it from there. The engine should exclude those paths from the verdict and report a match count above one as 'appears in N places', all without revealing paths.

**Why it matters.** The search the doc calls 'decisive' has a false-positive class. The string sits in a mock, fixture, story or seed file, or in a prop default, while this page renders it from an API. The panel says 'confidence', Claude edits the mock, and only the landed check catches it a round later. The engine can close most of this without revealing paths: exclude test, mock, fixture and story files from the search, and show a match count above one as 'appears in N places'.

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:29-32, 43-45, 66-68

**Rocket today.** Rocket already answers this better for text. The engine searches the project for the exact string and returns a verdict and a count: found means 'editable with confidence', not found means live data, read-only (Architecture.md:161-175, 350-351; Build-Plan.md:147-153). Style values are labelled from the token files (Architecture.md:337-339).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** SKILL.md:29-32, 43-45 and 66-68 are accurate. Rocket core already has this (Architecture.md:161-175, 346-351; Build-Plan.md:147-153), and the engine already returns a count (Architecture.md:350-351). The mock/fixture false-positive class is the agent's own extension. It is not written in any Rocket doc: a grep for mock, fixture, story and seed in Architecture, Build-Plan and Decisions returned nothing. It fits the read-only engine, since the path filter stays inside the engine per the no-path API. The lesson's rocket_area 'preview' should be the text-editability search (R-20).

### The panel

#### A8 · Auto margins come back as numbers; show 'auto', not px

**Lesson.** Computed margins report `auto` as a used px value. canvas-capture saw an auto-centred container read 140px, or a stale 0px, and chose to bake geometry-derived px (mjs:580-642; SKILL.md:185-195). The Inspector bubble and card, and the future margin control, should show 'auto' when the matched rule says so, with a flagged heuristic fallback, so neither Claude nor a control hardcodes the px and breaks responsive centering.

**Why it matters.** Every mx-auto container, which on Tailwind sites is nearly every section, reads as 'Margin: L140, R140' at this viewport, and different numbers at other widths. Claude reading the card can hardcode the px. A future margin control would replace auto with a fixed number and break responsive centering. Landed checks at a different width would disagree. Their own fix bakes px, so copy the trap, not the fix: print 'auto' when the matched rule says so (A4). As a fallback, use equal non-zero side margins on a block narrower than its parent's content box.

**Their evidence.** skills/1-ui-to-canvas-capture/SKILL.md:185-195, :224-233; skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:580-642 (geometry-derived margin override and its scoping)

**Rocket today.** sidesLabel prints computed margins (tools/rocket-inspector/content.js:366-373) in the bubble (:491) and the card (:1422). Margin is one of the 15 editable properties (Architecture §5 lines 177-181).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** canvas-capture's own fix bakes px (mjs:639-640), so the verifier rightly says to copy the trap and not the fix. Rocket confirmed: sidesLabel (content.js:366-373) feeds the bubble for 'box' kinds only (:491) and the card always (:1422). Nothing about auto margins appears in any Rocket doc. 'Nearly every section' is overstated, but mx-auto containers and ml-auto push-right items are common. The fallback heuristic ('equal non-zero margins on a narrower block') would misfire on deliberate mx-8, so it must be shown as 'probably auto', not asserted.

#### D9 · Open decision 1 gains a second candidate tool: the Design canvas, reachable from Claude Code

**Lesson.** Anthropic's Design artifact type, the claude.ai/design editor, is an HTML canvas reachable from Claude Code, and canvas-capture publishes into it. That makes it one more candidate beside Figma for open decision 1, the panel design tool. Its availability is per account and unverified here, its size limits are undocumented, and the connected Figma MCP already covers design-to-code, so it is an option for Rotem, not a recommendation.

**Why it matters.** Once R-03's panel shell exists, designing the panel on an HTML canvas that Claude Code reads directly shortens the design-to-code step. Capturing Rocket's own shell is internal use, which the BSL grant allows. The costs are real. Its limits are undocumented: a board above about 2-3MB renders silently blank, and boards cap at 8000px (SKILL.md:331-338; capture.md:117-121). It has no Figma-style components or variables, and Rotem's fluency is in Figma. This is an option for his call, not a recommendation to switch.

**Their evidence.** README.md:38; .claude/commands/capture.md:100-105; skills/1-ui-to-canvas-capture/SKILL.md:257-265

**Rocket today.** The architecture leaves open 'Panel design time... in what tool? The Figma connection exists.' (notes/Rocket-Editor-Architecture.md:460-461). R-31 says 'in Figma if you want' (notes/Rocket-Editor-Build-Plan.md:242-245).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: README.md:38, capture.md:100-105, SKILL.md:257-265, SKILL.md:331-338, capture.md:117-121. 'Reachable from any Claude Code session' is overstated. capture.md:141 says claude.ai-hosted sessions, and artifact types are set per account. Rocket's open decision (Architecture.md:460-461) and R-31 (Build-Plan.md:242-245) name only Figma, so this is new but marginal. Capturing Rocket's own shell with canvas-capture means running BSL Node and Playwright code locally. That is allowed by the grant, but a designer can use the Design type directly without canvas-capture. The size ceilings do not matter for a small panel.

**Completeness pass.** This assumes canvas-capture runs on Rotem's machine, which is unverified. The image step runs multi-line `python3 -c` strings through the shell, with file paths interpolated into Python string literals (ui-to-canvas-capture.mjs:1238-1243, 1262-1280). On Windows, python3 is often absent or a Store stub, and a C:\Users path contains \U, which breaks a Python literal. The verifier builds `file://${absHtmlPath}` (verify-capture.mjs:55). The diagnostic assumes /opt/pw-browsers and `date +%s` (capture-diagnostic.md:9, 28). The repo names no OS anywhere, and all its hardening happened in the Claude Code on the web Linux sandbox (README.md:61). Rocket's own docs say Windows is the only target (Writing-Track.md:96). The Design type can also be used directly without canvas-capture.

### The handoff to Claude

#### B4 · The executor's rules travel inside each group handoff, not in an end-of-session checklist

**Lesson.** canvas-capture moved a rule agents kept skipping out of prose and into the tool output the agent acts on (a verdict field). Rocket should likewise attach the relevant executor-checklist items to each change inside the group handoff, such as 'text changed: check content and translation files' and 'local on a look-alike: create a variant, do not edit the definition'. Today the checklist ships only in the full end-of-session report.

**Why it matters.** Claude acts on the group block, so each checklist rule must sit on the change it applies to. Examples: 'text changed: check content and translation files, name the languages touched'; 'local on a look-alike: create a variant, do not edit the definition'; 'custom value, snap allowed'. Otherwise the rules live in a document the executor never receives mid-session.

**Their evidence.** skills/1-ui-to-canvas-capture/diff-screenshots.py:27-34, 117-121; .claude/commands/capture.md:56-61

**Rocket today.** The group is the primary handoff (Architecture.md:298-301) and carries one standing line, the untrusted-data caution (Architecture.md:120-123; Build-Plan.md:163-165). The executor checklist, including 'check whether edited text lives in content or translation files, and update languages deliberately', is specified for the full session report (Architecture.md:172-174, 303-305, 320-322), which the groups decision demoted to history (Decisions.md:841-842).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** diff-screenshots.py:27-34 and 117-121 and capture.md:56-61 are accurate. The verdict field came from commit 2f706e6, after a field report of 3.28% diff, 4 rounds and about 15 minutes. Rocket refs verified: standing untrusted-data line (Architecture.md:120-123; Build-Plan.md:163-165); checklist in the full report only (Architecture.md:172-174, 303-305, 320-322); demoted to history (Decisions.md:841-842). Partly present already: per-change intent, the custom mark and the uncertainty flags ('this value is shared by many elements') already travel in every group (Architecture.md:307-318), and the snap bit exists (Architecture.md:183-186). So the 'snap allowed' example is not new. Only the checklist items and the variant instruction are missing from the group block.

#### D7 · Have Claude report the real reach of an everywhere-change, since Rocket can only count one page

**Lesson.** Before writing a shared-component change, canvas-capture's Return asks a question that names the real reach ('used in N other places'), found by reading the source. Rocket already records local or everywhere at edit time and can count only copies on the current page. The part worth adapting is a line in the standing handoff asking Claude to report back, for each everywhere-change, which token or component it changed and how many places in the repo that reaches. For a 'just this one' change on repeated siblings, Claude should name the variant it created.

**Why it matters.** Keep the question out of the loop, because the designer already chose. Move the count into Claude's report-back instead. For every everywhere-change, name the token or component and how many places in the repo it reached. For 'just this one' on repeated siblings, name the variant that was created. Rotem then sees whether 'everywhere' meant 3 places or 40 while he is still working on that area, and the record gains a fact only the executor can prove.

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:42, 47-50

**Rocket today.** Intent is captured at edit time, local by default (project-os/Decisions.md:313-361; notes/Rocket-Editor-Architecture.md:183-198). That beats canvas-capture's ask-at-return, which comes after the designer's attention has moved on. But Rocket reads no components (Architecture.md:343-344), so its counts are page-local: 'shared, 12 on this page' (notes/Rocket-Editor-Build-Plan.md:209-211). The checklist only flags wide changes to the executor (Architecture.md:376-378; Build-Plan.md:237-240).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: canvas-to-ui SKILL.md:42 and 47-50. Rocket side confirmed: Decisions.md:313-361, Architecture.md:183-198 and 343-344, Build-Plan.md:209-211 ('shared, 12 on this page') and 237-240, Architecture.md:376-378. Architecture.md:279-283 already states the coverage honestly ('verified on this page, expected everywhere'). Nothing specifies what Claude's report-back contains (Architecture.md:364-368 says only 'reports back'), so this is new. It costs text only in the handoff and needs no read of components by Rocket. The count arrives after the code is written but before Rotem's push, which is still useful.

#### B3 · Count reach in the source, and ask only when it contradicts the recorded intent

**Lesson.** canvas-capture stops generation on a shared component and asks one question that names how far the change reaches in the source. Rocket already records the intent at edit time, and for local-on-a-look-alike it already tells the executor to create a variant. So the handoff needs only one standing stop-and-ask trigger: when Claude finds the change reaches beyond what the designer saw (other pages, other components), or cannot be isolated as a variant, Claude asks and names N and where.

**Why it matters.** Rocket already holds the intent, so it needs fewer questions than canvas-capture. Claude asks only when the source contradicts the intent, naming N and the pages: local intent but the only place to edit is a shared definition, or everywhere intent but the source reaches pages the designer never saw. The cost is one standing line in the handoff, and S-LOOP already scores 'needed a question' (Build-Plan.md:191).

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:33-35, 39-50

**Rocket today.** Scope is an edit-time intent, local by default (Decisions.md:335-340; Architecture.md:182-186). The panel warns about look-alikes on the page (Architecture.md:194-198) and can count 'shared, 12 on this page' (Build-Plan.md:209-211). The handoff only flags wide impact 'so the executor treats it with care' (Architecture.md:376-378); no rule says when Claude must stop and ask. The panel's reach is page-level: a component that appears once here but on thirty other pages looks like a one-off.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** SKILL.md:33-35 and 39-50 are quoted accurately. Rocket refs verified: Decisions.md:335-340 (local by default); Architecture.md:194-198 ('the executor must create a variant', which already answers the lesson's first trigger); Architecture.md:376-378 (wide impact only 'flagged... with care', and no ask rule); Build-Plan.md:191 (S-LOOP scores 'needed a question'). The page-level-reach point holds for components: R-25 and the twenty-cards warning are page-scoped, and Rocket does no component scan (Architecture.md:343). Shared token reach, though, comes from the token files (Architecture.md:337-339), so it is project-wide, not page-level. Fits the read-only engine: the question is Claude's to ask, in the handoff.

#### B8 · A bounded retry for an 'off' group, then a named leftover

**Lesson.** canvas-capture caps a real defect at one fix attempt and one re-check, then ships with the leftover named. Rocket has no rule for what follows an 'off' group. Offer one corrective handoff drafted from the named mismatch; if it is still off, stop and hand the choice to Rotem (fix by hand, accept as a deviation, or drop), with both attempts shown.

**Why it matters.** An off-then-resend loop is where the send-and-continue rhythm loses the designer's attention. One corrective resend drafted from the named mismatch, then escalation to Rotem with both attempts shown, keeps the loop bounded and gives S-LOOP a clean scoring rule.

**Their evidence.** .claude/commands/capture.md:56-61, 65-73

**Rocket today.** A group can turn 'off' with the mismatch named (Architecture.md:242-246; Build-Plan.md:183-186), but nothing says what happens next: resend, fix by hand, or accept.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** capture.md:65-73 is accurate. 56-61 is the verdict-field rule, not the retry cap. Origin correction: commit 997bb5a says the one-attempt cap (down from 'up to 3 rounds') came from Ofir's speed preference, '80% right in under a minute'. The field report with 4 rounds and 15 minutes drove the verdict field (2f706e6), not the cap. Rocket: 'off with the mismatch named' and nothing after it (Architecture.md:242-246; Build-Plan.md:183-186); a grep for resend and retry found nothing. Rotem already sees 'off' himself, so the escalation step is mostly about defining the corrective handoff and the end state.

#### B9 · Per-stack patch mechanics (their open problem 3)

**Lesson.** No new lesson. Both projects let an LLM with the repo open translate the change into the stack's own idiom, and Rocket already hands over token names, which canvas-capture cannot, because it bakes resolved values.

**Why it matters.** Neither project needs per-stack adapters while an LLM with the repo open does the writing. Handing over token names is an advantage canvas-capture cannot have, because its capture bakes resolved values (ui-to-canvas-capture.mjs:11-18, 580-583).

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:12-13, 69-72

**Rocket today.** Same answer, already decided. Three separate representations, with Claude translating the change into the project's own idiom when it writes (Architecture.md:151-155, 364-368). The framework is detected at attach (Architecture.md:340-341), and token names are handed over so the code references the token (Architecture.md:207-214).

**Verdict.** already-have, small effort, already in Rocket: yes.

**Skeptic's check.** SKILL.md:12-13 and 69-72 are accurate, as are ui-to-canvas-capture.mjs:11-18 and 580-583. Rocket refs verified: Architecture.md:151-155, 207-214, 340-341, 364-368. Correctly classed already-have.

#### C6 · State in the handoff what the executor decides alone, what it must stop for, and what happens after an 'off'

**Lesson.** capture.md tells the agent never to stop for a multiple-choice menu. It fixes environment snags and found defects, then reports its decisions at the end. Fix loops are capped at one attempt (it was up to 3), after which the agent publishes and names the leftover defect (capture.md:9-17, 66-73; commits 41476907, 997bb5a). Do not adopt the unconditional no-ask rule for Claude working on Rocket itself, because it conflicts with CLAUDE.md rule 18 and Conversations.md. For the handoff, add standing lines. Do not re-ask anything the panel already recorded (scope, exact or snap). Fix mechanical snags and report them. Stop only when a fingerprint matches no element or several, or when a just-this-one change needs a variant the project has no pattern for. End with a 'decisions I made' list. On Rocket's side, an 'off' group gets one follow-up handoff naming the mismatch, and after that it goes back to Rotem.

**Why it matters.** Put canvas-capture's split into the handoff's standing lines. Do not ask about anything Rotem already decided in the panel. Fix mechanical snags and report them. Stop only when a fingerprint matches no element or several, or when a just-this-one change needs a variant the project has no pattern for. End with a 'decisions I made' list. On Rocket's side, an 'off' group gets one re-send with the mismatch named, and a second 'off' goes to Rotem instead of into another loop.

**Their evidence.** capture.md:9-17; commit 41476907; capture.md:66-73; commit 997bb5a

**Rocket today.** For Claude working on Rocket itself, the unconditional form conflicts with Rotem's rules: CLAUDE.md rule 18 (a side effect is a question), Mistakes.md:20 ('you decided something that was Rotem's to decide'), and Conversations.md:210-212 and :398-402 (numbered options, each decision question with its context). Reject it there. In the Claude loop, Rotem's decisions already travel with each change, marked just-this-one or everywhere and exact or free to snap (Architecture.md:182-186), and S-LOOP counts 'needed a question' as a non-landing (Build-Plan R-23:191). But the handoff spec (Architecture.md:298-322, Build-Plan R-30:237-240) has no stop list, and nothing says what follows an 'off'.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** The citations are accurate, and the 8-character hash 41476907 is valid. Nuance: capture.md:15-17 still says the only stop points are 'in step 4 below', but step 4 no longer has any, so in practice nothing stops the run (see weakness 4). Rocket side: Architecture.md:120-123 already has one standing handoff line (page text is untrusted data), and :173-174 and :320-322 carry some executor checklist items. There is no stop list and no follow-up for 'off', which confirms the gap. One interpretive slip: R-23:191 lists 'needed a question' as a scored category, but the bar is 'land without manual hunting'. The docs never say a question counts as a non-landing. Rocket does not send anything itself (Rotem pastes from the clipboard), so the 're-send' is a follow-up handoff Rocket prepares, not an automatic retry.

#### D6 · Score S-LOOP on time per group and executor overhead, not only on landed

**Lesson.** canvas-capture added phase timing from real timestamps and an agent-overhead count (tool calls, redundant re-check rounds). It did so after finding that script timing hid the real bottleneck, a 3.28% diff re-checked for about 15 minutes. R-23 should also record, per group, the wall-clock time from send to landed and the executor's tool-call or round count. The lean pivot's own revisit trigger is the loop being 'too slow' (Decisions.md:794-795), and the group rhythm's trigger is interruption (Decisions.md:844-845).

**Why it matters.** A group that lands correctly after 12 minutes breaks the rhythm as surely as one that misses. Add two columns to the S-LOOP score, both from real timestamps: wall-clock time from send to landed, and executor tool calls or rounds. They cost almost nothing, and they are the numbers that decide the named revisit trigger, whether per-group sending 'interrupts more than it protects' (Decisions.md:844-845).

**Their evidence.** .claude/commands/capture-postmortem.md:39-51; .claude/commands/capture-diagnostic.md:9-11, 31-39; commit 68b993e; .claude/commands/capture.md:55-64

**Rocket today.** R-23 scores landed right, needed a question, missed, and agreement with auto-verification (notes/Rocket-Editor-Build-Plan.md:188-196). Nothing measures how long a group takes to land, although the send-and-continue rhythm rests on misses surfacing 'in minutes' (project-os/Decisions.md:825-827; notes/Rocket-Editor-Architecture.md:298-301).

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: capture-postmortem.md:39-51, capture-diagnostic.md:9-11 and 31-39, commit 68b993e ('script timing alone was missing the real bottleneck'), capture.md:55-64. The 3.28% run predates the PASS verdict field, so it had not 'already passed'. It was already inside the good-enough bar. R-23 (Build-Plan.md:188-196) scores landed, question, missed and agreement, with no time dimension. The lesson missed a stronger anchor: the lean-pivot decision names 'too slow' as a revisit trigger (Decisions.md:794-796), yet nothing measures speed. Process only, no code, fits every constraint.

**Completeness pass.** Duplicate of C5 (loop timing and executor overhead in S-LOOP). Merge them, keeping C5's corrected commit chronology and D6's anchor to the 'too slow' revisit trigger (Decisions.md:794-796).

### How we work

#### C9 · Pin exact versions, including the runtime, the day the engine's first code lands

**Lesson.** canvas-capture pins playwright exactly (1.56.1, no caret) with a lockfile, installs with plain 'npm install', checks all dependencies up front, and records versions in every diagnostic run (package.json:1-5, commit 73470e0, capture.md:19-36, capture-diagnostic.md:25-29). Node (a README floor of 18+) and Pillow are not pinned. Rocket's writing track already specifies exact pins and a startup assertion of the Node version (Writing-Track.md:561-566, 641-644), and CLAUDE.md pins the framework when the first code lands. What is new: tie the Node pin to the read-only wall. Re-run R-02's planted-write demo on every Node bump, starting with the Node 24→26 move planned for around November 2026 (Writing-Track.md:565-566, 2629), and record versions in each S-LOOP run.

**Why it matters.** For Rocket, version drift is a safety risk, not a speed one: a Node upgrade that changes permission-mode behavior could quietly weaken invariant 1. Pin exact dependency versions with a lockfile. Pin the Node version with an engines field plus a version file, and have boot refuse to start on a different major. Record the versions in every S-LOOP run.

**Their evidence.** package.json:1-5; commit 73470e0; capture.md:19-36; capture-diagnostic.md:25-29

**Rocket today.** There is no application code yet. CLAUDE.md says the framework is pinned when the first code lands, and Build-Plan R-01:22-25 lays the foundations. The read-only wall relies on Node's permission mode, disabled diagnostic writers and a zero-native-binaries boot check (Architecture.md:54-67). All of these depend on the runtime version.

**Verdict.** adopt, small effort, already in Rocket: yes.

**Skeptic's check.** The canvas-capture claims are accurate, including 'did not pin Node or Pillow': README.md:64 and 70 state only 'Node.js 18+', and capture.md:32 runs a bare 'pip install Pillow'. already_in_rocket=true: Writing-Track.md:561-563 ('Startup asserts the Node version and exits with a named message'), 641-644 (postcss 'pinned to an exact version' because offset semantics changed), and CLAUDE.md:22. Architecture.md:51-52 defers the wall recipe to the writing track. The lean architecture does not restate the Node assertion. The genuinely useful addition is the safety link: the permission-mode flag and its behavior have changed between Node majors, so each bump should re-prove invariant 1, not just keep the app running.

**Completeness pass.** Mostly already in Rocket: the Writing-Track sets exact pins and a Node version assertion (561-566, 641-644). canvas-capture's pin was a speed fix for one sandbox, and its own README.md:73 still gives the unpinned install, so it is weak evidence for Rocket's safety argument. The one new part, re-proving invariant 1 on every Node upgrade, is Rocket's own idea.

#### D10 · BSL 1.1: learn the techniques, copy no code

**Lesson.** canvas-capture is licensed BSL 1.1. Use and self-hosting are granted, but derivative works stay under the BSL, must display it, and may not be offered as a hosted or substantially similar service for a fee. Add one line to the Plan's licensing section: canvas-capture, BSL 1.1, techniques only, no code or prose. Copying started by the assistant is already barred by CLAUDE.md rule 21.

**Why it matters.** Rotem running canvas-capture for his own consulting is inside the grant. Copying its code, or its long explanatory comments, into Rocket would make those files BSL derivatives. That would matter the day Rocket is offered to anyone else, and 'substantially similar offering' is vague enough to invite a dispute. The findings themselves are techniques (wait for getAnimations, prefer stable attributes), free to re-implement from understanding. Add one line to the licensing section: canvas-capture, BSL 1.1, ideas only, no code, no prose.

**Their evidence.** LICENSE:5-14, 47-49, 52-53; README.md:101

**Rocket today.** notes/Rocket-Editor-Plan.md:371-378 ('check before vendoring') lists only MIT and Apache-2.0 sources. There is no rule for source-available licenses.

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: LICENSE:5-14, 31-34, 47-49 and 52-53, README.md:101. Plan.md:371-378 lists only MIT and Apache-2.0 sources, and grep finds no BSL or source-available rule anywhere. Partly covered already: CLAUDE.md rule 21 forbids the assistant carrying another project's code or content into this repo. The new line covers a deliberate vendoring decision by Rotem. The practical stakes are low, because Rocket's mechanism (a passive live helper) shares almost no code shape with a Playwright snapshot baker. The techniques themselves (settle waits, stable-attribute selectors, recursive rule walks) are free to reimplement.

### Strategy

#### D1 · Their three unsolved Return problems are what Rocket's design already solves: this supports Rocket's bet, not a pivot

**Lesson.** canvas-capture's Return is 72 lines of prose that no commit after the first has touched. It lists three open problems: durable element identity, telling literal text from live data, and per-stack patching (SKILL.md:61-72). Rocket's design covers the first two on paper, with stable-half fingerprints and a read-only project search, and hands the third to Claude exactly as canvas-capture does. So this supports Rocket's bet but solves nothing new, and none of it is proven before S-LOOP.

**Why it matters.** The core bets differ. canvas-capture bets that a pixel-faithful copy plus judgment at return is enough. Rocket bets that the live site plus a precise record of intent is what makes the return reliable. canvas-capture's own list of open problems argues for Rocket's bet. For Rotem's actual job, a client's logged-in localhost app, this is a different product and not a competitor.

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:12-13, 17-20, 52-53, 61-72; git log -- skills/2-canvas-to-ui returns only 438c338 (1 of 48 commits); skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:11-18

**Rocket today.** Stable-half fingerprints are the re-find keys (notes/Rocket-Editor-Architecture.md:260-277). Text editability comes from a read-only search of the project (Architecture.md:161-175). Landed / deviation / off comes from re-reading rendered values (Architecture.md:242-251). The project's idiom is left to Claude, guided by fingerprints (Architecture.md:362-378). The Inspector ID card already emits the stable handles id, data-testid, aria-label and role (tools/rocket-inspector/content.js:1465-1469), the same identity advice canvas-capture gives (skills/1-ui-to-canvas-capture/SKILL.md:64-68).

**Verdict.** already-have, small effort, already in Rocket: yes.

**Skeptic's check.** The cited lines check out: SKILL.md:12-13, 17-20, 52-53 and 61-72, and git log on skills/2-canvas-to-ui returns only 438c338. The Rocket references also check out: Architecture.md:161-175, 242-251, 260-277 and 362-378, and content.js:1465-1469. 'Already solves' overclaims, and 'addresses by design, unproven' is accurate. Per-stack patching is delegated to Claude in both products, so Rocket has no edge there. On identity the Inspector goes further than the lesson says: in dev builds the ID card prints the source file and line (content.js:1273-1305, 1461-1462) and the React component name (content.js:1327-1356, 1463-1464). That is exactly canvas-capture's unsolved 'map this element to that line'. The report deliberately never claims a file or line (Architecture.md:324-326), so this is Inspector-only.

#### D2 · The visual canvas is now a platform feature: restate the moat as what a snapshot canvas cannot do

**Lesson.** canvas-capture shows that a designer-facing visual canvas, Anthropic's Design artifact type, is reachable from Claude Code with a quickstart call plus two publish calls. So the market line 'none is built for a designer' (Decisions.md:772-774) needs a qualifier. What a snapshot canvas cannot supply is the live logged-in site, intent recorded at edit time, token names, and read-back verification. Carry out the watch-list item already requested (Decision-Verification-2026-08-30.md:368-371) and name the Design type and canvas-capture in it.

**Why it matters.** The 'none built for a designer' half of the market claim is weaker now: a designer-facing canvas ships inside Claude, and a wrapper for it takes about a day. The 'none records with fingerprints' half still holds. The lasting moat is the four things a snapshot canvas structurally cannot provide: the live logged-in site with real data, intent recorded at edit time (local/everywhere, exact/snap), token-first values, and read-back verification of the code change. The real threat is Anthropic, not this repo. If the Design type gains a live-URL mode and emits a change list, Rocket's margin shrinks to precision and verification. Add canvas-capture and the Design type to a watch-list line, and reword the market sentence.

**Their evidence.** README.md:38, 54, 63; .claude/commands/capture.md:92-105; skills/1-ui-to-canvas-capture/SKILL.md:257-265; git log (48 commits, author 'Claude `<noreply@anthropic.com>`' on all)

**Rocket today.** project-os/Decisions.md:772-774 puts the moat in the panel experience and report precision, citing a market scan that found only developer tools: 'none is built for a designer, and none records with fingerprints.' notes/Rocket-Editor-Plan.md:40-44 already calls the technology commodity. notes/Decision-Verification-2026-08-30.md:368-371 asked for a competitive watch-list line, and no such line exists yet.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** Confirmed: README.md:38, 54 and 63, capture.md:92-105, SKILL.md:257-265, and 48 commits all authored by 'Claude'. Minor error: it is quickstart, then a create publish, then a files publish (capture.md:100-139), not one call. Unsupported: 'a wrapper for it takes about a day'. The initial commit 438c338 already says the capture was 'hardened against 24+ real bugs' across Grafana, CoinMarketCap and others, so the work predates the 29-hour commit window. Artifact types are set per account. capture.md:141 claims only 'claude.ai-hosted sessions', so availability to Rotem is unverified. The watch-list recommendation is already written down as item 18 and was never executed; grep finds no watch-list line. The four moat items all already exist in the Architecture. The genuinely new part is naming the platform canvas and qualifying the market sentence. The Design canvas is also adjacent to, not inside, the 'overlay-to-agent' category that sentence describes.

**Completeness pass.** The 'platform commodity, act now' urgency rests partly on README claims, and the README contradicts the code in at least four places. README.md:36 says it 'never looks at a stylesheet', yet mjs:340-359 walks document.styleSheets. README.md:73 says `npm install playwright`, the exact command capture.md:24-31 warns causes the 300MB download drift. README.md:53 allows 'up to a few rounds', while capture.md:69-72 allows one. README.md:22-23 promises 'verified... every time', while diff-screenshots.py:59 passes anything under an 8% diff and mjs:1741-1777 crops large pages without telling the user. Availability of the Design type is also per account. The moat analysis stands; the urgency is not verified.

#### D3 · Snapshot baking destroys the design system, so token-first is a moat worth showing early

**Lesson.** Baking computed style turns every token into a raw rgb or px value, and the Return has no rule for mapping one back, so a snapshot edit loses which token the designer meant. Rocket already records system values by name (Architecture.md:207-214, 355-360), and the open Backlog item (Backlog.md:28) would show the token in the Inspector today. Its priority is Rotem's call.

**Why it matters.** A client engineer will see this difference in the diff: raw hex on one side, token names on the other. It is the most visible advantage a snapshot tool can never match. The cheapest place to demonstrate it before the panel exists is the open Backlog item. Its priority is Rotem's call.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:11-18, 85-123; skills/1-ui-to-canvas-capture/SKILL.md:18-22, 311-329; skills/2-canvas-to-ui/SKILL.md:39-59 (no token rule anywhere)

**Rocket today.** Design-system values come first and are recorded by name, so Claude writes the token (notes/Rocket-Editor-Architecture.md:207-214). The inventory is merged over framework defaults (Architecture.md:355-360). An open Backlog item has the Inspector show the variable behind a value, e.g. '#2D41D7 · --primary' (project-os/Backlog.md:28).

**Verdict.** already-have, small effort, already in Rocket: yes.

**Skeptic's check.** Confirmed: mjs:11-18 and 85-123, SKILL.md:18-22 and 311-329, and no token rule at canvas-to-ui SKILL.md:39-59. Nit: the PROPS list is now about 96 entries, not about 80. 'Can never match' is too strong. A Return agent reading the source can often reverse-map an rgb value to a token by lookup. What is lost is the choice itself: which of two same-valued tokens was meant, and whether it was token or custom. Missed transferable techniques for this Backlog item: canvas-capture's recursive walk into @media, @supports and @layer rules (mjs:328-359, SKILL.md:123-129). Finding the rule that declares var(--x) needs that walk, because Tailwind v4 puts utilities inside @layer. Cross-origin sheets throw on read (mjs:358). Its document.fonts status filter (mjs:369-373) is the exact read Backlog.md:31 (flag 'Fallback') needs. The Inspector reads no stylesheets or fonts today (grep of content.js).

#### D4 · Test the hard half first: a paper S-LOOP using today's ID card

**Lesson.** None of canvas-capture's 47 later commits touched the Return, so its edit-to-code bet was never measured. Rocket's equivalent bet, S-LOOP (R-23), sits behind 24 build tasks. A paper S-LOOP could run now: ten hand-written changes, each an Inspector ID card with its file: and comp: lines removed plus one design-language line, sent to Claude Code in three or four groups and scored against R-23's pre-fixed bar. It tests fingerprints plus design language early. It cannot test re-finding or auto-verification, and reordering the plan is Rotem's call.

**Why it matters.** canvas-capture shows how a project drifts into polishing the demoable half while its core bet stays unmeasured. Rocket can measure most of its bet now with no new code. Take ten changes on a calibration repo. Write each as an Inspector ID card plus one design-language line (property, old value, new value, intent). Send them in three or four groups to Claude Code and score them against R-23's pre-fixed bar: 9 of 10 land, zero wrong elements. This does not test re-finding after a reload or auto-verification. It does test whether fingerprints plus design language land edits, which is the result that could reorder the plan. Reordering is Rotem's call.

**Their evidence.** git log -- skills/2-canvas-to-ui (only 438c338); skills/1-ui-to-canvas-capture/SKILL.md:53-399 (findings 1-40); skills/2-canvas-to-ui/SKILL.md:12-13, 61-72

**Rocket today.** The architecture calls S-LOOP 'the core one' (notes/Rocket-Editor-Architecture.md:448), but it sits as R-23, after 22 build tasks (notes/Rocket-Editor-Build-Plan.md:188-196). The only built tool, the Inspector, has had repeated polish passes (project-os/Backlog.md:25-36, with History rows from 2026-08-31 to 09-06) and already copies an ID card for Claude (tools/rocket-inspector/content.js:1392-1470).

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** '47 of 48 commits went into capture fidelity' is loose. Many later commits are README, publish-path, license or process changes. What holds is that zero touched the Return. The 'drift' reading is interpretation. The Return is script-free 'on purpose' (SKILL.md:12-13), and the effort gap predates the repo (438c338 message). R-23 is preceded by R-01 to R-22 plus R-22b and R-22c, which makes 24 tasks, not 22. Decisions.md:2026-08-31 shows the ID card was built to hand Claude an element, so informal use already happens, but no early measured run is written down anywhere (grep S-LOOP/R-23). A key missing caveat: the card's file: line (React _debugSource) and comp: line carry more than the product report will, since the report never claims a file (Architecture.md:324-326). Run as-is, the card inflates the score. Run with and without those lines, and the result also answers S-LOOP's own question, 'What fingerprint makes the difference?' (Architecture.md:448).

**Completeness pass.** 'Measure most of its bet now with no new code' overclaims. The ID card is not the report format: it carries file: and comp: lines the report forbids (Architecture.md:324-326), and it has no old-to-new design-language line and no intent. A paper run cannot test re-finding, the split between stable and volatile fingerprints, group suggestion, or landed verification. A pass would mostly measure Claude plus the ID card, and could reassure falsely.

## Refuted as a claim, kept as our own idea (3)

The skeptic found that canvas-capture does not do what the reader said, but the
idea stands on its own merits for Rocket.

### B1 · Check that a local change stayed local: re-read the look-alikes, not only the target

**Lesson.** canvas-capture names the shared-component spread as its top return failure and requires rendering and comparing before calling an edit returned, but it has no check that a local edit stayed local. Rocket can add one read-only: when a local group is sent, snapshot the same property on its look-alike set, re-read it after the landing, and report 'landed, but also changed N others on this page' (and, for everywhere intent, confirm the others moved).

**Why it matters.** The most likely wrong landing for a local change is Claude editing the component definition. The target then lands exactly, the group turns 'landed', and nineteen sibling cards changed with it. Snapshot the same property on the look-alike set when the group is sent, re-read it after the reload, and report 'landed, but spread to 19 others'. The run the other way confirms that an everywhere change really moved the others. It is read-only and per element, not a pixel score.

**Their evidence.** skills/2-canvas-to-ui/SKILL.md:25-28, 52-53; skills/1-ui-to-canvas-capture/diff-screenshots.py:101-112

**Rocket today.** R-22c compares only the edited elements' changed properties against the approved values (Build-Plan.md:179-186; Architecture.md:242-251). Invariant 5, 'a typed value stays local unless everywhere is chosen' (Architecture.md:398-399), is enforced in the panel only; nothing checks that Claude's code honoured it. The inputs already exist: the twenty-identical-cards set (Architecture.md:194-198) and the same-value set, 'shared, 12 on this page' (Build-Plan.md:209-211, R-25). Theme groups are verified only on the visible elements (Architecture.md:279-283).

**Verdict.** adapt, medium effort, already in Rocket: no.

**Skeptic's check.** SKILL.md:25-28 and 52-53 are accurate (failure mode named, generic verify-before-done). The diff-screenshots.py:101-112 part is misattributed. That tool is capture-side: it compares the capture against the live page, it is never wired into Return, and on PASS capture.md:62-64 forbids looking at the bands, while the 8% threshold can hide exactly this kind of spread. The stay-local check is the agent's own extension, not something canvas-capture does. Rocket refs verified: R-22c compares only the edited elements (Build-Plan.md:179-186; Architecture.md:242-251); invariant 5 (Architecture.md:398-399); twenty-cards warning (Architecture.md:194-198); R-25 is page-scoped (Build-Plan.md:209-211); theme groups verified on visible elements only (Architecture.md:279-283). No post-landing spread check exists anywhere. The Writing-Track's affected-instance highlight (Writing-Track.md:918, 1385) is a pre-write preview, not a verification. Constraints: the look-alike set needs its own stable keys captured at send time so it can be re-found after the reload, and coverage is this page only.

**In the plan.** Architecture section 6, "A just this one change is also checked for spread"; Build Plan R-22c.

### C5 · Measure the loop's time and the agent's overhead from real timestamps

**Lesson.** canvas-capture added a diagnostic variant that timestamps each phase with date +%s and writes 'not measured' rather than guessing (capture-diagnostic.md:9-11, 31-42). It also added a postmortem that rebuilds a fixed-format report from a past conversation, and later an AGENT OVERHEAD section: tool-call count, re-reads, verify rounds that fixed nothing, and time spent waiting versus reasoning (capture-postmortem.md:13-17, 39-51). The 300MB browser download and the late Pillow crash were found by reproducing earlier free-form reports, in the same commit that introduced the diagnostic. For Rocket, S-LOOP should also score each group's sent-to-landed time from Rocket's own timestamps. It should also count Claude's tool calls and questions per group, taken from the Claude Code session, with the latency bar fixed before the run.

**Why it matters.** If a group takes Claude eight minutes to land, the send-and-continue rhythm fails even at ten of ten landed. Add to the S-LOOP scorecard, fixed before the run: sent-to-landed time per group, taken from Rocket's own record and not from Claude's recollection, plus Claude's tool-call count and questions asked per group.

**Their evidence.** capture-diagnostic.md:9-11, :31-42; capture-postmortem.md:13-17, :39-51; commits 68b993e and 73470e0

**Rocket today.** The product promises that a miss surfaces 'in minutes, not hours' (Architecture.md:300-301) and that Rotem keeps designing while Claude works on the group he sent (:234-240). Yet S-LOOP scores only landed, question, missed and agreement with his eyes (Architecture.md:448; Build-Plan R-23:188-196). Latency is never measured. The record already carries a timestamp per change (Architecture.md:317).

**Verdict.** adopt, small effort, already in Rocket: no.

**Skeptic's check.** The causal claim 'That is how they learned...' is wrong on the commit order. 73470e0 (09:40) diagnosed the 300MB download and Pillow crash 'confirmed live by reproducing it' and introduced capture-diagnostic.md in that same commit. The postmortem came at 09:43, and AGENT OVERHEAD at 10:25 (68b993e), whose message frames agent overhead as a hypothesis ('may be the actual bottleneck'). The rest of what_they_do is accurate. Rocket: no latency metric anywhere (no hits for latency or turnaround). Architecture.md:300-301 promises misses in minutes, and :317 records timestamps. Caveats. (1) Rocket's 'landed' timestamp is when Rocket noticed the landing, which depends on the verification trigger and on Rotem being on that page, so it overstates Claude's time unless the trigger is prompt. (2) The tool-call and question counts come from Claude Code's transcript, not from Rocket's record, and that fits the one-day S-LOOP spike.

### C8 · When a promoted prose rule is broken again, turn it into a check a tool performs

**Lesson.** diff-screenshots.py emits a verdict field that is itself the instruction, so the agent does not re-judge the raw number (lines 27-34, 117-121; capture.md:55-64). The cited premise does not hold up: the claim is that an 8% rule already in capture.md's prose was skimmed. But 997bb5a says step 3 had no numeric threshold before it, and 2f706e6 landed 5.5 minutes later. For Rocket the lesson stands on its own merits. A slip that recurs after its rule is written can get a mechanical guard where a fact can be checked, such as a History row for every commit, with Rotem approving any hook. Judgment rules stay in prose, and a guard should check a fact, never forbid further looking.

**Why it matters.** Rocket's own docs are long (Conversations.md 503 lines, Decisions.md 963), so skimming is the expected failure. Add a third rung to Mistakes.md: a slip that recurs after promotion gets a mechanical guard wherever one is possible, such as a pre-commit check that History gained a row, or a hook that refuses a dev-server start. Judgment rules like 'ask Rotem' stay in prose.

**Their evidence.** commit 2f706e6 message; diff-screenshots.py:27-34, :117-121; capture.md:55-61

**Rocket today.** Mistakes.md:9-13 and :42-53 promote a repeated slip into a rule in a prose file, and the ladder stops there. Mistakes.md:71-73 shows prose rules re-broken: long replies a second time, and building from a discussion twice in one day. The verification gate is a checkbox the agent ticks for itself (Workflow.md:161-175), and QA.md:64-71 fixes a vocabulary the agent also writes itself.

**Verdict.** adapt, small effort, already in Rocket: no.

**Skeptic's check.** The commit history contradicts the story. 997bb5a (10:34:30) says 'The old step 3 had no numeric threshold at all', and the capture.md before it has no threshold text. 2f706e6 (10:39:58) then says a 3.28% run burned 15 minutes 'despite' that threshold already being in the prose. No 15-minute run fits in a 5.5-minute window. The more likely reading is that the same incident drove both commits, and the 'prose failed' story is after-the-fact. The verdict-field mechanism itself is real. Rocket side: Mistakes.md:9-13 and 42-53 do end at a prose rule. Of Mistakes.md:71-73, only row 73 shows an existing prose ceiling broken again. Row 72 is two slips before any rule existed, so the claim that it shows 'prose rules re-broken' is half right. Rocket has no hooks (no .claude/settings.json hooks, no git hooks). Caveats: a Claude Code hook or git hook is persistent config and needs Rotem's explicit approval. canvas-capture's own mechanical hard stop created weakness 1 (PASS forbids looking), so guards should check facts, not cut off inspection.

**Completeness pass.** The premise is contradicted by the commit timeline: 997bb5a says step 3 had no numeric threshold, and 2f706e6, 5.5 minutes later, says a prose threshold was skimmed. What remains is generic advice about mechanical guards, which Rocket's Mistakes ladder already approaches, and hooks are persistent config that need Rotem's approval. canvas-capture's own mechanical hard stop is also what created its blind spot (capture.md:62-64 forbids any further look after a PASS).

## Rejected for Rocket (2)

### B10 · Editing a baked snapshot instead of the live page

**Lesson.** Reject the snapshot model. Editing a baked copy loses live data, states, identity and token names before the edit starts. Its one transferable principle, keep editing free and put judgment on the return side, is already Rocket's 'nothing blocked' rule.

**Why it matters.** The snapshot is what makes their return step hard: live data, states, identity and token names are gone before the edit starts. The one principle that transfers, keep editing free, Rocket already has ('nothing blocked'; a local variant is 'never allowed to look free').

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:11-24, 904-907; skills/1-ui-to-canvas-capture/SKILL.md:388-399; .claude/commands/capture.md:117-135; skills/2-canvas-to-ui/SKILL.md:55-59

**Rocket today.** Rocket previews on the running site through injected rules that survive re-renders (Architecture.md:134-149). Editing is never blocked and custom values are marked (Architecture.md:207-214; Decisions.md:188-233). Hover and focus are stated as out of scope (Architecture.md:200-205).

**Verdict.** reject, large effort, already in Rocket: yes.

**Skeptic's check.** Evidence is accurate: mjs:11-24 and 904-907; capture SKILL.md:388-399 (a looping CSS animation freezes at an arbitrary frame; JS carousels remain unresolved); capture.md:117-135 (8000px cap, ~1.8MB auto-crop); return SKILL.md:55-59. Rocket refs verified: Architecture.md:134-149, 194-198, 200-205, 207-214; Decisions.md:188-233. Snapshot editing contradicts Rocket's live-site model.

### D5 · A snapshot canvas as an optional sketchpad for the structural requests Rocket scopes out

**Lesson.** canvas-capture's canvas allows free drag and resize, and its Return has no rule for a moved element, so it offers no path from a structural edit to code. It cannot serve as a sketchpad for Rocket's out-of-scope structural requests on Rotem's real targets. It opens a fresh logged-out headless context, is set up to run in a cloud sandbox, and uploads the whole page to claude.ai. At most it is a personal side-tool for public pages, worth revisiting only if S-SCOPE shows structural requests matter.

**Why it matters.** Suppose S-SCOPE shows real requests include layout moves, such as reordering sections or turning a row into a grid. Then a pixel-faithful HTML sketch that Claude can read is a better attachment to a not-previewed described change than words or a Figma mock. It must live outside Rocket. The pipeline writes files and drives a headless browser that clicks the page, which breaks invariants 1 and 2 (Architecture.md:382-387). It also uploads the whole page to claude.ai (weakness W3). The sketch carries intent only, never a change list, and Rocket cannot verify it by read-back. Decide only after S-SCOPE.

**Their evidence.** README.md:38; skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:62-69; skills/1-ui-to-canvas-capture/SKILL.md:29-38; skills/2-canvas-to-ui/SKILL.md:39-45

**Rocket today.** Structural editing is out of scope: 'nothing moves, is added or is deleted' (notes/Rocket-Editor-Writing-Track.md:184-186; notes/Rocket-Editor-Plan.md:366). Hover states are out too, with a words-only escape hatch: a request typed in words rides along as 'a described change, clearly marked as not previewed' (notes/Rocket-Editor-Architecture.md:200-205). S-SCOPE measures what share of real requests the panel can express (Architecture.md:449; Build-Plan.md:198-202).

**Verdict.** adapt, medium effort, already in Rocket: no.

**Skeptic's check.** Confirmed: README.md:38, mjs:62-69, SKILL.md:29-38, canvas-to-ui SKILL.md:39-45. Rocket side confirmed: Writing-Track.md:184-186 and Plan.md:366 (structural out of scope), Architecture.md:200-205 and 449. The described-change hatch at Architecture.md:200-205 is written for state requests, not structural ones. Applicability fails on Rocket's own terms. Client apps are logged-in localhost dev servers, and the capture has no storageState, no cookie import and no typing steps (mjs:157-164, 410-414). The default setup targets a Claude Code on the web sandbox (README.md:61, capture-diagnostic.md:28), which cannot reach Rotem's localhost. Pointing a clicking headless browser at a client dev app also breaks the reasoning behind invariant 2 (Architecture.md:107-110), even outside Rocket. And an edited snapshot of a client screen goes to claude.ai.

## Found by the completeness pass (6, not separately verified)

### E1 · S-PREVIEW must test the couplings: four-sided values, and properties that paint nothing on their own

**Lesson.** They found that Anthropic's own Design editor binds its Radius field to the border-radius shorthand only. Corners set through longhands read back as 0 in that field, and the first edit through it writes border-radius:0, squaring corners that were rounded. So they emit the shorthand only when all four corners are known. Their pruning pass also notes two things. When a side's border-style computes to none, the browser forces that side's computed width to 0 whatever was declared, so width and colour mean nothing there. And inline boxes have no horizontal auto margins and a scrollHeight of 0.

**Why it matters.** Three common cases would preview wrong, or preview nothing. First, a single radius control on a shadcn button-group item (rounded-r-none), or on a card with rounded-t-lg, would also round the corners meant to stay square. That is one control moving values the designer never touched, which is the spirit of invariant 5. Second, one padding value over px-4 py-2 overwrites both axes. Third, border width or colour on an element whose border-style is none paints nothing; none is the default outside Tailwind's preflight. The landed check would then read 0 and call the group off. Add these cases to the R-12 test matrix, and write the rule into R-14 and R-18: edit each side or corner separately when they differ, and when there is no border, say so or set the style together with the width, recorded as part of the change. Two more cases belong to the same class (my extension): gap on an element that is neither flex nor grid, and width or height on an inline box.

**Their evidence.** skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:1352-1361 (Radius field bound to the shorthand; the first edit squares the corners), :1457-1460 and :1513-1518 (border-style none forces width 0), :625-629 and :961-969 (inline boxes); skills/1-ui-to-canvas-capture/SKILL.md:323-327

**Rocket today.** The fifteen properties are named as single values (notes/Rocket-Editor-Architecture.md:177-182). R-12, the S-PREVIEW spike, tests only 'values the project never used' (notes/Rocket-Editor-Build-Plan.md:90-93). R-14 and R-18 (Build-Plan.md:108-111, 132-136) say nothing about sides, corners or border style. The Inspector already reads each side and each corner, and treats a border as absent unless width, style and colour all paint (tools/rocket-inspector/content.js:259-291, 297-320; History.md:104). So the reading knowledge exists; the control and preview rules do not.

**Verdict.** adopt, small effort, as proposed; no skeptic checked it.

### E2 · R-20's exact-string search will refuse real copy, because rendered text is not source text

**Lesson.** The capture learned that DOM text and what the eye reads are different things. Whitespace-only text nodes between inline elements collapse to one space, except in pre contexts, where they are real newlines and indentation. Case can come from text-transform, which they keep as a style, separate from the text they read through textContent. Text painted by ::before or ::after (content: attr(...)) exists in no DOM node. Icon-ligature text is literal words.

**Why it matters.** The page side is collapsed; the source side is not. Prettier wraps long JSX text across indented lines, which JSX renders as single spaces. Next's default ESLint config flags a bare apostrophe, so codebases write Don&apos;t or {"'"}. {" "} separators, &nbsp;, CRLF line endings in Windows checkouts, and CSS uppercase all break an exact match too. Each one produces a confident 'live data, read-only' verdict on a heading or paragraph that is plainly in the code, and that is the most common text edit. The fix: inside the engine, normalize both sides the same way. Collapse whitespace, decode HTML and JSX entities, compare DOM text rather than innerText so text-transform does not change the case, and allow for text split across inline tags. Report 'not found as written' instead of treating a miss as proof of live data. Pseudo-element text and ligature icons need their own verdicts; the ligature case overlaps A5. canvas-capture shows only the page-side half; the source-side cases are my extension.

**Their evidence.** ui-to-canvas-capture.mjs:704-733 (whitespace collapse vs pre contexts), :97 and :706 (textTransform kept as a style; text read from textContent), :645-673 (pseudo-element text from content/attr()), :319-326 (ligature icon names); skills/1-ui-to-canvas-capture/SKILL.md:217-223 (finding 23)

**Rocket today.** R-20 decides whether text is editable by searching the project for 'that exact string'. Found means editable; not found means live data, read-only (notes/Rocket-Editor-Architecture.md:161-171; Build-Plan.md:147-153). The only false negative it names is a translated string with a name inserted (Architecture.md:167-168). The Inspector's visibleText collapses whitespace and puts a space between children (tools/rocket-inspector/content.js:1097-1115). No doc says how page text and source text are normalized before they are compared.

**Verdict.** adapt, small effort, as proposed; no skeptic checked it.

**In the plan.** Architecture section 5, the text search paragraph; Build Plan R-20.

### E3 · Backlog 'hand the hover to a single child': count text siblings, not just element children

**Lesson.** Their only-child rule first looked at element siblings and broke at once. An icon right after a link's own text (`<a>`text`<i>`icon`</i>``</a>`) has no element sibling, so it passed as a lone child and was pushed away from its text. They now count every child node except whitespace-only text. They also state the general rule: any 'is this the only thing here' check must consider every kind of node a DOM element can have as a sibling.

**Why it matters.** The obvious implementation, el.children.length === 1, would pass the hover from a button or link to its icon whenever the label is a bare text node next to it (`<button>``<Icon/>` Save`</button>`, `<a>`Docs `<svg/>``</a>`). That describes most icon buttons on a lucide/shadcn site. The Inspector would then show and copy the icon's card for what the designer sees as a button. Define 'single child' as exactly one non-whitespace child node with no painted ::before or ::after, and treat display:contents wrappers as transparent (the A7 trap).

**Their evidence.** ui-to-canvas-capture.mjs:601-617 (soleContent built from childNodes, whitespace-only text excluded); skills/1-ui-to-canvas-capture/SKILL.md:224-233 (finding 24)

**Rocket today.** project-os/Backlog.md:25 proposes passing the hover from a wrapper that holds a single child to that child; History.md:249 is the owner's tab-row case. The Inspector's child logic reads el.children only (tools/rocket-inspector/content.js:728-738). hasOwnText exists (content.js:112-117) but is not used in any single-child test.

**Verdict.** adopt, small effort, as proposed; no skeptic checked it.

### E4 · The backdrop behind text is a stack of painted layers, not the ancestor chain (Backlog contrast ratio)

**Lesson.** Two sites broke the same way: the hero's colourful background was a separate layer at a very negative z-index, or a background `<video>`, never a background on one of the text's ancestors. A dark site's page colour was declared once, high up on body or html, so a fragment rooted lower down lost it.

**Why it matters.** White text on a dark photo, gradient or video hero would read as about 1:1 and be flagged as failing, and the bands would draw in the light theme over a dark hero. In a dark-mode app, text nested more than 12 levels deep falls through to white, because shadcn puts bg-background on body. Before building Backlog 33, take the layer under the text from elementsFromPoint (content.js:1235 already calls it). When that layer paints an image or a gradient, say 'over image' or 'over video' instead of giving a ratio. Blend semi-transparent layers, and drop the depth cap in favour of checking body, then html. Fix backdropOf at the same time, because the band theme has the same bug.

**Their evidence.** ui-to-canvas-capture.mjs:1581-1591 (decorative hero layer at a negative z-index; apple.com and octoverse.github.com), :888-903 (background video on the same sites); skills/1-ui-to-canvas-capture/SKILL.md:339-348 (finding 35, page colour declared once on body/html)

**Rocket today.** backdropOf walks at most 12 ancestors for the first non-transparent background-color and otherwise returns white (tools/rocket-inspector/content.js:379-387). It ignores background-image, gradients, semi-transparent colours and sibling layers, and it already decides the band theme (content.js:725). pageTheme reads only body and html (content.js:1308-1322). The open contrast-ratio item needs a backdrop (project-os/Backlog.md:33).

**Verdict.** adopt, small effort, as proposed; no skeptic checked it.

### E5 · Verify a change only at the width and theme it was recorded under

**Lesson.** The verifier's header says it reuses the capture's exact launch config. In fact it drops the flag that hides automation, and the navigator.webdriver and Supabase init scripts. The capture's own comments record a site that serves detectable automation a different page, so the 'live' reference can be a different page from the one captured. The README promises the comparison happens 'at the same viewport width'.

**Why it matters.** Send-and-continue means Rotem is often at another width preset or theme when a group lands. Suppose Claude correctly writes a change as md:p-8: re-read at 390 wide, it shows the base padding and the group turns off. A dark-mode token re-read in light mode shows the light value. Both are false alarms caused by Rocket, not by Claude. Compare only when the frame's width preset and mode match the recorded ones, and otherwise hold the change as 'waiting to verify at 1440 · dark'. Switching Rocket's own frame is not acting on the client app, so the panel can offer it as one click.

**Their evidence.** skills/1-ui-to-canvas-capture/verify-capture.mjs:11-13, :33-42 and :68 (claims identical config; launches with only --ignore-certificate-errors plus the UA) vs ui-to-canvas-capture.mjs:142-146, :147-164 (a bot-detection branch served a different page) and :166-173; README.md:53

**Rocket today.** Every change records its preview width and light or dark mode, for the executor (notes/Rocket-Editor-Architecture.md:188-192), and the frame has width presets (Build-Plan.md:49-51). R-22c re-reads after the reload and marks the group landed or off (Build-Plan.md:179-186; Architecture.md:242-250), with no rule that the frame must match the recorded conditions. Theme groups are verified on whatever is visible (Architecture.md:279-283).

**Verdict.** adapt, small effort, as proposed; no skeptic checked it.

### E6 · Know the record's storage ceiling before the record reaches it

**Lesson.** The Design type has an undocumented size ceiling of 2 to 3MB per artboard. Above it, publishing reports success but the canvas is blank, with no error; the 8000px height cap also clamps without a warning. They found the ceiling by bisection. They now measure bytes before every publish against a 1.8MB budget, well under the ceiling, and warn loudly whenever they have to cut the page.

**Why it matters.** If R-13 picks localStorage, the cap is about 5MB per origin, shared by every client's sessions. Each change stores verbatim class strings, DOM paths, nearby words, and old and new values, so months of engagements can fill it, and a full store throws on write. Unless every write is awaited and checked, invariant 4 fails silently at the worst moment. Pick IndexedDB in R-13, confirm an edit only after its transaction commits, and show usage from navigator.storage.estimate(). Let a size budget raise the retention question (open decision 2) long before the quota is reached.

**Their evidence.** skills/1-ui-to-canvas-capture/SKILL.md:331-338 (finding 34); ui-to-canvas-capture.mjs:1612-1625 (the budget), :1741-1777 (measure, crop, warn); .claude/commands/capture.md:117-121 (8000px clamp)

**Rocket today.** The record lives in browser storage, with a one-click backup (notes/Rocket-Editor-Architecture.md:218-228). Every client shares one fixed origin (Architecture.md:82-86, 285-289). Retention is an open decision and nothing deletes itself (Architecture.md:462-463). Invariant 4 requires each write to land before the panel confirms it (Architecture.md:393-397). No doc names the storage API or its quota: a grep of notes/ and Decisions.md for IndexedDB, localStorage and quota finds nothing.

**Verdict.** adopt, small effort, as proposed; no skeptic checked it.

## Where canvas-capture is weak

**Tokens, authored units and intent are erased by design.** This confirms Rocket's 'design-system values first, recorded by name' rule (Architecture §5 lines 207-214). A record that holds only computed values would give Rocket the same unsolved return problem canvas-capture has, so the record must keep token names, 'auto' and the viewport width.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:11-18 (reads computed style only), :750-759 (var(--token) replaced by a baked literal), :85-123 (px width and height on every element), :639-640 (auto margin baked as px), :78 (one viewport width)

**No identity survives into the output, so the return trip is matching by eye.** Rocket's fingerprints and the ID card's file and component detection (tools/rocket-inspector/content.js:1273-1357) are its real advantage over this repo. That is where to keep investing.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:1548-1559 (only style, href, src, alt, placeholder, type, colspan and rowspan are emitted), :446 and :905-906 (stamps written onto the live page only, never exported); skills/2-canvas-to-ui/SKILL.md:17-20, :63-65 ('stable identity across an edit ... not yet solved')

**Patch on patch over root causes nobody confirmed.** Borrow their trap list as test cases for Rocket's Visual QA on the calibration projects, not their fixes. Reproduce each trap in Rocket's live context before building anything for it.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:465-488 (a 'style engine vs compositor desync' theory from single observations), :580-642 (a geometry margin override that needed two follow-up patches, :601-613 and :618-629); skills/1-ui-to-canvas-capture/SKILL.md:349-353 (an open finding with no root cause), :388-399 (JS carousels unresolved)

**The curated property list misses common startup-site effects.** Gradient text and line-clamped card text would capture wrong there. For Rocket, the gradient-text case goes straight into the text-colour reading (lesson A5). Line clamp matters for R-20 text edits inside clamped paragraphs.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:85-123 (PROPS has no backgroundClip, webkitLineClamp, backdropFilter, outline or aspectRatio; webkitTextFillColor was added for a textarea only)

**Stability checks scan the whole document over and over.** That is acceptable for an offline batch job and unusable inside a live page the designer is working in. Rocket's settle gate (A1) must be scoped to the group's own elements and use cheap signals: el.getAnimations(), document.fonts.status, two reads of a few values.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:489-510 (every element times about 90 properties, sampled up to 5 times at 400ms intervals), :270-278 (getComputedStyle on every element on each spinner poll)

**It reads by changing the page.** Rocket's helper is passive (Architecture §10 invariant 2, lines 386-387), so none of these 'make the page hold still' techniques carry over. Rocket gets stability by waiting and re-reading, and the Inspector must stay read-only.

Evidence: skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:147-164 (spoofed user agent, navigator.webdriver forced false), :166-173 (a window.supabase stub for one site inside a generic tool), :236-252 (scrolls the whole page), :317 (pauses every animation with a global !important rule), :1085-1101 (seeks videos)

**The capture throws away every identity handle the return step needs.** Confirms that reading identity on the live page is the right call. The practical rule: no stage between the click and the handoff may drop a handle the executor searches by. The Inspector has them; the record's stable key should too (B5).

Evidence: ui-to-canvas-capture.mjs:910-915 (a node keeps only tag, style and children) and 1548-1560 (render emits only style, href, src, alt, placeholder, type, colspan); compare skills/1-ui-to-canvas-capture/SKILL.md:64-68 (find elements by data-testid, aria, role) and skills/2-canvas-to-ui/SKILL.md:63-65 (identity 'not yet solved').

**No change record: the return step starts from an edited file, not a list of changes.** An edit reaches their executor as a diff of resolved px and rgb values with no intent attached. Rocket's design-language record of old and new values, intent, and width and theme conditions (Architecture.md:188-192, 307-318) is the real advantage; keep it the load-bearing artifact.

Evidence: skills/2-canvas-to-ui/SKILL.md:37-59 has no step for learning what changed. The only baseline is the pre-edit Main.dc.html in a scratch dir (capture.md:38-39), where every element is just a baked style attribute (ui-to-canvas-capture.mjs:1548).

**Resolved values erase where a value comes from.** A canvas edit can only return literals. Rocket's system-first token reads (Architecture.md:207-214, 337-339) are structurally ahead. This raises the value of the open Backlog row 'show the variable behind a value' (Backlog.md:28), since the handoff would carry the token and not a hex.

Evidence: ui-to-canvas-capture.mjs:11-18 (bake the browser's computed style, never the source rules) and 580-583 (computedOf copies raw getComputedStyle values), so var(--primary) becomes a hex. SKILL.md:66-68 admits origin cannot be recovered from output.

**The return step has never met a real edit.** The return trip is the unproven half of both products. Rocket's S-LOOP, with a pass bar fixed before the run (Build-Plan.md:188-196), is the right counterweight; Inspector polish should not push it back. Also keep the policy on when to ask explicit per phase: the preview never asks, and the handoff asks when the source contradicts the intent (B3).

Evidence: git log -- skills/2-canvas-to-ui returns only 438c338, the 2026-09-22 initial commit. 30 of 48 commits and all nine field reports (6ded0e4) are capture-side. No command drives the return step: capture.md ends at publishing, and SKILL.md:401-405 defers to the ruleset. capture.md:9-18 also forbids asking the person questions, while the ruleset requires one (SKILL.md:47-50), and nothing reconciles the two.

**A page-wide pass threshold can wave through a local miss.** A speed-first aggregate score is fine for a capture preview but not for proving that code landed. Keep R-22c per change and per property, and never let a page-level similarity score stand in for the landed verdict.

Evidence: diff-screenshots.py:54-59 (GOOD_ENOUGH_THRESHOLD = 8.0 percent of pixels) and capture.md:62-64 (on PASS, do not open the heatmap or the worst bands). On a 1440x4000 page, 8 percent is about 460k pixels, several whole cards.

**The snapshot freezes one moment: states, media, long pages and live data are gone before the edit.** Rocket's live preview avoids all of this. Its honest gap is the same one: hover and focus are not previewed (Architecture.md:200-205), while canvas-capture can at least freeze one scripted hover state. That is not a reason to snapshot.

Evidence: ui-to-canvas-capture.mjs:904-907 (canvas, iframe and video become flat screenshots); skills/1-ui-to-canvas-capture/SKILL.md:388-399 (JS-driven carousels capture an arbitrary frame, unresolved); capture.md:117-135 (8000px board cap; the ~2MB ceiling crops the bottom of the page); ui-to-canvas-capture.mjs:62-69 (hover and click states only through scripted pre-steps).

**A PASS can certify a page with parts missing.** A combined score with a hard stop is only as good as its coverage. Rocket's verdicts should stay per change, and a group reads landed only when every change in it was re-found and read. The S-LOOP zero-wrong-element bar must stay a separate hard bar, never folded into the nine of ten.

Evidence: diff-screenshots.py:72-81 compares only the top region the two screenshots share. Its comment at :74-77 says capture.md checks height separately, but capture.md:44-90 contains no height comparison. verify-capture.mjs:94-100 prints both heights without judging them. The auto-crop (capture.md:125-135) produces a shorter capture that then passes. The 8% bar (diff-screenshots.py:59) lets a missing region under 8% of the pixels pass, and capture.md:62-64 forbids looking further after a PASS.

**Speed deleted the guard against a known blind spot.** When Rocket trims verification for speed, keep a cheap independent control for each documented blind spot, such as R-22c's planted sabotage, and run it routinely rather than only after a complaint.

Evidence: Commit 997bb5a deleted the step telling the agent to open the published canvas and look at it whole once, and replaced it with advice that the problem is rare and not worth looking for (capture.md:77-79). The strict-parser failure (capture.md:80-90) has no automated check either, only a triage hint for after a user complains.

**Thresholds were tuned on the same runs they grade.** Rocket's pre-registered S-LOOP bar (Architecture.md:448) is the better discipline. Extend it to the landed-comparison tolerances: set them before the calibration runs and do not adjust them from those runs.

Evidence: diff-screenshots.py:49-51 ('picked empirically'), :54-58 ('Confirmed across many verified-good captures this session'); commit 997bb5a ('0.4%-5% on clean runs this session'); a single known-defect test (commit 87fc1fe).

**The instructions drifted out of sync with themselves.** This confirms Rocket's one-rule-one-home rule (Workflow.md:239-241) and the cross-link check for process changes (QA.md:35). When a section is rewritten, search for every reference into it.

Evidence: capture.md:16 still says the only stop points are 'in step 4 below', but commits 33196d3 and 84575dd removed them from step 4. diff-screenshots.py:74-77 points at a height check capture.md does not contain. The verdict rule is written twice (capture.md:55-64 and diff-screenshots.py:27-34). capture.md takes 146 lines for five steps, mostly war stories.

**Knowledge moves by hand, from throwaway sessions and self-reports.** S-LOOP and later loop metrics should come from Rocket's own record (timestamps, verdicts), not from Claude's recollection. Fixes found while working in a client repo still land in Rocket's repo with a History row, and in the BugAtlas once repeated.

Evidence: Commit 6ded0e4 says the fixes were 'root-caused and fixed live in an ephemeral session with no push access, so the fix existed nowhere until now'. capture-postmortem.md:5-7 and :48-51 rebuild numbers from chat history and accept an 'impression' for the time split. capture-postmortem.md:9-11 asks for plain text so the owner can paste it into another chat.

**Instructions were written to argue an agent past a safety refusal.** Rocket's handoff quotes text from the client's page and goes to an agent that can write files. It must never carry 'this is safe, run it' reassurance. When the executor balks, the fix is a sanctioned route, not persuasion. Keep the standing line that page text is untrusted data (Architecture.md:114-124).

Evidence: Commit ab5b2fd added a paragraph arguing it was safe to search the filesystem for a scavenged bundled script and run it, after an agent refused because the request looked like an injection. That route then failed on temporary session state and was replaced by the official Design artifact route (commits 33196d3 and 84575dd).

**Verifier addition: commit narratives are not reliable evidence.** Found during verification. canvas-capture's commit messages sometimes contradict the history. 997bb5a says no threshold existed before it, and 2f706e6, 5.5 minutes later, says an agent skimmed past that threshold. 73470e0 reports the 300MB-download root cause in the same commit that introduces the diagnostic, which is later credited with finding it. Treat these messages as after-the-fact accounts. Lessons that rest only on a commit story (C5, C8) need the mechanism to stand on its own.

**Verifier addition: verification has no 'could not verify' path and a less settled live side.** verify-capture.mjs:69-72 keeps going after a failed navigation, and :73-75 only warns on a non-2xx status. The live-page render waits for networkidle, fonts and a scroll-through, but not for getAnimations() to drain, and it does not pause animations as the capture does. So the two sides are settled differently, and a comparison the tool could not make still comes out as PASS or INVESTIGATE, never as 'not verified'. This supports C3's Rocket recommendation, but as a gap in canvas-capture, not a practice copied from it.

**The Return half is a ruleset with no code and no field evidence.** No prior art exists here for the edit-to-code half. Rocket's S-LOOP would be the first real measurement: nothing to borrow, and no competitive pressure from this repo on Rocket's core.

Evidence: skills/2-canvas-to-ui/SKILL.md:12-13 ('no script for this skill on purpose') and 61-72 (identity, value origin and per-stack patching all open); git log -- skills/2-canvas-to-ui shows only the initial commit 438c338

**Reaches logged-out public pages only.** Login surviving inside the frame (R-06, the S-A spike, Build-Plan.md:54-58) is a real differentiator for client dashboards with real data. It is worth proving early, because it is exactly what a snapshot cannot do.

Evidence: ui-to-canvas-capture.mjs:157-173 (a fresh headless context, with Supabase auth stubbed to session null) and 62-69 (steps are click/hover/wait/group only, with no typing, so no sign-in). Every field report is a public site: skills/1-ui-to-canvas-capture/SKILL.md:234-243 (plausible.io), 331-337 (linear.app), 358-359 (coinmarketcap), 374-377 (apple.com)

**Anti-bot evasion, TLS bypass, and a whole-page upload to claude.ai.** Unfit to point at a client's app without telling the client. Rocket's passive helper and text-only clipboard handoff (Architecture.md:107-132) are its trust story. The disclosure draft (R-29) should say plainly what leaves the machine: quoted interface text only, never page images. If Rotem ever uses a snapshot tool on client work, the disclosure must name it.

Evidence: ui-to-canvas-capture.mjs:142-164 (--ignore-certificate-errors, navigator.webdriver faked to false, a spoofed desktop UA); .claude/commands/capture.md:112-116, 136-140 and README.md:52-54 (every text, image and font of the page published as a claude.ai artifact)

**Fidelity is 'good enough', not exact, and pages are cropped when too big.** A snapshot is never a source of truth for values. Rocket's exact per-property preview (S-PREVIEW, R-12) and value read-back are the right precision bar, and any snapshot use (D5, D9) is for sketches only.

Evidence: diff-screenshots.py:54-59, 117-121 (an 8% pixel diff passes); .claude/commands/capture.md:44-73, 117-135; ui-to-canvas-capture.mjs:1625, 1740-1779 (above 1.8MB the page height is cut from the bottom; stderr warns, the canvas does not); 8000px board cap

**Built on an undocumented platform format that changed three times in a day.** Rocket's local app plus a Markdown handoff over the clipboard is insulated from platform churn. Anything Rocket ever builds on Artifact types should stay optional and never sit on the core loop.

Evidence: Commits 4147690, ab5b2fd, 33196d3, 84575dd: from scavenging seed-canvas.mjs out of a skill's cache, to an opportunistic wrap, to the official Design type. skills/1-ui-to-canvas-capture/SKILL.md:257-265, 331-338 (a 2-3MB ceiling found only by bisection, failing as a silent blank canvas), 374-382

Skeptic: does not hold as stated. As titled, this is wrong. The repo's own publish mechanism changed, not the platform format. Between 11:53 and 12:48 UTC on 22 Sep (ab5b2fd, 33196d3, 84575dd) it went from running a seed-canvas.mjs scavenged from a skill's cache, to an optional wrap, to the documented Design artifact type. 4147690 is about not stopping for menus, not publishing. The surviving weakness is that the final path depends on undocumented Design-type limits found by bisection. A single artboard between 2 and 3MB silently renders blank, and heights over 8000px are silently clamped (SKILL.md:331-338, capture.md:117-135). The meaning for Rocket still holds: keep any artifact-type use optional and off the core loop.

**No record of what changed, and no intent.** Rocket's durable record in design language, with intent bits and stable fingerprints (Architecture.md:216-331), is the part the platform does not provide. Protect it from scope cuts; it is the moat.

Evidence: skills/2-canvas-to-ui/SKILL.md:17-20 (elements have 'no memory of where it came from') and 63-66 (a durable id is 'not yet solved'); skills/1-ui-to-canvas-capture/SKILL.md:311-313 (about 80 baked properties per element). The Return must find the edits inside a whole edited file, with no local/everywhere or exact/snap intent recorded.

**Summary claim: capture side 'built in about 29 hours' from 40 field findings.** Skeptic: does not hold as stated. The 48 commits do span about 28h43m (2026-09-22 06:38 to 2026-09-23 11:21 UTC). But the first commit, 438c338, already shipped a 243-line SKILL.md and says the capture was 'hardened against 24+ real bugs' across Grafana, CoinMarketCap, Yahoo and Google Finance, Angular Material, Vue, Web Components and Chart.js. Most findings predate the repo. So the 29-hour window measures the public iteration, not the build, and 'a wrapper for it takes about a day' (D2) does not follow.

## Not covered by the readers

- .gitignore: not cited by any reader. Nothing load-bearing (node_modules, logs, .DS_Store). Together with /opt/pw-browsers it points to a macOS author and a Linux sandbox runtime; no Windows path appears anywhere in the repo.
- package-lock.json: not cited. It confirms the exact playwright 1.56.1 pin with only an engines floor of node>=18, which fits C9.
- skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:1140-1335: the download and image pipeline was not covered by any reader. It spoofs Referer and Origin to pass hotlink checks (1140-1152). It fetches image and font URLs chosen by the page from Node, with no host allow-list (1186, 1311). It runs multi-line `python3 -c` strings with interpolated file paths through the shell (1238-1243, 1262-1280), which is the Windows problem noted under D9.
- skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:1526-1560: output escaping was not covered. escapeHtml does not escape quotes, yet it fills double-quoted attributes (1552, 1555). href and type are emitted raw (1549, 1556). Raw SVG outerHTML is inlined verbatim (885, 1538), relying on the Design canvas's sanitizer (736-741, 826-833). Rocket already renders page strings as text (Architecture.md:118-119; content.js:421), so this is already-have, not a lesson.
- skills/1-ui-to-canvas-capture/ui-to-canvas-capture.mjs:400-453 and :989-995: the group step learned that moving an element changes its container-query result, so computed style is only true in the element's real position. Rocket never moves elements, so there is no lesson.
- S-A (authenticated pages): no file addresses it. Capture and verify both open fresh non-persistent pages with no storageState and no cookie import (ui-to-canvas-capture.mjs:157-161; verify-capture.mjs:54, 68). A typical login redirect ends in a 200, so the non-2xx check (mjs:194-210) would capture the login page. Nothing here informs S-A.
- README.md: no reader compared its promises against the code. See the D2 and D9 entries (README.md:36 vs mjs:340-359; README.md:73 vs capture.md:24-31; README.md:53 vs capture.md:69-72; README.md:22-23 vs diff-screenshots.py:59 and mjs:1741-1777). Also skills/1-ui-to-canvas-capture/SKILL.md:35 still says the default viewport is 390px, while the code defaults to 1440 (mjs:78).
