// Sideline Planner — Cloudflare Worker.
// Serves index.html as a static asset and handles the saved-layouts API:
//   GET    /api/layouts       list saved layouts
//   GET    /api/layouts/:id   open one layout
//   PUT    /api/layouts/:id   save one layout
//   DELETE /api/layouts/:id   delete one layout
// Layouts are stored in the KV namespace bound as LAYOUTS (see wrangler.jsonc).
// Without that binding the API answers 503 and the planner saves in each browser instead.

const MAX_BYTES = 1_000_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/layouts" || url.pathname.startsWith("/api/layouts/")) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env, url) {
  if (!env.LAYOUTS) return json({ error: "Storage isn't connected. Add the LAYOUTS KV namespace in wrangler.jsonc." }, 503);
  const rest = url.pathname.slice("/api/layouts".length).replace(/^\/+|\/+$/g, "");

  if (!rest) {
    if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);
    const layouts = [];
    let cursor;
    do {
      const page = await env.LAYOUTS.list({ prefix: "layout:", cursor });
      for (const k of page.keys) {
        layouts.push({ id: k.name.slice(7), name: k.metadata?.name || "Untitled layout", updatedAt: k.metadata?.updatedAt || 0 });
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    layouts.sort((a, b) => b.updatedAt - a.updatedAt);
    return json({ layouts });
  }

  const id = decodeURIComponent(rest);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return json({ error: "Invalid layout id." }, 400);
  const key = `layout:${id}`;

  if (request.method === "GET") {
    const doc = await env.LAYOUTS.get(key, "json");
    return doc ? json(doc) : json({ error: "Layout not found." }, 404);
  }
  if (request.method === "PUT") {
    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ error: "Layout is too large to save." }, 413);
    let doc;
    try { doc = JSON.parse(text); } catch { return json({ error: "Layout data isn't valid JSON." }, 400); }
    if (!doc || typeof doc !== "object" || !doc.data || !Array.isArray(doc.data.items) || !Array.isArray(doc.data.conns)) {
      return json({ error: "Layout data is missing items or connections." }, 400);
    }
    const name = String(doc.name || "Untitled layout").slice(0, 120);
    const updatedAt = Date.now();
    await env.LAYOUTS.put(key, JSON.stringify({ name, updatedAt, data: doc.data }), { metadata: { name, updatedAt } });
    return json({ ok: true, id, updatedAt });
  }
  if (request.method === "DELETE") {
    await env.LAYOUTS.delete(key);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed." }, 405);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
