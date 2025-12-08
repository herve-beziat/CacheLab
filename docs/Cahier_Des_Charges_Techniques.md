# Cahier des charges techniques -- Projet CacheLab

## 1. Langage choisi : Node.js / TypeScript

### 1.1. Choix du langage

Le projet impose un choix entre **Node.js/TypeScript** et **Go**.\
L'équipe a choisi **Node.js avec TypeScript**.

### 1.2. Justification

**Productivité et lisibilité**

-   TypeScript apporte :
    -   typage statique,
    -   meilleure lisibilité du code,
    -   détection d'erreurs de type à la compilation.
-   Utile pour implémenter une structure de données bas niveau
    (HashTable, TTL, resize...) de manière claire et pédagogique.

**Performances suffisantes pour un cache en mémoire**

-   Le cache fonctionne **exclusivement en RAM**.
-   Les temps d'accès sont dominés par :
    -   la complexité de la structure de données (HashTable),
    -   et non par l'overhead du langage.
-   Node.js est suffisamment performant pour un **MVP pédagogique**.

**Alignement avec l'API REST et JSON**

-   Node.js est naturellement adapté aux APIs REST et au traitement de
    JSON.
-   La sérialisation / désérialisation JSON est simple et native.

**Approche pédagogique**

-   Node.js / TypeScript est courant dans les projets web modernes.
-   Le projet permet de comprendre :
    -   le fonctionnement d'un serveur HTTP natif,
    -   le design d'une API REST,
    -   la structure interne d'une HashTable, sans framework ni ORM.

------------------------------------------------------------------------

## 2. Architecture applicative

### 2.1. Vue d'ensemble

L'architecture applicative est organisée en plusieurs modules :

``` text
src/
 ├── api/
 │    ├── route.ts              → point d’entrée du routeur HTTP
 │    ├── keysHandlers.ts       → handlers CRUD des clés
 │    ├── systemHandlers.ts     → endpoints /health, /stats, /scan
 │    ├── httpUtils.ts          → outils HTTP (sendJson, readRequestBody)
 │    ├── logger.ts             → système de logging
 │    └── store.ts              → instance unique de HashTable + métriques
 │
 ├── core/
 │    ├── hashtable.ts          → structure de données principale
 │    └── types.ts              → types Entry / Bucket
 │
 ├── tests/
 │    └── testHashTable.ts      → tests manuels de la HashTable
 │
 └── server.ts                  → serveur HTTP natif
```

### 2.2. Rôle des composants

-   **`server.ts`**
    -   Crée un serveur HTTP natif (`http.createServer`).
    -   Délègue le traitement des requêtes à `handleRequest`.
-   **`api/route.ts`**
    -   Route les requêtes selon méthode et chemin.
    -   Appelle les handlers.
    -   Gère erreurs, métriques et logging.
-   **`api/keysHandlers.ts`**
    -   Implémente CRUD sur clés :
        -   POST /keys
        -   GET /keys/:key
        -   PUT /keys/:key
        -   DELETE /keys/:key
        -   DELETE /keys
        -   GET /keys
        -   GET /keys?prefix=
-   **`api/systemHandlers.ts`**
    -   GET /
    -   GET /health
    -   GET /stats
    -   GET /scan
-   **`api/httpUtils.ts`**
    -   readRequestBody
    -   sendJson
-   **`api/logger.ts`**
    -   logInfo, logWarn, logError
-   **`api/store.ts`**
    -   Singleton HashTable
    -   Métriques globales : requestsTotal, requestsByMethod...
-   **`core/hashtable.ts`**
    -   HashTable maison : buckets, TTL, resize, iterator
-   **`core/types.ts`**
    -   Entry, Bucket

------------------------------------------------------------------------

## 3. Structure de données : Table de hachage

### Justification

-   Accès O(1) en moyenne
-   Très adaptée au stockage clé/valeur
-   Proche des structures internes de Redis
-   Simple et performante

### Fonctionnement interne

-   **hash(key)** → index
-   collisions gérées en stockant plusieurs entrées dans un même bucket
-   TTL appliqué à chaque entrée
-   Resize automatique quand loadFactor \> 0.7
-   Iterator interne pour parcourir la table

------------------------------------------------------------------------

## 4. Endpoints API (avec exemples)

### POST /keys

``` json
{ "key": "user_1", "value": "Hervé" }
```

### GET /keys/:key

``` json
{ "key": "user_1", "value": "Hervé" }
```

### PUT /keys/:key

``` json
{ "value": "Nouvelle valeur" }
```

### DELETE /keys/:key

``` json
{ "message": "Key deleted", "key": "user_1" }
```

### DELETE /keys -- flush

``` json
{ "message": "All keys deleted" }
```

### GET /keys?prefix=user\_

``` json
{
  "prefix": "user_",
  "count": 12,
  "keys": ["user_1", "user_2", "..."]
}
```

### GET /scan?cursor=0&limit=5

``` json
{
  "cursor": 5,
  "total": 12,
  "keys": ["user_11", "user_12", "user_1", "user_2", "user_3"]
}
```

### GET /stats

``` json
{
  "cache": {
    "size": 16,
    "count": 12,
    "loadFactor": 0.75,
    "defaultTtlMs": 10000
  },
  "metrics": {
    "requestsTotal": 42,
    "requestsByMethod": { "GET": 30, "POST": 10 },
    "errorsTotal": 0
  }
}
```

### GET /health

``` json
{
  "status": "ok",
  "uptimeSeconds": 123.45,
  "cache": { "size": 16, "count": 12 }
}
```

------------------------------------------------------------------------

## 5. Sécurité et gestion des erreurs

-   Validation stricte :
    -   key / value doivent être string
    -   JSON invalide → 400
-   Gestion d'erreur globale :
    -   try/catch → 500 + log + métriques.errorTotal++
-   Logging uniformisé :
    -   méthode, chemin, statut, durée
-   Monitoring :
    -   `/stats` expose métriques et état du cache

------------------------------------------------------------------------

## 6. Conclusion

Ce cahier technique décrit les choix : - du langage, - de
l'architecture, - de la structure de données, - des endpoints, - du
monitoring, - et de la gestion d'erreurs.

CacheLab fournit une base fiable, extensible et pédagogique pour
comprendre les systèmes de cache en mémoire inspirés de Redis.
