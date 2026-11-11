# Workspace and HTML prototype plan

Status: proposed design for visual exploration · no HTML changes in this task

## Preserve the familiar editor

Keep the screenshot-derived layout: materials on the left, preview in the centre, properties on the right, timeline below, Director beside Export. The current two tabs remain **Editor design** and **Plan & possibilities**. New workflow states should live inside the editor view rather than becoming a sprawling set of new pages.

## Opening conversation

When creating a project, show a small dismissible Director overlay with:

- “What are we making today?” and a prompt field.
- A microphone button with visible recording/stop state; type instead remains available.
- Optional recent series and preset cards, including a Popy example. A grid is a shortcut, not required setup.
- A compact editable summary after a request: series, purpose, visual treatment, voice, length and ratio.

Do not require the creator to answer a questionnaire before explaining their idea. Do not select a voice, paid provider or saved series ambiguously and hide the choice.

In the prototype the microphone must be explicitly marked simulated unless real recording is intentionally implemented. Fixed replies must be labeled scripted mock behavior.

## Working surfaces

| Surface | What the creator sees | Primary interactions |
| --- | --- | --- |
| Director conversation | Current request, loaded context, short specialist activity, suggested next action | Send, stop, revise request, inspect context |
| Production draft | Narration beside scene directions; version label and timing estimates | Edit passage, revise selected scene, compare draft |
| Scene board | Scene cards with narration excerpt, duration, thumbnail/placeholder and status | Select, reorder, inspect prompt, generate selected, compare takes |
| Timeline | The same scenes and accepted assets with narration/captions/audio | All existing manual operations; scene selection synchronizes the board |
| Job/review summary | Progress, failures, accepted results and estimated/actual cost | Retry import, inspect uncertain job, cancel queued work, apply edit batch, undo |

A scene card is a view of the project, not an independent copy of its state. The final placement/size of Director is unresolved: overlay for greeting, expandable side panel while working is the current proposal.

## First mock walkthrough

Use a fictional new Popy episode rather than claim an existing script or voice is already loaded. Label sample timings, prompts and generated results as mock data.

1. Open greeting; select Popy or type “another Popy story.”
2. Show a loaded-context card with an editable missing narrator field if the profile is unknown.
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
