import { HashTable } from "../core/hashtable.js";

// 🧠 Notre "mini Redis" en mémoire (singleton)
export const store = new HashTable();
