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
import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "setup" | "queue" | "settings";
type GuideMode = "paste" | "file" | "gdoc";
type PromptsMode = "paste" | "file";
type ItemStatus = "waiting" | "generating" | "done" | "error";

interface ImageAsset {
	id: string;
	dataUrl: string;
	mimeType: string;
	name: string;
}

interface QueueItem {
	id: number;
	prompt: string;
	status: ItemStatus;
	imageDataUrl?: string;
	mimeType?: string;
	error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
];
const MAX_REFS = 3;
const DELAY_MS = 1200; // between requests

// ─── Style Guide Presets ──────────────────────────────────────────────────────

const GUIDE_PRESETS: { id: string; label: string; text: string }[] = [
	{
		id: "clay-motion",
		label: "Clay Motion",
		text: `STYLE: CLAYMATION (3D Clay Animation)

Art style:
Real claymation aesthetic — figures look physically sculpted from clay. Visible clay texture on all surfaces. Chunky, rounded, handmade look. Stop-motion physical feel. Soft studio lighting. NOT flat illustration, NOT 2D cartoon, NOT anime, NOT photorealistic humans.

Materials & texture:
All characters and objects must look made of real clay — with subtle fingerprint marks, clay grain texture, and slight imperfections that give a handcrafted feel.

Main character (appears in every scene):
Round white clay head, small black dot eyes, tiny simple nose, minimal mouth, wearing a sage green hoodie/sweater — same outfit every scene. Body is chunky and simple. Keep proportions consistent across all images.

Background/setting:
Simple, clean environments — plain painted walls, minimal props, soft muted colors (sage green, beige, warm grey, light blue). Backgrounds should also look clay-made or softly physical. No busy or complex scenes.

Lighting:
Soft, even studio lighting. Slight shadows to enhance the 3D clay depth. No dramatic or cinematic lighting.

Composition:
Medium shots and close-ups. Subject centered or slightly off-center. Leave clean empty space on one side for text overlay. No extreme angles.

NEVER generate:
2D illustration, flat cartoon, anime, photorealistic humans, neon colors, busy backgrounds, complex crowds, or digital-looking renders.

When a user gives you a scene or topic, generate a claymation-style image following all rules above. If anything conflicts with the style guide, silently default to the style guide.`,
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function parsePrompts(raw: string): string[] {
	return raw
		.split("\n")
		.map((l) => l.trim().replace(/^\d+[.)]\s*/, ""))
		.filter((l) => l.length > 0);
}

async function fetchGoogleDoc(url: string): Promise<string> {
	const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
	if (!m)
		throw new Error(
			"Invalid Google Docs URL — paste the full /document/d/… URL.",
		);
	const exportUrl = `/api/extension-resource?kind=guide&id=${m[1]}`;
	const res = await fetch(exportUrl);
	if (!res.ok)
		throw new Error(
			"Cannot fetch doc. Make sure it's shared as 'Anyone with the link can view'.",
		);
	return res.text();
}

function readFileText(file: File): Promise<string> {
	return new Promise((res, rej) => {
		const r = new FileReader();
		r.onload = () => res(r.result as string);
		r.onerror = () => rej(new Error("Failed to read file"));
		r.readAsText(file);
	});
}

function readFileDataUrl(file: File): Promise<ImageAsset> {
	return new Promise((res, rej) => {
		const r = new FileReader();
		r.onload = () =>
			res({
				id: crypto.randomUUID(),
				dataUrl: r.result as string,
				mimeType: file.type,
				name: file.name,
			});
		r.onerror = () => rej(new Error("Failed to read image"));
		r.readAsDataURL(file);
	});
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
	body: {
		flex: 1,
		padding: "12px",
		display: "flex",
		flexDirection: "column" as const,
		gap: 14,
	},
	section: { display: "flex", flexDirection: "column" as const, gap: 6 },
	sectionTitle: {
		fontSize: 11,
		fontWeight: 700,
		color: "var(--muted-foreground)",
		textTransform: "uppercase" as const,
		letterSpacing: 0.5,
	},
	label: {
		fontSize: 12,
		fontWeight: 600,
		color: "var(--foreground)",
		marginBottom: 2,
		display: "block",
	},
	labelNote: {
		fontSize: 11,
		fontWeight: 400,
		color: "var(--muted-foreground)",
		marginLeft: 4,
	},
	segmented: {
		display: "flex",
		background: "var(--accent)",
		borderRadius: 7,
		padding: 2,
		gap: 2,
	},
	seg: (a: boolean): React.CSSProperties => ({
		flex: 1,
		padding: "5px 0",
		borderRadius: 5,
		border: "none",
		fontSize: 11,
		fontWeight: a ? 600 : 400,
		cursor: "pointer",
		background: a ? "var(--foreground)" : "transparent",
		color: a ? "var(--background)" : "var(--muted-foreground)",
	}),
	select: {
		width: "100%",
		padding: "6px 9px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 12,
		background: "var(--input)",
		color: "var(--foreground)",
		cursor: "pointer",
	},
	input: {
		width: "100%",
		background: "var(--input)",
		padding: "6px 9px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 12,
		color: "var(--foreground)",
		fontFamily: "inherit",
	},
	textarea: {
		width: "100%",
		background: "var(--input)",
		padding: "8px 9px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 12,
		color: "var(--foreground)",
		resize: "vertical" as const,
		minHeight: 90,
		lineHeight: 1.5,
		fontFamily: "inherit",
	},
	row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
	dropzone: (drag: boolean): React.CSSProperties => ({
		border: `2px dashed ${drag ? "var(--foreground)" : "var(--border)"}`,
		borderRadius: 7,
		padding: "10px 12px",
		textAlign: "center" as const,
		fontSize: 11,
		color: drag ? "var(--foreground)" : "var(--muted-foreground)",
		cursor: "pointer",
		background: "var(--accent)",
		transition: "all 0.15s",
	}),
	imgGrid: { display: "flex", gap: 6, flexWrap: "wrap" as const },
	imgThumb: {
		width: 64,
		height: 64,
		objectFit: "cover" as const,
		borderRadius: 6,
		display: "block",
	},
	imgWrap: { position: "relative" as const },
	removeBtn: {
		position: "absolute" as const,
		top: -4,
		right: -4,
		width: 16,
		height: 16,
		borderRadius: "50%",
		background: "var(--destructive)",
		color: "var(--destructive-foreground)",
		border: "none",
		cursor: "pointer",
		fontSize: 10,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		lineHeight: 1,
	},
	queueItem: (status: ItemStatus): React.CSSProperties => ({
		display: "flex",
		alignItems: "flex-start",
		gap: 8,
		padding: "8px 10px",
		borderRadius: 7,
		border: `1px solid ${status === "done" ? "var(--border)" : status === "error" ? "color-mix(in srgb, var(--destructive) 26%, var(--border))" : status === "generating" ? "var(--border)" : "var(--border)"}`,
		background:
			status === "error"
				? "color-mix(in srgb, var(--destructive) 8%, var(--background))"
				: "var(--accent)",
		marginBottom: 6,
	}),
	statusDot: (status: ItemStatus): React.CSSProperties => ({
		width: 8,
		height: 8,
		borderRadius: "50%",
		flexShrink: 0,
		marginTop: 4,
		background:
			status === "done"
				? "var(--foreground)"
				: status === "error"
					? "var(--destructive)"
					: status === "generating"
						? "var(--ring)"
						: "var(--muted)",
	}),
	thumb: {
		width: 52,
		height: 52,
		objectFit: "cover" as const,
		borderRadius: 5,
		flexShrink: 0,
	},
	error: {
		background: "color-mix(in srgb, var(--destructive) 8%, var(--background))",
		color: "var(--destructive)",
		borderRadius: 6,
		padding: "7px 9px",
		fontSize: 11,
		border:
			"1px solid color-mix(in srgb, var(--destructive) 26%, var(--border))",
	},
	info: {
		background: "var(--accent)",
		color: "var(--foreground)",
		borderRadius: 6,
		padding: "7px 9px",
		fontSize: 11,
		border: "1px solid var(--border)",
	},
	toolbar: {
		position: "sticky" as const,
		bottom: 0,
		padding: "8px 14px",
		background: "var(--card)",
		borderTop: "1px solid var(--border)",
		display: "flex",
		gap: 6,
		zIndex: 10,
	},
	spinner: {
		display: "inline-block",
		width: 13,
		height: 13,
		border: "2px solid color-mix(in srgb, currentColor 35%, transparent)",
		borderTopColor: "currentColor",
		borderRadius: "50%",
		animation: "opencut-extension-spin 0.7s linear infinite",
	},
	counter: {
		fontSize: 11,
		color: "var(--muted-foreground)",
		textAlign: "right" as const,
		marginTop: 2,
	},
	gdocStatus: (ok: boolean | null): React.CSSProperties => ({
		fontSize: 11,
		marginTop: 3,
		color:
			ok === null
				? "var(--muted-foreground)"
				: ok
					? "var(--foreground)"
					: "var(--destructive)",
		fontWeight: 500,
	}),
	keyStatus: {
		fontSize: 11,
		color: "var(--muted-foreground)",
		fontWeight: 600,
		marginTop: 3,
	},
} as const;

// ─── App ──────────────────────────────────────────────────────────────────────

export function ImageBatcherView() {
	const addFiles = useAddExtensionMedia();

	// ─ Nav
	const [tab, setTab] = useState<Tab>("setup");

	// ─ API key
	const apiKey = useGeminiImageKey();
	const [keyInput, setKeyInput] = useState("");

	// ─ Style guide (Section A)
	const [guideMode, setGuideMode] = useState<GuideMode>("paste");
	const [guideText, setGuideText] = useState("");
	const [gdocUrl, setGdocUrl] = useState("");
	const [gdocFetching, setGdocFetching] = useState(false);
	const [gdocOk, setGdocOk] = useState<boolean | null>(null);
	const [gdocMsg, setGdocMsg] = useState("");
	const [guideDrag, setGuideDrag] = useState(false);

	// ─ Prompts (Section B)
	const [promptsMode, setPromptsMode] = useState<PromptsMode>("paste");
	const [promptsText, setPromptsText] = useState("");
	const [promptsDrag, setPromptsDrag] = useState(false);

	// ─ References (Section C & D)
	const [subjectRefs, setSubjectRefs] = useState<ImageAsset[]>([]);
	const [styleRefs, setStyleRefs] = useState<ImageAsset[]>([]);

	// ─ Settings (Section E)
	const [model, setModel] = useState(GEMINI_MODELS[0].id);
	const [aspectRatio, setAspectRatio] = useState("1:1");
	const [resolution, setResolution] = useState("1K");
	const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("Minimal");

	// ─ Queue
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [addingAll, setAddingAll] = useState(false);
	const [addAllMsg, setAddAllMsg] = useState("");
	const cancelRef = useRef(false);
	useEffect(
		() => () => {
			cancelRef.current = true;
		},
		[],
	);

	const subjectFileRef = useRef<HTMLInputElement>(null);
	const styleFileRef = useRef<HTMLInputElement>(null);
	const guideFileRef = useRef<HTMLInputElement>(null);
	const promptsFileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const k = readGeminiImageKey();
		setKeyInput(k);
		if (!k) setTab("settings");
	}, []);

	useEffect(() => setKeyInput(apiKey), [apiKey]);

	const saveKey = () => {
		const k = keyInput.trim();
		saveGeminiImageKey(k);
		if (k) setTab("setup");
	};

	const caps = modelCaps(model);
	const parsedPrompts = parsePrompts(promptsText);
	const effectiveGuide = guideText;
	const doneItems = queue.filter((q) => q.status === "done");

	// ─ File loaders ───────────────────────────────────────────────────────────

	const loadGuideFile = async (file: File) => {
		if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
			alert("Please upload a .txt file");
			return;
		}
		const text = await readFileText(file);
		setGuideText(text);
		setGuideMode("file");
	};

	const loadPromptsFile = async (file: File) => {
		if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
			alert("Please upload a .txt file");
			return;
		}
		const text = await readFileText(file);
		setPromptsText(text);
		setPromptsMode("file");
	};

	const addImages = async (
		files: FileList | null,
		setter: React.Dispatch<React.SetStateAction<ImageAsset[]>>,
	) => {
		if (!files) return;
		const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
		const loaded = await Promise.all(valid.map(readFileDataUrl));
		setter((prev) => [...prev, ...loaded].slice(0, MAX_REFS));
	};

	const fetchDoc = async () => {
		if (!gdocUrl.trim()) return;
		setGdocFetching(true);
		setGdocOk(null);
		setGdocMsg("Fetching…");
		try {
			const text = await fetchGoogleDoc(gdocUrl);
			setGuideText(text);
			setGdocOk(true);
			const words = text.split(/\s+/).filter(Boolean).length;
			setGdocMsg(`✓ Fetched — ${words} words`);
		} catch (e) {
			console.error("GDoc fetch error:", e);
			setGdocOk(false);
			setGdocMsg("Failed to fetch document. Check the URL and try again.");
		} finally {
			setGdocFetching(false);
		}
	};

	// ─ Build Gemini request input (Interactions API items) ────────────────────

	const buildParts = useCallback(
		(prompt: string) => {
			const parts: Record<string, unknown>[] = [];
			const image = (ref: ImageAsset) => ({
				type: "image",
				mime_type: ref.mimeType,
				data: ref.dataUrl.split(",")[1],
			});

			if (effectiveGuide.trim()) {
				parts.push({
					type: "text",
					text: `Style guide / instructions:\n${effectiveGuide.trim()}\n\n`,
				});
			}

			for (const ref of subjectRefs) parts.push(image(ref));

			if (styleRefs.length > 0) {
				parts.push({ type: "text", text: "Style references:" });
				for (const ref of styleRefs) parts.push(image(ref));
			}

			parts.push({ type: "text", text: prompt });
			return parts;
		},
		[effectiveGuide, subjectRefs, styleRefs],
	);

	// ─ Generate single image ──────────────────────────────────────────────────

	const generateOne = async (
		prompt: string,
	): Promise<{ dataUrl: string; mimeType: string }> => {
		const responseFormat: Record<string, string> = {
			type: "image",
			mime_type: "image/png",
			aspect_ratio: aspectRatio,
		};
		if (caps.sizes.length) responseFormat.image_size = resolution;

		const body: Record<string, unknown> = {
			model,
			input: buildParts(prompt),
			response_format: responseFormat,
		};
		if (caps.thinking.length)
			body.generation_config = { thinking_level: thinkingLevel.toLowerCase() };

		return requestGeminiImage(apiKey, body);
	};

	// ─ Generate all ───────────────────────────────────────────────────────────

	const generateAll = async () => {
		if (isRunning) return;
		if (!apiKey) {
			setTab("settings");
			return;
		}
		const prompts = parsedPrompts;
		if (!prompts.length) return;

		cancelRef.current = false;
		const initial: QueueItem[] = prompts.map((p, i) => ({
			id: i,
			prompt: p,
			status: "waiting",
		}));
		setQueue(initial);
		setIsRunning(true);
		setAddAllMsg("");
		setTab("queue");

		for (let i = 0; i < initial.length; i++) {
			if (cancelRef.current) break;

			setQueue((prev) =>
				prev.map((item) =>
					item.id === i ? { ...item, status: "generating" } : item,
				),
			);

			try {
				const { dataUrl, mimeType } = await generateOne(initial[i].prompt);
				setQueue((prev) =>
					prev.map((item) =>
						item.id === i
							? { ...item, status: "done", imageDataUrl: dataUrl, mimeType }
							: item,
					),
				);
			} catch (err) {
				console.error("Batch item generation error:", err);
				setQueue((prev) =>
					prev.map((item) =>
						item.id === i
							? {
									...item,
									status: "error",
									error: "Generation failed — check API key or prompt.",
								}
							: item,
					),
				);
			}

			if (i < initial.length - 1 && !cancelRef.current) await sleep(DELAY_MS);
		}

		setIsRunning(false);
	};

	const stopGeneration = () => {
		cancelRef.current = true;
	};

	const addImagesToTimeline = async (items: QueueItem[]) => {
		if (addingAll) return;
		setAddingAll(true);
		setAddAllMsg("");
		try {
			await addFiles(
				items.map((item) => {
					if (!item.imageDataUrl)
						throw new Error("An image is missing from the batch.");
					return extensionImageFile(
						item.imageDataUrl,
						`batch-image-${item.id + 1}`,
					);
				}),
			);
			setAddAllMsg(
				`✓ Added ${items.length} ${items.length === 1 ? "image" : "images"} to the timeline`,
			);
		} catch (error) {
			setAddAllMsg(
				error instanceof Error ? error.message : "Failed to add images.",
			);
		} finally {
			setAddingAll(false);
		}
	};

	// ─ Download ZIP ───────────────────────────────────────────────────────────

	const downloadZip = async () => {
		if (!doneItems.length) return;
		const { default: JSZip } = await import("jszip");
		const zip = new JSZip();
		doneItems.forEach((item, i) => {
			if (!item.imageDataUrl) return;
			const b64 = item.imageDataUrl.split(",")[1];
			const ext =
				item.mimeType === "image/jpeg"
					? "jpg"
					: item.mimeType === "image/webp"
						? "webp"
						: "png";
			const name = `${String(i + 1).padStart(3, "0")}-${item.prompt.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.${ext}`;
			zip.file(name, b64, { base64: true });
		});
		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `gemini-batch-${Date.now()}.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// ─ Drag helpers ───────────────────────────────────────────────────────────

	const makeDragProps = (
		onFile: (file: File) => void,
		setDrag: (v: boolean) => void,
	) => ({
		onDragOver: (e: React.DragEvent) => {
			e.preventDefault();
			setDrag(true);
		},
		onDragLeave: () => setDrag(false),
		onDrop: (e: React.DragEvent) => {
			e.preventDefault();
			setDrag(false);
			const file = e.dataTransfer.files[0];
			if (file) onFile(file);
		},
		onClick: () => {},
	});

	// ─ Render ─────────────────────────────────────────────────────────────────

	const canGenerate = !!apiKey && parsedPrompts.length > 0 && !isRunning;

	return (
		<PanelView
			title="Image Batcher"
			className="opencut-extension opencut-image-batcher"
			scrollClassName="overscroll-contain"
			contentClassName="flex min-h-full flex-col px-0"
		>
			<nav
				aria-label="Image Batcher views"
				className="flex flex-wrap gap-1 border-b px-3 pb-2"
			>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "setup"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("setup")}
				>
					Setup
				</Button>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "queue"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("queue")}
				>
					Queue {queue.length > 0 && `(${doneItems.length}/${queue.length})`}
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
				{/* ══════════════════════════════════════════════
            SETTINGS TAB
        ══════════════════════════════════════════════ */}
				{tab === "settings" && (
					<>
						<div>
							<label htmlFor="image-batcher-gemini-api-key" style={s.label}>
								Gemini API Key
							</label>
							<input
								id="image-batcher-gemini-api-key"
								type="password"
								aria-label="Gemini API key"
								autoComplete="off"
								style={s.input}
								placeholder="AIza…"
								value={keyInput}
								onChange={(e) => setKeyInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && saveKey()}
							/>
							<div style={s.keyStatus}>
								{apiKey ? "✓ Key saved" : "No key saved"}
							</div>
						</div>
						<Button
							variant="default"
							className="w-full whitespace-normal"
							onClick={saveKey}
							disabled={!keyInput.trim()}
						>
							Save Key
						</Button>
						<div
							style={{
								fontSize: 11,
								color: "var(--muted-foreground)",
								lineHeight: 1.7,
							}}
						>
							Get a key at{" "}
							<a
								href="https://aistudio.google.com/apikey"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "var(--foreground)" }}
							>
								aistudio.google.com/apikey
							</a>
							<br />
							Same key as Gemini ImageGen app.
						</div>
					</>
				)}

				{/* ══════════════════════════════════════════════
            SETUP TAB
        ══════════════════════════════════════════════ */}
				{tab === "setup" && (
					<>
						{/* ── A: Style Guide ── */}
						<div style={s.section}>
							<div style={s.sectionTitle}>
								A · Style Guide{" "}
								<span
									style={{
										fontWeight: 400,
										textTransform: "none" as const,
										color: "var(--muted-foreground)",
									}}
								>
									optional
								</span>
							</div>

							{/* Presets */}
							<select
								style={{
									...s.select,
									color: guideText
										? "var(--foreground)"
										: "var(--muted-foreground)",
								}}
								value=""
								onChange={(e) => {
									const preset = GUIDE_PRESETS.find(
										(p) => p.id === e.target.value,
									);
									if (preset) {
										setGuideText(preset.text);
										setGuideMode("paste");
									}
								}}
							>
								<option value="" disabled>
									Load a preset…
								</option>
								{GUIDE_PRESETS.map((p) => (
									<option key={p.id} value={p.id}>
										{p.label}
									</option>
								))}
							</select>

							<div style={s.segmented}>
								<button
									type="button"
									style={s.seg(guideMode === "paste")}
									onClick={() => setGuideMode("paste")}
								>
									Paste Text
								</button>
								<button
									type="button"
									style={s.seg(guideMode === "file")}
									onClick={() => setGuideMode("file")}
								>
									Upload File
								</button>
								<button
									type="button"
									style={s.seg(guideMode === "gdoc")}
									onClick={() => setGuideMode("gdoc")}
								>
									Google Doc
								</button>
							</div>

							{guideMode === "paste" && (
								<textarea
									style={{ ...s.textarea, minHeight: 70 }}
									placeholder="Describe your visual style, colour palette, mood…"
									value={guideText}
									onChange={(e) => setGuideText(e.target.value)}
								/>
							)}

							{guideMode === "file" && (
								<>
									<button
										type="button"
										aria-label="Choose a style guide file"
										style={s.dropzone(guideDrag)}
										{...makeDragProps(loadGuideFile, setGuideDrag)}
										onClick={() => guideFileRef.current?.click()}
									>
										{guideText
											? `✓ File loaded (${guideText.split(/\s+/).length} words)`
											: "Drop a .txt file here or click to browse"}
									</button>
									<input
										ref={guideFileRef}
										type="file"
										accept=".txt,text/plain"
										style={{ display: "none" }}
										onChange={(e) =>
											e.target.files?.[0] && loadGuideFile(e.target.files[0])
										}
									/>
								</>
							)}

							{guideMode === "gdoc" && (
								<>
									<div style={{ display: "flex", gap: 6 }}>
										<input
											type="url"
											style={{ ...s.input, flex: 1 }}
											placeholder="https://docs.google.com/document/d/…"
											value={gdocUrl}
											onChange={(e) => {
												setGdocUrl(e.target.value);
												setGdocOk(null);
												setGdocMsg("");
											}}
										/>
										<Button
											variant="outline"
											size="sm"
											style={{ flexShrink: 0 }}
											onClick={fetchDoc}
											disabled={gdocFetching || !gdocUrl.trim()}
										>
											{gdocFetching ? (
												<span
													style={{
														...s.spinner,
														borderTopColor: "var(--foreground)",
													}}
												/>
											) : (
												"Fetch"
											)}
										</Button>
									</div>
									{gdocMsg && <div style={s.gdocStatus(gdocOk)}>{gdocMsg}</div>}
									<div
										style={{ fontSize: 10, color: "var(--muted-foreground)" }}
									>
										Doc must be shared as "Anyone with the link can view"
									</div>
								</>
							)}
						</div>

						{/* ── B: Prompts ── */}
						<div style={s.section}>
							<div style={s.sectionTitle}>B · Illustration Prompts</div>
							<div style={s.segmented}>
								<button
									type="button"
									style={s.seg(promptsMode === "paste")}
									onClick={() => setPromptsMode("paste")}
								>
									Paste List
								</button>
								<button
									type="button"
									style={s.seg(promptsMode === "file")}
									onClick={() => setPromptsMode("file")}
								>
									Upload File
								</button>
							</div>

							{promptsMode === "paste" && (
								<textarea
									style={s.textarea}
									aria-label="Batch prompts"
									placeholder={
										"One prompt per line. Numbers optional:\n1. A fox in a forest\n2. A rabbit on a hill"
									}
									value={promptsText}
									onChange={(e) => setPromptsText(e.target.value)}
								/>
							)}

							{promptsMode === "file" && (
								<>
									<button
										type="button"
										aria-label="Choose a prompts file"
										style={s.dropzone(promptsDrag)}
										{...makeDragProps(loadPromptsFile, setPromptsDrag)}
										onClick={() => promptsFileRef.current?.click()}
									>
										{promptsText
											? `✓ File loaded — ${parsedPrompts.length} prompt${parsedPrompts.length !== 1 ? "s" : ""} detected`
											: "Drop a .txt file here or click to browse"}
									</button>
									<input
										ref={promptsFileRef}
										type="file"
										accept=".txt,text/plain"
										style={{ display: "none" }}
										onChange={(e) =>
											e.target.files?.[0] && loadPromptsFile(e.target.files[0])
										}
									/>
								</>
							)}

							<div style={s.counter}>
								{parsedPrompts.length > 0 ? (
									<span style={{ color: "var(--foreground)", fontWeight: 600 }}>
										{parsedPrompts.length} prompt
										{parsedPrompts.length !== 1 ? "s" : ""} detected
									</span>
								) : (
									"0 prompts"
								)}
							</div>
						</div>

						{/* ── C: Subject References ── */}
						<div style={s.section}>
							<div style={s.sectionTitle}>
								C · Subject References{" "}
								<span
									style={{
										fontWeight: 400,
										textTransform: "none" as const,
										color: "var(--muted-foreground)",
									}}
								>
									up to {MAX_REFS}
								</span>
							</div>
							<div style={s.imgGrid}>
								{subjectRefs.map((ref, i) => (
									<div key={ref.id} style={s.imgWrap}>
										<img src={ref.dataUrl} alt={ref.name} style={s.imgThumb} />
										<button
											type="button"
											aria-label={`Remove ${ref.name}`}
											style={s.removeBtn}
											onClick={() =>
												setSubjectRefs((p) => p.filter((_, j) => j !== i))
											}
										>
											×
										</button>
									</div>
								))}
								{subjectRefs.length < MAX_REFS && (
									<button
										type="button"
										aria-label="Add subject reference images"
										style={{
											...s.dropzone(false),
											width: 64,
											height: 64,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexDirection: "column",
											gap: 2,
											cursor: "pointer",
										}}
										onClick={() => subjectFileRef.current?.click()}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => {
											e.preventDefault();
											addImages(e.dataTransfer.files, setSubjectRefs);
										}}
									>
										<span
											style={{ fontSize: 18, color: "var(--muted-foreground)" }}
										>
											+
										</span>
									</button>
								)}
							</div>
							<input
								ref={subjectFileRef}
								type="file"
								accept="image/*"
								multiple
								style={{ display: "none" }}
								onChange={(e) => addImages(e.target.files, setSubjectRefs)}
							/>
						</div>

						{/* ── D: Style References ── */}
						<div style={s.section}>
							<div style={s.sectionTitle}>
								D · Style References{" "}
								<span
									style={{
										fontWeight: 400,
										textTransform: "none" as const,
										color: "var(--muted-foreground)",
									}}
								>
									up to {MAX_REFS}
								</span>
							</div>
							<div style={s.imgGrid}>
								{styleRefs.map((ref, i) => (
									<div key={ref.id} style={s.imgWrap}>
										<img src={ref.dataUrl} alt={ref.name} style={s.imgThumb} />
										<button
											type="button"
											aria-label={`Remove ${ref.name}`}
											style={s.removeBtn}
											onClick={() =>
												setStyleRefs((p) => p.filter((_, j) => j !== i))
											}
										>
											×
										</button>
									</div>
								))}
								{styleRefs.length < MAX_REFS && (
									<button
										type="button"
										aria-label="Add style reference images"
										style={{
											...s.dropzone(false),
											width: 64,
											height: 64,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexDirection: "column",
											gap: 2,
											cursor: "pointer",
										}}
										onClick={() => styleFileRef.current?.click()}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => {
											e.preventDefault();
											addImages(e.dataTransfer.files, setStyleRefs);
										}}
									>
										<span
											style={{ fontSize: 18, color: "var(--muted-foreground)" }}
										>
											+
										</span>
									</button>
								)}
							</div>
							<input
								ref={styleFileRef}
								type="file"
								accept="image/*"
								multiple
								style={{ display: "none" }}
								onChange={(e) => addImages(e.target.files, setStyleRefs)}
							/>
						</div>

						{/* ── E: Settings ── */}
						<div style={s.section}>
							<div style={s.sectionTitle}>E · Generation Settings</div>

							<div>
								<label htmlFor="image-batcher-model" style={s.label}>
									Model
								</label>
								<select
									id="image-batcher-model"
									aria-label="Model"
									style={s.select}
									value={model}
									onChange={(e) => {
										const m = e.target.value;
										setModel(m);
										setThinkingLevel("Minimal");
										if (!modelCaps(m).sizes.includes(resolution))
											setResolution("1K");
									}}
								>
									{GEMINI_MODELS.map((m) => (
										<option key={m.id} value={m.id}>
											{m.label}
										</option>
									))}
								</select>
							</div>

							<div style={s.row2}>
								<div>
									<label htmlFor="image-batcher-aspect-ratio" style={s.label}>
										Aspect Ratio
									</label>
									<select
										id="image-batcher-aspect-ratio"
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
										<label htmlFor="image-batcher-resolution" style={s.label}>
											Resolution
										</label>
										<select
											id="image-batcher-resolution"
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

							{caps.thinking.length > 0 && (
								<div>
									<label htmlFor="image-batcher-thinking-level" style={s.label}>
										Thinking Level
									</label>
									<select
										id="image-batcher-thinking-level"
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
						</div>
					</>
				)}

				{/* ══════════════════════════════════════════════
            QUEUE TAB
        ══════════════════════════════════════════════ */}
				{tab === "queue" && (
					<>
						{queue.length === 0 && (
							<div style={s.info}>
								No queue yet. Set up prompts in the Setup tab and hit Generate
								All.
							</div>
						)}

						{queue.map((item) => (
							<div key={item.id} style={s.queueItem(item.status)}>
								{/* Status indicator */}
								{item.status === "generating" ? (
									<span
										style={{
											...s.statusDot(item.status),
											animation:
												"opencut-extension-pulse 1s ease-in-out infinite",
										}}
									/>
								) : (
									<span style={s.statusDot(item.status)} />
								)}

								{/* Thumbnail or placeholder */}
								{item.imageDataUrl ? (
									<img src={item.imageDataUrl} alt="" style={s.thumb} />
								) : (
									<div
										style={{
											...s.thumb,
											background: "var(--accent)",
											borderRadius: 5,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 10,
											color: "var(--muted-foreground)",
										}}
									>
										{item.status === "generating"
											? "…"
											: item.status === "error"
												? "✕"
												: "○"}
									</div>
								)}

								{/* Text + actions */}
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											fontSize: 11,
											color: "var(--muted-foreground)",
											lineHeight: 1.4,
											marginBottom: 4,
											wordBreak: "break-word" as const,
										}}
									>
										{item.prompt.length > 80
											? item.prompt.slice(0, 80) + "…"
											: item.prompt}
									</div>
									{item.error && (
										<div style={{ fontSize: 10, color: "var(--destructive)" }}>
											{item.error}
										</div>
									)}
									{item.status === "done" && (
										<Button
											variant="outline"
											size="sm"
											style={{
												fontSize: 10,
												padding: "3px 7px",
											}}
											onClick={() => addImagesToTimeline([item])}
											disabled={addingAll}
										>
											Add to timeline
										</Button>
									)}
								</div>
							</div>
						))}

						{addAllMsg && (
							<div
								role="status"
								style={addAllMsg.startsWith("✓") ? s.info : s.error}
							>
								{addAllMsg}
							</div>
						)}

						{/* Batch actions */}
						{doneItems.length > 0 && !isRunning && (
							<>
								<div style={{ display: "flex", gap: 8 }}>
									<Button
										variant="default"
										className="min-w-0 whitespace-normal"
										style={{ flex: 1 }}
										onClick={() => addImagesToTimeline(doneItems)}
										disabled={addingAll}
									>
										{addingAll ? (
											<>
												<span style={s.spinner} /> Adding…
											</>
										) : (
											`Add All ${doneItems.length} to timeline`
										)}
									</Button>
									<Button variant="outline" size="sm" onClick={downloadZip}>
										ZIP
									</Button>
								</div>
							</>
						)}
					</>
				)}
			</div>

			{/* ── Bottom toolbar ── */}
			<div style={s.toolbar}>
				{isRunning ? (
					<>
						<div
							style={{
								flex: 1,
								fontSize: 12,
								color: "var(--muted-foreground)",
								display: "flex",
								alignItems: "center",
								gap: 6,
							}}
						>
							<span style={s.spinner} />
							Generating{" "}
							{
								queue.filter((q) => q.status === "done" || q.status === "error")
									.length
							}{" "}
							/ {queue.length}…
						</div>
						<Button
							variant="destructive-foreground"
							size="sm"
							style={{ padding: "7px 14px" }}
							onClick={stopGeneration}
						>
							Stop
						</Button>
					</>
				) : (
					<Button
						variant="default"
						className="min-w-0 whitespace-normal"
						style={{ flex: 1 }}
						onClick={generateAll}
						disabled={!canGenerate}
					>
						{!apiKey
							? "Add API key in Settings"
							: parsedPrompts.length === 0
								? "Add prompts in Setup"
								: `Generate All  (${parsedPrompts.length} image${parsedPrompts.length !== 1 ? "s" : ""})`}
					</Button>
				)}
			</div>
		</PanelView>
	);
}
