from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Pompier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    grade = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    adresse = db.Column(db.Text, nullable=True)
    type_pompier = db.Column(db.String(50), nullable=True)  # 'volontaire' ou 'professionnel'
    role = db.Column(db.String(50), default='pompier', nullable=False)  # 'admin' ou 'pompier'
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hacher le mot de passe"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Vérifier le mot de passe"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'grade': self.grade,
            'email': self.email,
            'adresse': self.adresse,
            'type_pompier': self.type_pompier,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Pompier {self.prenom} {self.nom} - {self.grade}>'
