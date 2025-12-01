# Deploy na Vercel - UpZy

## Problema: Tela Preta

Se você está vendo apenas uma tela preta na Vercel, siga estes passos:

## ✅ Passo 1: Configurar Variáveis de Ambiente

1. Acesse seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://tkrtkzudwptjycqvksrc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcnRrenVkd3B0anljcXZrc3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjQ0ODMsImV4cCI6MjA4MDEwMDQ4M30.lS054DdqzlHTssMQNCuq4M1YBgIjyoTRXTyJ1DvaKP4
```

4. Marque para aplicar em **Production**, **Preview** e **Development**

## ✅ Passo 2: Fazer Redeploy

1. Vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Clique em **Redeploy**
4. Aguarde o build finalizar

## ✅ Passo 3: Verificar Console do Navegador

1. Abra o site deployado
2. Pressione F12 (DevTools)
3. Vá na aba **Console**
4. Verifique se há erros (linhas vermelhas)
5. Se houver erros relacionados a `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY`, repita os passos 1 e 2

## 📋 Checklist de Configuração na Vercel

- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Node Version: 18.x ou superior
- [ ] Variáveis de ambiente configuradas
- [ ] Redeploy realizado após configurar variáveis

## 🔍 Debug

Se ainda estiver com tela preta:

1. Verifique os logs do build na Vercel
2. Procure por erros durante o build
3. Verifique se o arquivo `dist/index.html` foi gerado
4. Verifique se `dist/assets/` contém arquivos .js

## 📝 Arquivos Importantes

- `vercel.json` - Configuração da Vercel (criado automaticamente)
- `.env.production` - Variáveis de ambiente de produção
- `vite.config.ts` - Configuração do Vite

## 🚀 Deploy Manual (Alternativo)

Se preferir fazer deploy manual:

```bash
# 1. Build local
npm run build

# 2. Instalar Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod
```

## 📞 Suporte

Se o problema persistir, verifique:
1. Console do navegador (F12)
2. Logs de build na Vercel
3. Network tab para ver quais requests estão failing
