# Creator Studio (P0–P7) Implementation Plan

> **Architecture revision:** [09 · Agent foundation](09-agent-foundation.md) is the current runtime direction. This earlier checklist is retained for useful domain tasks; do not execute its fixed-mode runtime design unchanged. We are updating HTML and plans before implementing the runtime.

Written 11 November 2026 · branch `director-agents-phases` · status: earlier checklist requiring runtime rebase. Tasks 5–6 have initial code/tests; the full workflow is not implemented.

**Goal:** Take one illustrated Popy story from a conversation to an exported, editable video in Classic: design it in HTML first, then build the project contract, Director drafts, timeline placeholders, narration, illustrations, editing proposals and a longer-episode run.

**Architecture:** The production module retains domain state and pure operations. A continuing Director runtime chooses tools, observes results and can delegate to specialist loops. A browser bridge executes Classic commands; MCP and code tools run in the appropriate local runtime. See document 09 for the controlling architecture. The remaining task details below are candidate domain work and must be reconciled before execution.

**Tech stack:** Next.js + React (Classic), TypeScript, zod, `bun:test`, Biome, IndexedDB/OPFS through the existing `StorageService`, existing voice helpers; primary agent image/video route is OpenArt MCP (document 10). Prototype: one self-contained HTML file.

**Spec:** `planning/README.md` and documents 01–07 in the same folder. Executors read the owning document named in each milestone before starting it.

## Global constraints

- Paths are relative to `apps/classic/` unless they start with `planning/` or `design-prototype/`.
- Run tests with `bun test <path>` from `apps/classic/`; run `bun run lint` and `bunx tsc --noEmit` before each commit.
- No new runtime dependencies. If a task seems to need one, stop and ask.
- Every timeline change goes through `editor.command.execute({ command })`. No direct track mutation.
- Never call a paid provider (TTS, image, OpenArt, Director model) inside an automated test. Tests mock `fetch` the way `src/app/api/director/route.test.ts` does.
- A paid call in a manual step needs the creator's go-ahead for that specific batch: scene IDs, provider/model, maximum count. Never switch the selected voice or model silently; never resubmit a paid job to recover from an import failure.
- Credentials stay where they are today (local `.env`, browser-session keys). Never write them into drafts, series records, job records, logs or Markdown.
- Estimated, measured and aligned timings are stored and labelled separately (`timingSource`). Speech is never stretched to fit an estimate.
- Narration text sent to a voice provider contains spoken words only.
- A story scene is not a Classic `TScene`. Do not call `CreateSceneCommand` to represent a story beat.
- This design iteration creates no commits. The prototype is local/untracked; its ignore rule is currently commented out. Later implementation commits require the scope of that implementation session.
- After each manual trial, append to `planning/07-milestones-and-decisions.md`: date, revision/provider, authorized scope, inputs, observed result, artifact location, failures, what remains unverified.

## Defaults this plan picks for open decisions

These are my choices where document 07 leaves a decision open. Each is replaceable; the task that depends on it is named.

| Decision | Default used here | Settled by |
| --- | --- | --- |
| D01 | **Decided 11 Nov 2026 by the creator:** floating agent icon at the bottom-right of the preview opens a chat (compact pop-over, expandable into the side panel); chat first with tool shortcuts; no pop-up on load; no Director button beside Export | Task 3b |
| D02, D09 | Preset cards are optional shortcuts inside the chat; extension tabs unchanged | Task 4 walkthrough |
| D03, D04 | Popy is the test bed. Canonical character image and narrator voice are **inputs the creator must supply**; nothing is inferred | Tasks 4, 16, 20 |
| D05 | Story scene = one record linked to one image element on the main scene's main track | Task 12 experiment |
| D06 | Narration is generated in chunks at narration-segment boundaries and laid end to end as separate audio elements; no audio stitching | Task 16 experiment |
| D07 | Superseded by document 09: continuing tool loop, real delegated specialist execution and browser bridge. Runtime/SDK selection remains open | Tasks 9, 24 |
| D08 | Production data lives in an optional `production` field on `TProject`; series live in their own IndexedDB store; backup is a JSON export | Tasks 7, 8 |
| D10, D12 | Each batch is authorized explicitly; every Director edit is a reviewed proposal | Tasks 15, 19, 23 |
| First routes | Director: OpenAI/Anthropic. Images and video: OpenArt MCP. Voice: creator-selected existing extension. Grok optional later | Document 10 supersedes the earlier direct-Gemini image default |

## Review focus

Conditions the spec implies that are most likely to hurt a creator. Each has a test in the task named.

1. Creator moves or edits a scene while a Director proposal is pending → proposal is rejected as out of date, the manual edit survives (Task 15).
2. An image job finishes after the creator switched projects → the result is stored for its original project and scene, and is never inserted into the open one (Task 21).
3. A completion or import is delivered twice → one asset, one candidate, no second paid submission (Tasks 19, 21).
4. Script text changes after voice and images exist → affected scenes and narration are marked stale; untouched scenes and accepted images are not (Task 6).
5. One command in an edit batch throws → the timeline returns to its prior state instead of being left half-applied (Task 14).

## File map

```
design-prototype/index.html                    P0 mock walkthrough (untracked)
src/production/contract.ts                     zod schemas + inferred types
src/production/draft.ts                        pure draft operations, staleness, validation
src/production/timing.ts                       interval planning and fitting to measured audio
src/production/series-store.ts                 series records, defaults precedence
src/production/backup.ts                       export/import JSON
src/production/placeholders.ts                 placeholder files + insert commands
src/production/tools.ts                        typed operations shared by UI and Director
src/production/skills.ts                       slash-command registry and parser
src/production/narration.ts                    chunking, request, reuse
src/production/jobs.ts                         generation job state machine
src/production/images.ts                       scene image request + batch runner
src/production/edit-proposal.ts                edit actions → commands
src/production/review.ts                       deterministic cut checks
src/production/__tests__/*.test.ts             one test file per module above
src/production/components/*.tsx                draft view, scene board, job summary, greeting
src/commands/project/update-production.ts      undoable write of project.production
src/commands/batch-command.ts                  roll back on child failure (modify)
src/media/use-add-extension-media.ts           extract shared insert-command builder (modify)
src/project/types.ts, src/services/storage/service.ts   carry `production` (modify)
src/director/contract.ts, src/app/api/director/route.ts  draft / edit modes (modify)
src/director/project-context.ts                time-range read (modify)
```

---

## P0 · Product design in HTML (document 02)

Verification for P0 is by opening `design-prototype/index.html` in a browser. Keep the two tabs (`#editor-tab`, `#plan-tab`), the existing ids, and the self-contained no-network rule from `design-prototype/README.md`. All new data is mock and labelled as mock on screen.

### Task 1: Mock state and opening conversation

**Files:** Modify `design-prototype/index.html`

- [ ] **Step 1:** Add one `const mock = { series, draft, scenes, jobs, proposal }` object in `<script>` for a fictional Popy episode about sharing: 6 scenes, each `{ id, narration, visual, estSeconds, status }`. The narrator field in `mock.series` is `null`.
- [ ] **Step 2:** Add a dismissible greeting overlay shown on load and from `#director-toggle`: heading "What are we making today?", prompt field, microphone button labelled "Simulated", up to three series/preset cards including Popy. Escape and a close button dismiss it; focus returns to `#director-toggle`.
- [ ] **Step 3:** Submitting any prompt or choosing Popy shows the editable summary (series, purpose, visual treatment, voice, length, ratio) with voice shown as "Not set" and a "Scripted mock reply" label on the Director's answer.
- [ ] **Step 4: Verify** Open the file, type a prompt, press Enter; summary appears; Tab reaches every control; overlay closes with Escape.

### Task 2: Production draft and scene board

**Files:** Modify `design-prototype/index.html`

- [ ] **Step 1:** Expand the Director area (`#director`) into a side panel with three views switched by buttons: Conversation, Draft, Scenes.
- [ ] **Step 2:** Draft view: narration passage on the left, linked scene direction on the right, "Draft v1 · timings estimated" label. Editing a passage marks its scene card "Needs review".
- [ ] **Step 3:** Scenes view: one card per `mock.scenes` entry with excerpt, duration, placeholder thumbnail, status. Cards and timeline clips render from the same array; selecting either highlights the other.
- [ ] **Step 4: Verify** Edit passage 3 → card 3 shows "Needs review" and no other card changes. Click card 2 → its timeline clip is selected.

### Task 3: Placeholders, narration, generation, editing proposal

**Files:** Modify `design-prototype/index.html`

- [ ] **Step 1:** "Create timeline placeholders" fills the mock timeline with six clips sized by `estSeconds`.
- [ ] **Step 2:** "Use narration" adds an audio clip and changes durations to a second mock set; label becomes "Simulated alignment".
- [ ] **Step 3:** "Generate missing" runs per-scene progress with timers; scene 4 ends "Failed". "Regenerate" on scene 4 yields two candidates side by side; accepting one sets status "Accepted". Other scenes keep their images.
- [ ] **Step 4:** Job summary strip: counts for queued, done, failed, and "Estimated cost: mock". "Stop" marks queued scenes cancelled and shows "Already submitted jobs are not cancelled".
- [ ] **Step 5:** Reuse the existing `#propose` / `#apply` / `#undo` controls for an editing proposal listing captions, image motion and music; Apply then Undo restores the prior mock timeline.
- [ ] **Step 6: Verify** Run document 02's eight-step walkthrough start to finish without reloading.

### Task 3b: Floating agent icon and chat (replaces the greeting pop-up)

Added 11 November 2026 after the creator saw Task 1's centred pop-up. It supersedes Task 1 Step 2's overlay behaviour.

**Files:** Modify `design-prototype/index.html`

- [ ] **Step 1:** Remove the modal behaviour (backdrop, `aria-modal`, focus trap, open on load) and the `#director-toggle` button beside Export.
- [ ] **Step 2:** Add a round floating button `#agent-fab` ("Open Director chat") at the bottom-right of the preview, above the timeline toolbar.
- [ ] **Step 3:** One chat, two sizes: a compact pop-over anchored to the icon (about 360px) with the Task 1 content, and "Expand" / "Collapse" to dock the same conversation into `#director` with its Conversation / Draft / Scenes views.
- [ ] **Step 4:** A "Shortcuts · mock" row above the prompt: "Generate image", "Remove background", "Create voiceover". Each fills the prompt with a starter sentence; none runs anything.
- [ ] **Step 5:** On load, a speech bubble beside the icon reads "What are we making today?"; it takes no focus and disappears after 6 seconds, on icon click or on Escape.
- [ ] **Step 6:** Escape closes the compact chat and returns focus to `#agent-fab`.
- [ ] **Step 7: Verify** No pop-up on load; prompt → summary with voice "Not set"; Expand and Collapse keep the conversation; Tasks 2–3 flows still work; no console errors.

### Task 3c: Slash-command menu and follow-up form (prototype)

Added 11 November 2026 at the creator's request. Spec: document 02 "Slash commands in the chat", document 03 "Slash commands route to specialists".

**Files:** Modify `design-prototype/index.html`

- [ ] **Step 1:** Add one `const skills = [...]` array: `{ name, description, needs, run }` for `/new`, `/series`, `/script`, `/scenes`, `/voiceover`, `/images`, `/edit`, `/review`, `/export`, `/help`. `needs(mock)` returns `null` or a reason string; `run(arg)` calls the existing mock action (`/scenes` → create placeholders, `/voiceover` → use narration, `/images` → generate missing, `/edit` → propose, `/script` → show the Draft view, `/new` and `/series` → follow-up form, `/review` → a scripted mock review message, `/export` → the existing export toast, `/help` → list).
- [ ] **Step 2:** Typing `/` as the first character of the chat prompt opens a listbox above the field, filtered as the creator types; Arrow keys move, Enter or Tab picks, Escape closes and keeps the text. Unavailable skills are shown greyed with their reason and cannot be run.
- [ ] **Step 3:** Running a skill adds the command to the conversation, shows a one-line status naming the specialist ("Story and direction specialist · scripted mock"), then performs `run`.
- [ ] **Step 4 (superseded by the chat-first correction in 02/09):** Offer an optional inline form only when requested or needed for a specific missing choice: "What are we making?", "Preset style", "Length", "Ratio", pre-filled from the chosen preset, voice shown as "Not set", with a "Continue" button that posts the choices into the conversation.
- [ ] **Step 5: Verify** `/` opens the menu; `/vo` + Enter before a draft is placed shows the reason and runs nothing; `/scenes` then `/voiceover` then `/images` drive the same timeline changes as the buttons; keyboard only; no console errors.

### Task 4: Edge states, creator walkthrough, decisions (gate)

**Files:** Modify `design-prototype/index.html`, `planning/07-milestones-and-decisions.md`

- [ ] **Step 1:** Add a "States" menu on the planning tab that jumps the editor into each of document 02's eight "States worth designing" using mock data.
- [ ] **Step 2: Verify** At 1280×720 every control is reachable; labels are readable in both themes (`#theme`).
- [ ] **Step 3:** Walk the creator through it. Record in document 07 the outcome of D01, D02, D03, D09 and any layout changes requested.
- [ ] **Gate:** Do not start Task 10 (React UI) until D01–D03 are recorded. Tasks 5–9 do not depend on this gate.

---

## P1 · Project contract (document 04)

### Task 5: Production contract schemas

**Files:** Create `src/production/contract.ts`, `src/production/__tests__/contract.test.ts`

**Interfaces — Produces** (all exported; types are `z.infer` of the schema with the same stem):

```ts
timingSourceSchema   // "estimated" | "measured" | "aligned"
sceneStatusSchema    // "planned" | "placed" | "generating" | "needs-review" | "accepted" | "failed"
staleReasonSchema    // "narration" | "visual" | "timing"
narrationSegmentSchema // { id, text, speaker }   speaker: "narrator" or a character name
promptVersionSchema  // { id, text, provider, model, createdAt }
storySceneSchema     // { id, revision, narrationSegmentIds[], visual, setting, characters[],
                     //   media: "still"|"motion-clip"|"stock"|"upload"|"html-graphic", motion,
                     //   estimatedSeconds, measuredSeconds?, timingSource,
                     //   prompts[], candidateAssetIds[], acceptedAssetId?, elementId?,
                     //   status, stale: staleReason[] }
briefSchema          // { topic, audience, intent, targetSeconds, language, ratio,
                     //   audioMode: "narrator"|"dialogue"|"both"|"none" }
productionDraftSchema // { version, brief, arc, narration[], scenes[], notes,
                     //   seriesRef?: { id, revision } }
generationJobSchema  // defined in Task 19; contract.ts exports it from there
productionSchema     // { drafts: ProductionDraft[], activeVersion: number,
                     //   jobs: GenerationJob[],
                     //   narration?: { textHash, chunks: { segmentIds[], assetId, elementId?, seconds }[] } }
```

- [ ] **Step 1: Write failing tests** — a valid six-scene draft parses; a scene with `estimatedSeconds: 0` is rejected; a scene with `timingSource: "measured"` and no `measuredSeconds` is rejected.
- [ ] **Step 2:** Run `bun test src/production/__tests__/contract.test.ts` → fails, module missing.
- [ ] **Step 3:** Implement the schemas. Do not define `generationJobSchema` yet: until Task 19, `productionSchema.jobs` is `z.array(z.unknown()).default([])`; Task 19 tightens it.
- [ ] **Step 4:** Tests pass. **Step 5:** Commit `feat(production): add draft and scene contract`.

### Task 6: Draft operations, validation and staleness

**Files:** Create `src/production/draft.ts`, `src/production/__tests__/draft.test.ts`

**Interfaces — Produces:**

```ts
reorderScenes(draft: ProductionDraft, from: number, to: number): ProductionDraft
reviseNarration(draft: ProductionDraft, segmentId: string, text: string): ProductionDraft
reviseSceneVisual(draft: ProductionDraft, sceneId: string, visual: string): ProductionDraft
validateDraft(draft: ProductionDraft): { ok: true } | { ok: false; problems: string[] }
narrationText(draft: ProductionDraft, segmentIds?: string[]): string
```

All return new objects. `revise*` bump the touched scene's `revision`.

- [ ] **Step 1: Write failing tests**

```ts
test("reorder keeps ids and links", () => {
  const next = reorderScenes(draft, 0, 2);
  expect(next.scenes.map((s) => s.id)).toEqual(["s2", "s3", "s1", "s4", "s5", "s6"]);
  expect(next.scenes[2].narrationSegmentIds).toEqual(draft.scenes[0].narrationSegmentIds);
});
test("narration change marks only linked scenes stale, keeps accepted image", () => {
  const next = reviseNarration(withAcceptedImages, "n3", "New line.");
  const s3 = next.scenes.find((s) => s.id === "s3")!;
  expect(s3.stale).toEqual(["narration", "timing"]);
  expect(s3.acceptedAssetId).toBe("asset-3");
  expect(next.scenes.filter((s) => s.stale.length).map((s) => s.id)).toEqual(["s3"]);
});
test("visual change does not touch timing", () => {
  const s2 = reviseSceneVisual(draft, "s2", "Popy at the river").scenes[1];
  expect(s2.stale).toEqual(["visual"]);
  expect(s2.timingSource).toBe(draft.scenes[1].timingSource);
});
test("validateDraft reports uncovered narration and directions in spoken text", () => {
  const r = validateDraft(draftWithOrphanSegmentAndBracketDirection);
  expect(r).toEqual({ ok: false, problems: [
    "Narration n7 is not linked to any scene.",
    "Narration n2 contains a direction: [slow zoom]",
  ]});
});
test("narrationText joins segments in order with single spaces", () => {
  expect(narrationText(draft, ["n1", "n2"])).toBe("One day. Popy woke up.");
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. A "direction" is any `[...]` or `(...)` span, or a line starting with `Scene` followed by a number or colon (`Scene 4`, `Scene:`), `Visual:` or `SFX:` (case-insensitive). Ordinary sentences such as "Scenery rolled by." are not directions. Also report a scene whose `narrationSegmentIds` names a missing segment.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): draft operations and staleness`.

### Task 7: Persist production data on the project

**Files:** Modify `src/project/types.ts`, `src/services/storage/types.ts`, `src/services/storage/service.ts:134-222`; Create `src/commands/project/update-production.ts`; Modify `src/commands/project/index.ts`; Test `src/production/__tests__/persistence.test.ts`

**Interfaces — Produces:**

```ts
// TProject gains:  production?: Production
serializeProduction(p: Production | undefined): unknown        // in src/production/contract.ts
parseStoredProduction(raw: unknown): Production | undefined     // invalid data → undefined + console.warn
class UpdateProductionCommand extends Command { constructor(next: Production) }
```

- [ ] **Step 1: Write failing tests** — `parseStoredProduction(serializeProduction(p))` deep-equals `p`; `parseStoredProduction({ drafts: "x" })` is `undefined`; `parseStoredProduction(undefined)` is `undefined`.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement the two functions; add `production` to `saveProject`'s serialized object and to `loadProject`'s rebuilt project. The field is optional, so no storage migration and no `version` bump.
- [ ] **Step 4:** Implement `UpdateProductionCommand` as a copy of the pattern in `src/commands/project/update-project-settings.ts` (save previous value, `setActiveProject`, `editor.save.markDirty()`, restore on undo).
- [ ] **Step 5:** Tests pass. **Step 6: Manual check** `bun run dev`, open a project, run in the console a command that sets a draft, reload → draft is still there; an older project without the field opens normally.
- [ ] **Step 7:** Commit `feat(production): store production data with the project`.

### Task 8: Series records, defaults and backup

**Files:** Create `src/production/series-store.ts`, `src/production/backup.ts`, tests `src/production/__tests__/series-store.test.ts`, `backup.test.ts`

**Interfaces — Produces:**

```ts
seriesSchema // { id, revision, channel, name, notes, cast: { name, description, referenceAssetName? }[],
             //   defaults: { voice?: { provider, model, voice, style? }, visualStyle?, ratio?, targetSeconds?, captionStyle? } }
findSeries(all: Series[], query: string, scope?: { channel: string }): Series[]
  // case-insensitive match on name; may return several; with scope, only that channel's series
resolveDefault<K extends keyof Series["defaults"]>(key: K, sources: { project?: Partial<Series["defaults"]>; series?: Series; fallback: Series["defaults"] })
  : { value: Series["defaults"][K]; source: "project" | "series" | "fallback" | "missing" }
saveSeries(s: Series): Promise<Series>   // increments revision; store "video-editor-series" via IndexedDBAdapter
loadAllSeries(): Promise<Series[]>
exportBackup(project: TProject, series: Series[]): string      // JSON, { kind: "opencut-production-backup", v: 1, ... }
importBackup(json: string): { production?: Production; series: Series[] }  // throws on wrong kind
```

Existing `opencut-director-brands` entries in `localStorage` are read once and offered as series (`channel`, `series`→`name`, `notes`); they are not deleted.

- [ ] **Step 1: Write failing tests**

```ts
test("two Popy series are both returned", () => {
  expect(findSeries([popyKids, popyShorts, other], "popy").map((s) => s.id)).toEqual(["a", "b"]);
});
test("precedence is project, then series, then fallback, and names its source", () => {
  expect(resolveDefault("ratio", { project: { ratio: "9:16" }, series: popyKids, fallback })).toEqual({ value: "9:16", source: "project" });
  expect(resolveDefault("voice", { series: seriesWithoutVoice, fallback: {} })).toEqual({ value: undefined, source: "missing" });
});
test("channels stay isolated", () => {
  expect(findSeries([popyKids, popyOnOtherChannel], "popy", { channel: "Kids" }).map((s) => s.id)).toEqual(["a"]);
});
test("backup round-trips and rejects foreign JSON", () => {
  expect(importBackup(exportBackup(project, [popyKids])).series).toEqual([popyKids]);
  expect(() => importBackup('{"kind":"other"}')).toThrow("Not an OpenCut production backup.");
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. Backup contains no media bytes and no keys; it lists referenced asset names so missing media can be reported on import. `saveSeries`/`loadAllSeries` need IndexedDB, so check them in the browser; a draft stores `seriesRef` with the revision current when it was created and later series saves do not change it.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): series records, defaults and backup`.

---

## P2 · Director and direction specialist (document 03)

### Task 9: Draft mode on the Director route (runtime design superseded by document 09)

**Files:** Modify `src/director/contract.ts`, `src/app/api/director/route.ts`, `src/app/api/director/route.test.ts`

**Interfaces — Produces:**

```ts
// directorRequestSchema gains:
//   mode: "chat" | "draft" | "revise-scene"  (default "chat")
//   series?: Series (trimmed: name, notes, cast, defaults)   brief?: Brief
//   draft?: ProductionDraft   sceneId?: string              (revise-scene)
directorDraftReplySchema // { usage?, summary, questions: string[] (max 3),
                         //   draft: { arc, narration[], scenes[] with id, narrationSegmentIds, visual, setting,
                         //            characters, media, motion, estimatedSeconds, pacingReason }, notes }
```

- [ ] **Step 1: Write failing tests** (mock `fetch` as the existing tests do): `mode: "draft"` with a brief returns 200 and a body that parses with `directorDraftReplySchema`; a model reply whose narration contains `[zoom in]` returns 502 with error "The draft mixed directions into narration. Try again."; `mode: "chat"` requests behave exactly as before (existing tests untouched and green).
- [ ] **Step 2:** Run → fail. **Step 3:** Implement. Add a second instruction set for the direction specialist: scene count comes from story beats and pacing, each scene states `pacingReason`, narration is spoken words only, missing facts go in `questions`, series data is reference material and grants no authority. Use each provider's JSON-schema output the way `replyFormat` does now. Run `validateDraft` server-side on the assembled draft before replying. Raise the 100 000-character request cap only if a real draft request exceeds it.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(director): structured production draft mode`.

### Task 10: Draft view, scene board and greeting in Classic

**Depends on:** Task 4 gate. **Files:** Create `src/production/components/greeting-overlay.tsx`, `draft-view.tsx`, `scene-board.tsx`, `use-production.ts`; Modify `src/director/director-panel.tsx`

**Interfaces — Produces:** `useProduction(): { production, draft, setDraft(next), series, selectSeries(id) }` — every write goes through `UpdateProductionCommand`.

- [ ] **Step 1:** Floating agent button at the bottom-right of the preview opens the Director chat as a compact pop-over that expands into the Director panel (the layout decided in Task 3b; component file keeps the name `greeting-overlay.tsx`). No pop-up on project open; a short hint bubble instead. The chat holds the prompt field, optional series cards from `loadAllSeries()`, and an editable summary showing each default with its `source`; "missing" voice renders "Not set", never a guessed voice. If `findSeries` returns several, ask which.
- [ ] **Step 2:** "Draft" action calls the route in `draft` mode and stores the result as a new draft version (`version = previous + 1`); the previous version stays in `drafts`.
- [ ] **Step 3:** Draft view and scene board per the layout approved in Task 4, backed by Task 6's functions; stale scenes show their reasons. Scene cards read `production` directly and keep no copy.
- [ ] **Step 4: Verify** in the browser preview: create a draft from a typed brief, edit a passage, reorder two scenes, reload — state persists; Cmd+Z undoes the last draft edit.
- [ ] **Step 5:** Commit `feat(production): draft view and scene board`.

### Task 10b: Skill registry and slash commands in Classic

**Depends on:** Task 15 (action layer). Each command's execution lands with the task that owns the work; until then the command reports what it needs.

**Files:** Create `src/production/skills.ts`, `src/production/__tests__/skills.test.ts`, `src/production/components/skill-menu.tsx`; Modify the chat component from Task 10

**Interfaces — Produces:**

```ts
type SkillName = "new" | "series" | "script" | "scenes" | "voiceover" | "images" | "edit" | "review" | "export" | "help"
interface Skill { name: SkillName; description: string; specialist: "director" | "direction" | "visual" | "editing" | "review" | "function";
  needs(production: Production | undefined, series: Series | undefined): string | null }
skills: Skill[]
parseSlash(input: string): { name: SkillName; arg: string } | { unknown: string } | null   // null when input does not start with "/"
matchSkills(prefix: string): Skill[]                                                        // for the menu, prefix without "/"
```

- [ ] **Step 1: Write failing tests**

```ts
test("parses a command and its argument", () => {
  expect(parseSlash("/script make it about sharing")).toEqual({ name: "script", arg: "make it about sharing" });
});
test("plain text and mid-sentence slashes are not commands", () => {
  expect(parseSlash("use 16/9 please")).toBeNull();
  expect(parseSlash("  /help")).toEqual({ name: "help", arg: "" });
});
test("unknown command is reported, not guessed", () => {
  expect(parseSlash("/publish now")).toEqual({ unknown: "publish" });
});
test("prefix matching drives the menu", () => {
  expect(matchSkills("s").map((s) => s.name)).toEqual(["series", "script", "scenes"]);
});
test("voiceover explains what is missing", () => {
  const voiceover = skills.find((s) => s.name === "voiceover")!;
  expect(voiceover.needs(undefined, undefined)).toBe("Needs a script first. Try /script.");
  expect(voiceover.needs(prodWithDraft, seriesWithoutVoice)).toBe("No narrator voice is saved for this series.");
  expect(voiceover.needs(prodWithDraft, seriesWithVoice)).toBeNull();
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. The menu, plain-language buttons and any future routing read `skills`; nothing else lists commands. Running a skill builds the same `ProductionAction` (Task 15) or route call (Tasks 9, 24) the buttons use, so validation, batch authorization and review are unchanged.
- [ ] **Step 4:** `skill-menu.tsx`: listbox above the prompt when input starts with `/`; Arrow/Enter/Tab/Escape; unavailable skills greyed with their `needs` reason.
- [ ] **Step 5: Verify** in the browser: `/script <idea>` produces a draft exactly as the Draft button does; `/voiceover` without a voice shows the reason and makes no request.
- [ ] **Step 6:** Commit `feat(production): slash-command skills in the Director chat`.

### Task 11: Microphone input

**Files:** Create `src/production/components/mic-button.tsx`; Modify `greeting-overlay.tsx`

- [ ] **Step 1:** Record with `MediaRecorder`, show recording/stop state, transcribe through the existing `src/services/transcription/service.ts`, and put the text in the prompt field for the creator to edit before sending.
- [ ] **Step 2:** If permission is denied or transcription fails, show the reason and leave typing fully usable.
- [ ] **Step 3: Verify** both paths in the browser. **Step 4:** Commit `feat(production): microphone prompt input`.

---

## P3 · Editor actions (documents 03, 04, 05)

### Task 12: Experiment — scene representation (gate for D05)

**Files:** Modify `planning/07-milestones-and-decisions.md`

- [ ] **Step 1:** In the running app, place 3 still images back to back on the main track, reorder two, add one voice track, export. Note playback and export continuity.
- [ ] **Step 2:** Repeat with 3 separate Classic scenes (`CreateSceneCommand`). Note whether they export as one continuous video.
- [ ] **Step 3:** Record both results and the D05 decision. **Gate:** if main-track intervals do not play/export continuously, stop and revise Tasks 13–15 with the creator.

### Task 13: Interval planning and placeholder insertion

**Files:** Create `src/production/timing.ts`, `src/production/placeholders.ts`, tests `timing.test.ts`; Modify `src/media/use-add-extension-media.ts`

**Interfaces — Produces:**

```ts
planIntervals(draft: ProductionDraft): { sceneId: string; startSeconds: number; seconds: number }[]
// uses measuredSeconds when timingSource !== "estimated", else estimatedSeconds; contiguous from 0
buildMediaInsertCommands(args: { projectId: string; assets: ProcessedMediaAsset[];
  placements: { startTime: MediaTime; duration: MediaTime }[] })
  : { commands: Command[]; elementIds: string[]; assetIds: string[] }   // in use-add-extension-media.ts
placeholderImageFile(args: { index: number; excerpt: string; width: number; height: number }): Promise<File>
createPlaceholders(editor: EditorCore, draft: ProductionDraft): Promise<{ command: BatchCommand; links: { sceneId: string; elementId: string }[] }>
```

- [ ] **Step 1: Write failing test**

```ts
test("intervals are contiguous and prefer measured time", () => {
  expect(planIntervals(draftWith([{ est: 4 }, { est: 6, measured: 5.5 }, { est: 3 }]))).toEqual([
    { sceneId: "s1", startSeconds: 0, seconds: 4 },
    { sceneId: "s2", startSeconds: 4, seconds: 5.5 },
    { sceneId: "s3", startSeconds: 9.5, seconds: 3 },
  ]);
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement `planIntervals`.
- [ ] **Step 4:** Extract the loop in `useAddExtensionMedia` (lines building `AddMediaAssetCommand` + `InsertElementCommand`) into `buildMediaInsertCommands`; the hook calls it with playhead-based placements so its behaviour is unchanged. Element ids come from `InsertElementCommand.getElementId()`.
- [ ] **Step 5:** Implement `placeholderImageFile` (canvas at project canvas size: scene number and narration excerpt on a neutral background) and `createPlaceholders` (process files with `processMediaAssets`, placements from `planIntervals`, target the **main** scene). It only builds the command; the caller executes it and then writes `elementId` + `status: "placed"` to each scene with `UpdateProductionCommand`, both inside one `BatchCommand`.
- [ ] **Step 6: Verify** `bun test src/production src/media`; in the browser, "Create these scenes" on a 6-scene draft yields 6 contiguous clips, one Cmd+Z removes all six and clears the links, voice/image panels still insert at the playhead.
- [ ] **Step 7:** Commit `feat(production): linked timeline placeholders`.

### Task 14: Batch rollback on failure

**Files:** Modify `src/commands/batch-command.ts`; Test `src/commands/__tests__/batch-command.test.ts`

- [ ] **Step 1: Write failing test**

```ts
test("a throwing child undoes earlier children in reverse and rethrows", () => {
  const log: string[] = [];
  const batch = new BatchCommand([fake("a", log), fake("b", log), throwing("c")]);
  expect(() => batch.execute()).toThrow("c failed");
  expect(log).toEqual(["do a", "do b", "undo b", "undo a"]);
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Wrap the loops in `execute` and `redo`: on a throw, undo the already-run children in reverse, then rethrow.
- [ ] **Step 4:** Pass; run `bun test` for the whole app. **Step 5:** Commit `fix(commands): roll back a batch when a child fails`.

### Task 15: Typed tool layer with revision checks

**Files:** Create `src/production/tools.ts`, `src/production/__tests__/tools.test.ts`

**Interfaces — Produces:**

```ts
type ToolResult<T = void> = { ok: true; value: T } | { ok: false; reason: "stale" | "invalid" | "unauthorized"; message: string }
productionActionSchema  // discriminated union on `type`:
  // { type: "create-placeholders", draftVersion }
  // { type: "replace-scene-visual", draftVersion, sceneId, sceneRevision, assetId }
  // { type: "request-narration", draftVersion, segmentIds[] }
  // { type: "generate-images", draftVersion, sceneIds[], provider, model, maxImages }
  // { type: "apply-edit", draftVersion, edit }   // edit is z.unknown() here; Task 23 tightens it to editProposalSchema
checkAction(production: Production, action: ProductionAction): ToolResult
readScenes(production: Production, sceneIds: string[]): StoryScene[]
```

Execution of each action is added by the task that owns it (13, 17, 20, 22, 23); this task owns validation only.

- [ ] **Step 1: Write failing tests**

```ts
test("an action for an older draft version is stale", () => {
  expect(checkAction(prodAtV3, { type: "create-placeholders", draftVersion: 2 }))
    .toEqual({ ok: false, reason: "stale", message: "The draft changed after this was proposed. Review the new version." });
});
test("a scene edited by the creator rejects a pending replacement", () => {
  const r = checkAction(prodWithS2AtRevision4, { type: "replace-scene-visual", draftVersion: 3, sceneId: "s2", sceneRevision: 3, assetId: "x" });
  expect(r).toMatchObject({ ok: false, reason: "stale" });
});
test("generate-images beyond maxImages or with unknown scene ids is invalid", () => { /* maxImages: 2, sceneIds: 3 → invalid; sceneIds: ["nope"] → invalid */ });
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. **Step 4:** Pass. **Step 5:** Commit `feat(production): validated action layer`.

---

## P4 · Narration (document 04, "Timing and revisions")

### Task 16: Inputs and experiment — voice and chunk seam (gate for D04, D06)

**Files:** Modify `planning/07-milestones-and-decisions.md`

- [ ] **Step 1:** Ask the creator for the narrator route and voice (provider, model, voice, style) and save it on the Popy series with `saveSeries`. Do not proceed with a guessed voice.
- [ ] **Step 2:** With the creator's go-ahead for two TTS calls: generate one passage as a single request and the same passage as two chunks split at a sentence boundary. Listen to the seam; compare total durations.
- [ ] **Step 3:** Record result and the D06 decision. **Gate:** if the seam is unacceptable, replace Task 17's chunking rule with the creator before continuing.

### Task 17: Narration chunking, request and reuse

**Files:** Create `src/production/narration.ts`, `src/production/__tests__/narration.test.ts`

**Interfaces — Produces:**

```ts
chunkNarration(segments: NarrationSegment[], maxChars: number): { segmentIds: string[]; text: string }[]
narrationHash(segments: NarrationSegment[], voice: Series["defaults"]["voice"]): string
needsNarration(production: Production, draft: ProductionDraft, voice): { reuse: true } | { reuse: false; chunks: ReturnType<typeof chunkNarration> }
requestNarration(args: { editor: EditorCore; draft: ProductionDraft; voice; apiKey: string }): Promise<BatchCommand>
```

- [ ] **Step 1: Write failing tests**

```ts
test("chunks break only between segments and stay under the limit", () => {
  const chunks = chunkNarration(segmentsOfLengths([1800, 1900, 1700, 400]), 4000);
  expect(chunks.map((c) => c.segmentIds)).toEqual([["n1", "n2"], ["n3", "n4"]]);
});
test("a single segment over the limit is reported, not split mid-sentence", () => {
  expect(() => chunkNarration(segmentsOfLengths([6000]), 4000)).toThrow("Narration n1 is longer than one request allows (4000 characters). Split the passage.");
});
test("unchanged text and voice reuses existing audio", () => {
  expect(needsNarration(prodWithNarration, draft, voice)).toEqual({ reuse: true });
});
test("changing the voice or any word requires new narration", () => { /* reuse: false, chunks.length === 2 */ });
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. `maxChars` is `MAX_TEXT_LENGTH` from `src/ai-voice/gemini-tts.ts` minus 500. `requestNarration` calls `generateSpeech` once per chunk with `narrationText(draft, chunk.segmentIds)` only (style goes in `style`), imports each WAV with `buildMediaInsertCommands` end to end on one audio track starting at 0, and returns one batch that also writes `production.narration` (hash, chunks, measured `seconds` from each processed asset's `duration`). Existing audio supplied by the creator is recorded the same way with no TTS call.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): narration request and reuse`.

### Task 18: Fit scenes to measured audio

**Files:** Modify `src/production/timing.ts`, `timing.test.ts`; Modify `src/production/components/scene-board.tsx`

**Interfaces — Produces:**

```ts
fitScenesToAudio(draft: ProductionDraft, chunks: { segmentIds: string[]; seconds: number }[]): ProductionDraft
retimeScenes(editor: EditorCore, draft: ProductionDraft): BatchCommand   // UpdateElementsCommand on linked elements
```

- [ ] **Step 1: Write failing tests**

```ts
test("each chunk's measured time is shared among its segments by character count", () => {
  const next = fitScenesToAudio(draft, [{ segmentIds: ["n1", "n2"], seconds: 12 }]); // n1 100 chars, n2 200 chars
  expect(next.scenes[0]).toMatchObject({ measuredSeconds: 4, timingSource: "measured" });
  expect(next.scenes[1]).toMatchObject({ measuredSeconds: 8, timingSource: "measured" });
});
test("scene totals equal audio totals", () => { /* sum(measuredSeconds) === 12 within 1e-6 */ });
test("fitting clears the timing stale flag and no other", () => { /* ["narration","timing"] → ["narration"] */ });
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. `retimeScenes` sets `startTime`/`duration` of each scene's linked image element from `planIntervals`; it never touches audio elements or their `retime`.
- [ ] **Step 4:** UI: label timings "Estimated" or "Estimated boundaries from a measured audio chunk"; "Aligned" is not shown until an alignment source exists. Stale narration shows "Script changed — narration needs regenerating" with a targeted action.
- [ ] **Step 5: Verify** with the creator's go-ahead for one short sample (3 scenes): generate, confirm scene cuts land within the spoken passages by listening, change one line, confirm only that scene and the narration are flagged.
- [ ] **Step 6:** Commit `feat(production): scene timing from measured narration`. Record the trial in document 07.

Word-level alignment (Whisper segments from `src/services/transcription/`) is the "Caption timing" experiment in document 07. Run it after Task 18 on the real sample; adopt `timingSource: "aligned"` only if boundaries are visibly better.

---

## P5 · Illustrations (documents 04 "Generation job", 05)

### Task 19: Generation job state machine

**Files:** Create `src/production/jobs.ts`, `src/production/__tests__/jobs.test.ts`; Modify `src/production/contract.ts`

**Interfaces — Produces:**

```ts
generationJobSchema // { id, projectId, sceneId, sceneRevision, provider, model, promptId,
                    //   referenceHashes[], providerJobId?, estimate?: string, usage?: string,
                    //   state: "prepared"|"queued"|"submitted"|"result-ready"|"imported"|"accepted"|"failed"|"unknown"|"import-failed"|"cancelled",
                    //   resultAssetId?, error?: { category: "auth"|"quota"|"network"|"provider"|"import"; message } }
type JobEvent = { type: "queue" } | { type: "submit"; providerJobId?: string } | { type: "result" }
  | { type: "imported"; assetId: string } | { type: "import-failed"; message: string } | { type: "accept" }
  | { type: "fail"; category; message } | { type: "lost-contact" } | { type: "cancel" }
advanceJob(job: GenerationJob, event: JobEvent): GenerationJob   // returns the same object when the event does not apply
nextAction(job: GenerationJob): "submit" | "poll" | "import" | "none"
```

- [ ] **Step 1: Write failing tests**

```ts
test("happy path", () => { /* prepared→queued→submitted→result-ready→imported→accepted */ });
test("a second 'imported' event is ignored", () => {
  const once = advanceJob(resultReady, { type: "imported", assetId: "a1" });
  expect(advanceJob(once, { type: "imported", assetId: "a2" })).toBe(once);
});
test("import failure retries the import, never the submission", () => {
  expect(nextAction(advanceJob(resultReady, { type: "import-failed", message: "quota" }))).toBe("import");
});
test("lost contact after submit must be reconciled before anything is resubmitted", () => {
  expect(nextAction(advanceJob(submitted, { type: "lost-contact" }))).toBe("poll");
});
test("cancel only affects jobs not yet submitted", () => {
  expect(advanceJob(queued, { type: "cancel" }).state).toBe("cancelled");
  expect(advanceJob(submitted, { type: "cancel" })).toBe(submitted);
});
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement; set `productionSchema.jobs` to `z.array(generationJobSchema)`. For a synchronous provider (Gemini image) `nextAction` on `unknown` is `"none"` and the UI offers "Check provider, then retry" as an explicit creator action.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): generation job lifecycle`.

### Task 20: Scene image generation and batch runner (OpenArt redesign required)

> **Superseded route:** The Gemini-specific interfaces/steps below are historical candidate work, not the initial route to execute. Re-plan this task using OpenArt MCP discovery, selected model forms and durable job/import handling from document 10. Preserve scene-bound batches and candidate acceptance.

**Files:** Create `src/production/images.ts`, `src/production/__tests__/images.test.ts`; Modify `src/image-batcher/components/assets-view.tsx:517-536`

**Interfaces — Produces:**

```ts
buildGeminiImageBody(args: { model: string; prompt: string; aspectRatio: string; resolution?: string;
  thinkingLevel?: string; subjectRefs: string[]; styleRefs: string[]; guide?: string }): Record<string, unknown>
prepareBatch(production: Production, auth: { sceneIds: string[]; provider: string; model: string; maxImages: number }): ToolResult<GenerationJob[]>
runBatch(args: { jobs: GenerationJob[]; apiKey: string; onJob(job: GenerationJob, result?: { dataUrl: string }): Promise<void>; signal: AbortSignal }): Promise<void>
```

- [ ] **Step 1:** Ask the creator for the canonical Popy reference image (D04) and store its asset name on the series cast entry. Run the "Stable character" experiment from document 07 (2 images, with go-ahead) and record it.
- [ ] **Step 2: Write failing tests** — `buildGeminiImageBody` output equals the body the batcher builds today for the same inputs (snapshot taken from the current code); `prepareBatch` skips scenes that already have `acceptedAssetId` and are not stale, creates one `prepared` job per remaining scene, and returns `invalid` when the count exceeds `maxImages`; `runBatch` with a mocked `fetch` where job 2 rejects reports job 2 `failed` and still completes jobs 1 and 3; aborting `signal` leaves unsent jobs `cancelled` and makes no further `fetch` calls.
- [ ] **Step 3:** Run → fail. **Step 4:** Move the body-building logic out of the batcher's `buildParts`/`generateOne` into `buildGeminiImageBody` and have the batcher call it. Implement `prepareBatch` and `runBatch` (sequential, no automatic retries, calls `requestGeminiImage`).
- [ ] **Step 5:** Pass; Image Batcher still generates in the browser. **Step 6:** Commit `feat(production): scene-bound image batches`.

### Task 21: Bound import, candidates and acceptance

**Files:** Modify `src/production/images.ts`, `images.test.ts`, `src/production/tools.ts`; Create `src/production/components/job-summary.tsx`, `contact-sheet.tsx`

**Interfaces — Produces:**

```ts
storeJobResult(args: { job: GenerationJob; file: File }): Promise<{ assetId: string }>
// saves through storageService.saveMediaAsset({ projectId: job.projectId, ... }) — the job's project, not the active one
attachResult(production: Production, jobId: string, assetId: string): Production   // adds candidate once; job → imported
acceptCandidate(editor: EditorCore, sceneId: string, assetId: string): BatchCommand
// UpdateElementsCommand { mediaId } on the scene's elementId + UpdateProductionCommand (acceptedAssetId, status "accepted", stale minus "visual")
```

- [ ] **Step 1: Write failing tests**

```ts
test("a result for project A is stored under A while B is open", async () => {
  await storeJobResult({ job: jobForProjectA, file });
  expect(saveSpy.mock.calls[0][0].projectId).toBe("A");
});
test("attaching the same result twice adds one candidate", () => {
  const twice = attachResult(attachResult(prod, "j1", "a1"), "j1", "a1");
  expect(twice.drafts[0].scenes[1].candidateAssetIds).toEqual(["a1"]);
});
test("a new candidate does not replace the accepted take", () => { /* acceptedAssetId unchanged, status "needs-review" */ });
test("accepting scene 2 leaves scenes 1 and 3, narration and timing untouched", () => { /* deep-equal on the rest */ });
```

- [ ] **Step 2:** Run → fail. **Step 3:** Implement. Order on completion: persist the file, then `attachResult` on the job's own project record (load, update, `saveProject` if that project is not active; `UpdateProductionCommand` if it is). Timeline placement happens only through `acceptCandidate` in the destination project. Source files and rejected candidates are kept.
- [ ] **Step 4:** UI: job summary (per-state counts, failures with category and one useful action, estimate shown as "unknown" when the provider gives none, Stop with the "already submitted" note) and contact sheet (candidates per scene, compare, accept, regenerate one scene).
- [ ] **Step 5: Verify** with go-ahead for a 3-scene batch plus one regeneration: reject scene 2, regenerate it alone, accept; switch projects mid-batch and confirm the result lands in the original project after reopening.
- [ ] **Step 6:** Commit `feat(production): candidate review and acceptance`. Record the trial in document 07.

OpenArt MCP is now the primary image/video route (document 10), so its discovery and scene-bound generation/import trial precedes this proof. The job model must support returned provider identifiers, asynchronous completion and reconnect/reconciliation.

---

## P6 · Editing assistant (documents 03 "Editing and undo", 05)

### Task 22: Captions from narration timing

**Files:** Create `src/production/captions.ts`, `src/production/__tests__/captions.test.ts`

**Interfaces — Produces:** `captionChunksFromDraft(draft: ProductionDraft, wordsPerChunk: number): CaptionChunk[]` (type from `src/transcription/types.ts`)

- [ ] **Step 1: Write failing tests** — chunks for a segment start and end inside that segment's scene interval; consecutive chunks do not overlap; text of all chunks joined equals `narrationText(draft)`.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement, spreading words evenly inside each segment's measured span. Insert with the existing `insertCaptionChunksAsTextTrack` in `src/subtitles/insert.ts`. Label these captions "timed by text length" in the UI, not word-aligned.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): captions from narration`.

### Task 23: Edit proposals through the command path

**Files:** Create `src/production/edit-proposal.ts`, `src/production/__tests__/edit-proposal.test.ts`, `src/production/components/edit-proposal-card.tsx`; Modify `src/production/tools.ts`

**Interfaces — Produces:**

```ts
editProposalSchema // { title, reason, actions: (
  //   { type: "captions"; wordsPerChunk: number }
  // | { type: "image-motion"; sceneId: string; preset: "slow-zoom-in"|"slow-zoom-out"|"pan-left"|"pan-right"|"still" }
  // | { type: "fade"; sceneId: string; edge: "in"|"out"; seconds: number }
  // | { type: "sound"; kind: "music"|"sfx"; soundId: string; atSeconds: number; volume: number; sceneId?: string }
  // )[] }
describeProposal(p: EditProposal, draft: ProductionDraft): string[]     // one human line per action, naming scenes
buildEditBatch(editor: EditorCore, draft: ProductionDraft, p: EditProposal): ToolResult<BatchCommand>
```

- [ ] **Step 1: Write failing tests** — a proposal naming an unknown `sceneId` or a scene without `elementId` returns `invalid` and builds nothing; `volume` above 1 or `fade.seconds` longer than the scene is `invalid`; `describeProposal` for a zoom on scene 3 returns `"Scene 3: slow zoom in over 5.5s"`.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement. Motion presets and fades are keyframes on the image element's transform/opacity through `UpdateElementsCommand` (see `src/animation/keyframes.ts`); Classic has no transition primitive, so "transition" means these fades. Sounds use `buildLibraryAudioElement` + `InsertElementCommand`, with ids from the existing `/api/sounds/search` or `src/sfx-kit/` catalogue only.
- [ ] **Step 4:** Proposal card: title, reason, `describeProposal` lines, Apply, and Undo after applying. Apply runs `checkAction` then executes the single batch; Task 14 guarantees rollback on failure.
- [ ] **Step 5: Verify** in the browser: apply a four-action proposal, one Cmd+Z removes all of it; original media is untouched. **Step 6:** Commit `feat(production): reviewed edit proposals`.

### Task 24: Editing specialist mode, range reads and review checks (runtime design superseded by document 09)

**Files:** Modify `src/director/contract.ts`, `src/app/api/director/route.ts`, `route.test.ts`, `src/director/project-context.ts`; Create `src/production/review.ts`, `src/production/__tests__/review.test.ts`

**Interfaces — Produces:**

```ts
readDirectorProjectRange(editor: EditorCore, range: { fromSeconds: number; toSeconds: number }): DirectorProject | null
// request mode gains "edit"; reply: { usage?, summary, proposal: EditProposal }
reviewCut(args: { draft: ProductionDraft; clips: DirectorProject["clips"]; captions: CaptionChunk[]; sounds: { name: string; start: number; volume: number }[] })
  : { severity: "problem" | "note"; sceneId?: string; atSeconds: number; message: string; evidence: string }[]
```

- [ ] **Step 1: Write failing tests** — `reviewCut` on a fixture seeded with a scene whose interval has no visual clip, a caption crossing a scene boundary by 0.6s, and an SFX at volume 0.95 reports exactly those three with scene/time anchors; a clean fixture reports none. Route: `mode: "edit"` returns a body parsing with `editProposalSchema`; a reply referencing a scene id not in the request returns 502.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement. `readDirectorProjectRange` returns only clips overlapping the range (still capped at 60); the edit request sends the draft's scene list plus the range around the selected scenes. Editing instructions state that the specialist has metadata and measurements only and cannot see or hear media. Thresholds: caption overrun > 0.25s, SFX volume > 0.8 — both constants at the top of `review.ts`.
- [ ] **Step 4:** Pass. **Step 5: Verify** full sample watch/listen with the creator after applying one proposal; list checks that were skipped (no frame or audio analysis exists yet).
- [ ] **Step 6:** Commit `feat(director): editing proposals and cut review`. Record in document 07.

---

## P7 · Reliable longer episode (document 07)

### Task 25: Resume and long-project behaviour

**Files:** Modify `src/production/components/job-summary.tsx`, `src/production/images.ts`; Test `src/production/__tests__/resume.test.ts`

**Interfaces — Produces:** `resumeJobs(production: Production): { job: GenerationJob; action: ReturnType<typeof nextAction> }[]`

- [ ] **Step 1: Write failing tests** — after reload, a `result-ready` job resumes with `import`; a `submitted` Gemini job becomes `unknown` with action `none`; `queued` jobs stay queued and are not auto-run; `accepted` jobs are omitted.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement; on project open, show "N jobs need attention" with per-job actions. Nothing paid restarts without a click.
- [ ] **Step 4:** Pass. **Step 5:** Commit `feat(production): resume interrupted work`.

### Task 26: Full-length Popy run (manual, with creator)

**Files:** Modify `planning/07-milestones-and-decisions.md`

- [ ] **Step 1:** Agree scope and budget with the creator: episode length, scene count ceiling, voice, image model.
- [ ] **Step 2:** Produce the episode through the app only: draft → placeholders → narration → images → edit proposal → export.
- [ ] **Step 3:** Check every narration chunk seam by ear, scene boundaries across the whole export, captions in at least the first, middle and last minute, and that close/reopen mid-run loses nothing.
- [ ] **Step 4:** Export a backup (Task 8), import it into a fresh browser profile, confirm the draft and series return and missing media is listed.
- [ ] **Step 5:** Record results, failures and anything unverified. Fix defects as new tasks before calling P7 done.

---

## Later (not planned in detail)

Stickman/doodle styles, advanced motion workflows, HyperFrames graphics, additional stock/music connectors, media-analysis review, packaging and publishing. Each gets its own experiment from document 07 and its own plan once P7 is proven. A 15-minute explainer is a target for that stage, not for this plan.

## Coverage check against the spec

| Spec item | Where |
| --- | --- |
| Conversation-first start, mic, presets as shortcuts (01, 02) | Tasks 1, 3b, 10, 11 |
| Follow-up form and `/` skills routed to specialists (02, 03, D13) | Tasks 3c, 10b |
| Loaded series context with visible source, no invented voice (01, 04) | Tasks 8, 10, 16 |
| Versioned production draft, narration separate from directions (04) | Tasks 5, 6, 9 |
| Scene count from pacing, not fixed (01) | Task 9 (`pacingReason`) |
| Story scene ≠ Classic scene (04) | Tasks 12, 13 |
| Same command path for manual and agent actions, named undoable batches (03) | Tasks 7, 13, 14, 15, 23 |
| Re-read revision before write, do not overwrite manual edits (03) | Task 15 |
| Measured audio drives timing; no speech stretching; chunking (04) | Tasks 16, 17, 18 |
| Stale marking after script change (04) | Tasks 6, 18 |
| Job lifecycle, bound destination, no duplicate assets, no paid resubmit (04) | Tasks 19, 21, 25 |
| Batch authorization, estimates labelled, stop semantics (03, 05) | Tasks 15, 20, 21 |
| Captions, motion, transitions, music/SFX proposals (01, 05) | Tasks 22, 23, 24 |
| Review with scene/time anchors and evidence (03, 06) | Task 24 |
| Export/backup beyond browser storage (04, D08) | Task 8, 26 |
| Honest trial records (07) | Tasks 4, 12, 16, 18, 21, 24, 26 |

**Not covered, on purpose:** separately voiced character dialogue (the contract carries `speaker`, but only the narrator route is built), image *editing* as opposed to regeneration, unified credentials/settings page, structured Brand Kit/template records beyond the series record, and all "Later" items.
