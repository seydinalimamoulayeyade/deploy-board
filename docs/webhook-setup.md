# Configuration du Webhook GitHub → Jenkins

Ce guide explique comment déclencher automatiquement les builds Jenkins lors d'un push GitHub (Req 8.1-8.5).

## 1. Côté Jenkins

1. Installez le plugin **GitHub** (Manage Jenkins → Plugins).
2. Dans la configuration du job, activez **« GitHub hook trigger for GITScm polling »**.
3. Assurez-vous que Jenkins est accessible depuis Internet (ou via un tunnel type ngrok en développement).

## 2. Côté GitHub

Dans le dépôt : **Settings → Webhooks → Add webhook**

| Champ | Valeur |
|-------|--------|
| Payload URL | `http://<jenkins-host>:8080/github-webhook/` |
| Content type | `application/json` |
| Événements | « Just the push event » |
| Secret | (optionnel) signature HMAC pour vérification |

## 3. Comportement attendu

1. GitHub envoie une requête POST sur chaque push.
2. Jenkins reçoit la charge utile et démarre un build sous **5 secondes** (Req 8.2).
3. Le pipeline extrait le SHA du commit, l'auteur et la branche (Req 8.3, 8.4).
4. Jenkins répond `200 OK` immédiatement.

## 4. Logique de réessai

GitHub réessaie la livraison jusqu'à 3 fois en cas d'échec, avec un délai exponentiel (Req 8.5). Vérifiez l'onglet **Recent Deliveries** du webhook pour diagnostiquer les échecs.

## Dépannage

- **Le build ne se déclenche pas** : vérifiez que l'option « GitHub hook trigger » est cochée et que l'URL du webhook se termine bien par `/github-webhook/`.
- **403/401** : vérifiez la configuration CSRF de Jenkins.
- **Jenkins inaccessible** : exposez Jenkins via un reverse proxy ou un tunnel.
