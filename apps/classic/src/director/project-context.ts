import type { EditorCore } from "@/core";
import type { TScene } from "@/timeline/types";
import { mediaTimeToSeconds } from "@/wasm";
import type { DirectorProject } from "./contract";

export function sceneTracks(scene: TScene) {
	return [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio];
}

export function readDirectorProject(
	editor: EditorCore,
): DirectorProject | null {
	const project = editor.project.getActiveOrNull();
	const scene = editor.scenes.getActiveSceneOrNull();
	if (!project || !scene) return null;

	const selected = new Set(
		editor.selection.getSelectedElements().map(({ elementId }) => elementId),
	);
	const playhead = mediaTimeToSeconds({
		time: editor.playback.getCurrentTime(),
	});
	const clips = sceneTracks(scene)
		.flatMap((track) =>
			track.elements.map((clip) => {
				const start = mediaTimeToSeconds({ time: clip.startTime });
				return {
					id: clip.id,
					name: clip.name.slice(0, 200),
					type: clip.type,
					track: track.name.slice(0, 200),
					start,
					end: start + mediaTimeToSeconds({ time: clip.duration }),
					selected: selected.has(clip.id),
					...(clip.type === "text" ? { text: clip.content.slice(0, 300) } : {}),
				};
			}),
		)
		.sort((a, b) => a.start - b.start);

	// shortcut: bounded timeline snapshot, add on-demand time-range reads for longer edits.
	const nearby = [...clips].sort(
		(a, b) =>
			Math.max(a.start - playhead, playhead - a.end, 0) -
			Math.max(b.start - playhead, playhead - b.end, 0),
	);
	const prioritized = new Set([
		...clips.filter((clip) => clip.selected),
		...clips.slice(0, 20),
		...nearby,
	]);
	const assets = editor.media.getAssets();
	return {
		name: project.metadata.name.slice(0, 200),
		scene: scene.name.slice(0, 200),
		playhead,
		duration: clips.reduce((end, clip) => Math.max(end, clip.end), 0),
		clipCount: clips.length,
		clips: [...prioritized].slice(0, 60).sort((a, b) => a.start - b.start),
		assetCount: assets.length,
		assets: assets
			.slice(0, 30)
			.map(({ name, type }) => ({ name: name.slice(0, 200), type })),
	};
}
