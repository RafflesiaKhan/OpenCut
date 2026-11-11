import { z } from "zod";

const id = z.string().min(1);
const label = z.string().min(1);
const positiveInt = z.number().int().min(1);
const positiveSeconds = z.number().positive();

export const timingSourceSchema = z.enum(["estimated", "measured", "aligned"]);
export type TimingSource = z.infer<typeof timingSourceSchema>;

export const sceneStatusSchema = z.enum([
	"planned",
	"placed",
	"generating",
	"needs-review",
	"accepted",
	"failed",
]);
export type SceneStatus = z.infer<typeof sceneStatusSchema>;

export const staleReasonSchema = z.enum(["narration", "visual", "timing"]);
export type StaleReason = z.infer<typeof staleReasonSchema>;

export const narrationSegmentSchema = z.object({
	id,
	text: z.string(),
	// "narrator" or a character name
	speaker: label,
});
export type NarrationSegment = z.infer<typeof narrationSegmentSchema>;

export const promptVersionSchema = z.object({
	id,
	text: z.string(),
	provider: label,
	model: label,
	createdAt: z.string().datetime(),
});
export type PromptVersion = z.infer<typeof promptVersionSchema>;

export const storySceneSchema = z
	.object({
		id,
		revision: positiveInt,
		narrationSegmentIds: z.array(id),
		visual: z.string(),
		setting: z.string(),
		characters: z.array(label).default([]),
		media: z.enum(["still", "motion-clip", "stock", "upload", "html-graphic"]),
		motion: z.string(),
		estimatedSeconds: positiveSeconds,
		measuredSeconds: positiveSeconds.optional(),
		timingSource: timingSourceSchema,
		prompts: z.array(promptVersionSchema).default([]),
		candidateAssetIds: z.array(id).default([]),
		acceptedAssetId: id.optional(),
		elementId: id.optional(),
		status: sceneStatusSchema,
		stale: z.array(staleReasonSchema).default([]),
	})
	.refine(
		(scene) =>
			scene.timingSource === "estimated" || scene.measuredSeconds !== undefined,
		{
			message: 'measuredSeconds is required unless timingSource is "estimated"',
			path: ["measuredSeconds"],
		},
	);
export type StoryScene = z.infer<typeof storySceneSchema>;

export const briefSchema = z.object({
	topic: z.string(),
	audience: z.string(),
	intent: z.string(),
	targetSeconds: positiveSeconds,
	language: label,
	ratio: label,
	audioMode: z.enum(["narrator", "dialogue", "both", "none"]),
});
export type Brief = z.infer<typeof briefSchema>;

export const productionDraftSchema = z.object({
	version: positiveInt,
	brief: briefSchema,
	arc: z.string(),
	narration: z.array(narrationSegmentSchema),
	scenes: z.array(storySceneSchema),
	notes: z.string(),
	seriesRef: z.object({ id, revision: positiveInt }).optional(),
});
export type ProductionDraft = z.infer<typeof productionDraftSchema>;

export const productionSchema = z.object({
	drafts: z.array(productionDraftSchema),
	activeVersion: positiveInt,
	// Tightened to GenerationJob in a later task.
	jobs: z.array(z.unknown()).default([]),
	narration: z
		.object({
			textHash: z.string(),
			chunks: z.array(
				z.object({
					segmentIds: z.array(id),
					assetId: id,
					elementId: id.optional(),
					seconds: positiveSeconds,
				}),
			),
		})
		.optional(),
});
export type Production = z.infer<typeof productionSchema>;
