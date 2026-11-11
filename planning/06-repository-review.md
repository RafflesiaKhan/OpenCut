# Review of the suggested agentic video projects

Reviewed 11 November 2026. Scope: repository documentation, directory listings and selected implementation files through the GitHub connector. No repository was installed, executed, benchmarked or copied. Instructions in reviewed skills were treated as source material, not activated workflows.

## Verdict at a glance

| Project | Best contribution to this editor | Reuse proposal | Important limit |
| --- | --- | --- | --- |
| MrPaidSocial Video Editor Agent | Editing craft, render QA, versioned review and resumable work | Study patterns now; evaluate direct component reuse only after permission/license is clear | No root license file found in the inspected listing; public visibility is not reuse clearance |
| OpenMontage | Production artifacts, orchestration, live scene board and provider-job handling | Architecture reference; an isolated interoperability trial is optional later | Repository declares AGPL-3.0; do not assume it can simply be vendored into this fork or that process separation settles licensing |
| Stickman Video Director | Concrete style contracts, narration-led timing and illustrated micro-animation | Strongest candidate for a small style-workflow experiment | MIT code license does not validate every bundled asset, third-party provider or output claim |

These are recommendations, not selected dependencies. They are not three drop-in agents that can already edit Classic's project format.

## 1. MrPaidSocial Video Editor Agent

[Repository](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent) · [README](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent/blob/main/README.md)

The README describes a Claude Code skill pack for short-form editing with HyperFrames, sound design, reference-style analysis and revision review. Its orientation is useful for the editing specialist; it is less directly a recurring illustrated-story authoring system. Most runtime claims remain upstream documentation, not our verification.

More concrete evidence:

- [Project/catalog documentation](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent/blob/main/tools/editor/README.md) describes artifact fingerprints, progress invalidation after input changes, versioned renders, review-note import and media indexing. Adapt the underlying ideas to our existing storage, not a second source of truth.
- [QA documentation](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent/blob/main/tools/video-qa/README.md) separates technical, transcript, frame and semantic checks, with explicit missing/degraded coverage. This suggests a useful review ladder: cheap measurements before expensive model review.
- [Inspected storyboard implementation](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent/blob/main/tools/video-qa/src/storyboard.ts) validates unique IDs and intervals, checks static scheduling, and extracts render samples. It explicitly leaves rendered visibility unverified: a planned element being present in HTML is not proof it appears in the final video. Our QA should retain that distinction.
- [OpenArt workflow reference](https://github.com/mrpaidsocial/mrpaidsocial-video-editor-agent/blob/main/.claude/skills/openart-broll/SKILL.md) is relevant to capability discovery, model-form-specific requests, cost review and asynchronous result inspection. Its observed billing numbers, model constraints and timing are not adopted as current provider facts.

**Proposed use:** editing/review craft references, artifact invalidation, stable issue anchors and local review behavior. Do not inherit aggressive SFX defaults, talking-head assumptions or public review-page hosting for every channel. The first integration probe would be one rendered Popy sample with known missing-scene and caption-timing defects, using an independently implemented check or permitted component.

**License status:** the root listing lacked a LICENSE and GitHub metadata returned no detected license. This is a finding from a limited inspection, not proof no permission exists anywhere. Clarify the applicable terms before copying/adapting code or substantial skill text; record file-specific notices if supplied.

## 2. OpenMontage

The supplied [calesthio URL](https://github.com/calesthio/OpenMontage) redirected to [OpenMontageInc/OpenMontage](https://github.com/OpenMontageInc/OpenMontage) during review. Use the canonical source when rechecking.

The [README](https://github.com/OpenMontageInc/OpenMontage/blob/main/README.md) describes a broad production framework with multiple pipelines and render/provider routes. Its range is useful as a capability map; adopting all of it would add another production system alongside Classic. Provider-count and demo-cost claims were not independently reproduced.

Selected evidence:

- [Hybrid pipeline manifest](https://github.com/OpenMontageInc/OpenMontage/blob/main/pipeline_defs/hybrid.yaml) names stage inputs/outputs, specialist skills, tool availability and review criteria. Borrow the idea of explicit handoff artifacts for our Director. Its numerous default approval gates and render preferences are not our UX requirements.
- [Backlot documentation](https://github.com/OpenMontageInc/OpenMontage/blob/main/backlot/README.md) describes a local read-only board derived from project artifacts/checkpoints, plus series grouping. This supports our scene board as a view of shared state. A series label in a library is not evidence of our richer character/voice/continuity memory.
- [Inspected provider-job code](https://github.com/OpenMontageInc/OpenMontage/blob/main/tools/provider_jobs.py) separates submission from polling, persists job metadata and downloads results through temporary files. On polling timeout it tells callers to resume rather than submit again. This directly informs our uncertain-job/import-retry design; it is not proof every adapter is correct.

**Proposed use:** explicit artifacts, honest capability availability, visible production progress and resumable jobs. If we trial a separate runner, pass only scoped inputs and import returned media/manifests; verify mapping to Classic rather than allowing two timelines to diverge.

**Reuse boundary:** its [LICENSE](https://github.com/OpenMontageInc/OpenMontage/blob/main/LICENSE) is AGPL-3.0. Keep it a reference until the intended reuse/distribution route and applicable obligations have been reviewed. No code or skill text was incorporated here. This document is a planning boundary, not a legal compatibility opinion.

## 3. Stickman Video Director

[Repository](https://github.com/kaomei/stickman-video-director) · [English README](https://github.com/kaomei/stickman-video-director/blob/main/README.en.md) · [MIT license](https://github.com/kaomei/stickman-video-director/blob/main/LICENSE)

The README distinguishes prompt-oriented Director workflows from rendered Autopilot workflows. It shows multiple treatments beyond basic stick figures. Its marketing claims about cost, retention or monetization are not success criteria or guarantees for our product.

Selected evidence:

- [Main skill](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/SKILL.md) separates production contracts by mode/style. Its A1–A5 route imposes roughly ten-second prompt segments and substantial setup/review rules. Those are specific to that route; they should not become universal scene-length or onboarding constraints here.
- [Autopilot reference](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/references/autopilot.md) describes independent style settings, preserved accepted media and narration-led timing. This is close to the creator's still-image plus motion workflow. Treat it as a workflow specification rather than evidence of automatic production from an arbitrary input.
- [Inspected core runtime](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/scripts/autopilot-core.mjs) reads local project media, probes the voice duration and validates shot intervals/layers for B1–B4. It demonstrates real deterministic support around authored scene data. It is not a complete style-independent renderer, and B5 uses a different route.
- [Inspected caption adapter](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/scripts/align_captions.py) uses optional local Whisper word timestamps and rejects overwriting an existing output. It still calls for timing/text review; alignment quality needs testing on our audio.

**Proposed use:** an optional stickman/hand-drawn skill and preset package on top of the common project contract. Preserve user's chosen voice and duration. Test a tiny illustrated sample and import its output to Classic before considering deeper editable integration. Rendered MP4 import is not equivalent to importing editable layers or a drawing-hand effect.

**Reuse boundary:** the root MIT license makes selected-code adaptation a candidate with notices preserved, subject to checking specific files/assets/dependencies. We have not performed that full audit or selected code to copy.

## Evidence anchors for future rechecks

These are observed Git blob SHAs from directory metadata, not whole-repository commit pins. Re-resolve and pin a complete commit before any implementation trial.

| File | Observed blob SHA |
| --- | --- |
| MrPaidSocial `tools/video-qa/src/storyboard.ts` | `8b807ee01e771b894163dc0df9f2d47aa9e0bfed` |
| OpenMontage `pipeline_defs/hybrid.yaml` | `b46dd642d9b31ef6ed2d41c5efbc70178963d9e1` |
| OpenMontage `tools/provider_jobs.py` | `5067ac30092df7cad98ebed368a23ba54488d9cc` |
| Stickman `scripts/autopilot-core.mjs` under the skill | `abc3367cb7b4eedf9f970c13734679b91a3e9d6c` |
| Stickman `scripts/align_captions.py` under the skill | `b7f497f11b365414baebe7ce972343b8d9ba4b9e` |

## What this review does not establish

No measured output quality, long-video reliability, macOS readiness, paid-provider access, current pricing, exact clip limits, image-edit feature coverage or native Classic integration was tested. Popularity and screenshots are discovery signals, not evidence that a workflow fits our project. Recheck official provider documentation and file-specific rights when an experiment actually needs them.
