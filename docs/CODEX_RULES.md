# CODEX_RULES.md - Frontend Aponta

> Regras operacionais para o Codex neste repositório (frontend). Consolidado com os padrões atuais de deploy e infraestrutura.

---

## Repositórios Oficiais (únicos)

- Frontend: https://github.com/pedroct/aponta-sefaz-frontend
- Backend: https://github.com/pedroct/aponta-sefaz-backend

---

## Ambientes e Domínios

- **Produção:** http://aponta.treit.com.br (redirect 301 para https)
- **Staging:** https://staging-aponta.treit.com.br

---

## Infraestrutura VPS (Hostinger)

- Base: `/home/ubuntu/aponta-sefaz/`
- Staging frontend: `/home/ubuntu/aponta-sefaz/staging/frontend/`
- Produção frontend: `/home/ubuntu/aponta-sefaz/production/frontend/`
- Shared (Nginx + Postgres): `/home/ubuntu/aponta-sefaz/shared/`
- **Docker network padrão:** `aponta-shared-network` (externa)

---

## Docker Compose (Frontend)

- **Local:** `docker-compose.yml` (name: `aponta-local-frontend`)
- **Staging:** `docker-compose.staging.yml` (GHCR)
- **Produção:** `docker-compose.prod.yml` (GHCR)
- **Regra:** staging/produção **não expõem portas no host** (somente via rede interna)
- **Healthcheck:** `/health` deve responder `text/plain` com `OK`

---

## CI/CD e Deploy (Obrigatório)

1) **Fluxo:** Build (GitHub) → Push (GHCR) → SSH (VPS) → `docker compose pull/up`
2) **Ordem:** sempre deploy em **staging** primeiro; produção só após PR aprovado e merge na `main`
3) **Sem deploy manual:** não executar build local na VPS, rsync, ou `docker build` manual
4) **Testes obrigatórios:** Vitest + Playwright rodam antes do build/push no workflow

---

## Variáveis de Ambiente

- Local (padrão): `VITE_API_URL=http://localhost:8000/api/v1`
- Pipeline (staging/prod): `VITE_API_URL=/api/v1` (usa domínio do ambiente)

---

## Restrições Críticas

- **Nunca** fazer deploy fora do GitHub Actions
- **Não** expor portas do frontend em staging/produção (tudo via rede interna)

---

## Como validar alterações

- Preferir validação via GitHub Actions
- Conferir logs do job antes de prosseguir para produção

---

## Stack (referência rápida)

- Vite + React + TypeScript
- Vitest
- Playwright (E2E)
- Tailwind CSS
- Nginx (container)
