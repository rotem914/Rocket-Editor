# Plan review, 2026-08-30

Scope reviewed: `notes/Rocket-Editor-Plan.md` and
`notes/Rocket-Editor-Architecture.md` in full, plus the governance kit rows they
touch. Everything is uncommitted, so the range is the working tree as of today.
Reviewer: the assistant, solo, after the 21-agent passes that built the
documents. This pass hunts what those passes missed, because they all shared one
framing.

Verdict vocabulary per finding: **fix** (do it now), **drop** (never mind),
**backlog** (add a row). Findings are ranked inside each severity.

What holds and needs no work: the write path and its gates, the proof-level
discipline, the refusal contract, the durable-staging design, and the honesty
rule that no number appears without the evidence that earns it. The review found
no contradiction inside the architecture document itself.

---

## 🔴 Blocking, for the plan's integrity

**R1 · The Plan file now lies about itself**
Where: `notes/Rocket-Editor-Plan.md`, the status note at the top.
Problem: it says its verified facts, tiers, phases and open decisions "all carry
over unchanged". Architecture section 24 retires three of the facts, replaces
the tier table with two axes, replaces the phase plan wholesale, and settles
three of the decisions. A reader who starts with the Plan, which its name
invites, absorbs superseded facts stated as verified.
Fix: one status paragraph at the top of the Plan naming the architecture as the
current authority and pointing at section 24 for what changed. Do not edit the
Plan's body; it is a record.
Verify: read the Plan top; grep the architecture for "24" cross-reference.
Status: [ ] open

**R2 · The two decisive spikes have no runnable path**
Where: architecture sections 21 and 22; open decision 26.
Problem: the MVP decision is explicitly gated on S-SCOPE and S-L3, and both need
real client repos, which are themselves an open decision. If client material is
unavailable or confidential, the two spikes that unlock everything cannot run,
and nothing in the plan says what happens then. The plan's biggest risk today is
not technical; it is that its own decision chain has a missing first link.
Fix: name the fallback now: two or three public open-source shadcn or Next
starter apps as stand-in calibration repos, stated as weaker evidence than real
client repos but sufficient to unblock S-L3 and S-AGREE. S-SCOPE genuinely needs
Rotem's past change requests and nothing else, no repo and no code.
Verify: section 21 names the fallback; S-SCOPE's row says what it needs.
Status: [ ] open

**R3 · Nothing says where an attached repo is allowed to live**
Where: architecture sections 6 and 9; nowhere covers this.
Problem: the containment, hard-link, temp-and-rename and lock-retry design all
assume a local NTFS volume. A client repo inside WSL is reached over a UNC path,
where realpath, link counts and atomic rename behave differently, and a repo
under OneDrive or Dropbox adds sync locks and placeholder files. Startup repos
on Windows machines live in WSL often enough that this is not exotic. Every
write-safety argument in the document silently assumes it away.
Fix: one attach rule and one invariant line: an attached root must resolve to a
local NTFS volume; UNC and mapped-network paths are refused at attach with a
named reason; the doctor warns when the root sits under a known sync folder.
Rotem clones client repos himself, so the rule costs him nothing.
Verify: the rule appears in the attach flow, the invariants, and the refusal
registry list.
Status: [ ] open

---

## 🟠 Important

**R4 · No phase budgets time to design the product's own interface**
Where: architecture section 20, all phases.
Problem: the plan specifies panel behavior in prose for hundreds of lines, and
allocates zero weeks to designing the panel: the tray, the drawer, the selection
context, the recovery screens, and the several dozen strings open decision 17
already flags as unowned copy. The owner is a product designer, so the work will
happen; unbudgeted, it lands as silent schedule growth inside Phase 1.
Fix: add a design line to Phase 1, one to two weeks, covering the panel surfaces
and a first pass of the registry copy, and note that the Figma connection this
project already carries is the natural home for it.
Verify: Phase 1's estimate names design work; the cumulative table reflects it.
Status: [ ] open

**R5 · Twenty-eight open decisions, no forcing function**
Where: architecture section 22.
Problem: five decisions gate the schedule and the rest can wait, but the list
presents all twenty-eight flat, and an unforced decision list is where plans
stall. The five: which MVP (1), is text in scope (2), footprint tolerance (19),
does the product ship if labelling fails (20), and calibration repos (26).
Fix: mark those five as gating in section 22, in one line each, and leave the
rest labeled by the phase that needs them. Whether the five also become Backlog
rows is Rotem's call, since only he writes that file.
Verify: section 22 shows the split; the five read as questions answerable in one
sitting.
Status: [ ] open

**R6 · The second browser tab is undefined**
Where: architecture section 5; the auth design.
Problem: the launch token is consumed from the fragment and held in one tab's
session storage. A second tab at the same address has no token and no defined
experience: it cannot authenticate, and nothing says what it shows. The first
draft's critic flagged multi-tab and the revision dropped it.
Fix: define the cheap version: a tokenless tab shows one screen saying the
editor is open in another tab, with a way to claim the session that invalidates
the old tab's token. No shared-session complexity.
Verify: the auth section states the second-tab behavior in one paragraph.
Status: [ ] open

**R7 · Solo-weeks estimates lost their calendar caveat**
Where: architecture section 20's cumulative table.
Problem: the Plan carried "solo-effort weeks, alongside other work; calendar
time stretches accordingly" and the architecture dropped it. Seventeen to
twenty-two solo weeks reads as five months of calendar time, and for a
consultant working alongside engagements it is not.
Fix: restore the one-line caveat under the cumulative table.
Verify: the table carries it.
Status: [ ] open

**R8 · The review calibration is still empty while 18 invariants wait**
Where: `project-os/Code_review.md`, the always-check list and the
worst-bug-class line, both still placeholder.
Problem: Phase 0 produces the write broker, the highest-stakes code this project
will ever have, and the file that calibrates its reviews carries no
project-specific rows. The bootstrap material now exists: the architecture's
invariants and the two ratified decisions.
Fix: after ratification, seed the worst-bug-class line, an unasked-for write
into a client file, plus rows for the broker invariants. One sitting.
Verify: the file's placeholder text is gone before the first Phase 0 review.
Status: [ ] open

---

## 🟡 Nits

**R9 · Mixed-content edge on an https client dev server**
A client app served over local https loading our http agent script rides on the
browser's localhost mixed-content exemption. Fold the check into spike S-H
rather than trusting it.
Status: [ ] open

**R10 · Handoff generation trigger is loose**
Section 14.3 says "at the end of a session" and section 10 defines sessions by
open and closed markers, but nothing binds generation to detach, to Apply, or to
an explicit button. One sentence choosing on-demand plus at-detach closes it.
Status: [ ] open

---

## The order that makes it mature fastest

1. Fix R1 and R3, both one-sitting document edits.
2. Rotem answers the five gating decisions from R5, S-SCOPE material in hand.
3. Run S-SCOPE and S-L3, using R2's fallback repos if client repos are not
   available that day.
4. Sign the MVP decision, then ratify: invariants into `CLAUDE.md` rule 11, the
   settled choices into `project-os/Decisions.md`, and R8's seeding.
5. Only then does Phase 0 start. Everything above is days, not weeks, and it
   converts the plan from analyzed to decided, which is the only maturity it
   still lacks.
