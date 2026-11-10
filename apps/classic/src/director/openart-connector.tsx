"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Tool = { name: string; description?: string };
type Action = "status" | "connect" | "list" | "disconnect";

async function openArt(
	action: Action,
	projectId: string,
	signal?: AbortSignal,
) {
	const response = await fetch("/api/director/openart", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action, projectId }),
		signal,
	});
	return { ok: response.ok, result: await response.json() };
}

export function OpenArtConnector({ projectId }: { projectId: string }) {
	const [connected, setConnected] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [tools, setTools] = useState<Tool[]>();
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		const url = new URL(window.location.href);
		if (url.searchParams.has("openart")) {
			setExpanded(true);
			if (url.searchParams.get("openart") === "failed") {
				setError("OpenArt sign-in did not finish. Try connecting again.");
			}
			url.searchParams.delete("openart");
			window.history.replaceState(window.history.state, "", url);
		}
		openArt("status", projectId, controller.signal)
			.then(({ result }) => {
				if (!controller.signal.aborted) setConnected(result.connected === true);
			})
			.catch(() => undefined);
		return () => controller.abort();
	}, [projectId]);

	async function run(action: Exclude<Action, "status">) {
		setBusy(true);
		setError("");
		try {
			const { ok, result } = await openArt(action, projectId);
			if (typeof result.connected === "boolean") setConnected(result.connected);
			if (!ok) throw new Error(result.error ?? "OpenArt request failed.");
			if (action === "connect" && result.authorizationUrl) {
				window.location.assign(result.authorizationUrl);
			} else {
				setTools(result.tools);
			}
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "OpenArt request failed.",
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<details
			className="rounded-md border p-2"
			open={expanded}
			onToggle={(event) => setExpanded(event.currentTarget.open)}
		>
			<summary className="cursor-pointer text-sm">OpenArt MCP</summary>
			<div className="mt-2 flex flex-col gap-2">
				<p className="text-muted-foreground text-xs">
					{connected
						? "Connected for this Classic session."
						: "Sign in to OpenArt to see its available tools."}
				</p>
				<div className="flex flex-wrap gap-2">
					{connected ? (
						<>
							<Button
								size="sm"
								variant="outline"
								disabled={busy}
								onClick={() => run("list")}
							>
								List tools
							</Button>
							<Button
								size="sm"
								variant="ghost"
								disabled={busy}
								onClick={() => run("disconnect")}
							>
								Disconnect
							</Button>
						</>
					) : (
						<Button
							size="sm"
							variant="outline"
							disabled={busy}
							onClick={() => run("connect")}
						>
							Connect OpenArt
						</Button>
					)}
				</div>
				{error && (
					<p role="alert" className="text-destructive text-xs">
						{error}
					</p>
				)}
				{connected &&
					tools &&
					(tools.length ? (
						<ul className="flex flex-col gap-2 text-xs">
							{tools.map(({ name, description }) => (
								<li key={name}>
									<p className="font-medium break-words">{name}</p>
									{description && (
										<p className="text-muted-foreground break-words">
											{description}
										</p>
									)}
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-xs">
							OpenArt returned no tools.
						</p>
					))}
			</div>
		</details>
	);
}
