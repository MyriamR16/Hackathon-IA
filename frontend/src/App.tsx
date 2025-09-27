import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Connexion from './components/Connexion';
import Dashboard from './components/Dashboard';
import AjouterPompier from './components/AjouterPompier';
import GererPompiers from './components/GererPompiers';
import PlanningCalendrier from './components/PlanningCalendrier';
import ImportPompiers from './components/ImportPompiers';
import SuiviHeures from './components/SuiviHeures';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import { PlanningProvider } from './context/PlanningContext';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/connexion';

  return (
    <div className="App">
      {/* Afficher la NavBar sur toutes les pages sauf la connexion */}
      {!isLoginPage && <NavBar />}
      
      <Routes>
        {/* Route par défaut redirection vers connexion */}
        <Route path="/" element={<Navigate to="/connexion" replace />} />
        
        {/* Route de connexion */}
        <Route path="/connexion" element={<Connexion />} />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/ajouter-pompier" element={
          <ProtectedRoute>
            <AjouterPompier />
          </ProtectedRoute>
        } />
        
        <Route path="/gerer-pompiers" element={
          <ProtectedRoute>
            <GererPompiers />
          </ProtectedRoute>
        } />
        
        <Route path="/planning" element={
          <ProtectedRoute>
            <PlanningCalendrier />
          </ProtectedRoute>
        } />
        
        <Route path="/suivi-heures" element={
          <ProtectedRoute>
            <SuiviHeures />
          </ProtectedRoute>
        } />
        
        <Route path="/import-pompiers" element={
          <ProtectedRoute>
            <ImportPompiers />
          </ProtectedRoute>
        } />
        
        {/* Route catch-all pour les pages non trouvées */}
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <PlanningProvider>
        <AppContent />
      </PlanningProvider>
    </Router>
  );
}

export default App;
