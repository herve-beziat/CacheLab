import { HashTable } from "../core/hashtable.js";

// 🧠 Notre "mini Redis" en mémoire (singleton)
export const store = new HashTable();

// Mini système de métriques basiques
export const metrics = {
    requestsTotal: 0,
    requestsByMethod: {} as Record<string, number>,
    errorsTotal: 0,
}