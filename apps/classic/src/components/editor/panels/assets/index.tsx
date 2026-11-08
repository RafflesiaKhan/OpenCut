"use client";

import "./extension-panel.css";

import { AIImageView } from "@/ai-image/components/assets-view";
import { ImageBatcherView } from "@/image-batcher/components/assets-view";
import { MurfVoiceoverView } from "@/murf-voiceover/components/assets-view";
import { YouTubeGetView } from "@/youtube-get/components/assets-view";
import { Separator } from "@/components/ui/separator";
import {
	type Tab,
	useAssetsPanelStore,
} from "@/components/editor/panels/assets/assets-panel-store";
import { TabBar } from "./tabbar";
import { Captions } from "@/subtitles/components/assets-view";
import { MediaView } from "./views/assets";
import { SettingsView } from "./views/settings";
import { SoundsView } from "@/sounds/components/assets-view";
import { StickersView } from "@/stickers/components/assets-view";
import { TextView } from "@/text/components/assets-view";
import { EffectsView } from "@/effects/components/assets-view";
import { VoiceView } from "@/ai-voice/components/assets-view";

const extensionViews = {
	"murf-voiceover": MurfVoiceoverView,
	"ai-image": AIImageView,
	"image-batcher": ImageBatcherView,
	"youtube-get": YouTubeGetView,
};

export function AssetsPanel() {
	const { activeTab } = useAssetsPanelStore();

	const viewMap: Record<
		Exclude<Tab, keyof typeof extensionViews>,
		React.ReactNode
	> = {
		media: <MediaView />,
		sounds: <SoundsView />,
		voice: <VoiceView />,
		text: <TextView />,
		stickers: <StickersView />,
		effects: <EffectsView />,
		transitions: (
			<div className="text-muted-foreground p-4">
				Transitions view coming soon...
			</div>
		),
		captions: <Captions />,
		adjustment: (
			<div className="text-muted-foreground p-4">
				Adjustment view coming soon...
			</div>
		),
		settings: <SettingsView />,
	};

	return (
		<div className="panel bg-background flex h-full rounded-sm border overflow-hidden">
			<TabBar />
			<Separator orientation="vertical" />
			<div className="min-w-0 flex-1 overflow-hidden">
				{activeTab in viewMap && viewMap[activeTab as keyof typeof viewMap]}
				{Object.entries(extensionViews).map(([tab, View]) => (
					<div className="h-full" hidden={activeTab !== tab} key={tab}>
						<View />
					</div>
				))}
			</div>
		</div>
	);
}
