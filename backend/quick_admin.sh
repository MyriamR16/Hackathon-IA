#!/bin/bash
# Script bash simple pour créer un admin
cd /home/Myriam/Documents/Hackathon-IA/backend
source venv/bin/activate

python3 -c "
import sys, os
sys.path.append(os.path.dirname(os.path.abspath('.')))
from app import create_app, db
from app.models import Pompier

email = input('Email admin: ') or 'nouvel-admin@pompiers-pibrac.fr'
password = input('Mot de passe: ') or 'AdminLocal2025!'
nom = input('Nom: ') or 'Local'
prenom = input('Prénom: ') or 'Admin'

app = create_app()
with app.app_context():
    db.create_all()
    existing = Pompier.query.filter_by(email=email).first()
    if existing:
        db.session.delete(existing)
    
    admin = Pompier(nom=nom, prenom=prenom, grade='Commandant', email=email, type_pompier='professionnel', role='admin')
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    print(f'✅ Admin créé: {email} / {password}')
"
