import { expect, test } from "bun:test";
import type { ProductionDraft } from "../contract";
import {
	narrationText,
	reorderScenes,
	reviseNarration,
	reviseSceneVisual,
	validateDraft,
} from "../draft";

const texts = [
	"One day.",
	"Popy woke up.",
	"She walked to the river.",
	"The water was cold.",
	"She smiled.",
	"The end.",
];

const draft: ProductionDraft = {
	version: 1,
	brief: {
		topic: "Popy at the river",
		audience: "kids",
		intent: "tell a story",
		targetSeconds: 30,
		language: "en",
		ratio: "16:9",
		audioMode: "narrator",
	},
	arc: "Morning, river, home",
	narration: texts.map((text, i) => ({
		id: `n${i + 1}`,
		text,
		speaker: "narrator",
	})),
	scenes: texts.map((_, i) => ({
		id: `s${i + 1}`,
		revision: 1,
		narrationSegmentIds: [`n${i + 1}`],
		visual: `Visual ${i + 1}`,
		setting: "Village",
		characters: ["Popy"],
		media: "still" as const,
		motion: "slow push-in",
		estimatedSeconds: 5,
		timingSource: "estimated" as const,
		prompts: [],
		candidateAssetIds: [],
		status: "planned" as const,
		stale: [],
	})),
	notes: "",
};

const withAcceptedImages: ProductionDraft = {
	...draft,
	scenes: draft.scenes.map((s, i) => ({
		...s,
		acceptedAssetId: `asset-${i + 1}`,
		status: "accepted" as const,
	})),
};

const draftWithOrphanSegmentAndBracketDirection: ProductionDraft = {
	...draft,
	narration: [
		draft.narration[0],
		{ ...draft.narration[1], text: "Popy woke up. [slow zoom]" },
		...draft.narration.slice(2),
		{ id: "n7", text: "Nobody reads this.", speaker: "narrator" },
	],
};

test("reorder keeps ids and links", () => {
	const next = reorderScenes(draft, 0, 2);
	expect(next.scenes.map((s) => s.id)).toEqual([
		"s2",
		"s3",
		"s1",
		"s4",
		"s5",
		"s6",
	]);
	expect(next.scenes[2].narrationSegmentIds).toEqual(
		draft.scenes[0].narrationSegmentIds,
	);
	expect(draft.scenes.map((s) => s.id)[0]).toBe("s1");
});

test("reorder rejects out-of-range indexes", () => {
	expect(() => reorderScenes(draft, 0, 6)).toThrow("6");
	expect(() => reorderScenes(draft, -1, 2)).toThrow("-1");
});

test("narration change marks only linked scenes stale, keeps accepted image", () => {
	const next = reviseNarration(withAcceptedImages, "n3", "New line.");
	const s3 = next.scenes[2];
	expect(s3.stale).toEqual(["narration", "timing"]);
	expect(s3.acceptedAssetId).toBe("asset-3");
	expect(s3.revision).toBe(2);
	expect(next.narration.find((n) => n.id === "n3")?.text).toBe("New line.");
	expect(next.scenes.filter((s) => s.stale.length).map((s) => s.id)).toEqual([
		"s3",
	]);
	expect(next.scenes[0]).toBe(withAcceptedImages.scenes[0]);
	expect(withAcceptedImages.scenes[2].stale).toEqual([]);
	expect(withAcceptedImages.narration[2].text).toBe(texts[2]);
});

test("revising narration twice does not duplicate reasons", () => {
	const next = reviseNarration(reviseNarration(draft, "n1", "A."), "n1", "B.");
	expect(next.scenes[0].stale).toEqual(["narration", "timing"]);
	expect(next.scenes[0].revision).toBe(3);
});

test("unknown ids throw", () => {
	expect(() => reviseNarration(draft, "nope", "x")).toThrow("nope");
	expect(() => reviseSceneVisual(draft, "nope", "x")).toThrow("nope");
});

test("visual change does not touch timing", () => {
	const next = reviseSceneVisual(draft, "s2", "Popy at the river");
	const s2 = next.scenes[1];
	expect(s2.stale).toEqual(["visual"]);
	expect(s2.visual).toBe("Popy at the river");
	expect(s2.revision).toBe(2);
	expect(s2.timingSource).toBe(draft.scenes[1].timingSource);
	expect(draft.scenes[1].visual).toBe("Visual 2");
	expect(draft.scenes[1].stale).toEqual([]);
});

test("visual change keeps existing reasons in canonical order", () => {
	const next = reviseSceneVisual(reviseNarration(draft, "n2", "x"), "s2", "y");
	expect(next.scenes[1].stale).toEqual(["narration", "visual", "timing"]);
});

test("validateDraft accepts a clean draft", () => {
	expect(validateDraft(draft)).toEqual({ ok: true });
});

test("validateDraft reports uncovered narration and directions in spoken text", () => {
	const r = validateDraft(draftWithOrphanSegmentAndBracketDirection);
	expect(r).toEqual({
		ok: false,
		problems: [
			"Narration n7 is not linked to any scene.",
			"Narration n2 contains a direction: [slow zoom]",
		],
	});
});

test("validateDraft reports scenes linking to missing narration", () => {
	const broken: ProductionDraft = {
		...draft,
		scenes: [
			{ ...draft.scenes[0], narrationSegmentIds: ["n1", "ghost"] },
			...draft.scenes.slice(1),
		],
	};
	expect(validateDraft(broken)).toEqual({
		ok: false,
		problems: ["Scene s1 links to missing narration ghost."],
	});
});

test("validateDraft detects parentheses and line-start directions", () => {
	const r = validateDraft({
		...draft,
		narration: [
			{ ...draft.narration[0], text: "One day. (whispers)" },
			{ ...draft.narration[1], text: "Hello.\nSFX: birds" },
			{ ...draft.narration[2], text: "Visual: a river" },
			{ ...draft.narration[3], text: "scene 4 begins" },
			...draft.narration.slice(4),
		],
	});
	expect(r).toEqual({
		ok: false,
		problems: [
			"Narration n1 contains a direction: (whispers)",
			"Narration n2 contains a direction: SFX: birds",
			"Narration n3 contains a direction: Visual: a river",
			"Narration n4 contains a direction: scene 4 begins",
		],
	});
});

test("narrationText joins segments in order with single spaces", () => {
	expect(narrationText(draft, ["n1", "n2"])).toBe("One day. Popy woke up.");
	expect(narrationText(draft, ["n2", "n1"])).toBe("One day. Popy woke up.");
	expect(narrationText(draft)).toBe(texts.join(" "));
});
