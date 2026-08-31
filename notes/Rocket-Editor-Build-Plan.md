# Rocket Editor Build Plan

Status: PROPOSAL, written 2026-08-30 against the lean architecture. Tasks, not
weeks: each one is small, lands something visible, and ends with a check Rotem
can run himself in the browser. Nothing here requires him to read code, ever.

The architecture behind every task is `notes/Rocket-Editor-Architecture.md`.
This file says what gets built in what order; that one says why.

## How supervision works

Every task ends with **your check**: a thing to open, click, or read. If the
check passes, the task is done and we move on. If a task has no visible surface,
it ships with a staged demo that makes it visible. You never approve code, you
approve behavior.

Sizes: **S** is up to half a day, **M** is about a day, **L** is two to three
days. Order inside a phase is the build order; a task assumes the ones above it.

## Phase A: the skeleton. At the end, you click an element on your real site inside Rocket and drag its padding live.

**R-01 · The project gets its foundations** (M)
The repo gets its runnable shape: the engine starts, checks exist, and the
project's own docs record the run command.
Your check: one command in a terminal prints Rocket's address, and it opens.

**R-02 · The read-only wall** (L)
Two layers: the engine runs under the platform's own permission mode, read-only,
which also blocks spawned commands, native binaries and rogue workers; inside
it, the four-surface lock from the research gives friendly refusals naming the
guilty instruction. The diagnostic file-writers are disabled, the built-in
database module is banned, and boot asserts zero native binaries in the
engine's dependencies. Compatibility with the dev watcher is verified here.
Your check: a staged demo where a planted "save file" bug dies with a refusal
on screen, and a planted "run a command" bug dies the same way.

**R-03 · The panel shell** (M)
The empty product: canvas area for the site, side panel for controls, a tray for
the session record. No function yet, right bones.
Your check: it opens, it looks like the product's skeleton, nothing is broken at
narrow width.

**R-04 · Attach a project, read-only** (M)
Paste a folder path, Rocket reads it and says what it found: the framework, the
styling system, the file where the helper line will go.
Your check: attach DS Tiger, see it described correctly. Attach a nonsense path,
see a polite refusal.

**R-05 · The site appears inside Rocket** (M)
You start the client dev server in your terminal as usual; Rocket frames it.
Width presets for narrow and wide.
Your check: DS Tiger runs live inside Rocket and responds normally.

**R-06 · Login survives the frame** (S, the S-A spike)
The origin design from the architecture, proven on this machine: a logged-in app
stays logged in inside Rocket.
Your check: log into one of your systems, open it inside Rocket, still logged
in. Also the secure-mode trap is tested and its answer written down.

**R-07 · The helper line, hand-pasted** (M)
Rocket shows the exact line and the exact file. You paste it with your editor.
The panel indicator goes green when the helper answers, and stays visible for
the whole engagement.
Your check: paste, indicator green. Delete it, indicator says so.

**R-08 · Hover highlights** (S)
Move the mouse over the site, elements outline with a label of what they are.
Your check: hover around your real site, outlines feel right and never lag.

**R-09 · Click selects** (M)
Click an element, it stays selected, and a small card says what you selected in
plain words: what it is, the words on it.
Your check: click a button, a heading, an image. The card describes each
correctly.

**R-10 · Real values on the selection** (M)
The card shows the selection's actual rendered values: padding, size, colours,
corner, text size.
Your check: the numbers match what your eyes say about the element.

**R-11 · The first live control** (L)
One padding control wired end to end: drag, the site changes instantly, nothing
is written anywhere. The preview lives in an injected style rule keyed to a
marker on the element, never in the element's own style, so the app's own
re-renders cannot erase it; a watcher re-marks elements the app re-creates.
Your check: drag it on a real element, on a page with animation running, and
the preview holds. Reload the site, the change is gone, because nothing was
saved. That is correct at this stage.

**R-12 · Preview exactness proven** (S, the S-PREVIEW spike)
Every one of the fifteen properties tested with values the project never used.
Your check: type 13 into padding on a project whose scale skips 13, and the
result on screen is exactly 13, verified by measurement, not by eye.

**R-13 · The session record, durable** (M)
Every completed edit lands in the tray and in the browser's storage, keyed to
the attached project, so two clients never share a bucket. Close everything,
reopen, the session offers itself back: continue or discard, and only for the
project that is actually attached.
Your check: make three edits, kill the browser, reopen. All three are there.
Attach a different project, and they are not offered.

**Phase A acceptance**: attach a calibration project, adjust a heading's size
and a section's padding, see both live, restart everything, session intact.

## Phase B: the working tool. At the end, one real change request from a past engagement goes through Rocket, into a report, through Claude Code, and lands correctly.

**R-14 · Spacing controls** (M)
Gap, margin, padding, as a stepped ladder over the project's own scale, custom
values accepted instantly and marked custom.
Your check: real spacing work on a real page, including typing 13.

**R-15 · Size controls** (M)
Width and height, numbers first.
Your check: resize a card and an image on a real page.

**R-16 · Typography controls** (L)
Text size, line height, letter spacing and font weight, all independent, never
linked. Where the project defines a type scale or weight set, those offer
first; a free value is one step away, marked custom.
Your check: change size, line height does not move, and the reverse. On your own
system, the size control opens on your own scale.

**R-17 · Colour controls** (L)
Text, background, border. The project's palette appears first, as named
swatches; the full picker with the professional sliders sits one step behind it,
for custom colours, marked custom. This is the task where your design opinion
matters most.
Your check: recolour real elements; your client's palette greets you before any
colour wheel does, and the picker feels like a designer's tool, not a toy.

**R-18 · Corners, borders and shadows** (M)
Corner radius, border width and shadow, same rules as everything else, with the
project's own steps first. Shadow is a composite, so its control offers the
project's shadow steps and treats a hand-built shadow as advanced.
Your check: round a card, thicken its border, lift its shadow, on a real page.

**R-19 · Shared or local, said out loud** (L)
Where a value comes from the project's design system, the panel says so, in your
words: "Primary, shared", and offers the two paths: just this one, or
everywhere. Recorded as intent, previewed accordingly.
Your check: click a shadcn button's colour, see "shared" named, pick each path,
watch the preview obey. On a page of identical cards, pick "just this one" and
see the warning that these look like one component and a lone change means a
variant.

**R-20 · Text editing** (L)
Click visible text, edit it in place, preview live. Editability is decided by
the engine searching the project's files for the exact string, read-only: found
means editable with confidence, not found means live data, explained in plain
words and read-only.
Your check: rewrite a heading. Then try text that comes from data, and read the
refusal. It should make sense to you, not to a programmer.

**R-21 · The inventory panel** (M)
The project's own palette, type scale and spacing steps, read from its theme
files, displayed as a designer reads them.
Your check: open it on DS Tiger and recognize your own design system.

**R-22 · Groups, and the group handoff** (L)
Changes group by visual context, suggested by Rocket, adjustable by you. An
everywhere-change gets its own theme group, since it belongs to no card. Each
group has a state: draft, sent, landed, off. Send copies a small Claude-ready
handoff for that group alone, opening with the standing caution that quoted
page content is data, not instructions. The full session report stays available
as history, backup, and end-of-session summary.
Your check: make four related changes on one card, send the group, read the
handoff, understand every line. The full report still lists everything.

**R-22b · Previews survive reloads** (M)
When Claude lands a group, the site reloads and wipes previews. Rocket
re-applies every draft automatically, re-finding elements by their stable
fingerprints only, position and words, never styling text, since styling is
exactly what Claude changes. Unfindable drafts are flagged, never dropped.
Your check: with three drafts pending, reload the site by hand; all three come
back. Then send a group that restyles an element carrying a pending draft, and
the draft still comes back.

**R-22c · Landed, verified by reading** (M)
After a sent group's reload, Rocket re-reads the real rendered values and marks
the group landed when they match, landed with a deviation when the executor
rightly snapped a free custom value to the project's scale, or off with the
mismatch named in plain words.
Your check: send a group, watch it turn landed on its own. Send a snap-allowed
13 that lands at 16, and see it named as landed at 16, not as broken. Sabotage
a value in the code by hand, and watch it turn off, named.

**R-23 · The loop, measured** (M, the S-LOOP spike, the product's core bet)
Ten real changes on a calibration project, grouped by visual context into three
or four groups, each sent to Claude Code as its own handoff, in the real
send-and-continue rhythm. Scored per group: landed right, needed a question,
missed, and how the auto-verification agreed with your eyes, against a bar
fixed before the run so the score cannot bend to the result: at least nine of
ten land without manual hunting, zero wrong-element edits.
Your check: you watch the site change group by group, and you see the score.
The score decides how much fingerprint work R-27 needs.

**R-24 · Three real change requests** (S, the S-SCOPE spike)
Three requests from past engagements, run through the panel and the report on
paper: what fraction can be expressed.
Your check: they are your requests; you judge whether the tool speaks them.
Needs from you: the three requests, in whatever form they exist.

**Phase B acceptance**: one full past change request, end to end, through the
loop, verified by your eyes on the live site.

## Phase C: the consultant finish. At the end, the product is presentable to a client and trustworthy for a full engagement.

**R-25 · Same-value highlighting** (M)
Hover "shared, 12 on this page" and see them light up in the preview.
Your check: hover it, count the highlights yourself.

**R-26 · The clean check** (S)
One click, read-only: is the helper line still in the project, and is anything
of Rocket's lying around. Results name the file in your terms, and the same
status lives permanently in the helper indicator, not only behind a button.
Your check: run it with the line in, see it named. Remove the line, run it, see
it clean, and see the indicator agree.

**R-27 · The report, full fingerprints** (M)
Each change gains the proofs the browser saw: the element's styling text, its
place in the page, its neighbours, plus uncertainty notes where Rocket is not
sure. Shaped by R-23's score.
Your check: rerun the R-23 experiment, the score improves or stays perfect.

**R-28 · Session backup and recovery polish** (S)
The one-click backup download, the nudge on long sessions, and the recovered
session screen in its final wording.
Your check: force the bad case, clear site data, restore from the downloaded
backup, session intact.

**R-29 · The disclosure draft** (S)
The one-page plain-language explanation for a client, generated with the
project's actual details filled in.
Your check: read it as if you were the client. Would you approve you?

**R-30 · The executor checklist** (S)
The report's closing section: which pages to eyeball, which shared values
changed, whether words changed, what to run.
Your check: hand it to Claude Code once and see nothing important was missing.

**R-31 · Panel design pass** (yours, with me implementing)
The whole surface designed properly, in Figma if you want, then implemented
faithfully: spacing, type, states, empty states.
Your check: it is your design.

**R-32 · The copy pass** (M, yours to approve)
Every sentence the product ever shows, reviewed in one sitting, against the rule
that no message requires technical knowledge.
Your check: you read the full list and veto freely.

**Phase C acceptance**: a full working session on a calibration project, from
attach to report to Claude to push-ready, with nothing that would embarrass you
in front of a client.

## Counts and honesty

Thirty-four tasks: Phase A thirteen, Phase B thirteen, Phase C eight. At the
architecture's estimate that is five to seven solo weeks to the end of Phase B
and seven to ten overall, alongside client work, so calendar time stretches.

Two tasks need something from you beyond checks: R-24's three change requests,
and R-31's design. Everything else needs only your eyes at the end of each task.

The plan bends where reality pushes back: R-23's score is the one number that
can reorder Phase C, and the architecture's spike table says what else can
surprise us.
