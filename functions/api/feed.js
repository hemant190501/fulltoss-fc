export async function onRequestGet() {
  const baseUrl = "https://fulltosslive.pages.dev/data/";
  try {
    const [fanRes, codeRes] = await Promise.all([
      fetch(baseUrl + "fan.json", { cf: { cacheTtl: 30 } }),
      fetch(baseUrl + "fancode.json", { cf: { cacheTtl: 30 } })
    ]);
    if (!fanRes.ok) throw new Error("FanCode match feed unavailable");
    const fan = await fanRes.json();
    const code = codeRes.ok ? await codeRes.json() : { matches: [] };
    const extra = new Map((code.matches || []).map(m => [String(m.match_id), m]));
    const merged = new Map();
    for (const m of (fan.matches || [])) {
      const id = String(m.match_id || "");
      if (!id) continue;
      merged.set(id, { ...m, ...(extra.get(id) || {}) });
    }
    for (const m of (code.matches || [])) {
      const id = String(m.match_id || "");
      if (!id) continue;
      merged.set(id, { ...(merged.get(id) || {}), ...m });
    }
    const matches = [...merged.values()].sort((a, b) => {
      const live = (b.status === "LIVE") - (a.status === "LIVE");
      if (live) return live;
      return String(a.startTime || "").localeCompare(String(b.startTime || ""));
    });
    return new Response(JSON.stringify({ matches, count: matches.length }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, matches: [], count: 0 }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
}