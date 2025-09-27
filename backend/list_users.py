#!/usr/bin/env python3
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Pompier

app = create_app()

with app.app_context():
    pompiers = Pompier.query.all()
    
    print(f"📊 Total des utilisateurs : {len(pompiers)}")
    print("\n👨‍🚒 Liste des pompiers dans la base :")
    print("-" * 60)
    
    for pompier in pompiers:
        status = "🛡️  ADMIN" if pompier.role == 'admin' else "👨‍🚒 Pompier"
        print(f"{status} - {pompier.prenom} {pompier.nom} ({pompier.email}) - {pompier.grade}")
