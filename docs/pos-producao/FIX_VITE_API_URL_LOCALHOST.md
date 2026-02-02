# Correção da URL da API no Frontend

**Data:** 26/01/2026  
**Ambiente:** Produção  
**Status:** ✅ Resolvido

## Problema

Após deploy da extensão, o console mostrava erro:
```
Failed to fetch - GET http://localhost:8000/api/v1/...
```

O frontend estava chamando `localhost:8000` ao invés da URL de produção `http://aponta.treit.com.br`.

## Causa Raiz

O Vite estava carregando o arquivo `.env` errado por conta da configuração `root: 'client'` no `vite.config.ts`.

### Estrutura de Arquivos

```
fe-aponta/
├── .env                    ← Arquivo raiz (ignorado pelo Vite)
├── .env.production         ← Arquivo raiz (ignorado pelo Vite)
├── client/
│   ├── .env               ← ESTE era carregado (tinha localhost:8000)
│   └── .env.production    ← NÃO EXISTIA
└── vite.config.ts         ← root: 'client'
```

Como o `vite.config.ts` define `root: 'client'`, o Vite procura arquivos `.env*` dentro de `client/`, não na raiz.

## Solução

Criado arquivo `client/.env.production` com a URL correta:

```env
VITE_API_URL=http://aponta.treit.com.br/api/v1
```

## Build e Deploy

```bash
# 1. Rebuild do frontend
npm run build:extension

# 2. Novo arquivo gerado
# dist/extension/assets/main-1eDut0Gq.js

# 3. Deploy para o servidor
scp -r dist/extension/* root@92.112.178.252:/root/fe-aponta-deploy/extension/

# 4. Copiar para container
docker cp /root/fe-aponta-deploy/extension/. fe-aponta-prod:/usr/share/nginx/html/extension/
```

## Verificação

Após reload da extensão no Azure DevOps, as chamadas de API foram para a URL correta:
```
GET http://aponta.treit.com.br/api/v1/...
```

## Lições Aprendidas

1. **Sempre verificar o `root` do Vite** - arquivos `.env` são relativos ao root
2. **Criar `.env.production` no diretório correto** - onde o Vite está configurado para procurar
3. **Testar o build antes de deploy** - verificar se a variável está sendo substituída corretamente

## Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `client/.env.production` | **Criado** |
| `dist/extension/assets/main-*.js` | Rebuild |

## Configuração do Vite

Trecho relevante do `vite.config.ts`:
```typescript
export default defineConfig({
  root: 'client',  // ← Determina onde procurar .env*
  // ...
})
```

## Relacionado

- [DEPLOY_PRODUCAO_V1.0.md](./DEPLOY_PRODUCAO_V1.0.md) - Processo de deploy
- [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) - Guia de desenvolvimento
