#!/bin/bash

# 🚀 Script de déploiement Cloudflare Pages
# Alternative à Vercel - Plus rapide en Europe, 100GB gratuit

echo "🔨 Build en cours..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Échec du build"
    exit 1
fi

echo ""
echo "📦 Déploiement sur Cloudflare Pages..."
wrangler pages deploy dist --project-name=multiia-hub

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Déployé avec succès !"
    echo "🌐 URL : https://multiia-hub.pages.dev"
    echo ""
    echo "💡 Pour ajouter un domaine personnalisé :"
    echo "   wrangler pages project update multiia-hub --production-domain=multiia-hub.com"
else
    echo ""
    echo "❌ Échec du déploiement"
    exit 1
fi
