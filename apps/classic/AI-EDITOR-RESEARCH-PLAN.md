# AI video editor: full research and plan

Researched Nov 10, 2026. This extends the [Director plan](DIRECTOR-PLAN.md) and the roadmap in the root README. It is the whole plan: what exists, what to adopt, how the product works for YouTube and for TikTok/Shorts, every build phase, an idea bank, recommendations, and fields to research later.

**How to read the evidence.** **[code]** means I read it in this repo or a collected repo. **[web]** means web searches on Nov 10, 2026; where sources were secondary or disagreed, the text says so. **[craft]** is editing and content practice from my own knowledge, not checked against data. **[call]** is my recommendation.

**Contents**

1. The product
2. Decisions made
3. What Classic has today
4. Verdict on every collected repo
5. Target architecture
6. The two platform tracks: long-form YouTube, and TikTok/Shorts
7. Capability plans (the detail behind each phase)
8. Build phases
9. Idea bank
10. Recommendations
11. Future fields of research
12. Risks
13. Not yet verified
14. Sources

---

## 1. The product

One editor where a creator and an assistant, the Director, make a video together from idea to upload. The Director should behave like a small production team:

| Role | What it does |
| --- | --- |
| Researcher | Explains a concept, finds what is working on the platform, studies reference videos |
| Writer | Hook, script, chapter outline, titles, descriptions |
| Storyboard artist | Shot list, B-roll plan, where graphics and diagrams appear |
| Producer | Makes materials: voice, images, video shots, diagrams, motion graphics, characters |
| Editor | Cuts, trims, reorders, paces, zooms, on the real timeline |
| Sound designer | Music under the voice, SFX on the right moments, even loudness |
| Captioner | Subtitles that match the speech, styled to the brand |
| Publisher | Chapters, thumbnail, export per platform, upload |

To do this it needs five capabilities. The whole plan is organised by them.

1. **Eyes and ears**: see frames, hear audio, read a transcript.
2. **Hands**: typed, undoable edit actions on the timeline.
3. **Brain loop**: a model that calls tools over several steps and loads skills on demand.
4. **Workshop**: generators, libraries, and a code-to-video engine.
5. **Memory**: channel, series, Brand Kit, and saved edit recipes.

## 2. Decisions made

| Decision | Choice | Date |
| --- | --- | --- |
| Personal tool or shared product | **Personal for now.** Freesound search, `yt-dlp` for analysis and local VoiceStudio stay. Revisit before sharing. | Nov 10, 2026 |
| Agent loop | **Vercel AI SDK**, confirmed against its official docs (details in 7.1). | Nov 10, 2026 |
| Platform order | **Long-form YouTube first.** TikTok/Shorts is designed in now (section 6) and built as the second track. | Nov 10, 2026 |
| Effects and transitions | **HyperFrames renders for now.** Build an effect into Classic only once it is reused. | Nov 10, 2026 |
| Editor base | Classic editor in `apps/classic` (from the README). | Nov 8, 2026 |

## 3. What Classic has today [code]

| Capability | State | Where |
| --- | --- | --- |
| Director chat | One question, one answer. Sends at most 60 clips and 30 asset names as JSON. Its prompt tells the model it cannot see footage or make edits. Four providers called with raw `fetch`. | `src/director/`, `src/app/api/director/route.ts` |
| Edit commands | A real undoable command layer: insert, split, move, update, delete, duplicate elements; tracks; keyframes; effects; masks; scenes; batch command. | `src/commands/` |
| Effects | One effect is defined: blur. No transitions folder found. | `src/effects/definitions/` |
| Transcription | Whisper in the browser (`@huggingface/transformers` 3.8). Returns **segments only**. | `src/transcription/`, `src/services/transcription/worker.ts` |
| Captions | Word timing is **estimated** by spreading words evenly across a segment. Style supports font, colour, background, placement. No per-word highlight or animation. | `src/transcription/caption.ts`, `src/subtitles/` |
| Subtitle files | SRT and ASS **import** only. No export function. | `src/subtitles/srt.ts`, `ass.ts` |
| Sound | Freesound search route, and the SFX Kit catalogue with when-to-use notes. | `src/app/api/sounds/search/`, `src/sfx-kit/` |
| Generators | AI Voice (Gemini, local VoiceStudio), Murf, AI Image, Image Batcher, OpenArt connector. | `src/ai-voice/`, `src/murf-voiceover/`, `src/ai-image/`, `src/image-batcher/` |
| MCP | `@modelcontextprotocol/sdk` is already a dependency. | `package.json` |
| Media storage | Project media lives in the browser (IndexedDB and OPFS). | `src/services/storage/` |

Consequences:

- The command layer means the Director's hands are mostly a wrapping job.
- Captions need measured word timestamps before any styling work is worth doing.
- Footage analysis runs on the machine, media lives in the browser. A local route must hand files across.
- With one effect and no transitions, visual polish has to come from somewhere else for now. That is HyperFrames.

## 4. Verdict on every collected repo

### Use

| Repo | Licence | Role | Evidence |
| --- | --- | --- | --- |
| `slide/claude-video-vision` | MIT | **Eyes and ears.** MCP server: `video_info`, `video_analyze`, `video_watch`, `video_detail`. `video_analyze` runs ffmpeg scene-change, silence, black, freeze, blur, loudness and brightness detection. Takes a YouTube URL through `yt-dlp`. | [code] `mcp-server/src/tools`, `extractors/analyzers.ts` |
| `slide/hyperframes` | Apache-2.0 | **Code-to-video engine.** HTML to deterministic MP4. CLI also does a beat grid, loudness matching (default -16 LUFS), ducking, transcription, and transcript-based cutting. References for captions, sound, story, storyboard, motion. About 450 ready blocks in its registry. | [code] `skills/media-use/`, `skills/hyperframes/references/` |
| `slide/VoiceStudio` | AGPL-3.0 | Voice, cloning, dubbing, local transcription. Keep it a separate local service, as now. Do not copy its code. | [code] |
| `slide/explainer-video-skills` | MIT | **Craft knowledge.** Real skills: story arc, script timing (about 2.3 words per second), pacing per beat, narration and caption sync. Five skills: explainer, wrapped, diagram, whiteboard, isometric. | [code] |
| `slide/animated-diagrams-skill` | Apache-2.0 | Animated technical diagrams synced to an SRT narration, rendered through HyperFrames. | [code] README |
| `slide/anatomy`, `slide/diagram-design` | not read | Concept figures and static diagrams for "help me understand this". | [code] README only |
| `slide/kitta-animation` | yours | Lip-synced cartoon character with transparent export. Becomes a Character extension. | [code] README |
| `open-design/skills/motion-design` | Apache-2.0 | 450-line motion craft skill: beat map, continuity, typography, pacing. | [code] |
| `open-design/craft/` | Apache-2.0 | Craft rules (animation discipline, typography, colour) to fold into Director skills. | [code] listing only |

### Reference only

| Repo | Why not adopt | What to take |
| --- | --- | --- |
| `Concat` | AGPL-3.0; copying code would force AGPL on your MIT fork. Its MCP edits its own projects, not Classic's. | The design of its agent tools: `timeline_read` as a compact view (lanes, clips in time order, ids), separate from `project_get`. [code] `docs/MCP.md` |
| `filmcraft` | A whole separate Rust editor. | Trim types, exact integer time, colour panel order, as a feature checklist. |
| `slide/remotion` | Custom company licence. A second render engine doubles the work. | Authoring patterns; the `remotion-to-hyperframes` skill converts if needed. |
| `slide/revideo`, `slide/video-as-code-resources` | One engine is enough. Your own notes there already say HyperFrames stays primary. | Examples. |

### Skip

- `blender`: a full 3D suite, GPL. Nothing in the plan needs it.
- `slide/slidev`, `slide/answer-me-with-html`, `slide/visual-explainer`: slides and HTML answers.
- `slide/YuE2-Studio`: song generation with an MCP server, but Windows and NVIDIA only per its README.

### Stubs to ignore

In `open-design/skills`, these are 42-line catalogue entries that only link to an upstream repo and contain no workflow: `youtube-clipper`, `video-downloader`, `speech`, `venice-audio-music`, `fal-video-edit`. `creative-director` (68 lines) is about ad campaigns. `brandkit` makes brand-board images, which is not your Brand Kit feature. If a stub's topic matters, evaluate the upstream repo it links to.

## 5. Target architecture

```
Creator ⇄ Director panel (chat, proposals, approve / undo)
              │
        Agent loop (Vercel AI SDK, four providers)
              │
   ┌──────────┼───────────────┬────────────────┐
 Skills     Editor tools     MCP servers     Memory
 (markdown) (wrap commands)  video-vision    channel / series /
 script,    read, cut,       OpenArt         Brand Kit /
 pacing,    caption, sfx,    VoiceStudio     edit recipes /
 captions,  keyframe         HyperFrames     performance notes
 recipe                      render
              │
        Platform profiles: YouTube long-form · Shorts · TikTok
```

Design rules:

- **One timeline, many outputs.** A project has a master edit. Platform profiles derive a 16:9 long-form export and 9:16 short clips from it, each with its own caption style, safe zone and length.
- **Propose, then apply.** Every Director edit is a batch the creator sees first. One undo reverts it.
- **Skills are files.** A skill is a markdown file the Director loads by name when a task matches. Adding one needs no code.
- **Generated code stays outside the app.** "Writes code" means HyperFrames compositions and analysis scripts in a project sandbox. It never edits Classic's source.
- **Everything is a connector.** Each outside service declares free or paid and whether it needs a key, as in the README.
- **Later: Classic's own MCP server**, exposing the same editor tools so Claude Code or any agent can drive the editor. This matches where upstream OpenCut is heading.

## 6. The two platform tracks

The engine underneath is shared. What differs is the craft, the profile, and which features matter first.

### 6.1 Side by side

| | Long-form YouTube | TikTok and Shorts |
| --- | --- | --- |
| Canvas | 16:9 | 9:16, 1080×1920 [web] |
| Length | Open | Shorts up to 3 minutes [web, consistent across guides]. TikTok's limit varies by account and by app or web upload; sources disagree [web] |
| What holds attention [craft] | A promise in the first 30 seconds, then chapters that each pay something off | The first 1 to 2 seconds, then a change on screen every few seconds |
| Edit's main job | Remove dead air, keep structure clear, add B-roll and graphics where explanation needs them | Cut tight, reframe to the speaker, keep text readable inside the safe zone |
| Captions | Clean subtitles plus an SRT file for YouTube's CC | Burned-in, word-by-word, large, centre of frame |
| Safe zone | Avoid the bottom strip where the player's controls and subtitles sit [craft] | No official margins for organic posts. Guides agree roughly on keeping text and faces in a central area of about 900×1400 px, with extra room on the right and bottom [web, third-party] |
| Sound | Music bed ducked under voice, section stings, even loudness | Punchier SFX, cuts on the beat, optionally a trending sound added in-app |
| Packaging | Title, thumbnail, description, chapters | First frame, on-screen hook text, caption, hashtags |
| Upload by API | YouTube Data API. Quota is per day; the cost of an upload is disputed in sources (1,600 vs about 100 units). Caption upload costs 400, thumbnail 50 [web] | TikTok Content Posting API. **An unaudited app can only post privately** and is capped at 5 users per day; public posting needs TikTok's audit. Upload-to-drafts mode exists [web, official docs Aug 2026] |

### 6.2 Long-form YouTube track (first)

What the Director does, in the order a video is made:

1. **Idea and angle.** Reads the channel and series memory. Proposes three angles with a working title each. Uses the YouTube Data API port of your YouTube Get extension to look at what similar channels published.
2. **Script.** Hook, promise, chapters, payoff, call to action. Times it at about 2.3 words per second so the target length is known before recording.
3. **Shot and material list.** For each script line: talking head, B-roll, screen recording, diagram, or generated shot. Flags what must be made.
4. **Rough cut from the recording.** Transcribes, then proposes removing silences, filler words and repeated takes as one batch. The creator approves by reading a transcript with strike-throughs, not by scrubbing.
5. **Structure pass.** Checks the cut against the script: is the promise in the first 30 seconds, is any chapter dragging. Suggests moves.
6. **Visual pass.** Places B-roll on matching transcript lines, renders chapter cards, lower thirds and diagrams through HyperFrames, adds slow zooms on long static shots.
7. **Sound pass.** Music bed per section, ducked under voice. Stings on chapter changes. Loudness matched across the video.
8. **Captions.** Clean subtitles on the timeline if wanted, and an SRT export for upload.
9. **Packaging.** Chapter list with timestamps, description, three title options, thumbnail concepts generated through the image connectors.
10. **Publish and learn.** Optional upload through the API. Later, read retention for the video and write what worked into series memory.

### 6.3 TikTok and Shorts track (second)

Two ways in, both worth building:

**A. Clips from a long video.** This reuses everything from the YouTube track and is the cheapest route to short-form.

1. Find candidate moments in the transcript: a complete thought, a strong claim, a story with a turn.
2. Score and rank them, show the creator the top few with reasons.
3. Cut each to length, tighten pauses harder than long-form.
4. Reframe 16:9 to 9:16, keeping the speaker in frame.
5. Add a hook line as on-screen text in the first second.
6. Apply the word-by-word caption style inside the safe zone.
7. Export per platform.

**B. Native short.** Written and shot for vertical.

1. Hook first: the script starts with the line that stops the scroll.
2. One idea, one payoff.
3. A beat map: something changes on screen every few seconds (cut, zoom, text, B-roll).
4. Captions, SFX on the beats, loop-friendly ending.

Honest limits for this track:

- **Trending sounds** cannot be fetched and placed by the editor through any official API found. The Director can research and name what is trending; the creator adds the sound inside TikTok.
- **Public posting to TikTok by API** needs an audit a personal app is unlikely to pursue. Realistic options: export the file and post by hand, or use upload-to-drafts.
- **Reframing** has no ready open-source tool that follows the active speaker. Google's AutoFlip is from 2020 and left speaker detection as future work; a small YOLO-based project exists [web]. Start with a manual crop the Director positions per shot, then research automation (section 11).

## 7. Capability plans

### 7.1 Brain loop

Chosen: Vercel AI SDK. Confirmed from ai-sdk.dev on Nov 10, 2026:

- All four providers have first-party provider pages, including Moonshot AI.
- `ToolLoopAgent` from `ai` runs the multi-step loop and stops after 20 steps by default (`stopWhen`, `isStepCount`).
- `createMCPClient` from `@ai-sdk/mcp` supports HTTP, SSE and stdio; `await client.tools()` is passed in as tools. Stdio is described as for local development, which fits a local personal editor.
- Editor tools can run in the browser: define the tool on the server without `execute`, handle it in `useChat`'s `onToolCall`, return with `addToolOutput`, continue with `sendAutomaticallyWhen`.
- Built-in approval (`toolApproval`, `addToolApprovalResponse`) applies to server-side tools. Approval for browser-run edit tools is our own "show the batch, then apply" step.
- The docs do not state a version number; pin whatever is current at install.

Also in this capability:

- **Skill loader.** A `skills/` folder of markdown files with a name and one-line description. The Director sees the list and loads a file when it applies.
- **Context budget.** Replace the 60-clip snapshot with `timeline_read` by time range, so a 20-minute project does not flood the model.
- **Cost display.** The Director already shows token prices per model. Add running cost per session, and a cheap-model default for routine tools.

### 7.2 Hands

Wrap existing commands as typed tools, shaped after Concat's.

| Group | Tools |
| --- | --- |
| Read | `timeline_read` (range, compact), `clip_get`, `asset_list`, `transcript_get` |
| Cut | `clip_split`, `clip_trim`, `clip_move`, `clip_delete`, `ripple_delete_ranges` |
| Add | `clip_insert`, `text_add`, `caption_generate`, `caption_style` |
| Shape | `keyframe_set` (zoom, position, opacity), `effect_add`, `audio_set_volume`, `audio_duck` |
| Find | `sfx_search`, `music_search`, `stock_search` |
| Make | `voice_generate`, `image_generate`, `graphic_render` (HyperFrames) |
| Mark | `marker_add`, `chapter_set` |

Rules: propose a batch, show what changes, recheck clip ids before applying, apply through `batch-command` so one undo reverts it.

### 7.3 Eyes and ears

- Run `claude-video-vision` as a local MCP server. Add one local route that hands a project asset to it as a file.
- Use `video_analyze` first (cuts, silences, loudness), then sample frames only where needed. On long videos, lean on the transcript and sample sparsely.
- Cache analysis per asset so a second question about the same clip costs nothing.

### 7.4 Captions

1. **Measured word timestamps.** Transformers.js supports `return_timestamps: 'word'`, but it needs a model exported with alignment data, and there are open bug reports with 30-second chunking and with WebGPU [web]. Test on a clip longer than 30 seconds. Fallbacks: HyperFrames `transcribe`, or VoiceStudio locally.
2. **SRT export**, for YouTube's CC upload.
3. **Transcript editor.** Fix a misheard word once and the caption and the cut list both update.
4. **Caption presets** stored in the Brand Kit: clean subtitle (long-form), word highlight, word pop, keyword colour (short-form).
5. **Safe-zone guide** overlay per platform profile.
6. **Meaning-aware styling.** The Director marks emphasis words and numbers from the script and styles only those. This is what "captions that go with the content" means in practice.

### 7.5 Sound and music

| Need | Plan | Evidence |
| --- | --- | --- |
| SFX placement | SFX Kit already has when-to-use notes. Director maps moments (cut, reveal, text pop, chapter change) to categories. | [code] |
| Beat grid, ducking, loudness | HyperFrames CLI does all three, Apache licence. Avoid essentia.js: it is AGPL. | [code] + [web] |
| Voice cleanup | Denoise and level before mixing. Not researched yet; see section 11. | |
| Music library | Freesound and Jamendo APIs are free for non-commercial use only. Openverse aggregates and can filter to commercially usable licences; each track keeps its own licence. | [web] |
| Generated music | No local option on your Mac today (YuE2 is Windows/NVIDIA). HyperFrames mentions local MusicGen. Hosted generators are a connector decision. | [code], not tested |
| Trending TikTok sounds | No official API found. Research and report only. | [web] |

Show licence and attribution on every sound result. Personal use is fine with Freesound, but a monetised video needs commercially usable music regardless of who uses the editor.

### 7.6 Learn from a reference video

A new skill built from parts you have:

1. `video_analyze` on the reference: cut times, silences, loudness.
2. Sample frames around cuts: caption look, zooms, B-roll, overlays.
3. Write an **edit recipe**: hook structure and length, average shot length by section, caption style, zoom frequency, B-roll frequency, SFX and music moments.
4. Save the recipe to the series or Brand Kit.
5. Apply it to the user's own footage as a reviewable batch.

Copy the style, never the footage. `yt-dlp` use sits outside the platforms' terms, so this stays a local, personal feature.

### 7.7 Code graphics (HyperFrames)

- The Director writes an HTML composition, renders locally, and imports the clip into Assets. Transparent renders become overlays.
- Start from the registry's ready blocks rather than writing from scratch.
- Brand Kit supplies fonts, palette and motion style so every graphic matches.
- First set to build: chapter card, lower third, animated diagram, kinetic quote, end card. Then transition clips.

### 7.8 Memory

- **Channel / series / project** as in the Director plan.
- **Brand Kit**: palette, fonts, caption presets, voice, music choices, character references.
- **Edit recipes** from 7.6.
- **Performance notes**: after a video is published, what the retention curve showed, written in plain words to the series. Research needed on what the Analytics API returns (section 11).

### 7.9 Research and publishing

- YouTube Data API through the YouTube Get port: search, video details, competitor structure.
- Reference analysis through 7.6.
- YouTube upload with captions and thumbnail is possible through the Data API [web]. Check the current quota table before relying on daily upload counts.
- YouTube's Test & Compare for titles and thumbnails exists in Studio; no public API for it was found [web]. The Director can prepare three variants for the creator to enter by hand.

## 8. Build phases

Each phase ends in something you can demo. Phases 1 to 9 deliver the YouTube track; 10 to 12 add the short-form track; 13 to 14 close the loop.

| # | Phase | Delivers | Done when |
| --- | --- | --- | --- |
| 1 | Agent loop | AI SDK loop on four providers, skill loader, `timeline_read` by range | It answers "what is at 4:10" on a 15-minute project by calling a tool |
| 2 | Hands | Tool set in 7.2 over existing commands, batch proposal and undo | "Add a title at the start and lower the music" applies as one batch; one undo reverts it |
| 3 | Transcript and rough cut | Measured word timestamps, transcript editor, silence and filler removal | A 15-minute recording gets a proposed rough cut the creator approves by reading |
| 4 | Eyes and ears | video-vision connected, asset hand-off, analysis cache | It describes what is on screen in a clip and lists the cut points |
| 5 | Captions | Clean subtitle preset, SRT export, emphasis styling | Subtitles stay in sync on the full video and the SRT uploads to YouTube |
| 6 | Sound design | Music bed, ducking, loudness, SFX by moment, licence labels | "Add sound design" produces a mix where the voice is always clear |
| 7 | Code graphics | HyperFrames render and import; chapter card, lower third, diagram | "Add chapter cards in my brand style" lands on the timeline |
| 8 | Writing and packaging skills | Script, shot list, chapters, titles, description, thumbnail concepts | A new episode goes from idea to script to packaging in one conversation |
| 9 | Reference recipes | The skill in 7.6, recipes saved in Brand Kit | A recipe from a reference video is applied to different footage |
| 10 | Platform profiles | 9:16 canvas, safe-zone guides, per-platform export | The same project exports 16:9 and 9:16 |
| 11 | Clips from long-form | Moment finding, ranking, cut, manual reframe, hook text | A 15-minute video yields three Shorts the creator would post |
| 12 | Short-form captions and beats | Word-by-word presets, beat-synced cuts, punchier SFX mapping | A native short is assembled from a script and footage |
| 13 | Publish | YouTube upload with captions and thumbnail; TikTok export or drafts | A finished video reaches YouTube from the editor |
| 14 | Learn | Retention read-back, performance notes in memory | The next episode's suggestions cite what worked last time |

Running alongside, not blocking: the remaining Canva ports, Brand Kit, connector settings, GIF and stock connectors, Character extension, Classic's own MCP server.

## 9. Idea bank

Not commitments. Each is marked with the track it serves: **YT**, **SF** (short-form), or both.

**Editing**
- Transcript-first editing: delete a sentence in the text and the cut happens. (both)
- Repeated-take detection: when a line was said three times, keep the last clean one. (YT)
- "Tighten by 10%": the Director proposes which pauses and sentences to lose to hit a target length. (both)
- Pattern interrupts: on any static shot longer than a set time, propose a zoom, B-roll or graphic. (both)
- Jump-cut smoothing with a slight zoom change between adjacent cuts. (both)
- Multi-version export: the same edit as a 12-minute video, a 60-second summary, and three clips. (both)

**Story**
- Retention review before publishing: the Director reads the cut and marks where a viewer might leave and why. (YT)
- Hook lab: ten hook lines for the same video, ranked with reasons. (both)
- Open loops: suggest a question early that is answered late. (YT)
- Cold-open builder: pull the best ten seconds from later in the video to the front. (YT)

**Visuals**
- B-roll matcher: for each transcript line, search your own library first, then stock, then offer to generate. (both)
- Explain-this: select a sentence and get an animated diagram of it. (YT)
- Auto lower thirds from names mentioned in the transcript. (YT)
- Screen-recording helper: zoom to the cursor and highlight clicks. (YT)
- Character host: your lip-synced cartoon character reads the intro or reacts in a corner. (both)

**Sound**
- Mood map: the Director labels each section's mood and picks music to match. (both)
- Auto-ducking that follows speech, not a fixed level. (both)
- Room-tone fill so cuts do not sound like cuts. (YT)
- SFX restraint check: flags when there are too many. (SF)

**Captions and language**
- Emphasis words coloured from the script's meaning. (both)
- Translated subtitle files for other languages. (YT)
- Dubbed audio tracks through VoiceStudio, since YouTube supports multi-language audio [web]. (YT)

**Packaging**
- Thumbnail concepts as image generations in the channel's style, plus a text-readability check at small size. (YT)
- Three title and thumbnail pairs prepared for YouTube's Test & Compare. (YT)
- Chapter list and description written from the final cut, not the script. (YT)
- First-frame picker for Shorts and TikTok. (SF)

**Workflow**
- Series templates: an episode starts with the intro, music, caption style and end card already in place. (both)
- Batch mode: apply the same recipe to several recordings overnight. (both)
- Review notes: the Director leaves markers with comments instead of editing, when asked to review only. (both)
- A "why" button on every proposed edit. (both)

## 10. Recommendations

1. **Build the loop and the hands before anything visible.** Every other feature is a tool or a skill on top of them.
2. **Make transcript-based rough cutting the first headline feature.** For long-form it saves the most time, and it needs only phases 1 to 3.
3. **Fix word timestamps before designing caption styles.** Styles on estimated timing will look wrong.
4. **Treat HyperFrames as the effects department.** Do not spend editor time on transitions yet.
5. **Reach short-form through clips from long-form first.** It reuses everything and shows results early; native shorts come after.
6. **Keep the creator in the edit.** Proposals, reasons and one-step undo are what make an assistant usable on real work.
7. **Write skills as you edit real videos.** After each video, turn what you had to explain to the Director into a skill file.
8. **Do not chase trending-sound automation.** No official route exists; a research report is the useful version.
9. **Pick one real series as the test bed**, as the Director plan says (the clay-style episode), and run every phase's demo on it.
10. **Keep AGPL tools as separate local services** and never copy their code into the fork, so sharing the editor later stays possible.

## 11. Future fields of research

Each is a question to answer with a short test before committing.

| Field | Question | Starting point |
| --- | --- | --- |
| Speaker-aware reframing | Can 16:9 be cropped to 9:16 following whoever is speaking, locally? | Face or person detection plus diarization, then smoothing the crop path. No ready tool found; AutoFlip (2020) and a YOLO-based project exist [web] |
| Speaker diarization | Who speaks when, for interviews and podcasts | pyannote: library is MIT; pretrained model licences vary by checkpoint [web] |
| Stem separation | Pull voice from music in a clip, or remove music from a reference | Demucs: code is MIT; whether its weights allow commercial use is questioned [web] |
| Voice cleanup | Denoise, de-reverb, level | Not researched. Concat's README lists this as built in, which shows it is doable locally |
| Highlight detection | Which moments make good clips | Transcript scoring by the model first; audio energy and laughter as later signals |
| B-roll retrieval | Find footage by meaning in your own library | Image and text embeddings over sampled frames; not researched |
| Retention analytics | What does the YouTube Analytics API return per video? | A third-party reference describes 100 data points per video by elapsed ratio; needs checking on Google's docs [web] |
| Generative video | Which models suit B-roll and character shots, at what cost | OpenArt MCP is connected; fal.ai sponsors OpenCut. Compare on one real shot list |
| Lip-sync and dubbing | Dub into other languages with matched lips | VoiceStudio does timed dubbing; YouTube's own lip-sync is a limited pilot [web] |
| Music generation | Original beds without licence questions | Local MusicGen via HyperFrames notes; hosted generators as connectors |
| Trend intelligence | What is working in a niche, per platform | YouTube Data API. For TikTok, only third-party services were found [web] |
| Thumbnails | What makes them work, and can a model judge readability | Not researched |
| Agent memory | How to store and recall series knowledge without bloating context | Start with plain notes; research retrieval only when notes get long |
| Evaluation | How to tell whether a Director change made edits better | A fixed set of test projects with expected edits; rerun after each change |
| Upstream OpenCut | When its plugin API and MCP server arrive, what moves over | Keep provider calls and tools in their own files, as the README already decides |
| Local models | Can planning or captioning run on-device to cut cost | Not researched |

## 12. Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Classic is a frozen fork of an archived editor | You maintain every bug yourself | Keep tools and connectors separate from editor code so they can move to the rewrite |
| Browser media storage vs local analysis | Large files copied between browser and disk | One hand-off route with caching; measure on a 15-minute 1080p file early |
| Model cost on long videos | Frames are expensive | Analyse first, sample sparsely, cache, default to a cheaper model for routine tools |
| Word timestamps unreliable in the browser | Captions and transcript cuts drift | Test early; fall back to local HyperFrames or VoiceStudio transcription |
| Platform APIs change or are gated | Publish features break | Treat upload as optional; file export always works |
| Music licensing | A monetised video gets a claim | Licence labels on every track; prefer commercially usable sources for anything published |
| `yt-dlp` and platform terms | Not suitable for a shared product | Personal use only; revisit before sharing |
| Too many features at once | Nothing finishes | One phase, one demo, on one real series |

## 13. Not yet verified

- Whether the AI SDK's current release installs cleanly beside Classic's Next 16, React 19 and zod. Its API was confirmed from official docs; nothing was installed.
- Whether word timestamps work with the exact Whisper models Classic loads.
- TikTok's own developer portal for any music or trends API; TikTok's current length limits.
- YouTube upload quota cost: sources give 1,600 and about 100 units.
- Safe-zone pixel values: all from third-party tools that disagree with each other.
- Giphy and Klipy terms and pricing.
- Licences of `anatomy` and `diagram-design`.
- All **[craft]** statements about what holds attention are practice, not measured.
- Nothing was installed or run. Every "use" verdict is from reading, not from a working test.

## 14. Sources

- AI SDK: [MCP tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools), [loop control](https://ai-sdk.dev/docs/agents/loop-control), [chatbot tool usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage), [providers](https://ai-sdk.dev/providers/ai-sdk-providers)
- TikTok posting: [Direct Post reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post), [content sharing guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines), [get started](https://developers.tiktok.com/docs/en/content-posting-api-get-started)
- TikTok music: [bundle.social](https://bundle.social/tiktok-music-api), [upload-post docs](https://docs.upload-post.com/api/get-tiktok-music), [Soundstripe](https://www.soundstripe.com/blogs/tiktok-music-licensing-rules), [Foxi Music](https://www.foximusic.com/blog/commercial-music-licensing-tiktok-guide/)
- Lengths and specs: [Riverside](https://riverside.com/blog/how-long-can-youtube-shorts-be), [Toptal](https://www.toptal.com/creator/post/youtube-shorts-length), [reap.video lengths](https://reap.video/blog/best-video-length-youtube-shorts-reels-tiktok)
- Safe zones: [reap.video](https://reap.video/blog/short-form-video-safe-zones), [bundle.social checker](https://bundle.social/tools/safe-zone-checker), [upload-post checker](https://www.upload-post.com/tools/safe-zone-checker/)
- YouTube API: [quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost), [Analytics sample requests](https://developers.google.com/youtube/analytics/sample-requests)
- YouTube features: [Tubefilter on Test & Compare](https://www.tubefilter.com/2025/07/16/youtube-feature-test-and-compare-titles-thumbnails/), [TechCrunch on new creator tools](https://techcrunch.com/2026/09/23/youtube-adds-new-creator-tools-like-video-a-b-testing-dynamic-thumbnails-and-live-dubbing/), [Search Engine Journal](https://www.searchenginejournal.com/youtube-adds-title-a-b-testing-and-ask-studio-analytics/556232/)
- Music APIs: [Freesound API terms](https://freesound.org/docs/api/terms_of_use.html), [Jamendo API terms](https://devportal.jamendo.com/api_terms_of_use)
- Word timestamps: [transformers.js #1358](https://github.com/huggingface/transformers.js/issues/1358), [#820](https://github.com/huggingface/transformers.js/issues/820), [#551](https://github.com/huggingface/transformers.js/issues/551)
- Tenor shutdown: [Slashdot](https://tech.slashdot.org/story/26/06/30/2131216/google-pulls-the-plug-on-tenor-api-killing-gif-pickers-around-the-web), [PC Gamer](https://pcgamer.com/hardware/google-kills-yet-another-api-shutting-out-all-non-google-platforms-from-favoured-gif-database/)
- Reframing: [Google AutoFlip](https://research.google/blog/autoflip-an-open-source-framework-for-intelligent-video-reframing/), [autocrop-vertical](https://sourceforge.net/projects/autocrop-vertical.mirror/)
- Audio models: [Demucs weights licence discussion](https://huggingface.co/adefossez/HTDemucs/discussions/1), [pyannote commercial use discussion](https://www.github.com/pyannote/pyannote-audio/discussions/1175)
- Beat detection: [Essentia licence](https://essentia.upf.edu/documentation.html), [bpm-detective](https://npmjs.com/package/bpm-detective)
