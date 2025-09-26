import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface Pompier {
  id: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Récupérer les informations du pompier connecté
  const pompierData = localStorage.getItem('pompier');
  const pompier: Pompier | null = pompierData ? JSON.parse(pompierData) : null;

  if (!pompier) {
    // Si pas de pompier connecté, rediriger vers la connexion
    navigate('/connexion');
    return null;
  }

  const handleDeconnexion = async () => {
    try {
      await fetch('http://localhost:5000/api/deconnexion', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer les données locales et rediriger
      localStorage.removeItem('pompier');
      navigate('/connexion');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚒 Tableau de Bord Sapeurs-Pompiers</h1>
          <div className="user-info">
            <span>Bienvenue, {pompier.grade} {pompier.prenom} {pompier.nom}</span>
            <button onClick={handleDeconnexion} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Informations du profil</h2>
          <div className="profile-info">
            <div className="info-item">
              <label>Nom complet:</label>
              <span>{pompier.prenom} {pompier.nom}</span>
            </div>
            <div className="info-item">
              <label>Grade:</label>
              <span>{pompier.grade}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{pompier.email}</span>
            </div>
            <div className="info-item">
              <label>Date d'inscription:</label>
              <span>{new Date(pompier.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>🔥 Interventions</h3>
            <p>Gérer et consulter les interventions</p>
            <button className="card-button">Voir les interventions</button>
          </div>

          <div className="dashboard-card">
            <h3>👥 Équipes</h3>
            <p>Gestion des équipes et planning</p>
            <button className="card-button">Gérer les équipes</button>
          </div>

          <div className="dashboard-card">
            <h3>🚨 Urgences</h3>
            <p>Alertes et communications urgentes</p>
            <button className="card-button">Voir les alertes</button>
          </div>

          <div className="dashboard-card">
            <h3>📋 Rapports</h3>
            <p>Rapports d'intervention et statistiques</p>
            <button className="card-button">Consulter les rapports</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
