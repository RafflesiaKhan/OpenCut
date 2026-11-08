"use client";

import { PauseIcon, PlayIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAddExtensionMedia } from "@/media/use-add-extension-media";
import {
	searchSfxKit,
	sfxAudioUrl,
	sfxCategories,
	sfxKitSource,
	type SfxSound,
} from "@/sfx-kit/catalogue";

export function SfxKitView() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("all");
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [addingId, setAddingId] = useState<string | null>(null);
	const previewRef = useRef<HTMLAudioElement | null>(null);
	const addFiles = useAddExtensionMedia();
	const sounds = searchSfxKit(query, category === "all" ? "" : category);

	useEffect(
		() => () => {
			const audio = previewRef.current;
			previewRef.current = null;
			audio?.pause();
		},
		[],
	);

	const stopPreview = () => {
		const audio = previewRef.current;
		previewRef.current = null;
		audio?.pause();
		setPlayingId(null);
	};

	const togglePreview = (sound: SfxSound) => {
		stopPreview();
		if (playingId === sound.id) return;

		const audio = new Audio(sfxAudioUrl(sound));
		const finish = (failed: boolean) => {
			if (previewRef.current !== audio) return;
			stopPreview();
			if (failed) toast.error("Could not play the SFX Kit preview.");
		};
		audio.onended = () => finish(false);
		audio.onerror = () => finish(true);
		previewRef.current = audio;
		setPlayingId(sound.id);
		void audio.play().catch(() => finish(true));
	};

	const addSound = async (sound: SfxSound) => {
		if (addingId) return;
		setAddingId(sound.id);
		try {
			await addFiles(async () => {
				const response = await fetch(sfxAudioUrl(sound), {
					signal: AbortSignal.timeout(15000),
				});
				if (!response.ok)
					throw new Error("Could not download the SFX Kit WAV.");
				const blob = await response.blob();
				return [new File([blob], `${sound.name}.wav`, { type: "audio/wav" })];
			});
			toast.success("Sound effect added to the timeline.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not add the sound effect.",
			);
		} finally {
			setAddingId(null);
		}
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="flex shrink-0 flex-col gap-2">
				<Input
					aria-label="Search SFX Kit"
					placeholder="Search SFX Kit"
					value={query}
					onChange={({ currentTarget }) => {
						stopPreview();
						setQuery(currentTarget.value);
					}}
				/>
				<Select
					value={category}
					onValueChange={(value) => {
						stopPreview();
						setCategory(value);
					}}
				>
					<SelectTrigger aria-label="SFX category" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All categories</SelectItem>
						{sfxCategories.map(({ id, title }) => (
							<SelectItem key={id} value={id}>
								{title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-2 text-xs">
					<span role="status">
						{sounds.length} {sounds.length === 1 ? "sound" : "sounds"}
					</span>
					<a
						className="hover:text-foreground underline underline-offset-2"
						href={sfxKitSource}
						target="_blank"
						rel="noreferrer"
					>
						Wyzowl · CC0
					</a>
				</div>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<ul className="flex flex-col gap-2" aria-label="SFX Kit sounds">
					{sounds.map((sound) => (
						<li className="flex items-center gap-2 pr-1" key={sound.id}>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`${playingId === sound.id ? "Stop" : "Preview"} ${sound.name}`}
								onClick={() => togglePreview(sound)}
								className="bg-accent shrink-0"
							>
								<HugeiconsIcon
									icon={playingId === sound.id ? PauseIcon : PlayIcon}
								/>
							</Button>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium" title={sound.name}>
									{sound.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{sound.duration.toFixed(2)} s
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Add ${sound.name} to timeline`}
								title="Add to timeline"
								disabled={addingId !== null}
								aria-busy={addingId === sound.id}
								onClick={() => addSound(sound)}
								className="text-muted-foreground hover:text-foreground shrink-0"
							>
								<HugeiconsIcon icon={PlusSignIcon} />
							</Button>
						</li>
					))}
				</ul>
				{sounds.length === 0 && (
					<p className="text-muted-foreground text-sm">
						No matching sound effects.
					</p>
				)}
			</ScrollArea>
		</div>
	);
}
