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
    private objectUrls: string[] = [];

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

        // Revoke old URL if exists
        await this.deleteAsset(id);

        const url = URL.createObjectURL(data);
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
                this.objectUrls.push(url);
                resolve({ ...assetData, url });
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
                    // Create fresh object URL from stored blob
                    const url = URL.createObjectURL(assetData.data);
                    this.objectUrls.push(url);
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
                    // Create fresh object URL from stored blob
                    const url = URL.createObjectURL(assetData.data);
                    this.objectUrls.push(url);
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

        const existing = await this.getAsset(id);
        if (existing?.url) {
            URL.revokeObjectURL(existing.url);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
            const store = transaction.objectStore(STORE_ASSETS);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
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
        this.objectUrls.forEach(url => URL.revokeObjectURL(url));
        this.objectUrls = [];
    }
}

export const storage = new StorageManager();
