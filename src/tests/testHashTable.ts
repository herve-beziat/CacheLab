import { HashTable } from "../core/hashtable.js";

console.log("=== TEST CONSTRUCTEUR ===");
const table = new HashTable();  // 8 buckets par défaut
console.log("Instance de HashTable créée:", table);

// Test de la fonction de hash (accès via cast any pour test uniquement)
console.log("=== TEST HASH ===");
console.log("hash('a') =>", (table as any)["hash"]("a"));
console.log("hash('b') =>", (table as any)["hash"]("b"));
console.log("hash('abc') =>", (table as any)["hash"]("abc"));
console.log("hash('user_42') =>", (table as any)["hash"]("user_42"));

// Test de la fonction set()
console.log("=== TEST SET ===");
table.set("name", "Hervé");
table.set("city", "Mazaugues");
table.set("job", "Dev web");
table.set("hello", "world");

console.log("Buckets internes après set():");
console.log((table as any).buckets);

// Test de la fonction get()
console.log("=== TEST GET ===");
console.log("get('name') =>", table.get("name"));
console.log("get('city') =>", table.get("city"));
console.log("get('job') =>", table.get("job"));
console.log("get('hello') =>", table.get("hello"));
console.log("get('unknown') =>", table.get("unknown")); // doit être null


// Test de la fonction delete()
console.log("=== TEST DELETE ===");
console.log("delete('city') =>", table.delete("city"));   // true
console.log("delete('unknown') =>", table.delete("unknown")); // false

console.log("Buckets après delete():");
console.log((table as any).buckets);

// Vérification : la clé doit avoir disparu
console.log("get('city') après delete =>", table.get("city")); // null


// Test de la fonction keys()
console.log("=== TEST KEYS ===");
console.log("keys() =>", table.keys());




// Test du redimensionnement
console.log("=== TEST RESIZE ===");
const tableResize = new HashTable(4, 10_000); // petite table pour tester le resize rapidement

tableResize.set("key1", "value1");
tableResize.set("key2", "value2");
tableResize.set("key3", "value3"); // à ce stade, le load factor est de 0.75, le resize doit se déclencher

console.log("Taille après inserts (attendu > 4) :", (tableResize as any).size);
console.log("Clés dans tableResize:", tableResize.keys());

// Test du TTL
console.log("=== TEST TTL ===");
const ttlTable = new HashTable(8, 2000); // TTL = 2 secondes
ttlTable.set("temp", "42");

console.log("immédiat, get('temp') =>", ttlTable.get("temp"));

setTimeout(() => {
  console.log("après 3s, get('temp') =>", ttlTable.get("temp"));
  console.log("après 3s, keys() =>", ttlTable.keys());
}, 3000);