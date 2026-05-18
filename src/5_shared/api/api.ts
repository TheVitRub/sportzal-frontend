export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function getToken() {
  return localStorage.getItem('workout_token') ?? '';
}

export function setToken(token: string) {
  localStorage.setItem('workout_token', token);
}

export function clearToken() {
  localStorage.removeItem('workout_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload ? String(payload.error) : String(payload);
    throw new Error(message || 'Ошибка запроса');
  }

  return payload as T;
}

export async function downloadFile(path: string, fileName: string) {
  const headers = new Headers();
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) {
    throw new Error('Не удалось скачать файл');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

