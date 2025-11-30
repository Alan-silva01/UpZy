import { Seller, Sale, Customer, StoreStats, User, Store } from '../types';

export const STORE_INFO: Store = {
  id: 'store_01',
  name: 'Fashion Concept',
  plan: 'PRO',
  status: 'ACTIVE',
  renewalDate: '15/12/2024'
};

export const USERS: User[] = [
  { id: 'u1', name: 'Administrador', email: 'admin@upzy.com', role: 'ADMIN', avatar: 'https://picsum.photos/100/100?random=99' },
  { id: 'u2', name: 'Ricardo Silva', email: 'ricardo@upzy.com', role: 'SELLER', sellerId: '1', avatar: 'https://picsum.photos/100/100?random=1' },
];

export const STORE_STATS: StoreStats = {
  totalSales: 184500.50,
  monthlyTarget: 250000.00,
  dailyTarget: 8500.00,
  salesToday: 9240.00
};

export const SELLERS: Seller[] = [
  { id: '1', name: 'Ricardo Silva', avatar: 'https://picsum.photos/100/100?random=1', currentSales: 45200, target: 50000, lastSaleTime: '10 min atrás' },
  { id: '2', name: 'Bruno Costa', avatar: 'https://picsum.photos/100/100?random=2', currentSales: 38900, target: 50000, lastSaleTime: '1h atrás' },
  { id: '3', name: 'André Martins', avatar: 'https://picsum.photos/100/100?random=3', currentSales: 52100, target: 60000, lastSaleTime: '5 min atrás' },
  { id: '4', name: 'Lucas Pereira', avatar: 'https://picsum.photos/100/100?random=4', currentSales: 28400, target: 45000, lastSaleTime: '3h atrás' },
  { id: '5', name: 'Felipe Santos', avatar: 'https://picsum.photos/100/100?random=5', currentSales: 15600, target: 45000, lastSaleTime: 'Yesterday' },
];

export const RECENT_SALES: Sale[] = [
  { id: '101', amount: 2450.00, itemsCount: 3, timestamp: '10:45', sellerId: '3', customerName: 'João Mendes' },
  { id: '102', amount: 890.90, itemsCount: 2, timestamp: '10:15', sellerId: '1', customerName: 'Carlos Eduardo' },
  { id: '103', amount: 5600.00, itemsCount: 5, timestamp: '09:30', sellerId: '2', customerName: 'Dr. Roberto' },
  { id: '104', amount: 320.00, itemsCount: 1, timestamp: 'Ontem', sellerId: '4', customerName: 'Pedro H.' },
  { id: '105', amount: 1200.50, itemsCount: 2, timestamp: 'Ontem', sellerId: '3', customerName: 'Matheus L.' },
  { id: '106', amount: 450.00, itemsCount: 1, timestamp: 'Ontem', sellerId: '3', customerName: 'Fábio Jr.' },
  { id: '107', amount: 2100.00, itemsCount: 3, timestamp: 'Ontem', sellerId: '3', customerName: 'Ana Clara' },
  { id: '108', amount: 150.00, itemsCount: 1, timestamp: '2 dias', sellerId: '3', customerName: 'Beto O.' },
  { id: '109', amount: 5500.00, itemsCount: 4, timestamp: '2 dias', sellerId: '1', customerName: 'Ricardo M.' },
  { id: '110', amount: 1200.00, itemsCount: 2, timestamp: '2 dias', sellerId: '1', customerName: 'Jorge S.' },
];

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Dr. Roberto', totalSpent: 25400, visits: 12, tier: 'VIP', avatar: 'https://picsum.photos/100/100?random=10' },
  { id: 'c2', name: 'João Mendes', totalSpent: 18200, visits: 8, tier: 'Gold', avatar: 'https://picsum.photos/100/100?random=11' },
  { id: 'c3', name: 'Carlos Eduardo', totalSpent: 12500, visits: 15, tier: 'Gold', avatar: 'https://picsum.photos/100/100?random=12' },
  { id: 'c4', name: 'Matheus L.', totalSpent: 5600, visits: 4, tier: 'Silver', avatar: 'https://picsum.photos/100/100?random=13' },
  { id: 'c5', name: 'Pedro H.', totalSpent: 1200, visits: 2, tier: 'Bronze', avatar: 'https://picsum.photos/100/100?random=14' },
];