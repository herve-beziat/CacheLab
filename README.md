# 🧠 CacheLab

> **Projet pédagogique : Développement d’un mini-système de cache clé/valeur inspiré de Redis**

Ce projet a pour but de comprendre le fonctionnement interne d’un **moteur de cache en mémoire** comme Redis, en le reconstruisant de zéro en **Node.js / TypeScript**.  
L’application expose une **API RESTful** permettant de stocker, lire, modifier et supprimer des données clé/valeur, avec une gestion du **TTL (Time To Live)** et un nettoyage mémoire automatisé (**Garbage Collection**).

---

## 📋 Sommaire
- [Contexte](#-contexte)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture du projet](#-architecture-du-projet)
- [Installation](#-installation)
- [Lancement](#-lancement)
- [Endpoints API](#-endpoints-api)
- [Exemples de requêtes](#-exemples-de-requêtes)
- [Fonctionnement interne](#-fonctionnement-interne)
- [Justification technique](#-justification-technique)
- [Éco-conception et sécurité](#-éco-conception-et-sécurité)

---

## 🧩 Contexte
CacheLab est une startup spécialisée dans les solutions de performance web.  
Elle souhaite proposer à ses clients e-commerce une solution de **cache mémoire** permettant :
- de **soulager les bases de données** pendant les pics de trafic (Black Friday, soldes) ;
- de **réduire la latence** grâce à un accès en mémoire (RAM) plutôt qu’en disque.

Ton rôle : concevoir un **MVP (Minimum Viable Product)** d’un système clé/valeur performant, sans dépendances externes.

---

## ⚙️ Fonctionnalités
✅ Stockage en mémoire clé/valeur  
✅ TTL configurable par clé (expiration automatique)  
✅ Nettoyage périodique des données expirées (GC)  
✅ API REST complète : CRUD (`Create`, `Read`, `Update`, `Delete`)  
✅ Validation basique et sécurité minimale  
✅ Aucune dépendance externe (HTTP natif, sans Express)  
✅ Entièrement en **TypeScript**

---

## 🏗️ Architecture du projet

```
CacheLab/
├── src/
│   ├── core/
│   │   ├── HashTable.ts          # Structure de données clé/valeur (HashMap maison)
│   │   └── types.ts              # Types partagés
│   ├── api/
│   │   └── routes.ts             # Routes REST (POST, GET, PUT, DELETE)
│   ├── utils/
│   │   └── parser.ts             # Parseurs HTTP et helpers de réponse
│   └── server.ts                 # Point d’entrée du serveur
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧰 Installation

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/prenom-nom/CacheLab.git
cd CacheLab
```

### 2️⃣ Installer les dépendances
```bash
npm install
```

### 3️⃣ Compiler (si besoin)
```bash
npm run build
```

---

## 🚀 Lancement

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

> Le serveur écoute sur [http://localhost:8080](http://localhost:8080)

---

## 🌐 Endpoints API

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **POST** | `/keys` | Créer une nouvelle clé/valeur |
| **GET** | `/keys/:key` | Récupérer la valeur d’une clé |
| **PUT** | `/keys/:key` | Modifier la valeur ou le TTL d’une clé |
| **DELETE** | `/keys/:key` | Supprimer une clé |
| **GET** | `/keys` | (Optionnel) Lister toutes les clés |

---

## 🧪 Exemples de requêtes `curl`

### 🟢 Créer une clé
```bash
curl -X POST http://localhost:8080/keys      -H "Content-Type: application/json"      -d '{"key":"user42","value":"Hervé","ttlMs":10000}'
```

➡️ Réponse :
```json
{ "key": "user42", "value": "Hervé", "ttlMs": 10000 }
```

---

### 🔵 Lire une clé
```bash
curl http://localhost:8080/keys/user42
```
➡️
```json
{ "key": "user42", "value": "Hervé" }
```

---

### 🟠 Modifier une clé
```bash
curl -X PUT http://localhost:8080/keys/user42      -H "Content-Type: application/json"      -d '{"value":"BEZIAT"}'
```

---

### 🔴 Supprimer une clé
```bash
curl -X DELETE http://localhost:8080/keys/user42
```

---

### ⚪ Lister toutes les clés
```bash
curl http://localhost:8080/keys
```
➡️
```json
{ "keys": ["user42", "temp", "panier_01"] }
```

---

## 🔄 Fonctionnement interne

### 🧮 1. Structure de données : HashMap maison
- Le cache repose sur une **table de hachage** divisée en *buckets* (`Entry[]`).
- Chaque clé est convertie en **index** via un algorithme de hachage **djb2**.
- Les **collisions** sont gérées par **chaînage** (plusieurs entrées dans le même bucket).

### 🕒 2. TTL (Time To Live)
Chaque entrée peut avoir une durée de vie (en ms).  
Exemple :
```ts
store.set("session_123", "data", 5000); // expire après 5s
```

Deux mécanismes de suppression :
1. **Lazy delete** : une clé expirée est supprimée lors d’un `GET`.
2. **Sweep** : un nettoyage automatique (`sweepExpired()`) s’exécute toutes les 5 secondes. ( à venir)

### 🧹 3. Garbage Collection (GC)
Le GC parcourt les buckets et supprime les entrées expirées.
Cela garantit une mémoire propre sans fuite à long terme.

### 🔐 4. Sécurité basique
- Taille de body limitée à 1 Mo (`payload too large`)
- Validation de type sur `key` et `value`
- Réponses JSON uniformes
- CORS activé pour les tests front

---

## 🧠 Justification technique

### Choix : **HashMap (Table de Hachage)**
- Accès en **O(1)** (amorti) pour `GET` et `SET`
- Structure adaptée aux caches mémoire
- Simple à implémenter avec des boucles (`while`), sans `Map`, `filter`, etc.

### Alternative possible : **Tableau trié + Recherche dichotomique**
- Plus lente en insertion (O(n))
- Meilleure pour des données immuables
- Non retenue ici car le cache nécessite rapidité et flexibilité.

---

## 🌱 Éco-conception et sécurité

### ⚡ Optimisations mémoire
- Nettoyage automatique des clés expirées
- Pas de stockage sur disque → pas d’I/O lourdes
- Code minimaliste (aucune dépendance externe)

### 🔒 Sécurité
- Validation stricte des entrées utilisateur
- Limitation du payload JSON
- CORS restreint configurable
- Possibilité d’ajouter ultérieurement :
  - Authentification par clé API
  - Logging des accès
  - Chiffrement des valeurs sensibles

---

## 🧾 Licence
Projet académique – reproduction du fonctionnement d’un système de cache Redis à but pédagogique.  
© 2025 — CacheLab Project.
