#!/usr/bin/env python3
"""
Script pour importer tous les pompiers depuis les données de planning
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Pompier
import pandas as pd
import secrets
import string

def generate_password(length=8):
    """Générer un mot de passe aléatoire sécurisé"""
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special_chars = "!@#$%^&*"
    
    # S'assurer qu'on a au moins un caractère de chaque type
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special_chars)
    ]
    
    # Remplir le reste avec des caractères aléatoires
    all_chars = uppercase + lowercase + digits + special_chars
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
    
    # Mélanger le mot de passe
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)

def get_pompiers_from_planning():
    """Récupérer la liste des pompiers depuis les données de planning"""
    try:
        # Lire le fichier CSV des disponibilités
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'disponibilites_2026.csv')
        if not os.path.exists(csv_path):
            print(f"❌ Fichier non trouvé: {csv_path}")
            return []
        
        df = pd.read_csv(csv_path)
        
        # Extraire les pompiers depuis les colonnes (ignorer Date et Slot)
        pompiers_columns = [col for col in df.columns if col not in ['Date', 'Slot']]
        
        print(f"📊 Trouvé {len(pompiers_columns)} pompiers dans les données de planning")
        return pompiers_columns
        
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des données: {e}")
        return []

def import_all_pompiers():
    """Importer tous les pompiers manquants depuis les données de planning"""
    app = create_app()
    
    with app.app_context():
        # Créer les tables si elles n'existent pas
        db.create_all()
        
        # Récupérer les pompiers depuis le planning
        pompiers_planning = get_pompiers_from_planning()
        
        if not pompiers_planning:
            print("❌ Aucun pompier trouvé dans les données de planning")
            return
        
        # Récupérer les pompiers déjà existants en base
        pompiers_existants = {p.nom for p in Pompier.query.all()}
        
        pompiers_ajoutes = 0
        pompiers_ignores = 0
        
        print("\n🔄 Import des pompiers en cours...")
        print("=" * 50)
        
        for pompier_id in pompiers_planning:
            if pompier_id in pompiers_existants:
                print(f"⏭️  Pompier {pompier_id} existe déjà - ignoré")
                pompiers_ignores += 1
                continue
            
            # Générer un mot de passe sécurisé
            password = generate_password(12)
            
            # Créer le nouveau pompier
            nouveau_pompier = Pompier(
                nom=pompier_id,
                prenom=f"Pompier {pompier_id}",
                grade="Sapeur de 2ème classe (2CL)",  # Grade par défaut
                email=f"pompier.{pompier_id.lower()}@pompiers-pibrac.fr",
                adresse="",
                type_pompier='volontaire',
                role='user'
            )
            nouveau_pompier.set_password(password)
            
            # Sauvegarder en base
            db.session.add(nouveau_pompier)
            
            print(f"✅ Pompier {pompier_id} ajouté")
            print(f"   📧 Email: {nouveau_pompier.email}")
            print(f"   🔑 Mot de passe: {password}")
            
            pompiers_ajoutes += 1
        
        # Sauvegarder tous les changements
        try:
            db.session.commit()
            print("\n" + "=" * 50)
            print(f"🎉 Import terminé avec succès !")
            print(f"✅ {pompiers_ajoutes} pompiers ajoutés")
            print(f"⏭️  {pompiers_ignores} pompiers existants ignorés")
            print(f"📊 Total en base: {Pompier.query.count()} pompiers")
            print("\n📝 Note: Les mots de passe générés sont affichés ci-dessus.")
            print("   Vous devriez les communiquer aux pompiers pour qu'ils puissent se connecter.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de la sauvegarde: {e}")

if __name__ == '__main__':
    import_all_pompiers()
