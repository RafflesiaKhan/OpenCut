import { useSyncExternalStore } from "react";

const storageKey = "gemini_api_key";
const changedEvent = "opencut:gemini-image-key";

export function readGeminiImageKey() {
	return sessionStorage.getItem(storageKey) ?? "";
}

export function saveGeminiImageKey(key: string) {
	sessionStorage.setItem(storageKey, key);
	window.dispatchEvent(new Event(changedEvent));
}

function subscribe(listener: () => void) {
	window.addEventListener(changedEvent, listener);
	return () => window.removeEventListener(changedEvent, listener);
}

export function useGeminiImageKey() {
	return useSyncExternalStore(subscribe, readGeminiImageKey, () => "");
}
