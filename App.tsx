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
import { BottomNav } from './components/BottomNav';
import { NewSaleModal } from './components/modals/NewSaleModal';
import { Tab, User } from './types';
import { verificarSessao, fazerLogout, buscarLojaIdUsuario } from './services/auth';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [loadingSessao, setLoadingSessao] = useState(true);

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
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      setUser(null);
      setLojaId(null);
    } finally {
      console.log('✅ Verificação de sessão concluída');
      setLoadingSessao(false);
    }
  };

  console.log('🚀 App - User:', user, 'LojaId:', lojaId);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    const loja = await buscarLojaIdUsuario(loggedInUser.id);
    setLojaId(loja);

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
    setActiveTab(Tab.DASHBOARD);
  };

  const handleNewSale = async (data: any) => {
    if (!lojaId || !user) return;

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
      'card': 'cartao',
      'boleto': 'boleto',
      'promissory': 'promissoria'
    };

    const sucesso = await criarVenda({
      lojaId,
      vendedorId,
      numeroPedido: data.orderId,
      valor: parseFloat(data.amount),
      quantidadeItens: parseInt(data.itemsCount) || 1,
      nomeCliente: data.customerName,
      metodoPagamento: metodoPagamentoMap[data.paymentMethod] || data.paymentMethod,
      tipoPagamento: data.paymentType === 'spot' ? 'avista' : 'parcelado',
      parcelas: data.installments
    });

    if (sucesso) {
      alert(`Venda de R$ ${data.amount} registrada com sucesso!`);
    } else {
      alert('Erro ao registrar venda. Tente novamente.');
    }
  };

  const renderContent = () => {
    if (!user || !lojaId) return null;

    if (user.role === 'ADMIN') {
      switch (activeTab) {
        case Tab.DASHBOARD: return <DashboardView lojaId={lojaId} userId={user.id} />;
        case Tab.TEAM: return <TeamRanking />;
        case Tab.SALES: return <SalesFeed />;
        case Tab.CUSTOMERS: return <CustomerRanking />;
        case Tab.ADMIN_SELLERS: return <AdminSellersView lojaId={lojaId} />;
        case Tab.SETTINGS: return <SettingsView onLogout={handleLogout} />;
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
            onViewAllSales={() => setActiveTab(Tab.SELLER_SALES_HISTORY)}
          />;
        case Tab.SELLER_SALES_HISTORY:
          return <SellerSalesHistoryView
            user={user}
            onBack={() => setActiveTab(Tab.SELLER_HOME)}
          />;
        case Tab.SALES: return <SalesFeed />; // Seller sees sales history (filtered in real app)
        default:
          return <SellerDashboardView
            user={user}
            onLogout={handleLogout}
            onViewAllSales={() => setActiveTab(Tab.SELLER_SALES_HISTORY)}
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

        {/* Container scrollável com padding-top para o header */}
        <div className="relative z-10 px-4 min-h-screen flex flex-col overflow-y-auto">
          {/* Page Transition Wrapper */}
          <div key={activeTab} className="animate-page-enter">
            {renderContent()}
          </div>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={user.role}
          onNewSale={() => setIsSaleModalOpen(true)}
        />

        <NewSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          onSubmit={handleNewSale}
        />
      </main>
    </div>
  );
};

export default App;