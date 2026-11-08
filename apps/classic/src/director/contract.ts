import { z } from "zod";

export const directorBrandSchema = z.object({
	channel: z.string().trim().max(100),
	series: z.string().trim().max(100),
	notes: z.string().trim().max(4000),
});
export type DirectorBrand = z.infer<typeof directorBrandSchema>;

const label = z.string().max(200);
const clipSchema = z.object({
	id: label,
	name: label,
	type: label,
	track: label,
	start: z.number().nonnegative(),
	end: z.number().nonnegative(),
	selected: z.boolean(),
	text: z.string().max(300).optional(),
});

export const directorRequestSchema = z.object({
	question: z.string().trim().min(1).max(2000),
	history: z
		.array(
			z.object({
				question: z.string().max(2000),
				answer: z.string().max(4000),
			}),
		)
		.max(6),
	brand: directorBrandSchema,
	project: z.object({
		name: label,
		scene: label,
		playhead: z.number().nonnegative(),
		duration: z.number().nonnegative(),
		clipCount: z.number().int().nonnegative(),
		clips: z.array(clipSchema).max(60),
		assetCount: z.number().int().nonnegative(),
		assets: z.array(z.object({ name: label, type: label })).max(30),
	}),
});

export const directorReplySchema = z.object({
	answer: z.string().trim().min(1).max(10000),
	clipIds: z.array(label),
});
export type DirectorReply = z.infer<typeof directorReplySchema>;
export type DirectorProject = z.infer<typeof directorRequestSchema>["project"];
