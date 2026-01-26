# Divergências Git e Ambientes - Pós-Produção

**Data:** 26 de Janeiro de 2026  
**Última Atualização:** 26 de Janeiro de 2026, 07:50 UTC  
**Status:** ✅ RESOLVIDO  
**Prioridade:** ~~Alta~~ Concluído

---

## 📋 Sumário

1. [Problema Identificado](#problema-identificado)
2. [Repositórios GitHub](#repositórios-github)
3. [Análise por Ambiente](#análise-por-ambiente)
4. [Divergências Detalhadas](#divergências-detalhadas)
5. [Ações Realizadas](#ações-realizadas)
6. [Estado Final](#estado-final)

---

## 🚨 Problema Identificado (HISTÓRICO)

Durante o deploy de produção, várias alterações foram feitas **diretamente na VPS via SCP/SSH** sem passar pelo fluxo Git adequado. Isso resultou em:

- ~~**Código em produção diferente** do que está nos repositórios GitHub~~ ✅ Sincronizado
- ~~**Staging desatualizado** em relação à produção~~ ✅ Atualizado
- ~~**Repositórios locais** com alterações não commitadas~~ ✅ Commitado
- ~~**Risco de perda** de código em caso de redeploy a partir do GitHub~~ ✅ Resolvido

---

## 📦 Repositórios GitHub

| Repositório | URL | Branch Default | Status |
|-------------|-----|----------------|--------|
| Backend | https://github.com/pedroct/aponta-sefaz-backend | `main` | ✅ Sincronizado |
| Frontend | https://github.com/pedroct/aponta-sefaz-frontend | `main` | ✅ Sincronizado |

### Commits Realizados

**Backend (26/01/2026):**
- `feat: suporte multi-organização Azure DevOps`
- Merge `develop` → `main`: `240f924..2140e7a`

**Frontend (26/01/2026):**
- `fix: usar getAppToken() e adicionar docs pos-producao`
- Merge `develop` → `main`: `7230247..5e314a7`
- +41.605 linhas / -7.094 linhas (328 arquivos)

---

## 🔍 Análise por Ambiente

### Produção (VPS)

| Componente | Container | Status | Código Fonte |
|------------|-----------|--------|--------------|
| Backend API | `api-aponta-prod` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/production/backend/` |
| Frontend | `fe-aponta-prod` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/production/frontend/` |
| PostgreSQL | `postgres-aponta` | ✅ Healthy | Schema: `aponta_sefaz` |
| Nginx | `nginx-aponta` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/shared/nginx/` |

### Staging (VPS)

| Componente | Container | Status | Código Fonte |
|------------|-----------|--------|--------------|
| Backend API | `api-aponta-staging` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/staging/backend/` |
| Frontend | `fe-aponta-staging` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/staging/frontend/` |
| PostgreSQL | `postgres-aponta` | ✅ Healthy | Schema: `aponta_sefaz_staging` |

---

## ✅ Divergências Resolvidas

### Backend - Código Multi-Organização

| Feature | GitHub | Local | Prod VPS | Staging VPS |
|---------|--------|-------|----------|-------------|
| `azure_devops_org_pats` em config.py | ✅ | ✅ | ✅ | ✅ |
| `get_all_organizations()` em config.py | ✅ | ✅ | ✅ | ✅ |
| Coluna `organizacao` em projeto.py | ✅ | ✅ | ✅ | ✅ |
| Sync multi-org em projeto_service.py | ✅ | ✅ | ✅ | ✅ |
| Migration `add_organizacao_column` | ✅ | ✅ | ✅ | ✅ |
| Fix `search_work_items` com org_name | ✅ | ✅ | ✅ | ✅ |

### Frontend - Extensão Azure DevOps

| Feature | GitHub | Local | Prod VPS |
|---------|--------|-------|----------|
| `getAppToken()` nas páginas | ✅ | ✅ | ✅ |
| vss-extension.json v1.0.1 | ✅ | ✅ | N/A |

### Banco de Dados

| Feature | Produção | Staging |
|---------|----------|---------|
| Coluna `organizacao` | ✅ | ✅ |
| Dados de organizações | ✅ 3 orgs | ✅ (via sync) |

---

## 📝 Ações Realizadas

### Fase 1: Sincronização Git ✅ CONCLUÍDO

1. ✅ **Backend**: `git add -A && git commit && git push origin develop`
2. ✅ **Backend**: `git checkout main && git merge develop && git push origin main`
3. ✅ **Frontend**: `git add -A && git commit && git push origin develop`
4. ✅ **Frontend**: `git checkout main && git merge develop && git push origin main`

### Fase 2: Atualizar Staging ✅ CONCLUÍDO

1. ✅ **Coluna organizacao**: Adicionada via SQL direto no banco staging
   ```sql
   ALTER TABLE aponta_sefaz_staging.projetos ADD COLUMN IF NOT EXISTS organizacao VARCHAR;
   ```

2. ✅ **Código backend**: Copiado via SCP do WSL para VPS
   ```bash
   scp -r app/ root@92.112.178.252:/home/ubuntu/aponta-sefaz/staging/backend/
   ```

3. ✅ **Script de start corrigido**: Alterado para usar `alembic upgrade heads`

4. ✅ **Container reiniciado**: `docker restart api-aponta-staging`

### Fase 3: Validação ✅ CONCLUÍDO

```bash
# Verificação de health
curl -s http://localhost:8001/health
# Resposta: {"status":"healthy","version":"0.1.0","environment":"production"}
```

---

## 🎯 Estado Final

### Todos os ambientes sincronizados:

```
GitHub (main)
    │
    ├── Backend ────► Produção VPS ✅
    │                     │
    │                     └── Staging VPS ✅
    │
    └── Frontend ───► Produção VPS ✅
                          │
                          └── Staging VPS ✅
```

### Próximos Passos Recomendados

1. **Estabelecer CI/CD** para evitar deploys manuais via SCP
2. **Sempre commitar antes** de fazer deploy
3. **Usar tags de versão** para releases importantes

### Fase 3: Estabelecer Processo de Deploy

1. **NUNCA** fazer deploy direto via SCP/SSH sem commitar primeiro

---

## 💻 Comandos para Sincronização

### Backend - Commit e Push

```bash
cd /home/pedroctdev/apps/api-aponta-vps
git add -A
git commit -m "feat: implementar suporte multi-organização Azure DevOps"
git push origin develop
git checkout main && git merge develop && git push origin main