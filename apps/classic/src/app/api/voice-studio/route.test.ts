import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { GET, POST } from "./route";

const originalUrl = process.env.VOICESTUDIO_URL;
const host = "127.0.0.1:3102";
const origin = `http://${host}`;
const endpoint = `${origin}/api/voice-studio`;
const upstream = "http://127.0.0.1:3900";
let fetchMock: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

beforeEach(() => {
	process.env.VOICESTUDIO_URL = "http://localhost:3900/";
	fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(null, { status: 500 }),
	);
});

afterEach(() => {
	fetchMock.mockRestore();
	if (originalUrl === undefined) delete process.env.VOICESTUDIO_URL;
	else process.env.VOICESTUDIO_URL = originalUrl;
});

function speech(data: object, options: HeadersInit = {}) {
	const headers = new Headers({
		host,
		origin,
		"content-type": "application/json",
		"sec-fetch-site": "same-origin",
	});
	new Headers(options).forEach((value, key) => {
		headers.set(key, value);
	});
	return new Request(endpoint, {
		method: "POST",
		headers,
		body: JSON.stringify(data),
	});
}

const narration = {
	text: "  A local narration.  ",
	engine: "tts-1",
	voice: "default",
};

test("rejects cross-origin requests and remote provider URLs", async () => {
	expect(
		(await POST(speech(narration, { origin: "https://example.com" }))).status,
	).toBe(403);
	expect(
		(await POST(speech(narration, { "sec-fetch-site": "cross-site" }))).status,
	).toBe(403);
	process.env.VOICESTUDIO_URL = "http://127.0.0.1:3900@example.com";
	expect((await GET(new Request(endpoint, { headers: { host } }))).status).toBe(
		503,
	);
	expect(fetchMock).not.toHaveBeenCalled();
});

test("lists available engines, profiles and designed voices", async () => {
	fetchMock.mockResolvedValueOnce(
		Response.json({
			voices: [
				{ voice_id: "alloy", type: "openai_alias" },
				{ voice_id: "profile-1", name: "My voice", type: "profile" },
			],
			engines: [
				{ id: "omnivoice", available: true, display_name: "OmniVoice" },
				{ id: "missing", available: false },
			],
		}),
	);
	fetchMock.mockResolvedValueOnce(
		Response.json([
			{ id: "narrator", name: "Narrator", instruct: "middle-aged" },
		]),
	);
	const response = await GET(new Request(endpoint, { headers: { host } }));
	expect(await response.json()).toEqual({
		engines: [{ id: "omnivoice", label: "OmniVoice" }],
		voices: [{ id: "profile-1", label: "My voice" }],
		personas: [{ id: "persona:narrator", label: "Narrator" }],
	});
	expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
		`${upstream}/v1/audio/voices`,
		`${upstream}/personalities`,
	]);
});

test("validates narration length and streams WAV from the selected engine", async () => {
	expect(
		(await POST(speech({ ...narration, text: "x".repeat(4097) }))).status,
	).toBe(400);
	expect(fetchMock).not.toHaveBeenCalled();
	fetchMock.mockResolvedValueOnce(
		new Response("wav fixture", { headers: { "content-type": "audio/wav" } }),
	);
	const response = await POST(speech(narration));
	expect(await response.text()).toBe("wav fixture");
	expect(response.headers.get("content-type")).toBe("audio/wav");
	const [url, options] = fetchMock.mock.calls[0];
	expect(url).toBe(`${upstream}/v1/audio/speech`);
	expect(options?.redirect).toBe("error");
	expect(JSON.parse(String(options?.body))).toEqual({
		model: "tts-1",
		voice: "default",
		input: "A local narration.",
		response_format: "wav",
	});
});

test("resolves designed voices only on OmniVoice", async () => {
	expect(
		(await POST(speech({ ...narration, voice: "persona:narrator" }))).status,
	).toBe(400);
	expect(fetchMock).not.toHaveBeenCalled();
	fetchMock.mockResolvedValueOnce(
		Response.json([
			{ id: "narrator", name: "Narrator", instruct: "middle-aged, low pitch" },
		]),
	);
	fetchMock.mockResolvedValueOnce(
		new Response("wav fixture", { headers: { "content-type": "audio/wav" } }),
	);
	expect(
		(
			await POST(
				speech({
					...narration,
					engine: "omnivoice",
					voice: "persona:narrator",
				}),
			)
		).status,
	).toBe(200);
	expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
		model: "omnivoice",
		voice: "default",
		instruct: "middle-aged, low pitch",
	});
});
