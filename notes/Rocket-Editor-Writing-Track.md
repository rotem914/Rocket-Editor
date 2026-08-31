# Rocket Editor, the writing track (superseded as current architecture)

Status note, 2026-08-30: the owner pivoted the product to a lean, view-only
version in which Rocket never writes to any repository and Claude Code makes
the code changes from a Rocket-generated report. The current architecture is
`notes/Rocket-Editor-Architecture.md`. This document survives unedited below
that line as the dated specification for a possible future version in which
Rocket writes code itself. Its research, gates and designs are the pickup
point if the lean loop proves insufficient on real client work.

Status: PROPOSAL. Nothing here is built, and nothing here is ratified. First
written 2026-08-29 from a 10-agent pass. Revised 2026-08-30 against two rounds
of owner feedback, through a second pass of seven design agents plus a conflict
sweep against this document's own text.

This document is written to be attacked. Where a choice is contested, the
alternative and the one line that beat it are both stated, so a reviewer can
argue with the reasoning instead of guessing at it.

The product plan lives beside this at `notes/Rocket-Editor-Plan.md`. That file
says what the product is and why. This file says what it is made of. Section 24
lists every place this document corrects that one, and every place the revision
corrected its own earlier draft.

## 0. How to review this

If you are a reviewer, these are the places worth your time, in order. They are
the parts that are expensive to change later, or where the reasoning is thinnest.
The order changed in the revision: three of the top five are new.

1. Section 3.1, the split between what may be written and how the tool proves
   where to write it. That split is the structural correction the whole revision
   turns on, and the first draft did not have it. Then section 3.2 and section
   20, which together say how much of the fixed scope is reachable and when. The
   shape of the first release is settled, so what to attack here is the honesty
   of the reachability claims rather than the choice of product.
2. Section 8, blast radius. Everything the product says about what a change
   affects is downstream of the four proof levels defined there. If a level can
   be claimed without the evidence that earns it, the product lies to its user
   about a paying client's codebase.
3. Section 9, the write path. This is the safety mechanism. If a gate can be
   skipped, or the order is wrong, say so.
4. Section 12, the designer safety model. Its central claim is that Review is
   computed from the gap between the scope the designer declared by his entry
   point and the scope the system found, not from an absolute size threshold.
   Attack that claim first.
5. Section 10, durable staging, and its two loss numbers.
6. Section 4.5, the mutation primitive. The claim is that no
   formatter or code printer ever produces a byte bound for a client file. The
   revision puts a parser on the write path, which makes that claim harder to
   enforce. Check that it is enforced and not merely intended.
7. Section 21, the spikes. If something is promised in this document that is
   neither proven nor listed there, that is the bug.

What is not up for review: this is a local single-user web app, not a desktop app
and not a code-editor extension. That was decided, and an editor extension was
tried and rejected on experience. The reasoning is in `project-os/Decisions.md`.

## 1. The product, and what the architecture must obey

Rotem consults for funded startups. He lands on a client's existing repository
and needs to change design values without hunting through code he did not write.
Rocket Editor attaches to that client folder, shows the client's already-running
dev site inside itself, and exposes the design values as visual controls. Every
change previews live, waits in a staging tray, and reaches the client's real
files only on Apply, with a verified backup taken first and one-click undo.

**The primary user is a product designer who does not read code, and the
architecture is now bound by that.** He understands visual design, product
behavior, components, design systems, spacing, typography, hierarchy, states and
interaction. He should never need to understand abstract syntax trees, source
offsets, hashes, cascade specificity, git internals, hot reload, bundlers,
parsers, source maps, file locking, framework internals or Tailwind's
implementation in order to know whether an action is safe.

At every moment he must be able to answer six questions:

1. What did I select?
2. What controls it?
3. Is it local or shared?
4. What else will this change affect?
5. Is Rocket Editor confident it can edit this safely?
6. What will happen when I press Apply?

Sections 7, 8 and 12 exist to answer those six, and no other reason.

Seven constraints bind every decision below.

| # | Constraint | Where it bites |
|---|---|---|
| 1 | Zero ops, or the smallest possible. No cloud, no database, no containers, no accounts, no deploy. | Storage, transport, dependency list |
| 2 | Runs locally, single user, never multi-tenant. | Auth, concurrency, process model |
| 3 | A local web app in a browser. Not Electron, not a code-editor extension. | No browser debugging protocol, no privileged filesystem access from the page |
| 4 | It must write into a folder outside its own root. | The entire safety architecture exists for this |
| 5 | It never starts, restarts or kills a dev server, ours or a client's. | The dev-server daemon is cut, not deferred |
| 6 | Windows is the only target today. | File locks, path semantics, process spawning, Defender |
| 7 | The user is a designer who does not read code. Absorb the complexity; never export it. | Every refusal, every number, every state the product shows |

Constraint 7 arrived in the revision, and it is the one that reaches furthest.
It converts a large amount of engineering-facing text into a product surface with
its own correctness conditions, and it is the reason sections 12, 13 and 17 exist
at all.

The product's stance on mistakes, in priority order: **prevent, then explain,
then confirm, then recover.** Undo matters, and "you can undo it later" is not an
acceptable substitute for preventing an avoidable mistake. The dividing line the
whole product is built on: **the tool prevents accidental impact, the user owns
intentional impact.**

## 2. The four claims everything else rests on

The first three are about client files at Apply time and were in the original
draft. The fourth arrived with constraint 7. The revision also re-scoped claim 1
and widened claim 3, because the first draft's three claims did not span the
product the owner described.

**The designer never has to understand the machine to know whether he is safe.**
Every mechanism below produces a state, a number or a refusal that is rendered in
design vocabulary, with the machine reason available underneath and never
primary. A mechanism that cannot be explained in the designer's words is not
finished, whatever its engineering merit. This is a correctness condition, not a
polish pass, and section 17 makes it structural: no code ships without a designer
explanation and a remedy beside its machine reason.

**The unit of correctness is the Apply, and staged work is durable before it.** A
retheme touches several files at once, and Windows sells no primitive that makes
a multi-file change atomic. So the design does not chase atomicity. It buys
crash-recoverability for the whole Apply: a write-ahead journal, hash-verified
backups taken before any byte moves, and all-or-nothing rollback. Either every
file in an Apply changed, or none did, or the recovery screen is blocking work
until a human resolves it. The first draft stopped there, and by stopping there
it declared hours of staged design work outside the correctness story. Section 10
corrects that: an edit the product has acknowledged is on disk before the
acknowledgement returns.

**No printer ever produces bytes bound for a client file.** Parsers are used to
locate a value and to check a result, never to regenerate a file. The only
mutation primitive is a byte-range splice of the exact bytes that were read. That
turns "every byte outside the edit is unchanged" from a promise into an identity,
and it is why a Rocket Editor change shows up in a client's pull request as one
line. The revision adds a parser to the write path, at gate 8, which makes this
claim harder to enforce topologically; section 4.5 states the shape rule that
keeps it true.

**Refusal is a feature, and Review is not a weakened refusal.** A styling form
the tool cannot prove safe is refused with a named reason and a remedy, never
guessed at. The revision widens this from styling forms to blast radius: a change
whose reach cannot be established is refused or shown as unproven, never
presented as a safe local edit. It also adds a third outcome between allow and
refuse. **Review does not mean the tool is unsure whether the write is correct.**
It means the write is provably correct and reaches further than the designer's
entry point implied. Those are different questions, and section 12 keeps them on
separate axes for exactly this reason.

## 3. What the designer can edit

The owner fixed this list, and it is narrower than the machinery underneath
suggests. Rocket Editor is a focused visual refinement tool, not a CSS editor.

| Group | Properties |
|---|---|
| Spacing | gap, margin, padding |
| Typography | text size, line height |
| Size | width, height |
| Appearance | text color, background color, border color, border radius |
| Content | visible text |

**The list does not grow because CSS supports more.** A property is added when
real client work shows a repeated need for it, and not before. These eleven plus
text are the repetitive refinements the product exists to make dramatically
faster.

**Text size and line height are two independent controls, and the product never
turns one when the designer turns the other.** If the two are defined together in
the project's type system, the panel says so as context. It does not act on it.
The designer is looking at the result on screen while he works, and that judgment
is his. This is the general rule stated once: **the product hands over the
controls, it does not turn them.**

Section 3.6 is worth reading before the rest of this section. It separates three
things that are easy to confuse: what the designer sees, what the preview shows
him, and what ends up written in the client's files.

**Responsive editing is out of scope**, and section 3.4 explains what replaces
it. **Structural editing is out of scope**: nothing moves, is added or is
deleted.

### 3.1 Two axes, not one

The first draft's tier table mixed two questions, and that conflation is what
produced its phase-plan mistake. They separate cleanly.

**What class of bytes Apply may touch.** Tier 0 is the setup line. Tier A is
theme values. Tier B is plain CSS and CSS-module declarations. Tier C is a static
class attribute. Tier D is theme objects and inline styles. Tier T, new in the
revision, is visible text. Refused is everything the tool cannot prove.

**How the tool proves which bytes belong to the element on screen.** This axis
did not exist in the first draft, and it is where the interesting answer lives.

| Strategy | The proof | Cost to the client repo | Reaches |
|---|---|---|---|
| Token chain | The winning declaration for this property, read from the page itself, literally reads a variable, and that chain resolves through our own parse to one declaration holding a literal | none | Tier A |
| Selector uniqueness | The winning rule's selector and declaration appear exactly once across the repo's CSS | none | Tier B |
| Class signature uniqueness | The element's live class attribute equals, byte for byte, exactly one static class literal in the repo, and the tag names match | none | Tier C, and Tier T with it |
| Element label | The client's own dev build stamped file, line and column onto the element | a dev dependency, one config line, one dev-server restart the owner performs | Tier C, D, T |

All four share one proof shape, **uniqueness**, which is the reasoning the
product already accepts elsewhere: exactly one candidate is proven, several
candidates are listed and the designer picks, none is a named refusal. Nothing is
guessed anywhere on this axis.

The first three cost the client nothing beyond the agent line, and the third one
is not in the first draft at all. It is the reason the answer to "does this
product need element labelling before it is useful" is better than yes or no.

### 3.2 What is reachable, honestly

On the flagship target, a Next App Router repo on Tailwind 4 with shadcn, before
any element labelling:

| Property | Reachable | Scope of the edit |
|---|---|---|
| text color, background color, border color | yes, through the token chain | the whole app |
| border radius | yes, through the token chain | the whole app, across its derived steps |
| text size | yes, through the token chain | the whole app, at that step |
| line height | yes, through the token chain | the whole app, at that step |
| visible text | only once the element can be located reliably | this element |
| gap, margin, padding, width, height | only on markup with a unique class signature | this element |

**Six of the eleven are reachable only as whole-app theme edits. The other five
reach the markup the designer wrote by hand and not the inside of a shadcn
component**, because those components assemble their classes at runtime through a
variant map, which the product refuses by design. **Text is not reachable at all
until element location is reliable.** So before labelling, nothing on the list is
both per element and available everywhere.

**None of that changes what gets built.** The panel ships whole, with every
control present from the first release, and a control that cannot reach this
particular element says so in the designer's words and names what would unlock
it. What the numbers above decide is how many controls are live on day one, not
which product exists. That is the settled decision in section 20.4.

#### Where the no-install method actually works

Specified 2026-08-30, because the phrase "works on some projects" was doing too
much work and pointing in the wrong direction.

**It is not project by project. It is area by area inside every project.** The
same repository has regions where this works reliably and regions where it cannot
work at all, and the split is predictable from how the markup was written.

The method is simple enough to state exactly. Take the element the designer
clicked, read the styling text the browser is showing on it, and look for a
plain fixed string in the source that matches it character for character. One
match, with the same kind of element, is a hit. Anything else is a refusal.

**Where it works.** Markup written out directly: a landing page, a hero section,
a page layout, a one-off block. These carry long, distinctive styling strings
written in place, so a match is both findable and unique. This is also where a
lot of a consultant's visual refinement actually happens.

**Where it cannot work**, with the reason in each case:

- **Reusable components that assemble their own styling.** A button that takes a
  variant and a size computes its final styling as it renders. That finished
  string exists nowhere in the source, so there is nothing to match. On a project
  built from a component library this covers most buttons, inputs, cards, dialogs
  and menus.
- **A component that merges styling passed into it** with its own. Same problem:
  the result is assembled, not written.
- **Styling chosen by a condition**, one string when active and another when not.
  The source holds the pieces, never the whole.
- **Strings too common to be unique.** A wrapper styled with two or three common
  utilities appears hundreds of times. Ambiguous, so refused.
- **Anything that adds styling after the page loads**, an animation library, a
  carousel, a theme switch. What the browser shows no longer matches what the
  source says.

**What decides the ratio for a given project** is therefore one thing: how much
of its visible surface is written-out markup versus assembled components. A
marketing site sits high. An application built on a component library sits low.
An AI-generated startup app, the common client, leans on that library heavily,
which is the reason to measure rather than assume.

**Two things this does not affect.** Whole-app editing does not use this method
at all and works everywhere regardless. And on projects styled with plain
stylesheets rather than utility classes, per-element editing takes an entirely
different route that this method is irrelevant to.

**Every failure is a refusal that names its cause and what would unlock it.**
That is what makes the method safe to ship before it is measured: its bad
outcome is an unavailable control, never a wrong edit.

That is the uncomfortable number, and it is worse than the first draft's tier
table implied, because that draft's first release offered only the middle block
and called it the product. A designer who clicks a button, drags its padding, and
is told the tool can change the whole app's density or nothing has not been given
a padding control.

On Tailwind 3, text size and line height drop out of the token block. On plain
CSS or CSS modules, all eleven are reachable through selector uniqueness, scoped
to whatever that rule matches, which the product can count live and state
exactly.

Two runtime-only escapes were considered and rejected. Walking React's internal
fiber tree yields a component name, not the byte span of a class attribute,
depends on an unversioned internal hook, and needs source maps resolved at
runtime. Editing the token an element resolves to and calling that per-element
editing is real and good for the six properties that have tokens, but extending
it to spacing means editing the app's density multiplier and presenting that as
"this element's padding", which would be the tool lying about scope.

**So element labelling stays in the plan, and it stops being the feature that
makes editing possible.** It becomes the feature that turns "I cannot tell which
one you clicked" into "this one". That is a far better position for it to be in
when its spike comes back, because if labelling fails or costs the client more
than they will accept, there is still a product.

### 3.3 The scale problem

A designer drags a spacing control. Tailwind exposes a discrete scale, not a
continuous one, so the control cannot simply be a slider.

**The control is a stepped ladder over the client's own scale, and stepping off
it is free.** The ladder exists so the project's own values are the easy ones to
land on, not to fence the designer in. The stops are read from the client's own
source, never from a framework default: from the theme block on Tailwind 4, from
the statically analyzable config on Tailwind 3, and otherwise from the utilities
that actually exist in the stylesheet the page loaded. That last one is always
computed regardless, because it is what lets the panel show which steps this app
already uses. Plain CSS has no scale, so the control is a number field that
preserves the authored unit.

**A value the scale does not contain is allowed immediately, with no dialog.**
The designer types 13 where the scale offers 12 and 16, and the control takes it.
The panel marks it, `13px, custom`, and that mark is there for awareness, not for
permission. Nothing is interrupted, because interrupting a designer on every
off-scale value would fire constantly during exactly the work this product exists
to speed up.

**The custom value stays local.** It changes this element and nothing else. The
product never edits the project's shared design system because somebody typed a
number, and section 16 carries that as an invariant rather than an intention.

That is the whole distinction, and it maps cleanly onto the safety model already
in section 12: a local custom value does not exceed the scope the designer
declared by clicking one element, so it is Safe and silent. Changing a shared
value does exceed it, so it is Review and it says what else will move. The rule
is not "custom values are risky". The rule is "leaving your own element is
risky", and it was already written.

What was rejected: a dialog on every off-scale value, which is friction charged
against the common case to guard against the rare one. Snap-only with no escape,
which contradicts the rule that the designer owns intentional impact. And
silently moving a near miss to the nearest step, which is a guess wearing a
helpful face.

**What this costs the build**, stated plainly: on a class-based project the
source has to be able to carry an off-scale value from the first release, since
the designer can produce one on day one. The simple case, replacing one utility
with a one-off version of the same utility, moves into the first phase. The
tangled cases, where a one-off collides with a shorthand or with a competing
utility, stay in the phase that owns those semantics and refuse by name until
then.

### 3.4 Responsive is detected, never edited

The product does not touch breakpoint-specific styling: no width-prefixed
utilities, no media queries, no conditional rendering. That work goes to an
external coding agent.

**It does detect that responsive overrides exist and says so**, because the real
hazard is not that the designer cannot edit them. It is that he changes a value,
sees it take effect, and never learns that the same property is overridden at
another width. Detection is cheap on both stacks: width-prefixed utilities sit on
the same element, and media queries are visible in the parse.

So the panel names the widths in his words rather than the repo's numbers, and
editing a base value while an override exists for that exact property is Review,
not Safe. He is told what he is not changing.

### 3.5 Visible text

Click text, edit it, preview it, stage it, apply it, through the same gates as a
style change.

Two rules govern it, and the second is the one that keeps it safe.

**Source sufficiency.** Text is editable only when the source alone proves that a
text node with exactly that value renders in exactly that place. The page is
corroboration, never proof. If the proof needs a fact that exists only at
runtime, which array element, which branch, which caller, which locale, the text
is read-only.

**Text is never a locator.** The rendered string is never used to find a source
position. It is used only to reject a position already proven from the element
location and the parse. A candidate that fails the value check is refused; a
candidate is never chosen because its value matched.

*Two of the design passes disagreed here, and this is the resolution. One
proposed locating text by finding the single source literal matching the
rendered string. That is unsafe even when the match is unique across the whole
repo: text rendered from a translation file or a data fetch can coincide exactly
with an unrelated literal elsewhere, and the edit would land in a file that has
nothing to do with what the designer clicked. Uniqueness of a string is not proof
of provenance. So text location borrows the element location from the styling
axis, and text is only ever checked against it.*

The mapping is therefore two hops. First from the DOM element to its source
element, which is exactly what the styling axis already does. Then from that
source element to one specific text child of it, by position in the parsed child
list, with the rendered value asserted to match.

The second hop is only sound under a shape rule: **every child of the element
must be either text or a plain host element.** Any expression, any component
child, any fragment makes the whole element's text read-only. The reason is
precise: a host element renders exactly one node and never a bare text node at
that level, so the sequence of text nodes on screen and the sequence in the
source are provably the same sequence. A component child can render bare text, or
nothing, and either one silently shifts the position. The failure it prevents is
a paragraph whose middle child is a component that happens to render the same
word, where a click on the second occurrence resolves to the wrong literal and
passes the value check anyway.

**Its cost is stated up front:** a sentence with a link inside it is read-only in
V1, and links inside sentences are common. What would unlock it is a richer
element label carrying each text child's own span, which is deferred rather than
denied.

**When it ships.** Text needs the element located first, and the phase plan
schedules it with element labelling rather than with class-signature location.
Coupling a whole subsystem, three escaping regimes, the shape rule and the
re-parse proof, to a location strategy whose hit rate is still a spike is a bad
bet. Section 20 places it first in the labelling phase, before class writes,
because it needs no Tailwind semantics and it proves the labelling pipeline on
the simpler consumer.

Everything else refuses by name with designer copy: text assembled from an
expression, text that appears in more than one place in source, text spanning
multiple source lines, text carrying entities or braces, and text that is really
an attribute such as a placeholder or a label for a screen reader.

**Three kinds of text, and only one of them is genuinely out of reach.** The
distinction matters because the owner's requirement is to edit any text he can
see, and that is achievable for more of it than the refusal list first suggests.

- **Text written in the markup.** Editable, by the mechanism above. This is the
  first release.
- **Text living in a file in the project**, a content file, a constants file, a
  translation file. In scope, settled 2026-08-30. The words are written down in a
  file that came with the client's code and sits in the attached folder, so this
  is a different write target rather than a different problem, and the same write
  path with the same gates covers it.

  **A line in one of those files is a shared value, and the product already knows
  what to do with those.** One translation line can appear on many screens, so it
  gets exactly the treatment section 3.7 gives a shared colour: the reach is shown
  before the edit lands, and where the same words could instead be changed on this
  one screen alone, both paths are offered with the local one as the default.

  Two limits worth naming. Where several languages exist, editing one language
  leaves the others as they were, and the panel says which language it is editing
  rather than implying it changed the sentence everywhere. And a key whose value
  is assembled at run time, with a name or a count dropped into the middle of it,
  is refused like any other assembled text.
- **Text that arrives from a live source**, a database or an interface call at
  run time. **This one is genuinely and permanently out of reach**, and it should
  be: those words are the client's content, not their design, and they are not in
  the project at all. No edit made here could reach them, and a tool that
  pretended otherwise would be lying to the person holding it.

So the honest version of "edit any text" is: any text the project itself
contains. The panel says which kind it is looking at, and where it cannot edit,
it says why in those terms.

Editing text inside a shared component changes it everywhere that component
appears, so it carries the same blast radius treatment as a style change and the
same scope-gap rule from section 12.

Replacing short text with long text can break a layout, and the product does not
pretend otherwise. It cannot prevent it, so it does what it does everywhere else:
the change previews live, at the real width, before it is staged.

### 3.6 Three representations, kept apart

One value exists in three forms at once, and most of the confusion in this space
comes from treating them as one. They are separate on purpose, and translating
between them safely is the product's actual job.

**What the designer sees.** A design value in his own units: text size 13px,
marked custom.

**What the preview shows.** A direct instruction to the browser, injected
temporarily and living only in the page's memory: set this element's font size to
13px. The browser renders that exactly, whatever the project's own system does or
does not contain.

**What gets written into the client's files.** Whatever that project's own
architecture calls for: a one-off utility, a plain declaration, a variable, or an
existing value the project already has. Never a form imported from somewhere
else.

**These three do not have to match, and forcing them to match is a mistake.** The
preview's job is to be visually exact while the designer works. The written
form's job is to look native to the engineer who reviews it. Tying the preview to
the source representation would make the preview approximate for exactly the
values a designer is most likely to try.

The loop closes at Apply, and that is what keeps the separation honest: the
temporary preview is removed, the page rebuilds from the real written source, the
product reads back what the browser actually computes, and it confirms the result
is still 13px. If it is not, the change is flagged rather than quietly accepted.
Section 9's verification step is where that happens.

### 3.7 Just this one, or everywhere

The designer clicks a button and reaches for its background. The colour turns out
to be a value the project shares with forty other elements. This is the single
most common moment in the product, and it has one answer.

**Both paths are offered, and the local one is the default.**

- **Just this one** gives that element its own value and leaves the project's
  shared value untouched. It is the default, it is silent, and it is exactly the
  local custom value section 3.3 already allows.
- **Everywhere** edits the shared value itself, and before it does, it says what
  else moves.

The choice sits beside the property as a plain either-or, not a dialog that
interrupts. Picking is a two-word decision the designer makes when he wants to,
and the safe path is the one he gets by doing nothing.

**This removes an accident rather than warning about one.** In an earlier draft,
clicking an element and touching a shared value was a scope escalation the
product had to detect and explain, every time, which on a project where nearly
every colour is shared meant explaining constantly. Now the wide edit is
something he asks for. Section 12.2 carries the consequence: the gap between what
he intended and what he got is chosen rather than discovered.

**The honest limit.** Giving one element its own value means writing to that
element, which needs the tool to know which element it is. On markup it cannot
locate yet, per section 3.2, the local path is unavailable and only the shared
one works. The panel says so in those terms, and names what would unlock the
other: it does not silently widen the edit and it does not silently refuse it.

## 4. The stack

### 4.1 Runtime: Node 24 LTS, floor `>=24.10`

Node 24 is Active LTS until 2026-10-20 and supported to 2028-04-30, and it is
already installed on this machine at 24.14.1. It runs `.ts` files directly by
stripping types, which removes the server build step completely: no compiler in
the run path, no `dist/`, no source maps to go stale when a stack trace lands
inside the write broker.

Beats Bun and Deno: every artifact this tool parses and every convention it
honors is npm-shaped, and putting a second runtime's weakest platform underneath
the subsystem this project already calls a minefield costs more than it buys.

Startup asserts the Node version and exits with a named message, because a
client repo's `.nvmrc` can silently switch the shell to Node 20 and turn every
`.ts` file into a syntax error.

Node 26 becomes Active LTS on 2026-10-28. That is a one-line version bump around
November 2026, and it is scheduled maintenance rather than a surprise.

### 4.2 Language: TypeScript, split in two halves

The server uses the erasable subset of TypeScript, executed natively, with
`erasableSyntaxOnly` on so the compiler refuses the syntax Node cannot strip. No
enums, no namespaces, no parameter properties, no decorators. `tsc` exists only
as a check that never has to run for the app to work.

The UI uses full TypeScript, compiled by Vite.

The two halves get separate compiler configs joined by a solution file. One
config spanning a browser UI and a Node server either types timers wrong on the
server or lets `process` into browser code.

**Branded types do real work on the write path.** `RealPath` can only be minted
by the containment checker, `EditPlan` only by the validator, and
`BackupReceipt` only by the backup module after it has re-read the copy off disk
and matched its hash. The broker's write function requires a `BackupReceipt`. So
"wrote a client file without a verified backup" is a compile error, not a review
comment.

### 4.3 UI: React 19, Vite, Tailwind 4, shadcn/ui, Zustand

The product's whole domain is shadcn and Tailwind client repos, and the owner is
a product designer who will live in this panel daily. The surface is an iframe
host, a hover and selection overlay, a values panel, a properties drawer, a
staging tray with per-change state, a diff view and a recovery screen. That is an
application, not a handful of controls.

Beats a no-build stack (Preact plus template literals, no bundler): the no-build
claim collapses the moment TypeScript enters as a dev dependency, and what it
actually buys is paid for by hand-building a designer-grade color picker, a
unit-aware stepper and a diff viewer in a library with no ecosystem.

Beats Next.js for our own panel: a second dev server in the same browser as the
client's Next dev server means two hot-reload clients and two error overlays, and
Next reloads server modules mid-request, so an in-flight Apply would lose its
state routinely.

Zustand rather than a data-fetching cache library: state here is server-pushed
and server-authoritative, and a cache staleness model fights a push model rather
than helping it. No router in v1, since attach versus editor is one state flag.

Color picking uses `react-colorful` with hand-built perceptual sliders on top,
because shadcn ships no picker.

### 4.4 Transport: one local origin, REST plus a streamed event channel

The UI sends JSON to REST routes, each validated by a schema shared with the
client half. Every route is curl-able, which is how a local tool gets debugged at
11pm. The server pushes progress, staleness, doctor status and recovery alarms
down one event stream.

In development, Vite proxies the API to the server. In use, the server serves the
built UI from the same port. **There is no CORS configuration anywhere in the
codebase**, so no CORS bug can exist.

Beats a hand-rolled HTTP server: a framework with an injection-based test API
gives full HTTP-semantics route tests with no port and no browser, and gets
static file serving right, which is around 400 lines of security-relevant code we
would otherwise own.

Beats WebSocket: the need is one-directional, and mutations must return success,
failure or a diff, which is an HTTP response.

### 4.5 The mutation primitive: locate, then splice

```
splice(preImage, ranges) -> newImage
```

Ranges are asserted sorted, non-overlapping and in bounds, and each range's
current text must equal the exact text recorded when the value was located.

CSS is located with postcss, pinned to an exact version, using declaration-level
source offsets. The value sub-range is derived from the property name, the raw
text between property and value, and the raw value. A dedicated test asserts the
offset semantics of the pinned version, because those semantics have changed
between postcss releases.

TSX is located with the Babel parser used purely as a locator. Nodes carry start
and end offsets. Nothing is ever printed.

**`recast` is rejected, and not on theory.** Verified locally on this machine:
its line terminator defaults to the platform's, so printing a file with Unix line
endings on Windows rewrites every line ending in the file. Even with that forced,
changing a class name inside a returned JSX block in a semicolon-free file made
it reprint the enclosing statement and insert a semicolon. Reproduced across four
mutation strategies. The byte-range splice was byte-exact in both cases and
preserved quote style and irregular attribute spacing.

Also rejected: `ts-morph`, any regenerate-and-format pipeline (it fights the
client's own formatter config and turns a two-line change into an unreviewable
diff), and Lightning CSS on the write path (it normalizes output, which is fine
for analysis and disqualifying for writing).

Encoding discipline: the file is read as bytes, decoded as UTF-8, spliced as a
string, re-encoded as UTF-8. String indices and byte offsets are never mixed,
which is the real corruption hazard and one that only shows up on non-ASCII
content. Invalid UTF-8 or a UTF-16 byte-order mark is refused.

### 4.6 Storage: plain files, outside every git repository

State lives under the user's local application data folder, not inside the app
repo and not inside any client repo.

```
RocketEditor/
  config.json                 attached repos, preferences
  instance.lock               pid and command line
  workspaces/<repoId>/
    attach.json               resolved root, framework, dev URL, mode
    scan.json                 path, size, mtime per file. no hashes
    session.log               append-only, one record per completed edit
    session.json              a compaction of session.log, never the authority
    session.meta.json         open or closed, and what was last flushed
    apply.wal                 append-only, fsynced, apply lifecycle only
    backups/<applyId>/
      manifest.json           file to backup id, hash before, hash after
      <hash>.bak              byte copies of every touched file
    logs/
```

`repoId` is a hash of the fully resolved, normalized root path. Normalization
lowercases, converts separators, strips trailing separators and resolves short
names, or one project ends up with three divergent histories under three
spellings of its own path. **That normalization rule is frozen forever.** Change
it later and every existing backup becomes unfindable.

Beats a data folder inside the app repo: a backup that `git clean` can delete is
not a backup, and a paying client's source code must never sit inside a
repository that could be pushed.

Beats SQLite in any form, and the argument is re-made rather than inherited,
because section 10 adds a replay-on-startup workload and that is exactly what a
database is for. It still holds: the largest collection is one session's staged
edits, the log is newline-delimited records that a human can truncate at the last
valid line at 2am, and there is still no query workload. A reviewer will attack
here first, which is why the argument is stated again rather than assumed.

Four artifacts, not one journal, because one file cannot be an fsynced
write-ahead log, a rewritable staging store and a replayable event log at the
same time. The apply journal is append-only and fsynced per record. The session
log is append-only and group-committed, and it is the authority for staged work.
The tray snapshot is a compaction of that log, never its source of truth, so
discarding one is always safe. Event replay comes from an in-memory ring buffer,
never from either log.

An earlier draft said the tray was not fsync-critical, since losing it lost
staged edits rather than files. That is retired, and section 10 is the
replacement: hours of a designer's staged work is work, and losing it because a
laptop slept is a product failure even when no client byte was ever at risk.

Our own files are written to a temp file, fsynced, then renamed over the target,
with a bounded retry on the Windows lock errors and an orphan sweep at boot.

**Every persisted file and every log record carries a schema version.** An
unknown version is refused with a named message rather than parsed on a best
effort. This matters most for the backup manifest and the log, because recovery
after an update may have to read records written by the previous build, which is
exactly the moment a parse failure is unaffordable.

### 4.7 Process model: one process, permanently

One process holds the HTTP server, the event stream, scanning, parsing,
snapshotting and the broker. One command to start, one thing to stop, one stack
trace.

A multi-process split enforced by Node's permission model was proposed and
rejected. Node's own documentation calls that model a seat belt rather than a
security guarantee. It follows symlinks to locations outside granted paths, which
is the same input class the path containment layer exists to catch, so the two
are not independent. It is bypassed entirely by an already-open file descriptor.
And its Windows path comparison has documented case-folding defects that produce
both false denials and false allows.

**What replaces it is mechanical rather than aspirational.** At boot the process
wraps the write surface of the filesystem module so that every write call throws
unless the current async context carries the broker's token, or the target is
inside our own data folder. That is roughly 40 lines, and unlike a lint rule it
sees indirection, aliased handles, dynamic imports and dependencies. Lint rules
stay as a nudge and are labeled as such in the code, because a rule that matches
import names cannot see a member call on an aliased module.

Heavy parsing gets no worker pool on day one, and that is a refusal rather than
an omission. Phase 1 parses a handful of CSS files in single-digit milliseconds.
What ships on day one is the seam: every scan goes through one function and every
parse through another, so the body moves into a worker thread when a measured p95
exceeds the budget, without a caller changing. Worker threads rather than child
processes: no Node boot per job, and no process spawning at all, which sidesteps
the Windows shim-spawning trap entirely.

**Rocket Editor never starts, restarts, stops or kills any dev server. The
dev-server daemon that the earlier plan scheduled as Phase 6 is cut from the
architecture, not deferred.** The reason is concrete. Killing a direct child
leaves Next's worker grandchildren alive holding the port. The Windows tree-kill
command walks the live parent-child table and misses a grandchild whose parent
already exited. The only robust primitive is a Windows job object, which needs a
native binding, which is exactly the ops cost this project exists to avoid. Doing
it correctly is out of budget, and doing it incorrectly strands processes on a
consultant's machine, so it is not done at all.

The only processes ever spawned are one-shot, hold no port and have no children:
git, the shell command that opens the browser, and optionally a folder-picker
dialog. Spawning through a shell is banned everywhere, because a client-supplied
repo path is untrusted input.

### 4.8 Dependencies, complete

Server runtime, all pure JavaScript: the HTTP framework and its static-file
plugin, a schema validator, postcss at an exact pin, the Babel parser at an exact
pin.

UI runtime: React, React DOM, Zustand, Tailwind, an icon set, a color picker.
shadcn components are copied into the repo rather than depended on.

Development: TypeScript, Vite, the React and Tailwind plugins, Playwright, a
property-testing library, ESLint, and a process runner.

**Native binaries, stated plainly: three.** Tailwind's compiler, the CSS
transformer and the bundler all ship prebuilt per-platform binaries. No compiler
is needed to install them, but "zero native modules" is false. The containment is
architectural: **none of them appear on the write path.** The broker and the
locator depend only on postcss and the Babel parser, both pure JavaScript, and
the safety test suite runs with no bundler in its graph. A broken binding breaks
the panel's build, never a client's file, and never the suite that proves the
write path correct.

**The labelling tool is not installed into the client's project by default.**
Settled 2026-08-30. Rocket carries its own copy, and the one line added to the
client's build configuration points at that copy.

The reason is what the alternative touches. Installing it the ordinary way adds
a name to the project's dependency list and a line to its lockfile, and that list
is among the most closely read files in any repository: a new entry there reads
as a supply-chain change, while a line in a build configuration reads as a
leftover. Pointing at our own copy leaves the dependency list untouched entirely,
and takes the footprint from four lines across three files down to two lines
across two.

**It falls back automatically.** Loading a build tool from outside the project is
legitimate but unusual, and some project setups refuse it. When that happens the
product installs the tool the ordinary way instead, and **the panel says which of
the two is in use**, because the footprint the designer is carrying is not
something he should have to work out. Neither route is silent.

Both routes are covered by the commit guard in section 14.2, which enumerates the
configuration line, the dependency entry and the lockfile line by name.

Whether the outside-the-project route works across real client setups is spike
S-VENDOR, and it must run before the footprint promise is made to anyone.

## 5. Origin, iframe, and the in-page agent

### 5.1 The origin choice, which is a Phase 0 decision

**The iframe is always cross-origin.** An origin is scheme plus host plus port,
so the panel framing the client's dev site can never reach into it. The frame's
document is unreachable, permanently, and no amount of localhost arrangement
changes that. The plan's claim that a direct iframe "keeps everything
same-origin" is false and is retired in section 24.

What is true and load-bearing is narrower: because the framed document's own
asset and hot-reload requests carry its own origin, a direct iframe needs no
proxy and no edit to the client's dev-origin allowlist.

**Cross-site is the part nobody had modeled, and it decides whether the product
works on a logged-in app.** A site is scheme plus registrable domain, and the
port is ignored. If the panel is served from `127.0.0.1` and the client app runs
on `localhost`, the two are different sites, and two browser behaviors follow.
The client app's session cookie defaults to `SameSite=Lax` and is therefore not
sent on a cross-site frame load, so the app renders permanently logged out. And
storage partitioning gives the framed app an empty local storage, so an app that
keeps its token there is logged out too. Funded-startup apps are mostly behind a
login, so this is not an edge case, it is the common case.

**The choice: serve the panel from `localhost` on its own port, so the panel and
the client app are the same site.** Then the client app's cookies flow normally
and its storage is unpartitioned, and a login-walled app previews correctly.

That choice has one cost, and it is why the auth design below carries no cookie.
Cookies are blind to ports, so a cookie set by the panel on `localhost` would
also be sent to the client's app on `localhost`, handing our session credential
to whatever code that app loads. So the panel uses **no cookies at all.**

The auth design, end to end:

1. Start mints a per-launch token and opens the panel with the token in the URL
   fragment. A fragment is never sent to a server, never lands in a log, and
   never appears in a referrer.
2. The page reads the fragment, immediately erases it from the address bar, and
   keeps the token in its own origin's session storage, which is keyed by origin
   including the port, so the client app cannot read it.
3. Every request carries the token in a custom header. The event stream is opened
   with a streaming fetch rather than the built-in event-source object, precisely
   because that object cannot set headers. Reconnect is a few lines we own.
4. Because a custom header is required, a cross-origin page cannot forge a
   request without a preflight, and no preflight can succeed against a server
   with no CORS headers.

The request guard, in order:

| Check | What it refuses |
|---|---|
| `Host` is exactly our host and port | DNS rebinding, since a rebound request arrives with an attacker-controlled host |
| `Sec-Fetch-Site` is `same-origin`, with `none` accepted only for the top-level launch navigation | Every cross-site request, including the ones that carry no origin header at all |
| `Origin`, when present, equals ours | Cross-origin fetch |
| Token header matches the launch token | Anything that never received the launch URL |

Note the second row carefully. **The guard requires `same-origin`, never
`same-site`**, and that is load-bearing now that the client's app is same-site
with the panel. And the carve-out for the launch navigation is mandatory:
browsers send `none` for an address-bar or shell-launched navigation, so a strict
rule would reject the launch URL itself.

Three routes are unauthenticated, and each holds no secret and grants no
capability: the shell HTML, the static UI assets, and the agent script.

**What this does not stop, stated plainly.** A malicious install script inside an
attached client repo runs as the same user on the same machine and can read our
data folder. Origin and host checks constrain browsers only. Any local process
that can read our data folder has already won. The per-launch token shrinks that
window rather than closing it.

**This whole subsection is spike S-A.** The same-site claim, cookie behavior and
storage partitioning must be verified on this machine before the origin string is
baked into any client repo. If it fails, the honest fallback is to delete
"preview a login-walled app" from the product rather than to pretend.

Port is fixed, and never auto-incremented. Auto-incrementing turns the strongest
"an instance is already running" signal into a second full application with a
second write broker. When the port is busy, the app probes for its own health
route: our own signature means print a message and open the browser, anything
else means exit with the conflict named. A separate branch names the Windows
reserved port ranges, because binding inside one fails with a different error
than a port already in use, and the wrong branch produces a baffling message.

### 5.2 The preview, which never touches a file

**No client file is written before Apply.** The agent maintains one style element
in the client page holding the staged overrides. That is the entire preview
mechanism.

Writing a fenced block into the client's real stylesheet was proposed and
rejected outright: it is a write into real source on every preview, a color
picker drag emits dozens of writes per second each paying an antivirus scan and a
full Tailwind rebuild, it leaves the working tree dirty all session, a crash
strands the block, and it punches a hole in the tool's own staleness detection,
because the tool would have to carve its own writes out of its own tamper check.

**Preview teardown is part of Apply, not an afterthought.** On commit the server
tells the agent which staged entries were written, and any affected-instance
highlight for those entries is cleared in the same message. The agent removes exactly
those from the preview style, waits for hot reload or a bounded timeout, re-reads
the computed style for the touched properties, and reports back. The tray then
resolves each change to applied and verified, mismatch, or unverified because no
reload arrived. Without this the page would keep showing the override after
Apply, so a write that landed on the wrong node would look correct, which is the
exact failure the whole gate stack exists to catch.

**The preview is a direct instruction to the browser, not a copy of what will be
written.** For the eleven properties in section 3, the agent sets the property
directly on the element, and the browser renders it exactly. A value the client's
project has never used renders as precisely as one it uses everywhere, because
the browser is being told the value rather than being asked to find it. This is
section 3.6's separation doing its work.

An earlier draft assumed the opposite, that a value outside the project's
compiled styles could only be approximated, and it planned a label for that
state. **That assumption is retired for the property set the product actually
edits.** Whether it holds for every one of the eleven is a spike, not a belief,
and section 21 carries it.

The approximate state survives only where the spike proves it must, and where it
does it stays honest: the label travels with the change through Apply and into
the handoff, and it is never quietly upgraded. An earlier draft called it
"approximate now, authoritative after Apply", which is false whenever
verification is degraded, since that is exactly when an approximate preview stays
approximate forever.

### 5.3 How the agent gets into the page

One dev-guarded line in the client repo. In a Next App Router project it is a
script tag in the root layout, guarded on the development environment. In a Vite
project it is the same tag in the entry HTML, or a serve-only plugin that injects
it.

**That line is written through the same gated write path as a color change**:
same containment, same verified backup, same journal, same rollback. It is a
named tier in the broker, behind an explicit consent screen that shows the exact
diff, and it is reverted on detach. Treating it as a setup step outside the
safety story is precisely how it leaks into a client's pull request.

**It also carries a distinctive marker, and a guard enforces that the marker
never reaches a commit.** Section 14.2 carries that mechanism, and it is what
makes this line affordable to write at all.

The layout file is a component, so the client's fast refresh picks it up and no
dev-server restart is needed. That claim is spike S-H, because if it is wrong,
the never-touch-their-server rule collides with the MVP's core mechanism.

The agent's capability envelope:

- Served as a classic script, unauthenticated, holding no token, no repo path and
  no filesystem authority, and persisting nothing.
- It learns the panel's origin from its own script URL and refuses any message
  from a different origin. No query parameter, no embedded secret.
- Its message envelope carries a version integer from day one. This ships into
  client repos, and once it is in three of them the protocol is public and cannot
  be force-upgraded. A version integer costs nothing today and is unbuyable
  later.
- **Everything the agent sends is an untrusted hint.** It runs in the client's
  origin, shared with every third-party script that app loads. The server
  independently re-derives file, span and tier from its own scan and its own
  parse. The agent's messages carry opaque selection ids, never paths and never
  byte offsets.

### 5.4 Framing preflight, and the dev URL

At attach the server, not the browser, fetches the dev URL and reads the framing
headers. Next and Vite set neither by default, so the iframe renders for a
default repo. A repo whose middleware sets either is refused at attach with a
named diagnosis. A rewriting proxy is out of scope for v1: it kills Next's hot
reload and puts our code in the path of every asset, so a bug in it reaches the
owner as "the client's app is broken".

**The dev URL is used exactly as the client's dev server printed it, and is never
normalized to a numeric loopback address.** Next compares the origin hostname
against a default allowlist that contains `localhost` and not the numeric form,
so framing the numeric address of an app started as `localhost` gets the
hot-reload socket rejected and kills hot reload. Attach canonicalizes toward the
hostname the dev server printed and warns when a numeric address is pasted. Vite
is permissive by default, so this bites Next specifically. The plan's fact 4 said
the opposite, and section 24 retires it.

## 6. Reading the client repo

### 6.1 Scan

The scan records path, size and modification time. **It does not hash every
file.** Hashing is reading every byte, and on a twenty-thousand-file repo with an
antivirus intercepting each read that is minutes, not seconds. Hashing is lazy,
computed on first read of a file the tool actually touches, which is a handful
per session.

Bounded by a deny list of the usual build and dependency folders, an extension
allow list, a depth cap of 16, and a file cap. **Truncation is reported
explicitly, never silently.** A depth cap that is too shallow drops files in
ordinary monorepo layouts and reaches the owner as "this repo has no theme",
which is the worst possible error message.

**No repo-wide file watcher.** A default watcher on a client repo root opens a
directory handle across tens of thousands of directories and then receives a
permanent event storm from the client's own build output, on the exact channel
the UI depends on for staleness. The tool watches only the small fixed set of
files it has actually parsed or staged, plus a re-check on window focus. Content
hashing at Apply is the authority; the small watch set exists only so the tray is
not confidently wrong for an hour.

### 6.2 Trust tiers

The tier letters follow the product plan, with one new tier for the setup write.

| Tier | Edit class | Mechanism | Phase |
|---|---|---|---|
| 0 | The agent script line in the client's layout or entry HTML | gated write, consent screen, reverted on detach | 1 |
| A | CSS custom property values in `:root`, `.dark` and `@theme` | postcss span splice | 1 |
| B | Plain CSS and CSS-module declaration values | postcss span splice | 2 |
| C | Static string-literal class names, including a literal argument appended to a class-merging helper | Babel locate, splice | 3 |
| D | Theme objects and inline style literals | Babel locate, splice | 5, optional |
| Refused | Template-literal, ternary and identifier class names, variant maps, styled-components interpolations, generated or minified files, unstamped elements | named refusal plus a fix-list entry | never |

### 6.3 Token selection, which is the MVP's core operation

The byte mechanics are specified above in detail. The product semantics need
stating with equal care, because a real repo declares the same custom property
more than once.

The rule: the edit targets the declaration in the block the user is editing, and
the panel says which block that is. A value that resolves ambiguously across
blocks or files is a refusal that lists the candidates and asks, rather than a
guess at the one that probably wins. Light and dark are separate targets in the
panel, never one control writing two blocks.

## 7. Selection context

When the designer selects something, the product explains what he actually
selected, in design words. This is the answer to questions 1, 2 and 3 of the six
in section 1, and it is a first-class feature rather than a panel decoration.

The target shape, when everything is provable:

> Selected: Button
> Scope: shared component
> Used on 8 pages, 24 on this page
> Padding 12px, shared
> Text size 14px, from Body / Medium
> Background, from Primary
> Also changes at Tablet and Mobile
> Safe to edit

**Which of those lines appear depends entirely on what can be proven.** A field
that cannot be proven is absent or explicitly unknown. It is never approximated,
and an architectural relationship is never invented.

### 7.1 Three sources, named once

**The render anchor** is the live node in the client's page, reported by the
agent. It gives computed values, the class list, the ancestor chain, the matched
rules, and which width conditions currently apply. It is exact about what is on
screen right now, at this width, on this route, and it knows nothing about code.

**The definition anchor** is the file, line and column of the source element,
read off the element label. It is the only proof of component identity, and it
arrives with labelling.

**The static model** is the server's own parse of the client's CSS and markup
inside the scan bounds. It gives authored declarations with byte spans, theme
blocks, the theme configuration, the usage graph and the router layout. It is
exact about what is written and blind to what runs.

Two rules bind them. The agent's report remains a hint and the server re-derives
every span, tier and count, per invariant 6. And second:

**The agreement check.** After the server computes which declaration should win
for a property, it compares that declaration's resolved value against the
browser's computed value for the same property. **Disagreement is never resolved
in the tool's favour.** The property drops to read-only with the honest reason
that the tool cannot prove which rule sets this value.

This is the most important mechanism in the section. Without it, the entire class
of "the panel confidently displayed the wrong source" is invisible. With it, that
class becomes a named refusal. Its real agreement rate on a live page is a spike,
because if it disagrees often the panel is mostly read-only and that changes the
product.

### 7.2 What is provable before element labelling

The honest split, and it is better than expected: **everything about values,
sources, tokens, the cascade and responsive conditions is provable with the agent
alone**, because the agent runs inside the client's origin and can read the
client's own stylesheets. Labelling buys identity and code-side counting, not
value resolution.

So before labelling, the panel can say what the padding is, which rule sets it,
which token it resolves to, what it inherits from, how many elements on this page
that rule touches, and which widths override it. It cannot say "Button", it
cannot say "used on 8 pages", and it says so:

> Which component this belongs to is not known in this project yet.

The identity line is a refusal, not a guess. Inferring a component name from a
class signature was considered and rejected: it is exactly the invented
relationship the owner ruled out, and it fails silently on any repo that
customised its variants. The element's role in plain words from its tag is
honest; a component name from a pattern match is not.

### 7.3 The vocabulary

Terms with sharp definitions, because two words for one concept is how a
vocabulary rots and how a designer stops trusting labels.

| Term | What earns it |
|---|---|
| Local element | Its source sits in a page file, or its component has exactly one reference in a complete usage graph |
| Local override | The winning declaration reaches one element, while a losing declaration for the same property reaches more. Both facts computed |
| Shared component | Two or more references across two or more files |
| Design system component | The above, plus its file sits under the folder the repo itself declares as its component root. Without that declaration the term is never used |
| Global token | The value chain terminates at a custom property declared in a theme block |
| Shared value | Two or more elements reach the same value through something that is not a token: one rule matching many elements, or one component rendered many times |
| Used on X pages | X page files can reach this component through a complete reference graph. On an incomplete graph the phrase becomes "at least X pages", which is a different phrase meaning a different thing |
| X on this page | X nodes carrying this source location exist on the route currently shown |
| Responsive rules exist | At least one declaration for this exact property sits behind a width condition |
| Safe to edit | One provable write target, an unlocked tier, the agreement check passed, no conditional declaration for this property, and fan-out either one or shown |
| Cannot edit this here | No provable write target, with a named reason |

Four proposed terms were cut, and the reasons matter more than the cuts.

**"Shared design value"** sat between global token and shared value with no
boundary. The boundary a designer actually needs is whether changing it changes
the whole app or only these elements, which is exactly the token line. Two terms
with a sharp line beat three with a fuzzy one.

**"Shared spacing" and "shared color"** are not concepts. They are the shared
value concept scoped to a property, and the panel already names the property on
the row. "Padding 12px, shared" carries everything they carried, where he is
already looking.

**"Impact partially known"** describes the tool's state of knowledge and tells
the designer nothing to do. It becomes "safe to edit, one thing to know", with
the one thing named on the next line, always specific and never the phrase alone.

**A bare "Instances: 24" is cut outright**, and it is the most quietly wrong
field in the target shape. It reads as twenty-four things will change, but a
static count counts code references, is a lower bound, and includes usages that
never render. It splits into an exact count for this page and an explicitly
lower-bound count for the code, which costs one line and removes a false
certainty.

### 7.4 Where a value comes from

For each property the panel names the source: a value and whether it is local,
shared, or from a named token. The resolution walks from the rendered element,
through the rules that matched it, in cascade order, to the declaration that
wins, and then follows that declaration's value chain to a token or to a dead
end. It is the same walk on every stack; only the last hop differs between a
Tailwind theme block, a Tailwind config, a plain stylesheet and a CSS module.

The chain dead-ends honestly. A value produced by a color-mixing function, a
light-and-dark pair, or an arithmetic chain the tool cannot invert is shown as
its computed result with its source named as far as it was followed, and the
property is not editable through the token.

### 7.5 Design language, in and out

The panel says "Padding 12px". It never says the utility class. The class is
under the technical detail with everything else.

The translation runs both ways, and both directions read the client's own scale
rather than a framework default, so the numbers are that repo's truth. Forward,
a utility becomes a property and a value. Backward, the designer picks a value
and the product writes the utility that produces it, or, if there is none, offers
the three named choices from section 3.3.

A class with no clean design meaning is not translated into one. It is shown as
itself under technical detail, and the property it affects is marked as not
editable here rather than given an invented name.

### 7.6 Responsive, shown and not touched

A property with a width-conditional declaration is marked, the widths are named
in the designer's words rather than the repo's pixel numbers, and the values at
those widths are shown read-only.

Editing the base value while an override exists for that exact property is
Review, not Safe, and the acknowledgement names what he is not changing. That is
the whole purpose: he must never believe the value in front of him is the only
value controlling that property.

### 7.7 What the panel does not become

It is an inspector, not a metadata dump. It shows identity, the eleven editable
properties, and a conditions block that is **absent entirely when there is
nothing to warn about**. Nothing else. No specificity numbers, no rule lists, no
file paths above the fold, no tier letters, no confidence scores. Section 12.6
holds the full exclusion list, and it applies here first.

## 8. Blast radius, and what may be claimed about it

The first draft gave this four sentences inside the section about reading the
repo: the locator returns a usage count, the tray shows it, and Apply asks for
confirmation above a threshold. That is retired. A count is not a proof, a
threshold prompt showing a number teaches a designer nothing about what will
change, and the whole treatment was a warn-then-recover design in a product whose
stated order is prevent first.

Fan-out is now its own section because it spans reading the repo, the preview,
the agent protocol and the tray. It is the answer to question 4 of the six.

### 8.1 Six concepts that must never merge

These are different measurements. Mixing any two of them produces a number that
is confidently wrong.

| Concept | What it counts | Where it comes from |
|---|---|---|
| Source references | Places in the code that mention the target | Static parse of the scan corpus |
| Component usages | Places that render this component | Import graph plus JSX element analysis |
| Rendered instances | DOM nodes that exist right now | The in-page agent, one page at a time |
| Affected routes | Pages of the app that can reach the target | Route discovery plus the import graph |
| Selector matches | Elements a CSS rule applies to | The agent, or a static selector analysis |
| Visible instances | Instances currently on screen | The agent, current viewport |

The product may show several of them. It may never add them together, and it may
never label one with another's name.

### 8.2 The four proof levels

Every figure the product displays carries exactly one level. The level decides
what the interface is allowed to say, and it feeds the escalation ladder.

**Counted.** A complete enumeration over a closed set, with no unresolved edges
and no truncation. It requires all of: the scan reported no truncation, every
module edge resolved to a concrete file, no unreadable styling construct was in
scope, and re-running on the same bytes returns the same number. The interface
may state an exact number with no hedge.

**Observed.** Runtime evidence from the agent, for one page, in one state, at one
width, at one moment. It proves existence, never absence, so it is always a lower
bound for the app and an exact count for the page it came from. **The interface
may never drop the "on this page" clause.** It is part of the figure, not a
caveat on it.

**Bounded.** Complete inside a stated sub-scope and incomplete outside it, with
the incompleteness itself quantified: unresolved edges, unreadable constructs,
routes discovered but not visited, truncation. The interface says "at least N",
always with the reason and the size of the gap, never a bare N.

**Unknown.** The enumeration could not run. The interface shows no number for
that figure. It shows a named reason, and where useful a number for the
uncertainty instead, such as "6 places I cannot read".

**There is deliberately no "estimated" level.** Anything that would have been an
estimate becomes bounded, which is an honest lower bound, or unknown, which is no
number at all. An estimate rendered in the same typeface as a count is
indistinguishable from a count, and the one number this product cannot afford to
get plausibly wrong is the number whose entire job is protecting the client.

**The levels are enforced by the type system, not by review.** The unknown level
carries no numeric field at all, so a component cannot render a number it cannot
prove. That is a compile error rather than a code-review comment, and it follows
the same discipline as the backup receipt in section 4.2.

### 8.3 What each tier can prove

| Tier | Counted | Observed | Typically unknown |
|---|---|---|---|
| 0, the setup write | The one file, always | n/a | n/a |
| A, theme values | Declaration sites, and reach when the token is only consumed by readable constructs | Instances on the current page | Reach through dynamically composed class names |
| B, plain CSS | Declaration site, and selector text | Elements the rule currently matches on this page | Matches on routes not visited |
| C, class names on an element | The one source location, and component usages when every edge resolves | Rendered instances on the current page | Usages behind dynamic imports or computed keys |
| D, theme objects | Declaration site | Instances on the current page | Consumers that read the object dynamically |

The uncomfortable one is Tier A. **A theme value edit is the safest edit class to
write and the largest edit class in effect.** One variable rethemes the app. The
first draft shipped Tier A in the first release and deferred every blast-radius
mechanism to later phases, which meant the first shippable version would have
carried the product's widest operation with no radius model at all. Section 20
moves the model forward to sit with the edit class it describes.

### 8.4 Route discovery

Next's App Router and Pages Router both put routes on disk, so the route list is
readable without running the client's build. The honest limits: dynamic segments
and catch-alls are patterns rather than pages, route groups and parallel routes
complicate the mapping, middleware can rewrite anything, and a client-side router
can render a view that corresponds to no file. Vite has no file routing at all,
so its route list comes from reading the router configuration when one is
statically analyzable, and otherwise is unknown.

Consequently a **manual route list is a first-class feature on every stack**, not
a fallback. The designer names the pages he cares about, and those become a
closed set the sweep can be complete over. That converts a permanently bounded
figure into a counted one for the scope he chose, which is the only honest way to
reach the top level on a real app.

**A truncated scan can never yield the top proof level.** The scan's truncation
report gains a second consumer here: it caps confidence. Without that rule the
word "proven" is unearned, since the enumeration would be complete only over the
part of the repo the scan happened to reach.

### 8.5 Rendered instances, and the invariant it collides with

Rendered-instance discovery asks what is on the page right now. **The server
cannot re-derive that from any file.** The DOM is the only source, and it lives
inside the agent, which the architecture defines as untrusted. As first written,
invariant 6 made this leg impossible.

The resolution, stated so it is not mistaken for a softening: **invariant 6
separates authority over writes from evidence for display.** An agent hint may
never widen, narrow or retarget a write plan. It may inform what is highlighted
and which confidence level is shown. Any figure sourced from the agent is labeled
observed, which is exactly the label that says "this came from the page, not from
the files". The write plan is still re-derived server-side from the scan and the
parse, unchanged.

This also needs a new message shape. The first draft said the agent's messages
carry opaque selection ids and never paths or offsets, which is right for
agent-to-server traffic but leaves no way for the server to say "outline every
instance of this". A server-minted affected-set descriptor, resolved locally by
the agent, is added under the existing envelope version.

### 8.6 Showing the designer what changes

Three scopes, and the third one is named so nobody pretends it does not exist.

**This page.** Instant, always available. Hovering a shared-reach line outlines
every matching instance in the preview. This is the everyday case and it needs no
confirmation.

**A sweep across chosen routes.** Explicit and opt-in. The preview visits each
route in the designer's list, counts and captures, and produces a per-route
breakdown he can step through. It is opt-in because it navigates the client's
app, and the product does not move someone else's application around without
being asked.

**Everything else.** Routes behind a login, views that need particular
application state, and anything the router builds at runtime. The product keeps a
coverage ledger and says plainly what was not reached. A sweep that visited four
of seven routes reports four of seven, never "4 instances".

**The coverage ledger, which is what makes the sentence possible.** Every time
the agent handshakes, it reports the page it is on. The product keeps a list of
the pages seen this session, produced by the designer simply using the app, since
clicking a link inside the preview is his navigation and not the tool's. The
confirmation screen then quotes it: you have looked at 2 of the 6 pages this
affects. That sentence is the single most useful thing in this section, and it
costs nothing because it rides on a handshake that has to happen anyway.

It depends on one mechanism that must exist from the first release: **the staged
preview follows navigation.** When the page changes, the agent re-handshakes and
the whole staged override set is re-pushed, so his work does not vanish when he
clicks a link.

For a global theme value, highlighting is useless at that scale, and the product
says so rather than outlining eight hundred nodes: the honest statement is that
the value is used across the whole site, with the per-page breakdown available.

### 8.7 The escalation ladder

Two axes, because a change is small and unknown far more often than it is large
and known, and escalating only on size misses the dangerous case entirely.

| Level | Any one of these triggers it | What it costs the designer |
|---|---|---|
| Local | Every figure counted or observed, one source reference, at most one component usage, at most one route, at most three rendered instances | Nothing |
| Shared | 4 to 24 rendered instances, or 2 to 5 component usages, or 2 to 3 routes | The breakdown is shown on the change itself, no extra click |
| Broad | 25 or more instances, or 6 or more usages, or 4 or more routes, or 10 or more source references | A confirmation listing the affected pages with a per-page count |
| Systemic | 100 or more instances, or 4 or more routes on a theme value, or the edited file is reachable from a root layout | The Broad confirmation, plus the affected-instance preview must have been run once this session for this edit, or the designer explicitly chooses to apply without looking, which is recorded |
| Unknown | Any figure unknown, or unresolved edges, or unreadable constructs in scope, whatever the size | The Systemic gate, plus the named reason and the list of places that could not be read |

The numbers are chosen, and the document says so rather than dressing them as
measurements. Below four instances the designer is plausibly looking at what he
clicked. Twenty-five is deliberately above an ordinary list of cards or nav
items, so the gate does not fire on the routine case and go blind from overuse.
Four routes is where a flow becomes the product. Root-layout reachability is not
a count at all but the strongest structural signal available, and it is counted
even when the instance number is not. Spike S-F1 measures the real distribution
across the calibration repos and moves the boundaries to where they actually
separate a component edit from a system edit in this client population.

The ladder applies to the whole Apply, since the Apply is the unit of
correctness. An Apply inherits the highest level of any edit in it, and reaches
Broad on its own when it touches eight or more files, because a wide Apply is a
wide rollback.


### 8.8 What this costs while he is working

One fact makes the whole thing affordable, and it is worth stating plainly:
**reach depends on which declaration is being edited, not on the value it is
given.** Changing a color from indigo to teal does not change how many places use
it. So the entire computation is pinned at selection time and stays constant for
the life of that selection.

Consequently the hot path does no analysis at all. While he drags a stepper or a
slider, the panel sends the agent one thing: a value. No server call, no
re-parse, no re-count, one update per animation frame, and intermediate frames
dropped rather than queued.

The reach record is computed once on selection, inside the drawer's own opening
animation, and the match query travels down with it, which is what makes hovering
free. The usage index is built once at attach, in the background, and the panel
is usable while it runs; reach figures read as still counting until it lands.

**The numbers are recomputed from a fresh parse when the Apply screen opens**,
and that pass is the authoritative one. Everything shown earlier was advisory. If
a figure moved since staging, the screen says so in those terms: this is wider
than it was when you staged it, nine places now, six before.

One thing is never computed: an instance count for a page that was never loaded.
There is no honest way to derive it, and a plausible fabricated number is exactly
what this section exists to prevent.

## 9. The write path, gate by gate

The first draft numbered sixteen items and called them all gates. Four of them
cannot refuse anything. The revision splits them, because the designer is shown
refusals and never steps, and because inserting a real gate into a list of steps
produces a document where a gate number means different things in different
drafts.

### 9.1 Staging gates, per edit

- **Tier.** The locator classifies the target. Anything outside the unlocked
  tiers is refused with a named code and a designer-readable reason.
- **Provenance.** The server re-derives file, span and tier from its own scan and
  parse. Whatever the agent or the panel sent is a hint.
- **Coalesce.** Edits are keyed on file plus span, and the later replaces the
  earlier. An overlap is refused here, at staging, not at Apply. All spans for a
  file are computed against one pre-image.
- **Safety verdict.** Section 12's classification runs here, not at Apply,
  because prevention has to happen before an edit sits in the tray looking
  finished. A Blocked verdict cannot be staged at all.
- **Advisory post-image parse.** A cheap check that this edit would leave the
  file valid, so the tray can say so immediately. It can go stale, so it never
  replaces gate 8 below, and the document says that the way it already says gate
  7 never does gate 6's job.

### 9.2 Apply gates, in strict order

Any refusal aborts the whole Apply. There is no partial success.

1. **Single flight.** One Apply at a time, process-wide, with an idempotency key
   in the journal so a retried Apply returns the original result instead of
   writing twice.
2. **Instance.** The lock file is still held by this process with a matching
   command line.
3. **Containment**, per file. Fully resolve the target, or its nearest existing
   ancestor when the file does not exist yet, and fully resolve the root, then
   compare by relative path rather than by string prefix, because a prefix test
   would place a sibling directory inside the root. Additionally refuses any
   segment that is the git folder or a dependency folder, any Windows reserved
   device name, any alternate-data-stream colon, and any trailing dot or space.
4. **Identity**, per file. Open read-only, inspect the handle, refuse anything
   that is not a regular file, and refuse a file with more than one hard link.
   This is the gap path resolution cannot close: a hard link is a second
   directory entry pointing at the same file record, with no outside path to
   resolve to, and creating one needs no admin rights.
5. **Encoding.** Decode as UTF-8, refuse invalid sequences or a UTF-16 mark.
6. **Staleness.** The hash of the pre-image must equal the hash recorded when the
   span was computed. This is the only defense against a concurrent writer.
7. **Plan.** Ranges sorted, non-overlapping, in bounds, each range's current text
   equal to the text recorded at parse, and the owning node's shape re-asserted.
   Stated honestly: given gate 6 this re-parse is redundant against a concurrent
   writer. It defends against a bug in our own span computation or a stale label
   from an earlier build, which is the likelier failure. It is never presented as
   doing gate 6's job.
8. **Post-image validity**, per file, and new in the revision. Build the complete
   proposed file in memory and parse it with the same parser that located the
   value. If the result does not parse, refuse before anything is written.

   It sits exactly here for four reasons, each arguable. Not before gate 6,
   because a post-image built on stale bytes proves nothing. Not before gate 7,
   because there is no legitimate post-image without a validated plan. Before the
   snapshot, because the snapshot is the first step that writes anything into the
   client's repository, and refusing here costs only CPU. And it fits the
   existing shape: gates 3 to 8 are per file, 9 and 10 are per Apply.

   It costs almost no memory, which is the useful finding: **the verify step
   already builds this exact post-image.** The gate adds a parse, not a build,
   and the same object then flows through write to verify, which is a
   strengthening rather than an addition. What was parsed is provably what was
   written.

   Its honesty limit, which must stay written down: **it proves syntax, not
   meaning.** A splice that produces valid code with the wrong effect passes it.
9. **Snapshot.** One git snapshot per Apply, using a temporary index so nothing
   touches the client's index, working tree, branch or any ref outside our own
   namespace. If git is unavailable, that is a degraded mode, per section 13.
10. **Free space.** At least twice the total size of the touched files, because
    backups double the bytes and rollback itself needs room.
11. **Backup**, per file. Byte copy into the backup store, re-read off disk, hash
    matched against the pre-image, and only then is the receipt minted. Any
    unverifiable backup is a hard stop. No unbacked write, ever.
12. **Durability.** The manifest and the prepared journal record are written and
    fsynced before the first byte of any client write moves.

### 9.3 Apply steps, which execute and cannot refuse

13. **Write**, per file. Temp file in the target's own directory, since rename is
    same-volume only. Fsync, then rename over the target, with bounded retry on
    the Windows lock errors and a visible state naming the program holding the
    file. Exhaustion means rollback.
14. **Verify**, per file. Re-read and compare byte for byte against the
    post-image held since gate 8. Any divergence means rollback.
15. **Commit.** The terminal journal record, fsynced. Only now is the Apply
    reported as succeeded, and only now, and only if a visual measurement was
    actually taken, may the tray use the word applied.
16. **Rollback.** Any failure at 13 or 14 restores every already-written file
    from its backup in reverse order, verifying each restored hash. If a restore
    itself fails, everything stops loudly, naming the file, the backup path and
    the snapshot id. It never continues.
17. **Startup recovery.** A prepared record with no terminal record blocks all
    new work until a human resolves it. The recovery screen lists each file,
    compares its current hash against the before and after hashes, flags a file
    matching neither as a detected tear, and offers restore. It also sweeps
    orphan temp files inside known repo roots. **Session restore runs only after
    this is resolved**, because a torn Apply is a worse problem than a waiting
    tray, and staging on top of a half-finished write would hide it.

**Why temp and rename for client files.** A failed rename leaves the client's
original file untouched. A failed in-place write leaves it torn. No hot-reload
convenience is worth choosing the failure mode that corrupts a paying client's
source. The premise that file watchers mishandle rename is refuted for the
watcher Vite uses, which coalesces the rename into a single change event
precisely because every atomic-save editor writes this way all day. Whether
Next's Turbopack watcher does the same is unverified, and that is spike S1. If it
does not, in-place becomes a per-framework fallback for that one case, never the
default.

The residual honest window: between closing the read handle and the rename, an
external write could land and be clobbered. It is milliseconds, it is bounded by
the backup and the snapshot, and it is stated rather than papered over.

**Git snapshotting uses a temporary index, never the stash.** The stash's create
form takes a message rather than options, so asking it to include untracked files
succeeds, returns a valid id, and silently contains no untracked file, which
drops exactly the newly created stylesheet a design tool most often just made. It
also fails on a repo with no commits and leaves an object garbage collection can
prune. The temporary index recipe captures untracked files, honors ignore rules,
touches nothing the client can see, works on a repo with no commits, and survives
collection. The snapshot is secondary in any case: the per-file byte copy is the
primary undo, because the attached folder may not be a git repo at all, may be
mid-merge, or may have the target ignored.

### 9.4 The parser on the write path

Gate 8 puts a parser inside the broker, and the module table forbade the broker
from parsing. That contradiction is resolved rather than ignored: **the broker
never derives a plan from a parse. It may call a pure validator that returns a
verdict and never a span or a string.** The call runs from broker to locator,
which does not violate the locator's own rule against importing the broker.

Two consequences worth stating out loud, because they are what a reviewer should
check:

**The proof obligation changed shape.** The old argument for claim 3 was
topological: no printer is imported on the write path. That is no longer
sufficient on its own, because a parser now runs there with the post-image in
hand. The enforcement becomes a type rule in the style of the backup receipt: the
validator returns a verdict type that carries no string capable of being spliced
or written.

**A new temptation exists.** Both parsers ship printers in the same package.
Putting the parser on the write path puts a printer one import away, and the
first plausible refactor is "we have already parsed it, we may as well
normalize". So the write path imports the parser entry point only, and a test
asserts the generator module is absent from the broker's module graph.

The native-binary containment argument survives untouched: the broker and the
locator still depend only on postcss and the Babel parser, both pure JavaScript,
and gate 8 adds no dependency.

## 10. Durable staging sessions

**Read section 10.0 first. Most of this section is deferred out of the first
version, and building it early would be waste.**

### 10.0 What the first version actually needs

Settled 2026-08-30. **The first version applies one change at a time**: edit,
Apply, verify it landed, move on. Batching many staged edits into one Apply is
deferred to a later version. Section 11.0 carries that decision and its
reasoning.

That collapses this section's problem. If at most one change is ever waiting,
there are no hours of staged work to lose, so the elaborate durability below is
solving a problem the first version does not have.

**What the first version keeps**, because these are not the same thing and
conflating them is how this gets over-built:

- **The write journal, unchanged and non-negotiable.** It protects a crash in
  the middle of writing a file, which is a risk at any batch size, including one.
  It lives in section 9 and nothing here touches it.
- **A session record of what was applied**, which the handoff file and the
  session summary both read from. This is a log of completed work, not of pending
  work.
- **One pending change, held in memory and re-derivable.** Losing it costs one
  edit the designer can see on screen and redo in seconds.

**What is deferred to the version that adds batching**: everything from 10.1
onward. The append-before-acknowledge log, the recovery screen, the corruption
handling, the stale-source re-validation of a recovered session. All of it
becomes necessary the moment more than one change can be waiting, and none of it
is necessary before.

**The rest of this section stays written**, deliberately. It is the design for
the version that needs it, it was worked out while the problem was fresh, and
rediscovering it later would cost more than leaving it here. Treat it as a
specification with a date on it, not as first-version scope.

### 10.1 The shape, for the version that batches

The first draft said the staging tray was not fsync-critical, "since losing it
loses staged edits rather than files". That reasoning is retired for any version
that lets edits accumulate. A designer may work for three to six hours and gather
hundreds of changes before he applies anything, and losing that because a laptop
slept is a product-killing failure even though not one client byte was at risk.

Staged edits stay out of the client repo until Apply. That never changes. What
changes, once batching exists, is that staged work becomes durable on our side.

### 10.1 The shape

**The staging log is the authority, and the tray is a fold over it.** Every
completed edit is appended to a log and written to the operating system before
the server acknowledges it. Snapshots exist only to make startup fast and to
survive media damage. They are never trusted beyond a sequence number they carry
inside themselves, and discarding one is always safe.

The roles are inverted from the obvious split, and deliberately. The obvious
design makes the snapshot authoritative and the log a backup. That design loses
work whenever the snapshot is newer than the last good record. This one cannot,
because nothing is ever deleted on the strength of a snapshot having been
written.

So the storage tree holds **four artifacts, not three**. The apply journal is
unchanged, fsynced per record, apply lifecycle only. Beside it now sits a session
log, appended per completed edit, and the tray snapshot, which becomes a
compaction of that log rather than the source of truth.

**Why the two journals stay separate**, since a reviewer will ask why one file
cannot do both. They have different durability contracts. The apply journal is
fsynced per record because a lost record leaves a client's file in an unknown
state. The staging log is group-committed because a lost record costs one design
tweak. Merging them either drags the apply journal down to a quarter-second
window, breaking invariant 11, or forces hundreds of staging records up to
per-record fsync for no benefit. The first draft already refused to make one file
be both an fsynced journal and a rewritable staging store; this keeps that
promise instead of quietly walking it back.

### 10.2 What counts as a completed edit

This is the load-bearing definition, because it decides both what is durable and
what a fsync costs. A color picker drag emits dozens of values a second and a
slider likewise, and persisting every intermediate value would be both wasteful
and wrong: the designer did not make forty decisions, he made one.

An edit is completed at the commit point of the control: pointer release on a
drag, a swatch click, blur or Enter on a typed value, and the settling of a
keyboard repeat run after a short idle window. Everything between commit points
is a live preview, which lives in the page's memory and is never persisted.

**The maximum acceptable loss, as two numbers, because there are two failure
classes and conflating them is how the first draft got the wrong answer.**

Application crash, browser crash, panel reload, Rocket Editor restart, or the
process being killed: **zero completed edits lost.** The record reaches the
operating system before the acknowledgement that turns the change chip to saved.
Zero is free here, so anything above zero is indefensible.

Machine crash, power loss, hard reset: **at most a quarter second, and at most
eight completed edits, whichever binds first.** The time bound is chosen so the
loss is smaller than one human action, so the answer to "what did I lose" is "the
last thing I did, maybe". A designer's fastest sustained deliberate cadence is
two to four edits a second, so at this window the expected loss is zero or one.
Below it the flush rate starts to be felt in the hand on a slow disk. The record
cap exists because a burst can put many completed edits inside one window, and
the cap keeps the loss bounded in edits, which is the unit the designer thinks
in.

Both numbers are set by spike S-D, which measures the real flush cost on this
machine with Defender active. If it comes back fast enough, both collapse to zero
and the promise becomes unconditional.

### 10.3 Recovery

A clean shutdown is not an event. He closed the app with work waiting and expects
it back, so it is restored silently under a banner that says how much is waiting,
with a way to review or discard.

A crash is an event, and it gets a dialog with at most two actions and a link to
detail. The four outcomes a recovered edit can land in are **ready**, **still
fine**, **needs a look** and **gone**, and they are the only vocabulary the
screen uses. Nothing in it surfaces a hash, an offset, a sequence number, a
branch id or a file mode.

The interesting case is not the crash, it is what changed while the process was
dead. **The session epoch cannot be trusted across a restart**, because the
epoch is maintained by a live watch and nothing watches a dead process. So
recovery re-derives it: it re-hashes the small set of files that carry staged
edits, and reports the result per edit. A file that is unchanged gives a ready
edit. A file that changed elsewhere but not where the edit sits gives a still
fine edit. A file that changed under the edit gives one that needs a look. A file
that is gone gives an edit that is gone.

**Preview is re-injected only for ready and still fine edits.** An edit whose
place in the file can no longer be found is listed but not previewed. Rendering
an override for a change the tool can no longer place would be the product lying
about the state of someone's code, which is the exact failure the gate stack
exists to prevent.

**Staleness is shown at restore, not deferred to the Apply gate.** That is the
prevention rule applied literally: the designer learns that nine of his changes
need attention when he sits down, not forty minutes later when he presses Apply.

Damage is handled by reading as far as the log is valid and stopping rather than
guessing past a torn record. The damaged file is kept, never deleted, and the
designer is told how many changes were recovered and where the file is. A log
written by a newer version of the product is refused with its version named, and
again nothing is deleted.

### 10.4 The words

The steady state is an indicator the designer already knows from every document
editor: all changes saved, saving, or not saving with a way in. No timestamps
while the answer is always yes.

The recovery dialog names what survived rather than counting what did not, states
the risky option in the words of its risk, and never offers a machine token. A
representative case, with some changes stale:

> **Recovered your editing session**
> 184 changes: 171 ready, 9 still fine (their files changed somewhere else), 3
> need a look, 1 gone, that file is not there any more.
> I will show you the 4 that need attention first. Nothing gets written to your
> files until you press Apply.
> Review the 4 · Continue anyway · Discard all

### 10.5 What this costs elsewhere

The storage argument against a database has to be re-argued rather than left
standing, because a replay-on-startup workload is exactly what a database is for.
It still holds: the log is append-only newline-delimited records, a human can
truncate it at the last valid line, and there is still no query workload. But a
reviewer will attack here first, so the argument is made explicitly rather than
inherited.

Our own files keep the same retry loop and orphan sweep as before. Session logs
accumulate the way backups do and need the same prune story, which makes the
operational-cost list nine items rather than eight.

## 11. The lifecycle of a staged edit

### 11.0 One change at a time, in the first version

Settled 2026-08-30. **Edit, Apply, verify it landed, move on.** The first version
does not stack unrelated changes into one Apply.

The reasoning is the owner's and it is a product argument rather than a technical
one: start simple, prove the machinery works smoothly on the simplest possible
unit, build up real experience with it, and add batching in a later version once
there is evidence about how it actually behaves. Saving is the part with the most
ways to go wrong, so it is the part that should carry the least ambition first.

**What this buys.** Every change is verified in isolation, so a failure names
itself: there is exactly one edit it could have been. It removes an entire class
of partially-applied states from the first version. And it lets the first release
be judged on whether the loop feels right, which is the thing that cannot be
answered on paper.

**What it costs, stated honestly.** Each Apply waits for the client's app to
rebuild before verification can run, so a session of many small adjustments is
slower than it would be with batching. That cost is accepted deliberately and is
the reason batching returns later.

**Nothing is built and thrown away.** The write path was designed to apply
several files atomically with all-or-nothing rollback, and that stays exactly as
it is; the first version simply exercises it with one file at a time. Batching
later is a change to what the tray holds and what one Apply contains, not a
change to how bytes reach disk. The two places that feel the difference are
section 10, which loses most of its first-version scope, and the tray, which
holds one pending change rather than a list.

**The one first-version case that still writes two files** is promoting a local
value into the shared system, which is a later phase anyway. When it arrives it
uses the multi-file path that was always there.

**Everything below describes the general model**, including states that only
occur once several edits can be pending. It is written that way on purpose, so
the later version does not need it rewritten.

Every question of the form "what happens if X while Y" gets answered here rather
than scattered across sections. The state lives explicitly on each edit.

| State | Events that move it, and where to |
|---|---|
| staged | Edited again at the same span: replaced in place. Discarded: gone. Apply: to applying. External change to the file: to stale. Branch switch: to stale. **Process restart: restored from the log, epoch re-derived, then to staged or to stale.** |
| applying | Success: to applied. Any gate refusal: back to staged with the reason. Crash: the recovery screen owns it. |
| applied | A post-Apply measurement matched: to verified. Measurement differed: to mismatch. No measurement possible: to unverified, with its reason. |
| verified | Terminal, until an undo moves it. |
| unverified | Re-measure when the preview returns: to verified or mismatch. Accept: terminal, and the unverified mark travels into the handoff. Roll back the Apply. |
| mismatch | Offers rollback of that Apply, or accept. |
| stale | Offers rebase onto the new pre-image, or discard. Apply is blocked while any edit is stale. |

The verified and unverified rows are new. The first draft named both states in
the transitions out of applied but gave neither a row, which left their exits
undefined, and section 13 makes that unacceptable rather than merely untidy.

Two whole-session events matter as much as the per-edit ones.

**The client repo changes underneath the session.** A branch switch, a file
deleted or renamed, a dependency reinstall. Any of those bumps the session epoch,
carried on every staged edit, and a stale epoch puts the tray in the stale state
and blocks Apply. The Apply-time staleness gate catches a byte change to a parsed
file; the epoch catches the structural changes that gate does not model. Across a
restart the epoch is re-derived rather than trusted, per section 10.3.

**The client's dev server dies, restarts, or moves port.** The iframe is
cross-origin so its error page is unreadable. The signals are the agent going
silent and a server-side poll of the dev URL. A moved port offers to update the
attached dev URL, because Next stepping from 3000 to 3001 when an old process
still holds the port is a weekly occurrence, not an edge case.

The first draft said the session reports one field for this: up, down or moved.
That is retired. **Verification capability is a separate axis from dev-server
status**, because verification can be impossible while the server is perfectly
healthy: the agent is silent, the panel was closed, the iframe navigated
elsewhere, hot reload never fired, or the edited element is not rendered on the
current route. Section 13 owns that axis.

## 12. The designer safety model

The engineering safety is in section 9. This is the designer safety, at the same
level of rigor, and it is a different axis.

The tier classifier answers: **can the tool prove this styling form safe to
write?** That is a code question, owned by the locator. This layer answers:
**will this change surprise the designer?** That is a design question, composed
from blast radius, verification capability, preview fidelity and staleness.

They are orthogonal, and Tier A proves it: **a theme value edit is maximally safe
to write and maximally large in effect.** Green on one axis, at least Review on
the other. The two must never collapse into one verdict, and where a combined
verdict is displayed, the composition rule is that safe-to-write plus huge reach
never resolves to Safe.

### 12.1 The three states

| State | Definition | What the designer experiences |
|---|---|---|
| Safe | The exact target is proven, the impact is fully enumerable, and that impact is no larger than the door he came in through | Nothing is said. The action runs. |
| Review | The change is valid and provable, but reaches further than his entry point implied, or one leg of verification is missing | A named statement of the impact, and one decision he makes once |
| Blocked | The target cannot be proven, the impact cannot be enumerated, or recovery cannot be guaranteed | The refusal, the reason, and at least one action that leads somewhere |

### 12.2 Review is relative, not absolute

This is the most important decision in the section, and the naive alternative is
wrong for this product specifically.

The naive rule is "a global token or high fan-out means Review". **The first
release is nothing but editing global tokens.** An absolute threshold paints
every action in the only shipping feature yellow, and a warning that fires on
every action is read zero times.

So the state is computed from **the gap between the scope the designer declared
by his entry point and the scope the system computed.**

Scopes, in ascending rank: one element on one screen; one usage of a component;
every place a component appears; everything styled by one stylesheet; one theme
value in one mode; one theme value across the site; the project's setup.

Doors declare scope. Clicking an element in the canvas declares the narrowest.
Clicking with "apply everywhere" armed declares the component. The theme panel
declares the whole site. The light and dark tabs inside it declare one mode. The
attach and setup screens declare configuration.

If the computed scope is no higher than the declared scope, the change is Safe on
this axis. If it is higher, it is Review. If it cannot be computed at all, it is
Blocked.

Editing the primary color from the theme panel is **Safe**: the door promised the
whole site and the whole site is what changes.

Clicking one button in the canvas and discovering its background resolves to that
same primary color used to be **Review** on its own, because the door promised
one element and the answer was the whole site. **Section 3.7 changed that, and
for the better**: the canvas now defaults to giving that element its own value,
so the promise is kept and the state is Safe. Choosing everywhere is what raises
the scope, and because he chose it, the product names what moves rather than
warning him that something surprising just happened.

Same bytes, different state, because the state still models the designer's belief
rather than the diff. What changed is that his belief is now something he
declares with a control instead of something the product has to infer.

### 12.3 Resolution

The verdict is the worst of every axis, and **Safe is a conjunction, not a
default**. Every one of these must hold: the target is proven exactly; the tier
is unlocked; the computed scope does not exceed the declared scope; the source is
fresh and the epoch current; the impact is fully enumerable; the preview is
exact; verification is available; the backup is ready; no responsive override
diverges from what is being edited; the session is a normal size; and undo is
linear.

Blocked, and why each is Blocked rather than Review: the target is not proven,
because there is nothing to change safely and a guess is the failure mode with no
cheap recovery. The tier is refused, per claim 3. The source is stale or the
epoch superseded, because the base the design decision rested on no longer
exists. The impact cannot be enumerated at all, because consent to an unknown is
not consent. The backup is not ready, per invariant 1. An undo would destroy
newer work. Any Apply gate refused, because the engineering layer already said
no. And selecting in the canvas while the site is down, because there is no page
to click, which is impossible rather than merely unverified.

Review, in the common cases: the computed scope exceeds the declared one; some
usages resolved and some did not; the preview is approximate because the staged
style is not in the client's compiled CSS; verification is unavailable at Apply;
a responsive override exists for the property being edited; the session is large;
the git snapshot is unavailable, so the secondary undo is missing while the
primary byte backup still holds; and the Tier 0 setup write, because it writes
into a file the designer never opened.

**Size never produces Blocked.** A large Apply is not less safe, since every gate
runs per file regardless. It is less reviewable, and the remedy is a better
review screen, not a refusal. Large is whichever fires first: twenty or more
staged changes, six or more files, three or more components, or three times the
median of the last ten Applies on this repo once ten exist. The absolute floor
exists because a fresh repo has no history; the relative rule exists because
twenty changes is a routine day on one client and an alarming one on another.

### 12.4 The Blocked contract

Four parts, in this order, and the third is mandatory.

1. **What could not be verified**, as a headline of at most eight words, in nouns
   the designer uses.
2. **Why it matters**, one or two sentences, stated as the consequence that was
   avoided rather than the rule that fired.
3. **What to do next**, between one and three real actions, **at least one of
   which is executable inside Rocket Editor**. "Contact a developer" is never the
   only option.
4. **The technical detail, folded away.** The code, the gate, the file, the
   evidence. One click to open, one click to copy. It exists because this
   product's escape hatch is handing a file to a coding agent, and that agent
   needs the code.

**A Blocked state with no executable action is a bug in the registry, not an
acceptable outcome.** That is the rule that stops the disabled-control failure
the owner named.

A representative row, so the standard is concrete rather than described. The
machine reason is a refused template-literal class name at a file and position.
What the designer sees is: **This styling is decided while the page runs.** The
colours and spacing here are assembled by code each time the page loads, so there
is no single written value to change, and changing the wrong piece would affect
this element everywhere it appears. The actions are: edit its theme value
instead, which opens the theme panel at the value this element resolves to; add
it to the fix list; or show the technical detail.

### 12.5 The eleven accident scenarios

Each is handled at the earliest point in prevent, explain, confirm, recover that
can carry it.

**Editing a shared component while believing it is local.** Prevented by the
scope gap in 12.2: the door said element, the answer says component, so it is
Review before the control is even touched, with the reach named in the drawer.

**Changing a global token unknowingly.** The same mechanism. It is Safe from the
theme panel and Review from the canvas.

**Changing something used across many pages.** The escalation ladder, with the
per-page breakdown and, at the top rung, a preview sweep or an explicit recorded
choice not to look.

**Working from stale source.** Blocked, not Review. The base of the decision is
gone.

**Recovering a session after the repo changed.** Section 10.3, and staleness is
shown at restore rather than at Apply.

**The branch changing mid-session.** The epoch bumps, the tray goes stale, and
the branch name is shown, because "which version am I editing" is a real design
question and the branch name is its only honest answer.

**A very large change set.** Review, with a review screen worth reading. Never
blocked.

**Applying while verification is unavailable.** Section 13.

**Accidentally editing the wrong responsive width.** Detected, per section 7, and
Review when an override exists for the exact property being edited.

**Applying a change whose impact cannot be fully enumerated.** The unknown rung
of the ladder, regardless of size.

**Undoing an older Apply after newer work exists.** Blocked, with the option to
undo the newer one first or restore only the untouched files.

### 12.6 What the designer sees, and what he never sees

**The trust signal is the sentence, not a badge.** The product is sure of an
element exactly when it can name, in the designer's own vocabulary, what it will
change and where that value comes from. So the certainty display is that name.
When the sentence can be completed, it is shown and no badge is needed. When it
cannot, the product says the sentence it cannot finish.

A selection is traced, partly traced, or not traced. Three states, no more; a
fourth would make him learn a scale.

A staged change reads: ready to apply, needs your decision, the file changed and
needs a refresh, preview is approximate, applied, written but not checked, or
applied but it looks different.

**The word "applied" is reserved.** It may appear only on a change that was
written and visually verified. Never "done", never "success", never a green check
on an unverified write. That single reserved word does most of the work of
section 13.

Committed exclusions, because a safety layer that decorates everything protects
nothing:

- **No ambient badging of the canvas.** The pre-flight classifier must not paint
  every element with a marker. A canvas that is half yellow is a canvas nobody
  reads, and it makes the client's product look broken while the designer works
  in it. Lock markers appear on hover and on selection only. This is a change to
  the phase-3 description in the first draft.
- **No check marks on the normal state.** If every row carries a green check, the
  one row missing it is invisible, and that is precisely the row that matters.
- **No confidence percentages.** They invite a judgment he has no basis to make,
  and they are a way of not committing to a state.
- **No tier letters, gate numbers or error codes above the fold.** All available,
  all copyable, none surfaced.
- **No file paths in primary copy.** Pages and components are the nouns. The
  recovery screen is the exception, where a path is the whole point.
- **No hashes, offsets or spans anywhere above the fold.**
- **No git vocabulary except the branch name.**
- **No toast for anything that matters.** A toast expires whether or not it was
  read. Review and Blocked states live in the tray or the drawer until resolved.

## 13. Degraded modes

The first draft had degradations in three places with three treatments: git
unavailable at the snapshot gate, an approximate preview, and verification after
Apply. The revision adds a fourth, a truncated scan capping blast-radius
confidence. Four ad-hoc degradations with no shared concept is how one of them
quietly stops being shown.

They get one home. **A degradation is not an error and does not fit the error
registry's shape**: nothing failed, a capability is absent. It carries what is
unavailable, what that costs, whether it is still true, and how it resolves.

### 13.1 Verification, the one that matters most

Apply remains permitted while the client's dev server is down, because a write is
a disk operation and has nothing to do with their server. What changes is that a
mechanically successful write can never again be mistaken for a verified one,
including three weeks later.

Three properties, and the third closes the hole:

1. **It cannot be dismissed into invisibility.** The banner persists until
   verification runs and passes, or the designer explicitly accepts without
   checking.
2. **The acceptance is recorded**, per change, in the session and the apply
   manifest.
3. **It travels into the handoff.** The file handed to the client's team lists
   unverified changes in their own section. A write nobody looked at is a fact
   about the deliverable, not a transient interface state.

A modal at Apply time alone was rejected: it is dismissed, and afterwards the
session looks identical to a verified one, which is the confusion being designed
against.

The wording before Apply, in place of the normal confirmation:

> **The site is not running, so nobody can see the result**
> Rocket Editor can still write your 6 changes into the project's files. That
> part does not need the site. What it cannot do is show you what they look like,
> or check that they landed where you meant.
> Rocket Editor never starts or stops your site. That one is yours to run.

The actions, in order: keep them staged, which is primary and safe; check again;
apply without seeing them; show me how to start it. **"Apply without seeing them"
is deliberately the longest label on the screen.** A label that describes its own
cost is itself a prevention mechanism.

Afterwards a persistent, non-dismissible banner says six changes were written but
never checked, with the options to check them now, undo all six, or accept
without checking. Tray rows read "written, not checked", never "applied".

When the site comes back, verification runs on the unverified set automatically
without being asked, and resolves the banner. If everything matches, that message
may expire on its own, and it is the only expiring message in the product,
because it carries no decision.

One related case is Blocked rather than degraded: clicking elements in the canvas
while the site is down. There is no page to click, so selection is impossible
rather than unverified. The canvas says so and offers the theme values, which are
read from files and do not need the site.

### 13.2 The other three

An unavailable git snapshot is Review: the secondary undo is missing while the
primary byte backup still holds, and the designer is told exactly that.

An approximate preview is expected to be rare or absent for the eleven editable
properties, because the preview instructs the browser directly rather than
reproducing the project's own styling, per sections 3.6 and 5.2. Where the spike
finds a case that genuinely cannot be shown exactly, the state remains and stays
honest: stated on the change, carried through Apply, and never quietly upgraded.

A truncated scan caps blast-radius confidence below the top level and says which
parts of the project were not read.

## 14. Undo, detach, and the handoff

### 14.1 Undo

**Undo is a distinct verb, not a reverse edit.** It backs up the current state,
then writes the exact backed-up bytes back through containment, identity,
encoding, post-image validity, backup, write and verify.

**Undo is linear per file.** The manifest records, per file, which Apply it
superseded. Undoing an Apply when a later Apply touched the same file is refused
with a named reason that points at the recovery screen, and offers to undo the
newer one first or to restore only the files the newer Apply did not touch. It
never silently destroys newer work.

Retention prune states how many sessions of undo it removes and refuses to prune
the newest. Nothing prunes automatically, because automatic deletion of the only
copy of someone's file is not a feature.

### 14.2 Detach

Two verbs. **Prove clean**: sweep the repo for our marker, enumerate and delete
our snapshot refs so they do not accumulate in the client's repository forever,
sweep orphan temp files, and verify the setup script line is gone or say who
committed it. **Summarize**: the union of applied files and ranges, which the
manifests already hold, rendered for a human.

#### How the work actually reaches the client

Settled 2026-08-30, from how Rotem already works, and it is narrower than the
product might have assumed.

He clones the client's repository locally, makes his changes, pushes them to a
branch of his own, and their team reviews that branch and decides whether it
reaches their main line. **Every one of those steps is his, performed in his own
git client. The product does none of them.**

So the product's delivery obligation is smaller and sharper than a handoff
feature: **leave the working files in a state that survives their review.** That
is the byte-splice discipline in section 4.5 earning its keep, since what their
engineer opens is a one-line change rather than a reformatted file.

The summary and the handoff file are **material for the description of that
review, and input for a coding agent**, not a delivery mechanism. Nothing about
them should imply the product hands anything to anyone.

Two consequences worth stating because he pushes real branches:

- **The safety snapshots never travel.** They live outside the ordinary branch
  namespace, so a normal push does not carry them, and detach deletes them.
  Nothing the product created for its own protection appears in the client's
  review.
- **Never create a branch, never commit, never push.** Already an invariant, and
  it is now clear why it matters in practice rather than in principle: the branch
  is his working surface with his client, and a tool writing into it would put
  words in his mouth.

**Other arrangements exist**, and he expects this to be the common one rather
than the only one. Nothing above depends on the branch flow, because the product
stops at the working files either way. A client who wants a written summary
instead gets the same file; a client who reviews a working tree directly gets the
same diffs.

#### The footprint guard

Settled 2026-08-30. The product needs one line inside the client's project to see
into the running page, per section 5.3. That line is dev-only, and it is removed
on detach. But the push is his, performed in his own client, on his own schedule,
and nothing in the product sits between him and it. **So the line must be made
unable to travel, rather than merely likely not to.**

Three layers, in order of when they act.

**One, the panel says so.** While the line is in place, the panel carries a
visible, persistent marker naming that state and offering to remove it in one
action. Not a notification that can be dismissed and forgotten; a state the
interface is always showing.

**Two, a hook refuses the commit.** The product installs a commit-time hook in
the attached repository that refuses any commit containing the product's marker,
naming the file and the line, and telling him exactly what to do. Commit-time
rather than push-time is deliberate: once the line is committed, getting it out
means either rewriting history or adding a second commit that says what the first
one did. Blocking the commit means it never enters the record at all. A push-time
check runs as well, as a backstop for anything committed before the repository
was attached.

**Three, the guard reports that it ran.** On a clean commit the hook prints a
short confirmation rather than passing in silence. **A guard that succeeds
silently is indistinguishable from a guard that is missing**, and the whole point
of this mechanism is that he can trust it without inspecting it. The panel
mirrors the same fact in its own words, because a desktop git client may not show
hook output at all, which is spike S-HOOK.

Five details that decide whether this actually works.

- **The hook is not part of their code.** Git keeps hooks outside the tracked
  tree, so it is never committed and never pushed. Its footprint in the client's
  repository is zero, which is what makes this affordable.
- **It is still a write into their folder**, so it goes through the same gated
  path as everything else: consent, backup, journal, and removal on detach.
- **An existing hook is never overwritten.** Many projects already use one, often
  through a hook manager that redirects where git looks. The product detects
  that, adds itself alongside rather than replacing, and if it cannot do so
  confidently it refuses to install and says so, rather than silently disarming
  their tooling or its own.
- **The check covers every footprint the product can leave, not just the script
  line.** Named in full, because a guard is only worth what it enumerates: the
  marker in any tracked file; the labelling package entry in their dependency
  file and its lockfile; the labelling line in their build configuration; any
  leftover temporary file; and any snapshot reference. The last is belt and
  braces, since snapshots live outside the ordinary branch namespace and a normal
  push cannot carry them.

  The labelling footprint is the one that matters most here and it was easy to
  miss. It is heavier than the script line: two tracked files rather than one,
  and both are files a reviewer reads closely. A dependency appearing in a
  client's project without explanation is worse than a stray line of markup,
  because it looks like a supply-chain change rather than a leftover.
- **It is a guard, not a jail.** Git offers a documented way to skip hooks, and
  the product does not pretend otherwise. It defends against forgetting, which is
  the actual risk, not against a decision to override it.

**What this changes about asking a client, and it is more than it first looks.**
Under this guard, nothing the product puts in the folder can reach a commit. The
branch Rotem pushes carries design changes and nothing else, and their team never
sees the script line, the dependency or the build configuration line.

So **there is usually nothing to ask permission for.** What the product installs
lives in his own working copy, on his own machine, for the hours he is working,
and it is removed when he disconnects. That is the same category as the editor he
uses or a browser extension he runs, and no consulting arrangement expects to be
consulted about those.

The cases where he would still raise it are narrow and they are his judgement,
not the product's: a contract that speaks specifically about tooling or
dependencies, a client whose security process covers anything installed against
their code, or simply a preference for saying it out loud. **The product should
make that easy and must never make it mandatory**, because a tool that insists on
an unnecessary conversation costs him standing every time he uses it.

This is the real payoff of the guard, and it is worth stating plainly: it turns a
permission question into a private working detail.

### 14.3 The QA handoff file

A third verb, with a different audience and a stable shape. At the end of a
session the product generates a structured, vendor-neutral Markdown file,
`ROCKET-EDITOR-QA.md`, entirely from information it already holds. The designer
then hands it to an external coding agent or to the client's engineer.

**Rocket Editor contains no AI and never calls one.** This is the seam where
judgment enters the workflow, and it is deliberately outside the product.

The responsibility boundary, stated once and never blurred:

> Rocket Editor proves that it changed exactly what it intended to change.
> The external agent reviews whether the resulting product still behaves and
> looks correct as a whole.
>
> Safety is deterministic. Judgment is external.

The file carries: the session summary; the scope of what was proven; the design
values changed, with before and after in design units; the component styling
changed, by component and page rather than by file path where possible; the files
written; verification results per change, including everything unverified and
every mismatch; refused edits with their reasons; the blast radius of each change
with its proof level; recommended review, specific to what actually changed
rather than a generic checklist; how to revert; and a machine-readable companion
block for the agent to parse.

**Design intent is reported, never inferred.** A deterministic product cannot
know why he did something. It can state exactly what he did, in design language:
which value moved from what to what, which properties on which components, and
which breakpoints carry overrides that were not touched. Anything requiring
inference is out.

The recommendations are derived from the session rather than boilerplate. A
session that touched two shared components recommends a regression pass on those
components' pages by name. A session with three unverified changes recommends
looking at those three first. A session that edited a value with responsive
overrides recommends checking the narrow widths, since the product refused to
touch them.

Two things about it are open decisions rather than settled, and section 22 lists
both: **where the file is written**, since putting it in the client repo makes it
a file creation rather than a mutation and collides with the prove-clean sweep
that would then delete it, and **whether it is one artifact with the fix-list of
unmakeable edits or two**, since the first draft scheduled a separate Markdown
fix-list for the same audience in a later phase.

Determinism also needs a definition rather than an assertion, given how strict
this document is about bytes elsewhere: stable ordering with no timestamps or
identifiers that vary between runs, and a schema version, so two identical
sessions produce identical files. There is a spike that proves it by diffing two
runs rather than claiming it.

## 15. Module boundaries

| Module | Owns | Forbidden from |
|---|---|---|
| http | Routes, the request guard, the event stream, static serving | Touching the filesystem, holding product logic, knowing a repo path beyond passing an id |
| core | Detection, tiers, staging, orchestration, the doctor, the safety verdict, the session lifecycle | Importing the HTTP framework, seeing a request object, any write except through the broker |
| broker | **The only mutation authority outside our own data folder.** Containment, identity, backup, journal, splice, write, verify, rollback, restore | Deriving a plan from a parse; it may call a pure validator that returns a verdict and never a span or a string. Network. Spawning. **Deleting a client file, a capability the module does not have.** Widening its own scope |
| locate | Span computation, value sub-range derivation, tier classification, refusal codes, the post-image validator | Any write, importing the broker, emitting a span without the literal text it was computed from |
| fanout | Route discovery, the import graph, usage enumeration, proof levels, the escalation ladder | Writing anything, claiming a level the evidence does not support |
| snapshot | Git plumbing through a temporary index | Any command that mutates the client's index, working tree, branch, or any ref outside our namespace |
| store | Our own state, the apply journal, **the session log and its replay**, the backup store, the lock file | Touching anything outside our own data folder |
| scan | The bounded walk, the inventory, lazy hashing, the small watch set, the truncation report | Reading file contents in bulk, hashing at scan time |
| handoff | Prove clean, summarize, generate the QA file | Writing anything except through the broker |
| contract | Shared schemas, inferred types, the error and degradation registries, the versioned agent envelope | Importing from the server or the UI |
| ui | Rendering, selection and hover state, drawer state | Holding authoritative staging state, computing byte offsets, deciding what is safe to edit, **authoring explanation text** |
| agent | Overlay, selection, computed-style reads, the in-memory preview style, **affected-instance highlighting** | Any network call except a message to the pinned parent origin, holding any token, knowing any path, persisting anything, being trusted |

Three rows changed in the revision and one is new. The broker's ban on parsing
became a ban on deriving a plan from a parse, per section 9.4. The store gained
the session log. The agent gained highlighting. And the panel is now forbidden
from authoring explanation strings: they come from the contract, or they drift
out of sync with the registry within a month.

`fanout` is new because two of its four legs had no owner. Route discovery is a
repo-structure concern, not a span-locator one, and rendered-instance discovery
is an agent concern. Leaving both under `locate` was how a count became "just a
number the locator returns".

Every route is: validate, call one core function, return. That is what makes the
whole product testable without a browser.

## 16. Invariants

The statements that must never become false, each with the failure it prevents.
When ratified they belong in `CLAUDE.md` rule 11. Twelve came from the first
draft; six are new; three of the twelve were amended, and the amendments are
marked.

1. No byte is written into an attached repo without a hash-verified backup.
   Prevents an unrecoverable overwrite of a client's file.
2. Every **mutation of an existing** client file is a sorted, non-overlapping,
   in-bounds byte-range splice of the exact pre-image. No printer or formatter
   ever produces client-bound bytes. Prevents a reformatted file turning a
   two-line change into an unreviewable pull request. *Amended: the mutation and
   creation distinction exists because the QA handoff file may be a created file
   rather than a spliced one, and a created file has no pre-image. If that file
   is kept out of the client repo, the original wording stands unchanged.*
3. Every path the broker touches passes full path resolution containment plus the
   hard-link check, evaluated against the handle actually opened. Prevents escape
   out of the attached root.
4. The broker is the only module that can mutate anything outside our own data
   folder, enforced at runtime by the filesystem guard. Prevents a future
   refactor, human or AI, from quietly bypassing every gate above.
5. Rocket Editor never starts, restarts, stops or kills any dev server or process
   tree. Prevents orphaned workers squatting on ports, a failure that cannot be
   fixed correctly on Windows without a native binding.
6. Everything the in-page agent sends is a hint. **The server re-derives file,
   span and tier itself; agent evidence may inform what is displayed and at which
   proof level, and may never widen, narrow or retarget a write plan.** Prevents
   any script sharing the client's origin from steering a write. *Amended: the
   display carve-out is what makes rendered-instance discovery possible at all,
   and it is a separation of authority from evidence, not a softening.*
7. No client file is written before Apply. **Live preview lives only in the
   page's memory; staged state is durable in our own data folder.** Prevents a
   dirty working tree all session, and a hole in staleness detection. *Amended so
   the first clause is not read as making staged work memory-resident, which
   section 10 reverses.*
8. A styling form the locator cannot prove safe is refused with a named reason.
   The tool never guesses. Prevents a plausible wrong edit landing in code nobody
   reviewed.
9. Exactly one instance, and exactly one Apply in flight. Prevents interleaved
   backups and a last-writer-wins overwrite of the manifest that points at the
   only copy of a client's original file.
10. Backups and app state live outside every git repository. Prevents a repo
    clean destroying the safety net, and one client's source landing in another
    client's tree.
11. The prepared journal record is fsynced before the first client byte moves,
    and a prepared record with no terminal record blocks all new work. Prevents a
    silent half-applied Apply.
12. Snapshotting never mutates the client's index, working tree, branch or any
    ref outside our namespace. Prevents moving a client's branch pointer.
13. **An edit the panel has been told is staged is on disk before that
    acknowledgement returns. Process death loses at most the edit in flight.**
    Prevents hours of a designer's work evaporating for a reason that has nothing
    to do with his client's code.
14. **No edit is staged without a stated blast radius and its proof level. A
    radius that could not be established is shown as unproven, never as a
    number.** Prevents the tool presenting an unknown impact as a safe local
    edit.
15. **No client file is written unless the proposed post-image parses under the
    same parser that located the value.** Prevents a splice that produces valid
    bytes and invalid code.
16. **A change is never displayed as verified unless a measurement was actually
    taken. Absence of a measurement is displayed as unverified, with its reason,
    and that mark travels into the handoff.** Prevents a mechanically successful
    write reading as a checked one.
17. **Every staged edit carries a designer-safety verdict. A Blocked verdict
    cannot be staged, and a Review verdict cannot be applied without an
    acknowledgement that names what will change.** Prevents the accidental
    shared-component edit, which is the product's signature accident.
18. **No refusal, degradation or warning reaches the designer in machine terms.
    Every code carries a designer explanation and a remedy; the machine reason is
    available and never primary.** Prevents the product exporting its own
    complexity to the person it exists to protect.
19. **A value the designer types stays local to the element he is editing. The
    product never adds to, or changes, the project's shared design system as a
    side effect of a local edit.** Entering an off-scale value is a local act; it
    becomes a shared one only when he says so, through the promotion flow.
    Prevents a designer quietly reshaping a client's design system while
    adjusting one card.
20. **One control never moves another.** Text size and line height are the case
    that forced this, and the rule is general: the product may show that two
    values are related, and may not act on the relationship. Prevents the tool
    making a design decision the designer did not make and may not notice.
21. **Nothing the product put in a client's project reaches a commit.** The
    setup line, temporary files and snapshot references are each blocked at
    commit time by an installed guard that reports its own result rather than
    passing in silence. Prevents the product's own footprint appearing in a
    review Rotem did not intend it to appear in, which is the one failure that
    costs him standing rather than costing him work.

Invariant 8 and the Review state read as if they are in tension, and section 2's
fourth claim resolves it explicitly: Review is not a guess, it is a proven change
whose reach exceeded the door.

## 17. Errors, degradations, logging, config

### 17.1 Two registries, and the field split

The first draft had one error registry with four fields: code, status, message,
remedy. **A single message field is now wrong**, because one string cannot be
both the machine reason and the designer's explanation, and whichever audience it
is written for, the other one is failed.

Each code carries: the machine reason, which names the gate, the diagnostic, the
offset or the hash; the designer headline, at most eight words in his nouns; the
because, one or two sentences stated as the consequence avoided; and the actions,
between one and three, at least one executable in the product. The remedy text
also becomes agent-facing, since the handoff file reads from this same registry.

The registry lives in the shared contract, which makes this a first-phase edit
rather than a later one: every consumer, every route, every streamed event, the
handoff file and the fix list all read from it.

**Degradations get a second registry**, because they are not errors. Nothing
failed; a capability is absent. Each carries what is unavailable, what it costs,
whether it is still true, and how it resolves.

### 17.2 The copy that has to be written

This is the work nobody budgeted, and it is named here so it is not discovered in
month three. Every one of these is currently the reason the product would show,
and every one needs a designer string written for it: the hard-link refusal, the
alternate-data-stream and reserved-device-name refusals, junction and symlink
escape, the pre-image hash mismatch, the range assertions, every refused styling
form, the encoding refusals, the framing refusal, the schema-version refusal, the
runtime version assertion, and the element-label schema skew.

That is dozens of strings. They are product copy, not error text, and they will
drift the moment two people write them, which is why the panel is forbidden from
authoring them and why a test asserts that no code ships with a machine reason
and no designer explanation. **Who authors this voice is an open decision.**

### 17.3 Logging and config

One log file per launch, newline-delimited, path printed at startup and linked
from the recovery screen. Whether client repo paths are logged in full is an open
decision, since a path is client-identifying and the designer may paste a
handoff file into an AI tool.

Config precedence is file, then environment, then flag. The port is fixed and is
not a configurable field.

Test-mode relaxation is not controlled by an ambient environment variable alone.
The flag that narrows the broker's allowed root is honored only when a
development-tree marker is also present, and it logs loudly when active.

## 18. Testing

**Two runners, deliberately.** Node's built-in runner for everything pure: the
server core, the broker, the locator, the fan-out enumerator, the containment
checker, the session log replay, and the panel's pure logic. Playwright for
anything that renders.

The reason for the split is architectural. **The safety suite must not depend on
the panel's native-binary toolchain.** If a prebuilt binary is missing, the panel
will not build, and the suite that proves the write path correct still runs.

Playwright drives a static fake client page carrying pre-labelled markup and the
agent snippet, served by the test runner's own server on an ephemeral port. That
is a fixture's server, which lives and dies with the test run, never the owner's
and never a client's, so the never-start-a-dev-server rule is untouched.

**No in-memory filesystem, and no injected filesystem abstraction.** On Windows
the bugs that matter are lock errors, junctions, hard links, line endings and
case insensitivity, and an in-memory filesystem fakes every one of them away. It
would have concealed both the junction escape and the hard-link escape, which are
real and are now gates.

Fixtures, with no dependencies ever installed: a Next 16 App Router shadcn repo
on Tailwind 4, a Next 15 Pages repo on Tailwind 3, a Vite repo, a workspace
monorepo, a repo with no commits, a folder with no git at all, and a hostile
fixture carrying Windows line endings, a byte-order mark, tabs, a value declared
three times including inside the dark block and a media query, a path with a
space and a hash, no trailing newline, a minified vendor stylesheet, and markup
carrying every refused styling form. Line endings are pinned by a git attributes
file, or checkout mangles the hostile fixture and the byte comparison passes or
fails for unrelated reasons. A junction cannot be committed to git, so it is
created at setup and torn down after, with a clean skip where creation is denied.

Each test copies its fixture into `.tmp/test-runs/` inside this project root, per
the project's own file-location rule, and the broker refuses any root outside
that folder while in test mode, so the real guard is exercised in the shape it
ships.

### The suites that carry the safety argument

1. **Property tests on the splice primitive.** For random bytes and random valid
   edit sets, assert the unchanged-region identity. For overlapping, reversed or
   out-of-bounds edits, assert it always throws.
2. **Golden byte comparisons** against hand-written expected files. Assert
   exactly one line differs and that the byte-order mark, line endings, tabs,
   comments and the dark block survive. Hand-written is the point: an expected
   value computed from the implementation's own offsets makes a wrong offset
   pass.
3. **Refusal corpus.** Every unsafe styling form and every escape asserts a
   specific code and a human-readable reason. Failing to refuse is a test
   failure. **New class: splices that produce syntactically invalid output**, so
   gate 8 has a corpus of its own. A class-name splice that swallows a quote, a
   CSS value carrying an unbalanced brace, a value containing a comment
   terminator. Plus one test that documents the limit: a valid-but-wrong result
   passes, and that is expected.
4. **Crash injection.** A fault point makes the process exit at named moments.
   The Apply moments were in the first draft. **The staging moments are new**:
   after an edit is acknowledged, mid-snapshot-rewrite, and between a log append
   and its flush. The assertion is that restart restores every completed edit, or
   at worst all but the one in flight, and never a corrupt tray.
5. **Windows reality.** A helper process holds an exclusive handle and the Apply
   must fail cleanly and roll back fully. Plus a read-only file, a very long
   path, a file that changes between plan and Apply, a repo root beside a
   same-prefix sibling directory, and an orphan temp sweep.
6. **Registry exhaustiveness**, new and cheap. Every code has a non-empty
   designer headline, a because, and at least one action. No code ships with only
   a machine reason. This is the only mechanism that keeps invariant 18 true
   after month three.
7. **The degraded path**, new. Suppress the reload or kill the agent, and assert
   the tray reads written-but-not-checked with its reason, and never applied.
8. **Proof-level honesty**, new. For a fixture with a deliberately unresolvable
   import, assert the enumeration returns bounded with the gap quantified, and
   that no interface path can render a bare number from it.
9. **Local stays local**, new, guarding invariant 19. Stage an off-scale value on
   an element whose property resolves to a shared value, apply, and assert the
   theme file is byte-identical afterwards and only the element's own file
   changed. Assert the same for every property that has a token chain.
10. **No coupling**, new, guarding invariant 20. Change text size and assert the
    line-height value in the staged set and on disk is untouched, and the reverse.
    Assert that a paired definition in the project produces a context line and no
    second staged edit.
11. **Preview exactness**, new. For each of the eleven properties, stage a value
    the fixture's own styles do not contain, and assert the browser's computed
    value for that property equals the staged value while previewing. Any
    property that fails is the documented exception list section 21's spike is
    looking for, and it must be named rather than absorbed.

**Not automated, so nobody mistakes green tests for proof:** real hot reload
against a real Next repo, real element labelling, dev-build slowdown, and
antivirus lock durations. Those are the spikes. A test asserting them would be
theatre.

No cloud CI. A Linux runner would validate none of the failure modes that matter.

## 19. Operational cost, honestly

Cold machine, once: install Node, clone, install dependencies, build the UI, and
optionally download the browser test binaries.

Every working day: two terminals and three processes. The client's dev server,
started by Rotem in the client repo and never by us. The Rocket Editor start
command, which prints and opens the panel URL. The browser.

Updating: pull, then reinstall and rebuild when the lockfile or the UI changed.
There is no server build, ever.

**Where zero ops is a lie. Nine items, said out loud.**

1. The dependency folder is a few hundred megabytes and contains three prebuilt
   native binaries. No compiler is needed, but "zero native modules" is false.
   The named failure mode is npm's optional-dependency resolution omitting a
   platform binary so the install succeeds and the build then fails on a missing
   binding, with a documented recovery in the readme. It breaks the panel's
   build, never a client file.
2. The UI build must have run before start. The start script checks and prints
   the one command rather than failing cryptically.
3. Windows Defender taxes every read, backup copy and write. The mitigation is an
   exclusion for our own data folder only, never a client repo, and adding an
   antivirus exclusion is itself an ops step.
4. The browser test binaries are a few hundred megabytes downloaded out of band.
5. The Node version floor moves once, around November 2026.
6. The client repo pays, in stages. Phase 1: one dev-guarded script line, written
   through the gated path, backed up, reverted at detach. Phase 3: a dev
   dependency plus one to three lines of bundler config, **plus a dev-server
   restart the owner performs himself**, forced by React 19 dropping its source
   metadata. That should be presented to a client in exactly those terms.
7. Backups accumulate. A settings action shows the size and prunes old sessions.
   Nothing prunes automatically.
8. A crash can strand a temp file inside the client repo until the next startup
   sweep, where their `git status` will show it.
9. Session logs accumulate the way backups do, and need the same prune story. A
   long engagement leaves one per session, and nothing prunes automatically for
   the same reason nothing prunes a backup automatically.

**What genuinely does not exist:** no containers, no database, no migrations, no
required environment file, no accounts, no auth setup, no cloud, no deploy, no
CI, no server build step, no code generation, no monorepo tooling, no service
registration, no certificate, no admin rights, no PATH edits, and nothing
installed globally.

## 20. Development plan

Estimates are in solo working weeks and assume AI-assisted implementation. Each
phase is named by what a designer can do at the end of it, and each is
independently useful if the project stops there.

### 20.1 The bad news, with numbers

**The product as scoped is roughly five weeks further out than the first draft
implied, and that draft's first release delivers five of the eleven capabilities,
all of them whole-app, none of them per element.**

Three findings drive everything below.

**Five of the ten properties have no theme value to edit, on either Tailwind.** A
spacing utility resolves to a multiple of the app's single density value, or on
Tailwind 3 to a literal with no variable at all. The only app-level value in that
chain is the density multiplier for the whole application. The per-element part,
the step number, lives in the class string in the component file and nowhere
else. **So on a Tailwind repo, gap, margin, padding, width and height are
per-element class edits or they are nothing.**

**The first draft's first release therefore covers none of those five and no
per-element edit at all on the flagship repo.** It covers three colors, radius,
and text size on Tailwind 4 only, each as a whole-app change. Text is not covered.

**Its exit criterion no longer proves anything.** "Retheme a real client repo end
to end" tests five of eleven capabilities and none of the five the owner named
first.

| Milestone | First draft | Re-cut | Delta |
|---|---|---|---|
| Safety floor proven | 2 to 3 | **4 to 5** | +2 |
| First shippable version | 5 to 7 | **9 to 11** | +4 |
| Click anything and change it | 11 to 15 | **13 to 16** | +2 |
| Every V1 property, every form handled | not planned | **16 to 20** | new |
| Consultant-grade handoff | 12 to 17 | **17 to 22** | +5 |

Phase 0 doubles because durable staging, the post-image gate and the split error
registry all belong there and none were in it. Phase 1 grows because the
matched-rule walk, the blast-radius model and honest degraded verification all
move into it. The tail grows because text editing and the identity half of
selection context are work the first draft did not contain at all.

### 20.2 The structural insight the re-cut turns on

**Element labelling and class-write semantics are two different features, and the
first draft welds them together.** Labelling is a location mechanism. Writing a
class safely is a semantics mechanism, and it is the expensive half: merge rules,
shorthand collisions, arbitrary values, two Tailwind majors, the scale ladder,
the classifier.

Splitting them lets labelling arrive early and be spent first on the two things
that need only location: **knowing what you selected, and editing text.** That
answers four of the six governing questions a full phase earlier, at a fraction
of the risk of waiting for the whole thing.

### Phase 0: Nothing visible yet, and nothing can silently break a client's file (4 to 5 weeks)

- The write broker end to end with every gate in section 9, including the
  post-image validity gate, the apply journal, the verified backup store,
  restore, rollback and the recovery screen.
- **Durable staging in full**, per section 10. It belongs here rather than later
  because it shares the crash-injection harness with the broker, and because it
  is the difference between losing a file and losing a day.
- The error and degradation registries in their two-layer shape. They live in the
  shared contract, and retrofitting the field split after fifty codes exist is a
  rewrite.
- The fixture set and the safety suites, including the new class of splices that
  produce syntactically invalid output.
- **Every gating spike**, including element labelling, which moves into this set
  and becomes gating rather than merely important.

Exit criteria: the broker survives crash injection and the Windows lock suite, a
killed process loses zero acknowledged staged edits, and there is a written,
per-property answer to how much of the matrix is reachable on each calibration
repo.

### Phase 1: Retheme the whole app in minutes, edit anything in a plain stylesheet, and know what you are about to change (5 to 6 weeks, cumulative 9 to 11)

The first shippable version. **All eleven capabilities appear in the panel from
here on**, each either editing or refusing by name with what would unlock it.

- Attach, doctor, stack detection, monorepo target picker, framing preflight, the
  dev URL rule, the setup consent write and its removal on detach.
- Iframe with width presets, the tray, Apply through the full broker, post-Apply
  verification and teardown, undo, recovery.
- **The matched-rule walk moves here from the second phase.** It is not a later
  feature, it is a prerequisite: knowing which declaration actually wins is what
  makes value resolution correct rather than hopeful. With it comes the agreement
  check from section 7.1.
- Token-chain editing: three colors, radius, text size and line height on
  Tailwind 4. Global scope, named as global. Color format detection and
  preservation is mandatory here, not later. Text size and line height are
  separate controls and neither ever moves the other.
- Off-scale values accepted immediately and marked custom, per section 3.3,
  including the simple one-off write on the class path. The tangled collision
  cases still refuse by name until Phase 3.
- Direct-instruction preview for all eleven properties, per section 3.6, with the
  exactness spike run before the phase is called done.
- **Selector-uniqueness editing moves here too.** It is the same splice pointed
  at a different target, and it is the difference between a non-Tailwind client
  being fully editable and not editable at all.
- **Class-signature editing, conditional on its spike.** No labelling, no client
  footprint, and it delivers the five spacing and size properties on markup
  somebody wrote by hand. It does not reach inside a component. **If the spike
  shows it matches too few of the elements a designer actually clicks, it is
  dropped and the phase report says so**, rather than shipping a control that
  mostly refuses.
- The blast-radius model in full, with proof levels, the coverage ledger and the
  escalation bands that do not need labelling.
- Responsive override detection for every property, in every strategy.
- Honest degraded verification, with verified and unverified as first-class
  states carrying their reasons.

**Exit criterion, replacing the old one: take a real change request from a real
engagement, break it into individual edits, and publish what fraction the tool
made, what fraction it refused by name, and what fraction it got wrong.**

### Phase 2: Click anything, including inside their components, and change the words (4 to 5 weeks, cumulative 13 to 16)

Where the product becomes the product, and where the client repo starts paying
more than one script line.

- **Element labelling**, injected reversibly, exact-pinned, with the dev-server
  restart the owner performs himself.
- **Identity**: component name, scope, the usage graph, the on-this-page census,
  and the vocabulary from section 7.3 that depends on them. This is what answers
  "what did I select" and "is it local or shared".
- **Text editing in full**, and it ships **before** class writes inside this
  phase, because it needs no Tailwind semantics and it proves the labelling
  pipeline end to end on the simpler consumer.
- **Minimal class editing**: a clean single-utility swap along the client's own
  scale. Nothing else. Shorthand collisions, arbitrary values, missing class
  attributes and every dynamic form refuse by name in this phase.
- Lockstep Apply, label invalidation, label schema skew as a refusal.
- Component reach, rendered-instance highlighting, the instance list with
  jump-to.

Exit criteria: click a button inside a shadcn repo, change its padding one step
and its label, apply, verify, undo, and show the diff to the client's engineer
without embarrassment. And every refusal a designer hits in an hour of real use
is readable and names a next step.

### Phase 3: When it cannot do something, it says exactly why, in words you can hand to a coding agent (3 to 4 weeks, cumulative 16 to 20)

- Full class-write semantics: merge and dedup, the shorthand collision with its
  two named outcomes, one-off values in their tangled cases (the simple case
  shipped in Phase 1), inserting a missing class attribute, and disclosing the
  utility that lost.
- Tailwind 3 support, with its different read and write path and the honest
  statement that text size has no theme value there.
- The pre-flight classifier at attach, with lock markers on hover and selection
  only, never ambient.
- The fix list for an external coding agent, reconciled with the handoff file.
- Route discovery, the guided page check, and the page-count escalation band.

### Phase 4: Hand the work over cleanly (1 to 2 weeks, cumulative 17 to 22)

Detach that proves clean, the snapshot-ref sweep, the change summary, the handoff
file in full, and the rebase flow that section 25.2 names as an undesigned gap.

### Phase 5: Promote a value into the design system, and the optional unifier

**Promote a custom value to a shared one**, approved on 2026-08-30 for the second
version. The designer has a local custom value and decides it should become part
of the project's system. He says so; the product never decides it for him.

The rules, all of them owner-set:

- A shared value is never created automatically. Promotion is always an explicit
  act.
- If the project already has an equivalent value, the product recommends reusing
  it rather than creating a near-duplicate.
- Before promoting, it shows where the new shared value will live and what it
  will affect.
- After promoting, the selected element is updated to reference the shared value
  rather than keeping its own copy.

Architecturally this is the first edit that deliberately touches two files in one
Apply: the theme file gains the value, and the element switches to referencing
it. The write path already treats an Apply as all-or-nothing across files, so
this exercises that guarantee rather than needing a new one. The reuse
recommendation reads the same scan that already answers where a value comes from.

**The inventory and unifier** stay optional, and only if client work demands
turning untokenized repos into token-driven ones.

### 20.3 What a designer can actually do, per phase

On the flagship repo, a Next App Router app on Tailwind 4 with shadcn. Dash means
refused with a named reason. Global means whole-app only. Local-on-handwritten
means only markup outside a component, and it depends on the class-signature
spike.

| Property | End of Phase 1 | End of Phase 2 | End of Phase 3 |
|---|---|---|---|
| gap, margin, padding | local on hand-written markup | local, anywhere | local, anywhere |
| width, height | local on hand-written markup, modes only | local, anywhere | local, anywhere |
| text size | global | global and local | global and local |
| line height | global | global and local | global and local |
| text color, background, border color | global | global and local | global and local |
| border radius | global, across its derived steps | global and local | global and local |
| visible text | not editable | local | local |

**At the end of Phase 1 on this repo: six properties whole-app, five local only
on hand-written markup, and no text editing. That sentence is the first release,
stated without decoration.**

Every control is present in the panel throughout, including the ones a given
phase cannot yet point at this element. A control that cannot reach says what
would unlock it, in the designer's words. That is the settled shape of the
product, not a staging trick.

On a plain-CSS or CSS-module client, all eleven are local from Phase 1. On
Tailwind 3, text size and line height drop out until labelling. Non-React
attaches read only throughout.

Selection context fills in the same way. Values, the winning rule, the token
chain, what a property inherits from, and responsive overrides are all exact from
Phase 1, because the agent can read the client's own stylesheets. Component
identity, local-or-shared, and page counts arrive with labelling in Phase 2, and
until then the identity line is a refusal rather than a guess.

### 20.4 The decision, made

**Rotem approved the third option on 2026-08-30. The product is built as the real
interface from the first release.** The other two are kept below so the reasoning
survives, and so a future reader can see what was weighed rather than only what
won.

What that commits to: selection, then context, then editing, then staging, then
Apply, then verification, all exercised from the beginning on real client work.
Every control appears from the start. A control that cannot yet reach a given
element is visibly unavailable and explains, in plain words, what is missing or
what would unlock it. There is no interim theme-editor product.

The consequence worth naming: **real client work now decides what gets built
next**, rather than the order in this document. The phases below stay as the
expected sequence and as the estimate, and the panel's own refusals become the
evidence for re-ordering them.

One effect on the spikes. The class-signature spike no longer decides which
product exists, because the panel ships either way. It decides how many controls
are live on day one and how loud the locked ones are. That is a far less
dangerous question, and it is the main practical gain of this decision.

The three options as they were weighed:

**Ship the whole-app retheme first**, at 8 or 9 weeks to first value. He can
change any color, corner or type size across every screen, and nothing else. The
cost is that the first release is not the product he described.

**Wait for labelling and ship everything at once**, at 13 to 15 weeks. The cost
is that every week of work sits behind a spike owned by somebody else's plugin,
the broker's first real exercise is the hardest tier instead of the easiest, and
a bad answer at week eleven leaves nothing.

**Chosen: ship the honest panel first, spend labelling on identity and text
second, and leave the hard class semantics third.** First value at 9 to 11 weeks,
full per-element editing at 13 to 16. It answers four of the six governing
questions a phase earlier than the first option, at a fraction of the second
option's risk, and it makes a bad labelling answer survivable rather than fatal.

**What choosing it does not fix, kept in view.** On a shadcn repo, at first
value, there is still no per-element edit of anything inside a component. If real
consulting work turns out to sit mostly inside those components rather than on
page layout, the first release is thinner in practice than it reads here. The
class-signature spike measures that, and under this decision the answer changes
the schedule rather than the product.

## 21. Spikes that must run before a promise

The first three are the cheapest and the most decisive, and **the first two must
run before the MVP decision in section 22 is signed.** They are the two that can
change the answer.

| # | Question | Why it is load-bearing | Cost |
|---|---|---|---|
| S-VENDOR | Can a client's build load the labelling tool from a copy living outside their project, across Next and Vite, and under strict dependency setups? | Decides whether the footprint is two lines or four, and the four-line version is the one that puts a name in their dependency list, which is the part that reads as a supply-chain change rather than a leftover | Half a day |
| S-HOOK | Does Rotem's own desktop git client run repository hooks, and does it surface their output where he can see it? Does the project's existing hook manager, if any, coexist with an added hook? | The commit guard is the mechanism that makes writing into a client's project affordable. If his client silently skips hooks, the guard is decorative and the panel's own confirmation becomes the only real signal | Two hours |
| S-PREVIEW | Can the temporary direct-instruction preview show every one of the eleven properties exactly, including values the client's project has never used? Name any property where it cannot. | Decides whether the product needs any additional styling machinery at all, or none. The current answer is none, and it is an assumption until this runs. Replaces a question that was asked backwards, as "should we add an engine" rather than "do we need one" | Half a day |
| S-SCOPE | Take three real change requests from past engagements. Break each into individual edits. What fraction falls inside the ten properties plus text, and what falls outside, and what is it? | **It validates the fixed scope itself.** If a third of real requests need something outside the ten, the matrix is wrong and every phase is built on the wrong product. It needs no code | Half a day |
| S-L3 | On two real client repos, what fraction of the elements a designer would actually click carry a class attribute equal, byte for byte, to exactly one static source literal? Split by page markup versus component internals | Now that the panel ships whole either way, this no longer decides which product exists. It decides how many controls are live on day one and how many are visibly locked with an explanation, which is a schedule question rather than an existential one | 1 day, and it is a script, not a judgement |
| S-AGREE | On a few hundred sampled elements of a real page, how often does the rule the tool computes as winning agree with the browser's computed value? | Section 7.1's agreement check is the inspector's viability test. Below roughly 99% the panel is mostly read-only, and cascade layers are where it will fail | 1 day |
| S-A | Are the panel and the client app same-site under section 5.1, do the client's cookies and storage behave, and does the launch token survive a browser restart? | Decides whether a login-walled client app can be previewed at all, and it is baked into every repo the tool touches | Half a day |
| S-FMT | Enumerate the authored color formats across real shadcn repos on both Tailwind majors. Confirm bare channel-triplet values are detected and never converted | The one failure in the matrix that breaks a client's app silently and app-wide | Half a day |
| S2 | How much of a real client repo is rethemeable through the values that already exist? | The core unvalidated product assumption | 2 days across three repos |
| S-ROUTE | Can routes and the route-to-component graph be discovered deterministically without running the client's build? | If not, page counts can never be called proven and section 8 must say estimated wherever it says counted | 1 day |
| S4 | Element labelling against real repos: does it work, do the attributes survive, what is the measured dev-build slowdown? | Phase 2 does not exist without it, and the slowdown is a cost the client's whole team pays | 1 day |
| S-T1 | When a component spreads props onto its host element, does the node carry the call-site label, the definition-site label, or both, and in what order? | Decides whether text resolves directly or needs the boundary hop, and whether "change here only" versus "change everywhere" exists for class edits at all. Four different panels follow from four different answers | Half a day |
| S-T2 | Entity decoding and whitespace cleaning round-tripped across a hostile text fixture: line endings, tabs, a byte-order mark, multi-line text, an existing entity, an emoji, a right-to-left run | Wrong inner-span derivation corrupts a client's copy silently. Must be a test, not a belief | Half a day |
| S-T3 | Does setting text on a framework-managed node survive, warn, or break, across server and client components and during streaming hydration? | Decides whether text has an honest preview at all. If it does not, the feature changes shape | Half a day |
| S-SCALE | Can the spacing, type and radius scales be read statically from real Tailwind 3 configs, or do plugins and spreads defeat it often enough that the compiled stylesheet is the primary path? | Decides whether the stepper shows the client's system or only what the app happens to use | Half a day |
| S1 | Does Next's Turbopack watcher survive a rename-over? | Decides whether temp-and-rename is universal or needs a per-framework fallback | Half a day |
| S3 | Do real target repos send framing headers in dev? | If a meaningful fraction do, the iframe premise needs a proxy fallback that kills hot reload | Half a day |
| S-H | Does injecting the agent tag into the root layout reach the running page with no restart, and does removal leave a clean tree? | If it needs a restart, the never-touch-their-server rule collides with the first release's core mechanism | 2 hours |
| S-D | Cost of a durable staged-edit append plus flush with Defender active | Sets both numbers in section 10.2, which are currently reasoned rather than measured | Half a day |
| S5 | Exact CSS parser offset semantics at the pinned version | Wrong offsets corrupt files silently | Half a day |
| S-PARSE | Measured post-image parse cost on the largest realistic client file | The only number in gate 8's cost claim that is asserted | 2 hours |
| S-F2 | Cost of the two-snapshot property sweep over one to five thousand elements on a real page | Decides the element cap, and whether the probe runs on every change or only on request | Half a day |
| S6 | Real antivirus lock durations on a freshly attached repo | Sets the retry budget | Half a day |
| S7 | Does the hard-link refusal fire on ordinary repos? | A gate that refuses normal repos is worse than useless | 2 hours |
| S-F1 | The real distribution of instance, usage and route counts across the calibration repos | Moves section 8.7's thresholds to where they actually separate a component edit from a system edit | Half a day |
| S8 | Temporary-index snapshot cost on a large monorepo | If attach costs ten seconds and litters their object store, the snapshot must be opt-in | 2 hours |
| S-QA | Byte-diff of the handoff file across two identical sessions | Proves deterministic rather than asserting it | 1 hour |
| S9 | Dependency install reliability for the three native binaries | Decides which install command the readme documents | 2 hours, spread |

## 22. Open decisions for Rotem

### Settled on 2026-08-30

Four decisions came back approved and are now binding. They are recorded in full,
with their reasoning, in `project-os/Decisions.md`. Summarised here so this list
stays readable on its own.

**The first release is the real interface**, not an interim theme editor. Every
control present, unavailable ones explaining themselves. Settles what was item 1.

**A value outside the project's scale is accepted immediately and marked custom**,
with no dialog, and it stays local to that element. Settles what was item 7.

**Line height joins the first version as its own control**, and no control ever
moves another. Settles what was item 9.

**Promoting a custom value into the shared system is a second-version feature**,
always an explicit act, never automatic.

**Clicking one element whose value is shared offers both paths**, changing just
that element or changing it everywhere, with the local one as the default.
Settles what was item 8.

**Editing visible text is in scope**, with the stated requirement being any text
the designer can see. Settles item 2.

**Text living in the project's own content and translation files is in scope
too**, treated as a shared value because one line can appear on many screens.
Settles item 2a. Text arriving from a live server is the one permanent exclusion,
because it is not in the project at all.

**The product delivers nothing.** Rotem pushes his own branch and the client's
team reviews it, so the obligation is clean working files rather than a handoff
mechanism. Settles what was item 25.

**The setup line is written, and a commit-time guard makes it unable to travel**,
reporting its own result rather than passing in silence. Settles item 19, and
leaves 19a open on whether the zero-touch fallback ships in the first version.

**The calibration material is named**: Rotem E, DS Tiger and Donotello first,
then downloaded public projects to widen the sample. Settles item 26.

The items those decisions replaced are marked settled in place below, so the
numbering everything else refers to does not shift.

### Still open

Grouped, because there are more than a list can carry. Most can be answered as
their phase approaches; the calibration repos are the one that blocks measurement
rather than building.

### What the product is

**1. Which MVP. Settled 2026-08-30:** the honest panel, built as the real
interface from the start. See section 20.4.

**2. Is visible text in scope at all? Settled 2026-08-30:** in, and the owner's
requirement is to edit any text he can see. Section 3.5 carries the three kinds
of text and the one that is genuinely out of reach.

**2a. Does text editing reach into the project's own content and translation
files? Settled 2026-08-30:** yes. Those files came with the client's code and sit
inside the attached folder, so they are ordinary write targets. A line in them
behaves as a shared value and inherits section 3.7's treatment. See section 3.5.

**3. Text before labelling.** Locating text by repo-wide uniqueness would put
text editing in the first release with no client footprint. It can also write the
wrong place when text rendered from data coincides with an unrelated literal.
Section 3.5 refuses it and takes text at Phase 2. The alternative is to accept it
with mandatory post-Apply verification and automatic rollback on mismatch. The
recommendation is to refuse.

**4. Width and height, honestly.** Much of the real width and height in a shadcn
repo is fill, fraction or viewport, which are modes rather than numbers. Does
size mean editing numbers only, or also switching between those modes? The second
is more useful and is a bigger feature than the word width suggests.

**5. Does margin earn its place?** Tailwind layouts use gap and stack spacing far
more than margin. Of the three spacing properties it is the one most likely to be
absent from the repos this product targets. Worth confirming before it earns a
control.

**6. Conditions beyond responsive.** Dark mode, hover, focus and disabled
overrides break the designer's belief that the value he sees is the only one, in
exactly the way a responsive override does, and the detector that finds them is
already running. The owner named responsive specifically. In, out, or in but
collapsed?

**7. Off-scale values. Settled 2026-08-30:** accepted immediately, marked custom,
no dialog, and local by default. See section 3.3.

**8. Global-only editing when he clicked one element. Settled 2026-08-30:** both
paths are offered, with the local one as the default. See section 3.7.

**9. Line-height coupling. Settled 2026-08-30:** both are first-version controls,
fully independent, and a shared definition is shown as context and never acted
on. See section 3 and invariant 20.

**10. Radius derived steps.** A shadcn repo derives its small, medium, large and
extra-large corners from one value. There is no way to round only this card
without leaving the client's system. Offer both "round everything" and "give this
one its own value", or refuse the local case?

**11. Is Tailwind 3 first class?** Text size is unreachable there until
labelling, because its value compiles to a literal that lives inside the
dependency folder, which the containment gate refuses and should keep refusing.
First-class stack, or documented as four of the ten until Phase 2?

### Safety and interface

**12. Apply while verification is impossible.** Section 13 permits it with an
unmistakable and travelling mark. The alternatives are to permit it only for
edits whose reach is fully proven, or to refuse it. The first draft permitted it
with a shrug, which is no longer defensible.

**13. Is the safety verdict a gate or a label?** Blocked cannot be staged, which
makes it a gate. Can Review block Apply until acknowledged, or only annotate?

**14. The safety vocabulary.** Four spellings of a three-bucket idea now exist
across two documents. One wins and the rest are retired. Related: whether the
code axis and the design axis show one combined verdict or two.

**15. Fan-out at the lowest proof level.** When reach is unknown, does the
product refuse the edit or allow it with the unknown stated? Section 8.7 puts it
at the top rung of the ladder rather than refusing, which is a choice.

**16. How many trust axes one row can carry.** Five are implied: lifecycle,
verification, reach confidence, safety verdict and preview fidelity.

**17. Who authors the designer copy.** Several dozen refusal and degradation
strings, which are product copy rather than error text, and which drift the
moment two people write them.

### Engineering and delivery

**18. The durability commit boundary.** Section 10.2 sets it at the control's
commit point with a quarter-second flush. Is an in-flight drag expendable?

**19. Footprint, re-asked. The script-line half is settled 2026-08-30:** the
line is written, and a commit-time guard in section 14.2 makes it unable to
travel. Still open in this item: the labelling half below, and 19a.

**19a. Does the zero-touch fallback ship in v1?** Open. The middle-man route
keeps clicking and live preview without writing to their files, at the cost of
fragile live updating on the framework most clients use. The recommendation is
to wait until a client actually refuses.

The labelling half, as asked: labelling arrives one phase early, so the
dev dependency, config line and dev-server restart land before the tool has
proved much to the client. Acceptable? And must some repos stay at one script
line forever, which would make class-signature location their permanent
per-element path rather than a contingency?

**20. Does the product ship if labelling fails?** If it does not work on real
repos, or the dev-build slowdown is unacceptable to a client's team, does this
ship as a whole-app retheme plus plain-CSS tool with class-signature location as
its per-element path, or does the project stop? **Deciding this before the spike
runs is what keeps a bad answer from becoming a crisis.**

**21. Where the handoff file goes, and whether it is one artifact or two.** The
client repo makes it a created file rather than a mutation, and collides with the
prove-clean sweep that would then delete it. Our data folder means he has to find
it. A panel download is cleanest and no module owns serving a file yet. Separately:
one artifact with the fix list of unmakeable edits, or two with a stated division?

**22. What deterministic means for that file.** Identical bytes for identical
session content, or stable ordering with no varying fields?

**23. Scan budget against reach confidence.** Grow the scan enough to prove
reach, or cap confidence at what the current bounded scan supports?

**24. Confidentiality.** The client repo path sits in our state folder and would
appear in the log and possibly in the handoff file, which he may paste into an AI
tool. Full paths, or redacted?

**25. What the client team receives. Settled 2026-08-30:** the question was
misframed. Rotem pushes his own branch and their team reviews it, so the product
never delivers anything. Its obligation is clean, reviewable working files. See
section 14.2.

**26. Calibration repos. Settled 2026-08-30.** Rotem named three systems of his
own, all on this machine and all built before this product existed: Rotem E, DS
Tiger and Donotello. They run first. Then downloaded public projects widen the
sample, chosen when the spikes run.

The order matters and so does the caveat. His three are real projects that were
never written to pass this test, which makes them honest samples, and they match
his actual client profile. But they share one author's habits, so a result that
looks good on them can still be rosier than a stranger's codebase. The public
projects exist to catch exactly that.

Reading those three folders is sanctioned by the owner for the calibration task
only, per the working rule that this project never reaches into another one on
its own initiative. The spikes read them; nothing copies from them.

Still needed on spike day, and not before: three past change requests from real
engagements, which is what the scope check runs on. They are words, not folders.

**27. Backup and session retention.** How long before old sessions are offered
for pruning, given nothing prunes automatically.

**28. Unifier ambition.** Does turning untokenized repos into token-driven ones
matter to the consulting offer, or is fast editing of what already exists the
whole product? This decides whether the last phase exists.

## 23. Out of scope, explicitly

- **Responsive editing.** No breakpoint-specific styling, no media queries, no
  width-prefixed utilities, no conditional rendering. The product detects
  responsive overrides and reports them, per section 7, and never touches them.
  Responsive work goes to an external coding agent.
- **Structural markup editing.** Moving, adding or deleting elements. Style
  values and visible text only.
- **Generic CSS editing.** This is a focused visual refinement tool with a fixed
  property list, not a CSS editor. The list in section 3 does not grow because
  CSS supports more.
- **Device emulation beyond width.** No user-agent, touch or pixel-ratio faking,
  which a plain web page cannot do honestly.
- **Starting, stopping or managing any dev server**, permanently.
- **Auto-committing or pushing in a client repo**, ever.
- **Non-React frameworks in v1.** They attach read-only.
- **A rewriting proxy in v1.**
- **Any AI inside the product.** Judgment is external, by a human or by a coding
  agent the designer hands a file to. The product is deterministic and stays
  deterministic.
- **Multi-user, remote or hosted operation**, at any point.

## 24. Corrections

Two lists. The first corrects the product plan, and predates the revision. The
second corrects the first draft of this document, from the revision itself. Both
are here rather than edited silently into place, because a document that quietly
rewrites its own history cannot be trusted about anything else.

### 24.1 Corrections to the product plan

**Plan fact 4, "direct iframe, no proxy, keeps everything same-origin", is
false.** Different port means different origin, unconditionally. The useful half
survives: a direct iframe needs no proxy and no allowlist edit, because the
framed document's own requests carry its own origin.

**Plan fact 4's second half is inverted for Next.** Framing the numeric loopback
address of an app started as `localhost` gets the hot-reload socket rejected,
because the numeric form is not in the default allowlist and the hostname is. The
plan recommended the numeric form.

**Plan fact 1, "React declined to restore the source metadata", is half wrong.**
The issue was closed as completed by a change that adds an element pane to the
browser devtools using owner stacks resolved through source maps. A reviewer will
cite this. The correct argument for compile-time labelling is narrower and still
holds: the replacement lives in the devtools backend rather than in any public
runtime API, it is unshipped in any numbered devtools release, it needs source
maps at runtime, and it has a known Windows path bug. Labelling is chosen because
it is deterministic, needs no source maps, and yields a literal file, line and
column in an attribute.

**Plan fact 7, "recast reprints only modified nodes", is true about nodes and
insufficient about files.** On Windows it rewrote every line ending in a
Unix-line-ending file, and inserted a semicolon in a semicolon-free file.

**Plan open decision 1, the write-approval shape, is settled.** Attaching a repo
registers its root, and that registration is the standing write approval for that
root, enforced by the containment gate. Already written into `CLAUDE.md` rule 12
and recorded in `project-os/Decisions.md`.

**Plan open decision 3, one design system or two panels, is moot.** It asked
whether the editor's values should feed DS Tiger's own design system pages.
Rocket Editor is a standalone product now, so there is no second panel.

**Plan open decision 7, manual dev-server start, is settled as permanent**, not a
concession until a later phase. That phase is cut.

**Plan Phase 6 is deleted.** Its work does not move to a later phase.

**Plan Phase 2's agent moves into the first release.** Without the in-page agent
there is no preview and no selection.

### 24.2 Corrections the revision made to this document

**"Six constraints bind every decision below" became seven.** The designer-first
principle is a binding constraint and was not in the table.

**"Three claims" became four**, and two of the three were re-scoped. The first
claim declared staged work outside the correctness story; the third was binary
and had no room for a middle state.

**"The tray is not fsync-critical, since losing it loses staged edits rather than
files" is retired**, along with the storage tree and the three-artifacts argument
that rested on it. Section 10 replaces them.

**"The locator returns a usage count with every span. The tray shows it, and
Apply requires an explicit confirmation above a threshold" is retired** as the
whole treatment of blast radius, and with it the framing that fan-out is a
number. Section 8 replaces it.

**The write path was sixteen gates and is now twelve gates and five steps**, with
the post-image validity gate inserted before the snapshot. Four of the original
sixteen could never refuse anything, and calling them gates made a real gate hard
to insert without changing what a gate number means.

**"The broker is forbidden from parsing" is retired.** It may call a pure
validator that returns a verdict and never a span or a string.

**"An approximate preview, authoritative after Apply" is retired.** It is false
in exactly the case that matters, where verification never happens.

**"The session reports one field: up, down or moved" is retired.** Verification
capability is a separate axis from dev-server health.

**The error registry's single message field is retired.** One string cannot serve
both a machine and a designer, and whichever it is written for, the other is
failed.

**The lifecycle table gained rows for verified and unverified**, which were named
in transitions but had no rows, leaving their exits undefined.

**Invariants 2, 6 and 7 were amended**, and six were added. The amendments are
marked in place in section 16.

**Ambient safety badging of the canvas is now explicitly excluded.** The first
draft's classifier would have painted markers across the client's running
product, which reads as the client's product being broken.

**The fixed V1 property list and the exclusion of responsive editing are new**,
and they are the reason the phase plan was re-cut around what a designer can do
rather than around which machinery unlocks.

### 24.3 Corrections from the approved decisions, 2026-08-30

**"Off the ladder, the tool stops and offers three things by name" is retired.**
An off-scale value is accepted immediately and marked custom. The dialog was
friction charged against the common case to guard the rare one.

**"A staged value the client's compiled styles do not contain cannot be previewed
faithfully" is retired** for the eleven editable properties. The preview
instructs the browser directly rather than reproducing the project's styling, so
it is exact. A spike now tests that claim instead of a document asserting it.

**The ten-property list became eleven.** Line height is its own control, and the
counts in sections 3.2 and 20.3 moved with it.

**The first release is no longer an open question.** Section 20.4 records the
decision rather than three options and a recommendation.

**Two invariants were added**, one keeping a local edit local, one forbidding any
control from moving another. Both came from owner decisions rather than from
engineering, which is why they read as product rules.

## 25. The six-hour test

The owner asked for one adversarial review, from one question:

> Could a skilled product designer with almost no coding knowledge use Rocket
> Editor for six hours on a paying client's repository, make hundreds of visual
> changes, and understand at every important moment what he selected, what
> controls it, what he is changing, whether it is local or shared, what else will
> be affected, what the tool knows, what it does not know, whether the edit is
> safe, whether the visual result was verified, and how to recover?

Nine places where the answer is still "not necessarily". Six are closed by
additions made in this section. Three are named as genuinely open, because
pretending otherwise is the failure this document exists to avoid.

### 25.1 Closed by additions this review made

**The acknowledgement treadmill.** On a shadcn app nearly every color resolves to
a theme value. Clicking a button in the canvas and changing its background is
therefore a scope escalation, which is Review, which is an acknowledgement. Over
six hours that is an acknowledgement on almost every color edit, and an
acknowledgement that fires constantly is clicked through without reading, which
makes the mechanism worse than absent.

**The addition: a scope acknowledgement is remembered per value, per session.**
The first time he learns that this button's background is the app's primary
color and that changing it changes everything using it, he decides once. Every
later edit to that same value in the same session is Safe, because he already
knows. A new value, a new session, or a change in the value's reach asks again.
The knowledge is what the acknowledgement buys, and knowledge does not need
re-buying every ninety seconds.

**A tray with 184 rows is not a review surface.** The first draft's tray is a
chronological list of chips, which works at ten and fails at two hundred, exactly
when review matters most.

**The addition: the tray groups by what changed, not by when.** Theme values
first, with their reach; then components, with the pages they touch; then
one-off elements, by page. Chronology is available and is not the default.
Section 12's escalation confirmations read from the same grouping, so the Apply
review screen and the tray are one surface rather than two.

**Nothing tells him what he already changed.** Over six hours the real question
in front of the canvas is not what a chip says, it is "did I already do this
one?" A tray cannot answer that, because he is looking at the page.

**The addition: staged changes are visible in the canvas**, on the elements they
affect, using the same agent highlight the affected-instance flow already draws.
It is not new machinery, only a second use of it.

**Nothing says when to Apply.** Stage everything for six hours and the Apply is
Systemic, the confirmation is enormous, and a rollback is all-or-nothing across
two hundred changes. Apply constantly and the client's working tree churns all
day.

**The addition: the product states the tradeoff once and does not nag.** A large
staged set already reaches Review through the session-size rule in section 12.3,
which is the honest form of the advice: it says the set is large and a rollback
would be wide, at the moment that becomes true. No timers, no prompts, no
suggested cadence.

**The dev server will die and restart several times in six hours.** That is
normal on somebody else's project, and each restart re-injects the agent and
re-resolves selections. The lifecycle table covers the states; it does not cover
selection stability.

**The addition: a selection survives a preview restart when it can be
re-resolved, and says so plainly when it cannot.** Re-resolution runs through the
same location proof that established the selection, never through a fuzzy
re-match, and a selection that cannot be re-proved is dropped with the element
outlined where it used to be.

**"Verified" was ambiguous at the session level.** The per-change model is clear.
What he cannot see at 5pm is how much of the day was checked.

**The addition: the tray header carries a session-level line** whenever anything
is unchecked. Not a badge and not a count on every row, since section 12.6
forbids that. One line, present only when there is something to say.

### 25.2 Genuinely open, and named

**Before element labelling, the answer to "what did I select" is a refusal.** The
panel can say what the value is, which rule sets it, which token it resolves to
and what else that rule touches. It cannot say Button. On a shadcn app that is
most of what he clicks for six hours, and it will be the most-felt limitation in
the product. It is honest, it is not closed, and it is the strongest argument for
open decision 1.

**Four of the ten properties refuse inside a component, repeatedly.** He clicks a
button, reaches for padding, and is told the tool cannot see where that value is
written. The refusal is honest and carries an action, but the action is a theme
edit at the wrong scope, and he will meet it dozens of times a day. This is the
same open decision seen from the designer's chair rather than the schedule's, and
it is why that decision is first in section 22 rather than buried.

**A branch change or a pull mid-session is survivable but not designed.** The
epoch catches it, the tray goes stale, and the offered path is rebase or discard.
**Rebase is one word standing in for real work**: re-resolving every staged edit
against changed files, deciding per edit whether its target still exists, and
presenting that in design language. On a live client repo during a working day
this will happen, and on current specification the honest outcome is often
discard, which loses the day. It needs designing before the first real
engagement, and it is not designed here.

### 25.3 What the review did not find

The recovery story holds. The proof-level vocabulary holds under pressure,
including the case where nothing can be proven, because unknown carries no number
and the type system enforces it. The refusal contract holds, because every
blocked state owes an executable action and a test asserts it. And the write path
is unchanged by any of this: everything above is about what the designer
understands, and none of it weakens a gate.
