# Guide de déploiement — Deploy Board

## Environnements

| Environnement | Usage | Branche |
|---------------|-------|---------|
| Développement | Tests locaux | `develop` / branches de feature |
| Pré-production (staging) | Validation avant production | `release/*` |
| Production | Service en ligne | `main` |

## Déploiement en pré-production

1. Fusionnez vos changements dans une branche `release/*`.
2. Le pipeline Jenkins se déclenche automatiquement (webhook).
3. Vérifiez les étapes : tests, Quality Gate SonarQube.
4. L'image Docker est taguée et poussée sur Docker Hub.
5. Validez le tableau de bord sur l'environnement de pré-production.

## Checklist de déploiement en production

- [ ] Tous les tests passent (backend + frontend)
- [ ] La Quality Gate SonarQube est au vert
- [ ] La revue de code est approuvée
- [ ] Les variables d'environnement de production sont configurées
- [ ] Une sauvegarde MongoDB récente existe
- [ ] La fenêtre de maintenance est communiquée (si nécessaire)
- [ ] Le plan de rollback est prêt

## Procédure de déploiement

```bash
# Sur l'hôte de production
git pull origin main
cp .env.example .env   # vérifiez les valeurs de production
docker compose up -d --build
docker compose ps      # vérifiez que app et mongo sont "healthy"
curl http://localhost:5001/health
```

## Sauvegarde et restauration MongoDB

```bash
# Sauvegarde
docker exec deploy-mongo mongodump --db deploy-board --archive=/data/db/backup.archive

# Restauration
docker exec deploy-mongo mongorestore --db deploy-board --archive=/data/db/backup.archive
```

Le volume `deploy-mongo-data` persiste les données entre les redémarrages.

## Stratégie de rollback

### Rollback applicatif (via l'interface)

1. Sur le tableau de bord, cliquez sur **Rollback** d'un pipeline.
2. Sélectionnez une version stable parmi les 5 derniers builds réussis.
3. Confirmez — Jenkins relance le build de cette version.
4. Une notification Slack est envoyée (si configurée).

### Rollback manuel (image Docker)

```bash
# Revenir à un tag d'image précédent
docker pull myorg/deploy-board:<BUILD_NUMBER_STABLE>
docker tag myorg/deploy-board:<BUILD_NUMBER_STABLE> myorg/deploy-board:latest
docker compose up -d --force-recreate app
```

## Surveillance post-déploiement

- Endpoint `/health` : état de MongoDB, Jenkins et SonarQube
- Logs : `docker compose logs -f app`
- Vérifiez le tableau de bord et l'historique des déploiements
