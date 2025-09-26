#!/usr/bin/env python3
"""
Script de démarrage pour l'application Flask
"""
import os
from app import create_app, db

# Créer l'application Flask
app = create_app()

if __name__ == '__main__':
    # Créer les tables de base de données si elles n'existent pas
    with app.app_context():
        db.create_all()
        print("✅ Base de données initialisée")
    
    # Configuration pour le développement
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    print(f"🚀 Démarrage du serveur Flask...")
    print(f"📍 Serveur accessible sur: http://localhost:{port}")
    print(f"📍 API disponible sur: http://localhost:{port}/api")
    print("🔧 Mode debug:", debug_mode)
    print("⏹️  Pour arrêter: Ctrl+C")
    print("-" * 50)
    
    # Démarrer le serveur
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        use_reloader=debug_mode
    )
