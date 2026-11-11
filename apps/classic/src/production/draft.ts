import type { ProductionDraft, StaleReason, StoryScene } from "./contract";

const REASON_ORDER: StaleReason[] = ["narration", "visual", "timing"];

const DIRECTION_SPAN = /\[[^\]]*\]|\([^)]*\)/;
const DIRECTION_LINE = /^\s*(scene\s*(\d|:)|visual:|sfx:)/i;

function markStale(scene: StoryScene, reasons: StaleReason[]): StoryScene {
	const stale = REASON_ORDER.filter(
		(reason) => scene.stale.includes(reason) || reasons.includes(reason),
	);
	return { ...scene, revision: scene.revision + 1, stale };
}

function findDirection(text: string): string | undefined {
	const span = text.match(DIRECTION_SPAN);
	if (span) return span[0];
	return text
		.split("\n")
		.find((line) => DIRECTION_LINE.test(line))
		?.trim();
}

export function reorderScenes(
	draft: ProductionDraft,
	from: number,
	to: number,
): ProductionDraft {
	const last = draft.scenes.length - 1;
	for (const index of [from, to]) {
		if (!Number.isInteger(index) || index < 0 || index > last) {
			throw new Error(`Scene index ${index} is out of range.`);
		}
	}
	const scenes = [...draft.scenes];
	const [moved] = scenes.splice(from, 1);
	scenes.splice(to, 0, moved);
	return { ...draft, scenes };
}

export function reviseNarration(
	draft: ProductionDraft,
	segmentId: string,
	text: string,
): ProductionDraft {
	if (!draft.narration.some((segment) => segment.id === segmentId)) {
		throw new Error(`Unknown narration segment ${segmentId}.`);
	}
	return {
		...draft,
		narration: draft.narration.map((segment) =>
			segment.id === segmentId ? { ...segment, text } : segment,
		),
		scenes: draft.scenes.map((scene) =>
			scene.narrationSegmentIds.includes(segmentId)
				? markStale(scene, ["narration", "timing"])
				: scene,
		),
	};
}

export function reviseSceneVisual(
	draft: ProductionDraft,
	sceneId: string,
	visual: string,
): ProductionDraft {
	if (!draft.scenes.some((scene) => scene.id === sceneId)) {
		throw new Error(`Unknown scene ${sceneId}.`);
	}
	return {
		...draft,
		scenes: draft.scenes.map((scene) =>
			scene.id === sceneId
				? { ...markStale(scene, ["visual"]), visual }
				: scene,
		),
	};
}

export function validateDraft(
	draft: ProductionDraft,
): { ok: true } | { ok: false; problems: string[] } {
	const problems: string[] = [];
	const segmentIds = new Set(draft.narration.map((segment) => segment.id));
	const linked = new Set(
		draft.scenes.flatMap((scene) => scene.narrationSegmentIds),
	);

	for (const segment of draft.narration) {
		if (!linked.has(segment.id)) {
			problems.push(`Narration ${segment.id} is not linked to any scene.`);
		}
	}
	for (const scene of draft.scenes) {
		for (const segmentId of scene.narrationSegmentIds) {
			if (!segmentIds.has(segmentId)) {
				problems.push(
					`Scene ${scene.id} links to missing narration ${segmentId}.`,
				);
			}
		}
	}
	for (const segment of draft.narration) {
		const direction = findDirection(segment.text);
		if (direction) {
			problems.push(
				`Narration ${segment.id} contains a direction: ${direction}`,
			);
		}
	}

	return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

export function narrationText(
	draft: ProductionDraft,
	segmentIds?: string[],
): string {
	return draft.narration
		.filter((segment) => !segmentIds || segmentIds.includes(segment.id))
		.map((segment) => segment.text.trim())
		.join(" ");
}
