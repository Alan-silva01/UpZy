# Sistema de Metas - Instruções de Instalação

## 📋 O que foi criado:

### 1. **Tabela no Banco de Dados** (`sql/criar_tabela_metas.sql`)
- Armazena metas definidas pelo admin
- Meta total é dividida automaticamente entre vendedores
- Suporta múltiplas metas com datas de início e fim
- Sistema de status (ACTIVE, COMPLETED, CANCELLED)

### 2. **Modal de Gerenciamento** (`components/modals/GoalsModal.tsx`)
- Interface bonita seguindo o design do app
- Criar novas metas com valor, data início e data fim
- Listar todas as metas criadas
- Excluir metas
- Animações e feedback visual

### 3. **API de Metas** (`services/metas.ts`)
- `buscarMetaAtiva()` - Busca meta ativa no período atual
- `calcularMetaVendedor()` - Calcula meta individual e progresso
- `buscarMetasLoja()` - Lista todas as metas
- `criarMeta()` - Cria nova meta
- `excluirMeta()` - Remove meta
- `atualizarStatusMeta()` - Atualiza status

### 4. **Integração no Dashboard**
- Botão de seta no card principal abre modal de metas
- Após criar/editar meta, dashboard recarrega dados

---

## 🚀 Como Instalar:

### Passo 1: Executar SQL no Supabase

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `sql/criar_tabela_metas.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione Cmd/Ctrl + Enter)
7. Verifique se a tabela foi criada com sucesso

### Passo 2: Verificar se está funcionando

1. Faça login no app como ADMIN
2. No card principal da dashboard, clique no botão com a **seta** (canto superior direito)
3. O modal de metas deve abrir
4. Clique em "Criar Nova Meta"
5. Preencha os campos:
   - **Valor Total da Meta**: Ex: 10000
   - **Data de Início**: Primeiro dia do mês
   - **Data de Término**: Último dia do mês
6. Clique em "Criar Meta"
7. A meta deve aparecer na lista

---

## 🎯 Como Funciona:

### Divisão Automática de Metas
Se você criar uma meta de **R$ 4.000** e tem **4 vendedores**, cada um terá uma meta de **R$ 1.000**.

**Exemplo:**
```
Meta Total: R$ 4.000
Vendedores: João, Maria, Pedro, Ana
Meta Individual: R$ 4.000 ÷ 4 = R$ 1.000 por vendedor
```

### Estrutura da Tabela Metas

```sql
id              UUID (chave primária)
loja_id         UUID (referência para lojas)
valor_total     DECIMAL (valor total da meta)
data_inicio     TIMESTAMP (quando a meta começa)
data_fim        TIMESTAMP (quando a meta termina)
status          TEXT (ACTIVE, COMPLETED, CANCELLED)
criado_por      UUID (admin que criou)
criado_em       TIMESTAMP
atualizado_em   TIMESTAMP
```

---

## 🎨 Design e UX:

- ✅ Cores consistentes com o app (emerald/zinc)
- ✅ Animações suaves
- ✅ Responsivo (mobile-first)
- ✅ Feedback visual para ações
- ✅ Loading states
- ✅ Validações de formulário
- ✅ Confirmação antes de excluir

---

## 📱 Próximas Funcionalidades (Opcional):

1. **Editar meta existente**
2. **Notificações quando meta é atingida**
3. **Histórico de metas cumpridas**
4. **Gráfico de progresso da meta**
5. **Meta por vendedor individual** (além da meta coletiva)
6. **Metas por produto/categoria**

---

## 🐛 Troubleshooting:

### Erro ao criar tabela:
- Verifique se você tem permissões de admin no Supabase
- Certifique-se de que a tabela "lojas" existe
- Certifique-se de que a tabela "usuarios" existe

### Modal não abre:
- Verifique o console do navegador para erros
- Certifique-se de que está logado como ADMIN
- Verifique se o userId está sendo passado corretamente

### Meta não aparece:
- Verifique se a tabela foi criada corretamente no Supabase
- Verifique as políticas RLS (Row Level Security)
- Confira o console para erros de API

---

## ✅ Checklist de Instalação:

- [ ] Executar SQL no Supabase
- [ ] Verificar se tabela foi criada
- [ ] Fazer login como admin no app
- [ ] Clicar no botão de seta no card
- [ ] Criar uma meta de teste
- [ ] Verificar se meta aparece na lista
- [ ] Testar exclusão de meta
- [ ] Verificar se modal fecha corretamente

---

**Pronto!** O sistema de metas está instalado e funcionando! 🎉
