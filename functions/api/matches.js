import { isAdmin } from "../_lib/auth.js";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const KEY = "fulltoss:matches";
export async function onRequestGet({ env }) {
  if (!env.MATCHES_KV) return json({ error: "MATCHES_KV binding is missing." }, 503);
  const saved = await env.MATCHES_KV.get(KEY, "json");
  return json(saved && Array.isArray(saved.matches) ? saved : { matches: [] });
}
export async function onRequestPut({ request, env }) {
  if (!env.MATCHES_KV) return json({ error: "MATCHES_KV binding is missing." }, 503);
  if (!await isAdmin(request, env.SESSION_SECRET)) return json({ error: "Please log in again." }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  if (!data || !Array.isArray(data.matches)) return json({ error: "Expected an object with a matches array." }, 400);
  if (data.matches.length > 500) return json({ error: "Maximum 500 matches allowed." }, 400);
  await env.MATCHES_KV.put(KEY, JSON.stringify({ matches: data.matches, updatedAt: new Date().toISOString() }));
  return json({ ok: true, count: data.matches.length });
}
