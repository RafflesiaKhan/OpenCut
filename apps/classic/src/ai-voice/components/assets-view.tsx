"use client";

import { useEffect, useRef, useState } from "react";
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
import { useAddExtensionMedia } from "@/media/use-add-extension-media";
import {
	isOmniVoiceEngine,
	VOICE_STUDIO_DEFAULT_ENGINE,
	VOICE_STUDIO_DEFAULT_VOICE,
	VOICE_STUDIO_MAX_TEXT,
	voiceStudioRequest,
	type VoiceStudioOptions,
} from "@/ai-voice/voice-studio";
import {
	GEMINI_TTS_MODELS,
	GEMINI_VOICES,
	MAX_TEXT_LENGTH,
	STYLE_PRESETS,
	generateSpeech,
} from "@/ai-voice/gemini-tts";

// Same convention as the Canva apps: the key lives only for this browser session
const STORAGE_KEY = "opencut_gemini_api_key";
const PROVIDER_KEY = "opencut_ai_voice_provider";
type VoiceProvider = "gemini" | "voice-studio";

export function VoiceView() {
	const addFiles = useAddExtensionMedia();
	const [provider, setProvider] = useState<VoiceProvider>("gemini");
	const [studioOptions, setStudioOptions] = useState<VoiceStudioOptions | null>(
		null,
	);
	const [studioError, setStudioError] = useState("");
	const [studioEngine, setStudioEngine] = useState(VOICE_STUDIO_DEFAULT_ENGINE);
	const [studioVoice, setStudioVoice] = useState(VOICE_STUDIO_DEFAULT_VOICE);
	const generation = useRef<AbortController | null>(null);

	const [apiKey, setApiKey] = useState("");
	const [keyInput, setKeyInput] = useState("");
	const [model, setModel] = useState<string>(GEMINI_TTS_MODELS[0].id);
	const [voice, setVoice] = useState<string>("Kore");
	const [style, setStyle] = useState("");
	const [text, setText] = useState("");
	const [generating, setGenerating] = useState(false);
	const [adding, setAdding] = useState(false);
	const [audio, setAudio] = useState<{ file: File; url: string } | null>(null);

	useEffect(() => {
		const saved = sessionStorage.getItem(STORAGE_KEY) ?? "";
		setApiKey(saved);
		setKeyInput(saved);
		if (sessionStorage.getItem(PROVIDER_KEY) === "voice-studio")
			setProvider("voice-studio");
	}, []);

	useEffect(() => () => generation.current?.abort(), []);

	const checkingStudio =
		provider === "voice-studio" && !studioOptions && !studioError;
	useEffect(() => {
		if (!checkingStudio) return;
		const controller = new AbortController();
		void voiceStudioRequest({ signal: controller.signal, cache: "no-store" })
			.then((response) => response.json() as Promise<VoiceStudioOptions>)
			.then((options) => {
				if (controller.signal.aborted) return;
				setStudioOptions(options);
				setStudioEngine(VOICE_STUDIO_DEFAULT_ENGINE);
				setStudioVoice(VOICE_STUDIO_DEFAULT_VOICE);
			})
			.catch((error: Error) => {
				if (!controller.signal.aborted) setStudioError(error.message);
			});
		return () => controller.abort();
	}, [checkingStudio]);

	const local = provider === "voice-studio";
	const maxText = local ? VOICE_STUDIO_MAX_TEXT : MAX_TEXT_LENGTH;
	const tooLong = text.length > maxText;

	const chooseProvider = (value: string) => {
		const next = value === "voice-studio" ? "voice-studio" : "gemini";
		setProvider(next);
		sessionStorage.setItem(PROVIDER_KEY, next);
		setStudioOptions(null);
		setStudioError("");
	};

	const checkStudio = () => {
		setStudioOptions(null);
		setStudioError("");
	};

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
		if (generating || tooLong || !text.trim()) return;
		const controller = new AbortController();
		generation.current = controller;
		setGenerating(true);
		try {
			const blob = local
				? await (
						await voiceStudioRequest({
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								text: text.trim(),
								engine: studioEngine,
								voice: studioVoice,
							}),
							signal: controller.signal,
						})
					).blob()
				: await generateSpeech({
						apiKey,
						model,
						voice,
						text: text.trim(),
						style,
					});
			if (controller.signal.aborted) return;
			if (!blob.size) throw new Error("The provider returned empty audio.");
			const name = local ? "voice-studio" : `voice-${voice}`;
			const file = new File([blob], `${name}-${Date.now()}.wav`, {
				type: "audio/wav",
			});
			setAudio({ file, url: URL.createObjectURL(file) });
		} catch (error) {
			if (!controller.signal.aborted) {
				toast.error(
					`Voice generation failed: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		} finally {
			if (!controller.signal.aborted) setGenerating(false);
		}
	};

	const addToTimeline = async () => {
		if (!audio || adding) return;
		setAdding(true);
		try {
			await addFiles([audio.file]);
			toast.success("Voiceover added to the timeline");
		} catch (error) {
			toast.error(
				`Could not add voiceover: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setAdding(false);
		}
	};

	return (
		<PanelView
			title="AI Voice"
			actions={
				!local &&
				apiKey && (
					<Button
						variant="text"
						size="text"
						className="text-xs"
						onClick={() => setApiKey("")}
					>
						Change key
					</Button>
				)
			}
		>
			<div className="flex flex-col gap-3 p-1 pb-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="ai-voice-provider">Provider</Label>
					<Select
						value={provider}
						onValueChange={chooseProvider}
						disabled={generating}
					>
						<SelectTrigger id="ai-voice-provider">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="gemini">Gemini</SelectItem>
							<SelectItem value="voice-studio">Voice Studio (local)</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{!local && !apiKey ? (
					<>
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
					</>
				) : (
					<>
						{local ? (
							<>
								<div className="flex items-start justify-between gap-2">
									<p role="status" className="text-muted-foreground text-xs">
										{studioError ||
											(studioOptions
												? "Voice Studio connected on this computer."
												: "Checking Voice Studio…")}
									</p>
									<Button
										size="sm"
										variant="outline"
										onClick={checkStudio}
										disabled={generating || (!studioOptions && !studioError)}
									>
										{studioError ? "Retry" : "Refresh"}
									</Button>
								</div>
								{studioOptions && (
									<>
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="voice-studio-engine">Engine</Label>
											<Select
												value={studioEngine}
												disabled={generating}
												onValueChange={(engine) => {
													setStudioEngine(engine);
													setStudioVoice(VOICE_STUDIO_DEFAULT_VOICE);
												}}
											>
												<SelectTrigger id="voice-studio-engine">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={VOICE_STUDIO_DEFAULT_ENGINE}>
														Active engine in Voice Studio
													</SelectItem>
													{studioOptions.engines.map(({ id, label }) => (
														<SelectItem key={id} value={id}>
															{label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="voice-studio-voice">Voice</Label>
											<Select
												value={studioVoice}
												disabled={generating}
												onValueChange={setStudioVoice}
											>
												<SelectTrigger id="voice-studio-voice">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={VOICE_STUDIO_DEFAULT_VOICE}>
														Engine default voice
													</SelectItem>
													{studioOptions.voices.map(({ id, label }) => (
														<SelectItem key={id} value={id}>
															{label}
														</SelectItem>
													))}
													{isOmniVoiceEngine(studioEngine) &&
														studioOptions.personas.map(({ id, label }) => (
															<SelectItem key={id} value={id}>
																{label} (designed)
															</SelectItem>
														))}
												</SelectContent>
											</Select>
										</div>
									</>
								)}
							</>
						) : (
							<>
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
												STYLE_PRESETS.find((preset) => preset.label === label)
													?.style ?? "",
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
							</>
						)}

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
								{text.length} / {maxText}
							</span>
						</div>

						<Button
							onClick={generate}
							disabled={
								generating ||
								!text.trim() ||
								tooLong ||
								(local && !studioOptions)
							}
						>
							{generating ? "Generating…" : "Generate voice"}
						</Button>

						{audio && (
							<div className="flex flex-col gap-2 rounded-md border p-2">
								{/* biome-ignore lint/a11y/useMediaCaption: generated speech preview */}
								<audio
									controls
									src={audio.url}
									className="w-full"
									aria-label="Generated voice preview"
								/>
								<Button
									variant="outline"
									onClick={addToTimeline}
									disabled={adding}
								>
									{adding ? "Adding…" : "Add to timeline"}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</PanelView>
	);
}
