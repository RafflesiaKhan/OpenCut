import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { POST } from "./route";

const host = "127.0.0.1:3102";
const origin = `http://${host}`;
const originalKey = process.env.OPENAI_API_KEY;
let provider: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

const data = {
	question: "What would you change here?",
	history: [],
	brand: {
		channel: "Clay Stories",
		series: "Tiny Makers",
		notes: "Warm colors and gentle narration.",
	},
	project: {
		name: "Episode 3",
		scene: "Intro",
		playhead: 4,
		duration: 10,
		clipCount: 1,
		clips: [
			{
				id: "intro",
				name: "Title",
				type: "text",
				track: "Text",
				start: 3,
				end: 6,
				selected: true,
				text: "Tiny Makers",
			},
		],
		assetCount: 0,
		assets: [],
	},
};

function request(payload: unknown, requestOrigin = origin) {
	return new Request(`${origin}/api/director`, {
		method: "POST",
		headers: {
			host,
			origin: requestOrigin,
			"content-type": "application/json",
		},
		body: JSON.stringify(payload),
	});
}

beforeEach(() => {
	process.env.OPENAI_API_KEY = "mock-director-key";
	provider = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(null, { status: 500 }),
	);
});

afterEach(() => {
	provider.mockRestore();
	if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
	else process.env.OPENAI_API_KEY = originalKey;
});

test("rejects other origins and reports an empty local key without calling OpenAI", async () => {
	expect((await POST(request(data, "http://127.0.0.1:3333"))).status).toBe(403);
	process.env.OPENAI_API_KEY = "";
	expect((await POST(request(data))).status).toBe(503);
	expect(provider).not.toHaveBeenCalled();
});

test("validates context, sends only defined fields, and returns only supplied clip IDs", async () => {
	expect((await POST(request({ ...data, question: "" }))).status).toBe(400);
	expect(provider).not.toHaveBeenCalled();
	provider.mockResolvedValueOnce(
		Response.json({
			output: [
				{ type: "reasoning" },
				{
					type: "message",
					content: [
						{
							type: "output_text",
							text: JSON.stringify({
								answer: "Hold the title one second longer.",
								clipIds: ["intro", "fake", "intro"],
							}),
						},
					],
				},
			],
		}),
	);
	const response = await POST(
		request({ ...data, project: { ...data.project, privateFile: "not sent" } }),
	);
	expect(await response.json()).toEqual({
		answer: "Hold the title one second longer.",
		clipIds: ["intro"],
	});
	const [url, options] = provider.mock.calls[0];
	expect(url).toBe("https://api.openai.com/v1/responses");
	const sent = JSON.parse(String(options?.body));
	expect(sent.store).toBe(false);
	expect(JSON.parse(sent.input)).toEqual(data);
});
