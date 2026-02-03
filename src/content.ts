import { storage } from "./engine/storage";

export interface Memory {
    id: number;
    text: string;
    img: string;
}

// Default memories (fallback)
export const defaultMemories: Memory[] = [
    { id: 1, text: "Our first date at the coffee shop ☕", img: "/assets/photos/p1.jpg" },
    { id: 2, text: "The trip to the beach 🌊", img: "/assets/photos/p2.jpg" },
    { id: 3, text: "Your graduation day 🎓", img: "/assets/photos/p3.jpg" },
    { id: 4, text: "That time we got lost hiking 🏔️", img: "/assets/photos/p4.jpg" },
    { id: 5, text: "Cooking dinner together 🍝", img: "/assets/photos/p5.jpg" },
];

// Reactive GameData that can be updated
export const GameData = {
    heroName: "Yasmin",
    secretCode: "2024",
    finalMessage: "Happy Anniversary my love! ❤️\nHere's to many more adventures together.",
    memories: [...defaultMemories] as Memory[],
    level2StarsToWin: 10,
    useCustomBGM: false,
    customBGMUrl: null as string | null,

    // Load custom content from storage
    async loadCustomContent(): Promise<void> {
        try {
            await storage.init();

            // Load custom photos
            const photos = await storage.getAllAssets('photo');
            if (photos.length > 0) {
                // Replace default memories with custom photos and their text
                this.memories = photos.map((photo, index) => ({
                    id: index + 1,
                    text: photo.text || defaultMemories[index]?.text || `Memory ${index + 1} ❤️`,
                    img: photo.url
                }));
            } else {
                this.memories = [...defaultMemories];
            }

            // Load custom audio
            const useCustom = await storage.getConfig('useCustomBGM');
            const audioAssets = await storage.getAllAssets('audio');
            if (useCustom && audioAssets.length > 0) {
                this.useCustomBGM = true;
                this.customBGMUrl = audioAssets[0].url;
            } else {
                this.useCustomBGM = false;
                this.customBGMUrl = null;
            }
        } catch (e) {
            console.error('Failed to load custom content:', e);
            this.memories = [...defaultMemories];
        }
    },

    // Reset to defaults
    resetToDefaults(): void {
        this.memories = [...defaultMemories];
        this.useCustomBGM = false;
        this.customBGMUrl = null;
    }
};
