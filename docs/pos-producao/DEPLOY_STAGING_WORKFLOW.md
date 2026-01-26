# Deploy Staging - Workflow e Procedimentos

**Data:** 26 de Janeiro de 2026  
**Versão:** 1.0  
**Ambiente:** Staging (Homologação)  
**Autor:** Deploy automatizado com assistência de IA

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Infraestrutura Staging](#infraestrutura-staging)
3. [Git Workflow](#git-workflow)
4. [Procedimento de Deploy](#procedimento-de-deploy)
5. [Problemas Encontrados e Soluções](#problemas-encontrados-e-soluções)
6. [Comandos Úteis](#comandos-úteis)
7. [Checklist de Deploy](#checklist-de-deploy)

---

## 🎯 Visão Geral

O ambiente de staging serve como ambiente de homologação para validar mudanças antes de ir para produção. Utiliza o mesmo schema de banco de dados `aponta_sefaz_staging`.

### Fluxo de Deploy

```
Local (develop) → GitHub (develop) → VPS Staging → Testes → GitHub (main) → VPS Produção
```

---

## 🏗️ Infraestrutura Staging

### VPS

- **IP:** 92.112.178.252
- **Usuário:** root
- **Diretório Base:** `/home/ubuntu/aponta-sefaz/staging/`

### Containers Docker

| Container | Função | Porta Interna |
|-----------|--------|---------------|
| `api-aponta-staging` | Backend FastAPI | 8000 |
| `fe-aponta-staging` | Frontend Nginx | 80 |

### URLs

- **API Staging:** https://staging-aponta.treit.com.br/api/v1/
- **Frontend Staging:** https://staging-aponta.treit.com.br/
- **Health Check:** https://staging-aponta.treit.com.br/api/v1/health

### Estrutura de Diretórios

```
/home/ubuntu/aponta-sefaz/staging/
├── .env                    # Variáveis de ambiente
├── docker-compose.yml      # Orquestração dos containers
├── backend/                # Repositório backend (Git)
│   ├── app/
│   ├── alembic/
│   └── ...
└── frontend/               # Repositório frontend (Git)
    ├── client/
    └── ...
```

---

## 🔄 Git Workflow

### Branches

| Branch | Ambiente | Descrição |
|--------|----------|-----------|
| `develop` | Staging | Branch de desenvolvimento/homologação |
| `main` | Produção | Branch estável de produção |

### Repositórios GitHub

- **Backend:** `https://github.com/pedroct/aponta-sefaz-backend.git`
- **Frontend:** `https://github.com/pedroct/aponta-sefaz-frontend.git`

### Fluxo de Commits

1. Desenvolver localmente
2. Commitar e push para `develop`
3. Deploy para staging (git pull + rebuild)
4. Testar em staging
5. Merge `develop` → `main`
6. Deploy para produção

---

## 📦 Procedimento de Deploy

### 1. Deploy Backend Staging

```bash
# Conectar na VPS
ssh root@92.112.178.252

# Atualizar código
cd /home/ubuntu/aponta-sefaz/staging/backend
git pull origin develop

# Rebuild e restart container
cd /home/ubuntu/aponta-sefaz/staging
docker compose down
docker compose build api --no-cache
docker compose up -d api

# Verificar logs
docker logs api-aponta-staging --tail 50

# Verificar health
docker ps --filter 'name=staging'
```

### 2. Deploy Frontend Staging

```bash
# Atualizar código
cd /home/ubuntu/aponta-sefaz/staging/frontend
git pull origin develop

# Rebuild e restart container
cd /home/ubuntu/aponta-sefaz/staging
docker compose build frontend --no-cache
docker compose up -d frontend

# Verificar logs
docker logs fe-aponta-staging --tail 30
```

### 3. Executar Migrations

As migrations são executadas automaticamente pelo script `start.sh` do container backend. Se precisar executar manualmente:

```bash
docker exec api-aponta-staging alembic upgrade head
```

---

## ⚠️ Problemas Encontrados e Soluções

### Problema 1: Staging não era repositório Git

**Sintoma:** `fatal: not a git repository`

**Causa:** O diretório staging foi criado via SCP, não via `git clone`.

**Solução:**
```bash
cd /home/ubuntu/aponta-sefaz/staging/backend
git init
git config --global --add safe.directory /home/ubuntu/aponta-sefaz/staging/backend
git remote add origin https://github.com/pedroct/aponta-sefaz-backend.git
git fetch origin develop
git checkout -b develop
git reset --hard origin/develop
```

### Problema 2: Dependência cryptography faltando

**Sintoma:** `ModuleNotFoundError: No module named 'cryptography'`

**Causa:** O módulo `cryptography` é necessário para a criptografia Fernet dos PATs, mas não estava no `requirements.txt`.

**Solução:** Adicionar ao `requirements.txt`:
```
cryptography==42.0.0
```

### Problema 3: Multiple head revisions (Alembic)

**Sintoma:** `Multiple head revisions are present for given argument 'head'`

**Causa:** Três migrations tinham o mesmo `down_revision = 'd4e5f6g7h8i9'`:
- `add_organizacao_col`
- `1ceca310630d`
- `e5f6g7h8i9j0`

**Solução:** Corrigir a cadeia de migrations:
```
d4e5f6g7h8i9 → add_organizacao_col → 1ceca310630d → e5f6g7h8i9j0
```

Commits de correção:
- `36c883f` - fix: corrigir cadeia de migrations alembic
- `15c5b60` - fix: corrigir cadeia completa de migrations alembic

### Problema 4: Container em loop de restart

**Sintoma:** Container `api-aponta-staging` reiniciando constantemente

**Causa:** O script `start.sh` falha nas migrations e não inicia a API.

**Solução:** Corrigir a cadeia de migrations (Problema 3 acima).

---

## 🛠️ Comandos Úteis

### Verificar Status dos Containers

```bash
docker ps --filter 'name=staging' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

### Ver Logs em Tempo Real

```bash
# Backend
docker logs -f api-aponta-staging

# Frontend
docker logs -f fe-aponta-staging
```

### Testar Endpoint de PATs

```bash
docker exec api-aponta-staging curl -s http://localhost:8000/api/v1/organization-pats
# Resposta esperada: {"detail":"Token de autenticação não fornecido"}
```

### Verificar Migrations Aplicadas

```bash
docker exec api-aponta-staging alembic current
docker exec api-aponta-staging alembic history
```

### Reiniciar Todos os Containers Staging

```bash
cd /home/ubuntu/aponta-sefaz/staging
docker compose down
docker compose up -d
```

### Forçar Rebuild Completo

```bash
cd /home/ubuntu/aponta-sefaz/staging
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## ✅ Checklist de Deploy

### Pré-Deploy

- [ ] Código testado localmente
- [ ] Commits feitos no branch `develop`
- [ ] Push para GitHub `develop`
- [ ] Verificar se há migrations novas

### Deploy Backend

- [ ] `git pull origin develop` no backend staging
- [ ] Verificar se `requirements.txt` tem todas as dependências
- [ ] `docker compose build api`
- [ ] `docker compose up -d api`
- [ ] Verificar logs: migrations executadas?
- [ ] Container healthy?

### Deploy Frontend

- [ ] `git pull origin develop` no frontend staging
- [ ] `docker compose build frontend`
- [ ] `docker compose up -d frontend`
- [ ] Container healthy?

### Validação

- [ ] API `/health` respondendo
- [ ] Frontend carregando
- [ ] Funcionalidade nova testada
- [ ] Sem erros nos logs

---

## 📝 Histórico de Deploys

### 26/01/2026 - Sistema PAT por Organização

**Commits:**
- `de6a5a7` - feat: sistema de PATs por organização Azure DevOps
- `8436fe1` - fix: adicionar cryptography ao requirements.txt
- `36c883f` - fix: corrigir cadeia de migrations alembic
- `15c5b60` - fix: corrigir cadeia completa de migrations alembic
- `eac4748` - feat: interface de gerenciamento de PATs por organização (frontend)

**Arquivos Alterados (Backend):**
- `app/models/organization_pat.py` - Novo modelo
- `app/schemas/organization_pat.py` - Novos schemas
- `app/repositories/organization_pat.py` - Novo repositório
- `app/services/organization_pat_service.py` - Novo serviço
- `app/routers/organization_pats.py` - Novos endpoints
- `app/main.py` - Registro do router
- `app/config.py` - Nova configuração `pat_encryption_key`
- `app/services/timesheet_service.py` - Integração com PAT por org
- `requirements.txt` - cryptography==42.0.0
- `alembic/versions/e5f6g7h8i9j0_create_organization_pats_table.py` - Migration

**Arquivos Alterados (Frontend):**
- `client/src/hooks/use-organization-pats.ts` - Hooks React Query
- `client/src/pages/ConfiguracaoPats.tsx` - Página de configuração
- `client/src/App.tsx` - Nova rota `/configuracao/pats`

**Resultado:** ✅ Deploy bem-sucedido

---

## 🔗 Referências

- [SISTEMA_PAT_POR_ORGANIZACAO.md](./SISTEMA_PAT_POR_ORGANIZACAO.md) - Documentação da implementação
- [DEPLOY_PRODUCAO_V1.0.md](./DEPLOY_PRODUCAO_V1.0.md) - Deploy de produção
- [DIVERGENCIAS_GIT_AMBIENTES.md](./DIVERGENCIAS_GIT_AMBIENTES.md) - Diferenças entre ambientes
