"use client";

import { useAddExtensionMedia } from "@/media/use-add-extension-media";
import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Voice {
	id: string;
	name: string;
	gender: "Male" | "Female";
	styles: string[];
}

type Tab = "generate" | "presets" | "settings";
type Model = "Gen2" | "FALCON";

interface Preset {
	name: string;
	note?: string;
	voiceId: string;
	style?: string;
	rate?: number;
	pitch?: number;
	model?: Model;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const VOICES: Voice[] = [
	{
		id: "en-US-natalie",
		name: "Natalie (F)",
		gender: "Female",
		styles: [
			"Narration",
			"Conversational",
			"News",
			"Customer Support",
			"Promo",
		],
	},
	{
		id: "en-US-samantha",
		name: "Samantha (F)",
		gender: "Female",
		styles: ["Luxury", "Narration", "Conversational"],
	},
	{
		id: "en-US-claire",
		name: "Claire (F)",
		gender: "Female",
		styles: ["Narration", "Conversational", "Customer Support"],
	},
	{
		id: "en-US-ronnie",
		name: "Ronnie (M)",
		gender: "Male",
		styles: ["Promo", "Narration", "Sports Commentary"],
	},
	{
		id: "en-US-ken",
		name: "Ken (M)",
		gender: "Male",
		styles: ["Narration", "Customer Support", "News"],
	},
	{
		id: "en-US-marcus",
		name: "Marcus (M)",
		gender: "Male",
		styles: ["Narration", "Promo", "Conversational"],
	},
	{
		id: "en-US-will",
		name: "Will (M)",
		gender: "Male",
		styles: ["Narration", "Conversational"],
	},
	{
		id: "en-US-ryan",
		name: "Ryan (M)",
		gender: "Male",
		styles: ["Narration", "Promo"],
	},
	{
		id: "en-US-terrell",
		name: "Terrell (M)",
		gender: "Male",
		styles: ["Narration", "Conversational", "Promo"],
	},
	{
		id: "en-US-phoebe",
		name: "Phoebe (F)",
		gender: "Female",
		styles: ["Conversational", "Narration", "Customer Support"],
	},
	{
		id: "en-US-daniel",
		name: "Daniel (M)",
		gender: "Male",
		styles: ["Storytelling", "Narration", "Conversational"],
	},
	{
		id: "en-US-carter",
		name: "Carter (M)",
		gender: "Male",
		styles: ["Documentary", "Narration", "Conversational"],
	},
	{
		id: "en-UK-theo",
		name: "Theo UK (M)",
		gender: "Male",
		styles: ["Narration", "Conversational", "Promo"],
	},
	{
		id: "en-UK-gabriel",
		name: "Gabriel UK (M)",
		gender: "Male",
		styles: ["Narration", "Conversational"],
	},
	{
		id: "en-AU-jimm",
		name: "Jimm AU (M)",
		gender: "Male",
		styles: ["Narration", "Conversational"],
	},
	{
		id: "pl-PL-blazej",
		name: "Blazej/Peter (M)",
		gender: "Male",
		styles: ["Conversational", "Narration"],
	},
];

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: Preset[] = [
	{
		name: "Picke the Duck",
		note: "Samantha Luxury — your signature duck voice",
		voiceId: "en-US-samantha",
		style: "Luxury",
		rate: -12,
	},
	{
		name: "Rosy (Peter & Rosy)",
		note: "Natalie Narration — slow, warm female narrator",
		voiceId: "en-US-natalie",
		style: "Narration",
		pitch: 2,
		rate: -32,
	},
	{
		name: "Peter (Peter & Rosy)",
		note: "Blazej Conversational — Polish voice with EN locale",
		voiceId: "pl-PL-blazej",
		style: "Conversational",
		pitch: 0,
		rate: -9,
	},
	{
		name: "Perspective Style",
		note: "Theo UK — British accent, slightly slower",
		voiceId: "en-UK-theo",
		style: "Narration",
		rate: -15,
	},
	{
		name: "Onion Style",
		note: "Daniel Storytelling — fast, punchy, good for explainers",
		voiceId: "en-US-daniel",
		style: "Storytelling",
		rate: 8,
	},
	{
		name: "Love Practice",
		note: "Samantha Luxury — slightly faster than Picke",
		voiceId: "en-US-samantha",
		style: "Luxury",
		rate: -11,
	},
	{
		name: "Carter – Documentary",
		note: "Good for Onion-style documentary narration",
		voiceId: "en-US-carter",
		style: "Documentary",
		rate: 0,
	},
	{
		name: "Gabriel – Narration UK",
		note: "British accent narration, good for Onion",
		voiceId: "en-UK-gabriel",
		style: "Narration",
		rate: 0,
	},
	{
		name: "Jimm – Narration AU",
		note: "Australian accent, Peter/Ron style",
		voiceId: "en-AU-jimm",
		style: "Narration",
		rate: 0,
	},
	{
		name: "Natalie – Newscast Formal",
		note: "Natalie in formal news delivery style",
		voiceId: "en-US-natalie",
		style: "Newscast Formal",
		rate: 0,
	},
	{
		name: "Ronnie (Falcon)",
		note: "Ronnie Conversational — Falcon model",
		voiceId: "en-US-ronnie",
		style: "Conversational",
		model: "FALCON",
	},
	{
		name: "Terrell (Falcon)",
		note: "Terrell Conversational — Falcon model",
		voiceId: "en-US-terrell",
		style: "Conversational",
		model: "FALCON",
	},
];

const STORAGE_KEY = "murf_api_key";
const MAX_CHARS = 3000;

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
	tabs: {
		display: "flex",
		gap: 0,
	},
	tab: (active: boolean): React.CSSProperties => ({
		padding: "10px 14px",
		fontSize: 13,
		fontWeight: active ? 600 : 400,
		color: active ? "#7c3aed" : "#555",
		cursor: "pointer",
		background: "none",
		border: "none",
		borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
		marginBottom: -1,
	}),
	logo: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		fontWeight: 700,
		fontSize: 14,
		color: "#7c3aed",
	},
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
		minHeight: 140,
		lineHeight: 1.5,

		fontFamily: "inherit",
	},
	row2: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 10,
	},
	sliderRow: {
		display: "flex",
		alignItems: "center",
		gap: 8,
	},
	slider: {
		flex: 1,
		accentColor: "#7c3aed",
	},
	sliderVal: {
		width: 32,
		textAlign: "right" as const,
		fontSize: 12,
		color: "#777",
		fontWeight: 600,
	},
	btn: (variant: "primary" | "secondary" | "ghost"): React.CSSProperties => ({
		padding: variant === "primary" ? "9px 0" : "7px 12px",
		width: variant === "primary" ? "100%" : "auto",
		borderRadius: 7,
		fontSize: 13,
		fontWeight: 600,
		cursor: "pointer",
		border: "none",
		background:
			variant === "primary"
				? "#7c3aed"
				: variant === "secondary"
					? "#f3f0ff"
					: "transparent",
		color:
			variant === "primary"
				? "#fff"
				: variant === "secondary"
					? "#7c3aed"
					: "#555",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	}),
	btnGroup: {
		display: "flex",
		gap: 8,
		flexWrap: "wrap" as const,
	},
	card: {
		background: "#f8f7ff",
		borderRadius: 8,
		padding: 12,
		border: "1px solid #ede9ff",
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
	charCount: (over: boolean): React.CSSProperties => ({
		fontSize: 11,
		color: over ? "#c0392b" : "#999",
		textAlign: "right" as const,
		marginTop: 3,
	}),
	keyStatus: (saved: boolean): React.CSSProperties => ({
		fontSize: 11,
		color: saved ? "#27ae60" : "#e67e22",
		fontWeight: 600,
		marginTop: 4,
	}),
	audioPlayer: {
		width: "100%",
		marginTop: 4,
		borderRadius: 6,
	},
	spinner: {
		display: "inline-block",
		width: 14,
		height: 14,
		border: "2px solid rgba(255,255,255,0.4)",
		borderTopColor: "#fff",
		borderRadius: "50%",
		animation: "opencut-extension-spin 0.7s linear infinite",
	},
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function MurfVoiceoverView() {
	const addFiles = useAddExtensionMedia();
	// Settings
	const [tab, setTab] = useState<Tab>("generate");
	const [savedKey, setSavedKey] = useState("");
	const [keyInput, setKeyInput] = useState("");

	// Model
	const [model, setModel] = useState<Model>("Gen2");

	// Voice params
	const [voiceId, setVoiceId] = useState(VOICES[0].id);
	const [style, setStyle] = useState(VOICES[0].styles[0]);
	const [rate, setRate] = useState(-14);
	const [pitch, setPitch] = useState(0);
	const [variation, setVariation] = useState(5);

	// Script
	const [text, setText] = useState("");

	// State
	const [generating, setGenerating] = useState(false);
	const [audioUrl, setAudioUrl] = useState("");
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [error, setError] = useState("");
	const [uploadStatus, setUploadStatus] = useState("");
	const [uploading, setUploading] = useState(false);

	const isFalcon = model === "FALCON";

	// Load saved API key on mount
	useEffect(() => {
		const stored = sessionStorage.getItem(STORAGE_KEY) || "";
		setSavedKey(stored);
		setKeyInput(stored);
		if (!stored) setTab("settings");
	}, []);

	useEffect(() => {
		return () => {
			if (audioUrl) URL.revokeObjectURL(audioUrl);
		};
	}, [audioUrl]);

	// Update style when voice changes
	const handleVoiceChange = (id: string) => {
		const voice = VOICES.find((v) => v.id === id) ?? VOICES[0];
		setVoiceId(id);
		setStyle(voice.styles[0]);
	};

	const saveKey = () => {
		const trimmed = keyInput.trim();
		sessionStorage.setItem(STORAGE_KEY, trimmed);
		setSavedKey(trimmed);
		if (trimmed) setTab("generate");
	};

	const currentVoice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];
	const charOver = text.length > MAX_CHARS;

	const applyPreset = (p: Preset) => {
		if (p.model) setModel(p.model);
		else setModel("Gen2");
		setVoiceId(p.voiceId);
		if (p.style) setStyle(p.style);
		if (p.rate !== undefined) setRate(p.rate);
		if (p.pitch !== undefined) setPitch(p.pitch);
		setAudioUrl("");
		setAudioBlob(null);
		setError("");
		setUploadStatus("");
		setTab("generate");
	};

	// ── Generate ──────────────────────────────────────────────────────────────

	const generate = async () => {
		if (generating) return;
		if (!savedKey) {
			setError("No API key saved. Go to Settings and add your Murf key.");
			setTab("settings");
			return;
		}
		if (!text.trim()) {
			setError("Please enter a script.");
			return;
		}
		if (charOver) {
			setError(`Script is too long (${text.length}/${MAX_CHARS} chars).`);
			return;
		}

		setGenerating(true);
		setError("");
		setAudioUrl("");
		setAudioBlob(null);
		setUploadStatus("");

		try {
			if (model === "Gen2") {
				// ── Gen2: standard JSON API ─────────────────────────────
				const res = await fetch("https://api.murf.ai/v1/speech/generate", {
					method: "POST",
					headers: {
						"api-key": savedKey,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						voiceId,
						style,
						text: text.trim(),
						rate,
						pitch,
						variation,
						format: "MP3",
						sampleRate: 48000,
						channelType: "STEREO",
						encodeAsBase64: true,
					}),
				});
				const data = await res.json();
				if (!res.ok)
					throw new Error(data.message || data.error || `HTTP ${res.status}`);
				if (typeof data.encodedAudio !== "string" || !data.encodedAudio) {
					throw new Error("Murf returned no audio.");
				}
				const bytes = Uint8Array.from(atob(data.encodedAudio), (byte) =>
					byte.charCodeAt(0),
				);
				const blob = new Blob([bytes], { type: "audio/mpeg" });
				setAudioBlob(blob);
				setAudioUrl(URL.createObjectURL(blob));
			} else {
				// ── FALCON: streaming audio API ─────────────────────────
				const res = await fetch("https://global.api.murf.ai/v1/speech/stream", {
					method: "POST",
					headers: {
						"api-key": savedKey,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						voiceId,
						text: text.trim(),
						locale: "en-US",
						model: "falcon-2.1",
						format: "MP3",
						sampleRate: 24000,
						channelType: "MONO",
					}),
				});
				if (!res.ok) {
					const errText = await res.text();
					throw new Error(`HTTP ${res.status}: ${errText}`);
				}
				const arrayBuffer = await res.arrayBuffer();
				if (!arrayBuffer.byteLength) throw new Error("Murf returned no audio.");
				const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
				const blobUrl = URL.createObjectURL(blob);
				setAudioBlob(blob);
				setAudioUrl(blobUrl);
			}
		} catch (err: unknown) {
			console.error("Murf generation error:", err);
			setError(
				`Voice generation failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setGenerating(false);
		}
	};

	const addToTimeline = async () => {
		if (!audioBlob || uploading) return;
		setUploading(true);
		setUploadStatus("");
		try {
			await addFiles([
				new File([audioBlob], "murf-voiceover.mp3", { type: "audio/mpeg" }),
			]);
			setUploadStatus("Voiceover added to the timeline.");
		} catch (error) {
			setUploadStatus(
				error instanceof Error ? error.message : "Failed to add voiceover.",
			);
		} finally {
			setUploading(false);
		}
	};

	// ── Download ──────────────────────────────────────────────────────────────

	const download = () => {
		if (!audioUrl) return;
		const suffix = isFalcon ? "falcon" : style.toLowerCase();
		const a = document.createElement("a");
		a.href = audioUrl;
		a.download = `voiceover-${voiceId}-${suffix}.mp3`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div
			className="overscroll-contain opencut-murf-voiceover h-full overflow-auto"
			style={s.root}
		>
			<style>{`
        @keyframes opencut-extension-spin { to { transform: rotate(360deg); } }
        .opencut-murf-voiceover select:focus, .opencut-murf-voiceover input:focus, .opencut-murf-voiceover textarea:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
        .opencut-murf-voiceover button:hover:not(:disabled) { opacity: 0.88; }
        .opencut-murf-voiceover button:disabled { opacity: 0.5; cursor: not-allowed; }
        .opencut-murf-voiceover audio { height: 36px; }
      `}</style>

			{/* Header */}
			<div style={s.header}>
				<div style={s.logo}>
					<svg
						aria-hidden="true"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="#7c3aed"
					>
						<path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 16.2A7.2 7.2 0 1112 4.8a7.2 7.2 0 010 14.4zm-1-11.7v7l5.25-3.5L11 7.5z" />
					</svg>
					Murf Voiceover
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
						style={s.tab(tab === "presets")}
						onClick={() => setTab("presets")}
					>
						Presets
					</button>
					<button
						type="button"
						style={s.tab(tab === "settings")}
						onClick={() => setTab("settings")}
					>
						Settings {!savedKey && "⚠️"}
					</button>
				</div>
			</div>

			{/* Body */}
			<div style={s.body}>
				{/* ── Settings Tab ───────────────────────────────────────── */}
				{tab === "settings" && (
					<>
						<div>
							<label htmlFor="murf-voiceover-murf-api-key" style={s.label}>
								Murf API Key
							</label>
							<input
								id="murf-voiceover-murf-api-key"
								type="password"
								aria-label="Murf API key"
								autoComplete="off"
								style={s.input}
								placeholder="ap-xxxxxxxxxxxxxxxx"
								value={keyInput}
								onChange={(e) => setKeyInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && saveKey()}
							/>
							<div style={s.keyStatus(!!savedKey)}>
								{savedKey ? "✓ API key saved" : "No key saved yet"}
							</div>
						</div>

						<button
							type="button"
							style={s.btn("primary")}
							onClick={saveKey}
							disabled={!keyInput.trim()}
						>
							Save Key & Go to Generate
						</button>

						<div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
							Your key is stored locally in your browser and never sent anywhere
							except the Murf API. Get your key at{" "}
							<strong>murf.ai → API access</strong>.
						</div>
						<div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
							Learn more here:{" "}
							<a
								href="https://murf.ai/api/products/text-to-speech/Falcon"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "#7c3aed", textDecoration: "underline" }}
							>
								murf.ai/api/products/text-to-speech/Falcon
							</a>
						</div>
					</>
				)}

				{/* ── Presets Tab ────────────────────────────────────────── */}
				{tab === "presets" && (
					<>
						<div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>
							Tap a preset to load its voice settings, then switch to Generate
							and paste your script.
						</div>
						{PRESETS.map((p) => (
							<button
								type="button"
								key={p.name}
								onClick={() => applyPreset(p)}
								style={{
									background: "#fff",
									border: "1px solid #e0d9ff",
									borderRadius: 8,
									padding: "10px 12px",
									textAlign: "left" as const,
									cursor: "pointer",
									width: "100%",
									display: "flex",
									flexDirection: "column" as const,
									gap: 3,
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<span
										style={{ fontWeight: 700, fontSize: 13, color: "#2c2c2c" }}
									>
										{p.name}
									</span>
									{p.model === "FALCON" && (
										<span
											style={{
												fontSize: 10,
												background: "#7c3aed",
												color: "#fff",
												borderRadius: 4,
												padding: "2px 6px",
												fontWeight: 600,
											}}
										>
											FALCON
										</span>
									)}
								</div>
								{p.note && (
									<span style={{ fontSize: 11, color: "#888" }}>{p.note}</span>
								)}
								<div
									style={{
										display: "flex",
										gap: 6,
										flexWrap: "wrap" as const,
										marginTop: 2,
									}}
								>
									<span
										style={{
											fontSize: 10,
											background: "#f3f0ff",
											color: "#7c3aed",
											borderRadius: 4,
											padding: "2px 7px",
										}}
									>
										{p.voiceId}
									</span>
									{p.style && (
										<span
											style={{
												fontSize: 10,
												background: "#f0fdf4",
												color: "#16a34a",
												borderRadius: 4,
												padding: "2px 7px",
											}}
										>
											{p.style}
										</span>
									)}
									{p.rate !== undefined && p.rate !== 0 && (
										<span
											style={{
												fontSize: 10,
												background: "#fefce8",
												color: "#a16207",
												borderRadius: 4,
												padding: "2px 7px",
											}}
										>
											rate {p.rate > 0 ? `+${p.rate}` : p.rate}
										</span>
									)}
									{p.pitch !== undefined && p.pitch !== 0 && (
										<span
											style={{
												fontSize: 10,
												background: "#fef2f2",
												color: "#dc2626",
												borderRadius: 4,
												padding: "2px 7px",
											}}
										>
											pitch {p.pitch > 0 ? `+${p.pitch}` : p.pitch}
										</span>
									)}
								</div>
							</button>
						))}
					</>
				)}

				{/* ── Generate Tab ───────────────────────────────────────── */}
				{tab === "generate" && (
					<>
						{/* Model toggle */}
						<div>
							<span style={s.label}>Model</span>
							<div
								style={{
									display: "flex",
									background: "#f3f0ff",
									borderRadius: 8,
									padding: 3,
									gap: 2,
								}}
							>
								{(["Gen2", "FALCON"] as Model[]).map((m) => (
									<button
										type="button"
										key={m}
										disabled={generating}
										aria-pressed={model === m}
										onClick={() => {
											setModel(m);
											setAudioUrl("");
											setAudioBlob(null);
											setError("");
											setUploadStatus("");
										}}
										style={{
											flex: 1,
											padding: "6px 0",
											borderRadius: 6,
											border: "none",
											fontSize: 12,
											fontWeight: 600,
											cursor: "pointer",
											background: model === m ? "#7c3aed" : "transparent",
											color: model === m ? "#fff" : "#7c3aed",
											transition: "background 0.15s",
										}}
									>
										{m}
									</button>
								))}
							</div>
							{isFalcon && (
								<div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
									Falcon: newer model, faster, MONO 24kHz. Style/Pitch not
									supported.
								</div>
							)}
						</div>

						{/* Voice + Style (style hidden for FALCON) */}
						<div style={isFalcon ? undefined : s.row2}>
							<div>
								<label htmlFor="murf-voiceover-voice" style={s.label}>
									Voice
								</label>
								<select
									id="murf-voiceover-voice"
									aria-label="Voice"
									style={s.select}
									value={voiceId}
									onChange={(e) => handleVoiceChange(e.target.value)}
								>
									{VOICES.map((v) => (
										<option key={v.id} value={v.id}>
											{v.name}
										</option>
									))}
								</select>
							</div>
							{!isFalcon && (
								<div>
									<label htmlFor="murf-voiceover-style" style={s.label}>
										Style
									</label>
									<select
										id="murf-voiceover-style"
										aria-label="Style"
										style={s.select}
										value={style}
										onChange={(e) => setStyle(e.target.value)}
									>
										{currentVoice.styles.map((st) => (
											<option key={st} value={st}>
												{st}
											</option>
										))}
									</select>
								</div>
							)}
						</div>

						{/* Rate (Gen2 only) */}
						{!isFalcon && (
							<div>
								<span style={s.label}>Rate (speed): {rate}</span>
								<div style={s.sliderRow}>
									<span style={{ fontSize: 11, color: "#aaa" }}>-50</span>
									<input
										type="range"
										min={-50}
										max={50}
										step={1}
										value={rate}
										onChange={(e) => setRate(Number(e.target.value))}
										style={s.slider}
									/>
									<span style={{ fontSize: 11, color: "#aaa" }}>50</span>
									<span style={s.sliderVal}>{rate}</span>
								</div>
							</div>
						)}

						{/* Pitch (Gen2 only) */}
						{!isFalcon && (
							<div>
								<span style={s.label}>Pitch: {pitch}</span>
								<div style={s.sliderRow}>
									<span style={{ fontSize: 11, color: "#aaa" }}>-50</span>
									<input
										type="range"
										min={-50}
										max={50}
										step={1}
										value={pitch}
										onChange={(e) => setPitch(Number(e.target.value))}
										style={s.slider}
									/>
									<span style={{ fontSize: 11, color: "#aaa" }}>50</span>
									<span style={s.sliderVal}>{pitch}</span>
								</div>
							</div>
						)}

						{/* Variation (Gen2 only) */}
						{!isFalcon && (
							<div>
								<span style={s.label}>Variation: {variation}</span>
								<div style={s.sliderRow}>
									<span style={{ fontSize: 11, color: "#aaa" }}>1</span>
									<input
										type="range"
										min={1}
										max={5}
										step={1}
										value={variation}
										onChange={(e) => setVariation(Number(e.target.value))}
										style={s.slider}
									/>
									<span style={{ fontSize: 11, color: "#aaa" }}>5</span>
									<span style={s.sliderVal}>{variation}</span>
								</div>
							</div>
						)}

						{/* Script */}
						<div>
							<label htmlFor="murf-voiceover-script" style={s.label}>
								Script
							</label>
							<textarea
								id="murf-voiceover-script"
								aria-label="Script"
								style={s.textarea}
								placeholder={
									"Paste your script here...\n\nTip: Use [pause 0.5s] for pauses."
								}
								value={text}
								onChange={(e) => setText(e.target.value)}
							/>
							<div style={s.charCount(charOver)}>
								{text.length} / {MAX_CHARS}
							</div>
						</div>

						{/* Error */}
						{error && <div style={s.error}>{error}</div>}

						{/* Generate Button */}
						<button
							type="button"
							style={s.btn("primary")}
							onClick={generate}
							disabled={generating || charOver}
						>
							{generating ? (
								<>
									<span style={s.spinner} />
									Generating…
								</>
							) : (
								"Generate Voiceover"
							)}
						</button>

						{/* Result */}
						{audioUrl && (
							<div style={s.card}>
								<div
									style={{
										fontSize: 12,
										fontWeight: 600,
										marginBottom: 8,
										color: "#27ae60",
									}}
								>
									✓ Voiceover ready
								</div>
								{/* biome-ignore lint/a11y/useMediaCaption: The preview reads the script shown in this panel. */}
								<audio
									aria-label="Generated voiceover preview"
									controls
									src={audioUrl}
									style={s.audioPlayer}
								/>
								<div style={{ ...s.btnGroup, marginTop: 10 }}>
									<button
										type="button"
										style={{ ...s.btn("primary"), flex: 1 }}
										onClick={addToTimeline}
										disabled={uploading}
									>
										{uploading ? "Adding…" : "Add to timeline"}
									</button>
									<button
										type="button"
										style={s.btn("secondary")}
										onClick={download}
									>
										Download MP3
									</button>
								</div>
								{uploadStatus && (
									<div
										style={{
											...(uploadStatus.startsWith("Voiceover added")
												? s.success
												: s.error),
											marginTop: 8,
										}}
									>
										{uploadStatus}
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
