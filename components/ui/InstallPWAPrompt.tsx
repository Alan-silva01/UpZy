import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface InstallPWAPromptProps {
  onClose?: () => void;
}

export const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Check if app is already installed (running as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');

    // Check if user has dismissed the prompt before
    const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');

    // Only show if not installed and not dismissed
    if (!isStandalone && !hasDismissed) {
      setIsVisible(true);
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    onClose?.();
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Edge - use native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        handleClose();
      }

      setDeferredPrompt(null);
    } else {
      // Safari/iOS - show manual instructions
      setStep(1);
    }
  };

  if (!isVisible) return null;

  // Detect if iOS/Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // If Android Chrome/Edge with native install prompt
  if (deferredPrompt && !isIOS) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Download size={40} className="text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Instale o App UpZy</h3>
              <p className="text-sm text-zinc-400">
                Instale nosso app para ter acesso rápido e uma melhor experiência!
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Baixar App
            </button>

            <button
              onClick={handleClose}
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS/Safari - Manual instructions with animation
  if (isIOS || isSafari) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Download size={40} className="text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Instale o App UpZy</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Siga os passos abaixo para instalar:
              </p>
            </div>

            {/* Step 1 - Share button */}
            <div className={`w-full bg-zinc-800/50 rounded-2xl p-4 border-2 transition-all duration-300 ${
              step === 1 ? 'border-emerald-500 scale-105' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-blue-400 animate-bounce"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v12m0-12l-3 3m3-3l3 3"
                      />
                      <rect
                        x="3"
                        y="15"
                        width="18"
                        height="7"
                        rx="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-sm">Passo 1</p>
                  <p className="text-zinc-400 text-xs">Toque no botão de compartilhar</p>
                </div>
                <div className="text-emerald-400 font-bold">1</div>
              </div>
            </div>

            {/* Step 2 - Add to Home Screen */}
            <div className={`w-full bg-zinc-800/50 rounded-2xl p-4 border-2 transition-all duration-300 ${
              step === 2 ? 'border-emerald-500 scale-105' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-400 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-sm">Passo 2</p>
                  <p className="text-zinc-400 text-xs">Toque em "Adicionar à Tela de Início"</p>
                </div>
                <div className="text-emerald-400 font-bold">2</div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep(1)}
                disabled={step === 1}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  step === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Passo 1
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={step === 2}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  step === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Passo 2
              </button>
            </div>

            <button
              onClick={handleClose}
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Entendi, fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
