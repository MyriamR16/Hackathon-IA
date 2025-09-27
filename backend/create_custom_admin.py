#!/usr/bin/env python3
"""
Script pour créer un administrateur personnalisé
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Pompier

def create_custom_admin():
    """Créer un administrateur avec des données personnalisées"""
    
    print("=== Création d'un nouvel administrateur ===")
    print("")
    
    # Demander les informations
    email = input("📧 Email de l'admin: ").strip()
    if not email:
        email = "admin@pompiers-pibrac.fr"
    
    password = input("🔑 Mot de passe: ").strip()
    if not password:
        password = "Admin2025!"
    
    nom = input("👤 Nom: ").strip()
    if not nom:
        nom = "Admin"
    
    prenom = input("👤 Prénom: ").strip()
    if not prenom:
        prenom = "Administrateur"
    
    grade = input("🎖️  Grade (par défaut: Commandant): ").strip()
    if not grade:
        grade = "Commandant"
    
    app = create_app()
    
    with app.app_context():
        # Créer les tables si elles n'existent pas
        db.create_all()
        
        # Vérifier si l'admin existe déjà
        existing_admin = Pompier.query.filter_by(email=email).first()
        
        if existing_admin:
            print(f"⚠️  L'administrateur {email} existe déjà!")
            confirm = input("Voulez-vous le remplacer ? (y/N): ").strip().lower()
            if confirm != 'y':
                print("❌ Création annulée")
                return
            
            # Supprimer l'ancien
            db.session.delete(existing_admin)
        
        # Créer l'administrateur
        admin = Pompier(
            nom=nom,
            prenom=prenom,
            grade=grade,
            email=email,
            type_pompier='professionnel',
            role='admin'
        )
        admin.set_password(password)
        
        # Sauvegarder en base
        db.session.add(admin)
        db.session.commit()
        
        print("")
        print("✅ Administrateur créé avec succès!")
        print(f"📧 Email: {email}")
        print(f"🔑 Mot de passe: {password}")
        print(f"👤 Nom: {prenom} {nom}")
        print(f"🎖️  Grade: {grade}")
        print(f"🛡️  Rôle: Administrateur")
        print("")
        print("🌐 Vous pouvez maintenant vous connecter sur http://localhost:5173")

if __name__ == '__main__':
    create_custom_admin()
