import React from 'react';
import '@fontsource/inter'; // Defaults to weight 400
import '@fontsource/inter/400.css'; // Normal weight
import '@fontsource/inter/500.css'; // Medium weight
import '@fontsource/inter/600.css'; // Semi-bold weight
import '@fontsource/inter/700.css'; // Bold weight
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Client1 from './pages/Client1';
import Client2 from './pages/Client2';
import Client3 from './pages/Client3';
import Client4 from './pages/Client4';
import Sidebar from './components/Sidebar';
import './index.css';

const App = () => {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/client1/connection" replace />} /> {/* Default route */}
            <Route path="/client1/*" element={<Client1 />} />
            <Route path="/client2/*" element={<Client2 />} />
            <Route path="/client3/*" element={<Client3 />} />
            <Route path="/client4/*" element={<Client4 />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
