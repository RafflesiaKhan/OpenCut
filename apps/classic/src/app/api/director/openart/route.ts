import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	type OAuthClientProvider,
	UnauthorizedError,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import { z } from "zod";

const endpoint = new URL("https://mcp.openart.ai/mcp");
const cookie = "opencut-openart-session";
const path = "/api/director/openart";
const maxAge = 8 * 60 * 60;
const connectSchema = z.object({
	action: z.literal("connect"),
	projectId: z.string().regex(/^[\w-]{1,100}$/),
});
type Session = {
	origin: string;
	projectId: string;
	expires: number;
	auth: OAuthClientProvider;
	pending?: {
		state: string;
		expires: number;
		connection: StreamableHTTPClientTransport;
	};
};
// shortcut: process-local sessions, use shared storage if Classic runs across workers.
const sessions = new Map<string, Session>();

function json(data: object, status = 200) {
	return NextResponse.json(data, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

function localOrigin(request: Request) {
	const host = request.headers.get("host") ?? "";
	return /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host)
		? `http://${host}`
		: null;
}

function getSession(request: Request, origin: string) {
	const id = request.headers
		.get("cookie")
		?.match(/(?:^|;\s*)opencut-openart-session=([a-f0-9-]{36})(?:;|$)/)?.[1];
	const session = id ? sessions.get(id) : undefined;
	return id &&
		session &&
		session.origin === origin &&
		session.expires > Date.now()
		? { id, session }
		: null;
}

function transport(auth: OAuthClientProvider) {
	return new StreamableHTTPClientTransport(endpoint, {
		authProvider: auth,
		fetch: (input, init) => {
			const url = new URL(input);
			if (
				url.username ||
				url.password ||
				(url.origin !== endpoint.origin && url.origin !== "https://openart.ai")
			) {
				throw new Error("Unexpected OpenArt OAuth host");
			}
			const timeout = AbortSignal.timeout(15_000);
			return fetch(url, {
				...init,
				redirect: "error",
				signal: init?.signal
					? AbortSignal.any([init.signal, timeout])
					: timeout,
			});
		},
	});
}

export async function POST(request: Request) {
	const origin = localOrigin(request);
	const site = request.headers.get("sec-fetch-site");
	if (
		!origin ||
		request.headers.get("origin") !== origin ||
		(site && site !== "same-origin")
	) {
		return json({ error: "Open OpenArt from a local OpenCut page." }, 403);
	}
	if (
		request.headers.get("content-type")?.split(";")[0] !== "application/json"
	) {
		return json({ error: "Expected a JSON OpenArt request." }, 415);
	}
	const body = await request.json().catch(() => null);
	const current = getSession(request, origin);
	const connected = Boolean(await current?.session.auth.tokens());
	if (body?.action === "status") return json({ connected });
	if (body?.action === "disconnect") {
		if (current) sessions.delete(current.id);
		const response = json({ connected: false });
		response.cookies.set(cookie, "", { path, maxAge: 0 });
		return response;
	}
	const client = new Client({ name: "OpenCut Director", version: "1.0.0" });
	if (body?.action === "list") {
		if (!current || !connected) return json({ connected: false });
		const connection = transport(current.session.auth);
		try {
			await client.connect(connection);
			const { tools } = await client.listTools();
			return json({
				connected: true,
				tools: tools.map(({ name, description }) => ({ name, description })),
			});
		} catch (cause) {
			if (cause instanceof UnauthorizedError) {
				sessions.delete(current.id);
				return json(
					{
						connected: false,
						error: "OpenArt sign-in expired. Connect again.",
					},
					401,
				);
			}
			return json({ error: "Could not load OpenArt tools. Try again." }, 502);
		} finally {
			if (connection.sessionId)
				await connection.terminateSession().catch(() => undefined);
			await client.close();
		}
	}
	const input = connectSchema.safeParse(body);
	if (!input.success) return json({ error: "Invalid OpenArt request." }, 400);
	if (connected) return json({ connected });
	const now = Date.now();
	for (const [id, entry] of sessions) {
		if (entry.expires <= now || (entry.pending && entry.pending.expires <= now))
			sessions.delete(id);
	}
	if (sessions.size >= 32)
		return json({ error: "Too many OpenArt sessions. Try again later." }, 429);
	const id = crypto.randomUUID();
	const state = crypto.randomUUID();
	let information: Awaited<
		ReturnType<OAuthClientProvider["clientInformation"]>
	>;
	let tokens: Awaited<ReturnType<OAuthClientProvider["tokens"]>>;
	let verifier = "";
	let authorizationUrl: string | undefined;
	let discovery:
		| Parameters<NonNullable<OAuthClientProvider["saveDiscoveryState"]>>[0]
		| undefined;
	const redirectUrl = origin + path;
	const auth: OAuthClientProvider = {
		redirectUrl,
		clientMetadata: {
			client_name: "OpenCut Director",
			redirect_uris: [redirectUrl],
			grant_types: ["authorization_code", "refresh_token"],
			token_endpoint_auth_method: "none",
		},
		state: () => state,
		clientInformation: () => information,
		saveClientInformation: (value) => {
			information = value;
		},
		tokens: () => tokens,
		saveTokens: (value) => {
			tokens = value;
		},
		discoveryState: () => discovery,
		saveDiscoveryState: (value) => {
			discovery = value;
		},
		redirectToAuthorization: (url) => {
			if (
				url.origin + url.pathname !==
					"https://openart.ai/suite/api/auth/oauth/authorize" ||
				url.username ||
				url.password
			) {
				throw new Error("Unexpected OpenArt authorization URL");
			}
			authorizationUrl = url.href;
		},
		codeVerifier: () => verifier,
		saveCodeVerifier: (value) => {
			verifier = value;
		},
	};
	const connection = transport(auth);
	try {
		await client.connect(connection);
	} catch (cause) {
		if (!(cause instanceof UnauthorizedError) || !authorizationUrl) {
			return json(
				{ error: "Could not start OpenArt sign-in. Try again." },
				502,
			);
		}
	} finally {
		await client.close();
	}
	if (!authorizationUrl)
		return json({ error: "OpenArt did not request sign-in." }, 502);
	if (current) sessions.delete(current.id);
	sessions.set(id, {
		origin,
		projectId: input.data.projectId,
		expires: now + maxAge * 1000,
		auth,
		pending: { state, connection, expires: now + 10 * 60_000 },
	});
	const response = json({ authorizationUrl });
	response.cookies.set(cookie, id, {
		httpOnly: true,
		sameSite: "lax",
		path,
		maxAge,
	});
	return response;
}

export async function GET(request: Request) {
	const origin = localOrigin(request);
	if (!origin)
		return json({ error: "Open OpenArt from a local OpenCut page." }, 403);
	const current = getSession(request, origin);
	const pending = current?.session.pending;
	const params = new URL(request.url).searchParams;
	if (
		!current ||
		!pending ||
		pending.expires <= Date.now() ||
		pending.state !== params.get("state")
	) {
		return json(
			{
				error:
					"OpenArt sign-in expired or is invalid. Reopen Director to try again.",
			},
			400,
		);
	}
	delete current.session.pending;
	const code = params.get("code");
	const editor = new URL(`/editor/${current.session.projectId}`, origin);
	try {
		if (!code || params.has("error"))
			throw new Error("Authorization not granted");
		await pending.connection.finishAuth(code);
		editor.searchParams.set("openart", "connected");
	} catch {
		sessions.delete(current.id);
		editor.searchParams.set("openart", "failed");
	}
	return NextResponse.redirect(editor, {
		status: 303,
		headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
	});
}
