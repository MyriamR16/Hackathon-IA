import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Connexion from './components/Connexion';
import Dashboard from './components/Dashboard';
import AjouterPompier from './components/AjouterPompier';
import GererPompiers from './components/GererPompiers';
import PlanningCalendrier from './components/PlanningCalendrier';
import ImportPompiers from './components/ImportPompiers';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Route par défaut redirection vers connexion */}
          <Route path="/" element={<Navigate to="/connexion" replace />} />
          
          {/* Route de connexion */}
          <Route path="/connexion" element={<Connexion />} />
          
          {/* Route du dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Route pour ajouter un pompier */}
          <Route path="/ajouter-pompier" element={<AjouterPompier />} />
          
          {/* Route pour gérer les pompiers */}
          <Route path="/gerer-pompiers" element={<GererPompiers />} />
          
          {/* Route pour le planning calendrier */}
          <Route path="/planning" element={<PlanningCalendrier />} />
          
          {/* Route pour l'import des pompiers (admin seulement) */}
          <Route path="/import-pompiers" element={<ImportPompiers />} />
          
          {/* Route catch-all pour les pages non trouvées */}
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
