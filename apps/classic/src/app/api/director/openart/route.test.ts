import { expect, spyOn, test } from "bun:test";
import { GET, POST } from "./route";

const host = "127.0.0.1:3102";
const origin = `http://${host}`;
const local = `${origin}/api/director/openart`;
const mcp = "https://mcp.openart.ai/mcp";
const metadata =
	"https://mcp.openart.ai/.well-known/oauth-protected-resource/mcp";
const auth = "https://openart.ai/suite/api/auth/oauth/";
const callback = (search: URLSearchParams, cookie: string) =>
	new Request(`${local}?${search}`, { headers: { host, cookie } });

function request(action: string, cookie = "", requestOrigin = origin) {
	return new Request(local, {
		method: "POST",
		headers: {
			host,
			origin: requestOrigin,
			cookie,
			"content-type": "application/json",
		},
		body: JSON.stringify({ action, projectId: "test-project" }),
	});
}

test("OpenArt exchanges a state-bound OAuth code, lists tools, and disconnects", async () => {
	const upstream = spyOn(globalThis, "fetch").mockImplementation(
		Object.assign(
			async (...[input, init]: Parameters<typeof fetch>) => {
				const url = String(input);
				if (url === metadata)
					return Response.json({
						resource: mcp,
						authorization_servers: ["https://openart.ai"],
					});
				if (
					url === "https://openart.ai/.well-known/oauth-authorization-server"
				) {
					return Response.json({
						issuer: "https://openart.ai",
						authorization_endpoint: `${auth}authorize`,
						token_endpoint: `${auth}token`,
						registration_endpoint: `${auth}register`,
						code_challenge_methods_supported: ["S256"],
						response_types_supported: ["code"],
						token_endpoint_auth_methods_supported: ["none"],
					});
				}
				if (url === `${auth}register`) {
					return Response.json({
						...JSON.parse(String(init?.body)),
						client_id: "mock-client",
					});
				}
				if (url === `${auth}token`) {
					const params = new URLSearchParams(String(init?.body));
					expect(params.get("code")).toBe("mock-code");
					expect(params.get("redirect_uri")).toBe(local);
					expect(params.get("code_verifier")).toBeTruthy();
					return Response.json({
						token_type: "Bearer",
						access_token: "mock-token",
					});
				}
				if (url === mcp) {
					if (
						new Headers(init?.headers).get("authorization") !==
						"Bearer mock-token"
					) {
						return new Response(null, {
							status: 401,
							headers: {
								"www-authenticate":
									'Bearer resource_metadata="' +
									metadata +
									'", scope="full_access"',
							},
						});
					}
					const message = JSON.parse(String(init?.body));
					if (message.method === "initialize")
						return Response.json({
							jsonrpc: "2.0",
							id: message.id,
							result: {
								protocolVersion: message.params.protocolVersion,
								capabilities: { tools: {} },
								serverInfo: { name: "OpenArt", version: "1" },
							},
						});
					if (message.method === "tools/list")
						return Response.json({
							jsonrpc: "2.0",
							id: message.id,
							result: {
								tools: [
									{
										name: "example",
										description: "Example tool",
										inputSchema: { type: "object" },
									},
								],
							},
						});
					if (message.method === "notifications/initialized")
						return new Response(null, { status: 202 });
				}
				throw new Error(`Unexpected fetch: ${url}`);
			},
			{ preconnect: globalThis.fetch.preconnect },
		),
	);
	try {
		expect(
			(await POST(request("connect", "", "http://localhost:3000"))).status,
		).toBe(403);
		expect(upstream).not.toHaveBeenCalled();
		const start = await POST(request("connect"));
		expect(start.status).toBe(200);
		const cookie = start.headers.get("set-cookie")?.split(";")[0] ?? "";
		expect(start.headers.get("set-cookie")).toContain("HttpOnly");
		const authorize = new URL((await start.json()).authorizationUrl);
		expect(authorize.origin + authorize.pathname).toBe(`${auth}authorize`);
		expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
		const search = new URLSearchParams({ code: "mock-code", state: "wrong" });
		expect((await GET(callback(search, cookie))).status).toBe(400);
		search.set("state", authorize.searchParams.get("state") ?? "");
		expect((await GET(callback(search, ""))).status).toBe(400);
		expect((await GET(callback(search, cookie))).headers.get("location")).toBe(
			`${origin}/editor/test-project?openart=connected`,
		);
		expect((await GET(callback(search, cookie))).status).toBe(400);
		expect(await (await POST(request("list", cookie))).json()).toEqual({
			connected: true,
			tools: [{ name: "example", description: "Example tool" }],
		});
		await POST(request("disconnect", cookie));
		expect(await (await POST(request("status", cookie))).json()).toEqual({
			connected: false,
		});
	} finally {
		upstream.mockRestore();
	}
});
