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
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

## 🏗️ Estrutura do Projeto

```
UpZy/
├── components/        # Componentes React (UI, Views, Modals)
├── pages/             # Páginas do sistema (auth, vendas)
├── services/          # Serviços e APIs (auth, api, etc)
├── hooks/             # React Hooks customizados
├── contexts/          # React Contexts (DataCache)
├── utils/             # Funções utilitárias
├── lib/               # Configurações (Supabase)
├── types/             # Tipos do banco de dados
├── supabase/          # Migrações e Edge Functions
├── public/            # Assets estáticos e PWA
└── types.ts           # Tipos globais da aplicação
```

## 🎯 Funcionalidades

### Admin
- Dashboard com métricas em tempo real
- Gestão de vendedores e comissões
- Sistema de metas e rankings
- Histórico completo de vendas
- Configurações da loja

### Vendedor
- Dashboard pessoal com metas
- Registro rápido de vendas
- Histórico de vendas próprias
- Ranking da equipe

### Geral
- PWA instalável (iOS, Android, Desktop)
- Realtime updates via Supabase
- Autenticação segura
- Modo demonstração para contas inativas

## 📱 PWA

O app funciona como PWA e pode ser instalado em:
- **iOS**: Safari > Compartilhar > Adicionar à Tela Inicial
- **Android**: Chrome > Menu > Instalar aplicativo
- **Desktop**: Barra de endereço > Ícone de instalação

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Variáveis de ambiente para dados sensíveis
- Proteção contra contas inativas

## 📄 Licença

Projeto proprietário - Todos os direitos reservados.
