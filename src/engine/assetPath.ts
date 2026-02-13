export function resolveAssetPath(assetPath: string): string {
    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const normalizedAssetPath = assetPath.replace(/^\/+/, '');
    return `${normalizedBase}${normalizedAssetPath}`;
}
