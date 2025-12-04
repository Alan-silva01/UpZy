import React, { useState, useEffect } from 'react';
import { DashboardView } from './components/views/DashboardView';
import { TeamRanking } from './components/views/TeamRanking';
import { SalesFeed } from './components/views/SalesFeed';
import { CustomerRanking } from './components/views/CustomerRanking';
import { AdminSellersView } from './components/views/AdminSellersView';
import { SellerDashboardView } from './components/views/SellerDashboardView';
import { SellerSalesHistoryView } from './components/views/SellerSalesHistoryView';
import { LoginView } from './components/views/LoginView';
import { SettingsView } from './components/views/SettingsView';
import { GoalsManagementView } from './components/views/GoalsManagementView';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NewSaleModal } from './components/modals/NewSaleModal';
import { SaleSuccessModal } from './components/modals/SaleSuccessModal';
import { SellerSettingsModal } from './components/modals/SellerSettingsModal';
import { InactiveAccountToast } from './components/ui/InactiveAccountToast';
import { InactiveAccountModal } from './components/modals/InactiveAccountModal';
import { Tab, User } from './types';
import { verificarSessao, fazerLogout, buscarLojaIdUsuario, buscarNomeLoja } from './services/auth';
import { useStoreStatus } from './hooks/useStoreStatus';
import { Loader2 } from 'lucide-react';

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

    // Timeout de segurança: se após 10 segundos ainda estiver carregando, força o fim do loading
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout de segurança atingido');
      setLoadingSessao(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

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
        } else {
          setActiveTab(Tab.SELLER_HOME);
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
    } else {
      setActiveTab(Tab.SELLER_HOME);
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

    const sucesso = await criarVenda({
      lojaId,
      vendedorId,
      numeroPedido: data.orderId,
      valor: parseFloat(data.amount),
      nomeCliente: data.customerName,
      metodoPagamento: metodoPagamentoMap[data.paymentMethod] || data.paymentMethod,
      tipoPagamento: data.paymentType === 'spot' ? 'avista' : 'parcelado',
      parcelas: data.installments,
      dataVenda: `${data.saleDate}T${data.saleTime}:00.000Z`
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
        case Tab.GOALS: return <GoalsManagementView lojaId={lojaId} userId={user.id} onBack={() => setActiveTab(Tab.DASHBOARD)} />;
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
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 flex justify-center">
      <main className="w-full max-w-md min-h-screen relative bg-zinc-950 shadow-2xl">
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
          {/* Page Transition Wrapper */}
          <div className="px-4">
            {renderContent()}
          </div>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={user.role}
          onNewSale={() => {
            // Verificar se a conta está bloqueada antes de abrir modal
            if (checkBlocked('registrar uma venda')) {
              return;
            }
            setIsSaleModalOpen(true);
          }}
        />

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
          />
        )}

        {/* Modal de Conta Inativa (quando tenta fazer ação bloqueada) */}
        <InactiveAccountModal
          isOpen={inactiveModalOpen}
          onClose={() => setInactiveModalOpen(false)}
          actionAttempted={blockedAction}
        />
      </main>
    </div>
  );
};

export default App;