import { BatchCommand, type Command } from "@/commands";
import { AddMediaAssetCommand } from "@/commands/media";
import { InsertElementCommand } from "@/commands/timeline";
import { useEditor } from "@/editor/use-editor";
import { processMediaAssets } from "@/media/processing";
import { DEFAULT_NEW_ELEMENT_DURATION } from "@/timeline/creation";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { mediaTime, mediaTimeFromSeconds } from "@/wasm";

export function useAddExtensionMedia() {
	const editor = useEditor();

	return async (input: File[] | (() => Promise<File[]>)) => {
		const projectId = editor.project.getActive()?.metadata.id;
		if (!projectId) throw new Error("Open a project before adding media.");
		const sceneId = editor.scenes.getActiveScene().id;
		let startTime = editor.playback.getCurrentTime();

		const files = typeof input === "function" ? await input() : input;
		const assets = await processMediaAssets({ files });
		const error =
			!assets.length || assets.length !== files.length
				? "OpenCut could not read all the selected media."
				: editor.project.getActive()?.metadata.id !== projectId ||
						editor.scenes.getActiveScene().id !== sceneId
					? "The active scene changed. Add the media again in the destination scene."
					: null;
		if (error) {
			for (const asset of assets) {
				if (asset.url) URL.revokeObjectURL(asset.url);
			}
			throw new Error(error);
		}

		const commands: Command[] = [];
		for (const asset of assets) {
			const addAsset = new AddMediaAssetCommand(projectId, asset);
			const duration =
				asset.duration == null
					? DEFAULT_NEW_ELEMENT_DURATION
					: mediaTimeFromSeconds({ seconds: asset.duration });
			const element = buildElementFromMedia({
				mediaId: addAsset.getAssetId(),
				mediaType: asset.type,
				name: asset.name,
				duration,
				startTime,
			});
			commands.push(
				addAsset,
				new InsertElementCommand({
					element,
					placement: {
						mode: "auto",
						preserveStartTime: true,
						trackType: asset.type === "audio" ? "audio" : "video",
					},
				}),
			);
			startTime = mediaTime({ ticks: startTime + duration });
		}
		editor.command.execute({ command: new BatchCommand(commands) });
	};
}
