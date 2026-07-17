import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Register the PWA Service Worker (VitePWA automatic registration)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
