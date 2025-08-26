export function getUserIdFromToken(token?: string): string | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    const json = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    return payload.sub ?? payload.id ?? null;
  } catch {
    return null;
  }
}
