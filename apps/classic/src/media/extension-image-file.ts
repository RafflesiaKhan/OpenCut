const imageExtensions = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
};

export function extensionImageFile(dataUrl: string, name: string): File {
	const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
	if (!match) throw new Error("The provider returned an unsupported image.");
	const mimeType = match[1] as keyof typeof imageExtensions;
	const bytes = Uint8Array.from(atob(match[2]), (byte) => byte.charCodeAt(0));
	return new File([bytes], `${name}.${imageExtensions[mimeType]}`, {
		type: mimeType,
	});
}
