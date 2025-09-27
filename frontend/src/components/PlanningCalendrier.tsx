import React, { useState, useEffect } from 'react';
import './PlanningCalendrier.css';

interface Pompier {
  id: string;
  nom: string;
  grade: string;
  habilitations: string[];
}

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

interface PlanningAssignment {
  day: string;
  slot: number;
  category: string;
  role: string;
  person_id: string;
  person_name: string;
  shortage_count: string;
}

interface CalendarDate {
  date: string;
  day: number;
  weekday: number;
}

const PlanningCalendrier: React.FC = () => {
  const [listePompiers, setListePompiers] = useState<string[]>([]);
  const [pompiers, setPompiers] = useState<Pompier[]>([]);
  const [disponibilites, setDisponibilites] = useState<PompierDisponibilites[]>([]);
  const [disponibilitesIndividuelles, setDisponibilitesIndividuelles] = useState<DisponibilitesIndividuelles>({});
  const [planningOptimise, setPlanningOptimise] = useState<PlanningAssignment[]>([]);
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedPompier, setSelectedPompier] = useState<string>('');
  const [viewMode, setViewMode] = useState<'disponibilites' | 'planning'>('disponibilites');
  const [selectedSlot, setSelectedSlot] = useState<number>(0); // 0 = tous les créneaux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
    loadPompiers();
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

  const loadPompiers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pompiers');
      const data = await response.json();
      if (response.ok) {
        setPompiers(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des pompiers');
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
        setPlanningOptimise(data.planning);
      } else {
        // Pas d'erreur si pas de planning généré
        setPlanningOptimise([]);
      }
    } catch (err) {
      // Ignore l'erreur si pas de planning
      setPlanningOptimise([]);
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
        setPlanningOptimise(data.planning);
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

  const getPlanningForDate = (date: string, slot?: number): PlanningAssignment[] => {
    return planningOptimise.filter(p => {
      return p.day === date && (slot === undefined || p.slot === slot);
    });
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

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
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
          const assignments = getPlanningForDate(date.date, slot);
          return (
            <div key={slot} className="slot-planning">
              <div className="slot-header">C{slot}</div>
              {assignments.length > 0 ? (
                <div className="assignments">
                  {assignments.map((assignment, idx) => (
                    <div
                      key={idx}
                      className={`assignment ${assignment.category.toLowerCase()}`}
                      title={`${assignment.person_name} - ${assignment.role}`}
                    >
                      {assignment.person_name || `Manque ${assignment.shortage_count}`}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-assignment">-</div>
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
                  onChange={(e) => setViewMode(e.target.value as 'disponibilites')}
                />
                Disponibilités
              </label>
              <label>
                <input
                  type="radio"
                  name="viewMode"
                  value="planning"
                  checked={viewMode === 'planning'}
                  onChange={(e) => setViewMode(e.target.value as 'planning')}
                />
                Planning optimisé
              </label>
            </div>

            {viewMode === 'disponibilites' && (
              <select
                value={selectedPompier}
                onChange={(e) => setSelectedPompier(e.target.value)}
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
              onChange={(e) => setSelectedSlot(parseInt(e.target.value))}
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
