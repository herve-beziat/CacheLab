import { createServer } from "http";
import { handleRequest } from "./api/route.js";

const PORT = 8080;
const server = createServer(handleRequest);

//Point d'entrée de l'app
//Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 CacheLab server running on http://localhost:${PORT}`);
});
