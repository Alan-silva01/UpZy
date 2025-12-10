import React, { useState, useEffect } from 'react';

const PhoneMockup: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState(0);

  // Array com as 5 imagens do mockup
  const screens = [
    '/assets/mockup/IMG_3369.PNG',
    '/assets/mockup/IMG_3370.PNG',
    '/assets/mockup/IMG_3371.PNG',
    '/assets/mockup/IMG_3372.PNG',
    '/assets/mockup/IMG_3373.PNG'
  ];

  // Switch screens every 3 seconds (5 imagens)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen(prev => (prev + 1) % screens.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[500px] w-full max-w-[280px] sm:h-[600px] sm:max-w-[320px] shadow-2xl flex flex-col overflow-hidden animate-float">
      {/* Botões físicos do iPhone */}
      <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[11px] top-[72px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[11px] top-[124px] rounded-l-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[11px] top-[142px] rounded-r-lg"></div>

      {/* Screen Content - Carrossel de Imagens */}
      <div className="flex-1 rounded-[2rem] overflow-hidden bg-black relative">
        {screens.map((screen, index) => (
          <div
            key={index}
            className={`absolute top-0 left-0 w-full h-full transition-all duration-700 transform ${
              activeScreen === index
                ? 'opacity-100 translate-x-0'
                : index < activeScreen
                  ? 'opacity-0 -translate-x-full pointer-events-none'
                  : 'opacity-0 translate-x-full pointer-events-none'
            }`}
          >
            <img
              src={screen}
              alt={`App Screen ${index + 1}`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        ))}

        {/* Indicadores de paginação */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
          {screens.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveScreen(index)}
              className={`transition-all duration-300 rounded-full ${
                activeScreen === index
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir para tela ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;