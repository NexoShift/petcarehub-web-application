import { environment } from '../../../environments/environment';

/**
 * El backend devuelve rutas como "/api/v1/ai/vision-analyses/5/image".
 * Esto les pone delante el servidor de environment.apiBaseUrl (http://localhost:8080).
 */
export function absoluteApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const origin = environment.apiBaseUrl.startsWith('http') ? new URL(environment.apiBaseUrl).origin : '';
  return origin + path;
}
