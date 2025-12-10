import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Tab, User } from './types';
import { verificarSessao, fazerLogout, buscarLojaIdUsuario, buscarNomeLoja } from './services/auth';
import { useStoreStatus } from './hooks/useStoreStatus';
import { startCacheCleanup } from './hooks/useOptimizedQuery';
import { Loader2 } from 'lucide-react';

// Lazy loading de componentes com preloading
const DashboardView = lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const TeamRanking = lazy(() => import('./components/views/TeamRanking').then(m => ({ default: m.TeamRanking })));
const SalesFeed = lazy(() => import('./components/views/SalesFeed').then(m => ({ default: m.SalesFeed })));
const CustomerRanking = lazy(() => import('./components/views/CustomerRanking').then(m => ({ default: m.CustomerRanking })));
const AdminSellersView = lazy(() => import('./components/views/AdminSellersView').then(m => ({ default: m.AdminSellersView })));
const SellerDashboardView = lazy(() => import('./components/views/SellerDashboardView').then(m => ({ default: m.SellerDashboardView })));
const SellerSalesHistoryView = lazy(() => import('./components/views/SellerSalesHistoryView').then(m => ({ default: m.SellerSalesHistoryView })));
const LoginView = lazy(() => import('./components/views/LoginView').then(m => ({ default: m.LoginView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const GoalsManagementView = lazy(() => import('./components/views/GoalsManagementView').then(m => ({ default: m.GoalsManagementView })));
const NewSaleModal = lazy(() => import('./components/modals/NewSaleModal').then(m => ({ default: m.NewSaleModal })));
const SaleSuccessModal = lazy(() => import('./components/modals/SaleSuccessModal').then(m => ({ default: m.SaleSuccessModal })));
const SellerSettingsModal = lazy(() => import('./components/modals/SellerSettingsModal').then(m => ({ default: m.SellerSettingsModal })));
const InactiveAccountToast = lazy(() => import('./components/ui/InactiveAccountToast').then(m => ({ default: m.InactiveAccountToast })));
const InactiveAccountModal = lazy(() => import('./components/modals/InactiveAccountModal').then(m => ({ default: m.InactiveAccountModal })));
const InstallPWAPrompt = lazy(() => import('./components/ui/InstallPWAPrompt').then(m => ({ default: m.InstallPWAPrompt })));

// Funções de preload para carregar componentes antecipadamente
const preloadDashboard = () => import('./components/views/DashboardView');
const preloadTeamRanking = () => import('./components/views/TeamRanking');
const preloadSalesFeed = () => import('./components/views/SalesFeed');
const preloadCustomerRanking = () => import('./components/views/CustomerRanking');
const preloadAdminSellers = () => import('./components/views/AdminSellersView');
const preloadSellerDashboard = () => import('./components/views/SellerDashboardView');
const preloadSellerHistory = () => import('./components/views/SellerSalesHistoryView');
const preloadSettings = () => import('./components/views/SettingsView');
const preloadGoals = () => import('./components/views/GoalsManagementView');
const preloadNewSaleModal = () => import('./components/modals/NewSaleModal');

// Loading fallback invisível para transição instantânea - NUNCA mostra loader
const LoadingFallback = () => <div className="min-h-screen" />;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [nomeLoja, setNomeLoja] = useState<string | null>(null);
  const [avatarLoja, setAvatarLoja] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isSaleSuccessModalOpen, setIsSaleSuccessModalOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [loadingSessao, setLoadingSessao] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<string | undefined>(undefined);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [blockedAction, setBlockedAction] = useState('');
  const [showInactiveToast, setShowInactiveToast] = useState(false);

  // Hook para verificar status da loja
  const { isBlocked } = useStoreStatus(lojaId);

  // Mostrar toast quando detectar conta inativa
  useEffect(() => {
    if (isBlocked && user) {
      setShowInactiveToast(true);
    }
  }, [isBlocked, user]);

  // Verificar sessão ao carregar
  useEffect(() => {
    verificarSessaoAtual();

    // Timeout de segurança: se após 3 segundos ainda estiver carregando, força o fim do loading
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout de segurança atingido');
      setLoadingSessao(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // Iniciar limpeza automática de cache (executa a cada 60 segundos)
  useEffect(() => {
    console.log('🗑️ Iniciando limpeza automática de cache');
    startCacheCleanup(60000); // Limpa cache expirado a cada 60 segundos
  }, []);

  // PREFETCH AGRESSIVO: Carregar TODOS os componentes assim que o app inicializar
  useEffect(() => {
    if (user && lojaId) {
      // Aguardar 100ms após login para começar prefetch (garante UI responsiva)
      const timer = setTimeout(() => {
        console.log('🚀 Iniciando prefetch agressivo de todos os componentes e dados...');

        if (user.role === 'ADMIN') {
          // Preload todos os componentes do admin
          Promise.all([
            preloadDashboard(),
            preloadTeamRanking(),
            preloadSalesFeed(),
            preloadCustomerRanking(),
            preloadAdminSellers(),
            preloadSettings(),
            preloadGoals(),
            preloadNewSaleModal()
          ]).then(() => console.log('✅ Componentes do Admin pré-carregados'));
        } else {
          // Preload todos os componentes do vendedor
          Promise.all([
            preloadSellerDashboard(),
            preloadSellerHistory(),
            preloadSalesFeed(),
            preloadNewSaleModal()
          ]).then(() => console.log('✅ Componentes do Vendedor pré-carregados'));
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, lojaId]);

  const verificarSessaoAtual = async () => {
    console.log('🔍 Verificando sessão...');
    try {
      const usuarioSessao = await verificarSessao();
      console.log('👤 Usuário da sessão:', usuarioSessao);

      if (usuarioSessao) {
        setUser(usuarioSessao);
        const loja = await buscarLojaIdUsuario(usuarioSessao.id);
        console.log('🏪 Loja ID:', loja);
        setLojaId(loja);

        // Buscar nome e avatar da loja
        if (loja) {
          const nome = await buscarNomeLoja(loja);
          console.log('🏪 Nome da Loja:', nome);
          setNomeLoja(nome);

          // Buscar avatar da loja
          const { supabase } = await import('./lib/supabase');
          const { data: lojaData } = await supabase
            .from('lojas')
            .select('avatar_url')
            .eq('id', loja)
            .single();

          if (lojaData?.avatar_url) {
            console.log('🖼️ Avatar da Loja:', lojaData.avatar_url);
            setAvatarLoja(lojaData.avatar_url);
          }
        }

        if (usuarioSessao.role === 'ADMIN') {
          setActiveTab(Tab.DASHBOARD);
          // Preload componentes do admin em background
          setTimeout(() => {
            preloadTeamRanking();
            preloadSalesFeed();
            preloadCustomerRanking();
            preloadAdminSellers();
            preloadSettings();
            preloadGoals();
            preloadNewSaleModal();
          }, 100);
        } else {
          setActiveTab(Tab.SELLER_HOME);
          // Preload componentes do vendedor em background
          setTimeout(() => {
            preloadSellerHistory();
            preloadSalesFeed();
            preloadNewSaleModal();
          }, 100);
        }
      } else {
        console.log('⚠️ Nenhuma sessão ativa');
        // Garantir que user é null se não houver sessão
        setUser(null);
        setLojaId(null);
        setNomeLoja(null);
        setAvatarLoja(null);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      setUser(null);
      setLojaId(null);
      setNomeLoja(null);
      setAvatarLoja(null);
    } finally {
      console.log('✅ Verificação de sessão concluída');
      setLoadingSessao(false);
    }
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    const loja = await buscarLojaIdUsuario(loggedInUser.id);
    setLojaId(loja);

    // Buscar nome e avatar da loja
    if (loja) {
      const nome = await buscarNomeLoja(loja);
      setNomeLoja(nome);

      // Buscar avatar da loja
      const { supabase } = await import('./lib/supabase');
      const { data: lojaData } = await supabase
        .from('lojas')
        .select('avatar_url')
        .eq('id', loja)
        .single();

      if (lojaData?.avatar_url) {
        setAvatarLoja(lojaData.avatar_url);
      }
    }

    // Set default tab based on role
    if (loggedInUser.role === 'ADMIN') {
      setActiveTab(Tab.DASHBOARD);
      // Preload componentes do admin
      preloadTeamRanking();
      preloadSalesFeed();
      preloadCustomerRanking();
      preloadAdminSellers();
      preloadSettings();
      preloadGoals();
      preloadNewSaleModal();
    } else {
      setActiveTab(Tab.SELLER_HOME);
      // Preload componentes do vendedor
      preloadSellerHistory();
      preloadSalesFeed();
      preloadNewSaleModal();
    }
  };

  const handleLogout = async () => {
    await fazerLogout();
    setUser(null);
    setLojaId(null);
    setNomeLoja(null);
    setAvatarLoja(null);
    setActiveTab(Tab.DASHBOARD);
  };

  // Função para verificar se a ação está bloqueada
  const checkBlocked = (action: string): boolean => {
    if (isBlocked) {
      setBlockedAction(action);
      setInactiveModalOpen(true);
      return true;
    }
    return false;
  };

  const handleNewSale = async (data: any) => {
    if (!lojaId || !user) return;

    // Verificar se a conta está bloqueada
    if (checkBlocked('registrar uma venda')) {
      return;
    }

    console.log('💳 Registrando venda - User:', user);
    console.log('💳 User.sellerId:', user.sellerId);
    console.log('💳 User.role:', user.role);

    const { criarVenda } = await import('./services/api');

    // Para admin, precisamos de um sellerId válido
    // Por enquanto, vamos usar o primeiro vendedor da loja se for admin
    let vendedorId = user.sellerId;

    if (!vendedorId && user.role === 'ADMIN') {
      // Se admin não tem sellerId, buscar primeiro vendedor
      const { buscarVendedores } = await import('./services/api');
      const vendedores = await buscarVendedores(lojaId);
      console.log('💳 Admin - Vendedores encontrados:', vendedores);
      if (vendedores.length > 0) {
        vendedorId = vendedores[0].id;
        console.log('💳 Admin - Usando vendedor:', vendedorId);
      } else {
        alert('Cadastre um vendedor antes de registrar vendas.');
        return;
      }
    }

    if (!vendedorId) {
      console.error('❌ VendedorId não encontrado!');
      alert('Vendedor não identificado.');
      return;
    }

    console.log('💳 VendedorId final:', vendedorId);

    // Mapear método de pagamento para valores aceitos pelo banco
    const metodoPagamentoMap: Record<string, string> = {
      'money': 'dinheiro',
      'pix': 'pix',
      'card_debit': 'cartao_debito',
      'card_credit': 'cartao_credito',
      'boleto': 'boleto',
      'promissory': 'promissoria'
    };

    // Converter data/hora local para UTC corretamente
    // O input de data/hora é considerado como horário local
    const dataHoraLocal = new Date(`${data.saleDate}T${data.saleTime}:00`);
    const dataVendaFormatada = dataHoraLocal.toISOString();

    const sucesso = await criarVenda({
      lojaId,
      vendedorId,
      numeroPedido: data.orderId,
      valor: parseFloat(data.amount),
      nomeCliente: data.customerName,
      metodoPagamento: metodoPagamentoMap[data.paymentMethod] || data.paymentMethod,
      tipoPagamento: data.paymentType === 'spot' ? 'avista' : 'parcelado',
      parcelas: data.installments,
      dataVenda: dataVendaFormatada
    });

    if (sucesso) {
      // Fechar modal de nova venda
      setIsSaleModalOpen(false);

      // Salvar dados da venda para exibir no modal de sucesso
      setLastSaleData({
        valor: parseFloat(data.amount),
        cliente: data.customerName,
        numeroPedido: data.orderId
      });

      // Abrir modal de sucesso
      setIsSaleSuccessModalOpen(true);

      // Disparar evento customizado para forçar atualização
      window.dispatchEvent(new CustomEvent('forceRefreshDashboard'));
    } else {
      alert('Erro ao registrar venda. Tente novamente.');
    }
  };

  const handleContinuarVendendo = () => {
    // Disparar evento customizado para forçar atualização ao clicar em continuar
    window.dispatchEvent(new CustomEvent('forceRefreshDashboard'));
  };

  const renderContent = () => {
    if (!user || !lojaId) return null;

    if (user.role === 'ADMIN') {
      switch (activeTab) {
        case Tab.DASHBOARD: return <DashboardView lojaId={lojaId} userId={user.id} onNavigateToGoals={() => setActiveTab(Tab.GOALS)} />;
        case Tab.TEAM: return <TeamRanking />;
        case Tab.SALES: return <SalesFeed />;
        case Tab.CUSTOMERS: return <CustomerRanking />;
        case Tab.ADMIN_SELLERS: return <AdminSellersView
          lojaId={lojaId}
          onBlockedAction={isBlocked ? () => checkBlocked('gerenciar vendedores (adicionar, editar ou excluir)') : undefined}
        />;
        case Tab.SETTINGS: return <SettingsView
          onLogout={handleLogout}
          onStoreNameUpdate={(newName: string) => setNomeLoja(newName)}
          onStoreAvatarUpdate={(newAvatar: string) => setAvatarLoja(newAvatar)}
        />;
        case Tab.GOALS: return <GoalsManagementView
          lojaId={lojaId}
          userId={user.id}
          onBack={() => setActiveTab(Tab.DASHBOARD)}
          onBlockedAction={isBlocked ? () => checkBlocked('criar ou editar metas') : undefined}
        />;
        default: return <DashboardView lojaId={lojaId} userId={user.id} />;
      }
    } else {
      // Seller Views
      switch (activeTab) {
        case Tab.SELLER_HOME:
          return <SellerDashboardView
            user={user}
            onLogout={handleLogout}
            onViewAllSales={(saleId?: string) => {
              setSelectedSaleId(saleId);
              setActiveTab(Tab.SELLER_SALES_HISTORY);
            }}
          />;
        case Tab.SELLER_SALES_HISTORY:
          return <SellerSalesHistoryView
            user={user}
            onBack={() => {
              setSelectedSaleId(undefined);
              setActiveTab(Tab.SELLER_HOME);
            }}
            initialEditSaleId={selectedSaleId}
            onBlockedAction={isBlocked ? () => checkBlocked('editar ou excluir vendas') : undefined}
          />;
        case Tab.SALES: return <SalesFeed />; // Seller sees sales history (filtered in real app)
        default:
          return <SellerDashboardView
            user={user}
            onLogout={handleLogout}
            onViewAllSales={(saleId?: string) => {
              setSelectedSaleId(saleId);
              setActiveTab(Tab.SELLER_SALES_HISTORY);
            }}
          />;
      }
    }
  };

  // Loading da sessão
  if (loadingSessao) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginView onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 flex justify-center">
      <main role="main" className="w-full max-w-md min-h-screen relative bg-zinc-950 shadow-2xl">
         {/* Premium Ambient Background */}
         <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[20%] w-[80%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
         </div>

        {/* Header Global */}
        <Header
          user={user}
          onLogout={handleLogout}
          storeName={nomeLoja}
          storeAvatar={avatarLoja}
          onOpenSettings={user.role === 'SELLER' ? () => setIsSettingsModalOpen(true) : undefined}
        />

        {/* Container scrollável */}
        <div className="relative z-10 min-h-screen flex flex-col overflow-y-auto">
          {/* Page Transition Wrapper com Suspense */}
          <div className="px-4">
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </div>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={user.role}
          lojaId={lojaId}
          onNewSale={() => {
            // Verificar se a conta está bloqueada antes de abrir modal
            if (checkBlocked('registrar uma venda')) {
              return;
            }
            setIsSaleModalOpen(true);
          }}
        />

        <Suspense fallback={null}>
          <NewSaleModal
            isOpen={isSaleModalOpen}
            onClose={() => setIsSaleModalOpen(false)}
            onSubmit={handleNewSale}
          />

          {lastSaleData && (
            <SaleSuccessModal
              isOpen={isSaleSuccessModalOpen}
              onClose={() => {
                setIsSaleSuccessModalOpen(false);
                setLastSaleData(null);
              }}
              onContinue={handleContinuarVendendo}
              saleData={lastSaleData}
            />
          )}

          {/* Modal de Configurações do Vendedor */}
          {user && user.role === 'SELLER' && (
            <SellerSettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              userId={user.id}
              currentName={user.name}
              onNameUpdate={(newName: string) => {
                setUser({ ...user, name: newName });
              }}
            />
          )}

          {/* Toast de Conta Inativa (aparece e desaparece automaticamente) */}
          {showInactiveToast && user && (
            <InactiveAccountToast
              isAdmin={user.role === 'ADMIN'}
              onClose={() => setShowInactiveToast(false)}
              userEmail={user.email}
            />
          )}

          {/* Modal de Conta Inativa (quando tenta fazer ação bloqueada) */}
          <InactiveAccountModal
            isOpen={inactiveModalOpen}
            onClose={() => setInactiveModalOpen(false)}
            actionAttempted={blockedAction}
            userEmail={user?.email}
            isAdmin={user?.role === 'ADMIN'}
          />

          {/* Prompt para instalar PWA (apenas no navegador) */}
          <InstallPWAPrompt />
        </Suspense>
      </main>
    </div>
  );
};

export default App;