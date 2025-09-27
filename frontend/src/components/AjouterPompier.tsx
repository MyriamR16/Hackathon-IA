import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AjouterPompier.css';

interface FormData {
  nom: string;
  prenom: string;
  adresse: string;
  grade: string;
  type: 'volontaire' | 'professionnel';
  email: string;
  password: string;
  confirmPassword: string;
}

const AjouterPompier: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    adresse: '',
    grade: '',
    type: 'volontaire',
    email: '',
    password: '',
    confirmPassword: ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      setLoading(false);
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.email || !formData.password || !formData.grade || !formData.adresse) {
      setMessage({ type: 'error', text: 'Tous les champs sont obligatoires' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/add-pompier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          grade: formData.grade,
          email: formData.email,
          password: formData.password,
          adresse: formData.adresse,
          type: formData.type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sapeur-pompier ajouté avec succès !' });
        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          prenom: '',
          adresse: '',
          grade: '',
          type: 'volontaire',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Rediriger vers le dashboard après 2 secondes
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'ajout' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ajouter-pompier-container">
      <div className="ajouter-pompier-content">
        <div className="form-container">
          <header className="form-header">
            <h1>👥 Ajouter un Sapeur-Pompier</h1>
            <p>Créer un nouveau compte pour un membre de l'équipe</p>
          </header>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="pompier-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type de pompier *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="volontaire">Pompier Volontaire</option>
                  <option value="professionnel">Pompier Professionnel</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="grade">Grade *</label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un grade</option>
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
                <label htmlFor="prenom">Prénom *</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Prénom du pompier"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nom">Nom *</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Nom de famille"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse *</label>
              <textarea
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                required
                placeholder="Adresse complète (rue, ville, code postal)"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="adresse@exemple.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Mot de passe *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 8 caractères"
                />
                <small className="form-help">
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirmer le mot de passe"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le Sapeur-Pompier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjouterPompier;
