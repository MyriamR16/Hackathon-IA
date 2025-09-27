import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GererPompiers.css';

interface Pompier {
  id: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  adresse: string;
  type_pompier: string;
  role: string;
  created_at: string;
}

interface EditModalProps {
  pompier: Pompier | null;
  onClose: () => void;
  onSave: (pompier: Pompier) => void;
}

const EditModal: React.FC<EditModalProps> = ({ pompier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    grade: '',
    email: '',
    adresse: '',
    type_pompier: 'volontaire',
    password: ''
  });

  const grades = [
    { code: '2CL', label: 'Sapeur de 2ème classe (2CL)' },
    { code: '1CL', label: 'Sapeur de 1ère classe (1CL)' },
    { code: 'CPL', label: 'Caporal (CPL)' },
    { code: 'CCH', label: 'Caporal-Chef (CCH)' },
    { code: 'SGT', label: 'Sergent (SGT)' },
    { code: 'SCH', label: 'Sergent-Chef (SCH)' },
    { code: 'ADJ', label: 'Adjudant (ADJ)' },
    { code: 'ADC', label: 'Adjudant Chef (ADC)' },
    { code: 'LTN', label: 'Lieutenant (LTN)' }
  ];

  useEffect(() => {
    if (pompier) {
      setFormData({
        nom: pompier.nom,
        prenom: pompier.prenom,
        grade: pompier.grade,
        email: pompier.email,
        adresse: pompier.adresse || '',
        type_pompier: pompier.type_pompier || 'volontaire',
        password: ''
      });
    }
  }, [pompier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pompier) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/pompier/${pompier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        onSave(data.pompier);
        onClose();
      } else {
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  if (!pompier) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier Pompier {pompier.nom}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Identifiant</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                placeholder="A, B, C, AA, AB..."
                required
              />
            </div>
            <div className="form-group">
              <label>Grade</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                required
              >
                {grades.map(grade => (
                  <option key={grade.code} value={grade.label}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type_pompier}
                onChange={(e) => setFormData({...formData, type_pompier: e.target.value})}
              >
                <option value="volontaire">Pompier Volontaire</option>
                <option value="professionnel">Pompier Professionnel</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <textarea
              value={formData.adresse}
              onChange={(e) => setFormData({...formData, adresse: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Nouveau mot de passe..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GererPompiers: React.FC = () => {
  const navigate = useNavigate();
  const [pompiers, setPompiers] = useState<Pompier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPompier, setEditingPompier] = useState<Pompier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPompiers();
  }, []);

  const loadPompiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/pompiers', {
        credentials: 'include',
      });

      if (response.status === 403) {
        // Pas les droits d'admin, rediriger
        navigate('/dashboard');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setPompiers(data.pompiers);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pompier: Pompier) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le pompier ${pompier.nom} ?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/pompier/${pompier.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setPompiers(pompiers.filter(p => p.id !== pompier.id));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const handleEdit = (pompier: Pompier) => {
    setEditingPompier(pompier);
  };

  const handleSave = (updatedPompier: Pompier) => {
    setPompiers(pompiers.map(p => p.id === updatedPompier.id ? updatedPompier : p));
  };

  const filteredPompiers = pompiers.filter(pompier =>
    pompier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pompier.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pompier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="gerer-pompiers-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="gerer-pompiers-container">
      <div className="gerer-pompiers-content">
        <div className="page-header">
          <h1>📋 Gestion des Sapeurs-Pompiers</h1>
          <p>Gérez les comptes et informations des membres de votre équipe</p>
        </div>

        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher par identifiant (A, B, C...) ou grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats">
            <span className="stat-item">
              👥 Total: <strong>{pompiers.length}</strong>
            </span>
            <span className="stat-item">
              👑 Admins: <strong>{pompiers.filter(p => p.role === 'admin').length}</strong>
            </span>
          </div>
        </div>

        <div className="pompiers-grid">
          {filteredPompiers.map(pompier => (
            <div key={pompier.id} className={`pompier-card ${pompier.role === 'admin' ? 'admin-card' : ''}`}>
              <div className="card-header">
                <div className="pompier-info">
                  <h3>Pompier {pompier.nom}</h3>
                  <span className="grade">{pompier.grade}</span>
                  {pompier.role === 'admin' && <span className="admin-badge">👑 Admin</span>}
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleEdit(pompier)}
                    className="btn-icon edit-btn"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  {pompier.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(pompier)}
                      className="btn-icon delete-btn"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              <div className="card-content">
                <div className="info-item">
                  <span className="label">🆔 ID Planning:</span>
                  <span><strong>{pompier.nom}</strong></span>
                </div>
                <div className="info-item">
                  <span className="label">📧 Email:</span>
                  <span>{pompier.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">🏷️ Type:</span>
                  <span>{pompier.type_pompier === 'professionnel' ? 'Professionnel' : 'Volontaire'}</span>
                </div>
                {pompier.adresse && (
                  <div className="info-item">
                    <span className="label">📍 Adresse:</span>
                    <span>{pompier.adresse}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">📅 Créé le:</span>
                  <span>{new Date(pompier.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPompiers.length === 0 && (
          <div className="no-results">
            <p>Aucun pompier trouvé{searchTerm && ` pour "${searchTerm}"`}</p>
            {!searchTerm && pompiers.length === 1 && (
              <p>Utilisez la fonction "Import Pompiers" pour ajouter les pompiers depuis Excel</p>
            )}
          </div>
        )}
      </div>

      <EditModal
        pompier={editingPompier}
        onClose={() => setEditingPompier(null)}
        onSave={handleSave}
      />
    </div>
  );
};

export default GererPompiers;
