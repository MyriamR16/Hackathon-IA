import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanningContext } from '../context/PlanningContext';
import './PlanningCalendrier.css';

interface Disponibilite {
  date: string;
  slot: number;
  available: boolean;
}

interface PompierDisponibilites {
  pompier_id: string;
  disponibilites: Disponibilite[];
}

interface DisponibilitesIndividuelles {
  [date: string]: {
    [creneau: string]: boolean;
  };
}

interface PompierPlanifie {
  id: string;
  name: string;
  role: string | null;
  category: string;
}

interface CreneauPlanning {
  pompiers: PompierPlanifie[];
  color: string;
  coverage_percent: number;
  pompiers_count: number;
  shortages: { [role: string]: number };
  missing_roles: string[];
}

interface PlanningCalendar {
  [date: string]: {
    creneau1: CreneauPlanning;
    creneau2: CreneauPlanning;
    creneau3: CreneauPlanning;
    creneau4: CreneauPlanning;
  };
}

interface CalendarDate {
  date: string;
  day: number;
  weekday: number;
}

const PlanningCalendrier: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters } = usePlanningContext();
  const [listePompiers, setListePompiers] = useState<string[]>([]);
  const [disponibilites, setDisponibilites] = useState<PompierDisponibilites[]>([]);
  const [disponibilitesIndividuelles, setDisponibilitesIndividuelles] = useState<DisponibilitesIndividuelles>({});
  const [planningOptimise, setPlanningOptimise] = useState<PlanningCalendar>({});
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedCreneauDetail, setSelectedCreneauDetail] = useState<{date: string, slot: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Utilisation des filtres du contexte
  const currentMonth = filters.currentMonth;
  const currentYear = filters.currentYear;
  const selectedPompier = filters.selectedPompier;
  const viewMode = filters.viewMode;
  const selectedSlot = filters.selectedSlot;

  const slotLabels = {
    1: 'Créneau 1',
    2: 'Créneau 2', 
    3: 'Créneau 3 (Astreinte)',
    4: 'Créneau 4'
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    loadListePompiers();
    loadDisponibilites();
    loadCalendar();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadPlanningOptimise();
  }, []);

  useEffect(() => {
    if (selectedPompier) {
      loadDisponibilitesIndividuelles(selectedPompier);
    } else {
      setDisponibilitesIndividuelles({});
    }
  }, [selectedPompier, currentMonth, currentYear]);

  const loadListePompiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/planning/pompiers');
      const data = await response.json();
      if (response.ok) {
        setListePompiers(data.pompiers);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la liste des pompiers');
    }
  };

  const loadDisponibilites = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/planning/disponibilites');
      const data = await response.json();
      if (response.ok) {
        setDisponibilites(data.disponibilites);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des disponibilités');
    }
  };

  const loadDisponibilitesIndividuelles = async (pompier: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/planning/disponibilites?pompier=${pompier}&mois=${currentMonth}&annee=${currentYear}`
      );
      const data = await response.json();
      if (response.ok) {
        setDisponibilitesIndividuelles(data.disponibilites || {});
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des disponibilités individuelles');
    }
  };

  const loadCalendar = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/planning/calendar/${currentYear}/${currentMonth}`);
      const data = await response.json();
      if (response.ok) {
        setCalendarDates(data.dates);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement du calendrier');
    }
  };

  const loadPlanningOptimise = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/planning/optimise');
      const data = await response.json();
      if (response.ok) {
        setPlanningOptimise(data.calendar || {});
      } else {
        // Pas d'erreur si pas de planning généré
        setPlanningOptimise({});
      }
    } catch (err) {
      // Ignore l'erreur si pas de planning
      setPlanningOptimise({});
    }
  };

  const generatePlanningOptimise = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/planning/optimise', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setPlanningOptimise(data.calendar || {});
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors de la génération du planning optimisé');
    } finally {
      setLoading(false);
    }
  };

  const getDisponibiliteForDate = (pompierDispos: PompierDisponibilites, date: string, slot: number): boolean => {
    const dispo = pompierDispos.disponibilites.find(d => d.date === date && d.slot === slot);
    return dispo ? dispo.available : false;
  };

  const getPlanningForDate = (date: string, slot: number): CreneauPlanning | null => {
    const dayPlanning = planningOptimise[date];
    if (!dayPlanning) return null;
    
    const creneauKey = `creneau${slot}` as keyof typeof dayPlanning;
    return dayPlanning[creneauKey] || null;
  };

  // Calculer la couverture et la couleur pour un créneau donné
  const getCouvertureCreneau = (date: string, slot: number): { couverture: number, couleur: string, pompiers: PompierPlanifie[], manquants: string[] } => {
    const creneauData = getPlanningForDate(date, slot);
    
    if (!creneauData) {
      return { 
        couverture: 0, 
        couleur: 'rouge', 
        pompiers: [],
        manquants: ['Pas de données']
      };
    }

    // Utiliser les données calculées par le backend
    let couleur = 'rouge';
    if (creneauData.color === 'green') couleur = 'vert';
    else if (creneauData.color === 'orange') couleur = 'orange';
    
    // Construire la liste des éléments manquants
    const manquants: string[] = [];
    
    // Ajouter les shortages explicites
    Object.entries(creneauData.shortages).forEach(([role, count]) => {
      manquants.push(`Manque: ${count} ${role}`);
    });
    
    // Ajouter les rôles manquants pour le créneau 3
    if (slot === 3 && creneauData.missing_roles.length > 0) {
      creneauData.missing_roles.forEach(role => {
        manquants.push(`Rôle manquant: ${role}`);
      });
    }

    return { 
      couverture: creneauData.coverage_percent, 
      couleur, 
      pompiers: creneauData.pompiers,
      manquants
    };
  };

  const changeMonth = (increment: number) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setFilters({ currentMonth: newMonth, currentYear: newYear });
  };

  const renderDisponibiliteCell = (date: CalendarDate) => {
    const slots = selectedSlot === 0 ? [1, 2, 3, 4] : [selectedSlot];

    // Si un pompier spécifique est sélectionné, afficher ses disponibilités
    if (selectedPompier) {
      const dateDispos = disponibilitesIndividuelles[date.date];
      
      return (
        <div className="cell-content">
          {slots.map(slot => {
            const isAvailable = dateDispos ? dateDispos[`creneau${slot}`] || false : false;
            return (
              <div
                key={slot}
                className={`slot-indicator ${isAvailable ? 'available' : 'unavailable'}`}
                title={`${slotLabels[slot as keyof typeof slotLabels]}: ${isAvailable ? 'Disponible' : 'Indisponible'}`}
              >
                C{slot}
              </div>
            );
          })}
        </div>
      );
    }

    // Sinon, afficher un résumé des disponibilités de tous les pompiers
    return (
      <div className="cell-content">
        {slots.map(slot => {
          // Compter le nombre de pompiers disponibles pour cette date/créneaux
          let availableCount = 0;
          let totalCount = 0;
          
          disponibilites.forEach(pompierDispos => {
            totalCount++;
            if (getDisponibiliteForDate(pompierDispos, date.date, slot)) {
              availableCount++;
            }
          });

          const percentage = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;
          let className = 'slot-summary ';
          if (percentage >= 70) className += 'high-availability';
          else if (percentage >= 40) className += 'medium-availability';
          else className += 'low-availability';

          return (
            <div
              key={slot}
              className={className}
              title={`${slotLabels[slot as keyof typeof slotLabels]}: ${availableCount}/${totalCount} disponibles (${percentage}%)`}
            >
              C{slot}: {availableCount}/{totalCount}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlanningCell = (date: CalendarDate) => {
    const slots = selectedSlot === 0 ? [1, 2, 3, 4] : [selectedSlot];
    
    return (
      <div className="cell-content">
        {slots.map(slot => {
          const { couverture, couleur, pompiers, manquants } = getCouvertureCreneau(date.date, slot);
          
          const handleCreneauClick = () => {
            setSelectedCreneauDetail({date: date.date, slot});
          };
          
          return (
            <div 
              key={slot} 
              className={`slot-planning slot-${couleur}`}
              onClick={handleCreneauClick}
              style={{ cursor: 'pointer' }}
              title={`C${slot}: ${couverture.toFixed(0)}% de couverture - ${pompiers.length} pompier(s) - Cliquez pour voir les détails`}
            >
              <div className="slot-header">C{slot}</div>
              <div className="coverage-indicator">
                <div className="coverage-bar">
                  <div 
                    className={`coverage-fill coverage-${couleur}`}
                    style={{ width: `${couverture}%` }}
                  ></div>
                </div>
                <div className="coverage-text">
                  {pompiers.length} pompier{pompiers.length > 1 ? 's' : ''}
                </div>
              </div>
              {manquants.length > 0 && (
                <div className="shortage-indicator">
                  ⚠️
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="planning-calendrier">
      <div className="planning-header">
        <h1>📅 Calendrier de Planning - Pompiers Volontaires</h1>
        
        <div className="controls">
          <div className="month-navigation">
            <button onClick={() => changeMonth(-1)}>‹</button>
            <h2>{monthNames[currentMonth - 1]} {currentYear}</h2>
            <button onClick={() => changeMonth(1)}>›</button>
          </div>

          <div className="view-controls">
            <div className="view-mode">
              <label>
                <input
                  type="radio"
                  name="viewMode"
                  value="disponibilites"
                  checked={viewMode === 'disponibilites'}
                  onChange={(e) => setFilters({ viewMode: e.target.value as 'disponibilites' })}
                />
                Disponibilités
              </label>
              <label>
                <input
                  type="radio"
                  name="viewMode"
                  value="planning"
                  checked={viewMode === 'planning'}
                  onChange={(e) => setFilters({ viewMode: e.target.value as 'planning' })}
                />
                Planning optimisé
              </label>
            </div>

            {viewMode === 'disponibilites' && (
              <select
                value={selectedPompier}
                onChange={(e) => setFilters({ selectedPompier: e.target.value })}
                className="pompier-select"
              >
                <option value="">Tous les pompiers</option>
                {listePompiers.map(pompierId => (
                  <option key={pompierId} value={pompierId}>
                    {pompierId}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedSlot}
              onChange={(e) => setFilters({ selectedSlot: parseInt(e.target.value) })}
              className="slot-select"
            >
              <option value={0}>Tous les créneaux</option>
              {Object.entries(slotLabels).map(([slot, label]) => (
                <option key={slot} value={slot}>{label}</option>
              ))}
            </select>
          </div>

          {viewMode === 'planning' && (
            <button
              onClick={generatePlanningOptimise}
              disabled={loading}
              className="generate-button"
            >
              {loading ? 'Génération...' : '🔄 Générer planning optimisé'}
            </button>
          )}
          
          {(filters.selectedPompier !== '' || filters.selectedSlot !== 0) && (
            <button
              onClick={() => navigate('/gerer-pompiers')}
              className="manage-filtered-button"
              title="Gérer les pompiers avec les filtres actifs"
            >
              👥 Gérer pompiers filtrés
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="calendar">
        <div className="calendar-header">
          {weekDays.map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDates.map((date, index) => {
            // Ajout de cellules vides pour aligner le premier jour
            const firstDayOfMonth = calendarDates[0];
            const startOffset = (firstDayOfMonth.weekday + 6) % 7; // Convertir Lundi = 0
            
            const cells = [];
            
            // Ajouter les cellules vides au début
            if (index === 0) {
              for (let i = 0; i < startOffset; i++) {
                cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
              }
            }

            cells.push(
              <div key={date.date} className="calendar-cell">
                <div className="date-number">{date.day}</div>
                {viewMode === 'disponibilites' ? 
                  renderDisponibiliteCell(date) : 
                  renderPlanningCell(date)
                }
              </div>
            );

            return cells;
          })}
        </div>
      </div>

      {/* Modal détail créneau */}
      {selectedCreneauDetail && (
        <div className="modal-overlay" onClick={() => setSelectedCreneauDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détail du Créneau {selectedCreneauDetail.slot}</h3>
              <span className="date-detail">{new Date(selectedCreneauDetail.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <button className="close-button" onClick={() => setSelectedCreneauDetail(null)}>×</button>
            </div>
            
            {(() => {
              const { couverture, couleur, pompiers, manquants } = getCouvertureCreneau(selectedCreneauDetail.date, selectedCreneauDetail.slot);
              
              return (
                <div className="modal-body">
                  <div className={`coverage-status status-${couleur}`}>
                    <div className="coverage-percentage">{couverture.toFixed(0)}% de couverture</div>
                    <div className="coverage-info">
                      {selectedCreneauDetail.slot === 1 && `${pompiers.length}/3 pompiers requis`}
                      {(selectedCreneauDetail.slot === 2 || selectedCreneauDetail.slot === 4) && `${pompiers.length}/8 pompiers requis`}
                      {selectedCreneauDetail.slot === 3 && `${manquants.length === 0 ? 'Tous les rôles couverts' : `${manquants.length} rôle(s) manquant(s)`}`}
                    </div>
                  </div>
                  
                  {manquants.length > 0 && (
                    <div className="shortage-section">
                      <h4>⚠️ Manques identifiés :</h4>
                      <ul>
                        {manquants.map((manque, idx) => (
                          <li key={idx}>{manque}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="pompiers-section">
                    <h4>👨‍🚒 Pompiers assignés ({pompiers.length}) :</h4>
                    {pompiers.length > 0 ? (
                      <div className="pompiers-list">
                        {pompiers.map((pompier, idx) => (
                          <div key={idx} className="pompier-item">
                            <span className="pompier-name">{pompier.name}</span>
                            {pompier.role && pompier.role !== '-' && (
                              <span className="pompier-role">{pompier.role}</span>
                            )}
                            <span className="pompier-category">{pompier.category}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-pompiers">Aucun pompier assigné</div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="legend">
        {viewMode === 'disponibilites' ? (
          <div className="legend-section">
            <h3>Légende - Disponibilités</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="slot-indicator available"></div>
                <span>Disponible</span>
              </div>
              <div className="legend-item">
                <div className="slot-indicator unavailable"></div>
                <span>Indisponible</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="legend-section">
            <h3>Légende - Planning</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="assignment simple"></div>
                <span>Créneau Simple (C1, C2, C4)</span>
              </div>
              <div className="legend-item">
                <div className="assignment c3"></div>
                <span>Astreinte (C3)</span>
              </div>
              <div className="legend-item">
                <div className="assignment shortage"></div>
                <span>Manque de personnel</span>
              </div>
            </div>
          </div>
        )}

        <div className="legend-section">
          <h3>Créneaux</h3>
          <div className="legend-items">
            {Object.entries(slotLabels).map(([slot, label]) => (
              <div key={slot} className="legend-item">
                <strong>C{slot}:</strong> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningCalendrier;
