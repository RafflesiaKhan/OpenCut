## Chat-first correction verification · 11 November 2026

- Chat opens with a greeting and a visible multiline “Message Director…” composer below the conversation.
- Sending an initial Popy idea created zero inline forms and returned a conversational reply.
- Sending “Show settings” created one inline form inside the log; the separate composer remained visible (65 CSS pixels high at 1440 × 900).
- Suggested phrases are collapsed optional assistance. The initial automatic form described in the earlier QA below is superseded.

# Happy-path prototype QA · v02 · 11 November 2026

final result: passed

Scope: current conversational happy path and expanded workspace. The original screenshot remains the baseline for the closed-chat empty editor; the expanded sidebar intentionally changes the layout to keep the conversation and production materials accessible.

## Browser evidence

- URL: `http://localhost:4180/design-prototype/` in the in-app browser. The numeric-loopback URL did not load in that browser; localhost did.
- Main verification viewport: 1440 × 900 CSS pixels. Initial compact chat was also observed at the browser's smaller default viewport; complete narrow/mobile workflow was not verified.
- Captured screenshots of compact chat, draft activity and the expanded editing/timeline result in the session. No separate screenshot files were saved.
- Visual fix after first pass: moved the expanded Director to a taller right sidebar, with preview and timeline resized beside it. Closed-chat geometry remains unchanged.
- Layout, embedded font, light-theme colours, readable content and mock labels checked in the rendered page. Existing library icons and assets were preserved; no new raster assets were needed for this mock.

## Verified interactions

1. Floating chat opens; no modal on load.
2. Suggested initial request displays the editable brief.
3. Continue records the actual selected length (the form.length name collision is fixed).
4. Natural-language story request produces simulated specialist activity and a draft.
5. “Create the scenes” adds six timeline slots, checks the count and selects the first preview.
6. Narration adds one simulated audio track and updates mock timing.
7. Illustration batch completes all six visual stand-ins without a forced failure.
8. Editing pass offers three represented changes: captions, slow image motion and music.
9. Apply adds the represented layers; Undo preserves six scenes/narration and removes the editing layers.
10. `/scenes` through the keyboard menu reports existing placement and creates no duplicates.
11. Natural-language Apply uses the same editing action; review starts through the same conversation.
12. Browser error-log query returned no entries; JavaScript syntax and local planning links passed checks.

## Limits

This is fixed intent matching with scripted outputs, a fictional narrator and coloured artwork stand-ins. No live model, real specialist, recording, media generation, code execution, audio playback or rendering was tested or implemented. Cancellation, failure exploration, candidate regeneration, dark-theme full workflow, and complete cross-browser/mobile behavior remain outside this QA pass.

The real agent foundation is defined in `../planning/09-agent-foundation.md`. No production application code changed and no commit was created.

---

## Historical v01 review (superseded for current interactions)

# Prototype design QA · 11 Nov 2026

final result: passed

## Evidence

- Source: `/Users/rafflesiakhan/Desktop/Screenshot 2026-11-11 at 4.55.52 PM.png` (3014 × 1654).
- Implementation: `index.html`, rendered in the in-app browser at `http://127.0.0.1:4180/design-prototype/`.
- Comparison: `comparison.html`; a browser-rendered screenshot of both source and implementation was captured together in the chat tool output. Screenshot bytes were not saved as separate files. Reopen this self-contained comparison page to reproduce the visual evidence.
- State: light theme, empty editor, Director closed, no mock asset.
- CSS viewport: 2048 × 1124; device pixel ratio 1. Source normalized proportionally from 3014 × 1654. Both comparison columns display at 1000 pixels wide; the live iframe retains the 2048 × 1124 CSS viewport.
- Additional desktop check: 1280 × 800; no horizontal document overflow.

## Comparison history

1. Initial capture found a padded favicon that made the mark too small, an approximate properties icon, a native dark zoom track, and an upper workspace about 5 pixels too tall at the target viewport.
2. Reused the actual OpenCut logo asset and the existing Hugeicons Settings05, Upload and CloudUpload icons; corrected the panel height and range styling.
3. The supplied logo's light variant disappeared on the white header. Replaced it with the dark source variant and repeated the combined source/prototype capture. The logo is visible and main panel geometry matches.
4. Mock-flow review found undo should restore a pre-existing sample state. Corrected it and verified apply/undo from the empty state in the browser. Simplified the proposal to one visible title-card change.

## Fidelity surfaces

- **Typography:** embedded the project's actual Inter font. Labels, muted text, heading weight and empty-state wrapping closely follow the reference. Minor platform rasterization differences remain.
- **Spacing/layout:** header, left asset rail, three upper panes, 16:9 black canvas, toolbar, track header and empty timeline follow the reference. Upper panes end at y≈588 versus reference y≈589 at 2048 × 1124. The two requested page tabs intentionally occupy the empty middle of the header.
- **Colors:** light neutral panels, thin gray borders, black preview, muted labels, cyan playhead, blue selected tools and blue Export button match the reference palette.
- **Assets/icons:** supplied OpenCut mark, installed Hugeicons library, embedded Inter. No generated imagery is needed for the empty screenshot. Some secondary toolbar glyph variants differ slightly (P3).
- **Copy:** reference empty-state and primary controls retained. Added planning and mock-only copy is clearly separate from real editor state.
- **Focused review:** inspected the asset import area, properties empty state, header mark and timeline controls in the target-size implementation capture and combined comparison. No unresolved substantive drift in these regions; secondary icon polish remains optional.

## Interaction checks

- Both page tabs switch the visible panel.
- Sample Import creates a title card and mock timeline clip.
- Selecting the clip reveals properties.
- Director opens, displays a scripted proposal, applies a mock title card and undoes it back to the empty state.
- Planning notes save successfully to browser storage. Temporary verification text was cleared afterward.
- Reset restores the empty reference layout.
- JavaScript syntax check passed. Browser error-log query returned no entries.

## Follow-up polish / limits

- P3: refine secondary glyph variants and tiny spacing differences as desired; this is a close editable recreation, not a pixel-identical screenshot.
- Toolbar actions outside the demonstrated flow show mock notices. Provider calls, real imports, real playback/render/export and all production integrations are outside this prototype.
- Mobile usability, cross-browser rendering, note download behavior, persisted notes after a full browser restart, and production integrations were not tested.

## Implementation checklist

- [x] Recreate reference as editable HTML.
- [x] Add the visual plan as a second tab.
- [x] Keep data and interactions mocked.
- [x] Compare the reference and implementation together.
- [x] Fix substantive findings and verify the core mock interactions.
- [x] Leave production source and existing plans unchanged; do not commit.
