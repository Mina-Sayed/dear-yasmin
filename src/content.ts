import { storage, StoredAsset } from "./engine/storage";
import { resolveAssetPath } from "./engine/assetPath";

export interface Memory {
    id: number;
    text: string;
    img: string;
}

const UPLOAD_NAME_PREFIX = /^photo_\d+_[a-z0-9]+-/i;

function normalizePhotoKey(name: string): string {
    return name.trim().toLowerCase().replace(UPLOAD_NAME_PREFIX, '');
}

function pickPreferredAsset(current: StoredAsset | undefined, incoming: StoredAsset): StoredAsset {
    if (!current) return incoming;

    const currentHasText = !!(current.text && current.text.trim());
    const incomingHasText = !!(incoming.text && incoming.text.trim());

    if (incomingHasText && !currentHasText) return incoming;
    if (incoming.createdAt > current.createdAt) return incoming;
    return current;
}

function mergeUniquePhotos(tablePhotos: StoredAsset[], bucketPhotos: StoredAsset[]): StoredAsset[] {
    const textByKey = new Map<string, string>();
    const bucketByKey = new Map<string, StoredAsset>();
    const tableByKey = new Map<string, StoredAsset>();
    const orderedKeys: string[] = [];
    const keySeen = new Set<string>();

    const rememberOrder = (key: string) => {
        if (keySeen.has(key)) return;
        keySeen.add(key);
        orderedKeys.push(key);
    };

    for (const photo of tablePhotos) {
        const key = normalizePhotoKey(photo.name);
        if (photo.text && photo.text.trim()) {
            textByKey.set(key, photo.text);
        }
        tableByKey.set(key, pickPreferredAsset(tableByKey.get(key), photo));
    }

    for (const photo of bucketPhotos) {
        const key = normalizePhotoKey(photo.name);
        bucketByKey.set(key, pickPreferredAsset(bucketByKey.get(key), photo));
        rememberOrder(key);
    }

    for (const key of tableByKey.keys()) {
        rememberOrder(key);
    }

    return orderedKeys
        .map((key) => {
            const base = bucketByKey.get(key) || tableByKey.get(key);
            if (!base) return null;
            const text = textByKey.get(key) || base.text;
            return text ? { ...base, text } : base;
        })
        .filter((asset): asset is StoredAsset => !!asset);
}

// Default memories (fallback)
export const defaultMemories: Memory[] = [
    { id: 1, text: "Our first date at the coffee shop ☕", img: resolveAssetPath("assets/photos/p1.jpg") },
    { id: 2, text: "The trip to the beach 🌊", img: resolveAssetPath("assets/photos/p2.jpg") },
    { id: 3, text: "Your graduation day 🎓", img: resolveAssetPath("assets/photos/p3.jpg") },
    { id: 4, text: "That time we got lost hiking 🏔️", img: resolveAssetPath("assets/photos/p4.jpg") },
    { id: 5, text: "Cooking dinner together 🍝", img: resolveAssetPath("assets/photos/p5.jpg") },
];

// Reactive GameData that can be updated
export const GameData = {
    heroName: "Yasmin",
    secretCode: "30924",
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
            const [tablePhotos, bucketPhotos] = await Promise.all([
                storage.getAllAssets('photo'),
                storage.listBucketAssets('photo')
            ]);

            const photos = mergeUniquePhotos(tablePhotos, bucketPhotos);
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
            const [tableAudioAssets, bucketAudioAssets] = await Promise.all([
                storage.getAllAssets('audio'),
                storage.listBucketAssets('audio')
            ]);
            const audioAssets = bucketAudioAssets.length > 0 ? bucketAudioAssets : tableAudioAssets;

            if (audioAssets.length > 0) {
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
