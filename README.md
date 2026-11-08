<table width="100%">
  <tr>
    <td align="left" width="120">
      <img src="https://assets.opencut.app/branding/symbol.svg" alt="OpenCut Logo" width="100" />
    </td>
    <td align="right">
      <h1>OpenCut</h1>
      <h3 style="margin-top: -10px;">A free and open source video editor for web, desktop, and mobile.</h3>
    </td>
  </tr>
</table>

[![Discord](https://img.shields.io/discord/1386309140057690133?label=Discord&logo=discord&logoColor=fff&color=5865F2&style=flat)](https://discord.gg/zmR9N35cjK)
[![X](https://img.shields.io/badge/follow-%40opencutapp-000?logo=x&logoColor=fff&style=flat)](https://x.com/opencutapp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat)](LICENSE)

## Status

**OpenCut is being rewritten from the ground up.** What's coming:

- An Editor API
- First-class third party plugins (made possible by a plugin-first architecture)
- Desktop, mobile, and browser from one codebase (Rust core)
- MCP server (for AI agents)
- Headless mode (automation, batch rendering)
- A scripting tab directly in the editor

You can still find the previous version at [opencut-app/opencut-classic](https://github.com/opencut-app/opencut-classic), which is the one to reach for today. [opencut.app](https://opencut.app) still runs the classic version. The rewrite will live at [new.opencut.app](https://new.opencut.app) until it's ready to take over.

## Development

Install [proto](https://moonrepo.dev/proto) if you haven't already:

**Linux, macOS, WSL:**

```sh
bash <(curl -fsSL https://moonrepo.dev/install/proto.sh)
```

**Windows (PowerShell):**

```powershell
irm https://moonrepo.dev/install/proto.ps1 | iex
```

If shims fail to run, allow local scripts for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

From the repo root:

```sh
proto use    # installs the tools pinned in .prototools
```

```sh
moon run web:dev       # localhost:5173
moon run api:dev       # localhost:8787
moon run desktop:dev   # see apps/desktop/README.md
```

## Contributing

We're not set up to take outside contributions yet while the architecture is being designed. If you want to follow along, ask questions, or just hang out, [join the Discord](https://discord.gg/zmR9N35cjK) or [open an issue](https://github.com/opencut-app/opencut/issues).

## Sponsors

OpenCut is supported by companies that believe in open source creator tools.

- [**fal.ai**](https://fal.ai?utm_source=github-opencut&utm_campaign=oss): Generative image, video, and audio models all in one place.

Want your logo here? Reach out at [sponsor@opencut.app](mailto:sponsor@opencut.app).

## License

[MIT](LICENSE)

## AI-Ready Video Editor Plan (my-suitable-editor)

My plan for this fork. Synced from the live plan doc on Nov 8, 2026: [AI-Ready Video Editor Plan](https://claude.ai/artifact/PA8rCebq1HKkmqKgs8JKRL) (it also has the diagram and status dropdowns).

Turn the OpenCut fork into my own AI-ready video editor: every Canva extension I built, plus music, sound-effect and preset libraries, plugged in as extensions with free and paid connectors.

### Vision

One editor where making a video means picking from ready-made voices, images, music, sound effects and presets, not hunting across tools. Three pillars:

- **AI-ready:** generate voiceovers and images inside the editor, starting with the Canva apps already built (Gemini TTS, Murf, Gemini/OpenAI images).
- **Asset libraries:** background music (Pixabay-style free music), sound effects (VFX sounds), and presets, searchable and one click to the timeline.
- **Connectors:** each source is a connector, free or paid, so the user chooses which services to use and brings their own key where one is needed.

Every feature ships as an extension: its own tab in the editor's left panel, its own folder in the code, and a shared path that drops results onto the timeline.

### How an extension plugs in

Connector (paid key, free key, or no key) → extension tab (generate or search → preview) → media library → timeline at the playhead. Connector settings hold the keys.

Each extension is a panel tab in its own folder: it calls a connector, shows a preview, then saves the result to the media library and places it on the timeline. AI Voice already works this way on the old editor.

### Starting point

`my-suitable-editor` becomes the main branch of this work, branched from `main` on Nov 8, 2026. The catch: on `main` the web editor is a "Coming soon" placeholder, because OpenCut restarted it in May 2026 and moved the real work to a new desktop app and Rust core.

| Branch | What it holds | Pushed |
| --- | --- | --- |
| `my-suitable-editor` | `main` + a .gitignore fix; new Vite web app (editor not built yet), GPUI desktop app, Rust core | No |
| `main` | Same as OpenCut's own `main` (Sep 24, 2026) | Yes |
| `video-studio` | Last full working web editor, the final OpenCut classic (May 2, 2026) + overlay fix | Yes |
| `ai-voice` | `video-studio` + the AI Voice tab (Gemini TTS) | No |

So the AI Voice tab, and anything built the same way, needs an editor to plug into on `my-suitable-editor`. Which editor that is, is the first decision (see Open questions).

#### Why `main` has no editor

OpenCut is being rewritten from the ground up ([README](https://github.com/OpenCut-app/OpenCut)). Checked Nov 8, 2026:

- **Reset:** a "clean state" commit on May 6, 2026 removed the old editor from `main`.
- **Old editor:** moved to [opencut-classic](https://github.com/opencut-app/opencut-classic), archived (read-only) on May 16, 2026. Its last code change, May 2, is the point `video-studio` branched from, so building on it means maintaining it ourselves.
- **Rewrite goals:** an Editor API, first-class third-party plugins (plugin-first architecture), one Rust core for desktop, mobile and browser, a built-in MCP server, headless mode, a scripting tab. Plugins and MCP match this plan's extensions and connectors.
- **Rewrite progress:** the web app is a "hello world" page with an editor stub, the desktop app is an early scaffold, last commit Sep 24, 2026, no release date.

### Extension catalog

Five extensions port from the Canva apps; five are new asset libraries and presets. AI Voice is built and waits to land on the base branch.

| Extension | Comes from | Provider / connector | Key needed | Status |
| --- | --- | --- | --- | --- |
| AI Voice | GeminiTTS (Canva) | Google Gemini 3.8 TTS | Yes | Merged |
| Murf Voiceover | MurfAIwithAPI (Canva) | Murf AI (Gen2, Falcon 2.1) | Yes | Planned |
| AI Image | ImageGenerateAI (Canva) | Gemini (Nano Banana), OpenAI (GPT Image) | Yes | Planned |
| Image Batcher | GeminiImageBatcher (Canva) | Gemini (Nano Banana) | Yes | Planned |
| YouTube Get | YoutubeGET (Canva) | YouTube oEmbed; YouTube Data API optional | Optional | Planned |
| Background Music | New | Freesound or another music API; creator libraries | Depends on source | Idea |
| Sound Effects (VFX sounds) | New | Freesound (OpenCut's old Sounds tab used it); creator libraries | Depends on source | Idea |
| GIFs and memes | New | A free GIF or meme source with an API (to choose) | Depends on source | Idea |
| Stock images and videos | New | Pixabay API | Yes (free) | Idea |
| Presets | New | Transitions, text styles, sound effects, icons, logos | No | Idea |

AI Voice is merged into `my-suitable-editor` and lives in `apps/classic/src/ai-voice` ([PR #2](https://github.com/RafflesiaKhan/OpenCut/pull/2)). The classic editor it plugs into came in with [PR #1](https://github.com/RafflesiaKhan/OpenCut/pull/1).

### Connectors

A connector is one source an extension can pull from; the user turns on only the ones they want. Each connector declares whether it is free or needs a paid key, so the editor can show both side by side.

- **Free, no key:** public sources such as YouTube oEmbed, and built-in preset libraries.
- **Free with a key:** services with a free account or free tier (Freesound needs an API key, for example).
- **Paid, bring your own key:** Gemini, OpenAI, Murf. The user pastes their key once; the extension calls the provider directly.

Key handling: during development, every key lives in a local `.env` file. When the editor is shared, each user keeps keys in the browser session or a local settings file, their choice; keys only ever go to the provider.

### Roadmap

Phases run in order; each new extension reuses the pattern Phase 2 sets. No dates yet.

1. **Base branch.** Make `my-suitable-editor` the working branch with a usable editor (decision in Open questions); push it to the fork.
2. **Extension pattern.** Settle the folder layout, tab registration, connector settings and the add-to-timeline path. Land AI Voice by PR as the first extension.
3. **Port the Canva apps.** Murf Voiceover, AI Image, Image Batcher, YouTube Get, each as its own PR.
4. **Asset libraries.** Background Music, Sound Effects, then Presets and templates.
5. **Connector settings.** One place to see every connector, free or paid, and manage keys.
6. **Director.** Add a **Director** button in the editor toolbar beside **Export** and the theme toggle. It opens a Director bar where an in-editor assistant can work with the current project throughout video creation and editing. See the [Director plan](apps/classic/DIRECTOR-PLAN.md) for the multi-channel workflow, memory, and OpenArt integration.
   - **Guide the edit.** Help develop a brief, script, storyboard, or shot list. Understand the current project, explain what is on the timeline, and suggest changes to pacing, structure, or sound.
   - **Work with project materials.** Use the editor's tools and extensions to find, create, inspect, and edit assets such as footage, images, narration, captions, and sound effects. Apply edits to the timeline and, over time, write and run project-scoped code for custom tasks and fixes.
   - **Choose the model.** Support selectable providers and models, including OpenAI, Anthropic, and xAI (Grok). Read provider keys from a local `.env` file during development and let users configure their provider, model, and key in Settings once that page exists.
   - **Build in stages.** Start with project-aware guidance, then add editor actions and extension access. Define how users review and undo edits and how generated code is scoped before expanding the Director's ability to act on its own.

7. **Brand Kit.** Add an extension for reusable design systems. Create a kit for a brand, channel, or series and select it when starting or editing a project.
   - **What a kit can hold.** Save color palettes, fonts, subtitle styles, background music, character images, and visual style references. Save narration choices by provider, model or engine, and voice name or profile, including Gemini and local Voice Studio.
   - **How it helps.** Make the selected kit available to the editor and its extensions so AI image and video generation can use the same characters and visual references, voiceovers can use the series' usual voices, and subtitles can follow its typography and colors. A clay-style YouTube series could keep all of these choices together in one kit.
   - **Design to explore.** Decide where creators manage kits, how they select one for a project, and how they override its defaults for an individual video.

### Decisions so far

- **Branches:** the fork's `main` always mirrors OpenCut's `main`. `my-suitable-editor` is the working main for this editor. `video-studio` stays as an old reference branch.
- **Scope:** one place for video creation and editing. Beyond AI tools: music, sound effects, GIFs and memes, stock media, presets.
- **Asset sources:** prefer services with an API. Otherwise connect curated creator libraries (shared databases or Drive folders), or build our own collection.
- **Pixabay:** its API covers images and videos only, with no music ([API docs](https://pixabay.com/api/docs/), checked Nov 8, 2026). It becomes a stock images and videos connector; music and sound effects need another source, such as Freesound.
- **API keys:** during development, all keys live in a local `.env` file. When others use the editor: browser session or a local settings file, their choice.
- **Presets:** transitions, text styles, sound effects, icons, logos, and more.
- **Editor (question 1):** option (a). The classic editor from `video-studio` is copied to `apps/classic` on the `classic-editor` branch (Nov 8, 2026), with the same package versions it ran with. The rewrite's `apps/web` is left untouched.

### Open questions

- [x] Which editor do extensions plug into on `my-suitable-editor`: bring the working `video-studio` editor across, build on the new web app, or target the GPUI desktop app? -- i dont understand this question

  In plain words: `my-suitable-editor` has no working editor yet, only a "Coming soon" page, so there is nowhere to add AI Voice or any extension. Pick one: (a) copy the classic editor from `video-studio` into this branch and build on it now, maintaining it ourselves; (b) wait for OpenCut's rewrite and its plugin system, with no release date; (c) build in the new desktop app, written in Rust. Recommended: (a), keeping each extension's provider calls and connectors in their own files, apart from the editor, so they can move to the rewrite's plugins later. AI Voice is already split this way.
- [x] Keep pulling updates from OpenCut's `main`, or treat this fork as fully my own? --- so the main branch from the fork will always be same as the main of open cards. But we have created this my suitable editor branch, this will be my main for working and building this editor, I think the video studio doesn't really contain lots of changes, so we can leave it as a old branch if we need something from it later on, then it's fine,
- [ ] Which music source: does Pixabay offer API access to its music, or do we use another free library? --- I remember they do offer free API access. If not, we will look for something else, but our plan is they this will be a one-place editor where we will have everything that are mostly required for videos: creation plus editing. For example, we will also add a GIF or meme site where we can find free available GIFs or memes to be included in the video. So yeah, we will look for the systems who has API access. If not, then we will look for some database, for example the sound effects, like I know there are couple of creators who shares their own reusable resources like a database or Google Drive link with lots of very much usable and commonly used music or sound effects, so we will connect that or maybe we create our own, so it depends on what we find
- [x] Where do API keys live long term: browser session, local settings file, or a small server? --- I think for this we need to have a local Jason database, like maybe a browser session is okay, or if there is user then user can have it on on their local, that's also fine, so yeah, while development we will try to have a local.ENV file with all the values there, so for me my personal use I can just use it and when we are making it available for others, then we will look for browser session or something that they can also do their local as well
- [x] What counts as a preset: text styles, transitions, whole video templates? --- yeah, presets can be transition text style, sound effect, icon logo, and other things, yeah
