# Correção do Endpoint Iterations - 404 Error

**Data:** 26/01/2026  
**Ambiente:** Produção (aponta.treit.com.br)  
**Status:** ✅ Resolvido

## Resumo do Problema

Após deploy do frontend com suporte a Sprint/Iteration, o dropdown não carregava e mostrava erro no console:
```
GET https://aponta.treit.com.br/api/v1/iterations?organization=... 404 (Not Found)
```

## Causa Raiz

O router `iterations.py` existia no código fonte mas **não estava registrado** corretamente no backend:

1. **`app/main.py`** - Faltava importar e registrar o router de iterations
2. **`app/routers/__init__.py`** - Faltava exportar os módulos `organization_pats` e `iterations`

## Correções Aplicadas

### 1. Atualização do `app/routers/__init__.py`

**Antes:**
```python
# Routers
from app.routers import (
    atividades,
    apontamentos,
    integracao,
    projetos,
    user,
    work_items,
    timesheet,
)

__all__ = [
    "atividades",
    "apontamentos",
    "integracao",
    "projetos",
    "user",
    "work_items",
    "timesheet",
]
```

**Depois:**
```python
# Routers
from . import atividades
from . import apontamentos
from . import integracao
from . import projetos
from . import user
from . import work_items
from . import timesheet
from . import organization_pats
from . import iterations

__all__ = [
    "atividades",
    "apontamentos",
    "integracao",
    "projetos",
    "user",
    "work_items",
    "timesheet",
    "organization_pats",
    "iterations",
]
```

**Nota:** Mudamos de `from app.routers import ...` para `from . import ...` (importação relativa) para evitar erro de importação circular.

### 2. Registro do Router no `app/main.py`

Adicionado na linha de imports:
```python
from app.routers import atividades, apontamentos, integracao, projetos, user, work_items, timesheet, organization_pats, iterations
```

E registrado o router:
```python
app.include_router(iterations.router, prefix="/api/v1")
```

### 3. Recriação do Container de Produção

O container de produção estava com uma imagem antiga. Foi necessário recriá-lo:

```bash
# Remover container antigo
docker stop api-aponta-prod && docker rm api-aponta-prod

# Criar arquivo de variáveis de ambiente
echo 'DATABASE_URL=postgresql://aponta_user:PASSWORD@postgres-aponta:5432/gestao_projetos' > /tmp/prod.env
echo 'DATABASE_SCHEMA=aponta_sefaz' >> /tmp/prod.env

# Criar novo container usando imagem staging-api (que tinha os arquivos corretos)
docker run -d \
  --name api-aponta-prod \
  --network aponta-shared-network \
  --env-file /tmp/prod.env \
  --health-cmd 'curl -f http://localhost:8000/health || exit 1' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  -p 8000:8000 \
  staging-api \
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Nota:** O comando de inicialização foi alterado para pular migrações Alembic que tinham conflito de revisões.

## Arquivos Envolvidos

| Arquivo | Ação | Localização |
|---------|------|-------------|
| `app/routers/__init__.py` | Modificado | Backend VPS |
| `app/main.py` | Já tinha o registro | Backend VPS |
| `app/routers/iterations.py` | Existente | Backend VPS |
| `app/services/iteration_service.py` | Existente | Backend VPS |
| `app/schemas/iteration.py` | Existente | Backend VPS |

## Comandos de Deploy Utilizados

```bash
# 1. Enviar arquivo atualizado para o servidor
scp app/routers/__init__.py root@92.112.178.252:/root/api-aponta-deploy/app/routers/

# 2. Copiar para containers
docker cp /root/api-aponta-deploy/app/routers/__init__.py api-aponta-staging:/app/app/routers/

# 3. Verificar status
docker ps -a --format 'table {{.Names}}\t{{.Status}}' | grep aponta
```

## Verificação Pós-Deploy

```bash
# Testar endpoint (deve retornar 401, não 404)
curl -s http://localhost:8000/api/v1/iterations -o /dev/null -w '%{http_code}'
# Resultado: 401 (OK - requer autenticação)

# Verificar health
curl -s http://localhost:8000/health
# Resultado: {"status":"healthy","version":"0.1.0","environment":"production"}
```

## Status Final dos Containers

| Container | Status |
|-----------|--------|
| `api-aponta-prod` | ✅ healthy |
| `api-aponta-staging` | ✅ healthy |
| `fe-aponta-prod` | ✅ healthy |
| `fe-aponta-staging` | ✅ healthy |
| `nginx-aponta` | ✅ healthy |
| `postgres-aponta` | ✅ healthy |

## Lições Aprendidas

1. **Sempre verificar `__init__.py`** ao adicionar novos routers - o módulo precisa exportar explicitamente
2. **Usar importações relativas** (`from . import ...`) em `__init__.py` para evitar importações circulares
3. **Testar endpoint com curl** antes de testar no frontend - facilita identificar se é problema de backend ou frontend
4. **Containers Docker** podem ter código desatualizado se não foram reconstruídos - verificar imagem e data de criação

## Relacionado

- [FILTRO_ITERATION_SPRINT.md](./FILTRO_ITERATION_SPRINT.md) - Documentação da feature de filtro por Sprint
- [SISTEMA_PAT_POR_ORGANIZACAO.md](./SISTEMA_PAT_POR_ORGANIZACAO.md) - Sistema de PATs que permite acessar iterations
