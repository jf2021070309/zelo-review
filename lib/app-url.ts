/** URL pública base para armar enlaces (avisos al gerente, QR, etc.). */
export function getBaseUrlFromRequest(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host && /^(localhost|127\.|192\.168\.|10\.)/.test(host) ? "http" : "https");
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/+$/, "");
  if (host) return `${proto}://${host}`;
  return (env || "http://localhost:3000").replace(/\/+$/, "");
}
