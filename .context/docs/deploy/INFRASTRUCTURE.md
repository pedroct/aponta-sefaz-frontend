# 🏗️ Infraestrutura de Deploy

## VPS

| Propriedade | Valor |
|-------------|-------|
| **IP** | 92.112.178.252 |
| **OS** | Ubuntu 24.04 LTS |
| **SSH** | OpenSSH 10.0p2 |
| **Docker** | Docker Compose v2+ |

## 🌐 URLs Disponíveis

### Produção

| URL | Descrição |
|-----|-----------|
| https://aponta.treit.com.br | Frontend (Aplicação principal) |
| https://aponta.treit.com.br/api/ | Backend API |
| https://aponta.treit.com.br/docs | Swagger UI (documentação interativa) |
| https://aponta.treit.com.br/redoc | ReDoc (documentação alternativa) |
| https://aponta.treit.com.br/openapi.json | OpenAPI Schema |
| https://aponta.treit.com.br/health | Health Check da API |

### Staging

| URL | Descrição |
|-----|-----------|
| https://staging-aponta.treit.com.br | Frontend (Aplicação staging) |
| https://staging-aponta.treit.com.br/api/ | Backend API staging |
| https://staging-aponta.treit.com.br/docs | Swagger UI |
| https://staging-aponta.treit.com.br/redoc | ReDoc |
| https://staging-aponta.treit.com.br/health | Health Check da API |

### Acesso Direto (VPS)

| URL | Descrição |
|-----|-----------|
| http://92.112.178.252 | nginx reverse proxy |
| http://92.112.178.252:5432 | PostgreSQL (apenas interno) |

## Containers

### Staging
| Container | Imagem | Porta Interna |
|-----------|--------|---------------|
| `fe-aponta-staging` | nginx:alpine | 80 |
| `api-aponta-staging` | python:3.12 | 8000 |

### Production
| Container | Imagem | Porta Interna |
|-----------|--------|---------------|
| `fe-aponta-prod` | nginx:alpine | 80 |
| `api-aponta-prod` | python:3.12 | 8000 |

### Infraestrutura
| Container | Imagem | Porta Externa |
|-----------|--------|---------------|
| `nginx-aponta` | nginx | 80, 443 |
| `postgres-aponta` | postgres | 5432 |

## Arquitetura de Rede

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Cloudflare                            │
                    │              (SSL/CDN/DDoS Protection)                   │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VPS (92.112.178.252)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    nginx-aponta (Reverse Proxy)                          │    │
│  │                         Portas: 80, 443                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│           │                                              │                       │
│           │ aponta.treit.com.br                          │ staging-aponta...     │
│           ▼                                              ▼                       │
│  ┌─────────────────────┐                      ┌─────────────────────┐           │
│  │     PRODUÇÃO        │                      │      STAGING        │           │
│  │  ┌───────────────┐  │                      │  ┌───────────────┐  │           │
│  │  │ fe-aponta-prod│  │                      │  │fe-aponta-stg  │  │           │
│  │  │  nginx:alpine │  │                      │  │ nginx:alpine  │  │           │
│  │  │    :80        │  │                      │  │    :80        │  │           │
│  │  └───────────────┘  │                      │  └───────────────┘  │           │
│  │         │           │                      │         │           │           │
│  │  ┌───────────────┐  │                      │  ┌───────────────┐  │           │
│  │  │api-aponta-prod│  │                      │  │api-aponta-stg │  │           │
│  │  │  python:3.12  │  │                      │  │  python:3.12  │  │           │
│  │  │    :8000      │  │                      │  │    :8000      │  │           │
│  │  └───────────────┘  │                      │  └───────────────┘  │           │
│  └─────────────────────┘                      └─────────────────────┘           │
│                              │                                                   │
│                              ▼                                                   │
│                    ┌─────────────────────┐                                      │
│                    │   postgres-aponta   │                                      │
│                    │       :5432         │                                      │
│                    └─────────────────────┘                                      │
│                                                                                  │
│                    ════════════════════════                                     │
│                     aponta-shared-network                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Rede Docker

```yaml
networks:
  aponta-shared-network:
    external: true
    name: aponta-shared-network
```

> A rede é **externa** e compartilhada entre todos os containers.

## Nginx Reverse Proxy

O container `nginx-aponta` faz o roteamento:

| Domínio | Destino |
|---------|---------|
| aponta.treit.com.br | frontend_prod → fe-aponta-prod:80 |
| aponta.treit.com.br/api/ | api_prod → api-aponta-prod:8000 |
| staging-aponta.treit.com.br | frontend_staging → fe-aponta-staging:80 |
| staging-aponta.treit.com.br/api/ | api_staging → api-aponta-staging:8000 |

## SSL/TLS

- **Provedor**: Cloudflare (Full SSL)
- **Certificados**: Armazenados em `/etc/nginx/ssl/`
- **Protocolos**: TLSv1.2, TLSv1.3

## SSH Keys

### GitHub Actions Deploy Key
- **Tipo**: Ed25519
- **Localização no VPS**: `/root/.ssh/authorized_keys`

### Gerar nova chave (se necessário)
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

## Comandos Úteis

### Ver status dos containers
```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

### Logs de um container
```bash
docker logs fe-aponta-staging -f --tail 100
docker logs api-aponta-staging -f --tail 100
docker logs nginx-aponta -f --tail 100
```

### Health checks
```bash
# Frontend staging
curl -sf https://staging-aponta.treit.com.br/health

# Backend staging
curl -sf https://staging-aponta.treit.com.br/api/health

# Frontend prod
curl -sf https://aponta.treit.com.br/health

# Backend prod  
curl -sf https://aponta.treit.com.br/api/health
```

### Restart de containers
```bash
# Staging
cd /home/ubuntu/aponta-sefaz/staging
docker compose up -d --build --force-recreate --no-deps frontend

# Production
cd /home/ubuntu/aponta-sefaz/production
docker compose up -d --build --force-recreate --no-deps frontend
```

---

**Última atualização**: 21 de janeiro de 2026
