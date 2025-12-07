import { Entry, Bucket } from "./types.js";

// Une HashTable est une collection de Buckets.
// Chaque Bucket est identifié par une clé de hachage (hashKey).
// Exemple : { "user_42": [ { "key": "user_42", "value": "{\"name\": \"Hervé\"}", "expiresAt": 1728774512345 } ] }
export class HashTable {
  private buckets: Bucket[];
  private size: number;
  private count: number;
  private defaultTtlMs : number | null; // TTl global par défaut en ms

  constructor(size: number = 8, defaultTtlMs: number | null = 10_000) {
    this.size = size; // nombre de buckets (8 par défaut)
    this.buckets = new Array(size); // tableau de 8 buckets (tous undefined au départ)
    this.count = 0; // aucune clé stockée au départ
    this.defaultTtlMs = defaultTtlMs; // TTL par défaut : 10 secondes (10000 ms). Mettre à null pour désactiver le TTL.
    console.log(`HashTable initialisée avec ${this.size} buckets (TTL par défaut : ${this.defaultTtlMs} ms)`);
  }

  // Fonction de hash : transforme une clé en un numéro entre 0 et size-1
  private hash(key: string): number {
    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      const code = key.charCodeAt(i); // code ASCII du caractère
      hash = (hash + code) % this.size; // reste de la division pour rester dans [0...size-1]
    }

    return hash;
  }

  // Ajout d'une fonction isExpired pour vérifier si une entrée a expiré
  private isExpired(entry: Entry): boolean {
    if (entry.expireAt === null) {
      return false; // pas de TTl pour cette entrée
    }
    return entry.expireAt < Date.now();
  }

  // Ajoute ou met à jour une entrée dans la table de hachage
  public set(key: string, value: string): void {
    const index = this.hash(key); // 1) on récupère l'index du bucket
    let bucket = this.buckets[index]; // 2) on récupère le bucket à cet index
    if (!bucket) {
      // 3) si le bucket n'existe pas encore, on le crée
      bucket = [];
      this.buckets[index] = bucket; // initialisation du bucket s'il n'existe pas
    }
    // 4) calcul de l'expiration pour cette écriture
    let expireAt: number | null = null;
    if (this.defaultTtlMs !== null) {
      expireAt = Date.now() + this.defaultTtlMs;
    }
    // 5) on cherche si la clé existe déjà dans le bucket
    for (let i = 0; i < bucket.length; i++) {
      const entry = bucket[i];
      if (entry.key === key) {
        // Clé trouvée --> on met à jour la valeur et on réinitialise le TTL
        entry.value = value;
        entry.expireAt = expireAt; // On réinitialise l'expiration
        return;
      }
    }

    // 6) clé non trouvée --> on ajoute une nouvelle entrée
    const newEntry: Entry = {
      key,
      value,
      expireAt, // Utilisation de la valeur calculée pour l'expiration
    };
    bucket.push(newEntry);
    this.count++; // nouvelle clé stockée
  }

  // Récupère la valeur associée à une clé, ou null si elle n'existe pas
  public get(key: string): string | null {
    const index = this.hash(key); // 1) on calcule l'index
    const bucket = this.buckets[index]; // 2) on récupère le bucket

    // 3) si le bucket n'existe pas, la clé n'existe pas
    if (!bucket) {
      return null;
    }

    // 4) on parcourt le bucket pour chercher la clé
    for (let i = 0; i < bucket.length; i++) {
      const entry = bucket[i];

      if (entry.key === key) {
        // ✔️ clé trouvée → on vérifie si elle a expiré
        if (this.isExpired(entry)) {
          // entrée expirée → on la supprime et on retourne null
          bucket.splice(i, 1);
          this.count--;
          return null;
        }
        return entry.value;
      }
    }

    // 5) si on n'a rien trouvé → la clé n'existe pas
    return null;
  }

  // Supprime une entrée. Retourne true si la clé existait, sinon false.
  public delete(key: string): boolean {
    const index = this.hash(key); // 1) hash
    const bucket = this.buckets[index]; // 2) récupérer le bucket

    // 3) bucket vide → clé inexistante
    if (!bucket) {
      return false;
    }

    // 4) rechercher la clé
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        // ✔️ clé trouvée → on supprime
        bucket.splice(i, 1);
        this.count--;

        // si le bucket devient vide, on peut éventuellement le laisser vide
        // ou mettre undefined. (Pour l'instant on le laisse vide)
        return true;
      }
    }

    // 5) clé non trouvée
    return false;
  }

  // Retourne la liste de toutes les clés présentes dans la table
  public keys(): string[] {
    const result: string[] = [];

    // Parcours de tous les buckets
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];

      if (!bucket) continue; // bucket vide, on passe

      let j = 0;
      while (j < bucket.length) {
        const entry = bucket[j];

        if (this.isExpired(entry)) {
          // on supprime l'entrée expirée
          bucket.splice(j, 1);
          this.count--;
          // on ne fait PAS j++, car le tableau a rétréci
          continue;
        }

        result.push(entry.key);
        j++;
      }
    }

    return result;
  }
}
