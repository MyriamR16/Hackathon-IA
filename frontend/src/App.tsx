import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Connexion from './components/Connexion';
import Dashboard from './components/Dashboard';
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
          
          {/* Route catch-all pour les pages non trouvées */}
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
