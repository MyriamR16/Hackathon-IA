#!/usr/bin/env python3
"""
Script pour créer un utilisateur administrateur
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Pompier

# Informations de l'administrateur
ADMIN_EMAIL = "admin@pompiers-pibrac.fr"
ADMIN_PASSWORD = "Admin2025!"
ADMIN_NOM = "Admin"
ADMIN_PRENOM = "Administrateur"
ADMIN_GRADE = "Commandant"

def create_admin():
    """Créer un utilisateur administrateur"""
    app = create_app()
    
    with app.app_context():
        # Créer les tables si elles n'existent pas
        db.create_all()
        
        # Vérifier si l'admin existe déjà
        existing_admin = Pompier.query.filter_by(email=ADMIN_EMAIL).first()
        
        if existing_admin:
            print(f"⚠️  L'administrateur {ADMIN_EMAIL} existe déjà!")
            print(f"📧 Email: {ADMIN_EMAIL}")
            print(f"🔑 Mot de passe: {ADMIN_PASSWORD}")
            return
        
        # Créer l'administrateur
        admin = Pompier(
            nom=ADMIN_NOM,
            prenom=ADMIN_PRENOM,
            grade=ADMIN_GRADE,
            email=ADMIN_EMAIL,
            type_pompier='professionnel',
            role='admin'
        )
        admin.set_password(ADMIN_PASSWORD)
        
        # Sauvegarder en base
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Administrateur créé avec succès!")
        print(f"📧 Email: {ADMIN_EMAIL}")
        print(f"🔑 Mot de passe: {ADMIN_PASSWORD}")
        print(f"👤 Nom: {ADMIN_PRENOM} {ADMIN_NOM}")
        print(f"🎖️  Grade: {ADMIN_GRADE}")
        print(f"🛡️  Rôle: Administrateur")
        print("")
        print("🌐 Vous pouvez maintenant vous connecter sur http://localhost:5173")

if __name__ == '__main__':
    create_admin()
