const COOKIE = "ft_admin";
const enc = new TextEncoder();
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function unb64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
async function signature(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}
export async function makeSession(secret) {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + 12 * 60 * 60 * 1000 })));
  return payload + "." + await signature(payload, secret);
}
export async function isAdmin(request, secret) {
  if (!secret) return false;
  const raw = request.headers.get("Cookie") || "";
  const token = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    if (sig !== await signature(payload, secret)) return false;
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    return Number(data.exp) > Date.now();
  } catch { return false; }
}
export function sessionCookie(token) {
  return COOKIE + "=" + token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200";
}
export function clearSessionCookie() {
  return COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}
