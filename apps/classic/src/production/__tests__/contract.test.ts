import { expect, test } from "bun:test";
import {
	productionDraftSchema,
	productionSchema,
	storySceneSchema,
} from "../contract";

function makeScene(n: number) {
	return {
		id: `scene-${n}`,
		revision: 1,
		narrationSegmentIds: [`seg-${n}`],
		visual: `Visual for scene ${n}`,
		setting: "A quiet street at dawn",
		characters: ["Mara"],
		media: "still" as const,
		motion: "slow push-in",
		estimatedSeconds: 5,
		timingSource: "estimated" as const,
		status: "planned" as const,
	};
}

function makeDraft() {
	return {
		version: 1,
		brief: {
			topic: "Why bees matter",
			audience: "general",
			intent: "explain",
			targetSeconds: 30,
			language: "en",
			ratio: "16:9",
			audioMode: "narrator" as const,
		},
		arc: "Hook, problem, solution, call to action",
		narration: [1, 2, 3, 4, 5, 6].map((n) => ({
			id: `seg-${n}`,
			text: `Narration line ${n}`,
			speaker: "narrator",
		})),
		scenes: [1, 2, 3, 4, 5, 6].map(makeScene),
		notes: "",
	};
}

test("a valid six-scene draft parses", () => {
	const result = productionDraftSchema.safeParse(makeDraft());
	expect(result.success).toBe(true);
	if (result.success) {
		expect(result.data.scenes).toHaveLength(6);
		expect(result.data.scenes[0].stale).toEqual([]);
		expect(result.data.scenes[0].prompts).toEqual([]);
	}
});

test("a scene with estimatedSeconds 0 is rejected", () => {
	const result = storySceneSchema.safeParse({
		...makeScene(1),
		estimatedSeconds: 0,
	});
	expect(result.success).toBe(false);
});

test("a measured scene without measuredSeconds is rejected", () => {
	const result = storySceneSchema.safeParse({
		...makeScene(1),
		timingSource: "measured",
	});
	expect(result.success).toBe(false);
	expect(
		storySceneSchema.safeParse({
			...makeScene(1),
			timingSource: "measured",
			measuredSeconds: 4.2,
		}).success,
	).toBe(true);
});

test("production defaults jobs to an empty list", () => {
	const result = productionSchema.parse({
		drafts: [makeDraft()],
		activeVersion: 1,
	});
	expect(result.jobs).toEqual([]);
});
