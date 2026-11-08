import { expect, test } from "bun:test";
import { searchSfxKit, sfxAudioUrl, sfxCategories } from "./catalogue";

test("indexes all 320 sounds with short usage notes under the 28 published categories", () => {
	const all = searchSfxKit("", "");
	expect(all).toHaveLength(320);
	expect(sfxCategories).toHaveLength(28);
	expect(new Set(all.map(({ id }) => id)).size).toBe(320);
	expect(new Set(all.map(({ file }) => file)).size).toBe(320);
	for (const category of sfxCategories) {
		expect(searchSfxKit("", category.id)).toHaveLength(category.count);
	}
	for (const sound of all) {
		expect(sound.file).toMatch(/^sounds\/[\w-]+\/[\w-]+\.wav$/);
		expect(sound.duration).toBeGreaterThan(0);
		expect(sound.useFor).toMatch(/^[^\r\n]{1,95}$/);
	}
});

test("combines case-insensitive search with category filtering", () => {
	const whoosh = searchSfxKit("  FAST hard ", "whooshes");
	expect(whoosh.find(({ id }) => id === "whoosh-fast-hard")?.useFor).toBe(
		"Whip pans · Fast cuts between scenes",
	);
	expect(whoosh.every(({ category }) => category === "whooshes")).toBe(true);
	expect(searchSfxKit("whip pans", "whooshes").length).toBeGreaterThan(0);
	expect(searchSfxKit("no-matching-effect-123", "")).toEqual([]);
	expect(sfxAudioUrl(whoosh[0])).toContain(
		"/92780e7ab0cdfb557497a988089c47f46e8c7412/sounds/",
	);
});
