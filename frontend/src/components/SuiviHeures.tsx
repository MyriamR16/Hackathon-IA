import React, { useState, useEffect } from 'react';
import './SuiviHeures.css';

interface StatsPompier {
  pompier_id: string;
  nom: string;
  heures_realisees: number;
  heures_objectif: number;
  heures_manquantes: number;
  pourcentage_accompli: number;
  repartition_creneaux: {
    creneau1: number;
    creneau2: number;
    creneau3: number;
    creneau4: number;
  };
  details_mensuel: {
    [mois: string]: number;
  };
}

const SuiviHeures: React.FC = () => {
  const [listePompiers, setListePompiers] = useState<string[]>([]);
  const [selectedPompier, setSelectedPompier] = useState<string>('');
  const [statsHeures, setStatsHeures] = useState<StatsPompier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [annee, setAnnee] = useState(2025);

  const HEURES_OBJECTIF = 768; // Objectif annuel en heures
  const DUREE_CRENEAUX = {
    1: 6,  // 6h pour créneau 1
    2: 6,  // 6h pour créneau 2
    3: 12, // 12h pour créneau 3
    4: 6   // 6h pour créneau 4
  };

  useEffect(() => {
    loadListePompiers();
  }, []);

  const loadListePompiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/planning/pompiers');
      const data = await response.json();
      if (response.ok) {
        setListePompiers(data.pompiers || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la liste des pompiers');
    }
  };

  const calculerStatsPompier = async (pompierNom: string) => {
    if (!pompierNom) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Récupérer le planning optimisé
      const response = await fetch('http://localhost:5000/api/planning/optimise');
      const data = await response.json();
      
      if (!response.ok || !data.calendar) {
        setError('Erreur lors du chargement du planning optimisé');
        return;
      }

      const calendar = data.calendar;
      let heuresTotal = 0;
      const repartitionCreneaux = {
        creneau1: 0,
        creneau2: 0,
        creneau3: 0,
        creneau4: 0
      };
      const detailsMensuel: { [mois: string]: number } = {};

      // Parcourir tous les jours du planning
      Object.entries(calendar).forEach(([date, creneaux]: [string, any]) => {
        const mois = new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        // Vérifier chaque créneau
        [1, 2, 3, 4].forEach(numCreneau => {
          const creneau = creneaux[`creneau${numCreneau}`];
          if (creneau && creneau.pompiers) {
            // Chercher si le pompier est assigné à ce créneau
            const pompierAssgne = creneau.pompiers.find((p: any) => 
              p.name === pompierNom || p.id === pompierNom
            );
            
            if (pompierAssgne) {
              const dureeHeure = DUREE_CRENEAUX[numCreneau as keyof typeof DUREE_CRENEAUX];
              heuresTotal += dureeHeure;
              repartitionCreneaux[`creneau${numCreneau}` as keyof typeof repartitionCreneaux] += dureeHeure;
              
              if (!detailsMensuel[mois]) {
                detailsMensuel[mois] = 0;
              }
              detailsMensuel[mois] += dureeHeure;
            }
          }
        });
      });

      const heuresManquantes = Math.max(0, HEURES_OBJECTIF - heuresTotal);
      const pourcentageAccompli = Math.min(100, (heuresTotal / HEURES_OBJECTIF) * 100);

      const stats: StatsPompier = {
        pompier_id: pompierNom,
        nom: pompierNom,
        heures_realisees: heuresTotal,
        heures_objectif: HEURES_OBJECTIF,
        heures_manquantes: heuresManquantes,
        pourcentage_accompli: Math.round(pourcentageAccompli * 100) / 100,
        repartition_creneaux: repartitionCreneaux,
        details_mensuel: detailsMensuel
      };

      setStatsHeures(stats);

    } catch (err) {
      setError('Erreur lors du calcul des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handlePompierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pompier = event.target.value;
    setSelectedPompier(pompier);
    if (pompier) {
      calculerStatsPompier(pompier);
    } else {
      setStatsHeures(null);
    }
  };

  const getStatutColor = (pourcentage: number): string => {
    if (pourcentage >= 100) return '#4CAF50'; // Vert
    if (pourcentage >= 75) return '#FF9800';   // Orange
    return '#F44336'; // Rouge
  };

  return (
    <div className="suivi-heures">
      <div className="suivi-header">
        <h1>📊 Suivi des Heures de Travail</h1>
        <p>Suivi des heures d'astreinte réalisées par les pompiers en {annee}</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="pompier-select">Choisir un pompier :</label>
          <select 
            id="pompier-select"
            value={selectedPompier} 
            onChange={handlePompierChange}
            className="pompier-selector"
          >
            <option value="">-- Sélectionner un pompier --</option>
            {listePompiers.map(pompier => (
              <option key={pompier} value={pompier}>{pompier}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="annee-select">Année :</label>
          <select 
            id="annee-select"
            value={annee} 
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="annee-selector"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          Calcul des heures en cours...
        </div>
      )}

      {statsHeures && !loading && (
        <div className="stats-container">
          {/* Résumé principal */}
          <div className="stats-summary">
            <div className="pompier-info">
              <h2>👨‍🚒 {statsHeures.nom}</h2>
              <div className="progress-circle" style={{ 
                background: `conic-gradient(${getStatutColor(statsHeures.pourcentage_accompli)} ${statsHeures.pourcentage_accompli * 3.6}deg, #e0e0e0 0deg)` 
              }}>
                <div className="progress-inner">
                  <span className="percentage">{statsHeures.pourcentage_accompli}%</span>
                  <span className="label">accompli</span>
                </div>
              </div>
            </div>

            <div className="hours-details">
              <div className="hour-stat">
                <span className="value">{statsHeures.heures_realisees}h</span>
                <span className="label">Réalisées</span>
              </div>
              <div className="hour-stat">
                <span className="value">{statsHeures.heures_objectif}h</span>
                <span className="label">Objectif</span>
              </div>
              {statsHeures.heures_manquantes > 0 && (
                <div className="hour-stat alert">
                  <span className="value">-{statsHeures.heures_manquantes}h</span>
                  <span className="label">Manquantes</span>
                </div>
              )}
            </div>
          </div>

          {/* Message d'alerte si nécessaire */}
          {statsHeures.heures_manquantes > 0 && (
            <div className="alert-message">
              🚨 <strong>Attention !</strong> Il manque encore <strong>{statsHeures.heures_manquantes} heures</strong> à ce pompier 
              pour atteindre l'objectif annuel de {HEURES_OBJECTIF} heures d'astreinte.
            </div>
          )}

          {/* Répartition par créneaux */}
          <div className="repartition-creneaux">
            <h3>📅 Répartition par créneaux</h3>
            <div className="creneaux-grid">
              {Object.entries(statsHeures.repartition_creneaux).map(([creneau, heures]) => {
                const numCreneau = parseInt(creneau.replace('creneau', ''));
                return (
                  <div key={creneau} className="creneau-stat">
                    <div className="creneau-header">
                      <span className="creneau-name">Créneau {numCreneau}</span>
                      <span className="creneau-duration">({DUREE_CRENEAUX[numCreneau as keyof typeof DUREE_CRENEAUX]}h/service)</span>
                    </div>
                    <div className="creneau-hours">{heures}h</div>
                    <div className="creneau-services">{heures / DUREE_CRENEAUX[numCreneau as keyof typeof DUREE_CRENEAUX]} services</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Détails mensuels */}
          <div className="details-mensuel">
            <h3>📊 Détails mensuels</h3>
            <div className="mois-grid">
              {Object.entries(statsHeures.details_mensuel)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([mois, heures]) => (
                  <div key={mois} className="mois-stat">
                    <span className="mois-name">{mois}</span>
                    <span className="mois-hours">{heures}h</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuiviHeures;
