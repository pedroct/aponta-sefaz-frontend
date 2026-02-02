# Contexto para Reestruturacao de Deploy - Frontend Aponta

> **Documento de contexto para LLM**
> Use este documento para aplicar as mesmas boas praticas de deploy no repositorio do frontend.

---

## Problema Original (Backend)

A documentacao de deploy estava desatualizada e misturava **5 metodos diferentes**:
- SCP manual + docker cp
- git pull no VPS
- Clone manual
- docker run com variaveis inline
- GitHub Actions (metodo correto atual)

**Consequencias:**
- LLMs seguiam documentacao desatualizada e faziam deploy manual
- Producao ficava a frente de staging
- Secrets hardcoded em arquivos `.env` no repositorio

---

## Solucao Implementada (Backend)

### Arquitetura de Deploy

```
GitHub Repository
    │
    ├─── develop branch ──> Deploy Staging (automatico)
    │
    └─── main branch ──> Deploy Production (automatico via PR)
```

### Principios Aplicados

1. **Deploy 100% via GitHub Actions** - Nenhum deploy manual
2. **Secrets via GitHub Secrets** - Nao versionar `.env` com credenciais
3. **Geracao dinamica de .env** - Workflow gera `.env` no VPS a partir dos secrets
4. **Documentacao unica** - Um unico `docs/DEPLOY.md` como fonte de verdade
5. **Rollback via workflow** - Workflow manual para rollback com image tags

---

## Estrutura do Frontend

### Repositorio
- **GitHub:** https://github.com/pedroct/aponta-sefaz-frontend
- **Local:** C:\Projetos\Azure\fe-aponta
- **Stack:** React + Vite + TypeScript

### VPS (92.112.178.252)
- **Staging:** /home/ubuntu/aponta-sefaz/staging/frontend
- **Producao:** /home/ubuntu/aponta-sefaz/production/frontend

### Containers Docker
- **Staging:** `fe-aponta-staging`
- **Producao:** `fe-aponta-prod`

### URLs
- **Staging:** https://staging-aponta.treit.com.br
- **Producao:** http://aponta.treit.com.br

---

## Estrutura Atual (Frontend)

### Workflow unico (GHCR)

- **Arquivo:** `.github/workflows/deploy-frontend.yml`
- **Branches:** `develop` → staging, `main` → produção
- **Fluxo:** build e push de imagem no GHCR → `docker compose pull/up` na VPS
- **Build args:** `VITE_API_URL=/api/v1`, `VITE_AZURE_ORG=sefaz-ceara-lab`, `VITE_AZURE_PROJECT=DEV`

### Docker Compose (base + overrides)

- `docker-compose.yml` (local): build local + rede `aponta-shared-network`
- `docker-compose.staging.yml`: imagem GHCR `:staging`, container `fe-aponta-staging`
- `docker-compose.prod.yml`: imagem GHCR `:latest`, container `fe-aponta-prod`

### Comandos usados no deploy (VPS)

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml pull
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --remove-orphans

docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

