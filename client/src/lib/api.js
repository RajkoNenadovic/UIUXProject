// Thin fetch wrapper. Every failure becomes an ApiError with a `code` that the UI
// translates (errors.<CODE> in the locale files). Raw server text is never shown.
export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

// AuthProvider registers a callback here so that any request answered with 401 (the session
// ended in the background) sends the person back to the sign-in screen instead of showing a broken page.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(navigator.onLine === false ? 'OFFLINE' : 'NETWORK', 0);
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Not JSON (for example the dev proxy answering while the API is down).
  }
  if (!response.ok) {
    const fallback = response.status >= 500 ? 'SERVER_UNAVAILABLE' : 'INTERNAL_ERROR';
    const code = data?.error?.code || fallback;
    // /auth/* answers are handled by the sign-in screen itself (for example "wrong password").
    if (code === 'UNAUTHENTICATED' && !path.startsWith('/auth/')) unauthorizedHandler?.();
    throw new ApiError(code, response.status);
  }
  return data;
}

// "Offline" is only claimed when the browser itself reports no connection.
// A failed request while the browser is online means the server is unreachable (shown as a normal error).
export function isOfflineError(error) {
  return error?.code === 'OFFLINE';
}

export function errorMessage(t, error) {
  const code = error?.code || 'INTERNAL_ERROR';
  return t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') });
}
