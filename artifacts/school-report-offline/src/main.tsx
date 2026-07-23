import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// Register PWA Service Worker in production/supporting environments
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration skipped:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
