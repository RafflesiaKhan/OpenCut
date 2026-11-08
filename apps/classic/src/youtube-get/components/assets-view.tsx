"use client";

import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { Button } from "@/components/ui/button";

import { useAddExtensionMedia } from "@/media/use-add-extension-media";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "info" | "download" | "settings";

interface VideoMeta {
	id: string;
	title: string;
	channel: string;
	thumbnail: string;
	duration: string;
	views: string;
	uploadDate: string;
	description: string;
	tags: string[];
	likes: string;
	isPartial: boolean; // true when fetched without API key (oEmbed only)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "youtube_get_google_api_key";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(input: string): string | null {
	const trimmed = input.trim();
	const patterns = [
		/[?&]v=([a-zA-Z0-9_-]{11})/,
		/youtu\.be\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
		/^([a-zA-Z0-9_-]{11})$/,
	];
	for (const re of patterns) {
		const m = trimmed.match(re);
		if (m) return m[1];
	}
	return null;
}

function fmtDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0)
		return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtViews(n: number): string {
	if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B views`;
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
	return `${n} views`;
}

function fmtNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}

function fmtDate(iso: string): string {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return iso;
	}
}

// ─── Data Fetchers ────────────────────────────────────────────────────────────

// Public oEmbed is fetched server-side so browser CORS cannot block it.
async function fetchMetaOembed(videoId: string): Promise<VideoMeta> {
	const url = `/api/extension-resource?kind=youtube&id=${videoId}`;
	const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
	if (!res.ok)
		throw new Error(
			`oEmbed HTTP ${res.status} — video may be private or unavailable`,
		);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const d = (await res.json()) as any;
	return {
		id: videoId,
		title: d.title ?? "Unknown",
		channel: d.author_name ?? "Unknown",
		// ytimg gives reliable thumbnails without API
		thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
		duration: "",
		views: "",
		uploadDate: "",
		description: "",
		tags: [],
		likes: "",
		isPartial: true,
	};
}

// Full metadata — YouTube Data API v3, requires Google API key
async function fetchMetaYouTubeAPI(
	videoId: string,
	apiKey: string,
): Promise<VideoMeta> {
	const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`;
	const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (await res.json()) as any;
	if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
	const item = data.items?.[0];
	if (!item) throw new Error("Video not found or API key lacks access");
	const { snippet, statistics, contentDetails } = item;

	// Parse ISO 8601 duration: PT1H2M3S
	const dur = (contentDetails.duration ?? "") as string;
	const dm = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	const durSecs =
		parseInt(dm?.[1] ?? "0") * 3600 +
		parseInt(dm?.[2] ?? "0") * 60 +
		parseInt(dm?.[3] ?? "0");

	const thumb =
		snippet.thumbnails?.maxres?.url ??
		snippet.thumbnails?.high?.url ??
		`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

	return {
		id: videoId,
		title: snippet.title,
		channel: snippet.channelTitle,
		thumbnail: thumb,
		duration: fmtDuration(durSecs),
		views: fmtViews(parseInt(statistics.viewCount ?? "0")),
		uploadDate: fmtDate(snippet.publishedAt),
		description: snippet.description ?? "",
		tags: snippet.tags ?? [],
		likes: fmtNumber(parseInt(statistics.likeCount ?? "0")),
		isPartial: false,
	};
}

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
	input: {
		width: "100%",
		background: "var(--input)",
		padding: "8px 10px",
		borderRadius: 6,
		border: "1px solid var(--border)",
		fontSize: 13,
		color: "var(--foreground)",

		fontFamily: "inherit",
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
	info: {
		background: "var(--accent)",
		color: "var(--foreground)",
		borderRadius: 6,
		padding: "8px 10px",
		fontSize: 11,
		border: "1px solid var(--border)",
		lineHeight: 1.65,
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
	metaRow: {
		display: "flex",
		gap: 6,
		alignItems: "center",
		fontSize: 12,
		color: "var(--muted-foreground)",
		flexWrap: "wrap" as const,
	},
	dot: { color: "var(--muted-foreground)", fontSize: 10 },
	tag: {
		display: "inline-block",
		fontSize: 10,
		background: "var(--border)",
		color: "var(--muted-foreground)",
		borderRadius: 4,
		padding: "2px 7px",
		marginRight: 4,
		marginBottom: 4,
	},
	cmdBox: {
		background: "var(--input)",
		color: "var(--foreground)",
		borderRadius: 6,
		padding: "10px 12px",
		fontSize: 12,
		fontFamily: "monospace",
		lineHeight: 1.6,
		wordBreak: "break-all" as const,
	},
	divider: { borderTop: "1px solid var(--border)", margin: "2px 0" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function YouTubeGetView() {
	const addFiles = useAddExtensionMedia();
	const [tab, setTab] = useState<Tab>("info");

	const [urlInput, setUrlInput] = useState("");
	const [videoId, setVideoId] = useState("");
	const [meta, setMeta] = useState<VideoMeta | null>(null);
	const [fetchingMeta, setFetchingMeta] = useState(false);
	const [metaError, setMetaError] = useState("");
	const [descExpanded, setDescExpanded] = useState(false);

	const [copied, setCopied] = useState(""); // key of the last copied item, for the ✓ feedback

	const [apiKey, setApiKey] = useState("");
	const [keyInput, setKeyInput] = useState("");
	const [addingThumbnail, setAddingThumbnail] = useState(false);
	const [thumbnailStatus, setThumbnailStatus] = useState("");

	useEffect(() => {
		const key = sessionStorage.getItem(STORAGE_KEY) ?? "";
		setApiKey(key);
		setKeyInput(key);
	}, []);

	const addThumbnail = async () => {
		if (!meta || addingThumbnail) return;
		setAddingThumbnail(true);
		setThumbnailStatus("");
		try {
			await addFiles(async () => {
				const response = await fetch(
					`/api/extension-resource?kind=thumbnail&id=${meta.id}`,
				);
				if (!response.ok)
					throw new Error("Could not fetch the YouTube thumbnail.");
				const blob = await response.blob();
				return [
					new File([blob], `youtube-${meta.id}.jpg`, { type: "image/jpeg" }),
				];
			});
			setThumbnailStatus("Thumbnail added to the timeline.");
		} catch (error) {
			setThumbnailStatus(
				error instanceof Error ? error.message : "Could not add the thumbnail.",
			);
		} finally {
			setAddingThumbnail(false);
		}
	};

	const saveKey = () => {
		const k = keyInput.trim();
		sessionStorage.setItem(STORAGE_KEY, k);
		setApiKey(k);
		if (k) setTab("info");
	};

	// ── Fetch metadata ─────────────────────────────────────────────────────────

	const fetchMeta = async () => {
		const id = extractVideoId(urlInput);
		if (fetchingMeta || addingThumbnail) return;
		if (!id) {
			setMetaError("Could not extract a YouTube video ID from that URL.");
			return;
		}

		setFetchingMeta(true);
		setMetaError("");
		setMeta(null);
		setThumbnailStatus("");
		setVideoId(id);
		setDescExpanded(false);

		try {
			let result: VideoMeta;
			if (apiKey) {
				try {
					result = await fetchMetaYouTubeAPI(id, apiKey);
				} catch {
					// YouTube API failed — fall back to oEmbed
					result = await fetchMetaOembed(id);
				}
			} else {
				result = await fetchMetaOembed(id);
			}
			setMeta(result);
		} catch (err: unknown) {
			setMetaError(err instanceof Error ? err.message : String(err));
		} finally {
			setFetchingMeta(false);
		}
	};

	// ── Clipboard ──────────────────────────────────────────────────────────────

	const copy = async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(key);
			setTimeout(() => setCopied(""), 2000);
		} catch {
			setMetaError("Could not copy. Select the text to copy it manually.");
		}
	};

	// ── Download commands (yt-dlp runs locally; no third-party services) ───────

	const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

	const commands = videoId
		? [
				{
					key: "audio",
					label: "Audio (MP3)",
					cmd: `yt-dlp -x --audio-format mp3 --audio-quality 192K -o "downloads/%(title)s.%(ext)s" "${ytUrl}"`,
				},
				{
					key: "video",
					label: "Video (MP4, 1080p)",
					cmd: `yt-dlp -f "bestvideo[height<=1080]+bestaudio/best" --merge-output-format mp4 -o "downloads/%(title)s.%(ext)s" "${ytUrl}"`,
				},
				{
					key: "captions",
					label: "Captions (SRT)",
					cmd: `yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "en.*" --convert-subs srt -o "downloads/%(title)s.%(ext)s" "${ytUrl}"`,
				},
			]
		: [];

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<PanelView
			title="YouTube Get"
			className="opencut-extension opencut-youtube-get"
			scrollClassName="overscroll-contain"
			contentClassName="flex min-h-full flex-col px-0"
		>
			<nav
				aria-label="YouTube Get views"
				className="flex flex-wrap gap-1 border-b px-3 pb-2"
			>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "info"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("info")}
				>
					Info
				</Button>
				<Button
					variant="ghost"
					size="sm"
					aria-pressed={tab === "download"}
					className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
					onClick={() => setTab("download")}
				>
					Download
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
				{/* URL bar — always visible except settings */}
				{tab !== "settings" && (
					<div style={{ display: "flex", gap: 8 }}>
						<input
							type="text"
							style={{ ...s.input, flex: 1 }}
							aria-label="YouTube URL or video ID"
							placeholder="Paste YouTube URL or video ID…"
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && fetchMeta()}
						/>
						<Button
							variant="default"
							className="min-w-0 whitespace-normal"
							style={{
								width: "auto",
								padding: "8px 14px",
								flexShrink: 0,
							}}
							onClick={fetchMeta}
							disabled={fetchingMeta || addingThumbnail || !urlInput.trim()}
						>
							{fetchingMeta ? <span style={s.spinner} /> : "Fetch"}
						</Button>
					</div>
				)}

				{metaError && (
					<div role="status" style={s.error}>
						{metaError}
					</div>
				)}
				{/* ══ INFO TAB ═══════════════════════════════════════════════════════ */}
				{tab === "info" && (
					<>
						{!meta && !fetchingMeta && !metaError && (
							<div
								style={{
									...s.info,
									textAlign: "center" as const,
									padding: "20px 10px",
								}}
							>
								Paste a YouTube link above and tap <strong>Fetch</strong>.
							</div>
						)}

						{meta && (
							<>
								{/* Thumbnail */}
								<div
									style={{
										borderRadius: 8,
										overflow: "hidden",
										position: "relative" as const,
									}}
								>
									<img
										src={meta.thumbnail}
										alt={meta.title}
										style={{
											width: "100%",
											display: "block",
											aspectRatio: "16/9",
											objectFit: "cover",
										}}
										onError={({ currentTarget }) => {
											const fallback = `https://i.ytimg.com/vi/${meta.id}/mqdefault.jpg`;
											if (currentTarget.src !== fallback)
												currentTarget.src = fallback;
										}}
									/>
									{meta.duration && (
										<div
											style={{
												position: "absolute",
												bottom: 8,
												right: 8,
												background: "rgba(0,0,0,0.75)",
												color: "white",
												fontSize: 12,
												fontWeight: 700,
												padding: "2px 6px",
												borderRadius: 4,
											}}
										>
											{meta.duration}
										</div>
									)}
								</div>

								<Button
									variant="default"
									className="w-full whitespace-normal"
									onClick={addThumbnail}
									disabled={addingThumbnail}
								>
									{addingThumbnail ? "Adding…" : "Add thumbnail to timeline"}
								</Button>
								{thumbnailStatus && <div role="status">{thumbnailStatus}</div>}

								{/* Title */}
								<div
									style={{
										fontWeight: 700,
										fontSize: 14,
										lineHeight: 1.4,
										color: "var(--foreground)",
									}}
								>
									{meta.title}
								</div>

								{/* Meta row */}
								<div style={s.metaRow}>
									<span style={{ fontWeight: 600, color: "var(--foreground)" }}>
										{meta.channel}
									</span>
									{meta.views && (
										<>
											<span style={s.dot}>•</span>
											<span>{meta.views}</span>
										</>
									)}
									{meta.uploadDate && (
										<>
											<span style={s.dot}>•</span>
											<span>{meta.uploadDate}</span>
										</>
									)}
									{meta.likes && (
										<>
											<span style={s.dot}>•</span>
											<span>{meta.likes} likes</span>
										</>
									)}
								</div>

								{/* Partial data notice */}
								{meta.isPartial && (
									<div style={s.info}>
										<strong>Limited info</strong> — add a YouTube Data API key
										in Settings for duration, views, upload date, description,
										and tags.
									</div>
								)}

								{meta.description && (
									<>
										<div style={s.divider} />
										<div>
											<span style={s.label}>Description</span>
											<div
												style={{
													fontSize: 12,
													lineHeight: 1.65,
													color: "var(--foreground)",
												}}
											>
												{descExpanded
													? meta.description
													: meta.description.slice(0, 220) +
														(meta.description.length > 220 ? "…" : "")}
											</div>
											{meta.description.length > 220 && (
												<Button
													variant="ghost"
													size="sm"
													style={{
														justifyContent: "flex-start",
														padding: "4px 0",
														fontSize: 11,
														marginTop: 2,
													}}
													onClick={() => setDescExpanded(!descExpanded)}
												>
													{descExpanded ? "Show less" : "Show more"}
												</Button>
											)}
										</div>
									</>
								)}

								{meta.tags.length > 0 && (
									<div>
										<span style={s.label}>Tags</span>
										<div style={{ display: "flex", flexWrap: "wrap" as const }}>
											{meta.tags.slice(0, 20).map((tag) => (
												<span key={tag} style={s.tag}>
													{tag}
												</span>
											))}
											{meta.tags.length > 20 && (
												<span
													style={{
														...s.tag,
														background: "transparent",
														color: "var(--muted-foreground)",
													}}
												>
													+{meta.tags.length - 20} more
												</span>
											)}
										</div>
									</div>
								)}

								<Button asChild variant="outline" className="w-full">
									<a href={ytUrl} target="_blank" rel="noopener noreferrer">
										Open on YouTube ↗
									</a>
								</Button>
							</>
						)}
					</>
				)}

				{/* ══ DOWNLOAD TAB ═══════════════════════════════════════════════════ */}
				{tab === "download" && (
					<>
						{!videoId ? (
							<div style={s.info}>Fetch a video from the Info tab first.</div>
						) : (
							<>
								{/* ── Video URL copy ── */}
								<div>
									<span style={s.label}>Video URL</span>
									<div
										style={{ display: "flex", gap: 8, alignItems: "center" }}
									>
										<div
											style={{
												...s.cmdBox,
												flex: 1,
												fontSize: 11,
												padding: "8px 10px",
											}}
										>
											{ytUrl}
										</div>
										<Button
											variant="outline"
											size="sm"
											style={{ flexShrink: 0 }}
											onClick={() => copy(ytUrl, "url")}
										>
											{copied === "url" ? "✓" : "Copy"}
										</Button>
									</div>
								</div>

								<div style={s.divider} />

								{/* ── yt-dlp commands ── */}
								{commands.map(({ key, label, cmd }) => (
									<div key={key}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												marginBottom: 4,
											}}
										>
											<span style={{ ...s.label, marginBottom: 0 }}>
												{label}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => copy(cmd, key)}
											>
												{copied === key ? "✓ Copied" : "Copy"}
											</Button>
										</div>
										<div style={{ ...s.cmdBox, fontSize: 11 }}>{cmd}</div>
									</div>
								))}

								<div style={s.info}>
									Run these in a terminal with <strong>yt-dlp</strong> installed
									(<code>brew install yt-dlp</code> or{" "}
									<code>pip install yt-dlp</code>; video/MP3 also need{" "}
									<code>ffmpeg</code>). YouTube no longer allows captions or
									media to be fetched from inside the browser, so downloads
									happen on your machine.
								</div>
							</>
						)}
					</>
				)}

				{/* ══ SETTINGS TAB ═══════════════════════════════════════════════════ */}
				{tab === "settings" && (
					<>
						<div>
							<label
								htmlFor="youtube-get-youtube-data-api-key-span-style-fontweight"
								style={s.label}
							>
								YouTube Data API Key{" "}
								<span
									style={{ fontWeight: 400, color: "var(--muted-foreground)" }}
								>
									(optional)
								</span>
							</label>
							<input
								id="youtube-get-youtube-data-api-key-span-style-fontweight"
								type="password"
								style={s.input}
								placeholder="AIza…"
								value={keyInput}
								onChange={(e) => setKeyInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && saveKey()}
							/>
							<div style={s.keyStatus}>
								{apiKey
									? "✓ Saved — full metadata via YouTube Data API v3"
									: "No key — basic metadata via YouTube oEmbed (free, no key needed)"}
							</div>
						</div>

						<Button
							variant="default"
							className="w-full whitespace-normal"
							onClick={saveKey}
						>
							{apiKey ? "Update Key" : "Save Key"}
						</Button>

						<div style={s.divider} />

						<div
							style={{
								fontSize: 11,
								color: "var(--muted-foreground)",
								lineHeight: 1.8,
							}}
						>
							<strong>Without key</strong> — uses YouTube oEmbed (official, no
							auth needed). Returns title, channel, and thumbnail only.
							<br />
							<br />
							<strong>With key</strong> — uses YouTube Data API v3 for full
							metadata: views, duration, upload date, description, tags, like
							count, max-res thumbnail.
							<br />
							<br />
							Get a free key at{" "}
							<a
								href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground underline underline-offset-2"
							>
								Google Cloud Console → YouTube Data API v3
							</a>
							. Free tier allows 10,000 units/day.
						</div>

						<div style={s.info}>
							Keys are stored only in browser session storage and sent only to
							Google's API endpoints.
						</div>
					</>
				)}
			</div>
		</PanelView>
	);
}
