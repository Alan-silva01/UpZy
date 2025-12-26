import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Menu,
  X,
  ChevronRight,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  ShieldCheck,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';
import CountdownTimer from '../../components/vendas/CountdownTimer';
import PhoneMockup from '../../components/vendas/PhoneMockup';
import Checkout from './Checkout';
import { PAIN_POINTS, FEATURES, TESTIMONIALS, PLANS, FAQS } from './constants';
import { PricingPlan } from './types';

// Official UPZY Logo
export const UpzyLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <img
    src="/assets/Imagem upzy svg.svg"
    alt="UPZY Logo"
    className={className}
    style={{ mixBlendMode: 'screen' }}
  />
);

const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userEmail = searchParams.get('email') || ''; // Get email from URL

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [viewers, setViewers] = useState(124);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Estado para controlar animação fade-in quando vem do app
  const [fadeIn, setFadeIn] = useState(false);
  const comingFromApp = window.location.hash === '#precos';

  // Scroll instantâneo e fade-in quando vem do app
  useEffect(() => {
    if (comingFromApp) {
      // Scroll instantâneo para preços ANTES de mostrar
      const element = document.getElementById('precos');
      if (element) {
        window.scrollTo(0, element.offsetTop - 50);
      }
      // Ativar fade-in
      requestAnimationFrame(() => {
        setFadeIn(true);
      });
    } else {
      setFadeIn(true);
    }
  }, []);

  // Scroll to section on page load (from hash) - para outros hashes
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash !== '#precos') {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  }, []);

  // Real-time viewers simulation & Scroll listener
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero (approx 600px)
      setShowStickyCTA(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'instant' });
      setIsMenuOpen(false);
    }
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleBackToLanding = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  // Show checkout page if a plan is selected
  if (showCheckout && selectedPlan) {
    return <Checkout selectedPlan={selectedPlan} onBack={handleBackToLanding} userEmail={userEmail} />;
  }

  return (
    <div className={`min-h-screen bg-brand-darker text-slate-100 font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>

      {/* 1. Urgency Bar */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs sm:text-sm py-2 px-4 text-center font-medium sticky top-0 z-50 shadow-lg shadow-purple-900/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2">
          <span className="flex items-center gap-2">
            <span className="bg-purple-600 text-white px-2 py-1 rounded font-bold uppercase text-xs">Oferta</span>
            Preço promocional encerra em:
          </span>
          <CountdownTimer />
        </div>
      </div>

      {/* 2. Navigation */}
      <nav className="border-b border-white/5 bg-brand-darker/80 backdrop-blur-md sticky top-[36px] sm:top-[36px] z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <UpzyLogo className="w-10 h-10 text-white" />
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">UpZy</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('beneficios')} className="text-white hover:text-emerald-400 transition-colors text-sm font-medium">Benefícios</button>
              <button onClick={() => scrollToSection('como-funciona')} className="text-white hover:text-emerald-400 transition-colors text-sm font-medium">Como Funciona</button>
              <button onClick={() => scrollToSection('depoimentos')} className="text-white hover:text-emerald-400 transition-colors text-sm font-medium">Depoimentos</button>
              <button onClick={() => scrollToSection('precos')} className="text-white hover:text-emerald-400 transition-colors text-sm font-medium">Planos</button>
              <a
                href="/"
                className="bg-white text-black hover:bg-gray-100 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
              >
                Entrar
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-brand-surface border-b border-white/5 absolute w-full left-0 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-5 fade-in duration-200">
            <div className="px-4 pt-2 pb-6 space-y-2 shadow-2xl">
              <button onClick={() => scrollToSection('beneficios')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Benefícios</button>
              <button onClick={() => scrollToSection('como-funciona')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Como Funciona</button>
              <button onClick={() => scrollToSection('precos')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5">Planos</button>
              <button onClick={() => scrollToSection('precos')} className="w-full mt-4 bg-brand-primary text-white px-5 py-3 rounded-lg font-bold text-center">Começar Agora</button>
            </div>
          </div>
        )}
      </nav>

      {/* 3. Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-secondary/10 blur-[100px] rounded-full pointer-events-none opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-6 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                <span className="text-xs font-medium text-gray-300">{viewers} pessoas vendo agora</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Sua loja <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500">batendo meta todo mês</span> direto do celular.
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Chega de planilha que ninguém atualiza. Dê adeus à cegueira operacional e tenha controle total das suas vendas na palma da mão.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => scrollToSection('precos')}
                  className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  Ver Planos
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="/"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight size={18} />
                  Ir para o App
                </a>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  <img src="https://picsum.photos/30/30?random=1" alt="User" className="w-8 h-8 rounded-full border-2 border-brand-darker" />
                  <img src="https://picsum.photos/30/30?random=2" alt="User" className="w-8 h-8 rounded-full border-2 border-brand-darker" />
                  <img src="https://picsum.photos/30/30?random=3" alt="User" className="w-8 h-8 rounded-full border-2 border-brand-darker" />
                  <div className="w-8 h-8 rounded-full border-2 border-brand-darker bg-gray-700 flex items-center justify-center text-[10px] text-white">+800</div>
                </div>
                <p>Junte-se a <span className="text-white font-bold">847 lojistas</span> que usam UPZY</p>
              </div>
            </div>

            {/* Image/Mockup */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-full mx-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-brand-primary/20 to-transparent blur-3xl -z-10"></div>
              <PhoneMockup />

              {/* Floating elements */}
              <div className="absolute top-10 -right-4 sm:right-0 bg-gray-800/80 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Check size={20} className="text-brand-success" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Meta Batida!</p>
                    <p className="text-sm font-bold text-white">Loja Centro</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 -left-4 sm:left-0 bg-gray-800/80 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl animate-float" style={{ animationDelay: '2.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Star size={20} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Novo Recorde</p>
                    <p className="text-sm font-bold text-white">Maria Lucia</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NEW: Trusted By Logos */}
      <section className="py-8 border-y border-white/5 bg-brand-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Usado por lojas que crescem</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple SVG Placeholders for Logos */}
            <div className="h-8 flex items-center font-bold text-xl text-white">SHOP<span className="font-light">MALL</span></div>
            <div className="h-8 flex items-center font-bold text-xl text-white">URBAN<span className="text-brand-primary">WEAR</span></div>
            <div className="h-8 flex items-center font-bold text-xl text-white">NOVA<span className="italic">STORE</span></div>
            <div className="h-8 flex items-center font-bold text-xl text-white">TECH<span className="text-brand-secondary">POINT</span></div>
            <div className="h-8 flex items-center font-bold text-xl text-white">BELLA<span className="font-light">CASA</span></div>
          </div>
        </div>
      </section>

      {/* 4. Stats Section */}
      <section className="py-10 border-b border-white/5 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Vendas Rastreadas", value: "R$ 18M+" },
              { label: "Lojistas Ativos", value: "847" },
              { label: "Vendedores", value: "4.2k+" },
              { label: "Aumento Médio", value: "37%" },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400 uppercase tracking-wide font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pain Points */}
      <section className="py-20 bg-brand-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Gerenciar equipe de vendas não deveria ser um pesadelo</h2>
            <p className="text-gray-400 text-lg">Você se identifica com algum desses problemas na sua rotina?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((pain, idx) => (
              <div key={idx} className="bg-brand-surface/50 border border-white/5 p-8 rounded-3xl hover:border-red-500/30 transition-colors group">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                  <pain.icon size={28} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{pain.problem}</h3>
                <p className="text-gray-400 leading-relaxed">{pain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Features / Benefits */}
      <section id="beneficios" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[500px] bg-brand-primary/5 -skew-y-6 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-secondary font-bold tracking-wider text-sm uppercase">Solução Completa</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">Controle total no seu bolso</h2>
            <p className="text-gray-400 text-lg">O UPZY transforma dados complexos em telas simples para você tomar decisões rápidas.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="bg-gray-900/50 backdrop-blur border border-white/10 p-6 rounded-2xl hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How it works */}
      <section id="como-funciona" className="py-20 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comece em menos de 5 minutos</h2>
            <p className="text-gray-400">Sem burocracia, sem treinamento complexo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-primary/0 via-brand-primary/50 to-brand-primary/0 border-t border-dashed border-gray-600 z-0"></div>

            {[
              { step: "01", title: "Crie sua Loja", desc: "Baixe o app e cadastre sua loja em 2 minutos." },
              { step: "02", title: "Convide a Equipe", desc: "Envie o link para seus vendedores entrarem." },
              { step: "03", title: "Acompanhe", desc: "Defina a meta e veja as vendas entrarem em tempo real." }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 text-center group">
                <div className="w-24 h-24 mx-auto bg-brand-darker border-4 border-brand-primary/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-purple-900/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-black text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section id="depoimentos" className="py-24 bg-brand-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Quem usa, bate meta 🚀</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-brand-surface/20 border border-white/5 p-6 rounded-3xl flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-brand-warning fill-brand-warning" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 flex-1 italic">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto border-t border-white/5 pt-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      {t.verified && <Check size={12} className="text-blue-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{t.role} • {t.store}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Pricing */}
      <section id="precos" className="py-24 relative bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Escolha seu Plano</h2>
            <p className="text-gray-400 text-lg">Descubra o plano perfeito para você e sua equipe.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
            {PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`
                  relative rounded-3xl p-8 border backdrop-blur-sm transition-all duration-300
                  ${plan.recommended
                    ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-400/50 shadow-2xl shadow-teal-500/30 md:scale-105 lg:scale-110 z-10'
                    : 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600 hover:shadow-xl'
                  }
                `}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 right-6 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Mais Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.billingInfo}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-lg">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 line-through text-sm">{plan.originalPrice}</span>
                      {plan.savings && (
                        <span className="text-teal-400 text-xs font-semibold">{plan.savings}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.planType === 'monthly' ? 'Ideal para usuários individuais.' :
                      plan.planType === 'semester' ? 'Ideal para pequenas equipes.' :
                        'Melhor escolha para empresas, agências e estúdios.'}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3.5 rounded-xl font-bold mb-8 transition-all duration-300 ${plan.recommended
                    ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/40 hover:shadow-teal-500/60 hover:scale-105'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                >
                  {plan.ctaText}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <div className={`mt-0.5 ${plan.recommended ? 'text-teal-400' : 'text-gray-400'}`}>
                        <Check size={18} className="stroke-current" strokeWidth={2.5} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-full px-6 py-3">
              <ShieldCheck size={20} className="text-teal-400" />
              <span className="text-gray-300 text-sm">Garantia incondicional de 30 dias. Não gostou? Devolvemos seu dinheiro.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-20 bg-brand-darker">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Dúvidas Frequentes</h2>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-brand-surface border border-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-white">{faq.question}</span>
                  {activeFaq === idx ? <ChevronUp className="text-brand-primary" /> : <ChevronDown className="text-gray-500" />}
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-gray-400 animate-in slide-in-from-top-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Final CTA Footer */}
      <footer className="bg-brand-darker border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <UpzyLogo className="w-12 h-12 text-white" />
              <span className="font-bold text-2xl tracking-tight text-white">UPZY</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={24} /></a>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-b border-white/5 pb-12 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-primary">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-brand-primary">Planos</a></li>
                <li><a href="#" className="hover:text-brand-primary">Para Lojistas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-primary">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-brand-primary">Carreiras</a></li>
                <li><a href="#" className="hover:text-brand-primary">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-primary">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-brand-primary">Fale Conosco</a></li>
                <li><a href="#" className="hover:text-brand-primary">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-primary">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-brand-primary">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} UPZY Tecnologia Ltda. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* --- MODALS & OVERLAYS --- */}

      {/* Video Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[95vw] sm:max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              {/* Simulated Video Embed */}
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&controls=1"
                title="Video Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile CTA */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-brand-darker/95 backdrop-blur border-t border-white/10 p-4 z-50 md:hidden transition-transform duration-300 ${showStickyCTA ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => scrollToSection('precos')}
          className="w-full bg-brand-success hover:bg-brand-success/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Ver Planos e Assinar
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
};

export default LandingPage;