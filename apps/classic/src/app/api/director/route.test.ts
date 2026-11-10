import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { directorModels, directorProviders } from "@/director/models";
import { POST } from "./route";

const host = "127.0.0.1:3102";
const origin = `http://${host}`;
const keyNames = [
	"OPENAI_API_KEY",
	"ANTHROPIC_API_KEY",
	"XAI_API_KEY",
	"MOONSHOT_API_KEY",
] as const;
const originalKeys = keyNames.map((name) => process.env[name]);
let provider: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

const data = {
	provider: "openai",
	model: "gpt-6-luna",
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
	for (const name of keyNames) process.env[name] = `mock-${name}`;
	provider = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(null, { status: 500 }),
	);
});

afterEach(() => {
	provider.mockRestore();
	keyNames.forEach((name, index) => {
		const value = originalKeys[index];
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	});
});

test("rejects other origins and reports an empty local key without calling OpenAI", async () => {
	expect((await POST(request(data, "http://127.0.0.1:3333"))).status).toBe(403);
	process.env.OPENAI_API_KEY = "";
	expect((await POST(request(data))).status).toBe(503);
	expect(provider).not.toHaveBeenCalled();
});

test("validates context, sends only defined fields, and returns only supplied clip IDs", async () => {
	expect((await POST(request({ ...data, question: "" }))).status).toBe(400);
	expect((await POST(request({ ...data, provider: "anthropic" }))).status).toBe(
		400,
	);
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
	const { question, history, brand, project } = data;
	expect(JSON.parse(sent.input[1].content)).toEqual({
		question,
		history,
		brand,
		project,
	});
	expect(sent.model).toBe("gpt-6-luna");
});

test("sends the selected Anthropic model through Messages and returns usage", async () => {
	provider.mockResolvedValueOnce(
		Response.json({
			content: [
				{
					type: "text",
					text: JSON.stringify({
						answer: "Try a slower opening.",
						clipIds: [],
					}),
				},
			],
			usage: { input_tokens: 125, output_tokens: 30 },
		}),
	);
	const result = await POST(
		request({ ...data, provider: "anthropic", model: "claude-haiku-5-5" }),
	);
	expect(await result.json()).toEqual({
		answer: "Try a slower opening.",
		clipIds: [],
		usage: { input_tokens: 125, output_tokens: 30 },
	});
	const [url, options] = provider.mock.calls[0];
	const headers = new Headers(options?.headers);
	expect(url).toBe("https://api.anthropic.com/v1/messages");
	expect(headers.get("x-api-key")).toBe("mock-ANTHROPIC_API_KEY");
	expect(headers.get("authorization")).toBeNull();
	const sent = JSON.parse(String(options?.body));
	expect(sent.model).toBe("claude-haiku-5-5");
	expect(sent.output_config.format.type).toBe("json_schema");
});

test("sends the selected Grok model to xAI and reads Responses output", async () => {
	const grok = { ...data, provider: "xai", model: "grok-4.7" };
	process.env.XAI_API_KEY = "";
	const missing = await POST(request(grok));
	expect(missing.status).toBe(503);
	expect((await missing.json()).error).toContain("XAI_API_KEY");
	expect(provider).not.toHaveBeenCalled();
	process.env.XAI_API_KEY = "mock-XAI_API_KEY";
	provider.mockResolvedValueOnce(
		Response.json({
			output: [
				{
					type: "message",
					content: [
						{
							type: "output_text",
							text: JSON.stringify({
								answer: "Use the title.",
								clipIds: ["intro"],
							}),
						},
					],
				},
			],
			usage: { input_tokens: 75, output_tokens: 8 },
		}),
	);
	const result = await POST(request(grok));
	expect(await result.json()).toEqual({
		answer: "Use the title.",
		clipIds: ["intro"],
		usage: { input_tokens: 75, output_tokens: 8 },
	});
	const [url, options] = provider.mock.calls[0];
	expect(url).toBe("https://api.x.ai/v1/responses");
	expect(new Headers(options?.headers).get("authorization")).toBe(
		"Bearer mock-XAI_API_KEY",
	);
	expect(JSON.parse(String(options?.body)).model).toBe("grok-4.7");
});

test("each provider has five distinct models", () => {
	for (const provider of Object.keys(directorProviders)) {
		expect(
			directorModels.filter((model) => model.provider === provider),
		).toHaveLength(5);
	}
	expect(new Set(directorModels.map(({ id }) => id)).size).toBe(
		directorModels.length,
	);
});

test("Kimi uses Moonshot Chat Completions and normalizes usage", async () => {
	const kimi = { ...data, provider: "kimi", model: "kimi-k3.1-pro" };
	process.env.MOONSHOT_API_KEY = "";
	expect((await (await POST(request(kimi))).json()).error).toContain(
		"MOONSHOT_API_KEY",
	);
	expect(provider).not.toHaveBeenCalled();
	process.env.MOONSHOT_API_KEY = "mock-MOONSHOT_API_KEY";
	provider.mockResolvedValueOnce(
		Response.json({
			choices: [
				{
					message: {
						content: JSON.stringify({
							answer: "Hold the title.",
							clipIds: ["intro"],
						}),
					},
				},
			],
			usage: { prompt_tokens: 120, completion_tokens: 40 },
		}),
	);
	expect(await (await POST(request(kimi))).json()).toEqual({
		answer: "Hold the title.",
		clipIds: ["intro"],
		usage: { input_tokens: 120, output_tokens: 40 },
	});
	const [url, options] = provider.mock.calls[0];
	expect(url).toBe("https://api.moonshot.ai/v1/chat/completions");
	expect(new Headers(options?.headers).get("authorization")).toBe(
		"Bearer mock-MOONSHOT_API_KEY",
	);
	expect(JSON.parse(String(options?.body))).toMatchObject({
		model: kimi.model,
		response_format: { type: "json_object" },
	});
});
