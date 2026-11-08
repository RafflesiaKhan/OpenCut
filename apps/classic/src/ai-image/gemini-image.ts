export type ThinkingLevel = "Minimal" | "Medium" | "High";

export const GEMINI_MODELS = [
	{
		id: "gemini-3.1-flash-image",
		label: "Gemini 3.1 Flash Image (Nano Banana 2)",
	},
	{ id: "gemini-nano-banana-2.1", label: "Nano Banana 2.1" },
	{ id: "gemini-3.1-flash-lite-image", label: "Gemini 3.1 Flash Lite Image" },
	{ id: "gemini-3-pro-image", label: "Gemini 3 Pro Image (Nano Banana Pro)" },
	{
		id: "gemini-2.5-flash-image",
		label: "Gemini 2.5 Flash Image (legacy, retires Mar 2027)",
	},
];

// Per-model capabilities (empty list = option not supported / not exposed)
export const modelCaps = (id: string) => ({
	sizes:
		(
			{
				"gemini-nano-banana-2.1": ["1K", "2K", "4K"],
				"gemini-3.1-flash-image": ["512px", "1K", "2K", "4K"],
				"gemini-3-pro-image": ["1K", "2K", "4K"],
			} as Record<string, string[]>
		)[id] ?? [],
	thinking:
		(
			{
				"gemini-nano-banana-2.1": ["Minimal", "Medium", "High"],
				"gemini-3.1-flash-image": ["Minimal", "High"],
				"gemini-3.1-flash-lite-image": ["Minimal", "High"],
			} as Record<string, ThinkingLevel[]>
		)[id] ?? [],
	grounding: [
		"gemini-nano-banana-2.1",
		"gemini-3.1-flash-image",
		"gemini-3-pro-image",
	].includes(id),
	imageSearch: ["gemini-nano-banana-2.1", "gemini-3.1-flash-image"].includes(
		id,
	),
});

type ImageStep = {
	type?: string;
	content?: { type?: string; data?: string; mime_type?: string }[];
};

export async function requestGeminiImage(
	apiKey: string,
	body: Record<string, unknown>,
) {
	const response = await fetch(
		"https://generativelanguage.googleapis.com/v1beta/interactions",
		{
			method: "POST",
			headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
			body: JSON.stringify(body),
		},
	);
	const data = await response.json();
	if (!response.ok)
		throw new Error(data.error?.message || `HTTP ${response.status}`);

	const image = ((data.steps ?? []) as ImageStep[])
		.filter((step) => step.type === "model_output")
		.flatMap((step) => step.content ?? [])
		.findLast(
			(output) =>
				output.type === "image" &&
				typeof output.data === "string" &&
				output.data.length > 0,
		);
	if (!image) throw new Error("Gemini returned no image.");

	const mimeType = image.mime_type ?? "image/png";
	if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
		throw new Error("Gemini returned an unsupported image format.");
	}
	return { dataUrl: `data:${mimeType};base64,${image.data}`, mimeType };
}
