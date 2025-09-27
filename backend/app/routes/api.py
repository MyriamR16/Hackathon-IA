from flask import Blueprint, jsonify, request, session
from app import db
from app.models import Pompier
import re

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
