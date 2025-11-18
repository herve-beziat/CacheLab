import { IncomingMessage, ServerResponse } from "http";

//fonction qui gère les requêtes HTTP entrantes
// Cette fonction est appelée à chaque fois qu'une requête est reçue
// Elle envoie une réponse JSON indiquant que l'API est en ligne
export function handleRequest(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "✅ API en ligne" }));
}
