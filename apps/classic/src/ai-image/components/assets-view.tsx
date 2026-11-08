"use client";

import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { Button } from "@/components/ui/button";

import { useAddExtensionMedia } from "@/media/use-add-extension-media";
import { extensionImageFile } from "@/media/extension-image-file";
import {
	GEMINI_MODELS,
	modelCaps,
	requestGeminiImage,
	type ThinkingLevel,
} from "@/ai-image/gemini-image";
import {
	readGeminiImageKey,
	saveGeminiImageKey,
	useGeminiImageKey,
} from "@/ai-image/use-gemini-image-key";
import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "generate" | "settings";
type Provider = "Gemini" | "OpenAI";

// ─── Data ─────────────────────────────────────────────────────────────────────

const OPENAI_MODELS = [
	{ id: "gpt-image-2.5-flare", label: "GPT Image 2.5 Flare (fast)" },
	{ id: "gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst (precise)" },
	{ id: "gpt-image-2", label: "GPT Image 2" },
];

const ASPECT_RATIOS = [
	"1:1",
	"16:9",
	"9:16",
	"4:3",
	"3:4",
	"3:2",
	"2:3",
	"4:5",
	"5:4",
	"21:9",
];

const OPENAI_SIZES = ["auto", "1024x1024", "1536x1024", "1024x1536"];

// GPT Image 2.5 adds xhigh/max; earlier GPT Image models top out at high
const openaiQualities = (m: string) =>
	m.startsWith("gpt-image-2.5")
		? ["auto", "max", "xhigh", "high", "medium", "low"]
		: ["auto", "high", "medium", "low"];
const OPENAI_BACKGROUNDS = ["auto", "opaque", "transparent"];
const OPENAI_OUTPUT_FORMATS = ["png", "jpeg", "webp"];

const STORAGE_KEY_OPENAI = "openai_api_key";
const MAX_CHARS = 2000;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
	body: {
		flex: 1,
		padding: "14px 16px",
		display: "flex",
		flexDirection: "column" as const,
		gap: 12,
	},
	label: {
		fontSize: 12,
		fontWeight: 600,
		color: "var(--muted-foreground)",
		marginBottom: 4,
		display: "block",
	},
	select: {
		width: "100%",
		padding: "7px 10px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 13,
		background: "var(--input)",
		color: "var(--foreground)",

		cursor: "pointer",
	},
	input: {
		width: "100%",
		background: "var(--input)",
		padding: "7px 10px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 13,
		color: "var(--foreground)",
	},
	textarea: {
		width: "100%",
		background: "var(--input)",
		padding: "9px 10px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 12,
		color: "var(--foreground)",
		resize: "vertical" as const,
		minHeight: 120,
		lineHeight: 1.5,

		fontFamily: "inherit",
	},
	row2: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 10,
	},
	card: {
		background: "var(--accent)",
		borderRadius: 8,
		padding: 12,
		border: "1px solid var(--border)",
	},
	error: {
		background: "color-mix(in srgb, var(--destructive) 8%, var(--background))",
		color: "var(--destructive)",
		borderRadius: 6,
		padding: "8px 10px",
		fontSize: 12,
		border:
			"1px solid color-mix(in srgb, var(--destructive) 26%, var(--border))",
	},
	success: {
		background: "var(--accent)",
		color: "var(--foreground)",
		borderRadius: 6,
		padding: "8px 10px",
		fontSize: 12,
		border: "1px solid var(--border)",
	},
	keyStatus: {
		fontSize: 11,
		color: "var(--muted-foreground)",
		fontWeight: 600,
		marginTop: 4,
	},
	spinner: {
		display: "inline-block",
		width: 14,
		height: 14,
		border: "2px solid color-mix(in srgb, currentColor 35%, transparent)",
		borderTopColor: "currentColor",
		borderRadius: "50%",
		animation: "opencut-extension-spin 0.7s linear infinite",
	},
	providerToggle: (active: boolean): React.CSSProperties => ({
		flex: 1,
		padding: "7px 0",
		borderRadius: 6,
		border: "none",
		fontSize: 12,
		fontWeight: 600,
		cursor: "pointer",
		background: active ? "var(--foreground)" : "transparent",
		color: active ? "var(--background)" : "var(--foreground)",
		transition: "background 0.15s",
	}),
	toggle: (on: boolean): React.CSSProperties => ({
		width: 36,
		height: 20,
		borderRadius: 10,
		background: on ? "var(--foreground)" : "var(--muted)",
		position: "relative",
		cursor: "pointer",
		border: "none",
		transition: "background 0.2s",
		flexShrink: 0,
	}),
	toggleKnob: (on: boolean): React.CSSProperties => ({
		position: "absolute",
		top: 2,
		left: on ? 18 : 2,
		width: 16,
		height: 16,
		borderRadius: "50%",
		background: on ? "var(--background)" : "var(--foreground)",
		transition: "left 0.2s",
	}),
	toolRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "6px 0",
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: 600,
		color: "var(--muted-foreground)",
		textTransform: "uppercase" as const,
		letterSpacing: 0.5,
		marginBottom: 6,
	},
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AIImageView() {
	const addFiles = useAddExtensionMedia();
	const [tab, setTab] = useState<Tab>("generate");

	// API keys
	const geminiKey = useGeminiImageKey();
	const [openaiKey, setOpenaiKey] = useState("");
	const [geminiInput, setGeminiInput] = useState("");
	const [openaiInput, setOpenaiInput] = useState("");

	// Provider + model
	const [provider, setProvider] = useState<Provider>("Gemini");
	const [geminiModel, setGeminiModel] = useState(GEMINI_MODELS[0].id);
	const [openaiModel, setOpenaiModel] = useState(OPENAI_MODELS[0].id);

	// Gemini shared params
	const [aspectRatio, setAspectRatio] = useState("1:1");
	const [resolution, setResolution] = useState("1K");
	// Gemini model-specific params
	const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("Minimal");
	const [grounding, setGrounding] = useState(false);
	const [imageSearch, setImageSearch] = useState(false);

	// OpenAI params
	const [openaiSize, setOpenaiSize] = useState("auto");
	const [openaiQuality, setOpenaiQuality] = useState("auto");
	const [background, setBackground] = useState("auto");
	const [outputFmt, setOutputFmt] = useState("png");

	// Prompt + state
	const [prompt, setPrompt] = useState("");
	const [generating, setGenerating] = useState(false);
	const [imageDataUrl, setImageDataUrl] = useState("");
	const [error, setError] = useState("");
	const [addStatus, setAddStatus] = useState("");
	const [adding, setAdding] = useState(false);

	useEffect(() => {
		const o = sessionStorage.getItem(STORAGE_KEY_OPENAI) || "";
		setGeminiInput(readGeminiImageKey());
		setOpenaiKey(o);
		setOpenaiInput(o);
		if (!readGeminiImageKey() && !o) setTab("settings");
	}, []);

	useEffect(() => setGeminiInput(geminiKey), [geminiKey]);

	const saveKeys = () => {
		const g = geminiInput.trim();
		const o = openaiInput.trim();
		saveGeminiImageKey(g);
		sessionStorage.setItem(STORAGE_KEY_OPENAI, o);
		setOpenaiKey(o);
		if (g || o) setTab("generate");
	};

	const handleOpenaiModelChange = (m: string) => {
		setOpenaiModel(m);
		if (!openaiQualities(m).includes(openaiQuality)) setOpenaiQuality("auto");
	};

	const handleGeminiModelChange = (m: string) => {
		setGeminiModel(m);
		// Reset model-specific settings when switching
		setGrounding(false);
		setImageSearch(false);
		setThinkingLevel("Minimal");
		if (!modelCaps(m).sizes.includes(resolution)) setResolution("1K");
		setImageDataUrl("");
		setError("");
		setAddStatus("");
	};

	const activeKey = provider === "Gemini" ? geminiKey : openaiKey;
	const charOver = prompt.length > MAX_CHARS;
	const caps = modelCaps(geminiModel);

	// ── Generate ──────────────────────────────────────────────────────────────

	const generate = async () => {
		if (!activeKey) {
			setError(`No ${provider} API key saved. Go to Settings.`);
			setTab("settings");
			return;
		}
		if (generating) return;
		if (!prompt.trim()) {
			setError("Please enter a prompt.");
			return;
		}
		if (
			provider === "OpenAI" &&
			background === "transparent" &&
			outputFmt === "jpeg"
		) {
			setError("Choose PNG or WebP for a transparent background.");
			return;
		}
		if (charOver) {
			setError("Prompt is too long.");
			return;
		}

		setGenerating(true);
		setError("");
		setImageDataUrl("");
		setAddStatus("");

		try {
			provider === "Gemini" ? await generateGemini() : await generateOpenAI();
		} catch (err: unknown) {
			console.error("Image generation error:", err);
			setError(
				`Image generation failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setGenerating(false);
		}
	};

	// Gemini image models via the Interactions API
	const generateGemini = async () => {
		const responseFormat: Record<string, string> = {
			type: "image",
			mime_type: "image/png",
			aspect_ratio: aspectRatio,
		};
		if (caps.sizes.length) responseFormat.image_size = resolution;

		const body: Record<string, unknown> = {
			model: geminiModel,
			input: [{ type: "text", text: prompt.trim() }],
			response_format: responseFormat,
		};
		if (caps.thinking.length)
			body.generation_config = { thinking_level: thinkingLevel.toLowerCase() };

		const searchTypes: string[] = [];
		if (caps.grounding && grounding) searchTypes.push("web_search");
		if (caps.imageSearch && imageSearch) searchTypes.push("image_search");
		if (searchTypes.length)
			body.tools = [{ type: "google_search", search_types: searchTypes }];

		const { dataUrl } = await requestGeminiImage(geminiKey, body);
		setImageDataUrl(dataUrl);
	};

	const generateOpenAI = async () => {
		const body: Record<string, unknown> = {
			model: openaiModel,
			prompt: prompt.trim(),
			n: 1,
			quality: openaiQuality,
			background,
			output_format: outputFmt,
		};
		if (openaiSize !== "auto") body.size = openaiSize;

		const res = await fetch("https://api.openai.com/v1/images/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${openaiKey}`,
			},
			body: JSON.stringify(body),
		});

		const data = await res.json();
		if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

		const b64 = data.data?.[0]?.b64_json;
		if (!b64) throw new Error("No image returned.");
		const mime =
			outputFmt === "jpeg"
				? "image/jpeg"
				: outputFmt === "webp"
					? "image/webp"
					: "image/png";
		setImageDataUrl(`data:${mime};base64,${b64}`);
	};

	const addToTimeline = async () => {
		if (!imageDataUrl || adding) return;
		setAdding(true);
		setAddStatus("");
		try {
			await addFiles([extensionImageFile(imageDataUrl, "ai-image")]);
			setAddStatus("Image added to the timeline.");
		} catch (error) {
			setAddStatus(
				error instanceof Error ? error.message : "Failed to add image.",
			);
		} finally {
			setAdding(false);
		}
	};

	// ── Download ──────────────────────────────────────────────────────────────

	const download = () => {
		if (!imageDataUrl) return;
		const a = document.createElement("a");
		a.href = imageDataUrl;
		a.download = extensionImageFile(
			imageDataUrl,
			`ai-image-${provider.toLowerCase()}-${Date.now()}`,
		).name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	// ── Toggle helper ─────────────────────────────────────────────────────────

	const Toggle = ({
		on,
		onChange,
		label,
	}: {
		on: boolean;
		onChange: () => void;
		label: string;
	}) => (
		<button
			type="button"
			style={s.toggle(on)}
			onClick={onChange}
			aria-pressed={on}
			aria-label={label}
		>
			<span style={s.toggleKnob(on)} />
		</button>
	);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<PanelView
			title="AI Image"
			className="opencut-extension opencut-ai-image"
			scrollClassName="overscroll-contain"
			contentClassName="flex min-h-full flex-col px-0"
		>
			<nav
				aria-label="AI Image views"
				className="flex flex-wrap gap-1 border-b px-3 pb-2"
			>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "generate"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("generate")}
				>
					Generate
				</Button>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "settings"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("settings")}
				>
					Settings
				</Button>
			</nav>

			<div style={s.body}>
				{/* ── Settings Tab ─────────────────────────────────────── */}
				{tab === "settings" && (
					<>
						<div>
							<label htmlFor="ai-image-gemini-api-key" style={s.label}>
								Gemini API Key
							</label>
							<input
								id="ai-image-gemini-api-key"
								type="password"
								aria-label="Gemini API key"
								autoComplete="off"
								style={s.input}
								placeholder="AIza..."
								value={geminiInput}
								onChange={(e) => setGeminiInput(e.target.value)}
							/>
							<div style={s.keyStatus}>
								{geminiKey ? "✓ Gemini key saved" : "No Gemini key"}
							</div>
						</div>

						<div>
							<label htmlFor="ai-image-openai-api-key" style={s.label}>
								OpenAI API Key
							</label>
							<input
								id="ai-image-openai-api-key"
								type="password"
								aria-label="OpenAI API key"
								autoComplete="off"
								style={s.input}
								placeholder="sk-..."
								value={openaiInput}
								onChange={(e) => setOpenaiInput(e.target.value)}
							/>
							<div style={s.keyStatus}>
								{openaiKey ? "✓ OpenAI key saved" : "No OpenAI key"}
							</div>
						</div>

						<Button
							variant="default"
							className="w-full whitespace-normal"
							onClick={saveKeys}
							disabled={!geminiInput.trim() && !openaiInput.trim()}
						>
							Save Keys & Generate
						</Button>

						<div
							style={{
								fontSize: 11,
								color: "var(--muted-foreground)",
								lineHeight: 1.6,
							}}
						>
							Keys are stored locally in your browser only.{"\n"}
							Get a Gemini key at{" "}
							<a
								href="https://aistudio.google.com/apikey"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "var(--foreground)" }}
							>
								aistudio.google.com/apikey
							</a>{" "}
							· OpenAI key at{" "}
							<a
								href="https://platform.openai.com/api-keys"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "var(--foreground)" }}
							>
								platform.openai.com/api-keys
							</a>
						</div>

						<div
							style={{
								fontSize: 11,
								color: "var(--muted-foreground)",
								lineHeight: 1.6,
							}}
						>
							Gemini image generation docs:{" "}
							<a
								href="https://ai.google.dev/gemini-api/docs/image-generation"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "var(--foreground)" }}
							>
								ai.google.dev/gemini-api/docs/image-generation
							</a>
						</div>
					</>
				)}

				{/* ── Generate Tab ─────────────────────────────────────── */}
				{tab === "generate" && (
					<>
						{/* Provider toggle */}
						<div>
							<span style={s.label}>Provider</span>
							<div
								style={{
									display: "flex",
									background: "var(--accent)",
									borderRadius: 8,
									padding: 3,
									gap: 2,
								}}
							>
								<button
									type="button"
									style={s.providerToggle(provider === "Gemini")}
									onClick={() => {
										setProvider("Gemini");
										setImageDataUrl("");
										setError("");
										setAddStatus("");
									}}
								>
									Gemini
								</button>
								<button
									type="button"
									style={s.providerToggle(provider === "OpenAI")}
									onClick={() => {
										setProvider("OpenAI");
										setImageDataUrl("");
										setError("");
										setAddStatus("");
									}}
								>
									OpenAI
								</button>
							</div>
						</div>

						{/* ── Gemini params ── */}
						{provider === "Gemini" && (
							<>
								{/* Model */}
								<div>
									<label htmlFor="ai-image-model" style={s.label}>
										Model
									</label>
									<select
										id="ai-image-model"
										aria-label="Model"
										style={s.select}
										value={geminiModel}
										onChange={(e) => handleGeminiModelChange(e.target.value)}
									>
										{GEMINI_MODELS.map((m) => (
											<option key={m.id} value={m.id}>
												{m.label}
											</option>
										))}
									</select>
								</div>

								{/* Aspect ratio (all) + Resolution (models with size options) */}
								<div style={caps.sizes.length ? s.row2 : {}}>
									<div>
										<label htmlFor="ai-image-aspect-ratio" style={s.label}>
											Aspect Ratio
										</label>
										<select
											id="ai-image-aspect-ratio"
											aria-label="Aspect Ratio"
											style={s.select}
											value={aspectRatio}
											onChange={(e) => setAspectRatio(e.target.value)}
										>
											{ASPECT_RATIOS.map((r) => (
												<option key={r} value={r}>
													{r}
												</option>
											))}
										</select>
									</div>
									{caps.sizes.length > 0 && (
										<div>
											<label htmlFor="ai-image-resolution" style={s.label}>
												Resolution
											</label>
											<select
												id="ai-image-resolution"
												aria-label="Resolution"
												style={s.select}
												value={resolution}
												onChange={(e) => setResolution(e.target.value)}
											>
												{caps.sizes.map((r) => (
													<option key={r} value={r}>
														{r}
													</option>
												))}
											</select>
										</div>
									)}
								</div>

								{/* Thinking level (models that expose it) */}
								{caps.thinking.length > 0 && (
									<div>
										<label htmlFor="ai-image-thinking-level" style={s.label}>
											Thinking Level
										</label>
										<select
											id="ai-image-thinking-level"
											aria-label="Thinking Level"
											style={s.select}
											value={thinkingLevel}
											onChange={(e) =>
												setThinkingLevel(e.target.value as ThinkingLevel)
											}
										>
											{caps.thinking.map((l) => (
												<option key={l} value={l}>
													{l}
												</option>
											))}
										</select>
									</div>
								)}

								{/* Tools (models with Google Search) */}
								{caps.grounding && (
									<div>
										<div style={s.sectionLabel}>Tools</div>
										<div style={s.toolRow}>
											<span style={{ fontSize: 13 }}>
												Grounding with Google Search
											</span>
											<Toggle
												label="Web search grounding"
												on={grounding}
												onChange={() => setGrounding(!grounding)}
											/>
										</div>
										{caps.imageSearch && (
											<div style={s.toolRow}>
												<span style={{ fontSize: 13 }}>Image search</span>
												<Toggle
													label="Image search grounding"
													on={imageSearch}
													onChange={() => setImageSearch(!imageSearch)}
												/>
											</div>
										)}
									</div>
								)}
							</>
						)}

						{/* ── OpenAI params ── */}
						{provider === "OpenAI" && (
							<>
								{/* Model */}
								<div>
									<label htmlFor="ai-image-model-2" style={s.label}>
										Model
									</label>
									<select
										id="ai-image-model-2"
										aria-label="Model"
										style={s.select}
										value={openaiModel}
										onChange={(e) => handleOpenaiModelChange(e.target.value)}
									>
										{OPENAI_MODELS.map((m) => (
											<option key={m.id} value={m.id}>
												{m.label}
											</option>
										))}
									</select>
								</div>

								{/* Size — all models */}
								<div>
									<label htmlFor="ai-image-size" style={s.label}>
										Size
									</label>
									<select
										id="ai-image-size"
										aria-label="Size"
										style={s.select}
										value={openaiSize}
										onChange={(e) => setOpenaiSize(e.target.value)}
									>
										{OPENAI_SIZES.map((sz) => (
											<option key={sz} value={sz}>
												{sz}
											</option>
										))}
									</select>
								</div>

								{/* Quality + background + output format */}
								<div style={s.row2}>
									<div>
										<label htmlFor="ai-image-quality" style={s.label}>
											Quality
										</label>
										<select
											id="ai-image-quality"
											aria-label="Quality"
											style={s.select}
											value={openaiQuality}
											onChange={(e) => setOpenaiQuality(e.target.value)}
										>
											{openaiQualities(openaiModel).map((q) => (
												<option key={q} value={q}>
													{q}
												</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="ai-image-background" style={s.label}>
											Background
										</label>
										<select
											id="ai-image-background"
											aria-label="Background"
											style={s.select}
											value={background}
											onChange={(e) => setBackground(e.target.value)}
										>
											{OPENAI_BACKGROUNDS.map((b) => (
												<option key={b} value={b}>
													{b}
												</option>
											))}
										</select>
									</div>
								</div>
								<div>
									<label htmlFor="ai-image-output-format" style={s.label}>
										Output Format
									</label>
									<select
										id="ai-image-output-format"
										aria-label="Output Format"
										style={s.select}
										value={outputFmt}
										onChange={(e) => setOutputFmt(e.target.value)}
									>
										{OPENAI_OUTPUT_FORMATS.map((f) => (
											<option key={f} value={f}>
												{f}
											</option>
										))}
									</select>
								</div>
							</>
						)}

						{/* Prompt */}
						<div>
							<label htmlFor="ai-image-prompt" style={s.label}>
								Prompt
							</label>
							<textarea
								id="ai-image-prompt"
								style={s.textarea}
								aria-label="Image prompt"
								placeholder="Describe the image you want to generate…"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
							/>
							<div
								style={{
									fontSize: 11,
									color: charOver
										? "var(--destructive)"
										: "var(--muted-foreground)",
									textAlign: "right",
									marginTop: 3,
								}}
							>
								{prompt.length} / {MAX_CHARS}
							</div>
						</div>

						{error && <div style={s.error}>{error}</div>}

						<Button
							variant="default"
							className="w-full whitespace-normal"
							onClick={generate}
							disabled={generating || charOver}
						>
							{generating ? (
								<>
									<span style={s.spinner} /> Generating…
								</>
							) : (
								`Generate with ${provider}`
							)}
						</Button>

						{/* Result */}
						{imageDataUrl && (
							<div style={s.card}>
								<div
									style={{
										fontSize: 12,
										fontWeight: 600,
										marginBottom: 8,
										color: "var(--foreground)",
									}}
								>
									✓ Image ready
								</div>
								<img
									src={imageDataUrl}
									alt="Generated"
									style={{ width: "100%", borderRadius: 6, marginBottom: 10 }}
								/>
								<div style={{ display: "flex", gap: 8 }}>
									<Button
										variant="default"
										className="min-w-0 whitespace-normal"
										style={{ flex: 1 }}
										onClick={addToTimeline}
										disabled={adding}
									>
										{adding ? (
											<>
												<span style={s.spinner} /> Adding…
											</>
										) : (
											"Add to timeline"
										)}
									</Button>
									<Button variant="outline" size="sm" onClick={download}>
										Download
									</Button>
								</div>
								{addStatus && (
									<div
										style={{
											...(addStatus.startsWith("Image added")
												? s.success
												: s.error),
											marginTop: 8,
										}}
									>
										{addStatus}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</PanelView>
	);
}
