const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error?.message || 'Request failed.');
    error.code = payload.error?.code || 'REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const healthApi = {
  check: () => fetchJson('/api/health')
};
