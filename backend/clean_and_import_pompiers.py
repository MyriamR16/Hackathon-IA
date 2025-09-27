#!/usr/bin/env python3
import os
import sys
import csv
import secrets
import string
from datetime import datetime

# Ajouter le répertoire backend au path pour importer l'app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Pompier

# Créer l'application Flask
app = create_app()

def generate_secure_password(length=12):
    """Génère un mot de passe sécurisé"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

def clean_database():
    """Supprime tous les pompiers existants sauf l'admin"""
    with app.app_context():
        # Supprimer tous les utilisateurs qui ne sont pas admin
        non_admin_users = Pompier.query.filter(Pompier.role != 'admin').all()
        for user in non_admin_users:
            db.session.delete(user)
        db.session.commit()
        print(f"Supprimé {len(non_admin_users)} pompiers non-admin")

def import_pompiers_from_csv():
    """Importe les pompiers depuis le CSV avec des noms plus réalistes"""
    
    # Noms français réalistes pour les pompiers
    noms_pompiers = [
        "Alain Dubois", "Bernard Martin", "Catherine Durand", "Daniel Moreau", "Émilie Leroy",
        "François Roux", "Géraldine Simon", "Henri Michel", "Isabelle Petit", "Jacques Laurent",
        "Karine Bernard", "Louis Rousseau", "Marie Lefebvre", "Nicolas Mercier", "Odette Garnier",
        "Pierre Fabre", "Quentin Morel", "Rachel Vincent", "Stéphane Fournier", "Thérèse Girard",
        "Ursula Bonnet", "Victor Lambert", "Wendy Fontaine", "Xavier Roussel", "Yann Lefevre",
        "Zoé Martinez", "Antoine Blanc", "Brigitte Lemoine", "Claude Fernandez", "Delphine Roy",
        "Éric Muller", "Fabrice Leclerc", "Gabrielle André", "Hugo Masson", "Inès Sanchez",
        "Julien Robin", "Kévin Guerin", "Laëtitia Clement", "Marc Dubois", "Nathalie Morin",
        "Olivier Thomas", "Pascale Giraud", "Quentin Perrin", "Raphaël David", "Sandrine Roche",
        "Thibault Brun", "Valérie Caron", "William Garcia", "Yasmina Lopez", "Zacharie Martin",
        "Amélie Dufour", "Benjamin Legrand", "Céline Rivière", "Dimitri Marchand", "Estelle Colin",
        "Florian Lemaire", "Gisèle Picard", "Hadrien Boyer", "Irène Moulin", "Jean-Paul Noel",
        "Kristel Weber", "Lionel Barbier", "Mélanie Chevalier", "Norbert Denis", "Ophélie Meyer",
        "Philippe Meunier", "Quitterie Aubry", "Rémy Lecomte", "Sabrina Prevost", "Tanguy Leroux",
        "Ursule Guillot", "Vincent Huet", "Wanda Berger", "Yolande Carpentier", "Zéphyr Mallet",
    ]
    
    csv_file_path = '/home/Myriam/Documents/Hackathon-IA/disponibilites_2026.csv'
    
    with app.app_context():
        try:
            with open(csv_file_path, 'r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file)
                
                imported_count = 0
                
                for row_index, row in enumerate(reader):
                    if imported_count >= len(noms_pompiers):
                        break
                    
                    nom_complet = noms_pompiers[imported_count].split()
                    prenom = nom_complet[0]
                    nom = nom_complet[1] if len(nom_complet) > 1 else "Pompier"
                    
                    # Créer un email basé sur le nom et prénom
                    email = f"{prenom.lower()}.{nom.lower()}@pompiers-pibrac.fr"
                    
                    # Vérifier si le pompier existe déjà
                    existing_pompier = Pompier.query.filter_by(email=email).first()
                    if existing_pompier:
                        print(f"Pompier {email} existe déjà, on passe")
                        continue
                    
                    # Générer un mot de passe sécurisé
                    password = generate_secure_password()
                    
                    # Créer le nouveau pompier
                    nouveau_pompier = Pompier(
                        nom=nom,
                        prenom=prenom,
                        grade='Pompier 2ème classe',  # Grade par défaut
                        email=email,
                        role='pompier',
                        type_pompier='volontaire'
                    )
                    
                    # Définir le mot de passe (sera hashé automatiquement)
                    nouveau_pompier.set_password(password)
                    
                    db.session.add(nouveau_pompier)
                    imported_count += 1
                    
                    if imported_count % 50 == 0:
                        print(f"Importé {imported_count} pompiers...")
                
                db.session.commit()
                print(f"\n✅ Import terminé !")
                print(f"Total des pompiers importés : {imported_count}")
                
                # Vérification
                total_users = Pompier.query.count()
                print(f"Nombre total d'utilisateurs dans la base : {total_users}")
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de l'import : {e}")

if __name__ == '__main__':
    print("🧹 Nettoyage de la base de données...")
    clean_database()
    
    print("📥 Import des pompiers avec des noms réalistes...")
    import_pompiers_from_csv()
