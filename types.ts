export type Role = 'ADMIN' | 'SELLER';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  avatar: string;
  sellerId?: string; // Links a user to a specific seller profile
}

export interface Store {
  id: string;
  name: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE';
  renewalDate: string;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  currentSales: number;
  target: number;
  lastSaleTime?: string;
}

export interface Sale {
  id: string;
  amount: number;
  itemsCount: number;
  timestamp: string;
  sellerId: string;
  customerName: string;
  orderId?: string;
  paymentMethod?: string;
  paymentType?: string;
  installments?: number;
}

export interface Customer {
  id: string;
  name: string;
  totalSpent: number;
  visits: number;
  tier: 'VIP' | 'Gold' | 'Silver' | 'Bronze';
  avatar: string;
}

export interface StoreStats {
  totalSales: number;
  monthlyTarget: number;
  dailyTarget: number;
  salesToday: number;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  TEAM = 'TEAM', // Admin Only
  SALES = 'SALES', // Global Sales (Admin) or My History (Seller)
  CUSTOMERS = 'CUSTOMERS',
  ADMIN_SELLERS = 'ADMIN_SELLERS', // Admin Only (Manage Sellers)
  SELLER_HOME = 'SELLER_HOME', // Seller Only
  SELLER_SALES_HISTORY = 'SELLER_SALES_HISTORY', // Seller Only (Full Sales History with Edit/Delete)
  SETTINGS = 'SETTINGS', // Admin Only (SaaS Settings)
  GOALS = 'GOALS' // Admin Only (Goals Management)
}

export type PaymentMethod = 'pix' | 'money' | 'card_debit' | 'card_credit' | 'boleto' | 'promissory';
export type PaymentType = 'spot' | 'installments';

export interface SaleFormData {
  orderId: string;
  amount: string; // Keep as string for input handling
  customerName: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  installments: number;
}