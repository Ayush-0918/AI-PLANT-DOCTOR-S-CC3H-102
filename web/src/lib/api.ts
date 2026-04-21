export function getBackendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}


export function getBackendAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${getBackendBaseUrl()}${path}`;
}


export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
