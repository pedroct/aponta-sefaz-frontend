# Divergências Git e Ambientes - Pós-Produção

**Data:** 26 de Janeiro de 2026  
**Status:** 🔴 AÇÃO NECESSÁRIA  
**Prioridade:** Alta

---

## 📋 Sumário

1. [Problema Identificado](#problema-identificado)
2. [Repositórios GitHub](#repositórios-github)
3. [Análise por Ambiente](#análise-por-ambiente)
4. [Divergências Detalhadas](#divergências-detalhadas)
5. [Plano de Ação](#plano-de-ação)
6. [Comandos para Sincronização](#comandos-para-sincronização)

---

## 🚨 Problema Identificado

Durante o deploy de produção, várias alterações foram feitas **diretamente na VPS via SCP/SSH** sem passar pelo fluxo Git adequado. Isso resultou em:

- **Código em produção diferente** do que está nos repositórios GitHub
- **Staging desatualizado** em relação à produção
- **Repositórios locais** com alterações não commitadas
- **Risco de perda** de código em caso de redeploy a partir do GitHub

---

## 📦 Repositórios GitHub

| Repositório | URL | Branch Default | Branch Atual |
|-------------|-----|----------------|--------------|
| Backend | https://github.com/pedroct/aponta-sefaz-backend | `main` | `develop` |
| Frontend | https://github.com/pedroct/aponta-sefaz-frontend | `main` | `develop` |

---

## 🔍 Análise por Ambiente

### Produção (VPS)

| Componente | Container | Status | Código Fonte |
|------------|-----------|--------|--------------|
| Backend API | `api-aponta-prod` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/production/backend/` |
| Frontend | `fe-aponta-prod` | ⚠️ Unhealthy | `/home/ubuntu/aponta-sefaz/production/frontend/` |
| PostgreSQL | `postgres-aponta` | ✅ Healthy | Schema: `aponta_sefaz` |
| Nginx | `nginx-aponta` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/shared/nginx/` |

### Staging (VPS)

| Componente | Container | Status | Código Fonte |
|------------|-----------|--------|--------------|
| Backend API | `api-aponta-staging` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/staging/backend/` |
| Frontend | `fe-aponta-staging` | ✅ Healthy | `/home/ubuntu/aponta-sefaz/staging/frontend/` |
| PostgreSQL | `postgres-aponta` | ✅ Healthy | Schema: `aponta_sefaz_staging` |

---

## ⚠️ Divergências Detalhadas

### Backend - Código Multi-Organização

| Feature | GitHub | Local | Prod VPS | Staging VPS |
|---------|--------|-------|----------|-------------|
| `azure_devops_org_pats` em config.py | ❌ | ✅ | ✅ | ❌ |
| `get_all_organizations()` em config.py | ❌ | ✅ | ✅ | ❌ |
| Coluna `organizacao` em projeto.py | ❌ | ✅ | ✅ | ❌ |
| Sync multi-org em projeto_service.py | ❌ | ✅ | ✅ | ❌ |
| Migration `add_organizacao_column` | ❌ | ✅ | ✅ | ❌ |

### Frontend - Extensão Azure DevOps

| Feature | GitHub | Local | Prod VPS |
|---------|--------|-------|----------|
| `getAppToken()` nas páginas | ❓ | ✅ | ✅ |
| vss-extension.json v1.0.1 | ❓ | ✅ | N/A |

### Banco de Dados

| Feature | Produção | Staging |
|---------|----------|---------|
| Coluna `organizacao` | ✅ | ❌ |
| Dados de organizações | ✅ 3 orgs | ❌ 0 orgs |

---

## 📝 Plano de Ação

### Fase 1: Sincronizar Repositórios Git (URGENTE)

1. **Commit e push** de todas as alterações do backend
2. **Commit e push** de todas as alterações do frontend
3. **Criar tags** de versão (v1.0.1)

### Fase 2: Atualizar Staging

1. **Atualizar código** do backend staging a partir do GitHub
2. **Executar migration** para adicionar coluna `organizacao`

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