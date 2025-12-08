# Nova Estrutura de Planos - Simplificada

## 📋 Mudança Implementada

Agora a tabela `lojas` armazena o plano **completo** diretamente, sem necessidade de sincronização com outras tabelas.

## 🎯 Opções de Planos

A coluna `lojas.plano` pode ter os seguintes valores:

```
- FREE
- PRO - Mensal
- PRO - Semestral
- PRO - Anual
```

## ✅ Como Usar

### 1. Executar Script SQL

Execute o arquivo: **[atualizar_planos_loja.sql](scripts/atualizar_planos_loja.sql)**

O script faz:
- ✅ Remove constraint antiga
- ✅ Adiciona novo constraint com as 4 opções
- ✅ Migra dados existentes automaticamente:
  - `STARTER` → `PRO - Mensal`
  - `PRO` → `PRO - Semestral`
  - `ENTERPRISE` → `PRO - Anual`
  - `FREE` → `FREE`

### 2. Atualizar Plano de uma Loja

```sql
-- Plano FREE
UPDATE lojas
SET plano = 'FREE', status = 'INACTIVE'
WHERE id = 'loja-id';

-- Plano PRO Mensal
UPDATE lojas
SET
  plano = 'PRO - Mensal',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 month'
WHERE id = 'loja-id';

-- Plano PRO Semestral
UPDATE lojas
SET
  plano = 'PRO - Semestral',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '6 months'
WHERE id = 'loja-id';

-- Plano PRO Anual
UPDATE lojas
SET
  plano = 'PRO - Anual',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 year'
WHERE id = 'loja-id';
```

## 📊 Exibição no Card

O card UPZY mostrará exatamente o que está no banco:

```typescript
// Banco de dados: plano = "PRO - Semestral"
// Card mostra: "PRO - Semestral"

// Banco de dados: plano = "FREE"
// Card mostra: "FREE"
```

## 🔄 Exemplo Completo - Webhook do Asaas

Quando receber confirmação de pagamento:

```javascript
app.post('/webhook/asaas', async (req, res) => {
  const { event, payment } = req.body;

  if (event === 'PAYMENT_CONFIRMED') {
    const { customer, billingType } = payment;

    // Mapear tipo de pagamento para plano
    let plano = 'FREE';
    let intervalo = '1 month';

    if (billingType === 'monthly') {
      plano = 'PRO - Mensal';
      intervalo = '1 month';
    } else if (billingType === 'semester') {
      plano = 'PRO - Semestral';
      intervalo = '6 months';
    } else if (billingType === 'annual') {
      plano = 'PRO - Anual';
      intervalo = '1 year';
    }

    // Calcular data de renovação
    const dataRenovacao = new Date();
    if (intervalo === '1 month') {
      dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);
    } else if (intervalo === '6 months') {
      dataRenovacao.setMonth(dataRenovacao.getMonth() + 6);
    } else if (intervalo === '1 year') {
      dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);
    }

    // Buscar loja pelo asaas_customer_id
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('loja_id')
      .eq('asaas_customer_id', customer)
      .single();

    if (usuario) {
      // Atualizar loja diretamente
      await supabase
        .from('lojas')
        .update({
          plano: plano,
          status: 'ACTIVE',
          data_renovacao: dataRenovacao.toISOString()
        })
        .eq('id', usuario.loja_id);

      console.log(`✅ Loja atualizada para ${plano}`);
    }
  }

  res.json({ received: true });
});
```

## 🎨 Componente Simplificado

O componente [SettingsView.tsx](components/views/SettingsView.tsx) agora:

- ✅ Busca apenas da tabela `lojas`
- ✅ Mostra o plano direto do banco: `storeData?.plano`
- ❌ Não precisa mais buscar `usuarios.plano_ativo`
- ❌ Não precisa mais formatar o nome do plano

```typescript
// Antes (complexo)
const formatarNomePlano = () => {
  // código complexo para combinar dados...
  return tipoPlano ? `${planoBase} - ${tipoPlano}` : planoBase;
};

// Agora (simples)
{storeData?.plano || 'FREE'}
```

## 📈 Vantagens

1. ✅ **Mais Simples**: Uma única fonte de verdade
2. ✅ **Sem Sincronização**: Não precisa manter tabelas sincronizadas
3. ✅ **Menos Código**: Componente React mais simples
4. ✅ **Mais Rápido**: Uma query ao invés de duas
5. ✅ **Fácil de Entender**: Plano está onde você espera (tabela lojas)

## 🔍 Verificar Planos

```sql
-- Ver todas as lojas e seus planos
SELECT
  id,
  nome,
  plano,
  status,
  data_renovacao
FROM lojas
ORDER BY plano, nome;

-- Contar lojas por plano
SELECT
  plano,
  COUNT(*) as total
FROM lojas
GROUP BY plano
ORDER BY plano;
```

## 📝 Constraint

O banco garante que apenas valores válidos sejam inseridos:

```sql
-- ✅ Válido
INSERT INTO lojas (nome, plano) VALUES ('Teste', 'PRO - Mensal');

-- ❌ Inválido - erro
INSERT INTO lojas (nome, plano) VALUES ('Teste', 'PREMIUM');
-- ERROR: new row for relation "lojas" violates check constraint "lojas_plano_check"
```

## 🚀 Migração Automática

O script migra automaticamente os planos existentes:

```
Antes          →  Depois
----------------------------
STARTER        →  PRO - Mensal
PRO            →  PRO - Semestral
ENTERPRISE     →  PRO - Anual
FREE           →  FREE
```

## 📚 Arquivos Relacionados

- 📄 [atualizar_planos_loja.sql](scripts/atualizar_planos_loja.sql) - Script de migração
- 📄 [SettingsView.tsx](components/views/SettingsView.tsx) - Componente atualizado
- 📄 [types/database.ts](types/database.ts) - Tipos do banco

---

**Resumo:** Agora é muito mais simples! O plano está completo na tabela `lojas` e o card mostra exatamente o que está no banco. Sem sincronização, sem complexidade. 🎉
