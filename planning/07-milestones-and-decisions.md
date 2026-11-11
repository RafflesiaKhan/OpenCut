# Milestones, experiments and open decisions

Status: proposed order; no implementation dates or completion promises

## Confirmed direction from the creator

- Plan and design visually before building the full system; keep updating a local HTML prototype.
- Begin with a quick conversation, optionally by microphone; presets/series are shortcuts.
- Use specialist agents incrementally, coordinated through one Director.
- Save series assets, characters, visual/editing style and narration choices for reuse.
- Create a structured narration-linked scene plan, then populate editable timeline placeholders.
- Reuse existing voice extensions. Use OpenArt MCP as the primary image/video generation route; retain direct image extensions as optional alternatives.
- Initial Director providers: OpenAI and Anthropic. Grok/xAI is available as an optional later addition, not an initial requirement.
- Generate in batches, regenerate individual scenes, preserve accepted work.
- Add subtitles, transitions, restrained image motion, quiet music and meaningful SFX through manual controls or agents.
- Keep future project-specific code generation and additional integrations in view.
- Use the Director chat like a command-capable assistant: a follow-up form after the first message, and `/` skills such as `/script` and `/voiceover` that route to the specialists (11 November 2026).
- Do not commit work in this planning/design exercise.

## Proposed milestones

| Milestone | Smallest useful result | Evidence needed to move on |
| --- | --- | --- |
| P0 · Product design | HTML greeting, loaded Popy context, draft/scene board and mock timeline | Creator can complete a mock walkthrough and identifies the desired layout/flow |
| P1 · Project contract | Save/reopen a draft, linked scenes and selected series revision | IDs survive reordering; changes flag relevant downstream items; no channel leakage |
| P2 · Director + direction specialist | Produce/edit a structured draft from a brief | Narrator text contains no directions; visuals cover the story; scene count has a pacing rationale |
| P3 · Editor actions | Create linked placeholders through commands | One continuous edit plays/exports; batch undo restores prior state; partial failures handled |
| P4 · Narration | Chosen voice route generates/imports one coherent sample | Actual audio duration drives scenes; changed scripts are flagged; accepted voice reused |
| P5 · Illustrations | Batch selected scenes and replace one candidate | Correct references/provider/model; per-scene review; failed import never regenerates paid media |
| P6 · Editing assistant | Propose captions, image motion, transitions and sound | Same command path as manual editing; full sample watch/listen; one undoable edit set |
| P7 · Reliable longer episode | Expand the proven sample toward real episode length | Reopen/resume works; alignment and audio seams checked across the whole export |
| Later · Broader studio | Stickman/doodle, generated motion, mixed-media templates, packaging and publishing | A focused trial for each capability rather than one promise of universal support |

The first live production test should be short enough to diagnose. A 15-minute video remains a product requirement/example, not the first costly integration run. Pick the first real example with the creator; Popy is the proposed test bed because existing materials exist, not an irrevocable decision.

## Experiments before larger implementation

| Experiment | Question | Minimal trial / result to record |
| --- | --- | --- |
| Scene representation | How do story scenes map to Classic? | Create 3 intervals, reorder, add one voice track, export; compare against separate Classic scene behavior |
| Narration + alignment | Continuous audio or chunks? | Use one chosen voice on a passage exceeding a short sample; test a chunk seam and measured scene boundaries; later repeat on full-length audio |
| Stable character | Which Popy reference is canonical? | Creator selects reference; generate only 2 contrasting settings; compare face, species, proportions and outfit |
| Image regeneration | Can one replacement stay isolated? | Replace scene 2 only; preserve scene IDs, accepted neighbours, narration and timing |
| OpenArt | Which selected account/model operations are usable? | Discover schemas; one separately authorized sample; persist job, fetch/import result, retry import without resubmitting |
| Restart and partial failure | Can a project resume honestly? | Interrupt after a provider job returns; reopen another project; recover result into original destination once |
| Caption timing | Is alignment good enough for the chosen style? | Inspect word/phrase boundaries on real narration, including long audio and pauses; preserve manual corrections |
| External style workflow | Does a reviewed project add value? | Pin upstream revision and rights; one Stickman sample; compare effort/output before adopting code |
| Doodle reveal | Do we need drawn paths or a reveal approximation? | One narrated scene, reference comparison and creator acceptance; distinguish true drawing order from wipe/zoom |
| Final QA | Can the reviewer detect real problems? | Seed a missing visual, wrong caption boundary and loud SFX; report evidence and skipped checks |

Experiments involving paid generation require a concrete selected route and authorized cost scope. Reading or planning these experiments is not authorization to run every paid test.

## Decisions still open

| ID | Decision | Current proposal / what will resolve it |
| --- | --- | --- |
| D01 | Greeting and working Director placement | **Decided 11 Nov 2026 (creator):** a floating agent icon at the bottom-right of the preview opens the chat as a compact pop-over that can expand into the side panel. Chat first, with tool shortcuts inside it. No pop-up on load and no Director button beside Export. Widths still to be tuned in HTML |
| D02 | Optional preset grid vs chat-only start | Show recent series/presets as shortcuts, accept free-form prompt immediately |
| D03 | First real production example | Popy illustrated story proposed; choose with creator before live generation |
| D04 | Canonical Popy and narrator | Select approved reference and actual saved voice configuration; do not infer from filenames |
| D05 | Story scene representation | Linked scene cards and main-timeline intervals proposed; verify Classic playback/export |
| D06 | Voice chunking and alignment | Use actual returned audio; compare continuous and chunked paths within current limits |
| D07 | Agent runtime and model selection | Continuing tool-using runtime, skills, real specialist loops and project-scoped code tools are required; SDK and transport remain open. See document 09 |
| D08 | Storage and backup | Reuse existing browser storage where practical; choose project export/backup and local-service file bridge |
| D09 | Grouping extension tabs | Preserve current UI until mock tests show whether Create/Libraries/Brand grouping is clearer |
| D14 | Initial providers / media MCP | **Decided 11 Nov 2026:** OpenAI + Anthropic for Director; OpenArt MCP for images/video; Grok optional later. Voice route remains separately selected; see document 10 |
| D10 | Generation budget and automation scope | Batch authorization, visible estimates, selected-model fidelity and bounded retries |
| D11 | External reuse | Stickman sample candidate; OpenMontage architecture reference; MrPaidSocial permissions unresolved |
| D12 | Editing autonomy | Review a proposed batch initially; later define clearly bounded routine operations from user preference |
| D13 | Slash-command set and custom skills | Starting set in documents 02/03 proposed; try the `/` menu in HTML; creator-defined skills later |

## Next design session

Continue the HTML happy path and document 09 together. D01 already selects the floating chat. Demonstrate brief → draft → scene insertion → narration → illustrations → reviewed edit through ordinary requests or slash shortcuts. Keep the two existing tabs and screenshot-derived editor. Test the creator's understanding before adding real mic recording, model calls or generation.

## Keep honest progress

For every trial record: date, selected revision/provider, authorized scope, inputs, observed result, artifact location, failures and what remains unverified. A tool being listed, a schema validating or a render file existing cannot stand in for the full creator workflow passing.

## Current design iteration · 11 November 2026

The local happy path now simulates task activity and shared conversation/command actions. It uses a fictional narrator and coloured visual stand-ins; no provider or live agent is involved. Actual draft/contract code already exists with tests. Runtime implementation remains pending. Next gate: creator walkthrough and refinement of this mock experience before F1/F2 from document 09.
