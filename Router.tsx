import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./pages/vendas/LandingPage'));
const ThankYouPage = lazy(() => import('./pages/vendas/ThankYouPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Landing Page - Sales Pages */}
          <Route path="/vendas" element={<LandingPage />} />
          <Route path="/pagina-vendas" element={<LandingPage />} />

          {/* Thank You Page - Redirects back to app after success */}
          <Route path="/obrigado" element={<ThankYouPage />} />

          {/* Reset Password Page - Auth */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Main App - Default Route */}
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
