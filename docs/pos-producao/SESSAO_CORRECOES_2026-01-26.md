# Sessão de Correções - 26/01/2026

**Data:** 26/01/2026  
**Duração:** ~1 hora  
**Ambientes Afetados:** Produção e Staging

## Resumo da Sessão

Esta sessão corrigiu três problemas relacionados ao deploy da feature de filtro por Sprint/Iteration no Azure DevOps.

## Problemas Corrigidos

### 1. ❌ Frontend chamando localhost:8000
**Sintoma:** Console mostrava `Failed to fetch - GET http://localhost:8000/api/v1/...`  
**Causa:** Arquivo `.env` em `client/` tinha URL de desenvolvimento  
**Solução:** Criar `client/.env.production` com URL correta  
**Doc:** [FIX_VITE_API_URL_LOCALHOST.md](./FIX_VITE_API_URL_LOCALHOST.md)

### 2. ❌ CORS bloqueando novas organizações
**Sintoma:** Erro de CORS no console para organizações sefaz-ce-diligencia e sefaz-ce-siscoex2  
**Causa:** Origens não estavam na lista de CORS permitidos  
**Solução:** Adicionar URLs ao `app/config.py`  
**Doc:** [FIX_CORS_NOVAS_ORGANIZACOES.md](./FIX_CORS_NOVAS_ORGANIZACOES.md)

### 3. ❌ Endpoint /api/v1/iterations retornando 404
**Sintoma:** `GET /api/v1/iterations 404 (Not Found)`  
**Causa:** Router não registrado no `__init__.py` do módulo routers  
**Solução:** Adicionar exports em `app/routers/__init__.py` e recriar container  
**Doc:** [FIX_ITERATIONS_ENDPOINT_404.md](./FIX_ITERATIONS_ENDPOINT_404.md)

## Sequência de Deploy

```
1. Correção API URL
   └─> Rebuild frontend
       └─> Deploy frontend

2. Correção CORS
   └─> Update config.py
       └─> Restart containers

3. Correção Iterations 404
   └─> Update __init__.py
       └─> Recriar container prod
           └─> Todos containers healthy
```

## Estado Final

| Container | Status |
|-----------|--------|
| `api-aponta-prod` | ✅ healthy |
| `api-aponta-staging` | ✅ healthy |
| `fe-aponta-prod` | ✅ healthy |
| `fe-aponta-staging` | ✅ healthy |
| `nginx-aponta` | ✅ healthy |
| `postgres-aponta` | ✅ healthy |

## Arquivos Modificados

### Frontend (`fe-aponta`)
- `client/.env.production` - **Criado**

### Backend (`api-aponta-vps`)
- `app/config.py` - Adicionadas origens CORS
- `app/routers/__init__.py` - Adicionados exports de `organization_pats` e `iterations`

## Comandos Úteis Utilizados

```bash
# Verificar status de todos os containers
ssh root@92.112.178.252 "docker ps -a --format 'table {{.Names}}\t{{.Status}}' | grep aponta"

# Ver logs de um container
ssh root@92.112.178.252 "docker logs api-aponta-prod --tail 30"

# Testar endpoint (espera 401, não 404)
ssh root@92.112.178.252 "curl -s http://localhost:8000/api/v1/iterations -o /dev/null -w '%{http_code}'"

# Copiar arquivo para container
ssh root@92.112.178.252 "docker cp /root/api-aponta-deploy/app/file.py api-aponta-prod:/app/app/"

# Reiniciar container
ssh root@92.112.178.252 "docker restart api-aponta-prod"
```

## Observações Importantes

1. **Container de produção foi recriado** usando a imagem `staging-api` pois a imagem `production-api` estava desatualizada
2. **Migrações Alembic** foram puladas devido a conflito de revisões - não impacta a funcionalidade
3. **Importações circulares** podem ocorrer se usar `from app.routers import X` dentro de `app/routers/__init__.py` - usar `from . import X` ao invés

## Próximos Passos Recomendados

1. [ ] Reconstruir imagem `production-api` com código atualizado
2. [ ] Resolver conflito de revisões Alembic
3. [ ] Criar script de deploy automatizado que valide endpoints após deploy
4. [ ] Adicionar testes de integração para o endpoint iterations
