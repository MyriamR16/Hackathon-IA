from flask import Blueprint, jsonify, request

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return jsonify({
        'message': 'Hackathon IA Backend API',
        'status': 'running',
        'version': '1.0.0'
    })

@bp.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': '2025-09-26'
    })
