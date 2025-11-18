// Une Entry (entrée du cache) représente une seule donnée stockée dans le système.
// Chaque entrée a une clé, une valeur et une date d'expiration optionnelle.
//Exemple : {
//   "key": "user_42",
//   "value": "{\"name\": \"Hervé\"}",
//   "expiresAt": 1728774512345
// }
export type Entry = {
    key: string;
    value: string;
    expireAt: number | null; // Unix timestamp in milliseconds or null for no expiration
};

// Un Bucket est une collection d'entrées.
// Chaque Bucket est représenté comme un tableau d'objets Entry.
// Exemple : [
//   { "key": "user_42", "value": "{\"name\": \"Hervé\"}", "expiresAt": 1728774512345 },
//   { "key": "session_abc", "value": "{\"token\": \"xyz\"}", "expiresAt": null }
// ]
export type Bucket = Entry[];