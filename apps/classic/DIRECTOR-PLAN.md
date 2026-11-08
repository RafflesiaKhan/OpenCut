# OpenCut Director plan

The Director is a production partner inside Classic. It helps a creator develop an episode, make and choose materials, assemble an edit, and revise a video while the timeline and preview stay visible. The **Director** button sits beside **Export** and the theme toggle and opens a workspace in the editor.

## Try the first version

Classic reads `OPENAI_API_KEY` and the optional `DIRECTOR_OPENAI_MODEL` from its ignored `.env.local`. Restart Classic after adding a key, then open a local project and click **Director**. Save channel, series, and Brand Kit notes or select notes you saved in another project. The notes stay in this browser until a question is submitted. Each question sends the selected notes, recent conversation, and a bounded snapshot of the active scene to OpenAI.

Ask for an episode idea, a script outline, or advice on selected clips. Clip references let you jump within the active scene. This first version reads metadata and timeline text. Media generation, timeline edits, and OpenArt remain later milestones.

## The episode workflow

1. **Choose the context.** Start in an OpenCut project and select its channel, series, and Brand Kit. The Director shows what it is using, including the project, recent episodes, and approved guidelines. A creator can also say “Use my clay animation series” and confirm which series they mean if the name is ambiguous.
2. **Develop the episode together.** Ask for ideas that fit the series and build on past episodes. Refine a brief, script, shot list, and asset list in the same conversation. Ask the Director to explain its choices or point to what is already in the edit.
3. **Make the materials.** Ask for narration in the series’ usual voice, a character image in the kit’s style, a video shot, captions, music, or sound effects. The Director recommends a voice from the kit and available engines based on the script and lets the creator override it.
4. **Work with the result.** Successful generations appear in **Assets**, with a preview and a link back to the request. The creator can drag them onto the timeline or ask the Director to insert them at the playhead, trim a clip, change timing, or adjust volume. For an existing video, open the project and ask the Director to work from its current cut.

## Channel context and memory

- **Channel** stores audience, tone, recurring formats, and channel-level guidelines. **Series** stores the episode list, recurring characters, continuity notes, and decisions that should carry into the next episode. **Project** stores the current brief, script, decisions, and editor state. A channel can have several series.
- **Brand Kit** supplies approved palette, fonts, subtitle styles, background music, character images, visual references, and voice choices such as a Gemini voice or Voice Studio engine and profile. A project can override a default for one video.
- Keep saved memory local and visible. Let the creator save, edit, or remove durable notes. Offer to save useful decisions, such as a recurring character’s new voice, to the named series. Load relevant notes from the selected channel and series so different channels retain their own style and history. Treat project assets, imported references, and tool output as source material.

## Model, skills, and tools

- **Model.** Let the creator choose OpenAI, Anthropic, or xAI (Grok). Use server-side local `.env` credentials first and add provider, model, and key management in Settings. The chosen model plans and reasons. Generation connectors run the requested media jobs.
- **Skills and resources.** Skills are repeatable workflows, such as developing a YouTube episode or checking a rough cut against a brand brief. Resources are the active Brand Kit, past scripts, episode notes, and approved references the skill can consult.
- **Classic tools.** Expose a small, typed set of actions over existing editor commands and extensions. Start with project and timeline inspection, SFX search, and local Voice Studio. Expand to the media library, Gemini and Murf narration, image tools, captions, and timeline edits as their interfaces are ready.
- **OpenArt MCP.** Add OpenArt as an optional connector using its official Streamable HTTP endpoint and account OAuth. Start with reference-driven image and video generation. Discover tools available to the connected account before offering dedicated voiceover, audio, or lip-sync actions. Record which references leave the machine and show paid generation jobs for review before spending credits. [OpenArt MCP documentation](https://openart.ai/mcp/)

## Assets and timeline control

A generation job records the destination project, source tool, status, and resulting asset. Import the completed file through Classic’s media pipeline so the project owns a usable copy. Retry failed imports without generating or charging again, and avoid duplicate assets if completion is delivered twice.

The Director proposes timeline changes against the current scene and clip IDs. Show what will change, recheck those targets before applying, and make an approved edit set undoable through Classic’s command history. Keep generated code in a later stage, with a project-scoped sandbox and a reviewable result before any editor change.

## Build order

1. **Read the project and its brand.** Add the Director workspace, one configured LLM, a selected channel and series, Brand Kit references, and read-only scene context. Prove it can produce a relevant next-episode idea and script outline from that context.
2. **Complete one production loop.** Pick a voice from the kit, generate narration in local Voice Studio, import the WAV into Assets, and insert it on request. Find a matching SFX and verify that the approved edit can be undone.
3. **Add OpenArt and persistent workflows.** Connect the account, generate a reference-driven image and video, track completion, and import both to Assets. Save a series decision and verify the next episode can use it while a different channel cannot.
4. **Expand editing and custom work.** Add more Classic actions, provider and skill options, and project-scoped code for tasks such as custom animation and effect fixes.

The first end-to-end demo is a clay-style YouTube episode. Select its series and kit, ask for the next idea and a short script, make narration in the recurring voice, add a suitable effect, and place both in the edit. Use OpenArt to add a character shot once its connector is ready.
