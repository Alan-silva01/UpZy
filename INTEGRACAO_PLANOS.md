# Integração de Planos - User com Loja

## Visão Geral

Este sistema sincroniza automaticamente os dados de plano e assinatura da tabela `usuarios` (que contém dados de pagamento do Asaas) com a tabela `lojas`.

## Estrutura de Dados

### Tabela `usuarios`
Contém os dados de pagamento e plano do usuário:
- `plano_ativo`: 'monthly' | 'semester' | 'annual'
- `data_expiracao`: Data de expiração do plano
- `status`: 'ativo' | 'inativo' | 'pendente'
- `asaas_customer_id`: ID do cliente no Asaas
- Dados de billing (nome, CPF, endereço, etc.)

### Tabela `lojas`
Recebe os dados sincronizados:
- `plano`: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
- `status`: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE'
- `data_renovacao`: Data de renovação (copiada de `data_expiracao`)

## Mapeamento de Planos

```
usuarios.plano_ativo → lojas.plano
------------------------
monthly              → STARTER
semester             → PRO
annual               → ENTERPRISE
null/vazio           → FREE
```

## Sincronização Automática

### 1. Via Trigger SQL (Recomendado)

Execute o script `scripts/adicionar_campos_plano_usuario.sql` no Supabase SQL Editor.

Este script cria um trigger que sincroniza automaticamente sempre que:
- Um novo usuário é criado
- O campo `plano_ativo` é atualizado
- O campo `data_expiracao` é atualizado
- O campo `status` é atualizado

**Vantagens:**
- ✅ Sincronização automática em tempo real
- ✅ Funciona independente do frontend
- ✅ Mais confiável e performático
- ✅ Não requer código adicional no app

### 2. Via Código TypeScript

A sincronização também pode ser feita manualmente usando a função:

```typescript
import { sincronizarPlanoUsuarioComLoja } from './services/auth';

// Sincronizar plano do usuário com a loja
await sincronizarPlanoUsuarioComLoja(userId);
```

**Quando usar:**
- Quando quiser forçar uma sincronização manual
- Para debugging
- Em ambientes sem acesso ao SQL

A sincronização já está integrada no login:
- Quando um usuário ADMIN faz login, o plano é sincronizado automaticamente
- Quando verifica a sessão, o plano é atualizado

## Lógica de Status

```typescript
if (usuario.status === 'ativo') {
  if (data_expiracao > agora) {
    statusLoja = 'ACTIVE'
  } else {
    statusLoja = 'PAST_DUE'
  }
} else {
  statusLoja = 'INACTIVE'
}
```

## Passo a Passo para Configurar

### 1. Executar SQL no Supabase

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e cole o conteúdo de `scripts/adicionar_campos_plano_usuario.sql`
4. Execute o script

### 2. Atualizar Dados de Usuário

Quando o pagamento for confirmado no Asaas, atualize a tabela `usuarios`:

```sql
UPDATE usuarios
SET
  plano_ativo = 'semester',
  data_expiracao = '2026-06-08 14:47:53.612+00',
  status = 'ativo',
  asaas_customer_id = 'cus_000007287348'
WHERE id = 'user-id-aqui';
```

O trigger irá sincronizar automaticamente com a tabela `lojas`.

### 3. Verificar Sincronização

```sql
-- Ver dados do usuário
SELECT id, nome, plano_ativo, data_expiracao, status, loja_id
FROM usuarios
WHERE id = 'user-id-aqui';

-- Ver dados da loja sincronizados
SELECT l.id, l.nome, l.plano, l.status, l.data_renovacao
FROM lojas l
JOIN usuarios u ON u.loja_id = l.id
WHERE u.id = 'user-id-aqui';
```

## Funções Disponíveis

### `sincronizarPlanoUsuarioComLoja(userId: string)`
Sincroniza manualmente o plano do usuário com a loja.

```typescript
const resultado = await sincronizarPlanoUsuarioComLoja(userId);
if (resultado.sucesso) {
  console.log('Plano sincronizado:', resultado.mensagem);
}
```

### `buscarPlanoUsuario(userId: string)`
Busca informações do plano do usuário.

```typescript
const plano = await buscarPlanoUsuario(userId);
console.log('Plano:', plano.plano);
console.log('Expira em:', plano.dataExpiracao);
console.log('Status:', plano.status);
```

## Webhook do Asaas (Recomendado)

Para sincronização automática com pagamentos:

1. Configure um webhook no Asaas para notificações de pagamento
2. Quando receber confirmação de pagamento, atualize a tabela `usuarios`
3. O trigger SQL sincronizará automaticamente com `lojas`

Exemplo de webhook handler:

```typescript
// Quando receber confirmação de pagamento do Asaas
app.post('/webhook/asaas', async (req, res) => {
  const { event, payment } = req.body;

  if (event === 'PAYMENT_CONFIRMED') {
    const usuario = await buscarUsuarioPorAsaasId(payment.customer);

    // Calcular data de expiração baseado no plano
    const plano = payment.billingType; // monthly, semester, annual
    const dataExpiracao = calcularDataExpiracao(plano);

    // Atualizar usuário (o trigger SQL fará a sincronização)
    await supabase
      .from('usuarios')
      .update({
        plano_ativo: plano,
        data_expiracao: dataExpiracao,
        status: 'ativo'
      })
      .eq('asaas_customer_id', payment.customer);

    // Plano sincronizado automaticamente via trigger!
  }

  res.json({ received: true });
});
```

## Testando

```typescript
// 1. Fazer login
const { user } = await fazerLogin({ email, senha });

// 2. Verificar sincronização automática no console
// Você verá: "🔄 Iniciando sincronização de plano..."
// E depois: "✅ Plano sincronizado com sucesso!"

// 3. Verificar status da loja
const status = await verificarStatusLoja(lojaId);
console.log('Status da loja:', status);
```

## Observações Importantes

1. **Apenas ADMIN**: Apenas usuários com papel ADMIN têm seus planos sincronizados com a loja
2. **Vendedores**: Vendedores não afetam o plano da loja
3. **Automático no Login**: A sincronização acontece automaticamente no login
4. **Trigger SQL**: Use o trigger SQL para sincronização em tempo real
5. **Data de Expiração**: A data de expiração é sempre verificada contra a data atual

## Troubleshooting

### Plano não está sincronizando
1. Verifique se o trigger SQL foi criado corretamente
2. Verifique se o usuário tem papel 'ADMIN'
3. Verifique os logs do console para erros

### Status está incorreto
1. Verifique se `data_expiracao` está no formato correto (ISO 8601)
2. Verifique se `status` é 'ativo', 'inativo' ou 'pendente'
3. Verifique o timezone do servidor

### Sincronização manual não funciona
```typescript
// Force a sincronização
const resultado = await sincronizarPlanoUsuarioComLoja(userId);
console.log(resultado);
```
