# Correção de CORS para Novas Organizações Azure DevOps

**Data:** 26/01/2026  
**Ambiente:** Produção e Staging  
**Status:** ✅ Resolvido

## Resumo

Adicionadas duas novas origens CORS para permitir que a extensão funcione em organizações Azure DevOps adicionais.

## Organizações Adicionadas

| Organização | URL |
|-------------|-----|
| sefaz-ce-diligencia | `https://dev.azure.com/sefaz-ce-diligencia` |
| sefaz-ce-siscoex2 | `https://dev.azure.com/sefaz-ce-siscoex2` |

## Arquivo Modificado

**Caminho:** `api-aponta-vps/app/config.py`

### Alteração

Adicionadas as URLs na lista `azure_devops_origins`:

```python
azure_devops_origins = [
    "https://dev.azure.com",
    "https://dev.azure.com/sefaz-ce-projetos",
    "https://dev.azure.com/sefaz-ce-diligencia",    # ← NOVO
    "https://dev.azure.com/sefaz-ce-siscoex2",      # ← NOVO
    # ... outras origens
]
```

## Deploy Realizado

```bash
# 1. Atualizar arquivo no servidor
scp app/config.py root@92.112.178.252:/root/api-aponta-deploy/app/

# 2. Copiar para containers
docker cp /root/api-aponta-deploy/app/config.py api-aponta-prod:/app/app/
docker cp /root/api-aponta-deploy/app/config.py api-aponta-staging:/app/app/

# 3. Reiniciar containers
docker restart api-aponta-prod api-aponta-staging
```

## Verificação

Após o deploy, requisições vindas das novas organizações não são mais bloqueadas por CORS.

## Observações

- O CORS é verificado pelo navegador, não pelo servidor
- Cada nova organização Azure DevOps que usar a extensão precisa ser adicionada à lista
- O wildcard `https://dev.azure.com` deveria cobrir todos, mas por segurança mantemos as URLs específicas

## Relacionado

- [DEPLOY_PRODUCAO_V1.0.md](./DEPLOY_PRODUCAO_V1.0.md) - Processo de deploy inicial
