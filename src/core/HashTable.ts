import { Entry, Bucket } from "./types.js";

// Une HashTable est une collection de Buckets.
// Chaque Bucket est identifié par une clé de hachage (hashKey).
// Exemple : { "user_42": [ { "key": "user_42", "value": "{\"name\": \"Hervé\"}", "expiresAt": 1728774512345 } ] }
export class HashTable {
  private buckets: Bucket[];
  private size: number;
  private count: number;

  constructor(size: number = 8) {
    this.size = size;     // nombre de buckets (8 par défaut)
    this.buckets = new Array(size);   // tableau de 8 buckets (tous undefined au départ)
    this.count = 0;   // aucune clé stockée au départ
    console.log(`✅ HashTable initialisée avec ${this.size} buckets`);
  }

  // Fonction de hash : transforme une clé en un numéro entre 0 et size-1
  private hash(key:string): number {
    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      const code = key.charCodeAt(i);    // code ASCII du caractère
      hash = (hash + code ) % this.size;  // reste de la division pour rester dans [0...size-1]
    }

    return hash;
  }
}
