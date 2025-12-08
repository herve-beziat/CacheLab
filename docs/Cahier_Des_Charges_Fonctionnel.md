# Cahier des charges fonctionnel – Projet CacheLab

## 1. Contexte et objectifs

Les clients de CacheLab sont des sites e-commerce confrontés à des problèmes de lenteur lors des pics de trafic (soldes, Black Friday, campagnes marketing, etc.).  
Leur architecture actuelle repose sur une base de données relationnelle traditionnelle (SQL) qui devient un **goulot d’étranglement** lorsque le nombre de requêtes simultanées augmente fortement.

L’objectif du projet CacheLab est de fournir un **système de cache clé/valeur en mémoire**, inspiré des principes de Redis, permettant de :

- Réduire la charge sur la base de données principale.
- Accélérer l’accès aux données les plus consultées (produits, utilisateurs, paniers).
- Offrir une interface simple (API REST) pour l’intégrer facilement dans des applications existantes.

Le livrable attendu est un **MVP fonctionnel** pouvant servir de base de test avec un premier client pilote.


## 2. Périmètre fonctionnel

Le système CacheLab couvre les besoins suivants :

- Stockage temporaire de paires **clé/valeur** en mémoire.
- Accès rapide à ces paires via une **API REST**.
- Suppression et mise à jour des données stockées.
- Gestion d’une durée de vie (TTL) pour éviter l’accumulation de données inutiles.
- Exposition d’informations de **santé** et de **statistiques** pour le monitoring.
- Possibilité de parcourir et filtrer les clés pour des usages d’administration.

Ce MVP ne couvre **pas** :

- La persistance sur disque des données (reboot = perte des données).
- La gestion de la haute disponibilité (cluster, réplication).
- La gestion fine des droits / authentification (peut être ajoutée dans une version ultérieure).


## 3. Besoins du client

### 3.1. Performances attendues

Le client attend :

- Des temps de réponse **très faibles** pour les accès cache, typiquement :
  - GET sur une clé existante : **quelques millisecondes** (accès mémoire).
- Une réduction significative du nombre de requêtes vers la base SQL.
- Un comportement stable lors des **pics de trafic** :
  - Le cache doit supporter un volume important de requêtes par seconde sans dégradation majeure.

L’objectif fonctionnel est que les données les plus consultées soient servies **depuis le cache** plutôt que depuis la base de données, afin de lisser la charge.


### 3.2. Cas d’usage principaux

1. **Lecture de données fréquemment consultées**

   - Exemple : prix d’un produit, informations d’un utilisateur, contenu d’un panier.
   - L’application e-commerce interroge CacheLab avant de solliciter la base SQL.
   - Si la clé existe dans le cache, la valeur est retournée immédiatement.

2. **Mise en cache d’une réponse coûteuse**

   - Une API interne calcule une réponse lourde (ex : recommandation, calcul de remise).
   - Le résultat est stocké dans CacheLab avec un TTL.
   - Les appels suivants réutilisent la valeur en cache tant qu’elle n’a pas expiré.

3. **Mise à jour d’une information**

   - Lorsqu’un prix ou un stock est modifié dans la base SQL, l’application met à jour la valeur correspondante dans CacheLab.
   - La clé est écrasée si elle existe déjà (comportement de “SET”).

4. **Suppression ciblée d’une clé**

   - Lorsqu’une donnée devient obsolète ou sensible, l’application supprime la clé correspondante du cache.
   - Exemple : suppression d’une session utilisateur invalidée.

5. **Purge complète du cache (flush)**

   - Lors d’une opération de maintenance, l’équipe technique doit pouvoir vider entièrement le cache.
   - Exemple : après un gros déploiement ou un changement de modèle de données.

6. **Suivi et diagnostic**

   - L’équipe technique doit pouvoir :
     - vérifier que le service CacheLab est en ligne (`/health`) ;
     - consulter des statistiques globales (`/stats`) ;
     - parcourir les clés (via `/scan` ou un filtre par préfixe) pour comprendre ce qui est stocké.

Ces cas d’usage servent de base aux scénarios de tests fonctionnels.


## 4. Fonctionnalités prioritaires

### 4.1. Fonctionnalités “cœur” (priorité haute)

1. **CRUD sur clés/valeurs via API REST**
   - Création / mise à jour de paires clé/valeur.
   - Lecture d’une valeur à partir d’une clé.
   - Suppression d’une clé.
   - Liste des clés existantes.

2. **Stockage en mémoire avec temps d’accès constant**
   - Les données sont stockées dans une structure de type **HashTable** en mémoire.
   - L’accès aux clés doit être en **O(1) en moyenne** (objectif de performance).

3. **Gestion d’un TTL global**
   - Chaque entrée peut avoir une date d’expiration calculée à partir d’un TTL global.
   - Une clé expirée ne doit plus être visible fonctionnellement :
     - `GET` sur une clé expirée → valeur non trouvée.
     - Les listes (scan, keys, prefix) ne doivent pas exposer de clés expirées.

4. **Flush global du cache**
   - Permet de supprimer toutes les clés stockées en une seule opération (maintenance, reset).

5. **Endpoints de santé et de base**
   - `/` : message simple indiquant que l’API est en ligne.
   - `/health` : état du service (uptime, infos cache).
   - Codes HTTP cohérents (200, 201, 400, 404, 405, 500…).


### 4.2. Fonctionnalités de monitoring / observabilité (priorité moyenne)

1. **Endpoint `/stats`**
   - Retourne des informations globales sur le cache :
     - taille de la table (nombre de buckets),
     - nombre de clés,
     - facteur de charge,
     - TTL par défaut,
     - métriques HTTP (nombre total de requêtes, répartition par méthode, nombre d’erreurs).

2. **Endpoint `/scan`**
   - Permet de parcourir les clés par “page” en utilisant un curseur (`cursor`) et une limite (`limit`).
   - Inspiré du comportement de `SCAN` dans Redis.
   - Utile pour l’exploration progressive sans renvoyer toutes les clés d’un coup.

3. **Filtrage par préfixe sur `/keys`**
   - `GET /keys?prefix=user_` : retourne uniquement les clés commençant par `"user_"`.
   - Utile pour gérer des groupes de clés logiques (ex : `user_`, `cart_`, `session_`).


### 4.3. Fonctionnalités futures possibles (non incluses dans le MVP)

- Gestion du TTL par clé (TTL spécifique via endpoint dédié).
- Mécanisme de persistance sur disque.
- Politique d’éviction (LRU, FIFO…) si la mémoire maximale est atteinte.
- Authentification et gestion de droits par clé/applicatif.
- Interface d’administration (UI) au-dessus de l’API.


## 5. Contraintes techniques (côté fonctionnel)

### 5.1. Temps de réponse

- Les endpoints de type `GET /keys/:key` doivent être **très rapides** :
  - Objectif pédagogique : temps de traitement côté serveur minimal (accès mémoire uniquement).
- Les opérations de liste (`/keys`, `/scan`) doivent être raisonnables en temps de réponse, même en cas de nombreuses clés.
- Le système doit rester utilisable pendant les résizes internes (changement de taille de la HashTable).


### 5.2. Sécurité (niveau fonctionnel)

- La solution doit **valider les entrées** :
  - `key` et `value` doivent être de type string.
  - Les bodies JSON invalides doivent retourner une erreur claire.
- Le cache peut contenir des données applicatives (prix, sessions…) mais ne doit pas être considéré comme un stockage “long terme” de données personnelles.
- Le MVP ne gère pas encore l’authentification, mais l’API doit être conçue de manière à pouvoir être protégée plus tard (reverse proxy, API Gateway, etc.).


## 6. Spécialisation choisie et implications fonctionnelles

La spécialisation du projet CacheLab porte sur :

> **La conception d’un système de cache clé/valeur en mémoire optimisé pour la performance et l’observabilité, destiné à soulager une base de données relationnelle dans un contexte e-commerce.**

Implications fonctionnelles :

- Les opérations **simples et rapides** sont privilégiées (clé/valeur, pas de jointures ni de requêtes complexes).
- L’API est pensée pour être **facilement intégrable** dans une architecture existante (API REST, JSON).
- Le système expose des **endpoints de monitoring** (`/health`, `/stats`, `/scan`) pour aider :
  - les équipes techniques à diagnostiquer les problèmes,
  - à suivre l’utilisation du cache,
  - à illustrer les notions de performance et de charge.
- La gestion de la mémoire (TTL, resize automatique) est intégrée dès le début pour éviter la dérive du cache et préparer des futures évolutions vers des politiques d’éviction plus avancées.

Ce cahier des charges fonctionnel sert de base pour le **cahier des charges techniques** et la **note de cadrage**, qui détailleront les choix d’implémentation (Node.js/TypeScript, HashTable, logging, etc.) et la planification du projet.
