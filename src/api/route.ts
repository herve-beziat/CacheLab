import { IncomingMessage, ServerResponse } from "http";
import { HashTable } from "../core/hashtable.js";

// 🧠 Notre "mini Redis" en mémoire
const store = new HashTable();

/**
 * Lit le body de la requête (en texte brut)
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      resolve(data);
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Envoie une réponse JSON standardisée
 */
function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  const json = JSON.stringify(payload, null, 2);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(json);
}

/**
 * Fonction principale appelée pour chaque requête HTTP
 */
export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || "GET";
  const url = req.url || "/";

  // On construit une URL complète pour pouvoir utiliser l’API URL
  const fullUrl = new URL(url, "http://localhost");
  const path = fullUrl.pathname; // ex: "/keys", "/keys/name"
  const segments = path.split("/").filter(Boolean); // ["keys"], ["keys","name"]

  // Healthcheck simple sur la racine
  if (path === "/" && method === "GET") {
    sendJson(res, 200, { message: "✅ CacheLab API en ligne" });
    return;
  }

    // Endpoint de monitoring: GET /stats
  if (segments[0] === "stats" && method === "GET") {
    const stats = store.getStats();
    sendJson(res, 200, stats);
    return;
  }

  // On veut seulement gérer les routes qui commencent par /keys
  if (segments[0] !== "keys") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const keyParam = segments[1]; // undefined pour /keys, ou "name" pour /keys/name

  try {
    // POST /keys → créer une nouvelle clé/valeur
    if (method === "POST" && !keyParam) {
      await handlePostKeys(req, res);
      return;
    }

    // GET /keys/:key → récupérer la valeur d'une clé
    if (method === "GET" && keyParam) {
      handleGetKey(res, keyParam);
      return;
    }

    // PUT /keys/:key → modifier la valeur d'une clé existante
    if (method === "PUT" && keyParam) {
      await handlePutKey(req, res, keyParam);
      return;
    }

    // DELETE /keys/:key → supprimer une clé
    if (method === "DELETE" && keyParam) {
      handleDeleteKey(res, keyParam);
      return;
    }

    // GET /keys → lister toutes les clés (optionnel)
    if (method === "GET" && !keyParam) {
      handleListKeys(res);
      return;
    }

    // Si on arrive ici, c’est une méthode non gérée pour /keys
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Erreur dans handleRequest:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
}

/**
 * POST /keys
 * Body attendu : { "key": "name", "value": "Hervé" }
 */
async function handlePostKeys(req: IncomingMessage, res: ServerResponse) {
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

  // Ici on autorise création + écrasement (comme Redis SET)
  store.set(key, value);

  sendJson(res, 201, { message: "Key created or updated", key, value });
}

/**
 * GET /keys/:key
 */
function handleGetKey(res: ServerResponse, key: string) {
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
async function handlePutKey(
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
function handleDeleteKey(res: ServerResponse, key: string) {
  const deleted = store.delete(key);

  if (!deleted) {
    sendJson(res, 404, { error: "Key not found" });
    return;
  }

  sendJson(res, 200, { message: "Key deleted", key });
}

/**
 * GET /keys
 * Lister toutes les clés
 */
function handleListKeys(res: ServerResponse) {
  const keys = store.keys();
  sendJson(res, 200, { keys });
}
