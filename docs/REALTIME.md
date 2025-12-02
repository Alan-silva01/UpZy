# Real-time no UpZy

## Visão Geral

O UpZy utiliza o **Supabase Realtime** para sincronização automática de dados em tempo real entre múltiplos usuários e dispositivos. Quando um vendedor faz uma venda ou um admin adiciona um vendedor, todas as telas conectadas são atualizadas automaticamente sem necessidade de recarregar a página.

## Como Funciona

### 1. Hook Customizado: `useRealtimeSubscription`

Criamos um hook React customizado que gerencia as subscriptions do Supabase Realtime de forma simples e reutilizável.

**Localização:** `hooks/useRealtimeSubscription.ts`

**Características:**
- Conecta automaticamente quando o componente é montado
- Desconecta automaticamente quando o componente é desmontado (cleanup)
- Filtra por `loja_id` para garantir isolamento multi-tenancy
- Suporta filtros adicionais (ex: `vendedor_id=eq.123`)
- **Filtro manual para DELETE** - eventos DELETE usam `payload.old` ao invés de `payload.new`, então o filtro é aplicado manualmente
- **Atualização silenciosa** - não mostra loader durante atualizações em tempo real
- Logs detalhados para debug

**Exemplo de uso:**

```typescript
useRealtimeSubscription({
  table: 'vendas',
  lojaId: 'abc-123',
  onInsert: (novoDado) => {
    console.log('Nova venda!', novoDado);
    recarregarDados();
  },
  onUpdate: (dadoAtualizado) => {
    console.log('Venda atualizada!', dadoAtualizado);
    recarregarDados();
  },
  onDelete: (dadoDeletado) => {
    console.log('Venda deletada!', dadoDeletado);
    recarregarDados();
  },
  filter: 'vendedor_id=eq.456' // Filtro adicional (opcional)
});
```

### 2. Implementação nas Telas

#### Dashboard (DashboardView.tsx)
Escuta mudanças em:
- ✅ **vendas** - atualiza gráficos e estatísticas
- ✅ **vendedores** - atualiza share de vendas
- ✅ **metas** - atualiza progresso da meta

**Atualização silenciosa:** Passa `true` como parâmetro para `carregarDados()` para evitar mostrar o loader.

```typescript
useRealtimeSubscription({
  table: 'vendas',
  lojaId,
  onInsert: () => {
    carregarDados(true); // silencioso - sem loader
    carregarDadosGrafico();
  },
  onUpdate: () => {
    carregarDados(true); // silencioso - sem loader
    carregarDadosGrafico();
  },
  onDelete: () => {
    carregarDados(true); // silencioso - sem loader
    carregarDadosGrafico();
  }
});
```

#### Gerenciar Vendedores (AdminSellersView.tsx)
Escuta mudanças em:
- ✅ **vendedores** - atualiza lista de vendedores
- ✅ **vendas** - atualiza progresso de cada vendedor

#### Gerenciar Metas (GoalsManagementView.tsx)
Escuta mudanças em:
- ✅ **metas** - atualiza lista de metas
- ✅ **vendas** - atualiza progresso das metas
- ✅ **vendedores** - atualiza ranking de vendedores

#### Dashboard do Vendedor (SellerDashboardView.tsx)
Escuta mudanças em:
- ✅ **vendas** (filtrado por vendedor) - atualiza vendas do vendedor
- ✅ **vendedores** (filtrado por ID) - atualiza perfil do vendedor
- ✅ **metas** - atualiza meta do vendedor

**Filtro específico para vendedor:**
```typescript
useRealtimeSubscription({
  table: 'vendas',
  lojaId,
  filter: `vendedor_id=eq.${user.sellerId}`, // Só vendas deste vendedor
  onInsert: () => {
    carregarDadosVendedor();
    carregarUltimasVendas();
  }
});
```

## Configuração do Supabase

### Passo 1: Habilitar Realtime nas Tabelas

No painel do Supabase, vá em **Database > Replication** e habilite Real-time para as seguintes tabelas:

- ✅ `vendas`
- ✅ `vendedores`
- ✅ `metas`
- ✅ `clientes`
- ✅ `lojas` (opcional)

### Passo 2: Configurar RLS (Row Level Security)

As políticas RLS já estão configuradas corretamente em `sql/CONFIGURAR_RLS_FINAL.sql`.

**Importante:** As políticas RLS também se aplicam ao Realtime! Isso garante que:
- Cada loja só recebe eventos da sua própria loja
- Isolamento total entre tenants (multi-tenancy seguro)

## Eventos Suportados

| Evento | Descrição | Quando acontece |
|--------|-----------|-----------------|
| `INSERT` | Novo registro criado | Vendedor faz venda, admin cria meta, etc. |
| `UPDATE` | Registro atualizado | Admin edita vendedor, meta é ativada, etc. |
| `DELETE` | Registro deletado | Admin deleta vendedor, meta é excluída, etc. |

## Performance e Otimização

### Debouncing (Opcional)
Se houver muitas atualizações simultâneas, você pode adicionar debounce:

```typescript
import { debounce } from 'lodash';

const recarregarComDebounce = debounce(() => {
  carregarDados();
}, 500);

useRealtimeSubscription({
  table: 'vendas',
  lojaId,
  onInsert: recarregarComDebounce,
  onUpdate: recarregarComDebounce,
  onDelete: recarregarComDebounce
});
```

### Filtros Específicos
Use filtros para reduzir a quantidade de eventos recebidos:

```typescript
// ❌ Ruim - recebe TODAS as vendas da loja
useRealtimeSubscription({
  table: 'vendas',
  lojaId
});

// ✅ Bom - recebe APENAS vendas do vendedor
useRealtimeSubscription({
  table: 'vendas',
  lojaId,
  filter: `vendedor_id=eq.${vendedorId}`
});
```

## Logs e Debug

O hook `useRealtimeSubscription` inclui logs detalhados:

```
🔴 [Realtime] Conectando à tabela: vendas (loja: abc-123)
🔌 [Realtime] Status da conexão vendas: SUBSCRIBED
📡 [Realtime] Mudança detectada em vendas: {...}
➕ [Realtime] INSERT em vendas {...}
🔴 Nova venda detectada! Recarregando dados...
```

Para desabilitar logs em produção, remova os `console.log` do hook.

## Casos de Uso

### 1. Vendedor Faz uma Venda
1. Vendedor A registra venda no app
2. INSERT é disparado na tabela `vendas`
3. **Dashboard do Admin** é atualizado automaticamente (gráfico + estatísticas)
4. **Lista de Vendedores** é atualizada (progresso do vendedor A)
5. **Dashboard do Vendedor A** é atualizado (suas próprias vendas)

### 2. Admin Cria Nova Meta
1. Admin cria meta de R$ 100.000
2. INSERT é disparado na tabela `metas`
3. **Dashboard de todos os usuários** é atualizado com a nova meta
4. **Dashboard dos Vendedores** mostra a nova meta

### 3. Admin Edita Meta de Vendedor
1. Admin aumenta meta do vendedor B de R$ 10k para R$ 15k
2. UPDATE é disparado na tabela `vendedores`
3. **Lista de Vendedores** é atualizada
4. **Dashboard do Vendedor B** mostra a nova meta
5. **Gráficos de performance** são recalculados

## Troubleshooting

### Real-time não está funcionando

1. **Verifique se as tabelas têm Realtime habilitado**
   - Supabase Dashboard > Database > Replication
   - Habilite para `vendas`, `vendedores`, `metas`, `clientes`

2. **Verifique as políticas RLS**
   - Execute `sql/CONFIGURAR_RLS_FINAL.sql`
   - Certifique-se que as políticas permitem SELECT para authenticated users

3. **Verifique o console do navegador**
   - Procure por logs `🔴 [Realtime]`
   - Verifique erros de conexão
   - Se aparecer `⏭️ [Realtime] Ignorando evento`, significa que o filtro está funcionando corretamente

4. **DELETE não está funcionando?**
   - O hook aplica filtro manualmente para eventos DELETE
   - DELETE usa `payload.old` ao invés de `payload.new`
   - Verifique se `loja_id` existe no registro deletado

5. **Teste a conexão manualmente**
   ```typescript
   const channel = supabase
     .channel('test')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'vendas' },
       (payload) => console.log('Mudança:', payload)
     )
     .subscribe((status) => console.log('Status:', status));
   ```

### Muitas reconexões

Se você ver muitas mensagens de conexão/desconexão:
- Verifique se o componente não está sendo remontado desnecessariamente
- Adicione dependências corretas no useEffect
- Use React.memo() se necessário

## Próximos Passos

- [ ] Adicionar notificações toast quando eventos acontecem
- [ ] Implementar indicador visual de "Sincronizando..."
- [ ] Adicionar reconexão automática em caso de perda de conexão
- [ ] Otimizar com React Query para cache inteligente
