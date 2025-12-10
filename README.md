# UpZy - Sistema de Gestão de Vendas

Sistema completo de gestão de vendas e comissões para equipes comerciais.

## 🚀 Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Banco de Dados**: Supabase (PostgreSQL)
- **Estilo**: Tailwind CSS
- **Gráficos**: Recharts
- **PWA**: Vite PWA Plugin

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env na raiz com:
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🏗️ Estrutura do Projeto

```
UpZy/
├── components/        # Componentes React
├── pages/            # Páginas do sistema
├── services/         # Serviços e APIs
├── hooks/            # React Hooks customizados
├── utils/            # Funções utilitárias
├── lib/              # Configurações (Supabase)
├── supabase/         # Migrações e functions
└── types/            # Tipos TypeScript
```

## 🎯 Funcionalidades

- Dashboard administrativo com métricas em tempo real
- Gestão de vendedores e comissões
- Registro e histórico de vendas
- Sistema de metas e rankings
- PWA (Progressive Web App)
- Realtime updates via Supabase
- Sistema de autenticação

## 📱 PWA

O aplicativo funciona como PWA e pode ser instalado em dispositivos móveis e desktop.

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Variáveis de ambiente para dados sensíveis
