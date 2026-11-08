import { expect, test } from "bun:test";
import { extensionImageFile } from "../extension-image-file";

test("preserves generated image bytes, MIME type and extension", async () => {
	const file = extensionImageFile("data:image/jpeg;base64,AQID", "sample");
	expect(file.name).toBe("sample.jpg");
	expect(file.type).toBe("image/jpeg");
	expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([1, 2, 3]);
});

test("rejects remote URLs, SVGs and malformed base64", () => {
	for (const value of [
		"https://example.com/sample.png",
		"data:image/svg+xml;base64,AQID",
		"data:image/png;base64,?",
	]) {
		expect(() => extensionImageFile(value, "sample")).toThrow();
	}
});
