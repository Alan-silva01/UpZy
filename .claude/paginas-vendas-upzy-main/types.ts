import { LucideIcon } from 'lucide-react';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  store: string;
  image: string;
  content: string;
  rating: number;
  verified: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  originalPrice?: string | null;
  period: string;
  billingInfo: string;
  savings?: string;
  features: string[];
  recommended?: boolean;
  ctaText: string;
  planType: 'monthly' | 'semester' | 'annual';
  installments?: number;
  totalValue: number;
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface PainPoint {
  problem: string;
  description: string;
  icon: LucideIcon;
}