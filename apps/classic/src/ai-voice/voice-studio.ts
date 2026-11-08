export const VOICE_STUDIO_MAX_TEXT = 4096;
export const VOICE_STUDIO_DEFAULT_ENGINE = "tts-1";
export const VOICE_STUDIO_DEFAULT_VOICE = "default";

export type VoiceStudioOptions = {
	engines: { id: string; label: string }[];
	voices: { id: string; label: string }[];
	personas: { id: string; label: string }[];
};

export function isOmniVoiceEngine(engine: string) {
	return engine === "omnivoice" || engine === "omnivoice-gguf";
}

export async function voiceStudioRequest(init?: RequestInit) {
	const response = await fetch("/api/voice-studio", init);
	if (!response.ok) {
		const problem = await response.json().catch(() => null);
		throw new Error(
			problem?.error ??
				`Voice Studio request failed (HTTP ${response.status}).`,
		);
	}
	return response;
}
