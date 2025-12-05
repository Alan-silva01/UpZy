import React, { useEffect } from 'react';
import { Home, Users, TrendingUp, UserCheck, Settings, PlusCircle, History, Target } from 'lucide-react';
import { Tab, Role } from '../types';
import { usePreload } from '../hooks/usePreload';
import { usePrefetchData } from '../hooks/usePrefetchData';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userRole: Role;
  onNewSale?: () => void;
  lojaId?: string | null;
}

interface NavItem {
  id: Tab | string;
  icon: React.ComponentType<any>;
  label: string;
  preloadKey?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole, onNewSale, lojaId }) => {
  const { preload } = usePreload();
  const {
    prefetchDashboardData,
    prefetchTeamData,
    prefetchSalesData,
    prefetchGoalsData,
    prefetchAdminSellersData,
  } = usePrefetchData(lojaId || null);

  const getNavItems = (): NavItem[] => {
    if (userRole === 'ADMIN') {
      return [
        { id: Tab.DASHBOARD, icon: Home, label: 'Home', preloadKey: 'dashboard' },
        { id: Tab.TEAM, icon: Users, label: 'Team', preloadKey: 'team' },
        { id: Tab.GOALS, icon: Target, label: 'Metas', preloadKey: 'goals' },
        { id: Tab.SALES, icon: TrendingUp, label: 'Sales', preloadKey: 'sales' },
        { id: Tab.ADMIN_SELLERS, icon: UserCheck, label: 'Admin', preloadKey: 'adminSellers' },
        { id: Tab.SETTINGS, icon: Settings, label: 'Config', preloadKey: 'settings' },
      ];
    } else {
      return [
        { id: Tab.SELLER_HOME, icon: Home, label: 'Home', preloadKey: 'sellerDashboard' },
        { id: 'NEW_SALE_ACTION', icon: PlusCircle, label: 'Novo', preloadKey: 'newSaleModal' },
        { id: Tab.SALES, icon: History, label: 'Histórico', preloadKey: 'sellerHistory' },
      ];
    }
  };

  const navItems = getNavItems();

  // PREFETCH IMEDIATO: Carregar TUDO assim que o BottomNav aparecer
  useEffect(() => {
    // Prefetch instantâneo (sem delay)
    navItems.forEach(item => {
      if (item.preloadKey) {
        preload(item.preloadKey);
      }
    });

    // Prefetch de TODOS os dados em paralelo
    if (userRole === 'ADMIN' && lojaId) {
      Promise.all([
        prefetchDashboardData(),
        prefetchTeamData(),
        prefetchSalesData(),
        prefetchGoalsData(),
        prefetchAdminSellersData(),
      ]).then(() => console.log('✅ Todos os dados do Admin pré-carregados'));
    } else if (lojaId) {
      Promise.all([
        prefetchSalesData(),
      ]).then(() => console.log('✅ Dados do Vendedor pré-carregados'));
    }
  }, [userRole, lojaId]);

  // Função para fazer prefetch ao passar mouse
  const handleMouseEnter = (tab: Tab | string) => {
    // Preload do componente
    const item = navItems.find(i => i.id === tab);
    if (item?.preloadKey) {
      preload(item.preloadKey);
    }

    // Prefetch dos dados
    switch (tab) {
      case Tab.DASHBOARD:
        prefetchDashboardData();
        break;
      case Tab.TEAM:
        prefetchTeamData();
        break;
      case Tab.SALES:
        prefetchSalesData();
        break;
      case Tab.GOALS:
        prefetchGoalsData();
        break;
      case Tab.ADMIN_SELLERS:
        prefetchAdminSellersData();
        break;
    }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-6 py-4 flex items-center gap-4 max-w-sm w-full justify-between ring-1 ring-white/5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.id === 'NEW_SALE_ACTION') {
            return (
              <button
                key={item.id}
                onClick={onNewSale}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onTouchStart={() => handleMouseEnter(item.id)}
                className="relative group flex items-center justify-center -mt-8"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onTouchStart={() => handleMouseEnter(item.id)}
              className="relative group flex items-center justify-center"
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {isActive && (
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              )}

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100 -z-10 blur-md"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};