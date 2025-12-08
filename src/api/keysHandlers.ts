import { IncomingMessage, ServerResponse } from "http";
import { store } from "./store.js";
import { readRequestBody, sendJson } from "./httpUtils.js";

/**
 * POST /keys
 * Body attendu : { "key": "name", "value": "Hervé" }
 */
export async function handlePostKeys(req: IncomingMessage, res: ServerResponse) {
  const rawBody = await readRequestBody(req);

  let data: any;
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const key = data.key;
  const value = data.value;

  if (typeof key !== "string" || typeof value !== "string") {
    sendJson(res, 400, { error: "key and value must be strings" });
    return;
  }

  // Création + écrasement (comme Redis SET)
  store.set(key, value);

  sendJson(res, 201, { message: "Key created or updated", key, value });
}

/**
 * GET /keys/:key
 */
export function handleGetKey(res: ServerResponse, key: string) {
  const value = store.get(key);

  if (value === null) {
    sendJson(res, 404, { error: "Key not found" });
    return;
  }

  sendJson(res, 200, { key, value });
}

/**
 * PUT /keys/:key
 * Body attendu : { "value": "nouvelle valeur" }
 */
export async function handlePutKey(
  req: IncomingMessage,
  res: ServerResponse,
  key: string
) {
  const rawBody = await readRequestBody(req);

  let data: any;
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const value = data.value;

  if (typeof value !== "string") {
    sendJson(res, 400, { error: "value must be a string" });
    return;
  }

  // On vérifie que la clé existe avant de la mettre à jour
  const existing = store.get(key);
  if (existing === null) {
    sendJson(res, 404, { error: "Key not found" });
    return;
  }

  store.set(key, value);
  sendJson(res, 200, { message: "Key updated", key, value });
}

/**
 * DELETE /keys/:key
 */
export function handleDeleteKey(res: ServerResponse, key: string) {
  const deleted = store.delete(key);

  if (!deleted) {
    sendJson(res, 404, { error: "Key not found" });
    return;
  }

  sendJson(res, 200, { message: "Key deleted", key });
}

/**
 * DELETE /keys
 * Supprimer toutes les clés
 */
export function handleFlushKeys(res: ServerResponse) {
  store.clear();
  sendJson(res, 200, { message: "All keys deleted" });
}

/**
 * GET /keys
 * Lister toutes les clés
 */
export function handleListKeys(res: ServerResponse) {
  const keys = store.keys();
  sendJson(res, 200, { keys });
}
