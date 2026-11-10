# BiblioTech — Gestion et Consultation du Catalogue Universitaire

**BiblioTech** est une application web moderne, minimaliste et responsive conçue pour la gestion et la consultation du catalogue d'une bibliothèque universitaire.

---

## 👥 Les Deux Profils de l'Application

L'application intègre strictement deux profils d'utilisateurs distincts avec redirection automatique lors de la connexion :

### 1. Profil Étudiant (Lecteur)
- **Création de compte :** formulaire autonome d'inscription réservé aux étudiants (Nom, Prénom, E-mail, Mot de passe, Confirmation).
- **Connexion intelligente :** redirection immédiate vers l'espace de consultation.
- **Consultation du catalogue :** vue d'ensemble des ouvrages avec couvertures haute fidélité.
- **Recherche multicritère :** recherche instantanée par titre, auteur ou numéro ISBN.
- **Filtres thématiques :** filtrage par catégorie littéraire/scientifique et par disponibilité.
- **Détails de l'ouvrage :** consultation complète (titre, auteur, ISBN, catégorie, éditeur, année, pages, emplacement physique et résumé).
- **Visibilité de la disponibilité :** affichage immédiat et distinct de l'état **Disponible** (vert) ou **Indisponible** (rouge).
- **Restrictions strictes :** aucune action de modification, de suppression, d'ajout ou de gestion n'est autorisée. Espace dédié exclusivement à la consultation.

### 2. Profil Gestionnaire de Bibliothèque
- **Compte précréé :** identifiants sécurisés configurés par défaut.
- **Contrôle total du catalogue :** consultation de tous les ouvrages.
- **Ajout de livre par Scanner de code-barres :**
  - Utilisation de la caméra de l'appareil via `html5-qrcode` avec reticule de visée.
  - Récupération automatique des métadonnées du livre via l'API Open Library / Google Books à partir de l'ISBN scanné (titre, auteur, éditeur, année, pages, résumé, couverture).
  - Vérification et correction des informations par le gestionnaire avant enregistrement.
  - Saisie manuelle alternative si la caméra n'est pas disponible ou si le scan échoue.
- **Modification des informations :** mise à jour des fiches bibliographiques à tout moment.
- **Suppression d'ouvrage :** avec confirmation de sécurité.
- **Gestion exclusive de la disponibilité :** bascule instantanée entre les états **Disponible** et **Indisponible**, immédiatement répercutée dans le catalogue consulté par les étudiants.

---

## 🔑 Identifiants de Démonstration

Une interface unique et intelligente permet la connexion automatique selon le compte :

| Rôle | Adresse e-mail | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **Gestionnaire** | `gestionnaire@bibliotech.fr` | `admin123` | Compte précréé avec accès complet à la gestion et au scanner |
| **Étudiant (démo)** | `etudiant@univ.fr` | `etudiant123` | Compte lecteur de démonstration (consultation seule) |
| **Nouvel Étudiant** | *Créer via l'interface* | *Votre mot de passe* | Inscription directe via le lien « Créer un compte » |

---

## 🛠️ Architecture & Technologies

- **Frontend :** React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Composants d'icônes :** Lucide React
- **Scanner de code-barres :** `html5-qrcode` (support EAN-13, EAN-8, Code-128, UPC, QR)
- **Recherche de métadonnées :** Open Library API & Google Books API
- **Stockage des données :** `localStorage` exclusif (aucun abonnement ni service payant requis) :
  - `bibliotech_accounts_v3` : comptes gestionnaire et étudiants
  - `bibliotech_books_v3` : catalogue complet, couvertures et disponiblités
  - `bibliotech_session_v3` : session active de l'utilisateur

---

## 🚀 Lancement du Projet

### Installation des dépendances
```bash
npm install --legacy-peer-deps
```

### Démarrage en mode développement
```bash
npm run dev
```
L'application est accessible à l'adresse [http://localhost:3000](http://localhost:3000).

### Compilation de production & Vérification des types
```bash
npm run lint   # Vérification TypeScript (0 erreur)
npm run build  # Construction optimisée Vite
```
