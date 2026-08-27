# Live Editor — Plan (the big version)

Status: PLAN ONLY — nothing implemented. Written 2026-08-27 from a 9-agent
research + design pass (5 web/repo researchers, 3 architecture proposals from
different lenses, 1 completeness critic). This doc is the synthesis.

Moved into the Live Editor repository on 2026-08-27, when the project became
standalone. It was written while the plan was still to build this inside DS
Tiger, so wherever it calls the editor a section of DS Tiger, read that as the
surface it described, not where it now lives. The architecture section is the
part that needs re-scoping. The verified facts, the trust tiers, the phases and
the open decisions all carry over unchanged.

## What this is, in plain words

Rotem points DS Tiger at a client's code folder. The client's real site opens
live inside DS Tiger. He changes colors, fonts, spacing and corners through
visual controls, sees the change on the live site instantly, and presses Apply
to write it into the client's real files — with automatic backups and one-click
undo. The same promise as editor-v.com and Onlook, but inside DS Tiger, built
around his consulting workflow: land on a client repo, retheme fast, hand the
changes to the client's dev team cleanly.

The realistic sequence: the first shippable version edits the design variables
the client repo already has (most AI-built startup repos have them); the
"click any element and edit it" headline arrives several phases later, because
it depends on the genuinely hard technology.

## Prior art evaluated (buy-vs-build)

**Piny** (Pinegrow) — a visual Tailwind editor that runs as a VS Code / Cursor
extension: preview pane, visual class controls, responsive + state tabs;
click-to-select in the preview is a paid tier and needs a script added to the
client project. Tried hands-on 2026-08-27 on the DS Tiger repo itself. Verdict:
**rejected on experience** — the owner's words, "a genuinely terrible
experience." It writes straight to source with no staging and no backup layer
(git is the only undo), and it lives inside an IDE rather than a designer's
tool. Do not re-evaluate as a substitute for this plan.

The useful conclusion: the technology in this space is commodity — several
tools already do click-to-edit-Tailwind. What none of them do is the designer
experience and the safety net. That is where this plan's value sits, and it
argues for keeping the staging tray, the backup/rollback stack, and the
DS-Tiger-native surface as non-negotiables rather than polish.

**Wappler** (~€40–60/month) — looked at 2026-08-27 and ruled out on FIT, not
price: it is a visual builder for creating new apps in its own stack, not a
tool that opens an arbitrary existing client repo. It cannot do the one thing
this plan is for — landing on someone else's Next/Tailwind codebase and
editing it in place.

Also evaluated on paper: **editor-v.com** (macOS desktop, closed) and
**Onlook** (open source, Apache-2.0) — both remain useful architecture
references, see the facts below.

## Verified facts that shaped the plan

These came out of the research pass and are load-bearing — do not design
against different assumptions without re-verifying.

1. **React 19 killed the easy path.** Every older "click an element, find its
   code" tool read React's internal `_debugSource`; React 19 removed it
   (facebook/react PR #28265) with no replacement, and the React team declined
   to restore it (#32574). The only reliable mapping is **compile-time
   stamping**: a bundler plugin that stamps each element with `file:line:col`
   as a data attribute during the client's dev build.
2. **The stamping engine exists.** `code-inspector-plugin` (MIT, zh-lx) does
   exactly this for Vite, webpack, and Next 15.3+/16 Turbopack
   (`turbopack.rules`), config-only, React-19-proof. Onlook (Apache-2.0, open
   source) proves the full loop end to end: stamps → iframe + injected agent →
   staged edits via an override stylesheet → AST edit of `className` → HMR
   refresh. Both are reference implementations to study/vendor (see Licensing).
3. **Never add a `.babelrc` to a Next client repo.** It opts the whole app out
   of SWC — dev builds crawl and `next/font` breaks. Use `turbopack.rules`
   (Next 15.3+/16) or a webpack plugin (≤15) instead.
4. **Direct iframe, no proxy.** Next and Vite dev servers are iframable by
   default (no `X-Frame-Options`). A direct iframe to the client's own
   `localhost:port` keeps everything same-origin, which sidesteps Next 16's
   `allowedDevOrigins` protection (403s on `/_next/*` + HMR websocket for any
   other origin). A rewriting proxy silently kills Next HMR — fallback only,
   for apps that send `frame-ancestors`.
5. **The happy path is big.** v0 / Lovable / Bolt / Cursor / Claude Code all
   generate shadcn/ui + Tailwind with a standardized `:root`/`.dark` CSS
   variable block (`--background`, `--primary`, `--radius`, …). For funded
   startups with AI-bootstrapped codebases, "parse and edit the variables that
   already exist" plausibly rethemes the whole app with zero tokenization work.
   UNVALIDATED against Rotem's actual client pipeline — Phase 0 checks this.
6. **Windows process management is a minefield.** Patched Node throws EINVAL
   spawning `.cmd` shims; `child.kill()` orphans Next's worker subprocesses;
   our own dev-server restarts strand children squatting on ports. Conclusion:
   dev-server management is deferred to a late phase (a small standalone
   daemon); until then Rotem starts the client's dev server in a terminal —
   fine for a solo owner.
7. **Surgical writes only.** postcss preserves CSS files byte-identically
   except the changed declaration; recast reprints only modified JSX nodes.
   Onlook's regenerate-and-prettier pipeline reformats whole files — noisy
   diffs poison client PRs; we do not copy that part.
8. **Refusal is a feature.** Dynamic styling (template-literal / ternary /
   identifier classNames, CVA variant maps, styled-components interpolations)
   cannot be safely edited by any tool. The design classifies every element
   safe / limited / blocked up front, shows why, and emits a Markdown fix-list
   a Claude agent can act on — instead of corrupting client code.

## Architecture — five pieces

1. **DS Tiger UI.** A fifth root section in `ProjectSidebar` (Integrations is
   the copy-paste precedent), pages under
   `src/app/projects/[projectId]/editor/`. One DS Tiger project per client
   repo. Surface: center canvas holds the iframe; right floating drawer
   (NodeEditor precedent) holds visual controls; left panel holds the design
   values list; top bar holds viewport width presets, the staged-changes tray,
   and Apply. Durable config (client repo root, framework, port, scan status)
   is an additive `Project.editor` looseObject slice with a deterministic seed
   (integrations.ts is the template) — inherits autosave, undo/redo and 409
   protection through one `updateEditor` method. Heavy transient state
   (element maps, action logs, scan inventories, process logs) lives in
   gitignored sidecar scratch files, never in the git-tracked project JSON.
2. **The write broker.** ONE gated code path for every byte written into a
   client repo, no exceptions. Gates, in order: path prefix check against the
   registered repo root (`path.resolve` prefix, traversal impossible) →
   file-hash staleness check (hash recorded at scan; mismatch = refuse, force
   rescan) → edit-tier permission (see Trust tiers) → for JSX, re-parse and
   assert the node at the stamped position matches the expected tag before
   writing. Around every Apply: timestamped copies of touched files in a DS
   Tiger-owned backup dir OUTSIDE the repo + one-click restore; a
   side-effect-free git snapshot at session start (`git stash create` — records
   the object WITHOUT touching the working tree; never plain `git stash`, which
   would rip the client's uncommitted work out of the tree). Writes go in place
   with an EPERM/EBUSY retry loop (Defender/editor locks); no temp+rename on
   client files (their file watchers mishandle rename events). Never
   auto-commit to the client's branch.
3. **Preview.** Direct iframe to the client's own `127.0.0.1:port`. Width
   presets (375 / 768 / 1440 + free drag) with transform scale-to-fit —
   labeled "responsive preview", not device emulation (UA / touch /
   pointer-media emulation is out of scope without a controlled browser).
4. **The in-page agent.** A dev-only script injected into the client page
   (one-time, git-visible, cleanly removable; rewrite-proxy as the zero-touch
   fallback). Speaks promise-RPC over origin-checked postMessage. Draws
   hover/selection rectangles in-page (`pointer-events:none`), batches
   computed-style reads, applies staged edits as ONE injected override
   stylesheet recorded as an append-only action log (instant preview + per-step
   undo, nothing persisted until Apply), and reconciles after HMR (re-resolve
   selection by stamp, drop staged patches the source now satisfies).
5. **Scan + stamping.** Tier-0 scan first: detect shadcn/components.json and
   postcss-parse the `:root`/`.dark`/`@theme` variable blocks into a typed
   panel. Later: the pre-flight scanner (parse every jsx/tsx + CSS file,
   classify safe/limited/blocked, hash files, emit the fix-list) and
   compile-time stamping via vendored code-inspector-plugin, injected
   reversibly into the client's bundler config (originals backed up
   byte-for-byte; attach refuses when the config can't be parsed confidently).

## Trust tiers — what Apply may touch

| Tier | Edit class | Mechanism | Unlocked in |
|---|---|---|---|
| A | CSS custom property values (`:root`/`.dark`/`@theme`) | postcss span rewrite | Phase 1 |
| B | Plain `.css` / `.module.css` declaration values | postcss span rewrite | Phase 3 |
| C | Tailwind string-literal `className` (+ `cn()`/`clsx` literal append) | recast AST edit, tailwind-merge semantics | Phase 4 |
| D | Theme objects (tailwind.config v3, MUI/Chakra), inline style literals | ts-morph/recast | Phase 7 |
| Blocked | Template-literal/ternary/identifier classNames, CVA maps, styled-components interpolations, generated/minified files, unstamped elements | hard refuse + reason + fix-list entry | never |

## Phases

Estimates are calibrated (the raw proposals ran optimistic ~2x; these are the
adjusted honest ranges, in solo working weeks).

### Phase 0 — Foundations and reality check (1–2 weeks)

Nothing user-visible ships; everything risky gets de-risked.

- **Governance first.** The feature's core promise — writing into client
  repos — is currently forbidden by CLAUDE.md rule 15 (all writes stay inside
  `J:\Projects\DS Tiger\`). Owner-approved carve-out BEFORE any write code
  exists; proposed model: attaching a repo registers its root in the project
  JSON, and that registration IS the standing write approval for that root,
  enforced by the broker's prefix check. Rotem edits CLAUDE.md himself.
- **Write-broker skeleton** + backup dir + restore + git-snapshot mechanics,
  tested on a throwaway repo Rotem owns.
- **Stamping spike (1–2 days).** The least-verified load-bearing piece: run
  code-inspector-plugin on a REAL Next 16 App Router shadcn repo — confirm
  `turbopack.rules` stamping works, server-component consistency (no hydration
  errors), dev-build slowdown acceptable, and config-wrapper injection survives
  real-world `next.config.ts` files (TS/ESM, wrapper functions). If the spike
  fails, Phases 4+ re-plan before any promise is made.
- **Calibrate against 2–3 real client repos.** Validate the shadcn/variables
  assumption, monorepo layout frequency, and does-it-even-run reality. This
  picks the MVP's target repo.

### Phase 1 — Attach + variable retheme — the MVP (2–3 weeks)

The first genuinely useful version: whole-app retheme of a variable-based
client repo in minutes.

- Editor sidebar section, routes, `Project.editor` schema slice.
- Attach flow: pick folder → detect framework/package-manager/styling stack
  from `package.json`/lockfiles/`components.json` → **doctor step**: is
  `node_modules` installed, do env vars exist (`.env.example` diff), does the
  dev server answer — with a clear failure UX. DS Tiger never runs `npm
  install` on a client repo itself (postinstall scripts = arbitrary code on
  Rotem's machine) without an explicit per-repo confirmation.
- Monorepo support at attach: workspace discovery (`pnpm-workspace.yaml`,
  `turbo.json`, `apps/*`) + an app-target picker; scan scope includes shared
  `packages/*`.
- Rotem starts the client dev server in his terminal; DS Tiger takes the URL.
  Direct iframe + width presets.
- Tier-0 scan → typed variables panel (color pickers, unit steppers, grouped
  colors/typography/radius, authored values shown — `rem`/`var()`, never
  computed px).
- Apply through the full broker (Tier A only) + backups + rollback. Feedback
  loop = the client's own hot reload (seconds).
- Auth-walled apps: "open in real tab" to log in on the same localhost origin,
  then reload the iframe with the session cookie.
- v1 scope line: React (Next/Vite) repos; anything else attaches read-only.

### Phase 2 — Live staging agent (1–2 weeks)

The "editor feel": drag a slider, the live site changes instantly, disk is
untouched until Apply.

- One-time instrument step injects the agent (Vite `transformIndexHtml`
  plugin; Next dev-guarded layout snippet); clean detach restores everything.
- Override-stylesheet staging + action log + per-step undo.
- Apply replays the log through the Phase 1 broker, then verifies: wait for
  HMR, diff `getComputedStyle` of edited elements against staged values, flag
  mismatches loudly (a staged preview always wins; the written value can lose
  the real cascade — never ship that silently).
- Staged-changes tray: one chip per change with staged / applying /
  applied-verified / mismatch states, per-file diff preview, discard.

### Phase 3 — Click-to-inspect + plain CSS edits (2–3 weeks)

- Hover/selection overlay, `elementFromPoint` hit-testing, selection stable
  across re-renders.
- Matched-rule resolution inside the agent: walk same-origin
  `document.styleSheets`, `element.matches` + specificity ordering. (No
  DevTools-protocol dependency — that was considered and dropped: unavailable
  to a plain web app + iframe. Source maps where present — attach injects
  `css.devSourcemap: true` on Vite — selector-text search as fallback.)
- Tier B unlocked: edit the winning rule's declaration values via postcss.
- Fan-out warning before write: "this rule styles N elements".

### Phase 4 — Source stamping + Tailwind writes (3–4 weeks)

The headline: click an element on a Tailwind client, edit spacing/color/type,
Apply rewrites the real `className`.

- Vendored code-inspector-plugin engine, injected reversibly per bundler
  (Vite babel option / Next `turbopack.rules` / webpack ≤15).
- Tier C unlocked: string-literal className via tailwind-merge semantics
  (conflicting utilities collapse, `bg-*` dedup), `cn()`/`clsx` → append a
  literal argument, missing → create the attribute. Everything else refuses.
- Pre-flight scanner ships here in full: safe/limited/blocked buckets at
  attach, lock badges with reasons in the overlay, Markdown fix-list export
  for the Claude-agent workflow.
- Component fan-out: "edits N instances across M files" confirmation before
  any shared-component write.
- Lockstep Apply: one Apply at a time; afterwards invalidate all stamps, wait
  for the HMR rebuild to re-stamp (every applied edit shifts line numbers),
  refuse new writes until re-stamped.
- Tailwind v3 vs v4 detection (JS config vs CSS-first `@theme` — entirely
  different read/write paths).

### Phase 5 — Handoff to the client team (1–2 weeks)

For a consultant this IS the deliverable; no proposal had it, the critic did.

- End-of-session flow: strip every DS Tiger fingerprint (config wrapper, agent
  snippet, stamps are dev-only but verify), verify byte-identical config
  restore, present the final diff.
- A human-readable change summary (what changed, where, before/after
  screenshots from the preview) — pending an owner ruling on whether this
  counts as rule-16 Export territory (it is a separate pipeline, but ask).
- Owner-decided delivery shape: dirty tree / branch / summary doc (open
  question 5).

### Phase 6 — Dev-server manager (1–2 weeks, convenience)

One-click open. A tiny standalone Node daemon (NOT Next API routes — our own
HMR wipes their state and orphans children): fixed local port, on-disk
pid/port registry with PID-command-line verification, spawn the framework's
real bin JS via `process.execPath` (`shell:false`, `windowsHide`, bind
127.0.0.1, probe-allocated port), kill via `taskkill /T /F` + kill-by-port
fallback, reconcile on boot. Deliberately late: manual start costs a solo
owner ten seconds.

### Phase 7 — Design inventory + unifier (3–4 weeks, optional)

The tokenize-untokenized-repos tier — build only if client work demands it.

- Tiered scan (@projectwallace/css-analyzer + css-design-tokens, postcss over
  CSS, Babel walk of TSX for arbitrary classes/inline styles, runtime
  cross-check via the agent) → span-anchored Design Inventory JSON (gitignored
  sidecar).
- Inventory panel: every color/font/spacing value found, with usage counts —
  edit one, staged across every occurrence.
- Human-confirmed clustering and naming, always (never auto-merge #333 with
  #343434, never auto-name). Auto-applied rewrites only exact-literal →
  `var(--x)` in `.css`/`.module.css`; Tier D theme-object edits; CSS-in-JS
  stays read-only except theme files.

## Effort summary

| Milestone | Cumulative |
|---|---|
| MVP — attach + variable retheme with full safety rails (P0+P1) | ~4–5 weeks |
| Instant-preview editor feel (P2) | ~6 weeks |
| Click-to-inspect + plain CSS (P3) | ~8–9 weeks |
| Full click-to-edit on Tailwind repos (P4) | ~3 months |
| Consultant-grade handoff (P5) | ~3.5 months |
| Everything incl. daemon + unifier (P6–P7) | ~4.5–5 months |

Solo-effort weeks, alongside other DS Tiger work — calendar time stretches
accordingly. Each phase is independently shippable and useful if the project
stops there.

## Standing risks

- **Wrong-node write** (stale stamp → edit lands on the wrong element): the
  fired-consultant scenario. Mitigated by lockstep Apply + node assertion +
  hash refusal; this is why Tier C waits for Phase 4 maturity.
- **Preview lies** (staged override wins, written value loses the cascade):
  post-Apply computed-style verification, mismatch chips, offered rollback.
- **Concurrent writers** (client's own tooling / Rotem's editor / an agent
  touches a file between scan and Apply): hash-refusal + per-Apply backups.
  In-house precedent: the autosave-clobber memory.
- **Config injection breaks the client build**: wrap-never-rewrite, verify the
  dev server boots post-attach, refuse on unparseable configs, byte-identical
  restore on detach.
- **Two undo systems on one screen**: the editor route must suspend the
  project-draft Ctrl+Z (ProjectContext) in favor of the action log — decide
  focus ownership at Phase 2 build time.
- **Performance budgets unset**: stamping overhead on big client apps,
  full-repo scan cost, re-scan cadence after each Apply. Measure in the Phase
  0 spike; set budgets before Phase 4.

## Open decisions for Rotem

1. **Write approval shape** — attaching a repo = standing approval to write
   inside that folder, or ask again every session? (Gates Phase 0's CLAUDE.md
   change.)
2. **Footprint tolerance** — small, git-visible, dev-only edits in the client
   repo (config wrapper + agent snippet, cleanly removed on detach): acceptable,
   or must some repos be zero-touch (weaker proxy path, slower HMR on Next)?
3. **One design system or two panels** — should the values scanned from a
   client repo feed the project's EXISTING Colors/Typography pages (the client
   repo becomes another source for the same design system), or stay a separate
   Editor panel? This is the deepest product question — it decides whether the
   Editor is a tool inside DS Tiger or the point of DS Tiger.
4. **Calibration repos** — which 2–3 real client repos calibrate Phase 0, and
   what are their stacks?
5. **What the client team receives** — a dirty working tree they review, a
   branch, or a written change summary with screenshots?
6. **Confidentiality** — the client repo path/name would sit in DS Tiger's
   git-tracked project JSON; fine, or keep client-identifying config in a
   local-only sidecar file?
7. **Manual server start** — acceptable for the first months (daemon stays
   Phase 6), or important enough to pull earlier?
8. **Unifier ambition** — does turning untokenized repos into token-driven
   ones matter to the consulting offer, or is fast editing of what already
   exists the whole product?

## Out of scope, explicitly

- The frozen Export area (rule 16) — the Apply pipeline is architecturally
  separate; the Phase 5 change summary needs an owner ruling before build.
- JSX structural edits (moving/adding/deleting elements) — style values only.
- Device emulation beyond width (UA, touch, devicePixelRatio).
- Auto-committing or pushing in a client repo, ever.
- Non-React frameworks in v1 (read-only attach only).

## Licensing (check before vendoring)

- code-inspector-plugin — MIT: vendorable, keep the license header.
- Onlook — Apache-2.0: patterns/architecture are free to learn from; copying
  code (its parser/style.ts logic) carries attribution/NOTICE obligations —
  decide copy-vs-reimplement per file, relevant since output lands in client
  repos.
- @projectwallace/css-analyzer + css-design-tokens — MIT.
