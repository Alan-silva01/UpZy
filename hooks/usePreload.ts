// Hook para preload de componentes
export const usePreload = () => {
  const preloadMap: Record<string, () => Promise<any>> = {
    dashboard: () => import('../components/views/DashboardView'),
    team: () => import('../components/views/TeamRanking'),
    sales: () => import('../components/views/SalesFeed'),
    customers: () => import('../components/views/CustomerRanking'),
    adminSellers: () => import('../components/views/AdminSellersView'),
    sellerDashboard: () => import('../components/views/SellerDashboardView'),
    sellerHistory: () => import('../components/views/SellerSalesHistoryView'),
    settings: () => import('../components/views/SettingsView'),
    goals: () => import('../components/views/GoalsManagementView'),
    newSaleModal: () => import('../components/modals/NewSaleModal'),
  };

  const preload = (component: string) => {
    if (preloadMap[component]) {
      preloadMap[component]().catch((err) => {
        console.warn(`Preload failed for ${component}:`, err);
      });
    }
  };

  return { preload };
};
