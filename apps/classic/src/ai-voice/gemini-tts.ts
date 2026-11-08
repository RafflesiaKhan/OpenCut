export const GEMINI_TTS_MODELS = [
	{ id: "gemini-3.8-flash-tts", label: "Gemini 3.8 Flash TTS" },
	{ id: "gemini-3.8-flash-lite-tts", label: "Gemini 3.8 Flash-Lite TTS" },
] as const;

export const GEMINI_VOICES = [
	"Achird",
	"Achernar",
	"Algenib",
	"Algieba",
	"Alnilam",
	"Aoede",
	"Autonoe",
	"Callirrhoe",
	"Charon",
	"Despina",
	"Enceladus",
	"Erinome",
	"Fenrir",
	"Gacrux",
	"Iapetus",
	"Kore",
	"Laomedeia",
	"Leda",
	"Orus",
	"Puck",
	"Pulcherrima",
	"Rasalgethi",
	"Sadachbia",
	"Sadaltager",
	"Schedar",
	"Sulafat",
	"Umbriel",
	"Vindemiatrix",
	"Zephyr",
	"Zubenelgenubi",
] as const;

export const STYLE_PRESETS = [
	{
		label: "Audiobook Narrator",
		style:
			"Warm storytelling voice, slow pace, vary tone with the emotion of each sentence",
	},
	{
		label: "Product Explainer",
		style:
			"Professional, clear, friendly — like a knowledgeable colleague explaining something helpful",
	},
	{
		label: "Documentary",
		style: "Measured, confident, calm authority — like a documentary narrator",
	},
	{
		label: "Children's Story",
		style:
			"Bright, expressive, with exaggerated wonder and warmth — as if reading to a 5-year-old",
	},
	{
		label: "Meditation / Wellness",
		style:
			"Slow, soft, breathy — very calm and grounding, long pauses between phrases",
	},
	{
		label: "News Anchor",
		style: "Professional, neutral, clear diction — news delivery style",
	},
	{
		label: "Cinematic Trailer",
		style:
			"Low intensity, cinematic, slow and deliberate — building tension with each word",
	},
	{
		label: "Customer Support",
		style:
			"Patient, calm, empathetic — like a helpful support agent who genuinely cares",
	},
] as const;

export const MAX_TEXT_LENGTH = 5000;

type InteractionStep = {
	type?: string;
	content?: { type?: string; data?: string }[];
};

/**
 * Reads `text` aloud with Gemini TTS (Interactions API) and returns a WAV blob.
 * Gemini 3.8 TTS reads text verbatim, so delivery directions go in `style`
 * (a speech_metadata annotation) rather than in the text itself.
 */
export async function generateSpeech({
	apiKey,
	model,
	voice,
	text,
	style,
}: {
	apiKey: string;
	model: string;
	voice: string;
	text: string;
	style?: string;
}): Promise<Blob> {
	const textItem: Record<string, unknown> = { type: "text", text };
	if (style?.trim()) {
		textItem.annotations = [{ type: "speech_metadata", style: style.trim() }];
	}

	const response = await fetch(
		"https://generativelanguage.googleapis.com/v1beta/interactions",
		{
			method: "POST",
			headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
			body: JSON.stringify({
				model,
				input: [{ type: "user_input", content: [textItem] }],
				response_format: { type: "audio", mime_type: "audio/wav" },
				generation_config: { speech_config: [{ voice }] },
			}),
		},
	);

	const data = await response.json();
	if (!response.ok) {
		// Errors may arrive as { error } or wrapped in an array: [{ error }]
		const error = Array.isArray(data) ? data[0]?.error : data.error;
		throw new Error(error?.message || `HTTP ${response.status}`);
	}

	const audioParts = ((data.steps ?? []) as InteractionStep[])
		.filter((step) => step.type === "model_output")
		.flatMap((step) => step.content ?? [])
		.filter((item) => item.type === "audio" && item.data);
	const base64 = audioParts[audioParts.length - 1]?.data;
	if (!base64) throw new Error("No audio returned. Try different text.");

	const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
	return new Blob([bytes], { type: "audio/wav" });
}
