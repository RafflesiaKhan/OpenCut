"use client";

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
	root: {
		fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		fontSize: 13,
		color: "#2c2c2c",
		background: "#fff",
		minHeight: "100%",
		display: "flex",
		flexDirection: "column" as const,
	},
	header: {
		display: "flex",
		flexWrap: "wrap" as const,
		alignItems: "center",
		justifyContent: "space-between",
		padding: "12px 16px 0",
		borderBottom: "1px solid #e8e8e8",
	},
	logo: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		fontWeight: 700,
		fontSize: 14,
		color: "#0ea5e9",
	},
	tabs: { display: "flex", flexWrap: "wrap" as const },
	tab: (active: boolean): React.CSSProperties => ({
		padding: "10px 12px",
		fontSize: 12,
		fontWeight: active ? 600 : 400,
		color: active ? "#0ea5e9" : "#555",
		cursor: "pointer",
		background: "none",
		border: "none",
		borderBottom: active ? "2px solid #0ea5e9" : "2px solid transparent",
		marginBottom: -1,
	}),
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
		color: "#555",
		marginBottom: 4,
		display: "block",
	},
	select: {
		width: "100%",
		padding: "7px 10px",
		borderRadius: 6,
		border: "1px solid #ddd",
		fontSize: 13,
		background: "#fff",
		color: "#2c2c2c",

		cursor: "pointer",
	},
	input: {
		width: "100%",
		padding: "7px 10px",
		borderRadius: 6,
		border: "1px solid #ddd",
		fontSize: 13,
		color: "#2c2c2c",
	},
	textarea: {
		width: "100%",
		padding: "9px 10px",
		borderRadius: 6,
		border: "1px solid #ddd",
		fontSize: 12,
		color: "#2c2c2c",
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
	btn: (variant: "primary" | "secondary"): React.CSSProperties => ({
		padding: variant === "primary" ? "9px 0" : "7px 12px",
		width: variant === "primary" ? "100%" : "auto",
		borderRadius: 7,
		fontSize: 13,
		fontWeight: 600,
		cursor: "pointer",
		border: "none",
		background: variant === "primary" ? "#0ea5e9" : "#e0f2fe",
		color: variant === "primary" ? "#fff" : "#0369a1",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	}),
	card: {
		background: "#f0f9ff",
		borderRadius: 8,
		padding: 12,
		border: "1px solid #bae6fd",
	},
	error: {
		background: "#fff0f0",
		color: "#c0392b",
		borderRadius: 6,
		padding: "8px 10px",
		fontSize: 12,
		border: "1px solid #fcc",
	},
	success: {
		background: "#f0fff4",
		color: "#27ae60",
		borderRadius: 6,
		padding: "8px 10px",
		fontSize: 12,
		border: "1px solid #c3e6cb",
	},
	keyStatus: (saved: boolean): React.CSSProperties => ({
		fontSize: 11,
		color: saved ? "#27ae60" : "#e67e22",
		fontWeight: 600,
		marginTop: 4,
	}),
	spinner: {
		display: "inline-block",
		width: 14,
		height: 14,
		border: "2px solid rgba(255,255,255,0.4)",
		borderTopColor: "#fff",
		borderRadius: "50%",
		animation: "opencut-extension-spin 0.7s linear infinite",
	},
	providerToggle: (active: boolean, color: string): React.CSSProperties => ({
		flex: 1,
		padding: "7px 0",
		borderRadius: 6,
		border: "none",
		fontSize: 12,
		fontWeight: 600,
		cursor: "pointer",
		background: active ? color : "transparent",
		color: active ? "#fff" : color,
		transition: "background 0.15s",
	}),
	toggle: (on: boolean): React.CSSProperties => ({
		width: 36,
		height: 20,
		borderRadius: 10,
		background: on ? "#0ea5e9" : "#ccc",
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
		background: "#fff",
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
		color: "#aaa",
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
		<div
			className="overscroll-contain opencut-ai-image h-full overflow-auto"
			style={s.root}
		>
			<style>{`
        @keyframes opencut-extension-spin { to { transform: rotate(360deg); } }
        .opencut-ai-image select:focus, .opencut-ai-image input:focus, .opencut-ai-image textarea:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 2px rgba(14,165,233,0.15); }
        .opencut-ai-image button:hover:not(:disabled) { opacity: 0.88; }
        .opencut-ai-image button:disabled { opacity: 0.5; cursor: not-allowed; }
        .opencut-ai-image img { display: block; }
      `}</style>

			{/* Header */}
			<div style={s.header}>
				<div style={s.logo}>
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#0ea5e9"
						strokeWidth="2.5"
					>
						<rect x="3" y="3" width="18" height="18" rx="3" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path d="M21 15l-5-5L5 21" />
					</svg>
					Image Generate AI
				</div>
				<div style={s.tabs}>
					<button
						type="button"
						style={s.tab(tab === "generate")}
						onClick={() => setTab("generate")}
					>
						Generate
					</button>
					<button
						type="button"
						style={s.tab(tab === "settings")}
						onClick={() => setTab("settings")}
					>
						Settings {!geminiKey && !openaiKey && "⚠️"}
					</button>
				</div>
			</div>

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
							<div style={s.keyStatus(!!geminiKey)}>
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
							<div style={s.keyStatus(!!openaiKey)}>
								{openaiKey ? "✓ OpenAI key saved" : "No OpenAI key"}
							</div>
						</div>

						<button
							type="button"
							style={s.btn("primary")}
							onClick={saveKeys}
							disabled={!geminiInput.trim() && !openaiInput.trim()}
						>
							Save Keys & Generate
						</button>

						<div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
							Keys are stored locally in your browser only.{"\n"}
							Get a Gemini key at{" "}
							<a
								href="https://aistudio.google.com/apikey"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "#0ea5e9" }}
							>
								aistudio.google.com/apikey
							</a>{" "}
							· OpenAI key at{" "}
							<a
								href="https://platform.openai.com/api-keys"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "#0ea5e9" }}
							>
								platform.openai.com/api-keys
							</a>
						</div>

						<div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
							Gemini image generation docs:{" "}
							<a
								href="https://ai.google.dev/gemini-api/docs/image-generation"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "#0ea5e9" }}
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
									background: "#f0f9ff",
									borderRadius: 8,
									padding: 3,
									gap: 2,
								}}
							>
								<button
									type="button"
									style={s.providerToggle(provider === "Gemini", "#0ea5e9")}
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
									style={s.providerToggle(provider === "OpenAI", "#10a37f")}
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
									color: charOver ? "#c0392b" : "#999",
									textAlign: "right",
									marginTop: 3,
								}}
							>
								{prompt.length} / {MAX_CHARS}
							</div>
						</div>

						{error && <div style={s.error}>{error}</div>}

						<button
							type="button"
							style={s.btn("primary")}
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
						</button>

						{/* Result */}
						{imageDataUrl && (
							<div style={s.card}>
								<div
									style={{
										fontSize: 12,
										fontWeight: 600,
										marginBottom: 8,
										color: "#0369a1",
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
									<button
										type="button"
										style={{ ...s.btn("primary"), flex: 1 }}
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
									</button>
									<button
										type="button"
										style={s.btn("secondary")}
										onClick={download}
									>
										Download
									</button>
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
		</div>
	);
}
