import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

interface LoginFormData {
  email: string;
  password: string;
}

interface Pompier {
  id: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  created_at: string;
}

const Connexion: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur lors de la modification
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/connexion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarder les informations du pompier dans le localStorage
        localStorage.setItem('pompier', JSON.stringify(data.pompier));
        
        // Rediriger vers le tableau de bord (à créer plus tard)
        navigate('/dashboard');
      } else {
        setError(data.error || 'Erreur lors de la connexion');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🚒 Connexion Sapeurs-Pompiers</h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@pompiers.fr"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <small>Contact administrateur pour obtenir un compte</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Connexion;
