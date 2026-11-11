# Existing tools and connector plan

Status: selective source inspection on 11 November 2026; no live integration tests

## Local foundations

| Area | Evidence in Classic | What remains |
| --- | --- | --- |
| Director | `src/director/` and `src/app/api/director/route.ts` | Current prompt explicitly limits it to read-only metadata; add structured production drafts, tool execution and specialist handoffs |
| Project context | `src/director/project-context.ts` | Snapshot caps at 60 clips and 30 asset names; add time-range/scene-aware reads for longer projects |
| Saved context | `src/director/director-panel.tsx` | Local saved channel/series/notes exist; structured series assets, kits and episode relationships need design |
| Voice | `src/ai-voice/`, `src/murf-voiceover/`, `/api/voice-studio` | Reuse existing requests; expose agent-callable service boundaries, long narration and alignment |
| Images | `src/ai-image/`, `src/image-batcher/` | Add scene/prompt/reference bindings and accepted-take review; actual selected-model access needs verification |
| Shared import | `src/media/use-add-extension-media.ts` | Already processes files and inserts through commands; currently targets the active scene/playhead and must be adapted carefully for delayed scene-bound jobs |
| Commands | `src/commands/` | Existing insertion, updates, scenes and batch undo; validate agent payloads and partial-failure handling |
| OpenArt | `src/director/openart-connector.tsx`, `/api/director/openart` | OAuth/tool discovery foundation exists; generation, persistent jobs and result-to-scene import are not established by this review |
| Captions | `src/services/transcription/worker.ts`, `src/transcription/caption.ts` | Segment transcription and proportional chunk timing exist; do not label current caption chunks measured word timestamps |
| Sound | `/api/sounds/search`, `src/sfx-kit/` | Scene-aware selection, placement and actual mix review |

Paths above are relative to `apps/classic/`. Code presence is not a passed production workflow. Exact models, access, prices and limits in existing constants are not independently validated here.

## One capability path for UI and agents

Proposal: expose existing service functions and command operations through a small typed tool layer. Keep React panels as UI clients, not the only place generation logic lives. Reuse the established media-processing/import pipeline rather than creating a second one for the Director.

Start with: read project/context; save production draft; read selected scenes; propose/create placeholders; request narration; import existing result; replace a scene's selected visual; propose/apply/undo an edit batch. Names and schemas are not frozen yet.

A connector describes operations it actually supports: image generation/editing, video generation, TTS, search or rendering; input/reference kinds; aspect ratios and durations; authentication; estimate availability; asynchronous-job behavior; and result import needs. A model name does not establish all those capabilities.

## Integration priorities

| Route | Planned role | Priority / proof |
| --- | --- | --- |
| Existing voice and image extensions | First narration and illustrations | Prove one selected route end to end before adding another |
| OpenArt MCP | Additional image/video/editing operations exposed to the account | Discover current schemas, run an authorized sample, bind output to one scene |
| HyperFrames | Project graphics, motion slides, overlays and reusable effects | Keep earlier engine direction; prove a render imports and matches preview |
| Local media analysis | Frames, transcripts, audio/mix measurements and scene review | Give editing/review specialists actual media evidence |
| Stock/music/SFX connectors | Search existing resources before generating unnecessarily | Show source and per-asset usage/attribution information |
| Stickman Director patterns | Style-specific direction and image/micro-motion workflows | Test after the common scene contract is usable; see document 06 |
| Additional APIs (e.g. generation gateways or voice providers) | Broader user-selected models | Add only for a demonstrated gap and official interface |
| External production frameworks | Optional interoperability experiments | Do not replace Classic's timeline or project state by default |

Image editing needs its own capability test: identify source image and instruction, preserve original, return a new candidate, and accept it onto the same scene. Text-to-image support is not proof of image-edit support.

## Costs and credentials

Separate reasoning/token costs, generation credits, TTS, rendering and storage. Show estimates as estimates, including unknown portions; record actual charges only when reported. Prefer stills plus appropriate motion where that serves the story; generated clips are a per-scene choice. No model recommendation or fixed credit table is locked by these plans.

The existing plans prefer local `.env` during development, but inspected extension code also uses browser-session keys for some routes. Audit and consolidate that boundary before promising one unified Settings page. Keep credentials out of scripts, prompts, series records, job logs and Markdown plans. Provider calls and reference uploads must go only to the selected, authorized service.

At runtime, respect a batch's authorized scope and budget. Do not silently switch a selected voice/model, upload extra series references, regenerate paid work after import failure, or treat account connection as unlimited spending authority.

## Portability and failure behavior

Project data must record which outputs are owned locally versus only referenced remotely. Handle expired result URLs, revoked auth, partial batches and interrupted sessions. A connector being configured, a key being present or a tool being listed is not proof a generation succeeds. Preserve error categories and useful retry actions without dumping credentials.
