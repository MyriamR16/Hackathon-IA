from flask import Blueprint, jsonify, request, session
from app import db
from app.models import Pompier
import re
import pandas as pd
import os
import subprocess
from datetime import datetime, timedelta
import json
from typing import Dict, List
import calendar
import secrets
import string

bp = Blueprint('api', __name__)

def is_admin():
    """Vérifier si l'utilisateur connecté est un administrateur"""
    if 'pompier_id' not in session:
        return False
    
    pompier = Pompier.query.get(session['pompier_id'])
    return pompier and pompier.role == 'admin'

def require_admin():
    """Décorateur pour vérifier les droits d'administration"""
    if not is_admin():
        return jsonify({'error': 'Accès refusé. Droits d\'administrateur requis.'}), 403
    return None

def validate_password(password):
    """Valider qu'un mot de passe est fort"""
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    if not re.search(r"[A-Z]", password):
        return False, "Le mot de passe doit contenir au moins une majuscule"
    if not re.search(r"[a-z]", password):
        return False, "Le mot de passe doit contenir au moins une minuscule"
    if not re.search(r"[0-9]", password):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Le mot de passe doit contenir au moins un caractère spécial"
    return True, "Mot de passe valide"

def generate_email(nom, prenom):
    """Générer une adresse email basée sur nom et prénom"""
    nom_clean = re.sub(r'[^a-zA-Z]', '', nom.lower())
    prenom_clean = re.sub(r'[^a-zA-Z]', '', prenom.lower())
    return f"{prenom_clean}.{nom_clean}@pompiers-pibrac.fr"

def generate_password(length=8):
    """Générer un mot de passe aléatoire sécurisé"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def parse_nom_complet(nom_complet):
    """Parser le nom complet pour extraire prénom et nom"""
    parts = nom_complet.strip().split()
    if len(parts) >= 2:
        # Dernière partie = nom, le reste = prénom
        nom = parts[-1]
        prenom = ' '.join(parts[:-1])
    else:
        # Si qu'un seul mot, c'est le nom
        nom = parts[0] if parts else "INCONNU"
        prenom = "Prénom"
    return prenom, nom

@bp.route('/admin/add-pompier', methods=['POST'])
def admin_add_pompier():
    """Endpoint pour l'administrateur pour ajouter un nouveau pompier"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Données manquantes'}), 400
    
    # Vérifier les champs requis
    required_fields = ['nom', 'prenom', 'grade', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Le champ {field} est requis'}), 400
    
    # Vérifier si l'email existe déjà
    if Pompier.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Cette adresse email est déjà utilisée'}), 400
    
    # Valider le mot de passe
    is_valid, message = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': message}), 400
    
    try:
        # Créer le nouveau pompier
        new_pompier = Pompier(
            nom=data['nom'].strip().title(),
            prenom=data['prenom'].strip().title(),
            grade=data['grade'],
            email=data['email'].strip().lower(),
            adresse=data.get('adresse', ''),
            type_pompier=data.get('type', 'volontaire')
        )
        new_pompier.set_password(data['password'])
        
        db.session.add(new_pompier)
        db.session.commit()
        
        return jsonify({
            'message': 'Pompier ajouté avec succès',
            'pompier': new_pompier.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de l\'ajout du pompier'}), 500

@bp.route('/inscription', methods=['POST'])
def inscription():
    """Inscription d'un nouveau pompier"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Données manquantes'}), 400
    
    # Vérifier les champs requis
    required_fields = ['nom', 'prenom', 'grade', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Le champ {field} est requis'}), 400
    
    # Vérifier si l'email existe déjà
    if Pompier.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Cette adresse email est déjà utilisée'}), 400
    
    # Valider le mot de passe
    is_valid, message = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': message}), 400
    
    try:
        # Créer le nouveau pompier
        new_pompier = Pompier(
            nom=data['nom'].strip().title(),
            prenom=data['prenom'].strip().title(),
            grade=data['grade'],
            email=data['email'].strip().lower(),
            adresse=data.get('adresse', ''),
            type_pompier=data.get('type', 'volontaire')
        )
        new_pompier.set_password(data['password'])
        
        db.session.add(new_pompier)
        db.session.commit()
        
        return jsonify({
            'message': 'Inscription réussie',
            'pompier': new_pompier.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de l\'inscription'}), 500

@bp.route('/connexion', methods=['POST'])
def connexion():
    """Connexion d'un pompier"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    # Trouver le pompier
    pompier = Pompier.query.filter_by(email=data['email'].strip().lower()).first()
    
    if not pompier or not pompier.check_password(data['password']):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Ici vous pourriez ajouter la gestion des sessions ou JWT
    session['pompier_id'] = pompier.id
    
    return jsonify({
        'message': 'Connexion réussie',
        'pompier': pompier.to_dict()
    }), 200

@bp.route('/deconnexion', methods=['POST'])
def deconnexion():
    """Déconnexion du pompier"""
    session.pop('pompier_id', None)
    return jsonify({'message': 'Déconnexion réussie'}), 200

@bp.route('/grades', methods=['GET'])
def get_grades():
    """Récupérer la liste des grades disponibles"""
    grades = [
        'Sapeur 2ème classe',
        'Sapeur 1ère classe', 
        'Caporal',
        'Caporal-chef',
        'Sergent',
        'Sergent-chef',
        'Adjudant',
        'Adjudant-chef',
        'Major',
        'Lieutenant',
        'Capitaine',
        'Commandant',
        'Lieutenant-colonel',
        'Colonel'
    ]
    return jsonify({'grades': grades}), 200

@bp.route('/admin/pompiers', methods=['GET'])
def get_all_pompiers():
    """Récupérer la liste de tous les pompiers (admin seulement)"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        pompiers = Pompier.query.all()
        pompiers_data = [pompier.to_dict() for pompier in pompiers]
        return jsonify({'pompiers': pompiers_data}), 200
    except Exception as e:
        return jsonify({'error': 'Erreur lors de la récupération des pompiers'}), 500

@bp.route('/admin/pompier/<int:pompier_id>', methods=['PUT'])
def update_pompier(pompier_id):
    """Modifier les informations d'un pompier (admin seulement)"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données manquantes'}), 400
    
    try:
        pompier = Pompier.query.get(pompier_id)
        if not pompier:
            return jsonify({'error': 'Pompier non trouvé'}), 404
        
        # Mettre à jour les champs si présents
        if 'nom' in data:
            pompier.nom = data['nom'].strip().title()
        if 'prenom' in data:
            pompier.prenom = data['prenom'].strip().title()
        if 'grade' in data:
            pompier.grade = data['grade']
        if 'email' in data:
            # Vérifier que l'email n'est pas déjà utilisé par un autre pompier
            existing = Pompier.query.filter(
                Pompier.email == data['email'].strip().lower(),
                Pompier.id != pompier_id
            ).first()
            if existing:
                return jsonify({'error': 'Cette adresse email est déjà utilisée'}), 400
            pompier.email = data['email'].strip().lower()
        if 'adresse' in data:
            pompier.adresse = data['adresse']
        if 'type_pompier' in data:
            pompier.type_pompier = data['type_pompier']
        
        # Changer le mot de passe si fourni
        if 'password' in data and data['password']:
            is_valid, message = validate_password(data['password'])
            if not is_valid:
                return jsonify({'error': message}), 400
            pompier.set_password(data['password'])
        
        db.session.commit()
        return jsonify({
            'message': 'Pompier modifié avec succès',
            'pompier': pompier.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de la modification du pompier'}), 500

@bp.route('/admin/pompier/<int:pompier_id>', methods=['DELETE'])
def delete_pompier(pompier_id):
    """Supprimer un pompier (admin seulement)"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        pompier = Pompier.query.get(pompier_id)
        if not pompier:
            return jsonify({'error': 'Pompier non trouvé'}), 404
        
        # Empêcher la suppression du dernier admin
        if pompier.role == 'admin':
            admin_count = Pompier.query.filter_by(role='admin').count()
            if admin_count <= 1:
                return jsonify({'error': 'Impossible de supprimer le dernier administrateur'}), 400
        
        db.session.delete(pompier)
        db.session.commit()
        return jsonify({'message': 'Pompier supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de la suppression du pompier'}), 500

@bp.route('/check-admin', methods=['GET'])
def check_admin_status():
    """Vérifier si l'utilisateur connecté est admin"""
    return jsonify({'is_admin': is_admin()}), 200

@bp.route('/planning/disponibilites', methods=['GET'])
def get_disponibilites():
    """Récupérer les disponibilités de tous les pompiers"""
    try:
        # Lire le fichier CSV des disponibilités
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'disponibilites_2026.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({'error': 'Fichier des disponibilités non trouvé'}), 404
        
        df = pd.read_csv(csv_path)
        
        # Convertir en format JSON plus facilement utilisable
        disponibilites = []
        id_col = df.columns[0]
        
        for _, row in df.iterrows():
            pompier_id = row[id_col]
            pompier_dispos = []
            
            for col in df.columns[1:]:
                try:
                    date_str, creneau = col.split('_creneau')
                    slot = int(creneau)
                    is_available = str(row[col]).lower() in ['oui', 'yes', '1', 'x', 'true']
                    
                    pompier_dispos.append({
                        'date': date_str,
                        'slot': slot,
                        'available': is_available
                    })
                except:
                    continue
            
            disponibilites.append({
                'pompier_id': pompier_id,
                'disponibilites': pompier_dispos
            })
        
        return jsonify({'disponibilites': disponibilites}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la lecture des disponibilités: {str(e)}'}), 500

@bp.route('/planning/optimise', methods=['POST'])
def generate_planning_optimise():
    """Générer le planning optimisé en exécutant le script Python"""
    try:
        # Chemin vers le script de planning optimal
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'planning_Optimal.py')
        
        if not os.path.exists(script_path):
            return jsonify({'error': 'Script de planning optimal non trouvé'}), 404
        
        # Exécuter le script
        result = subprocess.run(['python', script_path], 
                              capture_output=True, 
                              text=True, 
                              cwd=os.path.dirname(script_path))
        
        if result.returncode != 0:
            return jsonify({'error': f'Erreur lors de l\'exécution: {result.stderr}'}), 500
        
        # Lire le fichier de résultat généré
        output_path = os.path.join(os.path.dirname(script_path), 'planning_optimise.csv')
        
        if not os.path.exists(output_path):
            return jsonify({'error': 'Fichier de planning optimisé non généré'}), 500
        
        df_planning = pd.read_csv(output_path)
        planning_data = df_planning.to_dict('records')
        
        return jsonify({
            'message': 'Planning optimisé généré avec succès',
            'planning': planning_data,
            'output': result.stdout
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la génération du planning: {str(e)}'}), 500

@bp.route('/planning/optimise', methods=['GET'])
def get_planning_optimise():
    """Récupérer le planning optimisé existant"""
    try:
        output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'planning_optimise.csv')
        
        if not os.path.exists(output_path):
            return jsonify({'error': 'Aucun planning optimisé disponible. Générez-en un d\'abord.'}), 404
        
        df_planning = pd.read_csv(output_path)
        planning_data = df_planning.to_dict('records')
        
        return jsonify({'planning': planning_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la lecture du planning: {str(e)}'}), 500

@bp.route('/planning/pompiers', methods=['GET'])
def get_pompiers_info():
    """Récupérer les informations des pompiers depuis le fichier Excel"""
    try:
        excel_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'SPV Pibrac Hackathon.xlsx')
        
        if not os.path.exists(excel_path):
            return jsonify({'error': 'Fichier des pompiers non trouvé'}), 404
        
        # Lire le fichier Excel
        xl = pd.ExcelFile(excel_path)
        df_raw = xl.parse("2026", header=None)
        
        # Traitement similaire au script planning_Optimal.py
        top = df_raw.iloc[2].fillna('')
        sub = df_raw.iloc[3].fillna('')
        cols = [(str(a).strip() if str(b).strip()=="" else f"{str(a).strip()} - {str(b).strip()}") for a,b in zip(top,sub)]
        
        df = df_raw.iloc[4:].copy()
        df.columns = cols
        df = df.reset_index(drop=True)
        
        pompiers = []
        col_grade = "Grade"
        col_nom = "Nom"
        
        for _, row in df.iterrows():
            nom = str(row.get(col_nom, "")).strip()
            if not nom or nom.lower() == "nan":
                continue
            
            grade = str(row.get(col_grade, "")).strip()
            
            # Récupération des habilitations
            habs = []
            suap_cols = [c for c in df.columns if "SUAP" in str(c).upper()]
            inc_col = next((c for c in df.columns if "INC" in str(c).upper()), None)
            cod0_col = next((c for c in df.columns if "COD 0" in str(c).upper() or "COD0" in str(c).upper()), None)
            cod1_col = next((c for c in df.columns if "COD1" in str(c).upper() or "COD 1" in str(c).upper()), None)
            pl_col = next((c for c in df.columns if "PERMIS C" in str(c).upper() or "PERMIS PL" in str(c).upper()), None)
            b_col = next((c for c in df.columns if "PERMIS B" in str(c).upper() or str(c).upper() == "B"), None)
            
            if suap_cols and any(str(row[c]).strip().upper() == "X" for c in suap_cols): habs.append("SUAP")
            if inc_col and str(row[inc_col]).strip().upper() == "X": habs.append("INC")
            if cod0_col and str(row[cod0_col]).strip().upper() == "X": habs.append("COD0")
            if cod1_col and str(row[cod1_col]).strip().upper() == "X": habs.append("COD1")
            if pl_col and str(row[pl_col]).strip().upper() == "X": habs.append("PL")
            if b_col and str(row[b_col]).strip().upper() == "X": habs.append("B")
            
            pompiers.append({
                'id': nom,  # Utiliser le nom comme ID pour correspondre au CSV
                'nom': nom,
                'grade': grade,
                'habilitations': habs
            })
        
        return jsonify({'pompiers': pompiers}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la lecture des pompiers: {str(e)}'}), 500

@bp.route('/planning/calendar/<year>/<month>', methods=['GET'])
def get_calendar_data(year, month):
    """Récupérer les données du calendrier pour un mois donné"""
    try:
        year = int(year)
        month = int(month)
        
        # Générer les jours du mois
        cal = calendar.monthcalendar(year, month)
        days_in_month = calendar.monthrange(year, month)[1]
        
        # Créer la liste des dates
        dates = []
        for day in range(1, days_in_month + 1):
            date_str = f"{year:04d}-{month:02d}-{day:02d}"
            dates.append({
                'date': date_str,
                'day': day,
                'weekday': calendar.weekday(year, month, day)
            })
        
        return jsonify({
            'year': year,
            'month': month,
            'month_name': calendar.month_name[month],
            'dates': dates,
            'calendar_matrix': cal
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la génération du calendrier: {str(e)}'}), 500

@bp.route('/admin/import-pompiers', methods=['POST'])
def import_pompiers_from_excel():
    """Importer tous les pompiers depuis le fichier Excel et créer leurs comptes"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        excel_path = '/home/Myriam/Documents/Hackathon-IA/SPV Pibrac Hackathon.xlsx'
        
        if not os.path.exists(excel_path):
            return jsonify({'error': 'Fichier Excel non trouvé'}), 404
        
        # Lire le fichier Excel
        xl = pd.ExcelFile(excel_path)
        df_raw = xl.parse("2026", header=None)
        
        # Traitement similaire au script planning_Optimal.py
        top = df_raw.iloc[2].fillna('')
        sub = df_raw.iloc[3].fillna('')
        cols = [(str(a).strip() if str(b).strip()=="" else f"{str(a).strip()} - {str(b).strip()}") for a,b in zip(top,sub)]
        
        df = df_raw.iloc[4:].copy()
        df.columns = cols
        df = df.reset_index(drop=True)
        
        col_grade = "Grade"
        col_nom = "Nom"
        
        # Collecter les habilitations disponibles
        suap_cols = [c for c in df.columns if "SUAP" in str(c).upper()]
        inc_col = next((c for c in df.columns if "INC" in str(c).upper()), None)
        cod0_col = next((c for c in df.columns if "COD 0" in str(c).upper() or "COD0" in str(c).upper()), None)
        cod1_col = next((c for c in df.columns if "COD1" in str(c).upper() or "COD 1" in str(c).upper()), None)
        pl_col = next((c for c in df.columns if "PERMIS C" in str(c).upper() or "PERMIS PL" in str(c).upper()), None)
        b_col = next((c for c in df.columns if "PERMIS B" in str(c).upper() or str(c).upper() == "B"), None)
        
        created_count = 0
        updated_count = 0
        errors = []
        pompiers_data = []
        
        for index, row in df.iterrows():
            try:
                nom_complet = str(row.get(col_nom, "")).strip()
                if not nom_complet or nom_complet.lower() == "nan":
                    continue
                
                grade = str(row.get(col_grade, "")).strip()
                if not grade or grade.lower() == "nan":
                    grade = "Sapeur"
                
                # Parser le nom complet
                prenom, nom = parse_nom_complet(nom_complet)
                
                # Générer l'email
                email = generate_email(nom, prenom)
                
                # Récupération des habilitations
                habs = []
                if suap_cols and any(str(row[c]).strip().upper() == "X" for c in suap_cols): 
                    habs.append("SUAP")
                if inc_col and str(row[inc_col]).strip().upper() == "X": 
                    habs.append("INC")
                if cod0_col and str(row[cod0_col]).strip().upper() == "X": 
                    habs.append("COD0")
                if cod1_col and str(row[cod1_col]).strip().upper() == "X": 
                    habs.append("COD1")
                if pl_col and str(row[pl_col]).strip().upper() == "X": 
                    habs.append("PL")
                if b_col and str(row[b_col]).strip().upper() == "X": 
                    habs.append("B")
                
                # Vérifier si le pompier existe déjà
                existing_pompier = Pompier.query.filter_by(email=email).first()
                
                if existing_pompier:
                    # Mettre à jour les informations
                    existing_pompier.nom = nom
                    existing_pompier.prenom = prenom
                    existing_pompier.grade = grade
                    updated_count += 1
                    pompier = existing_pompier
                else:
                    # Créer un nouveau pompier
                    password = generate_password()
                    
                    new_pompier = Pompier(
                        nom=nom,
                        prenom=prenom,
                        grade=grade,
                        email=email,
                        type_pompier='volontaire'
                    )
                    new_pompier.set_password(password)
                    
                    db.session.add(new_pompier)
                    created_count += 1
                    pompier = new_pompier
                
                # Ajouter les données pour le retour
                pompiers_data.append({
                    'nom': nom,
                    'prenom': prenom,
                    'grade': grade,
                    'email': email,
                    'habilitations': habs,
                    'password': password if not existing_pompier else 'Mot de passe existant',
                    'status': 'created' if not existing_pompier else 'updated'
                })
                
            except Exception as e:
                errors.append(f"Ligne {index + 5}: {str(e)}")
                continue
        
        # Sauvegarder en base
        db.session.commit()
        
        return jsonify({
            'message': f'Import terminé: {created_count} créés, {updated_count} mis à jour',
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'pompiers': pompiers_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de l\'import: {str(e)}'}), 500

@bp.route('/admin/export-comptes', methods=['GET'])
def export_comptes_pompiers():
    """Exporter la liste des comptes créés avec leurs mots de passe"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        pompiers = Pompier.query.all()
        
        comptes_data = []
        for pompier in pompiers:
            comptes_data.append({
                'id': pompier.id,
                'nom': pompier.nom,
                'prenom': pompier.prenom,
                'grade': pompier.grade,
                'email': pompier.email,
                'role': pompier.role,
                'type_pompier': pompier.type_pompier,
                'created_at': pompier.created_at.strftime('%Y-%m-%d %H:%M:%S') if pompier.created_at else None
            })
        
        return jsonify({
            'total': len(comptes_data),
            'comptes': comptes_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de l\'export: {str(e)}'}), 500

@bp.route('/admin/reset-password/<int:pompier_id>', methods=['POST'])
def reset_password_pompier(pompier_id):
    """Réinitialiser le mot de passe d'un pompier"""
    # Vérifier les droits d'admin
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        pompier = Pompier.query.get(pompier_id)
        if not pompier:
            return jsonify({'error': 'Pompier non trouvé'}), 404
        
        new_password = generate_password()
        pompier.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'message': f'Mot de passe réinitialisé pour {pompier.prenom} {pompier.nom}',
            'email': pompier.email,
            'new_password': new_password
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la réinitialisation: {str(e)}'}), 500

@bp.route('/check-admin', methods=['GET'])
def check_admin():
    """Vérifier si l'utilisateur connecté a les droits d'admin"""
    try:
        # Pour l'instant, on simule qu'il y a un utilisateur admin
        # En production, il faudrait vérifier la session/JWT
        return jsonify({'is_admin': True})
    except Exception as e:
        print(f"Erreur lors de la vérification admin: {e}")
        return jsonify({'error': str(e), 'is_admin': False}), 500
