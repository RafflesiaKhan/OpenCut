"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/editor/use-editor";
import {
	directorBrandSchema,
	directorReplySchema,
	type DirectorBrand,
	type DirectorProject,
	type DirectorReply,
} from "./contract";
import {
	directorModelPrice,
	directorModels,
	directorProviders,
} from "./models";
import { OpenArtConnector } from "./openart-connector";
import { readDirectorProject, sceneTracks } from "./project-context";

type Brand = DirectorBrand & { id: string };
type Turn = {
	id: string;
	question: string;
	answer: string;
	sceneId: string;
	clips: DirectorProject["clips"];
	model: string;
	usage: DirectorReply["usage"];
};
const modelStorageKey = "opencut-director-model";
const brandStorageKey = "opencut-director-brands";
const emptyBrand = { channel: "", series: "", notes: "" };
const brandSchema = directorBrandSchema.extend({
	id: directorBrandSchema.shape.channel.min(1),
});

function readBrands(): Brand[] {
	try {
		const data: unknown = JSON.parse(
			localStorage.getItem(brandStorageKey) ?? "[]",
		);
		return Array.isArray(data)
			? data
					.flatMap((item) => {
						const parsed = brandSchema.safeParse(item);
						return parsed.success ? [parsed.data] : [];
					})
					.slice(0, 30)
			: [];
	} catch {
		return [];
	}
}

function timeLabel(seconds: number) {
	const tenths = Math.round(seconds * 10);
	const minute = Math.floor(tenths / 600);
	const second = ((tenths % 600) / 10).toFixed(1).padStart(4, "0");
	return `${minute}:${second}`;
}

export function DirectorPanel({
	projectId,
	onClose,
}: {
	projectId: string;
	onClose: () => void;
}) {
	const editor = useEditor();
	const projectName = useEditor(
		(core) => core.project.getActiveOrNull()?.metadata.name ?? "",
	);
	const selectionCount = useEditor(
		(core) => core.selection.getSelectedElements().length,
	);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [activeId, setActiveId] = useState("");
	const [draft, setDraft] = useState<DirectorBrand>(emptyBrand);
	const [model, setModel] = useState<(typeof directorModels)[number]>(
		directorModels[0],
	);
	const provider = directorProviders[model.provider];
	const [question, setQuestion] = useState("");
	const [turns, setTurns] = useState<Turn[]>([]);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState("");
	const pending = useRef<AbortController | null>(null);
	const threadEnd = useRef<HTMLDivElement>(null);
	const projectBrandKey = `opencut-director-brand:${projectId}`;
	const activeBrand = brands.find(({ id }) => id === activeId);

	useEffect(() => {
		try {
			const savedModel = localStorage.getItem(modelStorageKey);
			setModel(
				directorModels.find(({ id }) => id === savedModel) ?? directorModels[0],
			);
			const saved = readBrands();
			const selected = saved.find(
				({ id }) => id === localStorage.getItem(projectBrandKey),
			);
			setBrands(saved);
			setActiveId(selected?.id ?? "");
			setDraft(selected ?? emptyBrand);
		} catch {
			// Browser storage may be unavailable. A project can still ask questions without saved notes.
		}
		return () => pending.current?.abort();
	}, [projectBrandKey]);

	useEffect(() => {
		if (turns.length) threadEnd.current?.scrollIntoView({ block: "nearest" });
	}, [turns]);

	const chooseModel = (choice: (typeof directorModels)[number] | undefined) => {
		if (!choice) return;
		setModel(choice);
		setError("");
		try {
			localStorage.setItem(modelStorageKey, choice.id);
		} catch {
			// The selected model is still usable for the current session.
		}
	};

	const selectBrand = (id: string) => {
		try {
			localStorage.setItem(projectBrandKey, id);
			setActiveId(id);
			setDraft(brands.find((brand) => brand.id === id) ?? emptyBrand);
			setTurns([]);
			setError("");
		} catch {
			toast.error("Could not save the project’s Brand Kit selection.");
		}
	};

	const saveBrand = () => {
		const parsed = directorBrandSchema.safeParse(draft);
		if (!parsed.success || !parsed.data.channel || !parsed.data.series) {
			toast.error("Enter a channel and series name for the Brand Kit notes.");
			return;
		}
		try {
			const id = activeId || crypto.randomUUID();
			const otherBrands = readBrands().filter((brand) => brand.id !== id);
			if (otherBrands.length >= 30) {
				toast.error("This version can save up to 30 sets of Brand Kit notes.");
				return;
			}
			const brand = { id, ...parsed.data };
			const next = [...otherBrands, brand];
			localStorage.setItem(brandStorageKey, JSON.stringify(next));
			localStorage.setItem(projectBrandKey, id);
			setBrands(next);
			setActiveId(id);
			setDraft(parsed.data);
			setTurns([]);
			setError("");
			toast.success("Brand Kit notes saved for this series.");
		} catch {
			toast.error("Could not save Brand Kit notes in this browser.");
		}
	};

	const send = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = question.trim();
		if (!text || pending.current) return;
		const project = readDirectorProject(editor);
		const scene = editor.scenes.getActiveSceneOrNull();
		if (!project || !scene) return;
		const controller = new AbortController();
		pending.current = controller;
		setSending(true);
		setError("");
		try {
			const response = await fetch("/api/director", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					question: text,
					provider: model.provider,
					model: model.id,
					history: turns.slice(-6).map(({ question, answer }) => ({
						question,
						answer: answer.slice(0, 4000),
					})),
					brand: activeBrand ?? emptyBrand,
					project,
				}),
				signal: controller.signal,
			});
			const data = await response.json();
			if (!response.ok)
				throw new Error(
					typeof data.error === "string"
						? data.error
						: "Could not reach the Director.",
				);
			const reply = directorReplySchema.parse(data);
			const ids = new Set(reply.clipIds);
			if (!controller.signal.aborted) {
				const id = crypto.randomUUID();
				setTurns((previous) => [
					...previous,
					{
						id,
						question: text,
						answer: reply.answer,
						model: model.label,
						usage: reply.usage,
						sceneId: scene.id,
						clips: project.clips.filter(({ id }) => ids.has(id)),
					},
				]);
				setQuestion("");
			}
		} catch (cause) {
			if (!controller.signal.aborted)
				setError(
					cause instanceof Error
						? cause.message
						: "The Director request failed.",
				);
		} finally {
			pending.current = null;
			if (!controller.signal.aborted) setSending(false);
		}
	};

	const jump = (sceneId: string, clipId: string) => {
		const scene = editor.scenes.getActiveSceneOrNull();
		const clip =
			scene?.id === sceneId
				? sceneTracks(scene)
						.flatMap(
							(track) =>
								track.elements as readonly import("@/timeline/types").TimelineElement[],
						)
						.find(({ id }) => id === clipId)
				: undefined;
		if (!clip) {
			toast.error("That clip is no longer in the active scene.");
			return;
		}
		editor.playback.seek({ time: clip.startTime });
	};

	return (
		<section
			id="director-panel"
			aria-label="Director"
			className="panel bg-background flex h-full min-h-0 min-w-0 flex-col rounded-sm border"
		>
			<div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
				<h2 className="text-sm font-medium">Director</h2>
				<Button variant="ghost" size="sm" onClick={onClose}>
					Properties
				</Button>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-3 p-3">
					<p className="text-muted-foreground text-xs break-words">
						{projectName} ·{" "}
						{selectionCount ? `${selectionCount} selected` : "Active scene"}
						{activeBrand
							? ` · ${activeBrand.channel} / ${activeBrand.series}`
							: ""}
					</p>
					<details className="rounded-md border p-2">
						<summary className="cursor-pointer text-sm">
							Provider and model
						</summary>
						<fieldset
							disabled={sending}
							className="mt-2 flex min-w-0 flex-col gap-2"
						>
							<Label htmlFor="director-provider">Provider</Label>
							<select
								id="director-provider"
								className="bg-input w-full min-w-0 rounded-md border p-1.5 text-sm"
								value={model.provider}
								onChange={(event) =>
									chooseModel(
										directorModels.find(
											({ provider }) => provider === event.target.value,
										),
									)
								}
							>
								{Object.entries(directorProviders).map(([id, info]) => (
									<option key={id} value={id}>
										{info.label}
									</option>
								))}
							</select>
							<Label htmlFor="director-model">Model</Label>
							<select
								id="director-model"
								className="bg-input w-full min-w-0 rounded-md border p-1.5 text-sm"
								aria-describedby="director-model-rates"
								value={model.id}
								onChange={(event) =>
									chooseModel(
										directorModels.find(({ id }) => id === event.target.value),
									)
								}
							>
								{directorModels
									.filter(({ provider }) => provider === model.provider)
									.map((option) => (
										<option key={option.id} value={option.id}>
											{option.label} · {directorModelPrice(option)}
										</option>
									))}
							</select>
							<p
								id="director-model-rates"
								className="text-muted-foreground text-xs"
							>
								{model.hint}. Prices are USD per 1M input / output tokens at
								base rates. Usage varies by request.{" "}
								<a
									className="underline underline-offset-2"
									href={provider.pricing}
									target="_blank"
									rel="noreferrer"
								>
									Pricing
								</a>
							</p>
						</fieldset>
					</details>
					<OpenArtConnector projectId={projectId} />
					<details className="rounded-md border p-2">
						<summary className="cursor-pointer text-sm">
							Channel, series and Brand Kit
						</summary>
						<fieldset
							disabled={sending}
							className="mt-2 flex min-w-0 flex-col gap-2"
						>
							<Label htmlFor="director-brand">Saved series</Label>
							<select
								id="director-brand"
								className="bg-input w-full min-w-0 rounded-md border p-1.5 text-sm"
								value={activeId}
								onChange={(event) => selectBrand(event.target.value)}
							>
								<option value="">No kit / new series</option>
								{brands.map(({ id, channel, series }) => (
									<option value={id} key={id}>
										{channel} / {series}
									</option>
								))}
							</select>
							<Label htmlFor="director-channel">Channel</Label>
							<Input
								id="director-channel"
								value={draft.channel}
								maxLength={100}
								onChange={(event) =>
									setDraft({ ...draft, channel: event.target.value })
								}
							/>
							<Label htmlFor="director-series">Series</Label>
							<Input
								id="director-series"
								value={draft.series}
								maxLength={100}
								onChange={(event) =>
									setDraft({ ...draft, series: event.target.value })
								}
							/>
							<Label htmlFor="director-notes">
								Brand Kit and episode notes
							</Label>
							<Textarea
								id="director-notes"
								value={draft.notes}
								maxLength={4000}
								rows={4}
								placeholder="Audience, style, recurring characters, voices and past episodes…"
								onChange={(event) =>
									setDraft({ ...draft, notes: event.target.value })
								}
							/>
							<Button variant="outline" size="sm" onClick={saveBrand}>
								Save and use
							</Button>
						</fieldset>
					</details>
					{turns.length === 0 && (
						<div className="flex flex-wrap gap-1.5">
							{[
								"What would you change here?",
								"Pitch the next episode.",
								"Outline a short script.",
							].map((prompt) => (
								<Button
									key={prompt}
									variant="outline"
									size="sm"
									disabled={sending}
									onClick={() => setQuestion(prompt)}
									className="h-auto min-h-7 whitespace-normal text-left"
								>
									{prompt}
								</Button>
							))}
						</div>
					)}
					<div className="flex flex-col gap-3" aria-live="polite">
						{turns.map((turn) => (
							<article key={turn.id} className="flex flex-col gap-2 text-sm">
								<p className="bg-accent rounded-md p-2 font-medium break-words">
									{turn.question}
								</p>
								<p className="whitespace-pre-wrap break-words">{turn.answer}</p>
								<p className="text-muted-foreground text-xs">
									{turn.model}
									{turn.usage
										? ` · ${turn.usage.input_tokens.toLocaleString()} in / ${turn.usage.output_tokens.toLocaleString()} out tokens`
										: ""}
								</p>
								<div className="flex flex-wrap gap-1">
									{turn.clips.map((clip) => (
										<Button
											key={clip.id}
											variant="outline"
											size="sm"
											onClick={() => jump(turn.sceneId, clip.id)}
											className="max-w-full justify-start"
											title={clip.name}
										>
											{timeLabel(clip.start)}{" "}
											<span className="truncate">{clip.name}</span>
										</Button>
									))}
								</div>
							</article>
						))}
					</div>
					<div ref={threadEnd} />
				</div>
			</ScrollArea>
			<form
				className="flex shrink-0 flex-col gap-2 border-t p-2"
				onSubmit={send}
			>
				{error && (
					<p role="alert" className="text-destructive text-xs break-words">
						{error}
					</p>
				)}
				<Label htmlFor="director-question" className="sr-only">
					Ask the Director
				</Label>
				<Textarea
					id="director-question"
					rows={2}
					maxLength={2000}
					disabled={sending}
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
					placeholder="Ask about your project…"
				/>
				<Button type="submit" disabled={!question.trim() || sending}>
					{sending ? "Thinking…" : "Ask Director"}
				</Button>
				<p className="text-muted-foreground text-xs">
					Sending shares your question, recent conversation, selected notes, and
					scene metadata with {provider.label}.
				</p>
			</form>
		</section>
	);
}
