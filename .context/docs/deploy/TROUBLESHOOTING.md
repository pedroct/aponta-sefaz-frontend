# 🔧 Troubleshooting - Problemas Comuns e Soluções

## Extensão Azure DevOps

### ❌ Erro: `X-Frame-Options: SAMEORIGIN` bloqueando iframe

**Sintoma**: Console mostra "Refused to display in a frame because it set 'X-Frame-Options' to 'sameorigin'"

**Causa**: Cloudflare adiciona automaticamente o header `X-Frame-Options`

**Solução**: Criar regra no Cloudflare Dashboard:
1. Acesse **Rules** → **Transform Rules** → **Modify Response Headers**
2. Clique em **"Remove HTTP header from response"**
3. Configure:
   - **Rule name**: `Remove X-Frame-Options for Azure DevOps`
   - **If incoming requests match**: All incoming requests
   - **Header name**: `X-Frame-Options`
4. Clique em **Deploy**

---

### ❌ Erro: `502 Bad Gateway`

**Sintoma**: Servidor retorna 502, mas containers estão healthy

**Causa**: Após deploy, o container frontend muda de IP interno e o nginx-aponta tem o IP antigo em cache

**Solução**:
```bash
ssh root@92.112.178.252 "docker restart nginx-aponta"
```

---

### ❌ Erro: `404 /dist/timesheet.html`

**Sintoma**: Extensão tenta carregar `/dist/timesheet.html` mas retorna 404

**Causa**: A extensão Azure DevOps espera arquivos em `/dist/*.html`, mas o frontend é uma SPA com apenas `index.html`

**Solução**: Já corrigido no `nginx.conf` com a regra:
```nginx
location ~ ^/dist/.*\.html$ {
    try_files /index.html =404;
    add_header Content-Security-Policy "frame-ancestors 'self' https://dev.azure.com https://*.visualstudio.com https://*.azure.com" always;
}
```

---

### ❌ Erro: Health check falha com wget

**Sintoma**: Container fica em restart loop, logs mostram "wget: can't connect"

**Causa**: nginx:alpine não tem wget instalado, apenas curl

**Solução**: Usar curl no health check do workflow:
```yaml
# Errado
docker exec fe-aponta-staging wget --quiet --tries=1 --spider http://localhost/health

# Correto
docker exec fe-aponta-staging curl -sf http://localhost/health
```

---

### ❌ Erro: nginx "host not found in upstream"

**Sintoma**: Container frontend falha com "host not found in upstream 'host.docker.internal'"

**Causa**: `host.docker.internal` não funciona em Linux. Deve usar nome do serviço Docker

**Solução**: No `nginx.conf`, usar nome do serviço:
```nginx
# Errado
upstream api_backend {
    server host.docker.internal:8000;
}

# Correto
upstream api_backend {
    server api:8000;  # Nome do serviço no docker-compose
}
```

---

## Cloudflare

### Verificar se headers estão corretos

```bash
# Verificar headers via Cloudflare
curl -I -s https://staging-aponta.treit.com.br | grep -i "x-frame\|content-security"

# Verificar headers direto no servidor (sem Cloudflare)
ssh root@92.112.178.252 "curl -I -s http://localhost -H 'Host: staging-aponta.treit.com.br' | grep -i 'x-frame\|content-security'"
```

**Resultado esperado** (após correção):
- Sem `X-Frame-Options`
- Com `Content-Security-Policy: frame-ancestors 'self' https://dev.azure.com https://*.visualstudio.com https://*.azure.com`

---

## Docker

### Ver logs de um container

```bash
docker logs fe-aponta-staging --tail 50 -f
docker logs api-aponta-staging --tail 50 -f
docker logs nginx-aponta --tail 50 -f
```

### Reiniciar container específico

```bash
# Apenas frontend (não afeta backend)
cd /home/ubuntu/aponta-sefaz/staging
docker compose up -d --build --force-recreate --no-deps frontend

# Nginx reverse proxy
docker restart nginx-aponta
```

### Verificar status

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

---

**Última atualização**: 21 de janeiro de 2026
