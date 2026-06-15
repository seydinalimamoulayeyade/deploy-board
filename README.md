# Deploy Board — Tableau de bord CI/CD

Deploy Board est un tableau de bord centralisé de déploiement continu qui intègre l'état des pipelines Jenkins, les builds Docker, les métriques de qualité SonarQube et l'historique des déploiements. Il offre une visibilité en temps réel sur les workflows d'intégration et de déploiement continus.

## Architecture

```
┌─────────────┐      polling 10s      ┌──────────────────┐
│  React SPA  │  ──────────────────►  │  Node.js/Express │
│  (Vite)     │  ◄──────────────────  │  (proxy API)     │
└─────────────┘       JSON/REST       └──────────────────┘
                                          │   │   │   │
                          ┌───────────────┘   │   │   └───────────────┐
                          ▼                    ▼   ▼                   ▼
                    ┌──────────┐         ┌─────────┐ ┌──────────┐ ┌────────┐
                    │ MongoDB  │         │ Jenkins │ │SonarQube │ │ Slack  │
                    └──────────┘         └─────────┘ └──────────┘ └────────┘
```

- **Frontend** : React 18 + Vite, Tailwind CSS, Recharts, React Router, React Toastify
- **Backend** : Node.js 22 + Express 5, Mongoose, Axios — sert de proxy sécurisé vers les API externes
- **Base de données** : MongoDB 7.0 (historique des déploiements)
- **Infrastructure** : Docker + Docker Compose

### Principes de conception

1. **Proxy API** : le backend masque les identifiants et évite les problèmes CORS
2. **Polling** : mises à jour temps réel via interrogation client (10 s)
3. **Dégradation gracieuse** : l'application reste utilisable si un service externe est indisponible
4. **Container-first** : conçu pour Docker dès l'origine

## Structure du projet

```
deploy-board/
├── backend/
│   ├── config/          # Connexions (mongodb, jenkins, sonarqube)
│   ├── controllers/     # Logique des endpoints
│   ├── middleware/      # Gestion centralisée des erreurs
│   ├── models/          # Schémas Mongoose
│   ├── routes/          # Définition des routes API
│   ├── services/        # Clients API externes + cache
│   ├── utils/           # ApiError, helpers
│   ├── app.js           # Configuration Express
│   └── server.js        # Point d'entrée
├── frontend/
│   └── src/
│       ├── api/         # Client Axios centralisé
│       ├── components/  # Composants React réutilisables
│       ├── hooks/       # usePolling, etc.
│       ├── pages/       # Dashboard, BuildDetails
│       └── utils/       # Formatage (dates, durées, statuts)
├── Dockerfile           # Build multi-étapes
├── docker-compose.yml   # Orchestration app + MongoDB
└── Jenkinsfile          # Pipeline CI/CD 8 étapes
```

## Démarrage en développement local

### Prérequis

- Node.js 22.x
- MongoDB 7.0 (local ou Docker)
- Jenkins 2.x (optionnel pour les données réelles)
- SonarQube 9.x+ (optionnel)

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env   # puis renseignez vos identifiants
npm run dev            # démarre sur le port 5001

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev            # démarre sur le port 3000 avec proxy /api vers 5001
```

L'application est accessible sur `http://localhost:3000`.

## Déploiement Docker

```bash
# À la racine du projet
cp .env.example .env   # renseignez JENKINS_USER, JENKINS_TOKEN, etc.
docker compose up -d --build
```

L'application est accessible sur `http://localhost:5001` (disponible sous 60 s).

- MongoDB est exposé sur le port hôte `27018`
- Les données MongoDB sont persistées dans le volume nommé `deploy-mongo-data`
- Jenkins est joint via `host.docker.internal:8080`

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `NODE_ENV` | `development` ou `production` | Oui |
| `PORT` | Port d'écoute du backend (5001) | Oui |
| `MONGODB_URI` | URI de connexion MongoDB | Oui |
| `JENKINS_URL` | URL de l'instance Jenkins | Oui |
| `JENKINS_USER` | Utilisateur Jenkins | Oui |
| `JENKINS_TOKEN` | Token API Jenkins | Oui |
| `SONARQUBE_URL` | URL de SonarQube | Non |
| `SONARQUBE_TOKEN` | Token SonarQube | Non |
| `SLACK_WEBHOOK_URL` | Webhook Slack pour les notifications | Non |
| `APP_BASE_URL` | URL publique (liens des notifications) | Non |

## API Backend

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/jenkins/pipelines` | Liste des pipelines (filtre `?environment=`) |
| GET | `/api/jenkins/build/:job/:num` | Détails d'un build |
| GET | `/api/jenkins/build/:job/:num/log` | Log console paginé |
| POST | `/api/jenkins/build/:job/:num/replay` | Replay (rollback) |
| GET | `/api/jenkins/builds/:job/stable` | Derniers builds stables |
| GET | `/api/sonarqube/metrics/:projectKey` | Métriques de qualité |
| GET | `/api/deployments/history/:pipelineId` | Historique des déploiements |
| POST | `/api/deployments` | Enregistre un déploiement |
| GET | `/api/deployments/environments/:env/status` | Statut par environnement |
| GET | `/health` | Health check (MongoDB, Jenkins, SonarQube) |

## Pipeline Jenkins

Le `Jenkinsfile` définit un pipeline en 8 étapes : **checkout → install → test → sonar → quality gate → docker build → docker push → deploy**. Voir [docs/webhook-setup.md](docs/webhook-setup.md) pour la configuration du webhook GitHub.

## Dépannage

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| « Jenkins est indisponible » | URL/identifiants Jenkins incorrects | Vérifiez `JENKINS_URL`, `JENKINS_USER`, `JENKINS_TOKEN` |
| Métriques « Indisponibles » | SonarQube injoignable | Vérifiez `SONARQUBE_URL` et `SONARQUBE_TOKEN` |
| `npm` bloqué sous PowerShell | Politique d'exécution | Utilisez `npm.cmd` |
| Conteneur app ne démarre pas | MongoDB pas prêt | `docker compose logs app` |

## Sécurité

> ⚠️ Le backend actuel n'implémente pas d'authentification utilisateur. Avant toute exposition publique, ajoutez une couche d'authentification (JWT) et une limitation de débit sur les endpoints API.
