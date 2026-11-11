# Workspace and HTML prototype plan

Status: active HTML design iteration · simulated happy path · 11 November 2026

## Preserve the familiar editor

Keep the screenshot-derived layout: materials on the left, preview in the centre, properties on the right, timeline below, Director available through a floating preview icon. The current two tabs remain **Editor design** and **Plan & possibilities**. New workflow states should live inside the editor view rather than becoming a sprawling set of new pages.

## Opening conversation

When the creator clicks the floating agent icon, open a compact chat (no pop-up on load) with:

- “What are we making today?” and a prompt field.
- A microphone button with visible recording/stop state; type instead remains available.
- Optional recent series and preset cards, including a Popy example. A grid is a shortcut, not required setup.
- A compact editable summary after a request: series, purpose, visual treatment, voice, length and ratio.

Do not require the creator to answer a questionnaire before explaining their idea. Do not select a voice, paid provider or saved series ambiguously and hide the choice.

In the prototype the microphone must be explicitly marked simulated unless real recording is intentionally implemented. Fixed replies must be labeled scripted mock behavior.

## Slash commands in the chat

Requirement (creator, 11 November 2026). The Director chat works like a command-capable assistant: plain language always works, and typing `/` opens a short menu of named skills that can be picked with the keyboard.

- A first message such as "another Popy story" receives a conversational response. Keep a visible message composer throughout. Show an inline settings/brief form only on request or when a specific missing choice benefits from it; pre-fill only known defaults and never guess a real voice.
- `/` lists the skills that make sense now, each with a one-line description. Skills whose inputs are missing are shown greyed with the reason ("needs a script first") instead of being hidden.
- Choosing a skill hands the work to the matching specialist and shows a brief status line; the result is a proposal or draft the creator reviews, exactly as if they had asked in words.
- A slash command is a shortcut to the same action, never a second way of doing it with different rules. Cost and approval behaviour are identical.

Starting set (names are proposals): `/new`, `/series`, `/script`, `/scenes`, `/voiceover`, `/images`, `/edit`, `/review`, `/export`, `/help`. Creator-defined skills and presets are a later addition.

## Working surfaces

| Surface | What the creator sees | Primary interactions |
| --- | --- | --- |
| Director conversation | Current request, loaded context, short specialist activity, suggested next action | Send, `/` skill menu, stop, revise request, inspect context |
| Production draft | Narration beside scene directions; version label and timing estimates | Edit passage, revise selected scene, compare draft |
| Scene board | Scene cards with narration excerpt, duration, thumbnail/placeholder and status | Select, reorder, inspect prompt, generate selected, compare takes |
| Timeline | The same scenes and accepted assets with narration/captions/audio | All existing manual operations; scene selection synchronizes the board |
| Job/review summary | Progress, failures, accepted results and estimated/actual cost | Retry import, inspect uncertain job, cancel queued work, apply edit batch, undo |

A scene card is a view of the project, not an independent copy of its state. The selected layout is a floating chat that expands into the side panel while preserving the same conversation. Sizes and material visibility remain design details to test.

## First mock walkthrough

Use a fictional new Popy episode rather than claim an existing script or voice is already loaded. Label sample timings, prompts and generated results as mock data.

1. Open the chat and type “another Popy story”; get a conversational reply.
2. Show the relevant context conversationally; optional settings can be requested without leaving chat.
3. Display a short demonstration production draft and a handful of scene cards. The sample count is for the demo only.
4. “Create timeline placeholders” populates the mock timeline.
5. “Use narration” changes timing from estimated to a clearly simulated aligned state.
6. Generate sample images with per-scene progress; one result fails or is rejected.
7. Regenerate only that scene, compare alternatives, accept one.
8. Preview an editing proposal, apply it and undo it; preserve the original media.

The point is to test whether the creator understands and likes the flow. No real provider connection or generation is needed for this walkthrough.

## States worth designing before coding

- Wrong series inferred; switch series without silently restyling accepted assets.
- No saved voice, unavailable provider, or unknown estimate.
- Narration exists already; skip TTS.
- One image fails while the rest succeed.
- Provider completes while another project is open.
- Creator manually moves a scene while the agent is preparing an edit.
- Script changes after voice and images exist; show affected items as needing review.
- Stop during a batch; distinguish queued cancellation from already submitted provider jobs.

## How we judge the prototype

The creator should be able to explain the loaded context, scene/narration relationship, selected output, cost scope and next action by looking at the screen. Check keyboard access, readable labels, focus after closing the overlay and reachability of controls on a smaller desktop viewport.

The planning tab should later link/summarize these Markdown plans so it does not become a second conflicting specification. This synchronization is a future prototype change, not completed work.

## Current happy-path iteration

See [09 · Agent foundation](09-agent-foundation.md) for the current architectural contract. The prototype accepts fixed examples of ordinary requests and slash commands through the same mock actions. It shows simulated reads, specialist work, tool execution and checks. Use the suggested phrases to walk from brief to draft, timeline, narration, illustration slots and a reviewed edit. Failure exploration is separate from the default successful path. The mock is not evidence of general language understanding, live subagents, media analysis or code execution.

## Chat-first correction · 11 November 2026

The agent always opens as a conversation with a visible message composer. A first idea receives a conversational reply, not an automatic brief form. Forms/settings appear inline only when requested or when missing information needs a specific structured choice. Suggested messages and presets are optional aids. The message input stays visible as the conversation grows. The current HTML uses this corrected interaction.
