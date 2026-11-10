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
		pricing: "https://docs.x.ai/developers/pricing",
	},
	kimi: {
		label: "Kimi (Moonshot AI)",
		key: "MOONSHOT_API_KEY",
		pricing: "https://platform.kimi.ai/docs/pricing/chat",
	},
} as const;

export type DirectorProvider = keyof typeof directorProviders;

// Standard uncached USD text prices per 1M input or output tokens, checked 2026-11-10.
type DirectorModel = {
	provider: DirectorProvider;
	id: string;
	label: string;
	input: number;
	output: number;
	hint: string;
	effort?: "low" | "medium";
};

export const directorModels: readonly DirectorModel[] = [
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
		id: "gpt-5.4-mini",
		label: "GPT-5.4 Mini",
		input: 0.75,
		output: 4.5,
		hint: "Economy · outlines and revisions",
		effort: "low",
	},
	{
		provider: "openai",
		id: "gpt-6.1-terra",
		label: "GPT-6.1 Terra",
		input: 1,
		output: 5,
		hint: "Midrange · scripts and edit notes",
		effort: "low",
	},
	{
		provider: "openai",
		id: "gpt-6.1-sol",
		label: "GPT-6.1 Sol",
		input: 2,
		output: 10,
		hint: "Higher cost · detailed editorial planning",
		effort: "medium",
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
		provider: "anthropic",
		id: "claude-sonnet-4-6",
		label: "Claude Sonnet 4.6",
		input: 3,
		output: 15,
		hint: "Higher cost · structured editorial feedback",
		effort: "medium",
	},
	{
		provider: "anthropic",
		id: "claude-opus-5-5",
		label: "Claude Opus 5.5",
		input: 4,
		output: 20,
		hint: "Higher cost · long scripts and nuanced revisions",
		effort: "medium",
	},
	{
		provider: "anthropic",
		id: "claude-fable-5-2",
		label: "Claude Fable 5.2",
		input: 8,
		output: 40,
		hint: "Premium · demanding multi-episode planning",
	},
	{
		provider: "xai",
		id: "grok-build-0.1",
		label: "Grok Build 0.1",
		input: 1,
		output: 2,
		hint: "Low cost · code and production workflows",
	},
	{
		provider: "xai",
		id: "grok-4.3",
		label: "Grok 4.3",
		input: 1.25,
		output: 2.5,
		hint: "Economy · brainstorming and short drafts",
		effort: "low",
	},
	{
		provider: "xai",
		id: "grok-4.5",
		label: "Grok 4.5",
		input: 2,
		output: 6,
		hint: "Midrange · script and scene revisions",
		effort: "low",
	},
	{
		provider: "xai",
		id: "grok-4.6",
		label: "Grok 4.6",
		input: 2,
		output: 6,
		hint: "Midrange · detailed edit analysis",
		effort: "low",
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
	{
		provider: "kimi",
		id: "kimi-k3.1-pro",
		label: "Kimi K3.1 Pro",
		input: 2,
		output: 10,
		hint: "Standard · scripts and creative planning",
	},
	{
		provider: "kimi",
		id: "kimi-k3",
		label: "Kimi K3",
		input: 3,
		output: 15,
		hint: "Higher cost · detailed story analysis",
	},
	{
		provider: "kimi",
		id: "kimi-k3.1-pro-highspeed",
		label: "Kimi K3.1 Pro Highspeed",
		input: 4,
		output: 20,
		hint: "Premium · faster replies at the same capability",
	},
	{
		provider: "kimi",
		id: "kimi-k2.7-code",
		label: "Kimi K2.7 Code (legacy)",
		input: 0.95,
		output: 4,
		hint: "Low cost · code and workflows · accounts opened before Nov 1, 2026",
	},
	{
		provider: "kimi",
		id: "kimi-k2.6",
		label: "Kimi K2.6 (legacy)",
		input: 0.95,
		output: 4,
		hint: "Low cost · outlines and drafts · accounts opened before Nov 1, 2026",
	},
];

export function directorModelPrice(model: (typeof directorModels)[number]) {
	return `$${model.input.toFixed(2)} / $${model.output.toFixed(2)}`;
}
