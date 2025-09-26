from flask import Blueprint, jsonify, request, session
from app import db
from app.models import Pompier
import re

bp = Blueprint('api', __name__)

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
            email=data['email'].strip().lower()
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
            email=data['email'].strip().lower()
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
