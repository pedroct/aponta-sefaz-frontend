# Deploy - Frontend Aponta SEFAZ

> **Fonte unica de verdade para deploy. NAO faca deploy manual.**

## Ambientes

| Ambiente  | Branch    | URL                                 | Container         |
|-----------|-----------|-------------------------------------|-------------------|
| Staging   | `develop` | https://staging-aponta.treit.com.br | fe-aponta-staging |
| Producao  | `main`    | https://aponta.treit.com.br         | fe-aponta-prod    |

## Fluxo

```
feature branch → PR para develop → merge → deploy staging automatico
                 develop → PR para main → merge → deploy producao automatico
```

## Como funciona o deploy

1. Push na branch dispara GitHub Actions
2. Actions roda testes (type-check + vitest)
3. rsync sincroniza codigo para VPS
4. Na VPS: cria .env, remove container antigo, docker compose build + up
5. Aguarda container ficar healthy (healthcheck via /health)

## Infraestrutura VPS

```
Rede: aponta-shared-network
Path staging:  /home/ubuntu/aponta-sefaz/staging/frontend
Path producao: /home/ubuntu/aponta-sefaz/production/frontend

Containers na rede:
  nginx-aponta (reverse proxy, portas 80/443)
  api-aponta-prod / api-aponta-staging (backend)
  fe-aponta-prod / fe-aponta-staging (frontend)
  postgres-aponta (banco)
```

## Docker Compose

Base + override por ambiente:

- `docker-compose.yml` - config base (build, healthcheck, restart)
- `docker-compose.staging.yml` - container fe-aponta-staging, rede aponta-shared-network
- `docker-compose.prod.yml` - container fe-aponta-prod, rede aponta-shared-network

## Variaveis de Build (VITE_*)

Injetadas via .env no VPS antes do docker build.
Vite embute no bundle JS (nao sao runtime).

| Variavel             | Staging           | Producao      |
|----------------------|-------------------|---------------|
| `VITE_API_URL`       | `/api/v1`         | `/api/v1`     |
| `VITE_AZURE_ORG`     | `sefaz-ceara-lab` | `sefaz-ceara` |
| `VITE_AZURE_PROJECT` | `DEV`             | (vazio)       |

## GitHub Secrets

| Secret                | Descricao         |
|-----------------------|-------------------|
| `VPS_HOST`            | IP da VPS         |
| `VPS_USER`            | Usuario SSH       |
| `VPS_SSH_PRIVATE_KEY` | Chave SSH privada |

## Logs e debug

```bash
# Logs do container
ssh ubuntu@<VPS> "docker logs fe-aponta-staging --tail 50"
ssh ubuntu@<VPS> "docker logs fe-aponta-prod --tail 50"

# Status
ssh ubuntu@<VPS> "docker ps --filter name=fe-aponta"

# Health check manual
ssh ubuntu@<VPS> "docker exec fe-aponta-staging wget -qO- http://localhost/health"
```
