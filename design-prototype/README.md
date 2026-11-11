# OpenCut design prototype

> **Active local design experiment:** This mock demonstrates the intended happy path, not a live agent or complete specification. Start with `../planning/09-agent-foundation.md`. The folder is currently untracked; its ignore rule is commented out.

Open `index.html` directly in a browser, or use the local preview at http://127.0.0.1:4180/design-prototype/ while its server is running.

- **01 · Editor design** recreates the supplied empty editor screenshot. Import loads a sample title card; select its timeline clip to see properties. Director demonstrates a fixed proposal, apply, and undo.
- **02 · Plan & possibilities** consolidates the README, Director plan and research plan into a creator journey, tool catalog, context and architecture diagrams, milestones and open decisions.
- Notes can be saved in browser storage or downloaded. Saving notes does not rewrite the HTML. Browser storage depends on the browser and origin; download notes to keep a portable copy.
- Reset mock state is on the planning tab. Reload also resets the editor, while saved notes stay in that browser.

The prototype is self-contained: font, library icons and the supplied OpenCut mark are embedded. No package installation, build, API keys or network requests are needed for the main HTML. Source-document links assume this folder stays inside OpenCut.

## Editing

Edit `index.html` for future design iterations. Styles are in `<style>`, page content in `<main>`, and mock behavior in `<script>`. All mock data is separate from real projects. `comparison.html` embeds the reference screenshot beside the live prototype at matching dimensions for visual review.

No production code or existing plan documents were changed. This folder is untracked; no commit was created.

## Happy path v02

Open the floating Director chat and follow its suggested phrases. Describe the idea in chat (settings are optional), request a story, create scenes, add narration, generate illustration slots, request/apply an editing pass, and review the cut. Ordinary requests and slash commands share mock actions. All activity, timing, voices and image slots are simulated; no provider calls are made. Optional scene-4 failure exploration is inside Scenes. The current prototype does not execute code or run real specialists.
