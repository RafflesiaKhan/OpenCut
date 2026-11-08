import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { GET } from "./route";

const fetchMock = spyOn(globalThis, "fetch");
afterEach(() => fetchMock.mockReset());
afterAll(() => fetchMock.mockRestore());

test("rejects malformed resource IDs without requesting an upstream", async () => {
	const response = await GET(
		new Request(
			"http://localhost/api/extension-resource?kind=guide&id=..%2Fbad",
		),
	);
	expect(response.status).toBe(400);
	expect(fetchMock).not.toHaveBeenCalled();
});

test("proxies a fixed YouTube endpoint and passes only the expected media type", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response("{}", {
			headers: { "content-type": "application/json; charset=utf-8" },
		}),
	);
	const response = await GET(
		new Request(
			"http://localhost/api/extension-resource?kind=youtube&id=dQw4w9WgXcQ",
		),
	);
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toBe("application/json");
	expect(fetchMock.mock.calls[0][0]).toBe(
		"https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&format=json",
	);
});

test("rejects Google Doc redirects outside the export host", async () => {
	fetchMock.mockResolvedValueOnce(
		Response.redirect("https://example.com/redirect"),
	);
	const response = await GET(
		new Request("http://localhost/api/extension-resource?kind=guide&id=test"),
	);
	expect(response.status).toBe(502);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("returns plain text from an allowed public Google Docs export redirect", async () => {
	const exportUrl = "https://doc-test-docs.googleusercontent.com/export";
	fetchMock
		.mockResolvedValueOnce(Response.redirect(exportUrl))
		.mockResolvedValueOnce(
			new Response("A short style guide", {
				headers: { "content-type": "text/plain; charset=utf-8" },
			}),
		);
	const response = await GET(
		new Request("http://localhost/api/extension-resource?kind=guide&id=test"),
	);
	expect(response.status).toBe(200);
	expect(await response.text()).toBe("A short style guide");
	expect(String(fetchMock.mock.calls[1][0])).toBe(exportUrl);
});
