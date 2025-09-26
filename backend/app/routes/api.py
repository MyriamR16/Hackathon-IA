from flask import Blueprint, jsonify, request
from app import db

bp = Blueprint('api', __name__)

@bp.route('/users', methods=['GET'])
def get_users():
    """Exemple d'endpoint API pour récupérer les utilisateurs"""
    return jsonify({
        'users': [
            {'id': 1, 'name': 'User 1', 'email': 'user1@example.com'},
            {'id': 2, 'name': 'User 2', 'email': 'user2@example.com'}
        ]
    })

@bp.route('/users', methods=['POST'])
def create_user():
    """Exemple d'endpoint API pour créer un utilisateur"""
    data = request.get_json()
    
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({'error': 'Name and email are required'}), 400
    
    # Ici vous ajouteriez la logique pour créer l'utilisateur en base
    new_user = {
        'id': 3,  # Serait généré par la base de données
        'name': data['name'],
        'email': data['email']
    }
    
    return jsonify({
        'message': 'User created successfully',
        'user': new_user
    }), 201

@bp.route('/data')
def get_data():
    """Endpoint exemple pour récupérer des données"""
    return jsonify({
        'data': {
            'hackathon': 'IA 2025',
            'theme': 'Intelligence Artificielle',
            'participants': 150
        }
    })
