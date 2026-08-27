# Live Editor — Decisions

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

- 2026-08-27 — Live Editor is a local web app, not a desktop app
- 2026-08-27 — Writing into an attached client folder is the one sanctioned write outside this project

---

## 2026-08-27 — Live Editor is a local web app, not a desktop app

### Context

Live Editor has to attach to a client project on this machine, show that
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
