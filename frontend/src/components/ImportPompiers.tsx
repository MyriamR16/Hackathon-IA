import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './ImportPompiers.css';

interface PompierData {
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  habilitations: string[];
  password: string;
  status: 'created' | 'updated';
}

interface CompteData {
  id: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  role: string;
  type_pompier: string;
  created_at: string;
}

const ImportPompiers: React.FC = () => {
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: string[];
    pompiers: PompierData[];
  } | null>(null);
  const [comptes, setComptes] = useState<CompteData[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'import' | 'comptes'>('import');

  // Vérifier les droits d'admin
  useEffect(() => {
    checkAdminRights();
    if (selectedTab === 'comptes') {
      loadComptes();
    }
  }, [selectedTab]);

  const checkAdminRights = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-admin');
      const data = await response.json();
      if (!data.is_admin) {
        alert('Accès refusé. Droits d\'administrateur requis.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des droits:', error);
      navigate('/dashboard');
    }
  };

  const loadComptes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/export-comptes');
      const data = await response.json();
      if (response.ok) {
        setComptes(data.comptes);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/import-pompiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setImportResult(data);
        setSelectedTab('comptes');
        loadComptes();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des pompiers');
    } finally {
      setIsImporting(false);
    }
  };

  const resetPassword = async (pompier_id: number, nom: string, prenom: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${prenom} ${nom} ?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/reset-password/${pompier_id}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Nouveau mot de passe pour ${data.email}: ${data.new_password}`);
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const exportToCSV = () => {
    if (importResult && importResult.pompiers.length > 0) {
      const csvContent = [
        ['Nom', 'Prénom', 'Grade', 'Email', 'Mot de passe', 'Habilitations', 'Statut'],
        ...importResult.pompiers.map(p => [
          p.nom,
          p.prenom,
          p.grade,
          p.email,
          p.password,
          p.habilitations.join(', '),
          p.status === 'created' ? 'Créé' : 'Mis à jour'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `comptes_pompiers_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  return (
    <div className="import-pompiers">
      <div className="import-container">
        <header className="import-header">
          <h1>🚒 Gestion des Comptes Pompiers</h1>
          <div className="tabs">
            <button 
              className={`tab ${selectedTab === 'import' ? 'active' : ''}`}
              onClick={() => setSelectedTab('import')}
            >
              📥 Import depuis Excel
            </button>
            <button 
              className={`tab ${selectedTab === 'comptes' ? 'active' : ''}`}
              onClick={() => setSelectedTab('comptes')}
            >
              👥 Comptes existants ({comptes.length})
            </button>
          </div>
        </header>

        {selectedTab === 'import' && (
          <div className="import-section">
            <div className="info-box">
              <h3>📋 Import automatique des pompiers</h3>
              <p>Cette fonction va :</p>
              <ul>
                <li>Lire le fichier <strong>SPV Pibrac Hackathon.xlsx</strong></li>
                <li>Créer un compte pour chaque pompier trouvé</li>
                <li>Générer automatiquement les emails et mots de passe</li>
                <li>Récupérer les grades et habilitations</li>
                <li>Mettre à jour les pompiers existants</li>
              </ul>
            </div>

            <div className="import-controls">
              <button 
                onClick={handleImport} 
                disabled={isImporting}
                className="import-button"
              >
                {isImporting ? '⏳ Import en cours...' : '🚀 Importer les pompiers'}
              </button>
            </div>

            {importResult && (
              <div className="import-results">
                <div className="results-header">
                  <h3>📊 Résultats de l'import</h3>
                  <button onClick={exportToCSV} className="export-button">
                    💾 Exporter en CSV
                  </button>
                </div>
                
                <div className="results-summary">
                  <div className="result-stat created">
                    <span className="number">{importResult.created}</span>
                    <span className="label">Créés</span>
                  </div>
                  <div className="result-stat updated">
                    <span className="number">{importResult.updated}</span>
                    <span className="label">Mis à jour</span>
                  </div>
                  <div className="result-stat errors">
                    <span className="number">{importResult.errors.length}</span>
                    <span className="label">Erreurs</span>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="errors-section">
                    <h4>⚠️ Erreurs rencontrées</h4>
                    <ul>
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pompiers-list">
                  <h4>👥 Pompiers traités</h4>
                  <div className="show-passwords">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                      />
                      Afficher les mots de passe
                    </label>
                  </div>
                  
                  <table className="pompiers-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Grade</th>
                        <th>Email</th>
                        <th>Mot de passe</th>
                        <th>Habilitations</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.pompiers.map((pompier, index) => (
                        <tr key={index} className={pompier.status}>
                          <td>{pompier.nom}</td>
                          <td>{pompier.prenom}</td>
                          <td>{pompier.grade}</td>
                          <td>{pompier.email}</td>
                          <td>
                            {showPasswords ? pompier.password : '••••••••'}
                          </td>
                          <td>{pompier.habilitations.join(', ')}</td>
                          <td>
                            <span className={`status ${pompier.status}`}>
                              {pompier.status === 'created' ? 'Créé' : 'Mis à jour'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'comptes' && (
          <div className="comptes-section">
            <div className="comptes-header">
              <h3>👥 Comptes existants</h3>
              <button onClick={loadComptes} className="refresh-button">
                🔄 Actualiser
              </button>
            </div>

            {comptes.length > 0 ? (
              <table className="comptes-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Grade</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Type</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comptes.map((compte) => (
                    <tr key={compte.id}>
                      <td>{compte.id}</td>
                      <td>{compte.nom}</td>
                      <td>{compte.prenom}</td>
                      <td>{compte.grade}</td>
                      <td>{compte.email}</td>
                      <td>
                        <span className={`role ${compte.role}`}>
                          {compte.role}
                        </span>
                      </td>
                      <td>{compte.type_pompier}</td>
                      <td>
                        {compte.created_at ? 
                          new Date(compte.created_at).toLocaleDateString('fr-FR') : 
                          'Non défini'
                        }
                      </td>
                      <td>
                        <button 
                          onClick={() => resetPassword(compte.id, compte.nom, compte.prenom)}
                          className="reset-password-button"
                          title="Réinitialiser le mot de passe"
                        >
                          🔑 Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-comptes">
                <p>Aucun compte trouvé. Utilisez l'import pour créer les comptes automatiquement.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPompiers;
