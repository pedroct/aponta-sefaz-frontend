# Deploy - Frontend Aponta SEFAZ

> **Fonte unica de verdade para deploy. NAO faca deploy manual.**

## Visao Geral

O deploy e 100% automatizado via GitHub Actions.
O desenvolvimento acontece localmente, e o push para a branch correta dispara o workflow correspondente.

## Ambientes

| Ambiente   | Branch    | URL                                    | Trigger            | Container          |
|------------|-----------|----------------------------------------|--------------------|--------------------|
| Staging    | `develop` | https://staging-aponta.treit.com.br    | Push em `develop`  | fe-aponta-staging  |
| Producao   | `main`    | https://aponta.treit.com.br            | Push em `main` (via PR) | fe-aponta-prod |

## Fluxo de Trabalho

### Deploy para Staging
1. Desenvolva na sua branch de feature
2. Abra PR para `develop`
3. Apos merge, o deploy e automatico

### Deploy para Producao
1. Teste em staging
2. Abra PR de `develop` para `main`
3. Apos merge, o deploy e automatico

## Arquitetura do Deploy

```
Desenvolvimento Local (C:\Projetos\Azure\fe-aponta)
    |
    ├── push develop ──> GitHub Actions ──> VPS /staging/frontend
    │                     1. Test (type-check + vitest)
    │                     2. Cria .env no VPS
    │                     3. rsync codigo fonte
    │                     4. docker compose build + up
    │                     5. Health check
    |
    └── push main ────> GitHub Actions ──> VPS /production/frontend
                         (mesmo fluxo)
```

### Docker Compose Overrides

O deploy usa compose overrides para cada ambiente:

- **Staging:** `docker-compose.yml` + `docker-compose.staging.yml`
- **Producao:** `docker-compose.yml` + `docker-compose.prod.yml`

Cada override define o `container_name` e a rede externa correta.

## Variaveis de Build (VITE_*)

As variaveis sao injetadas em tempo de build (Vite embute no bundle JS).
O workflow cria o `.env` no VPS antes do docker build.

| Variavel             | Staging            | Producao       |
|----------------------|--------------------|----------------|
| `VITE_API_URL`       | `/api/v1`          | `/api/v1`      |
| `VITE_AZURE_ORG`     | `sefaz-ceara-lab`  | `sefaz-ceara`  |
| `VITE_AZURE_PROJECT` | `DEV`              | (vazio)        |

> **Importante:** Nao e possivel promover a mesma imagem Docker entre ambientes
> porque as variaveis VITE_* sao embutidas no bundle em tempo de build.

## GitHub Secrets Necessarios

Configure em **GitHub > Settings > Secrets and variables > Actions**:

| Secret                | Descricao            |
|-----------------------|----------------------|
| `VPS_HOST`            | IP da VPS            |
| `VPS_USER`            | Usuario SSH          |
| `VPS_SSH_PRIVATE_KEY` | Chave SSH privada    |

### Environments

Criar dois environments no GitHub: `staging` e `production`.
Nenhum secret adicional e necessario por environment (valores de build estao nos workflows).

## Monitoramento

### Verificar se esta online
```bash
curl -sf https://staging-aponta.treit.com.br
curl -sf https://aponta.treit.com.br
```

### Logs do container
```bash
ssh ubuntu@<VPS_HOST> "docker logs fe-aponta-staging --tail 50"
ssh ubuntu@<VPS_HOST> "docker logs fe-aponta-prod --tail 50"
```

## Procedimento de Emergencia

**Apenas se GitHub Actions estiver indisponivel:**

```bash
ssh ubuntu@<VPS_HOST>
cd /home/ubuntu/aponta-sefaz/staging/frontend
git pull origin develop
cd ..
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build frontend
```
