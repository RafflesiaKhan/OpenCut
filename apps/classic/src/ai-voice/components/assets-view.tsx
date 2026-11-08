"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/editor/use-editor";
import { processMediaAssets } from "@/media/processing";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { AddMediaAssetCommand } from "@/commands/media";
import { InsertElementCommand } from "@/commands/timeline";
import { BatchCommand } from "@/commands";
import { DEFAULT_NEW_ELEMENT_DURATION } from "@/timeline/creation";
import { mediaTimeFromSeconds } from "@/wasm";
import {
	GEMINI_TTS_MODELS,
	GEMINI_VOICES,
	MAX_TEXT_LENGTH,
	STYLE_PRESETS,
	generateSpeech,
} from "@/ai-voice/gemini-tts";

// Same convention as the Canva apps: the key lives only for this browser session
const STORAGE_KEY = "opencut_gemini_api_key";

export function VoiceView() {
	const editor = useEditor();

	const [apiKey, setApiKey] = useState("");
	const [keyInput, setKeyInput] = useState("");
	const [model, setModel] = useState<string>(GEMINI_TTS_MODELS[0].id);
	const [voice, setVoice] = useState<string>("Kore");
	const [style, setStyle] = useState("");
	const [text, setText] = useState("");
	const [generating, setGenerating] = useState(false);
	const [adding, setAdding] = useState(false);
	const [audio, setAudio] = useState<{ blob: Blob; url: string } | null>(null);

	useEffect(() => {
		const saved = sessionStorage.getItem(STORAGE_KEY) ?? "";
		setApiKey(saved);
		setKeyInput(saved);
	}, []);

	// Release the preview URL when it is replaced or the panel unmounts
	useEffect(() => {
		return () => {
			if (audio) URL.revokeObjectURL(audio.url);
		};
	}, [audio]);

	const saveKey = () => {
		const key = keyInput.trim();
		sessionStorage.setItem(STORAGE_KEY, key);
		setApiKey(key);
	};

	const generate = async () => {
		setGenerating(true);
		try {
			const blob = await generateSpeech({
				apiKey,
				model,
				voice,
				text: text.trim(),
				style,
			});
			setAudio({ blob, url: URL.createObjectURL(blob) });
		} catch (error) {
			toast.error(
				`Voice generation failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setGenerating(false);
		}
	};

	// Same path as pasting a file: store it as a project media asset, then place it at the playhead
	const addToTimeline = async () => {
		if (!audio) return;
		const activeProject = editor.project.getActive();
		if (!activeProject) return;

		setAdding(true);
		try {
			const file = new File([audio.blob], `voice-${voice}-${Date.now()}.wav`, {
				type: "audio/wav",
			});
			const [asset] = await processMediaAssets({ files: [file] });
			if (!asset) throw new Error("Could not read the generated audio");

			const addMediaCmd = new AddMediaAssetCommand(
				activeProject.metadata.id,
				asset,
			);
			const element = buildElementFromMedia({
				mediaId: addMediaCmd.getAssetId(),
				mediaType: asset.type,
				name: asset.name,
				duration:
					asset.duration != null
						? mediaTimeFromSeconds({ seconds: asset.duration })
						: DEFAULT_NEW_ELEMENT_DURATION,
				startTime: editor.playback.getCurrentTime(),
			});
			const insertCmd = new InsertElementCommand({
				element,
				placement: { mode: "auto", trackType: "audio" },
			});
			editor.command.execute({
				command: new BatchCommand([addMediaCmd, insertCmd]),
			});
			toast.success("Voiceover added to the timeline");
		} catch (error) {
			toast.error(
				`Could not add voiceover: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setAdding(false);
		}
	};

	if (!apiKey) {
		return (
			<PanelView title="AI Voice">
				<div className="flex flex-col gap-3 p-1">
					<Label htmlFor="ai-voice-key">Gemini API key</Label>
					<Input
						id="ai-voice-key"
						type="password"
						placeholder="AIza..."
						value={keyInput}
						onChange={(event) => setKeyInput(event.target.value)}
						onKeyDown={(event) => event.key === "Enter" && saveKey()}
					/>
					<Button onClick={saveKey} disabled={!keyInput.trim()}>
						Save key
					</Button>
					<p className="text-muted-foreground text-xs">
						Kept in this browser session only and sent only to Google's Gemini
						API. Get a key at aistudio.google.com/apikey.
					</p>
				</div>
			</PanelView>
		);
	}

	const tooLong = text.length > MAX_TEXT_LENGTH;

	return (
		<PanelView
			title="AI Voice"
			actions={
				<Button
					variant="text"
					size="text"
					className="text-xs"
					onClick={() => setApiKey("")}
				>
					Change key
				</Button>
			}
		>
			<div className="flex flex-col gap-3 p-1 pb-4">
				<div className="flex flex-col gap-1.5">
					<Label>Model</Label>
					<Select value={model} onValueChange={setModel}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{GEMINI_TTS_MODELS.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>Voice</Label>
					<Select value={voice} onValueChange={setVoice}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{GEMINI_VOICES.map((name) => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>Style (optional)</Label>
					<Select
						value=""
						onValueChange={(label) =>
							setStyle(
								STYLE_PRESETS.find((preset) => preset.label === label)?.style ??
									"",
							)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pick a preset…" />
						</SelectTrigger>
						<SelectContent>
							{STYLE_PRESETS.map((preset) => (
								<SelectItem key={preset.label} value={preset.label}>
									{preset.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input
						placeholder="e.g. warm, slow, storytelling"
						value={style}
						onChange={(event) => setStyle(event.target.value)}
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="ai-voice-text">Text</Label>
					<Textarea
						id="ai-voice-text"
						rows={6}
						placeholder="What should the voice say?"
						value={text}
						onChange={(event) => setText(event.target.value)}
					/>
					<span
						className={
							tooLong
								? "text-destructive text-xs"
								: "text-muted-foreground text-xs"
						}
					>
						{text.length} / {MAX_TEXT_LENGTH}
					</span>
				</div>

				<Button
					onClick={generate}
					disabled={generating || !text.trim() || tooLong}
				>
					{generating ? "Generating…" : "Generate voice"}
				</Button>

				{audio && (
					<div className="flex flex-col gap-2 rounded-md border p-2">
						{/* biome-ignore lint/a11y/useMediaCaption: generated speech preview */}
						<audio controls src={audio.url} className="w-full" />
						<Button variant="outline" onClick={addToTimeline} disabled={adding}>
							{adding ? "Adding…" : "Add to timeline"}
						</Button>
					</div>
				)}
			</div>
		</PanelView>
	);
}
