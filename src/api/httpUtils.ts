import { IncomingMessage, ServerResponse } from "http";

/**
 * Lit le body de la requête (en texte brut)
 */
export function readRequestBody(req: IncomingMessage): Promise<string> {
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
export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown
) {
  const json = JSON.stringify(payload, null, 2);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(json);
}
