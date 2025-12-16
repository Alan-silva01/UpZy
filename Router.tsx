import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Import supabase para garantir que está inicializado
import './lib/supabase';

// Lazy load pages
const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./pages/vendas/LandingPage'));
const ThankYouPage = lazy(() => import('./pages/vendas/ThankYouPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ConfirmEmailPage = lazy(() => import('./pages/auth/ConfirmEmailPage'));

// Fallback simples (tela preta) para não duplicar animação com App.tsx
const SimpleFallback = () => <div className="min-h-screen bg-black" />;

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<SimpleFallback />}>
        <Routes>
          {/* Landing Page - Sales Pages */}
          <Route path="/vendas" element={<LandingPage />} />
          <Route path="/pagina-vendas" element={<LandingPage />} />

          {/* Thank You Page - Redirects back to app after success */}
          <Route path="/obrigado" element={<ThankYouPage />} />

          {/* Auth Pages */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />

          {/* Main App - Default Route */}
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
