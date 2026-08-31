# What I checked, and what I found

I took every meaningful choice made while designing this product and checked it
against the real world: official documentation, the actual code of the tools we
plan to lean on, live tests run on your machine, and a fresh look at every
competing product that exists right now.

**The result: every choice holds up. Nothing needs to be redesigned.**

Two of them need a more careful version than we sketched, and a list of small
written errors needs correcting. None of that changes direction.

This file has two parts. First, what the product is made of and whether each
piece is the right one. Then the questions I need you to answer so we can move.
A technical appendix sits at the bottom for whoever writes the code, and you
never need to open it.

---

# Part 1: is each piece the right piece?

First, what the product actually is, since we never walked through it together.
Seven pieces. I explain each one before judging it.

## 1. The thing the tool runs on

**What it is:** the tool has to run on your computer, and it runs on the same
underlying technology that almost every website is built with today. Not a
choice about your experience, a choice about foundations. Think of it as which
electrical standard the building is wired to.

**Is it the right one?** Yes. We picked the newest version that comes with
long-term support, guaranteed maintained until 2028. There is one scheduled
upgrade this October that takes minutes.

There were two trendier alternatives. One still has real quality complaints on
Windows this year. The other is genuinely good now, but it bends a few rules
that your clients' projects follow exactly, and this tool has to read those
projects perfectly. So both stay rejected, one of them for a better reason than
we originally wrote down.

## 2. The internal safety lock

**What it is:** this tool writes into a paying client's real files. That is the
whole product and it is also the scariest thing about it. So the design says
only one specific place in the code is allowed to write a file, and everything
must go through it, where all the safety checks live. Like a building with one
door, and a guard on it.

**Is it the right one?** The idea, yes, absolutely. But my research went into
the underlying technology's own source code and found that our sketch of the
lock had gaps. There are more ways to write a file than we accounted for, so a
simple lock would leave side doors open.

The fix is known and used by other serious tools. The lock has to cover four
ways in, be installed before anything else starts up, and be reinstalled inside
every background helper the tool spawns.

**This was the most valuable catch of the whole pass.** Not because it changes
what we build, but because that gap would not have shown up in testing. It would
have shown up as a file changed that nobody meant to change.

## 3. The screen you actually work in

**What it is:** the panel, the controls, the sliders, the color pickers, the
list of pending changes. The part you touch.

**Is it the right one?** Yes, all of it. Every building block we picked is
current, actively maintained, and widely used as of this month. One of them
became the industry standard this spring, so what was an early bet is now simply
the normal choice.

The color picker deserves a note. We planned to use a small, well-made base and
build professional sliders on top ourselves. I looked for something better that
appeared since. Nothing did. So we build our own, which is fine, and honestly it
is the part you will have the most opinions about anyway.

One known annoyance: a bug in the software installer that has been open since
2022 can occasionally make the tool fail to start after an update. There is a
documented fix, thirty seconds. Worth knowing it can only ever break our own
panel, never a client's files.

## 4. Showing the client's site inside the tool, still logged in

**What it is:** the client's site runs on their own address on your machine, and
the tool shows it inside its own window so you can click things. The catch: most
real startup apps are behind a login. If the site loses its login when we show
it, you see a login screen instead of the app, and the product is useless.

**Is it the right one?** Yes, and this was the boldest claim in the whole design.
The way we chose to serve the tool means the client's site keeps its login when
shown inside it. I verified that against the web's actual rulebooks, not blog
posts. It holds.

Two written mistakes to fix. One safety rule was written so strictly that it
would have blocked the tool's own helper from loading. And the rule that the
tool only accepts connections from your own machine, and never from the network,
was assumed everywhere and written down nowhere. Both are one-line fixes.

One thing goes on the first test day's list: a client project running in secure
mode would quietly log the preview out. Uncommon during development, but I would
rather you know it than discover it.

## 5. Knowing which line of code you just clicked

**What it is:** you click a button on the client's site. The tool has to know
which file, which line, made that button. This is the single hardest technical
problem in the product, and everything per-element depends on it.

**Is it the right one?** Yes, and this got the strongest confirmation of the
pass. React, the framework nearly all these projects use, removed the easy way
to do this. My market scan shows every serious tool in the world converged on
the same replacement we chose. We are not being clever, we are with the field.

We also chose to use the older, stable version of a helper rather than its fresh
rewrite. That was confirmed almost word for word: the rewrite shipped eight
emergency fixes in six weeks and bundles AI features that have no business in a
client's project. I added a note to check back in a few months.

There is also a backup method we invented, which finds an element by matching
its exact styling text, and needs nothing installed in the client's project. No
other tool does this. New means unproven, so it keeps its half-day test. What
matters: when it fails, it fails by saying "I am not sure", never by editing the
wrong thing.

## 6. Writing the changes without ever losing a file

**What it is:** when you hit Apply, the tool changes real files in a paying
client's project. It must be impossible to end up with a damaged file or lost
work.

**Is it the right one?** Yes, and parts of it I proved on your machine today.

The writing method, make a copy, verify the copy, then swap the new version in,
is exactly what Microsoft recommends for this situation.

There is a shortcut for taking a safety snapshot that any developer would reach
for. Our design says it is a trap. I ran it on your machine and it is: it
silently leaves out brand-new files, which is exactly what a design tool creates
most. Our replacement recipe I also ran end to end, and it captured everything.

The list of file paths the tool refuses to touch grows by five unusual entries,
things like folder names disguised as system devices. You will never encounter
them. They matter because refusing them is what makes this tool safe to point at
someone else's work.

And one real trap caught: some files start with an invisible marker, and its
presence shifts every measurement by three characters. Unhandled, the tool would
have written a change three characters off and corrupted a client's file. Now it
either adjusts for it or refuses the file.

## 7. Should we just buy something instead?

**What it is:** the honest question of whether this product needs to exist.

**Answer: nothing out there replaces it, and the plan aged well.** I scanned
every competitor as of this week. They split into two camps, and both fail your
use case for the same reason twice.

The cloud tools require uploading your client's source code to someone else's
servers. Dead on arrival for consulting.

The AI tools let a language model write the change. That means it is right most
of the time, which is a different product from one that is right always. The
whole promise here is that you can hand a client the result without checking it
line by line.

There is one living tool that works locally like ours. It is built for
developers, it takes over your development server, and it has no pending-changes
list, no verified backups, and no idea how far a change reaches.

**Two things we do that nobody does.** We write changes so precisely that a
client's engineer sees a one-line change instead of a reformatted file. And we
tell you what a change will affect before you make it. Nobody shows a designer
the blast radius. That is the real moat.

**One idea worth stealing.** A few tools run a tiny styling engine inside the
preview, so even a value the client's site has never used shows exactly right
instead of approximately. That is question 15.

---

# Part 2: what I need from you

Seventeen questions, each with my recommendation. The first three unblock
everything; the rest can wait. Answer however is easiest, even "1 C, 4 yes, 8
drop it".

## The big three

**Q1. What is the first version?**

A: a whole-app restyler. Change colors, corners and text sizes everywhere at
once. About 8 to 9 weeks. Cannot change one single element.

B: wait for everything. Every control working on any element. About 13 to 15
weeks, and the riskiest part gets built first.

C: the honest panel. Every control is there from day one; each one either works
or tells you plainly what would unlock it. First usable version 9 to 11 weeks,
complete at 13 to 16.

*My recommendation: C. But do not sign it before the two tests in Q3 run, because
they can change the answer.*

**Q2. If the click-to-code setup turns out not to work on real client projects,
does the product still ship as the reduced version, or do we stop?**

*My recommendation: it ships. Deciding this calmly now is what stops a bad test
result from becoming a panic later.*

**Q3. Which real client projects do we test against?**

Two cheap tests decide Q1. One needs only three past change requests from your
consulting work, no code at all. The other needs actual client project folders.
If those are off limits for confidentiality, say so and I use well-known public
projects instead. Weaker evidence, still workable.

## What the tool can change

**Q4. Should editing visible text be in the first version?**
It is the only change that is not styling. It reaches the client as a copy
change, which their team may review differently. *Recommendation: yes, arriving
in the second stage.*

**Q5. You type a spacing value their system does not have. Say their scale has
12 and 16 and you type 13. What happens?**
*Recommendation: allow it, behind one clear question offering three honest
choices: write it as a one-off, snap to the nearest step, or change their scale.*

**Q6. You click one button and change its color, but that color turns out to be
the whole app's main color. Offer the change with a warning, or refuse it and
send you to the theme panel?**
This will be the most common moment in the first version. *Recommendation: offer
it, with the true reach shown before you touch the control.*

**Q7. Width and height: numbers only, or also modes like fill, half, full
screen?**
Real projects mostly use modes. Modes are more useful and more work.
*Recommendation: numbers first, modes soon after.*

**Q8. Does margin earn its spot?**
Modern layouts space things with gaps, and margin barely appears.
*Recommendation: keep it, expect it to be rare.*

**Q9. Changing a text size also affects its line spacing. Change both, ask, or
refuse?**
*Recommendation: show both, with only what you asked for pre-selected.*

**Q10. Corner rounding: in most projects one setting drives four sizes at once.
Round everything together, or give this one card its own value and step outside
their system?**
*Recommendation: offer both, labeled exactly like that.*

**Q11. Beyond screen sizes, dark mode and hover states also change values behind
your back. Should the tool flag those too?**
*Recommendation: yes, folded away by default. Same protection, same reason.*

**Q12. When the preview is not running, applying still works but nothing can be
visually confirmed. Allow it with a loud permanent mark, or block it?**
*Recommendation: allow it with the mark.*

## Working with clients

**Q13. What the tool leaves in a client's project: one small line from day one,
and later a small development-only addition plus one restart they do themselves.
Acceptable for your clients? Is there a client who must stay completely
untouched?**

**Q14. At handoff, what does the client's team get?**
Changed files for their review, a separate branch, or the summary the tool
writes. *Recommendation: changed files plus the summary.*

**Q15. Folder paths identify the client. Keep them out of the summary you might
paste into an AI tool?**
*Recommendation: yes, hide them there, keep them in local logs.*

## Polish

**Q16. Adopt the exact-preview trick from the competitors?**
It makes every value show exactly right in the preview, even one the client's
site has never used. *Recommendation: yes, after a half-day test.*

**Q17. How long do backups and session recordings stay before the tool offers to
clean up?**
Nothing deletes itself, ever. *Recommendation: offer cleanup for anything older
than 30 days, always showing the size, never automatic.*

---

# Appendix, for the build session only

Nothing here is for Rotem. It is the precise list of corrections for whoever
writes the code, with section numbers into
`notes/Rocket-Editor-Architecture.md`.

1. Section 4.1: raise the Node floor from 24.10 to 24.12, where type stripping
   was declared stable. Add a line noting Node moves to one yearly LTS from
   2027, so the 24 to 26 bump around November 2026 is the last of its kind.
2. Section 4.1: reword the Deno rejection from Windows quality to ecosystem
   fidelity, lifecycle scripts off by default and node-API edge cases. The Bun
   rejection stands as written, still evidenced this year.
3. Section 4.7: the Permission Model is now Stable, and the Windows
   case-folding defect cited was fixed in 2023. Replace that sentence with the
   2026 symlink-chain CVE fixed only in 24.13. Keep the seat-belt, symlink and
   file-descriptor grounds, which are verbatim in current docs.
4. Section 4.7, the filesystem guard: specify four surfaces, the callback API,
   the sync API, the shared promises object which covers both import specifiers,
   and write-flag gating on open, since file-handle writes bypass module
   patching. Install via a preload import before user code, then sync built-in
   module exports so named imports see the wrap. Reinstall inside every worker
   thread at spawn. Precedent: the OpenTelemetry filesystem instrumentation; the
   graceful-fs promises gap is the cautionary tale.
5. Sections 4.3 and 4.8: name Vite 8 as Rolldown-only, with Vite 7.3 as the
   conservative fallback. The third native binary is the Rolldown binding; add
   it to the optional-dependency recovery note beside the other two.
6. Transport: add a heartbeat timeout to the event stream, since the dev proxy
   does not forward client-close events. Note the six-connection per-origin cap
   as the reason multiple panel tabs must not each hold a stream.
7. Section 5, the guard: the agent script route must accept same-site fetches,
   script destination only, or the guard blocks our own injection. State the
   loopback-only bind explicitly; it is the actual perimeter. Never log the
   Cookie header, since the client app's cookies arrive on same-site requests.
   Add a content-security policy on the panel page, no-store on responses, and
   constant-time token comparison.
8. Section 5.1: fix the wording on why localhost ports are same-site, host
   equality under a null registrable domain, not "its own registrable domain".
   Add the schemeful trap to spike S-A: an https client dev server is cross-site
   with the http panel and silently logs the preview out, and a client CSP that
   upgrades insecure requests breaks the agent script URL.
9. Second tab: a tokenless top-level navigation with a clean fetch context may
   re-mint a session key from the running server; scripted window openings
   cannot, since they arrive marked cross-site.
10. Labelling plugin: keep the 1.6.x pin and add the revisit trigger. The 1.x
    line has been dormant since July while 2.x stabilizes; adopt 2.x only when
    its patch rate flattens, and never load its own client runtime.
11. Section 4.5 and gate 5: postcss strips a UTF-8 byte-order mark before
    computing offsets, so every offset is shifted three bytes against the raw
    file. Either adjust splice offsets when the mark is present, or refuse the
    file. Add the mark to the pinned-offset-semantics test. Keep the existing
    UTF-16 refusal.
12. Class-signature location: compare against the class attribute, not the
    className property, which is an object on SVG. Note that JSX decodes
    entities in attribute literals at compile time, so an entity-bearing literal
    correctly fails byte-match and refuses.
13. Gate 3 additions: superscript digit device names; reserved names carrying an
    extension; trailing dot or space checked per segment rather than only the
    last; lexical refusal of device and UNC prefixes before any filesystem call,
    so a device handle is never opened; case-insensitive comparison for the git
    and dependency-folder segments, plus a note that per-directory case
    sensitivity exists on dev setups and interacts with repoId normalization.
14. Gate ordering: re-resolve the target directory's real path immediately
    before the rename, closing the window where a junction could be swapped in
    after containment. Decide gate 4's answer for cloud-placeholder files, and
    note Dev Drive volumes are ReFS, where short-name assumptions do not hold.
    Ties into the local-volume attach rule from the earlier review.
15. Step 13 nuances: rename-over gives the file a new identity, dropping ACLs
    and alternate streams, acceptable for source files, with the replace API
    named as the alternative. The rename is not write-through, so a power cut
    can resurface old content, bounded by the journal and backups.
16. Section 6.1: fix the watcher rationale. On Windows one handle watches a
    whole subtree; the real costs of a root watch are the build-output event
    storm and buffer-overflow rescans, and a watched directory cannot be
    deleted, which is another reason for the small named set.
17. Gate 9 honesty: the snapshot writes loose objects into the client's git
    store and its ref is visible to anyone enumerating refs. Invisible in normal
    workflow, not literally invisible. Detach already deletes the refs.
18. Competitive: add a watch-list line covering the local developer-facing
    cousin, the overlay-to-agent tools, the editor design modes, and the
    open-source proof that local precise writes are feasible. Consider the
    in-browser Tailwind engine for exact previews, pending Q16.
