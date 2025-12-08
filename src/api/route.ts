import { IncomingMessage, ServerResponse } from "http";
import { sendJson } from "./httpUtils.js";
import {
  handlePostKeys,
  handleGetKey,
  handlePutKey,
  handleDeleteKey,
  handleFlushKeys,
  handleListKeys,
} from "./keysHandlers.js";
import {
  handleRoot,
  handleHealth,
  handleStats,
  handleScan,
} from "./systemHandlers.js";

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  const method = req.method || "GET";
  const url = req.url || "/";

  const fullUrl = new URL(url, "http://localhost");
  const path = fullUrl.pathname;
  const segments = path.split("/").filter(Boolean);

  try {
    // GET /
    if (path === "/" && method === "GET") {
      handleRoot(res);
      return;
    }

    // GET /health
    if (path === "/health" && method === "GET") {
      handleHealth(res);
      return;
    }

    // GET /stats
    if (segments[0] === "stats" && method === "GET") {
      handleStats(res);
      return;
    }

    // GET /scan
    if (segments[0] === "scan" && method === "GET") {
      handleScan(res, fullUrl);
      return;
    }

    // À partir d'ici, on ne gère que /keys
    if (segments[0] !== "keys") {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const keyParam = segments[1];

    // POST /keys
    if (method === "POST" && !keyParam) {
      await handlePostKeys(req, res);
      return;
    }

    // GET /keys/:key
    if (method === "GET" && keyParam) {
      handleGetKey(res, keyParam);
      return;
    }

    // PUT /keys/:key
    if (method === "PUT" && keyParam) {
      await handlePutKey(req, res, keyParam);
      return;
    }

    // DELETE /keys/:key
    if (method === "DELETE" && keyParam) {
      handleDeleteKey(res, keyParam);
      return;
    }

    // DELETE /keys
    if (method === "DELETE" && !keyParam) {
      handleFlushKeys(res);
      return;
    }

    // GET /keys
    if (method === "GET" && !keyParam) {
      handleListKeys(res);
      return;
    }

    // Méthode non autorisée
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Erreur dans handleRequest:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
}
