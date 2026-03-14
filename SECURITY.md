# 🔒 Politique de sécurité

## Signaler une vulnérabilité

Si tu découvres une faille de sécurité, **ne crée pas d'Issue publique**.
Envoie un message privé via GitHub ou ouvre une Issue avec le label `security` en omettant les détails sensibles.

## Architecture de sécurité

### Clés API
- Toutes les clés API sont stockées **uniquement dans le `localStorage` du navigateur**
- Elles ne transitent **jamais** vers un serveur tiers
- Seul le proxy Vercel (`/api/claude.js`) lit la variable `ANTHROPIC_API_KEY` depuis les variables d'environnement Vercel — elle n'est jamais exposée au client

### Ce que l'app envoie sur le réseau
- Tes messages → directement vers les APIs des fournisseurs (Groq, Mistral, etc.) avec ta clé
- Si tu utilises Claude via le proxy → ton message part vers `ton-app.vercel.app/api/claude` qui relaie vers Anthropic

### Risques connus
| Risque | Mitigation |
|---|---|
| Clé visible dans DevTools | N'utilise pas l'app sur un appareil partagé |
| XSS → vol de localStorage | L'app ne charge aucun script externe dynamique sauf les plugins volontairement activés |
| Proxy Vercel exposé | Ajoute une `ALLOWED_ORIGIN` ou un rate limit si tu déploies publiquement |

## Recommandations pour les forks publics

Si tu déploies une version publique accessible à tous :

1. **Ajoute un rate limiting** sur `/api/claude.js` (voir ci-dessous)
2. **Restreins l'origine** autorisée sur le proxy
3. **Ne stocke pas** de clé par défaut dans le code
4. **Vérifie** le `.gitignore` avant chaque commit

### Rate limiting minimal pour le proxy Claude

```js
// Dans api/claude.js — ajouter en haut du handler
const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
// Implémenter un compteur par IP avec Vercel KV ou Upstash
```
