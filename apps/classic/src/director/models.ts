export const directorProviders = {
	openai: {
		label: "OpenAI",
		key: "OPENAI_API_KEY",
		pricing: "https://developers.openai.com/api/docs/pricing",
	},
	anthropic: {
		label: "Anthropic",
		key: "ANTHROPIC_API_KEY",
		pricing: "https://platform.claude.com/docs/en/about-claude/pricing",
	},
	xai: {
		label: "xAI (Grok)",
		key: "XAI_API_KEY",
		pricing: "https://docs.x.ai/developers/models/grok-4.7",
	},
} as const;

export type DirectorProvider = keyof typeof directorProviders;

// Standard uncached USD text prices per 1M input or output tokens, checked 2026-11-08.
export const directorModels = [
	{
		provider: "openai",
		id: "gpt-6-luna",
		label: "GPT-6 Luna",
		input: 0.1,
		output: 0.5,
		hint: "Low cost · quick ideas and rewrites",
		effort: "low",
	},
	{
		provider: "openai",
		id: "gpt-6-astra",
		label: "GPT-6 Astra",
		input: 10,
		output: 50,
		hint: "Premium · complex scripts and planning",
		effort: "medium",
	},
	{
		provider: "anthropic",
		id: "claude-haiku-5-5",
		label: "Claude Haiku 5.5",
		input: 0.1,
		output: 0.5,
		hint: "Low cost · short drafts and summaries",
		effort: "low",
	},
	{
		provider: "anthropic",
		id: "claude-sonnet-5-5",
		label: "Claude Sonnet 5.5",
		input: 2,
		output: 10,
		hint: "Midrange · scripts and detailed feedback",
		effort: "medium",
	},
	{
		provider: "xai",
		id: "grok-4.7",
		label: "Grok 4.7",
		input: 2,
		output: 6,
		hint: "Midrange · story ideas and edit analysis",
		effort: "low",
	},
] as const;

export function directorModelPrice(model: (typeof directorModels)[number]) {
	return `$${model.input.toFixed(2)} / $${model.output.toFixed(2)}`;
}
