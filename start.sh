#!/bin/bash

# Script de démarrage pour l'application Planning Pompiers

echo "🚒 Démarrage de l'application Planning Pompiers"
echo "=================================================="

# Fonction pour détecter si un port est utilisé
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Arrêter les processus existants
echo "🔄 Vérification des processus existants..."
if check_port 5000; then
    echo "⚠️  Le port 5000 est déjà utilisé. Arrêt du processus..."
    pkill -f "python.*run.py" 2>/dev/null || true
    sleep 2
fi

if check_port 5173; then
    echo "⚠️  Le port 5173 est déjà utilisé. Arrêt du processus..."
    pkill -f "vite" 2>/dev/null || true
    sleep 2
fi

# Démarrage du backend
echo "🔧 Démarrage du backend Flask..."
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 5

# Vérifier si le backend fonctionne
if check_port 5000; then
    echo "✅ Backend démarré avec succès sur http://localhost:5000"
else
    echo "❌ Erreur: Le backend n'a pas pu démarrer"
    exit 1
fi

# Démarrage du frontend
echo "🔧 Démarrage du frontend React..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Attendre que le frontend démarre
echo "⏳ Attente du démarrage du frontend..."
sleep 5

# Vérifier si le frontend fonctionne
if check_port 5173; then
    echo "✅ Frontend démarré avec succès sur http://localhost:5173"
else
    echo "❌ Erreur: Le frontend n'a pas pu démarrer"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Application démarrée avec succès !"
echo "=================================================="
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:5000"
echo "📍 API:      http://localhost:5000/api"
echo ""
echo "📋 Fonctionnalités disponibles:"
echo "   • Visualisation des disponibilités par pompier"
echo "   • Génération et affichage du planning optimisé"
echo "   • Navigation par mois dans le calendrier"
echo "   • Filtrage par créneaux horaires"
echo ""
echo "⚠️  Pour arrêter l'application, utilisez Ctrl+C ou ./stop.sh"
echo "=================================================="

# Fonction pour nettoyer à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "python.*run.py" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ Application arrêtée"
    exit 0
}

# Capturer Ctrl+C
trap cleanup INT

# Maintenir le script en vie
wait
