// Tipos do banco de dados Supabase
export interface LojaDB {
  id: string;
  nome: string;
  plano: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
  data_renovacao: string | null;
}

export interface UsuarioDB {
  id: string;
  loja_id: string;
  email: string;
  nome: string;
  papel: 'ADMIN' | 'SELLER';
  avatar: string | null;
  senha_hash: string;
}

export interface VendedorDB {
  id: string;
  loja_id: string;
  usuario_id: string;
  meta: number;
}

export interface VendaDB {
  id: string;
  loja_id: string;
  vendedor_id: string;
  numero_pedido: string | null;
  valor: number;
  quantidade_itens: number;
  nome_cliente: string | null;
  metodo_pagamento: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'boleto' | 'promissoria' | null;
  tipo_pagamento: 'avista' | 'parcelado' | null;
  parcelas: number;
  data_venda: string;
}

export interface ClienteDB {
  id: string;
  loja_id: string;
  nome: string;
  total_gasto: number;
  visitas: number;
  nivel: 'VIP' | 'Gold' | 'Silver' | 'Bronze';
  avatar: string | null;
}
