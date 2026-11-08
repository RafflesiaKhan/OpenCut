import catalogue from "./catalogue.json";

export const sfxKitSource = "https://github.com/wyzowl/sfx-kit";
const rawRevision = `https://raw.githubusercontent.com/wyzowl/sfx-kit/${catalogue.revision}`;

export const sfxCategories = catalogue.categories;
export type SfxSound = (typeof catalogue.sounds)[number];

const categoryNames = new Map(
	sfxCategories.map(({ id, title }) => [id, title]),
);
const searchableSounds = catalogue.sounds.map((sound) => ({
	sound,
	text: `${sound.name} ${categoryNames.get(sound.category)} ${sound.keywords}`.toLowerCase(),
}));

export function searchSfxKit(query: string, category: string) {
	const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
	return searchableSounds
		.filter(
			({ sound, text }) =>
				(!category || sound.category === category) &&
				terms.every((term) => text.includes(term)),
		)
		.map(({ sound }) => sound);
}

export function sfxAudioUrl(sound: SfxSound) {
	return `${rawRevision}/${sound.file}`;
}
