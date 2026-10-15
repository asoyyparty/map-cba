import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './context/ToastContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);

// Register Service Worker for PWA / Add to Home Screen support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] ServiceWorker registration:', err);
    });
  });
}
