async function resolveShortLink(url: string) {
	const response = await fetch(url, {
		method: "GET",
		redirect: "follow",
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
		},
	});
	return response.url;
}

export async function parseGoogleMapsLink(url: string) {
	let finalUrl = url;

	if (url.includes("goo.gl") || url.includes("google.com/maps")) {
		try {
			finalUrl = await resolveShortLink(url);
		} catch {
			return null;
		}
	}

	const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
	if (atMatch) {
		return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]) };
	}

	const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
	if (dataMatch) {
		return { latitude: parseFloat(dataMatch[1]), longitude: parseFloat(dataMatch[2]) };
	}

	const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
	if (qMatch) {
		return { latitude: parseFloat(qMatch[1]), longitude: parseFloat(qMatch[2]) };
	}

	return null;
}