# 🏗️ Infraestrutura de Deploy

## VPS

| Propriedade | Valor |
|-------------|-------|
| **IP** | 92.112.178.252 |
| **OS** | Ubuntu 24.04 LTS |
| **SSH** | OpenSSH 10.0p2 |
| **Docker** | Docker Compose v2+ |

## Containers

### Staging
| Container | Imagem | Porta |
|-----------|--------|-------|
| `fe-aponta-staging` | nginx:alpine | 80 → 3001 |
| `api-aponta-staging` | python:3.12 | 8000 → 8001 |

### Production
| Container | Imagem | Porta |
|-----------|--------|-------|
| `fe-aponta-prod` | nginx:alpine | 80 → 3000 |
| `api-aponta-prod` | python:3.12 | 8000 → 8000 |

## Rede

```yaml
networks:
  aponta-shared-network:
    external: true
    name: aponta-shared-network
```

> A rede é **externa** e compartilhada entre frontend e backend.

## Nginx Configuration

```nginx
upstream api_backend {
    server api:8000;  # Nome do serviço Docker
}

location /api/ {
    proxy_pass http://api_backend/;
}

location /health {
    return 200 'OK';
}
```

## SSH Keys

### GitHub Actions Deploy Key
- **Tipo**: Ed25519
- **Fingerprint**: `SHA256:...`
- **Localização no VPS**: `/root/.ssh/authorized_keys`

### Gerar nova chave (se necessário)
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

## Volumes e Persistência

- Frontend: Stateless (apenas arquivos estáticos)
- Backend: Dados persistidos via Supabase (externo)

## Monitoramento

### Health Checks

**Frontend**:
```bash
curl -sf http://localhost:3001/health
# Retorna: OK
```

**Backend**:
```bash
curl -sf http://localhost:8001/health
# Retorna: {"status": "healthy"}
```

### Logs
```bash
# Frontend staging
docker logs fe-aponta-staging -f --tail 100

# Backend staging  
docker logs api-aponta-staging -f --tail 100
```

## Backup e Recovery

### Rollback rápido
```bash
cd /home/ubuntu/aponta-sefaz/staging
git checkout HEAD~1
docker compose up -d --build --force-recreate --no-deps frontend
```

### Restart completo
```bash
docker compose down
docker compose up -d
```

---

**Última atualização**: 21 de janeiro de 2026
