import { z } from "zod";
import {
	isOmniVoiceEngine,
	VOICE_STUDIO_MAX_TEXT,
	type VoiceStudioOptions,
} from "@/ai-voice/voice-studio";

const engineId = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/);
const voiceId = z.string().trim().min(1).max(150);
const speechInput = z.object({
	text: z.string().trim().min(1).max(VOICE_STUDIO_MAX_TEXT),
	engine: engineId,
	voice: voiceId,
});

const voiceRecord = z.object({
	voice_id: voiceId.optional(),
	id: voiceId.optional(),
	name: z.string().optional(),
	type: z.string().optional(),
});
const engineRecord = z.object({
	id: engineId,
	display_name: z.string().optional(),
	available: z.boolean(),
});
const personaRecord = z.object({
	id: engineId,
	name: z.string().min(1),
	instruct: z.string().min(1).max(4096),
});

function error(message: string, status: number) {
	return Response.json(
		{ error: message },
		{ status, headers: { "Cache-Control": "no-store" } },
	);
}

function localStudio(request: Request) {
	const host = request.headers.get("host") ?? "";
	const origin = request.headers.get("origin");
	const site = request.headers.get("sec-fetch-site");
	if (
		!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host) ||
		(site && site !== "same-origin" && site !== "none") ||
		((origin || request.method === "POST") && origin !== `http://${host}`)
	) {
		return error(
			"Voice Studio is only available from a local OpenCut page.",
			403,
		);
	}

	const configured = process.env.VOICESTUDIO_URL?.trim();
	if (!configured) {
		return error(
			"Set VOICESTUDIO_URL in OpenCut Classic’s .env.local, then restart OpenCut.",
			503,
		);
	}
	if (
		!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::[1-9]\d{0,4})?\/?$/i.test(
			configured,
		)
	) {
		return error("VOICESTUDIO_URL must be an HTTP loopback address.", 503);
	}

	try {
		const url = new URL(configured);
		url.hostname = "127.0.0.1";
		return url.origin;
	} catch {
		return error("VOICESTUDIO_URL is invalid.", 503);
	}
}

function studioFetch(
	base: string,
	path: string,
	timeoutMs: number,
	init?: RequestInit,
) {
	return fetch(base + path, {
		...init,
		cache: "no-store",
		redirect: "error",
		signal: AbortSignal.timeout(timeoutMs),
	});
}

async function studioPersonas(base: string) {
	try {
		const response = await studioFetch(base, "/personalities", 3500);
		if (!response.ok) return [];
		const raw: unknown = await response.json();
		return Array.isArray(raw)
			? raw.flatMap((item) => {
					const persona = personaRecord.safeParse(item);
					return persona.success ? [persona.data] : [];
				})
			: [];
	} catch {
		return [];
	}
}

export async function GET(request: Request) {
	const base = localStudio(request);
	if (typeof base !== "string") return base;

	try {
		const [response, personas] = await Promise.all([
			studioFetch(base, "/v1/audio/voices", 3500),
			studioPersonas(base),
		]);
		if (!response.ok)
			return error(
				`Voice Studio returned HTTP ${response.status}. Check its local service.`,
				502,
			);

		const catalogue = z
			.object({ voices: z.array(z.unknown()), engines: z.array(z.unknown()) })
			.parse(await response.json());
		const options: VoiceStudioOptions = {
			engines: catalogue.engines.flatMap((item) => {
				const engine = engineRecord.safeParse(item);
				if (!engine.success || !engine.data.available) return [];
				const { id, display_name } = engine.data;
				return [{ id, label: display_name || id }];
			}),
			voices: catalogue.voices.flatMap((item) => {
				const voice = voiceRecord.safeParse(item);
				if (!voice.success || voice.data.type === "openai_alias") return [];
				const id = voice.data.voice_id ?? voice.data.id;
				return id ? [{ id, label: voice.data.name || id }] : [];
			}),
			personas: personas.map(({ id, name }) => ({
				id: `persona:${id}`,
				label: name,
			})),
		};
		return Response.json(options, { headers: { "Cache-Control": "no-store" } });
	} catch {
		return error(
			"Could not read Voice Studio. Open the desktop app, wait for its local service, and retry.",
			503,
		);
	}
}

export async function POST(request: Request) {
	const base = localStudio(request);
	if (typeof base !== "string") return base;
	if (
		request.headers.get("content-type")?.split(";")[0] !== "application/json"
	) {
		return error("Expected a JSON narration request.", 415);
	}

	const input = speechInput.safeParse(await request.json().catch(() => null));
	if (!input.success) {
		return error(
			`Enter up to ${VOICE_STUDIO_MAX_TEXT} characters and choose a voice and engine.`,
			400,
		);
	}
	const { text, engine, voice } = input.data;
	const body = {
		model: engine,
		voice,
		input: text,
		response_format: "wav",
		instruct: undefined as string | undefined,
	};
	if (voice.startsWith("persona:")) {
		if (!isOmniVoiceEngine(engine))
			return error("Select OmniVoice to use a designed voice.", 400);
		const persona = (await studioPersonas(base)).find(
			({ id }) => id === voice.slice(8),
		);
		if (!persona)
			return error(
				"That designed voice is unavailable. Refresh the Voice Studio voices.",
				400,
			);
		body.voice = "default";
		body.instruct = persona.instruct;
	}

	try {
		const response = await studioFetch(base, "/v1/audio/speech", 300_000, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			const problem = await response.json().catch(() => null);
			const message = problem?.error?.message ?? problem?.detail;
			return error(
				typeof message === "string"
					? message.slice(0, 300)
					: `Voice Studio returned HTTP ${response.status}.`,
				502,
			);
		}
		const type = response.headers.get("content-type")?.split(";")[0];
		if (
			!response.body ||
			!type ||
			!["audio/wav", "audio/x-wav", "audio/wave"].includes(type)
		) {
			return error("Voice Studio did not return WAV audio.", 502);
		}
		return new Response(response.body, {
			headers: {
				"Content-Type": "audio/wav",
				"Cache-Control": "no-store",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (cause) {
		if (cause instanceof Error && cause.name === "TimeoutError") {
			return error(
				"Voice Studio timed out. Try shorter text after the engine has loaded.",
				504,
			);
		}
		return error(
			"Could not reach Voice Studio. Open the desktop app and retry.",
			503,
		);
	}
}
