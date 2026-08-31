# Rocket Editor Review Pack

Purpose: a single self-contained document for external AI reviewers (Claude,
GPT, Gemini, others). It compresses the full plan: product, constraints,
ratified decisions, system design, technology stack, research findings, all 34
build tasks with their technical mechanism, spikes, and the questions reviewers
should attack. No repository access is assumed; everything needed is here.

State: planning complete, zero application code written. Date: 2026-08-30.

## 1. The product

A local tool for a solo design consultant (a product designer, not a developer)
who rethemes funded startups' existing web apps.

The client's site runs live inside Rocket on the consultant's Windows machine.
He clicks any element, components included, and adjusts it with visual controls:
spacing, sizes, text content, colours, corners. Every change previews instantly
in the browser. No file is ever touched. Rocket keeps a durable session record
of every change in design language, with browser-proven fingerprints per
element. **The primary unit of handoff is a small group**: select a visual
context, make 1 to 5 related changes, approve visually, send that group to
Claude Code mid-session (which he already uses daily inside client repos), keep
working. The full session report is history, backup and end-of-session summary.
Claude Code makes the actual code changes under the project's own conventions; the
consultant verifies visually and pushes his own branch for the client team's
review.

Rocket is the eyes and the memory. Claude is the hands. The consultant owns the
push.

## 2. Hard constraints

1. Local only. No cloud, no accounts, no database server, no deploy. Zero ops.
2. Windows 11 is the only target platform.
3. Single user, never multi-tenant.
4. **The engine never writes a file, anywhere, ever.** Read mode only, enforced
   at runtime, no allowed destination.
5. No AI inside the product. Rocket is deterministic; all judgement is external.
6. Rocket never starts, stops or restarts any dev server. The consultant runs
   the client's dev server himself.
7. The in-page helper is passive: read, highlight, preview. It never clicks,
   submits or navigates the client's app.
8. Primary user cannot read code. Every user-facing message must work without
   technical knowledge.

## 3. Ratified decisions (owner-approved, with the one-line rationale)

1. **Local web app**, not desktop app, not editor extension (extension tried
   and rejected on experience).
2. **The lean pivot**: Rocket is read-only everywhere; Claude Code writes from
   the report. Supersedes a fully designed write-broker architecture (16-gate
   write path, verified backups, element labelling, commit hooks), which is
   preserved as a dated spec for a possible future "writing track".
3. **The engine writes nothing on disk.** Session state lives in the browser's
   own storage; files reach the user only as browser downloads or clipboard at
   a click.
4. **The helper line is pasted by hand** by the owner into the client's root
   layout, and removed by hand. Rocket shows the line, verifies it answers, and
   provides a read-only clean check. (Supersedes an automated write + commit
   hook guard.)
5. **Transparency is the default posture**: Rocket drafts a plain-language
   client disclosure; sending it is the owner's per-client call.
6. **The first release is the real interface**: every control present from day
   one; a control that cannot act explains why in designer language.
7. **Preview instructs the browser directly** (set the property on the
   element), so previews are exact even for values the project never compiled.
   No styling engine embedded.
8. **Off-scale values are accepted instantly**, marked "custom", no dialog, and
   stay local to the element. Changing a shared design-system value is a
   separate explicit path.
9. **System first, freedom second**: when the project has a design system,
   controls open on its palette, type scale, spacing steps (read from theme
   files); picking a system value records the token name for the report.
10. **Shared value clicked on one element**: both paths offered, "just this
    one" (default) or "everywhere", recorded as intent.
11. **Text size and line height are independent controls**; no control ever
    moves another. The relationship may be shown, never acted on.
12. **Visible text is editable**, including text in the project's own content
    and translation files (which behave as shared values). Text from live
    servers (databases, APIs) is permanently out of scope: it is not in the
    project.
13. **The product delivers nothing**: the owner pushes his own branch; the
    report is material, not a delivery mechanism.
14. **Calibration** runs on the owner's three own systems first (real projects
    built before this product existed), then public repos for diversity.
15. Client-identifying paths stay out of the report by default (reports get
    pasted into AI tools).

## 4. System design

### 4.1 Three runtime pieces

**The engine.** A small local Node server, started with one command. It does
exactly two jobs: serve the panel, and read the attached client folder
(read-only) for theme/token data and framework detection. It holds no state on
disk and writes nothing.

**The panel.** A React app in the browser. All product UI: canvas (iframe of
the client's dev site), selection context card, property controls, session
tray, report export. Holds session state in browser storage.

**The helper.** A classic script (~small, no build) served by the engine,
loaded into the client's page via one hand-pasted dev-guarded line in the root
layout. Speaks versioned postMessage to the panel, origin-pinned. Capabilities:
hover/selection overlays, computed-style reads, direct-style preview injection,
same-value highlighting, text census (editability of text is decided by the
engine exact-string-searching the attached folder, read-only: found = editable,
not found = live data; interpolated i18n strings honestly refused). It holds no
tokens, knows no paths,
persists nothing, and never dispatches events into the client's app. Any script
in the client page can send panel-bound messages indistinguishable from the
helper's (same origin), so every page-derived string is untrusted: rendered as
text only in the panel, fenced and labelled as page data in handoffs, with a
standing executor caution to act only on the structured change list.

### 4.2 The read-only wall (enforcement, not policy)

At engine boot, before any user or dependency code loads (via a `--import`
preload), every write surface of `node:fs` is wrapped to throw unconditionally:
callback API, sync API, the shared `fs.promises` object (covers both import
specifiers), and `open`/`openSync` gated on write flags (covers FileHandle
writes that bypass module patching). `module.syncBuiltinESMExports()` is called
so ESM named imports see the wrap. The wrap is re-installed in every worker
thread at spawn. There is no allow-list and no allowed destination. Research
verified this four-surface recipe against Node's source (fs/promises binds
`internalBinding('fs')` directly, so naive patching misses it) and against
precedent (OpenTelemetry fs instrumentation; graceful-fs's promises gap as the
cautionary tale).

The wall is layered: the engine runs under Node's permission mode
(read-only fs, no child processes, no native addons, no workers), which blocks
what no userland wrap can see, with the fs wrap inside it for friendly named
refusals. Note: earlier research rejected the permission model as an adversarial
boundary; that stands, but this product's threat is accidental writes, and for
accidents belt-plus-wrap beats either alone. Additional closures: heap-snapshot
and diagnostic-report writers disabled, node:sqlite banned, boot asserts zero
.node binaries in the engine tree. Watcher compatibility is an R-02 check.

Why a wall when the product "obviously" never writes: the engine holds two
legitimate folder paths (its own install, the client's). Thousands of
instructions, partly AI-written, partly third-party, can each grab the wrong
variable or write a cache "next to the files it processed". The wall converts
every such bug from a client incident into a thrown error.

### 4.3 Origin, framing and auth (verified against specs)

- The panel is served at `http://localhost:<port>`; the client dev site (e.g.
  `localhost:3000`) is framed directly, using the exact URL the dev server
  printed. Next.js dev-origin protection allowlists the `localhost` hostname
  (not `127.0.0.1`), so numeric-loopback framing kills HMR and is never used.
- Same-site, different-origin: under the HTML standard, registrable domain is
  null for `localhost`, falling back to host equality, so `localhost:7317` and
  `localhost:3000` are same-site. Consequences verified: `SameSite=Lax` cookies
  flow inside the frame (login-walled client apps stay logged in), and Chrome's
  storage partitioning does not partition a wholly same-site ancestor chain.
- Because cookies ignore ports, the panel uses **no cookies at all**: a
  per-launch token is delivered in the URL fragment, immediately stripped via
  `history.replaceState`, held in sessionStorage (origin-keyed incl. port),
  and sent as a custom header. SSE is consumed via streaming fetch (EventSource
  cannot set headers), with heartbeat-based liveness.
- Engine request guard: bind loopback only; `Host` must match exactly (DNS
  rebinding); `Sec-Fetch-Site: same-origin` required, `none` accepted only for
  the top-level launch navigation, and the helper route (`/agent.js`, the only
  meaningfully unauthenticated route) accepts `same-site` with
  `Sec-Fetch-Dest: script`; `Origin` checked when present; zero CORS headers
  anywhere. Chrome's Local Network Access (142+) exempts loopback-to-loopback,
  verified against the WICG draft.
- Known trap for the first test day: an https client dev server is
  schemeful-cross-site with the http panel; the login-preview guarantee
  collapses there and must be detected and explained, not discovered.

### 4.4 Preview model

The preview is an injected per-element style rule keyed to a marker attribute
(not inline style: React re-renders and animation libraries rewrite inline
style without any reload, which would erase previews mid-session; a
MutationObserver re-marks re-created elements, loop-guarded), so the browser
renders the value exactly, whether or not it exists in the project's compiled
CSS. Hover/focus/state styling is explicitly out of scope for v1 (a passive
helper cannot preview it honestly); state controls exist and explain what would
unlock them, and a typed state request can ride in the handoff marked as not
previewed. Three representations are kept separate:
what the designer sees ("Padding X: 13px · Custom"), what the preview injects
(`padding-left: 13px`), and how the report describes it (design language plus
fingerprints; the source representation is Claude's concern). After the
consultant's session, nothing persists in the page; reload wipes previews by
design.

### 4.5 Session record and report

Every completed edit (commit point: control release / Enter, not per drag
frame) is appended to browser storage with a sequence number. Reopening offers
continue/discard. Browser storage can be wiped by clearing site data, so the
panel offers one-click backup download and nudges on long sessions.

Changes group by visual context (same button, card or section), grouping
suggested from selection locality, adjustable before sending; everywhere-changes
form their own theme group. Group states: draft, sent, landed, off. Sending
copies a small Claude-ready handoff for that group alone. Fingerprints split
into a stable half (page, structural path, tag, sibling position, nearby text)
and a volatile half (styling strings, values); re-finding keys on the stable
half only, since Claude's edits change the volatile half by design. After every
reload that a landed group causes, the current page's unsent drafts are
re-applied by stable fingerprint (or flagged, never silently dropped), and
landed groups are auto-verified by re-reading rendered values against the NEW
expected value, read-only, with a fourth state, landed-with-deviation, for a
snap-permitted custom value the executor rightly moved onto the project scale
(each custom value carries an exact-or-may-snap intent bit). Every change also
records preview viewport width and light/dark mode (and an everywhere-preview
overrides the active mode's block, not only :root). Successful re-finds refresh
the stored fingerprint to the current DOM (weighted matching, ties flag rather
than guess), preventing drift across consecutive landings. When N siblings
share an identical clean class string, "just this one" warns that they are
likely one component and a lone change implies a variant. Session storage is
keyed per attached project, so two clients never share a recovery bucket; the
engine's port is fixed forever (storage is origin-keyed) and
navigator.storage.persist() is requested. When a pending local preview and a
pending theme preview collide on one element and property, the panel names
which one is visible. The full report (Markdown, clipboard or download) carries
per change: the page; the
element in human words (what it is, the words on it, where it sits); browser
fingerprints (rendered class string verbatim, DOM path with nth-of-type,
neighbour text); the change in design terms (property, old, new, custom-flag);
declared intent (this element only / everywhere, token name when a system value
was picked); timestamps; uncertainty notes (this text repeats N times on the
page, this value is shared by ~N elements). Plus session summary, pages
visited, and an executor checklist (pages to eyeball, shared values changed,
copy review needed, checks to run). The report never claims a file or line;
finding source is the executor's job, by fingerprint.

### 4.6 What Rocket reads from the client folder

Only two things, read-only: theme/token files (Tailwind 4 `@theme` blocks and
`:root`/`.dark` custom properties via a pinned postcss used purely as a reader;
Tailwind 3 config by static parse, best effort, honestly labeled) for the
inventory, swatches, scales and shared-value naming (merged over the
framework's bundled default scale, marked project-vs-default, since @theme
blocks usually hold only overrides); and light framework
detection at attach (package.json, lockfile, components.json) to know which
layout file to show for the helper line. No repo-wide watcher, no component
parsing, no markup analysis. Element understanding lives in the browser. The
panel API takes no file-path parameter anywhere: the engine reads only inside
the attached root, only theme and detection files, and serves derived data,
never raw contents by address.

## 5. Technology stack (verified current in an August 2026 research pass)

**Engine**: Node.js 24 LTS, floor >=24.12 (type stripping declared stable
there); TypeScript in the erasable subset executed natively
(`erasableSyntaxOnly`, no build step, no transpiler in the run path); Fastify 5
(`inject()` testing, static serving); Zod 4 shared schemas; SSE over streaming
fetch; postcss (exact pin) as read-only theme parser. No database (nothing to
store). Rejected: Bun (Windows quality complaints through 2026), Deno
(ecosystem fidelity: lifecycle scripts, resolution semantics), Electron/Tauri
(owner decision), SQLite in any form (no query workload, and now no writes).

**Panel**: React 19, Vite 8 (Rolldown-based, the current stable major),
Tailwind 4, shadcn/ui (copied in), Zustand 5 (server-pushed state; a
cache/staleness library fights a push model), react-colorful (maintained, React
19 support) with custom OKLCH sliders. Native binaries exist only in the
panel's build chain (oxide, lightningcss, rolldown), never in the engine; the
known npm optional-dependency omission bug on Windows has a documented
30-second recovery and can only break our panel build, never anything of a
client's.

**Testing**: node:test for the engine (including the wall: a test plants a
write and asserts it throws), Playwright against a static fixture page for
panel+helper flows, fast-check where property-based testing pays. No cloud CI;
a Linux runner validates nothing that matters here.

## 6. Invariants

1. Rocket never writes a file, anywhere, ever; the wall enforces it with no
   allowed destination.
2. The helper is passive; it never acts on the client's app.
3. The report claims only what the browser proved; no file names, no line
   numbers, no guessed impact.
4. Every completed edit is durably recorded before the panel confirms it.
5. One control never moves another; a typed value stays local unless
   "everywhere" is chosen explicitly.
6. Transparency is the default: the client disclosure draft always exists.

## 7. The 32 build tasks, with mechanism

Sizes: S <= half day, M ~ one day, L = 2-3 days. Each task ends with an
owner-runnable check (he is a designer; checks are click-and-see, never code).

**Phase A: skeleton (13 tasks). Exit: click an element on a real site inside Rocket, drag padding live, restart, session intact.**

- **R-01 Foundations** (M): repo scaffold; engine boots via `node --watch`
  with native TS; Fastify serves a hello panel; run/check commands recorded.
- **R-02 The wall** (M): the four-surface fs wrap via `--import` preload +
  `syncBuiltinESMExports` + worker re-install; a planted write dies visibly.
- **R-03 Panel shell** (M): React+shadcn layout: canvas, side panel, tray.
- **R-04 Attach, read-only** (M): folder path input; framework/styling
  detection from package.json/lockfile/components.json; helper-line target
  file named; polite refusal on nonsense paths.
- **R-05 Site framed** (M): iframe of the printed dev URL (never numeric
  loopback); width presets via transform scale.
- **R-06 Login survives** (S, spike): the 4.3 origin design proven live,
  including the https trap's documented answer.
- **R-07 Helper line flow** (M): `/agent.js` served as classic script;
  versioned postMessage envelope; paste instructions UI; heartbeat-driven
  indicator, green when the helper answers.
- **R-08 Hover highlight** (S): elementFromPoint on mousemove, rAF-coalesced;
  overlay box with `pointer-events:none`; plain-words element labels.
- **R-09 Click select** (M): selection held by the helper; re-resolved after
  re-renders via fingerprint; selection card (what it is, its words).
- **R-10 Real values** (M): batched getComputedStyle reads for the fifteen
  properties, authored-unit display where derivable.
- **R-11 First live control** (M): padding control end to end; helper sets
  inline style on commit-point gestures; reload wipes it, correctly.
- **R-12 Preview exactness** (S, spike): all fifteen properties asserted by
  computed-style readback with values outside the project's scale.
- **R-13 Durable record** (M): append-on-commit to browser storage with
  sequence numbers; kill browser, reopen, continue/discard.

**Phase B: working tool (11 tasks). Exit: one real past change request lands through Rocket, report, Claude Code, verified visually.**

- **R-14 Spacing controls** (M): gap/margin/padding; stepped ladder read from
  theme (Tailwind 4 `@theme` via postcss; Tailwind 3 static config read, best
  effort); custom instant + marked.
- **R-15 Size controls** (M): width/height numeric first; modes later.
- **R-16 Typography** (M): text size + line height, independent; type scale
  offered first where the project defines one.
- **R-17 Colour controls** (L): palette swatches (named, from theme vars)
  first; full picker (react-colorful + OKLCH sliders) one step behind; custom
  marked.
- **R-18 Radius** (S): same pattern.
- **R-19 Shared or local** (L): computed value matched up the var chain to a
  named token ("Primary, shared"); both paths offered, local default;
  intent recorded; preview obeys (local = inline on element; everywhere =
  root-level var override in the preview).
- **R-20 Text editing** (L): inline edit overlay on click; page-wide exact
  string census marks repeated text; volatility check (text that mutates on
  its own is live data) turns it read-only with a designer-words explanation;
  everything editable previews live.
- **R-21 Inventory panel** (M): the project's palette, type scale, spacing
  steps rendered as a designer reads them.
- **R-22 Groups + group handoff** (L): visual-context grouping, group states,
  per-group Claude-ready handoff; full report as history.
- **R-22b Previews survive reloads** (M): drafts re-applied by fingerprint
  after every reload, unfindable elements flagged.
- **R-22c Landed verification** (M): post-reload computed-value readback marks
  groups landed or off, read-only.
- **R-23 The loop, measured** (M, spike S-LOOP, the product's core bet): ten
  real changes in 3 or 4 groups sent separately in the real rhythm, scored per
  group incl. auto-verification agreement. The score shapes R-27.
- **R-24 Three real change requests** (S, spike): expressibility of real past
  engagement requests through panel + report; needs only the owner's three
  requests.

**Phase C: consultant finish (8 tasks). Exit: a full session from attach to push-ready with nothing client-embarrassing.**

- **R-25 Same-value highlighting** (M): helper scans computed values, batched,
  highlights the N matching elements on hover of "shared · N".
- **R-26 Clean check** (S): read-only scan naming the helper line's presence
  and location, run before pushing.
- **R-27 Report v2 fingerprints** (M): verbatim class strings, DOM paths,
  neighbour text, uncertainty notes; tuned by R-23's score.
- **R-28 Backup and recovery polish** (S): backup download, long-session
  nudge, restore-from-backup, final recovered-session wording.
- **R-29 Disclosure draft** (S): the client-facing one-pager generated with
  project specifics.
- **R-30 Executor checklist** (S): the report's closing section.
- **R-31 Panel design pass** (owner-led): the surface designed properly, then
  implemented faithfully.
- **R-32 Copy pass** (M, owner-approved): every product string reviewed
  against "no technical knowledge required".

Estimates: 5-7 solo task-weeks to end of Phase B (7-9 with historical slippage
priced in; raw task sizes sum near the bottom with zero slack), 7-10 overall
(9-12 priced), alongside client work.

## 8. Spikes still open

| # | Question | Why load-bearing |
|---|---|---|
| S-A (R-06) | Does the same-site login design hold live, incl. the https trap? | The preview of logged-in apps is the product's entry condition |
| S-PREVIEW (R-12) | Is direct-instruction preview exact for all fifteen + text? | "What you saw is what you asked for" rests on it |
| S-LOOP (R-23) | Do fingerprints + design language land reliably through Claude Code? | The core bet of the lean pivot |
| S-SCOPE (R-24) | Can real past change requests be expressed by panel + report? | Product-market honesty |

## 9. Deliberately deleted (do not report as gaps)

The write broker and its 16 gates, client-file backups and rollback, undo of
applied changes, element labelling (compile-time stamping) and its build-config
install, the commit-hook guard, trust tiers, batch Apply, engine-side durable
staging, crash-during-write recovery. All exist fully designed in a preserved
"writing track" document, dated, as the pickup point if S-LOOP fails. The lean
product deliberately trades Rocket-verified writes for an external executor
with judgement, and the owner explicitly accepted the trade: slower loop, no
write guarantee inside the tool, verification by his own eyes on the live site.

## 10. What reviewers should attack

1. The read-only wall: can any write escape it (worker threads, native
   modules of dependencies, child processes, the panel's own downloads)?
2. The report contract: is "fingerprints + design language, no file/line" ever
   insufficient for a competent executor on a modern React/Tailwind codebase?
   Name the concrete change a designer makes weekly that this cannot describe.
3. The origin/auth design: any hole in the guard set, given the engine can
   read a client's proprietary code? Any cross-site or same-site-neighbour
   leak?
4. Same-site login preview: cases beyond https where it breaks (subdomains,
   port collisions, third-party auth redirects)?
5. Text editing without source tracing: is the census + volatility heuristic
   honest enough, or does it invite wrong-text reports?
6. The helper's passivity: can preview injection alone perturb a client app
   (CSS-driven side effects, ResizeObserver storms, animation triggers)?
7. Session durability in browser storage: acceptable for hours of paid work,
   given the backup-download mitigation?
8. The 5-7 week estimate for Phase A+B, solo, AI-assisted.
9. Anything in section 9 whose deletion you consider reckless rather than
   lean, and the cheapest reinstatement that addresses it.
10. The send-and-continue rhythm: does re-applying drafts by fingerprint after
    Claude-triggered reloads hold up when Claude's own edits change the very
    fingerprints (class strings) the drafts are keyed on?
