export async function GET(request: Request) {
	const params = new URL(request.url).searchParams;
	const kind = params.get("kind");
	const id = params.get("id") ?? "";

	let url: string;
	let contentType: string;
	if (kind === "guide" && /^[A-Za-z0-9_-]{1,128}$/.test(id)) {
		url = `https://docs.google.com/document/d/${id}/export?format=txt`;
		contentType = "text/plain";
	} else if (kind === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(id)) {
		const watchUrl = encodeURIComponent(
			`https://www.youtube.com/watch?v=${id}`,
		);
		url = `https://www.youtube.com/oembed?url=${watchUrl}&format=json`;
		contentType = "application/json";
	} else if (kind === "thumbnail" && /^[A-Za-z0-9_-]{11}$/.test(id)) {
		url = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
		contentType = "image/jpeg";
	} else {
		return new Response("Invalid public resource.", { status: 400 });
	}

	try {
		const options = {
			redirect: "manual",
			signal: AbortSignal.timeout(7500),
		} as const;
		let upstream = await fetch(url, options);
		const location = upstream.headers.get("location");
		if (
			kind === "guide" &&
			location &&
			upstream.status >= 300 &&
			upstream.status < 400
		) {
			const redirect = new URL(location, url);
			if (
				redirect.protocol === "https:" &&
				!redirect.port &&
				(redirect.hostname === "docs.googleusercontent.com" ||
					redirect.hostname.endsWith("-docs.googleusercontent.com"))
			) {
				upstream = await fetch(redirect, options);
			}
		}
		if (!upstream.ok) {
			return new Response("Public resource unavailable.", {
				status: upstream.status === 404 ? 404 : 502,
			});
		}
		const mimeType = upstream.headers.get("content-type")?.split(";")[0].trim();
		if (mimeType !== contentType) {
			return new Response("Unexpected public resource type.", { status: 502 });
		}
		return new Response(upstream.body, {
			headers: {
				"Content-Type": contentType,
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch {
		return new Response("Public resource lookup failed.", { status: 502 });
	}
}
