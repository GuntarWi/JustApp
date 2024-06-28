// src/renderer/src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import App from './App';
import './assets/main.css';

const container = document.getElementById('root');
Modal.setAppElement(container); // Set the app element for react-modal

const root = createRoot(container); 
root.render(<App />);

