/**
 * Shared API Configuration & Endpoint Helpers
 *
 * Resolves the backend API base URL using Vite environment variables (VITE_API_URL).
 * Falls back to local development server (http://localhost:8000) when not configured.
 */

export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:8000'
).replace(/\/+$/, '');

/**
 * Constructs a fully qualified API endpoint URL.
 * Automatically handles leading/trailing slashes.
 *
 * @param path - API path (e.g. '/api/cases' or 'api/cases')
 * @returns Fully qualified API URL
 */
export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
