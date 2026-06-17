# Deploy Board — Tableau de bord CI/CD

Tableau de bord temps réel qui centralise l'état des pipelines **Jenkins**, les métriques de qualité **SonarQube** et l'historique des déploiements. Le backend agit comme proxy sécurisé vers les API externes ; le frontend les affiche dans une interface sombre inspirée du Changelog GitHub.

## Stack

React 18 (Vite, Tailwind) · Node.js + Express · MongoDB · Jenkins · SonarQube · Docker

## Fonctionnalités

- **Dashboard** — pipelines groupés par mois, statut temps réel (polling 10 s), métriques SonarQube (note A-E, bugs, code smells, couverture) sur chaque carte, filtres statut/environnement
- **Détails d'un build** — logs paginés (recherche + surlignage), étapes du pipeline, artefacts, lien commit GitHub
- **Historique** — statut par environnement (Dev/Staging/Prod) + timeline 7 jours, graphe succès/échec, durée moyenne
- **Rollback** — rejoue un build stable via l'API Jenkins, avec notification Slack
- **État des services** — santé MongoDB / Jenkins / SonarQube

## Démarrage

```bash
# Backend
cd backend && npm install
cp .env.example .env          # renseigner les identifiants
npm run dev                   # http://localhost:5001

# Frontend
cd frontend && npm install
npm run dev                   # http://localhost:3000
```

Ou tout en conteneurs :

```bash
docker compose up -d --build  # http://localhost:5001
```

## Variables d'environnement

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/deploy-board
JENKINS_URL=...    JENKINS_USER=...    JENKINS_TOKEN=...
SONARQUBE_URL=...  SONARQUBE_TOKEN=...        # optionnel
SLACK_WEBHOOK_URL=...                          # optionnel
ADMIN_USERNAME=admin   ADMIN_PASSWORD=...      # ou ADMIN_PASSWORD_HASH (bcrypt)
JWT_SECRET=...         DEPLOY_INGEST_TOKEN=... # secret JWT + token CI
```

> Le token SonarQube doit être un **User Token** (avec droit « Browse »), pas un Analysis Token.

## Authentification

L'API et le dashboard sont protégés par **JWT** (compte admin unique défini dans `.env`). Le frontend redirige vers `/login` si non authentifié. Les routes d'écriture sont protégées ; l'enregistrement des déploiements par le pipeline Jenkins utilise le header `x-deploy-token` (`DEPLOY_INGEST_TOKEN`). Rate limiting actif sur l'API et la connexion.

## Pipeline Jenkins

`Jenkinsfile` — 8 étapes : checkout → install → test → sonar → quality gate → docker build → docker push → deploy.
Configuration du webhook GitHub : voir [`docs/webhook-setup.md`](docs/webhook-setup.md).

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/jenkins/pipelines` | Liste des pipelines (filtre `?environment=`) |
| `GET /api/jenkins/build/:job/:num` | Détails d'un build |
| `GET /api/jenkins/build/:job/:num/log` | Log console paginé |
| `POST /api/jenkins/build/:job/:num/replay` | Rollback |
| `GET /api/sonarqube/metrics/:projectKey` | Métriques qualité |
| `GET /api/deployments/history/:pipelineId` | Historique |
| `GET /health` | Santé des services |

## Sécurité

Le backend n'a pas d'authentification : ajouter JWT + rate limiting avant toute exposition publique.
