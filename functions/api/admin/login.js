import { makeSession, sessionCookie } from "../../_lib/auth.js";
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "Admin secrets are not configured in Cloudflare." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const supplied = String(body.password || "");
  const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, "0")).join("");
  if (await digest(supplied) !== await digest(env.ADMIN_PASSWORD)) return json({ error: "Wrong password." }, 401);
  const token = await makeSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" });
}
