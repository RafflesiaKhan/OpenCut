# OpenCut Classic (my-suitable-editor)

The full OpenCut web editor (timeline, panels, media library, sounds, text, effects),
copied from the `video-studio` branch: the final OpenCut classic release (May 2, 2026)
plus the react-scan overlay removal. Upstream archived classic in
[opencut-app/opencut-classic](https://github.com/opencut-app/opencut-classic) while it
rewrites OpenCut in `apps/web` and `apps/desktop`; this copy is maintained here and is
the base for this editor's extensions.

It is a standalone Next.js app with its own `package.json` and `bun.lock`; `bun.lock`
pins the exact package versions `video-studio` ran with.

## Run it

```sh
cd apps/classic
bun install
cp .env.example .env.local   # then fill in the values you use
bun dev                      # http://localhost:3000
```

Optional local services (database for accounts and feedback, Redis for rate limits):

```sh
docker compose up -d
```

The editor itself works without them.

## Canva extension ports

Open a project and use the tabs in the left panel. Enter provider keys in each
tab's Settings. The keys stay in browser session storage, and the two image tabs
share a Gemini key.

| Tab | What to try |
| --- | --- |
| Murf Voiceover | Generate with Gen2 or Falcon, preview, then add the MP3 to the timeline or download it. |
| AI Image | Generate with Gemini or OpenAI, preview, then add or download the image. |
| Image Batcher | Enter one prompt per line, optionally add a style guide and references, then add a single result or the full sequence at the playhead. ZIP export is also available. |
| YouTube Get | Fetch metadata with a link or ID, add the thumbnail, or copy a `yt-dlp` command. The optional YouTube Data API key unlocks more metadata. Audio, video, and caption downloads run locally using those commands. |

The panels are ported from the sibling `canva-ai-integration-tools` repository.
The public YouTube oEmbed, thumbnail, and public Google Docs export requests use
Classic's local API route so they can load in the editor without browser CORS
issues. Paid generation requests go directly from the browser to their provider.

## Adding an extension

Each extension is a tab in the editor's left panel, in its own folder:

1. Put the feature in `src/<extension>/` (provider calls in their own file, the panel in
   `components/assets-view.tsx`).
2. Register the tab in `src/components/editor/panels/assets/assets-panel-store.tsx`
   (`TAB_KEYS` and `tabs`) and `src/components/editor/panels/assets/index.tsx` (`viewMap`).
3. Put results into the project the way pasted files go in: `processMediaAssets`, then
   `AddMediaAssetCommand` + `InsertElementCommand` (see `src/media/use-paste-media.ts`).
