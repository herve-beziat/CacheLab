import { HashTable } from "../core/hashtable.js";

const table = new HashTable();  // 8 buckets par défaut

console.log("Instance de HashTable créée:", table);

// Test de la fonction de hash (accès via cast any pour test uniquement)
console.log("hash('a') =>", (table as any)["hash"]("a"));
console.log("hash('b') =>", (table as any)["hash"]("b"));
console.log("hash('abc') =>", (table as any)["hash"]("abc"));
console.log("hash('user_42') =>", (table as any)["hash"]("user_42"));