import React, { useState } from 'react';
import { DashboardView } from './components/views/DashboardView';
import { TeamRanking } from './components/views/TeamRanking';
import { SalesFeed } from './components/views/SalesFeed';
import { CustomerRanking } from './components/views/CustomerRanking';
import { AdminSellersView } from './components/views/AdminSellersView';
import { SellerDashboardView } from './components/views/SellerDashboardView';
import { LoginView } from './components/views/LoginView';
import { SettingsView } from './components/views/SettingsView';
import { BottomNav } from './components/BottomNav';
import { NewSaleModal } from './components/modals/NewSaleModal';
import { Tab, User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Set default tab based on role
    if (loggedInUser.role === 'ADMIN') {
      setActiveTab(Tab.DASHBOARD);
    } else {
      setActiveTab(Tab.SELLER_HOME);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleNewSale = (data: any) => {
    console.log("New Sale Data:", data);
    // Here you would add the sale to the mockData or backend
    alert(`Venda de R$ ${data.amount} registrada com sucesso!`);
  };

  const renderContent = () => {
    if (!user) return null;

    if (user.role === 'ADMIN') {
      switch (activeTab) {
        case Tab.DASHBOARD: return <DashboardView />;
        case Tab.TEAM: return <TeamRanking />;
        case Tab.SALES: return <SalesFeed />;
        case Tab.CUSTOMERS: return <CustomerRanking />;
        case Tab.ADMIN_SELLERS: return <AdminSellersView />;
        case Tab.SETTINGS: return <SettingsView onLogout={handleLogout} />;
        default: return <DashboardView />;
      }
    } else {
      // Seller Views
      switch (activeTab) {
        case Tab.SELLER_HOME: return <SellerDashboardView user={user} />;
        case Tab.SALES: return <SalesFeed />; // Seller sees sales history (filtered in real app)
        default: return <SellerDashboardView user={user} />;
      }
    }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 flex justify-center">
      <main className="w-full max-w-md min-h-screen relative bg-zinc-950 shadow-2xl overflow-hidden">
         {/* Premium Ambient Background */}
         <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[20%] w-[80%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
         </div>

        <div className="relative z-10 px-4 pt-5 min-h-screen flex flex-col">
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