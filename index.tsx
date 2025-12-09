import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './Router';
import { CacheProvider } from './contexts/CacheContext';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Deseja atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ App pronto para uso offline!');
  },
  onRegistered(registration) {
    console.log('✅ Service Worker registrado!', registration);
  },
  onRegisterError(error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CacheProvider>
      <AppRouter />
    </CacheProvider>
  </React.StrictMode>
);