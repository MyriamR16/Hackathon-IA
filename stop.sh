#!/bin/bash

# Script d'arrêt pour l'application Planning Pompiers

echo "🛑 Arrêt de l'application Planning Pompiers..."

# Arrêter les processus sur les ports spécifiques
echo "🔄 Arrêt du backend (port 5000)..."
pkill -f "python.*run.py" 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

echo "🔄 Arrêt du frontend (port 5173)..."
pkill -f "vite" 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Attendre un peu pour que les processus se ferment proprement
sleep 2

echo "✅ Application arrêtée avec succès"
