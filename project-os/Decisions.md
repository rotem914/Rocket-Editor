# Rocket Editor — Decisions

Why non-obvious choices were made.

`project-os/History.md` records **what** changed. This file records **why** a direction was
chosen, so nobody re-argues it in six months and nobody quietly undoes it.

## How you maintain this file

- Add an entry when a choice was non-obvious and a reasonable person would have
  picked differently. Routine work needs no entry.
- **Append only.** Never rewrite or delete a past entry, even a wrong one. The
  wrong ones are the record of what this project already tried.
- **A changed decision is superseded, not edited.** Write a new entry naming the
  one it replaces, and italicize the old line in the Index so nobody follows a
  rule that has moved.
- **A fully replaced entry may move to an archive.** When superseded entries pile
  up, create `Decisions-archive.md` beside this file — the first time you need
  it, not before — and move the entry verbatim: never rewritten, never
  summarized. Its Index line stays here, marked superseded, so the trail
  survives.
- Every new entry also gets a line in the Index, in the same change. The Index is
  the part people read; an entry missing from it is an entry nobody opens.
- Use the required format below. All four parts, every time — an entry without
  Consequences is a note, not a decision.
- Write it so a stranger can follow it without the conversation that produced it.

## Required format

```md
## YYYY-MM-DD — Decision title

### Context
What problem or constraint forced a choice.

### Options
1. Option one.
2. Option two.
3. Option three.

### Decision
What was chosen, and by whom.

### Consequences
What this enables, what it costs, what future work must not break, and what
would make it worth revisiting.
```

## Index

Every decision below, oldest first. Read this list; open only the entries your
task touches. A line in _italics_ means part of that entry no longer holds.

- 2026-08-27 — Rocket Editor is a local web app, not a desktop app
- 2026-08-27 — Writing into an attached client folder is the one sanctioned write outside this project
- 2026-08-30: The first release is the real interface, not an interim theme editor
- 2026-08-30: A value outside the project's scale is accepted immediately and stays local
- 2026-08-30: Line height is its own control, and no control ever moves another
- 2026-08-30: The preview instructs the browser directly, rather than reproducing the project's styling
- 2026-08-30: Clicking one element whose value is shared offers both paths, local by default
- 2026-08-30: Editing visible text is in scope, and the target is any text the project itself contains
- 2026-08-30: Text in the project's own content and translation files is editable; live server text never is
- 2026-08-30: The product delivers nothing; it leaves clean working files and Rotem pushes his own branch
- _2026-08-30: The setup line is guarded by a commit-time hook that reports its own result_
- 2026-08-30: Calibration runs on Rotem's three own systems first, then downloaded public projects
- _2026-08-30: The labelling tool lives in Rocket's own folder, so the client's dependency list is untouched_
- _2026-08-30: The first version applies one change at a time; batching waits for a later version_
- 2026-08-30: The lean pivot. Rocket is read-only everywhere, and Claude Code makes the code changes from its report
- 2026-08-30: The unit of handoff is a small group of related changes, sent mid-session; the full report is history
- 2026-08-30: The control list grows to fifteen: font weight, letter spacing, border width and shadow join
- 2026-08-31: The class-copy extension copies an element ID card, not the bare class
- 2026-09-03: The bubble reads in four fixed groups, with no headers

---

## 2026-08-27 — Rocket Editor is a local web app, not a desktop app

### Context

Rocket Editor has to attach to a client project on this machine, show that
project running, and write changes into its files. That can be built in more
than one shape, and the shape decides what the product can reach.

### Options

1. A local web app, opened in a browser, the way DS Tiger already runs.
2. A desktop app, the shape editor-v.com takes.
3. An extension inside a code editor, the shape Piny takes.

### Decision

Option 1, a local web app. Rotem, 2026-08-27.

Option 3 was ruled out first, by trying Piny and rejecting it on experience.
The framework is deliberately left open until the first code lands.

### Consequences

It runs on ground Rotem already knows, and there is nothing to install to use
it.

The cost is reach. A web page cannot use the browser's own debugging protocol,
so working out which style rule is painting an element has to be done from
inside the previewed page, by walking the stylesheets it loaded. Preview widths
are adjustable but nothing else about a device can be faked. Starting and
stopping the client's own dev server is also weak from a web page, which is why
the plan leaves that to a late phase and has Rotem start it himself until then.

Worth revisiting if the missing debugging protocol turns out to block the
click-any-element phase, which is the one part of the plan that leans hardest on
knowing exactly which rule wins.

## 2026-08-27 — Writing into an attached client folder is the one sanctioned write outside this project

### Context

The governance kit says every file written stays inside this project folder.
This product exists to change files in somebody else's project folder. Left
alone, the rule and the product contradict each other, and a contradiction gets
resolved by whoever reads it last.

### Options

1. Leave the rule as written and let each session work out the exception.
2. Weaken the rule to something vague about being careful.
3. State the exception explicitly and fence it.

### Decision

Option 3. Written into rule 12 of `CLAUDE.md` at install, 2026-08-27, and
reported to Rotem as a call he can veto.

### Consequences

The rule still means what it says for the assistant: everything it writes for
its own purposes stays in this folder. The product gets one carve-out, and it is
narrow on purpose. It covers only a folder Rotem has explicitly attached, only
through the product's own write path, and only once that path has a backup and
an undo behind it.

Nothing in this project may widen that carve-out quietly. A second reason to
write outside this folder is a decision, and belongs in this file as a new entry.

## 2026-08-30: The first release is the real interface, not an interim theme editor

### Context

The fixed editing scope is mostly per-element work, and on a Tailwind project
per-element work needs a way to map a clicked element back to its source. Before
that exists, only whole-app theme values are reachable. That left a choice about
what the first shippable version should be, and the architecture had it as its
largest open question.

### Options

1. Ship a whole-app theme editor first, roughly 8 to 9 weeks, and grow it later.
2. Wait for element mapping and ship the complete product at once, roughly 13 to
   15 weeks.
3. Build the real interface from the start. Every control present, the ones that
   cannot yet reach an element visibly unavailable and explaining what would
   unlock them.

### Decision

Option 3. Rotem, 2026-08-30.

The stated purpose is to exercise the real interaction model from the beginning:
select, understand what was selected, edit, stage, apply, verify. Real client
work then decides what gets built next.

### Consequences

The schedule is unchanged, roughly 9 to 11 weeks to a usable version, but what
that version is has changed: it is the product with gaps that explain themselves,
not a smaller different product.

Every unavailable control now owes a designer-readable explanation, which turns
what would have been a hidden feature into a copy obligation. The refusal
registry already required this; this decision makes it load-bearing at launch.

The class-signature spike stops being existential. It no longer decides which
product exists, only how many controls are live on day one, which is a schedule
question. That is the main safety gain.

Worth revisiting only if real client work shows the locked controls dominate the
experience so badly that a narrower, fully working tool would serve better.

## 2026-08-30: A value outside the project's scale is accepted immediately and stays local

### Context

A project's spacing or type scale offers 12 and 16; the designer wants 13. The
architecture had this stopping the work to ask, offering three named outcomes.
That guards against filling a client's codebase with off-system values, at the
cost of interrupting the exact activity the product exists to make fast.

### Options

1. Stop and ask on every off-scale value.
2. Refuse off-scale values and offer only the nearest step.
3. Accept immediately, mark the value as custom, and keep it local to that
   element.

### Decision

Option 3. Rotem, 2026-08-30.

The mark exists for awareness, not for permission. The distinction that carries
the safety is not custom versus standard, it is local versus shared: changing a
value the whole project shares still asks, because its reach is genuinely
different.

### Consequences

This fits the safety model already in place rather than bending it. A local
custom value does not exceed the scope the designer declared by clicking one
element, so it is silent. A shared-value change does exceed it, so it explains
itself. No new rule was needed.

It adds a build cost, and the architecture now says so: on a class-based project
the writer must be able to emit a one-off value from the first release, since the
designer can produce one on day one. Only the simple case moves early; collisions
with competing or shorthand utilities still refuse by name until the phase that
owns those semantics.

It produced an invariant: the product never adds to or changes a project's shared
design system as a side effect of a local edit. Without that written down, a
later convenience feature could quietly promote values, which is precisely the
failure this decision was avoiding.

Revisit if client engineers start rejecting the resulting changes for carrying
too many off-system values, which would be evidence the friction belonged
somewhere after all.

## 2026-08-30: Line height is its own control, and no control ever moves another

### Context

In a modern Tailwind project a type size and its line height are often defined
together, so changing the size can be argued to imply changing the paired line
height. The architecture had this as an open question: adjust both, ask, or
refuse until ruled.

### Options

1. Adjust the pair automatically when the size changes.
2. Ask each time whether the pair should move.
3. Make line height a first-class control of its own, fully independent, and show
   the relationship as context without acting on it.

### Decision

Option 3. Rotem, 2026-08-30. Line height joins the first version's editable
properties, taking the list from ten to eleven.

### Consequences

The general rule this produced reaches further than typography: the product hands
over the controls and does not turn them. It is now an invariant, so a future
convenience feature cannot quietly reintroduce coupling anywhere else.

The designer is looking at the rendered result while he works, which is the
argument against automation here: the judgment the coupling would automate is
exactly the judgment he is in the middle of making.

Counts throughout the architecture moved by one, and line height behaves like
text size on every stack: reachable as a whole-app value where the project
defines it as one, and per element otherwise.

Revisit if real work shows designers routinely adjusting both in lockstep, which
would make a linked mode worth offering, though still never a default.

## 2026-08-30: The preview instructs the browser directly, rather than reproducing the project's styling

### Context

The architecture assumed that a value the client's project has never compiled
could only be approximated in the preview, and it planned a label for that state.
That assumption implied the product might eventually need its own styling engine
inside the preview to show such values exactly.

### Options

1. Add a styling engine inside the preview so unused values render exactly.
2. Keep the approximate state and label it honestly.
3. Instruct the browser directly with the design value, and let the written
   source use whatever form the project's own architecture calls for.

### Decision

Option 3. Rotem, 2026-08-30. The question was reframed from "should we add an
engine" to "do we need one", which is answerable by measurement.

### Consequences

It made explicit a separation that was implicit and confusing: what the designer
sees, what the preview shows, and what gets written are three different things,
and forcing them to match is what created the imagined problem. That separation
is now its own section.

The approximate-preview state is expected to become rare or absent for the
editable properties, which simplifies the safety model, since preview fidelity
was one of the axes that could push a change into review.

It is an assumption until measured, so it earned a spike rather than a claim:
can every one of the eleven properties be shown exactly this way, and if not,
which. Only a named exception list would justify reconsidering an engine.

The loop that keeps it honest already existed: after applying, the temporary
instruction is removed, the page rebuilds from the real source, and the product
reads back what the browser computes to confirm the result still matches.

## 2026-08-30: Clicking one element whose value is shared offers both paths, local by default

### Context

The designer clicks a button and reaches for its background. On a typical project
that colour is a shared value used by dozens of other elements. This is the most
frequent interaction in the first release, so whatever happens here defines how
the product feels.

The architecture had it as a scope escalation: the designer declared one element
by clicking it, the answer was the whole site, so the product had to detect the
gap and explain it. On a project where nearly every colour is shared, that meant
explaining on almost every colour edit, and an explanation that fires constantly
is read never.

### Options

1. Offer the shared edit with the consequence attached every time.
2. Refuse it as not-this-element and send him to the theme panel.
3. Offer both, changing only this element or changing it everywhere, and let him
   pick.

### Decision

Option 3. Rotem, 2026-08-30, agreeing with the recommendation.

The local path is the default, so the safe outcome is what he gets by doing
nothing. The wide edit is available beside it and says what moves before it acts.

### Consequences

It converts an accident into a choice, which is worth more than any warning. The
product no longer has to infer whether he understood the reach of what he was
touching, because he states it with a control. The safety model keeps its
scope-gap machinery for the cases that are genuinely surprising, and stops
spending it on the common one.

It leans entirely on the decision made the same day that a local custom value is
allowed immediately and stays local. Without that, the local path would itself
need a dialog and nothing would be gained.

It inherits one honest limit. Giving an element its own value requires writing to
that element, so on markup the tool cannot yet locate, only the shared path
works. The panel says so and names what would unlock the other, rather than
silently widening or silently refusing.

Revisit if real work shows designers reaching for everywhere so often that the
default is wrong, which would be an argument for remembering the choice per value
rather than flipping the default.

## 2026-08-30: Editing visible text is in scope, and the target is any text the project itself contains

### Context

Every other capability in the product changes how something looks. Editing the
words is different in kind: it reaches the client as a copy change, which their
team may review and approve on a different path from a design tweak. That made it
a question about what this product is rather than about what it can do.

It is also the one capability where a designer's expectation and the machine's
reality diverge sharply. Words on screen come from several places, and only some
of them are written down in the project.

### Options

1. In scope, limited to text the tool can trace to a written source.
2. Out of scope. Styling only.

### Decision

Option 1. Rotem, 2026-08-30, with the requirement stated as editing any text he
can see, with no friction.

### Consequences

The requirement is achievable for more text than the original refusal list
implied, and the architecture now separates three kinds rather than two. Text in
the markup is the first release. Text living in a content or translation file is
reachable in principle, because the words are still written down in the project,
and that became its own open decision rather than a silent promise. Text arriving
from a live database or interface call is permanently out of reach, and correctly
so, because those words are the client's content rather than their design and
they are not in the project at all.

Saying that distinction out loud is the product working as intended. A tool that
let a designer edit words fetched at run time would be showing him a change that
could never land, which is the exact failure the refusal principle exists to
prevent.

The practical consequence for the plan: placeholder copy is a constant in real
client work, so this earns its place ahead of several styling refinements, and
the phase that carries element identity carries text with it.

Revisit only if client teams push back on receiving copy changes through the same
channel as design changes, which would be an argument for separating them at
handoff rather than for dropping the capability.

## 2026-08-30: Text in the project's own content and translation files is editable; live server text never is

### Context

Settling that visible text is editable immediately raised where the words
actually live. On a real marketing page a large share of the copy is not written
in the markup at all. It sits in a content file, a constants file, or a
translation file for other languages.

Rotem asked the question that exposed a genuine ambiguity in how this had been
presented: if the words are in a database on a server he has no access to, how
could he possibly edit them. The two cases had been blurred together under
phrases like dynamic text, and they are not alike at all.

### Options

1. Markup text only. Anything held elsewhere is refused.
2. Markup text plus the project's own files. Live sources stay refused.
3. Attempt everything, including content fetched at run time.

### Decision

Option 2. Rotem, 2026-08-30.

The dividing line is not how the text behaves on screen, it is whether the words
are written down inside the folder that was attached. A content or translation
file came with the client's code and sits on the same disk as every other file
the product already edits. A database lives on a server the product never talks
to, and option 3 is not merely unwise, it is impossible.

### Consequences

It needs no new machinery. Those files are ordinary write targets and go through
the same path and the same gates as a stylesheet.

It inherits the shared-value model rather than inventing a second one. A line in
a translation file can appear on many screens, which makes it a shared value in
exactly the sense the product already reasons about, so the reach is shown before
the edit and, where the same words could be changed on one screen alone, both
paths are offered with the local one as the default.

Two limits are now written down. Editing one language leaves the others
unchanged, and the panel names which language it is editing rather than implying
the sentence moved everywhere. And a line assembled at run time, with a name or a
count dropped into the middle of it, is refused like any other assembled text.

The permanent exclusion is stated in the designer's terms rather than as a
technical refusal: those words are the client's content, not their design, and
they are not in the project at all.

Revisit only if a client's content system exposes a local file the product could
safely treat the same way, which would be an extension of this decision rather
than a reversal.

## 2026-08-30: The product delivers nothing; it leaves clean working files and Rotem pushes his own branch

### Context

The plan carried an open question about what a client's team receives at the end
of a session: a working tree to review, a branch, or a written summary. It was
framed as a product feature to design.

The framing was wrong, and Rotem said so by describing what he actually does. He
clones the client's repository locally, makes his changes, pushes them to a
branch of his own, and their team reviews that branch and decides whether it
reaches their main line.

### Options

1. The product produces a working tree for their team to review.
2. The product creates or manages a branch.
3. The product produces a written summary as the deliverable.
4. The product delivers nothing, because delivery is already handled outside it.

### Decision

Option 4. Rotem, 2026-08-30, from his existing practice rather than as a
preference. He expects this to be the common arrangement across clients without
being the only one.

### Consequences

The product's obligation shrinks and sharpens: leave the working files in a state
that survives an engineer's review. That is the byte-splice discipline earning
its keep in the place it was designed for, because what their reviewer opens is a
one-line change rather than a reformatted file.

The summary and handoff file are demoted from a deliverable to material: text for
the review description, and input for a coding agent. Nothing about them should
suggest the product hands anything to anyone.

The existing rule against creating branches, committing or pushing stops being a
principle and becomes obviously practical. That branch is his working surface
with his client, and a tool writing into it would be putting words in his mouth.

One detail became worth stating explicitly now that real branches get pushed: the
safety snapshots live outside the ordinary branch namespace, so a normal push
does not carry them, and detach deletes them. Nothing the product created for its
own protection appears in the client's review.

The decision is robust to other arrangements, which is why it is safe to settle
on a sample of one. The product stops at the working files either way. A client
who wants a written summary gets the same file; a client who reviews a working
tree directly gets the same diffs.

## 2026-08-30: The setup line is guarded by a commit-time hook that reports its own result

### Context

The product writes one dev-only line into the client's project so it can see into
the running page, and removes it on detach. Settling the delivery workflow made
the risk concrete: Rotem pushes his own branch, in his own git client, on his own
schedule, and the product does not sit between him and the push. A forgotten
line would travel into a client's review under his name.

Some clients will accept the line and some will not, which he raised himself. The
explanation that followed established that the line never needs to reach a
commit at all: it exists only while he works, on his machine.

### Options

1. A visible marker in the panel, removal in one click, and his habit does the
   rest.
2. The marker plus an installed commit-time guard that refuses any commit
   carrying the product's footprint and confirms, out loud, when it ran clean.
3. Never touch their files: the middle-man route, at the cost of fragile live
   updating on the framework most clients use.

### Decision

Option 2. Rotem, 2026-08-30, and the confirmation requirement is his: the
mechanism must report that it checked and found nothing, not merely stay quiet.

Option 3 was not rejected; it became its own open question about whether the
fallback ships in the first version, with a recommendation to wait for a client
who actually refuses.

### Consequences

A principle fell out of the confirmation requirement and went into the guard's
design: a guard that succeeds silently is indistinguishable from a guard that is
missing. The hook prints what it checked on every clean commit, and the panel
mirrors it, because a desktop git client may not show hook output at all. That
doubt earned a spike on his actual client.

The guard covers the marker, temporary files and snapshot references, refuses to
install over an existing hook arrangement it cannot preserve, and is itself a
write into their folder, so it goes through the same gated path as everything
else and is removed on detach.

It changes the client conversation, which is the real payoff: the ask stops
being a change to their codebase and becomes a temporary local edit that a
self-reporting mechanism keeps out of every commit.

It is a guard against forgetting, not a jail. Git documents a way to skip hooks,
and the design says so instead of pretending.

An invariant now carries the rule: nothing the product put in a client's project
reaches a commit.

Revisit if a client's policy forbids installed hooks, which would push the
zero-touch fallback from open question to requirement for that client.

## 2026-08-30: Calibration runs on Rotem's three own systems first, then downloaded public projects

### Context

The decisive pre-build checks measure how much of a real project the product can
reach, and they need real material: project folders that were not written to
pass the test. Which folders was an open decision, and the plan's fallback was
public projects as a weaker stand-in if client material was unavailable.

Rotem first asked why homemade test pages would not do, with himself as the
human QA. The distinction that settled it: homemade pages test the machinery,
and the plan already uses them for that, but this check measures other people's
building habits, and pages we build would be grading our own homework.

### Options

1. Wait for client repositories, with public projects as the fallback.
2. Rotem's three own systems first, Rotem E, DS Tiger and Donotello, then
   downloaded public projects to widen the sample.

### Decision

Option 2. Rotem, 2026-08-30, naming the three himself.

### Consequences

The spikes are unblocked without waiting on any client's permission, which was
the missing first link the plan review flagged as its second blocking finding.

The evidence quality is understood rather than assumed. The three are honest
samples, real systems built before this product existed, matching the actual
client profile of AI-assisted builds. They also share one author's habits, so a
good result on them can still be rosier than a stranger's codebase, and the
public projects exist to catch exactly that. Neither half substitutes for the
other.

Reading those three folders is the owner-named exception to the rule that this
project never reaches into another one: sanctioned for the calibration task
only, read but never copied from.

One piece of material is still owed on spike day: three past change requests
from real engagements, for the scope check. Words, not folders, and requested
when the spike runs rather than held open as a decision.

Revisit only in the happy case: when a real client engagement offers its
repository for calibration, it upgrades the evidence and joins the set.

## 2026-08-30: The labelling tool lives in Rocket's own folder, so the client's dependency list is untouched

### Context

Element labelling needs a tool to run inside the client's build, which means the
tool has to sit in some folder the build can reach. The obvious route is to
install it into the client's project the ordinary way.

That route adds a name to the project's dependency list and a line to its
lockfile. Those files are among the most closely read in any repository, and a
new entry there reads as a supply-chain change, whereas a line in a build
configuration reads as a leftover. The difference is in how it is received, not
in what it does.

### Options

1. Install it into the client's project, the ordinary way. Four lines across
   three files.
2. Keep it in Rocket's own folder and point the client's build at it. Two lines
   across two files, dependency list untouched.

### Decision

Option 2, with an automatic fallback to option 1. Rotem, 2026-08-30.

The panel always states which of the two is in use, because the footprint he is
carrying is not something he should have to work out for himself.

### Consequences

The footprint halves in the best case, and the half it removes is the one that
looks alarming to a reviewer.

It introduces a real uncertainty, which is why the fallback exists. Loading a
build tool from outside the project is legitimate but unusual, and some setups
refuse it. Spike S-VENDOR measures that across real client stacks, and the
footprint promise must not be made to anyone before it runs.

The commit guard already covers both routes, since it enumerates the
configuration line, the dependency entry and the lockfile line by name.

Revisit if the fallback fires often enough that the two-route complexity costs
more than the four-line footprint would have.

## 2026-08-30: The first version applies one change at a time; batching waits for a later version

### Context

The architecture assumed a staging tray holding many edits, applied together.
That drove a substantial durable-staging design: an append-before-acknowledge
log, a recovery screen, corruption handling, and re-validation of a recovered
session against source that may have moved.

Rotem proposed the opposite for the first version: edit, Apply, verify, move on.

### Options

1. Batch many staged edits into one Apply, as designed.
2. One change at a time in the first version, batching later.
3. Both from the start, with a per-session choice.

### Decision

Option 2. Rotem, 2026-08-30, against the recommendation, which was option 3.

His argument, and it is the better one: saving is the part of this product with
the most ways to go wrong, so it should carry the least ambition first. Prove the
loop works smoothly on the simplest possible unit, accumulate real experience,
then add batching in a later version with evidence rather than assumption. Start
simple, then evolve.

### Consequences

It removes an entire class of partially-applied states from the first version,
and it makes every failure name itself, since there is exactly one edit it could
have been.

It takes most of section 10 out of first-version scope. With at most one change
ever waiting, there are no hours of staged work to lose. The write journal stays
unchanged, because it protects a crash during a write and that risk exists at any
batch size including one. The section stays written, dated and marked as scope
for the later version, because rediscovering that design would cost more than
leaving it in place.

It costs rhythm, and the entry says so rather than hiding it: each Apply waits
for the client's app to rebuild before verification runs, so a session of many
small adjustments is slower than batching would be. That cost is the reason
batching returns.

Nothing is built and thrown away. The write path applies several files atomically
with all-or-nothing rollback and stays exactly as it is; the first version simply
exercises it one file at a time. Batching later changes what the tray holds and
what one Apply contains, not how bytes reach disk.

Revisit when the first version has been used on real client work and there is an
answer to whether the per-change rebuild wait is tolerable in practice.

## 2026-08-30: The lean pivot. Rocket is read-only everywhere, and Claude Code makes the code changes from its report

### Context

The architecture was built around Rocket writing code safely: a sixteen-gate
write path, verified backups, rollback, element labelling installed into the
client's build, a commit-hook guard, trust tiers. Months of the plan and most of
its risk lived there.

Rotem brought a synthesis from a separate Claude conversation: a lean version in
which Rocket only previews and records, and Claude Code, which he already uses
daily inside client repos, performs the actual code changes from a Rocket
report. He then pushed it further than the suggestion, twice. First: Rocket
writes nothing into any repository, and he pastes the one helper line himself.
Then the final form: the engine writes no file anywhere on the machine, ever.
View mode and read mode only. His words for the principle: build protections
against our own ignorance.

### Options

1. The full plan. Rocket writes, verified, thirteen to sixteen weeks to the
   complete product.
2. The lean product with Rocket keeping a small write surface of its own for
   session files and reports.
3. The lean product, fully read-only. The session record lives in the browser's
   own storage, and files reach the user only as browser downloads or clipboard
   copies at a click.

### Decision

Option 3. Rotem, 2026-08-30. Four sub-decisions ride with it, all his:

- The engine is read-only everywhere. The boot wall keeps every write surface
  blocked with no allowed destination at all, so even a bug nobody reviewed
  cannot produce a file.
- The helper line is pasted and removed by hand, with a permanent panel
  indicator and a read-only clean check instead of a hook.
- The in-page helper is passive: read, highlight, preview. It never acts on the
  client's app, whose dev version often talks to real servers.
- Transparency is the default posture toward clients, with Rocket drafting the
  disclosure. This reversed the assistant's earlier framing that there was
  usually nothing to announce, and the owner was right: a fast-built product
  does not get to claim perfect safety, so silence is not the honest default.

### Consequences

The deleted machinery is most of the plan's cost and nearly all of its risk: no
broker, no backups of client files, no labelling install, no commit hook, no
tiers, no crash-during-write drills, and now no engine-side storage layer
either. First value moves from thirteen weeks to roughly five to seven.

The safety story becomes one sentence: this program cannot create or change a
file on your computer. For a consulting tool pointed at paying clients' work,
that sentence is worth more than every gate it replaces.

The product's moat moves to the panel experience and the report's precision.
The market scan found the overlay-to-agent category occupied by developer tools
only; none is built for a designer, and none records with fingerprints.

The report becomes the load-bearing artifact. It claims only what the browser
proved, never a file or line, which Rocket does not know. Spike S-LOOP now
carries the product's core bet: that fingerprints plus design language are
enough for Claude Code to land changes reliably.

Durability moves into the browser's own storage, with a one-click backup
download as the escape from its one weakness, cleared site data. The heavy
durability machinery stays retired.

Three same-day decisions are superseded and italicized in the index: the
commit-hook guard (nothing to guard), the labelling delivery (no labelling), and
one-change-at-a-time Apply (no Apply; the report is naturally a batch). Their
reasoning transfers: the hook's enumeration principle became the clean check,
and start-simple-then-evolve is the argument that produced this very pivot.

Everything lean builds carries over unchanged if the writing track is ever
picked up: panel, preview, selection, record, report.

Revisit trigger, named in advance: S-LOOP or the first real engagement showing
the Claude loop too slow or too imprecise for the core spacing work. The pickup
point is the writing-track document, which stays unedited for exactly that day.

## 2026-08-30: The unit of handoff is a small group of related changes, sent mid-session; the full report is history

### Context

The lean pivot made the session report the handoff to Claude Code, implicitly
as one large artifact at session end. Review feedback the owner brought pointed
at the weakness: a mistake made at ten in the morning surfaces at six in the
evening, when his head is long gone from that part of the page.

### Options

1. One full report at session end, as implied.
2. Every single change sent alone, the one-at-a-time idea reborn.
3. Small groups by visual context: select an area, make one to five related
   changes, approve visually, send, keep working. The full report stays as
   history, backup and summary.

### Decision

Option 3. Rotem, 2026-08-30, adopting the feedback as brought.

Changes group only when they share a visual context, the same button, card or
section. Rocket suggests the grouping from selection locality; the designer can
split or merge before sending.

### Consequences

Misses surface in minutes instead of hours, on the part of the page the
designer is still looking at. The handoff Claude receives is small and
coherent, which is also the shape most likely to land correctly.

Two pieces of machinery ride along, and neither is optional. Sending a group
means Claude rebuilds the site mid-session, and every reload wipes the
browser-side previews of unsent drafts, so Rocket re-applies every draft by its
fingerprints after each reload, flagging any element it cannot re-find rather
than dropping it silently. And each group carries a state, draft, sent, landed
or off, with landed verified by re-reading the rendered values after the
reload, by reading only, so the read-only rule is untouched.

S-LOOP changes shape: it now measures the real rhythm, ten changes in three or
four groups sent separately, scored per group, including whether the automatic
verification agreed with the owner's eyes.

The full report loses no content, only its job title: history, backup, and the
end-of-session summary with the executor checklist.

Revisit if real work shows the grouping suggestions fight how he actually
selects, or if per-group sending turns out to interrupt more than it protects.

## 2026-08-30: The control list grows to fifteen: font weight, letter spacing, border width and shadow join

### Context

The editable property list was fixed at eleven by owner rule, with growth
allowed only on demonstrated need. An outside review argued that for a retheme
tool the list was thin: making something semibold is a weekly consulting
request, and the honest-panel decision turns the list itself into a promise.
The question went to the owner rather than being applied from review feedback,
because the list is his to rule.

### Options

1. Add font weight, border width and shadow now.
2. Add font weight only; the rest wait for a real client ask.
3. Keep eleven and wait for real work to prove the need.

### Decision

Option 1, plus letter spacing, which no reviewer had raised. Rotem, 2026-08-30,
going one step past the recommendation of option 2. He also named line height
and corner rounding, which were already in the list from the morning's
decisions, confirming rather than adding.

### Consequences

The list is fifteen plus visible text: gap, margin, padding, text size, line
height, letter spacing, font weight, width, height, text colour, background,
border colour, border width, corner radius, shadow.

Shadow is the one composite in the set, a colour, a blur and an offset in one
value, so its control leans harder on the system-first rule: the project's own
shadow steps first, and a hand-built shadow counts as advanced, marked like any
custom value.

Two build tasks grew: typography now carries four independent controls, and the
corner-rounding task became corners, borders and shadows. The exactness spike
now covers fifteen properties. No new tasks were needed; the additions ride
existing ones.

The growth rule itself stands unchanged: the list moves only on the owner's
call, and this entry is what that looks like.

## 2026-08-31: The class-copy extension copies an element ID card, not the bare class

### Context

The first helper tool, a Chrome extension, exists so Rotem can point at an
element on a running site and hand Claude enough to find it in the code. The
ask was "copy the class". A bare class fails three known ways: a component's
class serves every copy of it on the page, a machine-generated class exists
nowhere in the source files, and short utility strings repeat across a site.

### Options

1. Copy the class alone, as first asked.
2. Copy a four-line ID card: the page, the element with its first words, the
   classes, and its position among parents and siblings.

### Decision

Option 2. Rotem, 2026-08-31, after the failure cases were laid out in chat.

### Consequences

One click and one paste, unchanged. Each line covers the others' blind spots:
the words find the exact copy when thirty share a class, the page narrows the
search to one screen's files, the position separates repeated cards, and the
classes stay the primary key for the common case.

The card is assembled by pure reading, no thinking and no network, so it is
instant and works offline. Everything in it is page data and is treated as
data, matching the standing rule from the lean plan reviews.

Revisit if real use shows the card too noisy to paste, or still missing
elements, which would argue for adding stable ids or data attributes to it.

---

## 2026-09-03: The bubble reads in four fixed groups, with no headers

### Context

The bubble had grown to a dozen rows, printed in one unbroken column. Everything
in it is true and useful, and none of it was findable at a glance: the eye had to
read the labels to know where it was. The tool is about to go out to people who
did not build it, so the reading order had to become learnable.

### Options

1. Blank line between groups, no headers.
2. The same groups, each with a small caption in the footer blue.
3. Compress type the way a typographer writes it, `34/41` for size over line
   height, alongside either of the above.
4. Two columns, labels left, values aligned in a second column.

### Decision

Option 1, explicitly without option 3. Rotem, 2026-09-03, choosing from four
sketches. The order is fixed and never varies: what it is, how it reads, how it
sits, how it looks. Group captions were rejected as a row of reading for a
grouping the gap already shows; the `34/41` notation was rejected as designer
shorthand a wider audience does not share.

### Consequences

Rows are collected, and a group boundary marks the next row that actually
prints, so a group with nothing to say leaves no gap behind and two boundaries
never double up. That is what lets zero-value rows disappear, which landed in
the same session: an element with no padding simply has a shorter bubble, and
the layout never shows a hole where a row used to be.

The order is now a contract. A new fact does not go at the end; it goes in the
group it belongs to, or it needs a fifth group and this entry gets a successor.

Revisit if the tool ships to people who read it cold and cannot tell the groups
apart, which is the case option 2 was written for.
