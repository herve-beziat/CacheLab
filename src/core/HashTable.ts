import { Entry, Bucket } from "./types";

// Une HashTable est une collection de Buckets.
// Chaque Bucket est identifié par une clé de hachage (hashKey).
// Exemple : { "user_42": [ { "key": "user_42", "value": "{\"name\": \"Hervé\"}", "expiresAt": 1728774512345 } ] }
export class HashTable {
  constructor() {
    console.log("✅ HashTable initialisée");
  }
}
