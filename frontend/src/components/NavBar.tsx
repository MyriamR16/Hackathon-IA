import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/check-admin', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut admin:', error);
      }
    };

    checkAdminStatus();
  }, []);

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
    <nav className="navbar">
      <div className="navbar-content">
        {/* Bouton de déconnexion à gauche */}
        <div className="navbar-left">
          <button onClick={handleDeconnexion} className="logout-button">
            Déconnexion
          </button>
        </div>

        {/* Navigation centrale - différente selon le rôle */}
        <div className="navbar-center">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            🏠 Accueil
          </Link>
          
          <Link 
            to="/planning" 
            className={`nav-link ${location.pathname === '/planning' ? 'active' : ''}`}
          >
            📅 Planning
          </Link>

          <Link 
            to="/suivi-heures" 
            className={`nav-link ${location.pathname === '/suivi-heures' ? 'active' : ''}`}
          >
            📊 Suivi des Heures
          </Link>
          
          {/* Liens disponibles seulement pour les admins */}
          {isAdmin && (
            <>
              <Link 
                to="/ajouter-pompier" 
                className={`nav-link ${location.pathname === '/ajouter-pompier' ? 'active' : ''}`}
              >
                👥 Ajouter un Pompier
              </Link>
              <Link 
                to="/gerer-pompiers" 
                className={`nav-link ${location.pathname === '/gerer-pompiers' ? 'active' : ''}`}
              >
                📋 Gérer les Pompiers
              </Link>
            </>
          )}
        </div>

        {/* Logo ou titre à droite avec indicateur admin */}
        <div className="navbar-right">
          <span className="navbar-title">
            {isAdmin && <span className="admin-badge">�</span>}
            �🚒 SP Manager
          </span>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
