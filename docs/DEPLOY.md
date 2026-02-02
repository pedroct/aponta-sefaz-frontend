# Deploy - Frontend Aponta SEFAZ

> **Fonte unica de verdade para deploy. NAO faca deploy manual.**

## Ambientes

| Ambiente  | Branch    | URL                                 | Container         |
|-----------|-----------|-------------------------------------|-------------------|
| Staging   | `develop` | https://staging-aponta.treit.com.br | fe-aponta-staging |
| Producao  | `main`    | http://aponta.treit.com.br          | fe-aponta-prod    |

## Fluxo

```
feature branch → PR para develop → merge → deploy staging automatico
                 develop → PR para main → merge → deploy producao automatico
```

## Como funciona o deploy

1. Push na branch dispara GitHub Actions
2. Actions builda e publica imagem no GHCR
3. Na VPS: `docker compose` faz pull da imagem e reinicia o container
4. Aguarda container ficar healthy (healthcheck via /health)

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

Arquivos por ambiente:

- `docker-compose.yml` - local (build, healthcheck, restart, rede aponta-shared-network)
- `docker-compose.staging.yml` - staging (imagem GHCR `:staging`, container fe-aponta-staging)
- `docker-compose.prod.yml` - produção (imagem GHCR `:latest`, container fe-aponta-prod)

## Variaveis de Build (VITE_*)

Injetadas via .env no VPS antes do docker build.
Vite embute no bundle JS (nao sao runtime).

| Variavel             | Staging           | Producao          |
|----------------------|-------------------|-------------------|
| `VITE_API_URL`       | `/api/v1`         | `/api/v1`         |
| `VITE_AZURE_ORG`     | `sefaz-ceara-lab` | `sefaz-ceara-lab` |
| `VITE_AZURE_PROJECT` | `DEV`             | `DEV`             |

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
