import { 
  BarChart3, 
  Smartphone, 
  Target, 
  Users, 
  Zap, 
  ShieldCheck, 
  TrendingDown, 
  FileX, 
  EyeOff 
} from 'lucide-react';
import { Feature, PainPoint, Testimonial, FAQItem, PricingPlan } from './types';

export const PAIN_POINTS: PainPoint[] = [
  {
    problem: "Cegueira Operacional",
    description: "Você não sabe quanto vendeu até fechar o caixa no fim do dia.",
    icon: EyeOff
  },
  {
    problem: "Planilhas Esquecidas",
    description: "Controle em papel ou Excel que ninguém da equipe atualiza direito.",
    icon: FileX
  },
  {
    problem: "Equipe Desmotivada",
    description: "Vendedores sem visibilidade de suas próprias metas desanimam rápido.",
    icon: TrendingDown
  }
];

export const FEATURES: Feature[] = [
  {
    title: "Tempo Real no Bolso",
    description: "Acompanhe cada venda no segundo que ela acontece, de onde estiver.",
    icon: Smartphone
  },
  {
    title: "Ranking Automático",
    description: "Gamificação que estimula a competição saudável entre vendedores.",
    icon: Users
  },
  {
    title: "Metas Claras",
    description: "Defina metas individuais e da loja. Acompanhe o progresso visualmente.",
    icon: Target
  },
  {
    title: "Gestão Descomplicada",
    description: "Adeus planilhas complexas. Tudo visual, simples e direto ao ponto.",
    icon: BarChart3
  },
  {
    title: "Modo TV",
    description: "Exiba o painel de vendas em uma TV na loja para motivar a equipe.",
    icon: Zap
  },
  {
    title: "Decisões com Dados",
    description: "Saiba quem vende mais, quais dias são melhores e projete o fechamento.",
    icon: ShieldCheck
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo Silva",
    role: "Proprietário",
    store: "Estilo Urbano",
    image: "https://picsum.photos/100/100?random=1",
    content: "Antes eu ligava na loja 5x por dia pra saber o faturamento. Agora abro o UPZY e sei de tudo. Minha equipe vendeu 37% a mais no primeiro mês.",
    rating: 5,
    verified: true
  },
  {
    id: 2,
    name: "Fernanda Costa",
    role: "Gerente",
    store: "Bella Calçados",
    image: "https://picsum.photos/100/100?random=2",
    content: "A disputa pelo topo do ranking mudou o clima da loja. Os vendedores amam ver a barra de progresso encher. Ferramenta indispensável.",
    rating: 5,
    verified: true
  },
  {
    id: 3,
    name: "Carlos Mendes",
    role: "Dono",
    store: "Tech Point",
    image: "https://picsum.photos/100/100?random=3",
    content: "Simples de usar. Em 2 minutos cadastrei minha equipe e comecei a usar. O suporte é excelente e o app não trava.",
    rating: 5,
    verified: true
  }
];

export const PLANS: PricingPlan[] = [
  {
    name: "Mensal",
    price: "R$ 99,90",
    originalPrice: null,
    period: "/mês",
    billingInfo: "Cobrado mensalmente",
    features: [
      "Acesso a todas as funcionalidades",
      "Até 10 usuários",
      "5GB de dados por usuário",
      "Suporte prioritário"
    ],
    ctaText: "Assinar Agora",
    recommended: false,
    planType: "monthly",
    totalValue: 99.90
  },
  {
    name: "Anual",
    price: "R$ 84,90",
    originalPrice: "R$ 99,90",
    period: "/mês",
    billingInfo: "Cobrado em 12x sem juros",
    savings: "Economize 15%",
    features: [
      "Acesso a todas as funcionalidades",
      "Até 20 usuários",
      "10GB de dados por usuário",
      "Suporte prioritário"
    ],
    ctaText: "Melhor Escolha",
    recommended: true,
    planType: "annual",
    installments: 12,
    totalValue: 1018.80
  },
  {
    name: "Semestral",
    price: "R$ 89,90",
    originalPrice: "R$ 99,90",
    period: "/mês",
    billingInfo: "Cobrado em 6x sem juros",
    savings: "Economize 10%",
    features: [
      "Acesso a todas as funcionalidades",
      "Até 10 usuários",
      "5GB de dados por usuário",
      "Suporte prioritário"
    ],
    ctaText: "Assinar Agora",
    recommended: false,
    planType: "semester",
    installments: 6,
    totalValue: 534.00
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Preciso cadastrar cartão de crédito para testar?",
    answer: "Não! Você tem 14 dias de acesso total gratuito sem precisar informar cartão. Só paga se gostar e quiser continuar."
  },
  {
    question: "Funciona em quais celulares?",
    answer: "O UPZY funciona em qualquer smartphone Android ou iPhone (iOS), além de tablets e computadores via navegador."
  },
  {
    question: "É difícil de configurar?",
    answer: "Zero dificuldade. O processo de cadastro da loja e convite dos vendedores leva menos de 2 minutos. É baixar e usar."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim, utilizamos criptografia de ponta a ponta e servidores seguros (AWS) para garantir que apenas você tenha acesso aos seus dados financeiros."
  }
];