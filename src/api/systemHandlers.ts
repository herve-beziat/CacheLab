import { ServerResponse } from "http";
import { store } from "./store.js";
import { sendJson } from "./httpUtils.js";

/**
 * GET /
 * Message simple de bienvenue
 */
export function handleRoot(res: ServerResponse) {
  sendJson(res, 200, { message: "✅ CacheLab API en ligne" });
}

/**
 * GET /health
 */
export function handleHealth(res: ServerResponse) {
  const uptimeSeconds = process.uptime();
  const stats = store.getStats();

  sendJson(res, 200, {
    status: "ok",
    uptimeSeconds,
    cache: {
      size: stats.size,
      count: stats.count,
      loadFactor: stats.loadFactor,
      defaultTtlMs: stats.defaultTtlMs,
    },
  });
}

/**
 * GET /stats
 */
export function handleStats(res: ServerResponse) {
  const stats = store.getStats();
  sendJson(res, 200, stats);
}

/**
 * GET /scan?cursor=0&limit=10
 * Itération paginée sur les clés du cache
 */
export function handleScan(res: ServerResponse, url: URL) {
  const params = url.searchParams;

  const cursor = Number(params.get("cursor") ?? "0");
  const limit = Number(params.get("limit") ?? "10");

  if (
    !Number.isInteger(cursor) ||
    cursor < 0 ||
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    sendJson(res, 400, { error: "Invalid cursor or limit" });
    return;
  }

  // On utilise l'iterator interne pour récupérer toutes les clés TTL-valides
  const allKeys: string[] = [];
  for (const entry of store) {
    allKeys.push(entry.key);
  }

  const total = allKeys.length;

  if (total === 0) {
    sendJson(res, 200, {
      cursor: 0,
      total: 0,
      keys: [],
    });
    return;
  }

  const slice = allKeys.slice(cursor, cursor + limit);

  let nextCursor = cursor + slice.length;
  if (nextCursor >= total) {
    nextCursor = 0;
  }

  sendJson(res, 200, {
    cursor: nextCursor,
    total,
    keys: slice,
  });
}
