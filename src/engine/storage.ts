const DB_NAME = 'LoveQuestStorage';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';
const STORE_CONFIG = 'config';

export interface StoredAsset {
    id: string;
    type: 'photo' | 'audio';
    name: string;
    data: Blob;
    url: string; // Object URL (created at runtime, not stored)
    text?: string; // Custom text for photos
    createdAt: number;
}

// Internal interface for storage (without url)
interface StoredAssetData {
    id: string;
    type: 'photo' | 'audio';
    name: string;
    data: Blob;
    text?: string;
    createdAt: number;
}

export interface GameConfig {
    key: string;
    value: any;
}

export class StorageManager {
    private db: IDBDatabase | null = null;
    private objectUrls: Map<string, string> = new Map();

    private getOrCreateObjectUrl(assetId: string, data: Blob): string {
        const existingUrl = this.objectUrls.get(assetId);
        if (existingUrl) {
            return existingUrl;
        }

        const url = URL.createObjectURL(data);
        this.objectUrls.set(assetId, url);
        return url;
    }

    private replaceObjectUrl(assetId: string, data: Blob): string {
        this.revokeObjectUrl(assetId);
        const url = URL.createObjectURL(data);
        this.objectUrls.set(assetId, url);
        return url;
    }

    private revokeObjectUrl(assetId: string): void {
        const existingUrl = this.objectUrls.get(assetId);
        if (!existingUrl) return;
        URL.revokeObjectURL(existingUrl);
        this.objectUrls.delete(assetId);
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_ASSETS)) {
                    db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_CONFIG)) {
                    db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
                }
            };
        });
    }

    async saveAsset(id: string, type: 'photo' | 'audio', name: string, data: Blob, text?: string): Promise<StoredAsset> {
        if (!this.db) throw new Error('Storage not initialized');

        const assetData: StoredAssetData = {
            id,
            type,
            name,
            data,
            text,
            createdAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
            const store = transaction.objectStore(STORE_ASSETS);
            const request = store.put(assetData);

            request.onsuccess = () => {
                const assetUrl = this.replaceObjectUrl(id, data);
                resolve({ ...assetData, url: assetUrl });
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAsset(id: string): Promise<StoredAsset | null> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readonly');
            const store = transaction.objectStore(STORE_ASSETS);
            const request = store.get(id);

            request.onsuccess = () => {
                const assetData = request.result as StoredAssetData | undefined;
                if (assetData) {
                    const url = this.getOrCreateObjectUrl(assetData.id, assetData.data);
                    resolve({ ...assetData, url });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAllAssets(type?: 'photo' | 'audio'): Promise<StoredAsset[]> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readonly');
            const store = transaction.objectStore(STORE_ASSETS);
            const request = store.getAll();

            request.onsuccess = () => {
                const assetsData = request.result as StoredAssetData[];
                const assets: StoredAsset[] = assetsData.map(assetData => {
                    const url = this.getOrCreateObjectUrl(assetData.id, assetData.data);
                    return { ...assetData, url };
                });
                if (type) {
                    resolve(assets.filter(a => a.type === type));
                } else {
                    resolve(assets);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updatePhotoText(id: string, text: string): Promise<void> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
            const store = transaction.objectStore(STORE_ASSETS);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const assetData = getRequest.result as StoredAssetData | undefined;
                if (!assetData) {
                    reject(new Error('Asset not found'));
                    return;
                }
                
                assetData.text = text;
                const putRequest = store.put(assetData);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteAsset(id: string): Promise<void> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
            const store = transaction.objectStore(STORE_ASSETS);
            const request = store.delete(id);

            request.onsuccess = () => {
                this.revokeObjectUrl(id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async setConfig(key: string, value: any): Promise<void> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_CONFIG], 'readwrite');
            const store = transaction.objectStore(STORE_CONFIG);
            const request = store.put({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getConfig(key: string): Promise<any> {
        if (!this.db) throw new Error('Storage not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_CONFIG], 'readonly');
            const store = transaction.objectStore(STORE_CONFIG);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result as GameConfig | undefined;
                resolve(result?.value);
            };
            request.onerror = () => reject(request.error);
        });
    }

    cleanup(): void {
        this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
        this.objectUrls.clear();
    }
}

export const storage = new StorageManager();
