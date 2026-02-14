import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'love-quest-assets';
const ASSETS_TABLE = 'game_assets';
const CONFIG_TABLE = 'game_config';

type AssetType = 'photo' | 'audio';

interface AssetRow {
    id: string;
    type: AssetType;
    name: string;
    path: string;
    text: string | null;
    created_at: string;
}

interface StorageListItem {
    name: string;
    id?: string;
    updated_at?: string;
}

export interface StoredAsset {
    id: string;
    type: AssetType;
    name: string;
    data: Blob;
    url: string;
    text?: string;
    createdAt: number;
}

export interface GameConfig {
    key: string;
    value: any;
}

export class StorageManager {
    private supabase: SupabaseClient | null = null;
    private initialized = false;
    private hasAssetsTable = true;
    private hasConfigTable = true;

    private getClient(): SupabaseClient {
        if (!this.supabase) throw new Error('Storage not initialized');
        return this.supabase;
    }

    private getPublicUrl(path: string): string {
        const { data } = this.getClient().storage.from(BUCKET_NAME).getPublicUrl(path);
        return data.publicUrl;
    }

    private toStoredAsset(row: AssetRow): StoredAsset {
        return {
            id: row.id,
            type: row.type,
            name: row.name,
            data: new Blob(),
            url: this.getPublicUrl(row.path),
            text: row.text || undefined,
            createdAt: new Date(row.created_at).getTime()
        };
    }

    private sanitizeName(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    }

    private buildAssetPath(id: string, type: AssetType, name: string): string {
        const folder = type === 'photo' ? 'photos' : 'audio';
        return `${folder}/${id}-${this.sanitizeName(name)}`;
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { error: assetsError } = await this.supabase.from(ASSETS_TABLE).select('id').limit(1);
        if (assetsError) {
            if (assetsError.code === 'PGRST205') {
                this.hasAssetsTable = false;
                console.warn(`Table "${ASSETS_TABLE}" not found. Falling back to bucket-only mode.`);
            } else {
                throw new Error(`Supabase init failed: ${assetsError.message}`);
            }
        }

        const { error: configError } = await this.supabase.from(CONFIG_TABLE).select('key').limit(1);
        if (configError) {
            if (configError.code === 'PGRST205') {
                this.hasConfigTable = false;
                console.warn(`Table "${CONFIG_TABLE}" not found. Config persistence disabled.`);
            } else {
                throw new Error(`Supabase init failed: ${configError.message}`);
            }
        }

        this.initialized = true;
    }

    async saveAsset(id: string, type: AssetType, name: string, data: Blob, text?: string): Promise<StoredAsset> {
        const client = this.getClient();
        const path = this.buildAssetPath(id, type, name);

        const { error: uploadError } = await client.storage
            .from(BUCKET_NAME)
            .upload(path, data, {
                upsert: true,
                contentType: data.type || undefined
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const now = new Date().toISOString();
        const row: AssetRow = {
            id,
            type,
            name,
            path,
            text: type === 'photo' ? (text || null) : null,
            created_at: now
        };

        if (this.hasAssetsTable) {
            const { error: rowError } = await client
                .from(ASSETS_TABLE)
                .upsert(row, { onConflict: 'id' });

            if (rowError) {
                throw new Error(`Failed to save asset metadata: ${rowError.message}`);
            }
        }

        return this.toStoredAsset(row);
    }

    async getAsset(id: string): Promise<StoredAsset | null> {
        const client = this.getClient();
        const { data, error } = await client
            .from(ASSETS_TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch asset: ${error.message}`);
        }

        if (!data) return null;
        return this.toStoredAsset(data as AssetRow);
    }

    async getAllAssets(type?: AssetType): Promise<StoredAsset[]> {
        if (!this.hasAssetsTable) return [];

        const client = this.getClient();
        let query = client.from(ASSETS_TABLE).select('*').order('created_at', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch assets: ${error.message}`);
        }

        return (data as AssetRow[]).map((row) => this.toStoredAsset(row));
    }

    async updatePhotoText(id: string, text: string): Promise<void> {
        if (!this.hasAssetsTable) {
            throw new Error('Photo text update requires metadata table');
        }

        const client = this.getClient();
        const { error } = await client
            .from(ASSETS_TABLE)
            .update({ text })
            .eq('id', id)
            .eq('type', 'photo');

        if (error) {
            throw new Error(`Failed to update photo text: ${error.message}`);
        }
    }

    async deleteAsset(id: string): Promise<void> {
        if (!this.hasAssetsTable) {
            throw new Error('Delete by id requires metadata table');
        }

        const client = this.getClient();

        const { data, error: findError } = await client
            .from(ASSETS_TABLE)
            .select('path')
            .eq('id', id)
            .maybeSingle();

        if (findError) {
            throw new Error(`Failed to find asset: ${findError.message}`);
        }

        if (data?.path) {
            const { error: storageError } = await client.storage.from(BUCKET_NAME).remove([data.path]);
            if (storageError) {
                throw new Error(`Failed to delete asset file: ${storageError.message}`);
            }
        }

        const { error: deleteError } = await client
            .from(ASSETS_TABLE)
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw new Error(`Failed to delete asset metadata: ${deleteError.message}`);
        }
    }

    async setConfig(key: string, value: any): Promise<void> {
        if (!this.hasConfigTable) return;

        const client = this.getClient();
        const { error } = await client
            .from(CONFIG_TABLE)
            .upsert({ key, value }, { onConflict: 'key' });

        if (error) {
            throw new Error(`Failed to save config: ${error.message}`);
        }
    }

    async getConfig(key: string): Promise<any> {
        if (!this.hasConfigTable) return null;

        const client = this.getClient();
        const { data, error } = await client
            .from(CONFIG_TABLE)
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch config: ${error.message}`);
        }

        const row = data as GameConfig | null;
        return row?.value;
    }

    async listBucketAssets(type: AssetType): Promise<StoredAsset[]> {
        const client = this.getClient();
        const folder = type === 'photo' ? 'photos' : 'audio';

        const { data, error } = await client.storage
            .from(BUCKET_NAME)
            .list(folder, {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            throw new Error(`Failed to list bucket assets: ${error.message}`);
        }

        return (data as StorageListItem[])
            .filter((item) => !!item.name && !item.name.endsWith('/'))
            .map((item, index) => {
                const path = `${folder}/${item.name}`;
                const ts = item.updated_at ? new Date(item.updated_at).getTime() : Date.now() + index;
                return {
                    id: item.id || `${folder}_${index}_${item.name}`,
                    type,
                    name: item.name,
                    data: new Blob(),
                    url: this.getPublicUrl(path),
                    text: undefined,
                    createdAt: Number.isNaN(ts) ? Date.now() + index : ts
                } satisfies StoredAsset;
            });
    }

    cleanup(): void {
        // No cleanup needed for Supabase public URLs.
    }
}

export const storage = new StorageManager();
