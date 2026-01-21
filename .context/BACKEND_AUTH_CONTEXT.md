# Contexto para Backend: Autenticação OAuth do Azure DevOps Extension

**Data:** 2026-01-21  
**Status:** ✅ **RESOLVIDO** - Autenticação funcionando com getAppToken()

---

## 📊 Status Atual

| Componente | Status | Observação |
|------------|--------|------------|
| Frontend - getAppToken() | ✅ OK | JWT de 421 chars |
| Frontend - Passa token | ✅ OK | Via URL params para iframe |
| Backend - Valida JWT | ✅ OK | Usa AZURE_EXTENSION_SECRET |
| Backend - Chamadas Azure API | ✅ OK | Usa AZURE_DEVOPS_PAT |

> **IMPORTANTE:** Usamos `getAppToken()`, **NÃO** `getAccessToken()`.
> Ver documento [EXTENSION_AZURE_DEVOPS.md](./EXTENSION_AZURE_DEVOPS.md) para detalhes completos.

---

## 1. Situação Atual

A extensão do Azure DevOps está sendo desenvolvida para a organização `sefaz-ceara-lab`. O frontend React roda dentro de um iframe no Azure DevOps e obtém um **token OAuth** via `VSS.getAccessToken()`.

### Fluxo Atual:
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Azure DevOps      │     │   Extension HTML    │     │   Backend API       │
│   (Host)            │     │   (iframe)          │     │   (FastAPI)         │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────┬───────────┘
          │                           │                           │
          │ 1. Carrega extensão       │                           │
          │──────────────────────────▶│                           │
          │                           │                           │
          │ 2. VSS.getAccessToken()   │                           │
          │◀──────────────────────────│                           │
          │                           │                           │
          │ 3. Retorna JWT Token      │                           │
          │──────────────────────────▶│                           │
          │                           │                           │
          │                           │ 4. GET /api/v1/user       │
          │                           │    Authorization: Bearer <TOKEN>
          │                           │──────────────────────────▶│
          │                           │                           │
          │                           │ 5. 401 Unauthorized       │
          │                           │◀──────────────────────────│
```

---

## 2. Como o Frontend Envia o Token

O frontend envia o token no header `Authorization`:

```typescript
// client/src/lib/api.ts
headers.set('Authorization', `Bearer ${token}`);
```

**Exemplo de requisição:**
```http
GET /api/v1/user HTTP/1.1
Host: staging-aponta.treit.com.br
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ii1LSTNR...
Accept: application/json
```

**Características do Token:**
- Tipo: JWT (JSON Web Token)
- Tamanho: ~1084 caracteres
- Origem: `VSS.getAccessToken()` do Azure DevOps Extension SDK
- Scopes declarados na extensão: `vso.profile`, `vso.work_write`, `vso.identity`

---

## 3. Estrutura do Token JWT do Azure DevOps

O token JWT do Azure DevOps contém:

```json
{
  "nameid": "08347002-d37b-6380-a5a7-645420d92a52",
  "scp": "vso.extension.default vso.features_write vso.identity vso.profile vso.work_write",
  "aui": "9b41d8d8-758b-4925-b6a5-3c4c779e4c76",
  "hai": "e5c9f4b0-010e-4b79-b3df-94ec27a5d24d",
  "sid": "e4e7895c-4a68-4d9d-8f02-38823448045",
  "jti": "712032ab-1181-4f90-a3f0-124210a5ad17",
  "iss": "app.vssps.visualstudio.com",
  "aud": "app.vssps.visualstudio.com|vso:43cf6d60-0ae7-416c-aace-69fd07c6d474",
  "nbf": 1768771512,
  "exp": 1768775712
}
```

**Campos importantes:**
| Campo | Descrição |
|-------|-----------|
| `nameid` | ID do usuário na collection (UUID) |
| `scp` | Scopes/permissões concedidos |
| `aui` | Application User ID |
| `iss` | Issuer - sempre `app.vssps.visualstudio.com` |
| `aud` | Audience - inclui ID da organização |
| `exp` | Timestamp de expiração (~1 hora) |

---

## 4. Erro Atual no Backend

A resposta atual do backend é:

```json
{
  "detail": "Token inválido ou expirado. Detalhes: Status 302: <html><head><title>Object moved</title></head><body>\r\n<h2>Object moved to <a href=\"https://spsprodsbr2.vssps.visualstudio.com/_signin..."
}
```

**Diagnóstico:** O backend está tentando validar o token chamando um endpoint do Azure DevOps que retorna **302 redirect** para login, indicando que:
1. O endpoint de validação está incorreto, ou
2. O token não está sendo passado corretamente na validação

---

## 5. Como Validar o Token OAuth do Azure DevOps

### Opção A: Validar com API do Azure DevOps (Recomendado)

Use o endpoint de perfil do usuário:

```python
import httpx

async def validate_azure_token(token: str) -> dict | None:
    """
    Valida o token OAuth do Azure DevOps e retorna informações do usuário.
    Retorna None se o token for inválido.
    """
    # Endpoint correto para validação de token OAuth
    url = "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.0"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=False)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 302:
            # Token inválido - redirect para login
            return None
        else:
            # Outro erro
            return None
```

**Resposta esperada (token válido):**
```json
{
  "displayName": "PEDRO CICERO TEIXEIRA",
  "publicAlias": "08347002-d37b-6380-a5a7-645420d92a52",
  "emailAddress": "pedro.teixeira@sefaz.ce.gov.br",
  "coreRevision": 123456789,
  "timeStamp": "2026-01-21T12:00:00.000Z",
  "id": "08347002-d37b-6380-a5a7-645420d92a52",
  "revision": 123456789
}
```

### Opção B: Decodificar JWT sem validar assinatura (Rápido, menos seguro)

```python
import jwt
import base64
import json

def decode_azure_token(token: str) -> dict | None:
    """
    Decodifica o token JWT do Azure DevOps sem validar assinatura.
    Útil para extrair informações do usuário rapidamente.
    
    ATENÇÃO: Não valida a autenticidade do token!
    Use apenas em conjunto com outras verificações.
    """
    try:
        # Decodifica sem verificar assinatura
        decoded = jwt.decode(token, options={"verify_signature": False})
        return {
            "user_id": decoded.get("nameid"),
            "scopes": decoded.get("scp", "").split(),
            "issuer": decoded.get("iss"),
            "audience": decoded.get("aud"),
            "expires": decoded.get("exp"),
        }
    except jwt.exceptions.DecodeError:
        return None
```

### Opção C: Validar fazendo chamada à API do Azure DevOps (Mais completa)

```python
async def validate_token_with_azure_api(
    token: str, 
    organization: str
) -> dict | None:
    """
    Valida o token tentando acessar a API do Azure DevOps.
    Se conseguir acessar, o token é válido.
    """
    # Tenta listar projetos (requer vso.profile)
    url = f"https://dev.azure.com/{organization}/_apis/projects?api-version=7.0"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=False)
        
        if response.status_code == 200:
            return {"valid": True, "projects": response.json()}
        else:
            return None
```

---

## 6. Implementação Sugerida para FastAPI

### Middleware de Autenticação

```python
# auth.py
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import jwt

security = HTTPBearer()

async def validate_azure_devops_token(token: str) -> dict:
    """Valida token OAuth do Azure DevOps."""
    
    # 1. Primeiro, decodifica para extrair informações básicas
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("nameid")
        scopes = decoded.get("scp", "").split()
        exp = decoded.get("exp")
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=401, detail="Token JWT inválido")
    
    # 2. Verifica se token não expirou
    import time
    if exp and exp < time.time():
        raise HTTPException(status_code=401, detail="Token expirado")
    
    # 3. Valida com API do Azure DevOps
    url = "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.0"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, follow_redirects=False)
        
        if response.status_code == 302:
            raise HTTPException(status_code=401, detail="Token inválido - redirect para login")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=401, 
                detail=f"Falha na validação do token: {response.status_code}"
            )
        
        profile = response.json()
    
    return {
        "id": profile.get("id") or user_id,
        "displayName": profile.get("displayName"),
        "emailAddress": profile.get("emailAddress"),
        "scopes": scopes,
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependency para obter usuário autenticado."""
    return await validate_azure_devops_token(credentials.credentials)
```

### Uso nos Endpoints

```python
from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter()

@router.get("/api/v1/user")
async def get_user(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "displayName": current_user["displayName"],
        "emailAddress": current_user["emailAddress"],
    }

@router.get("/api/v1/atividades")
async def list_atividades(current_user: dict = Depends(get_current_user)):
    # current_user contém informações do usuário autenticado
    # Implementar lógica...
    pass
```

---

## 7. Diferença: Token OAuth vs PAT

| Aspecto | Token OAuth (Extensão) | PAT (Personal Access Token) |
|---------|------------------------|----------------------------|
| Origem | `VSS.getAccessToken()` | Gerado manualmente pelo usuário |
| Formato | JWT (~1000+ chars) | String opaca (~52 chars) |
| Validade | ~1 hora | Configurável (dias/meses) |
| Escopo | Definido no manifesto da extensão | Definido na criação do PAT |
| Validação | API do Azure DevOps | API do Azure DevOps |
| Header | `Authorization: Bearer <token>` | `Authorization: Basic base64(user:pat)` |

**IMPORTANTE:** O backend deve suportar **ambos os tipos** de token:
- OAuth para a extensão em produção
- PAT para desenvolvimento local

```python
async def validate_token(token: str) -> dict:
    """Valida OAuth ou PAT."""
    
    # Se token é curto (~52 chars), provavelmente é PAT
    if len(token) < 100:
        return await validate_pat(token)
    
    # Se token é longo e começa com eyJ, é JWT (OAuth)
    if token.startswith("eyJ"):
        return await validate_azure_devops_token(token)
    
    raise HTTPException(status_code=401, detail="Formato de token desconhecido")
```

---

## 8. Endpoints para Testar

Após implementar a autenticação, teste com:

```bash
# Token OAuth (da extensão)
curl -X GET "https://staging-aponta.treit.com.br/api/v1/user" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."

# Deve retornar:
{
  "id": "08347002-d37b-6380-a5a7-645420d92a52",
  "displayName": "PEDRO CICERO TEIXEIRA",
  "emailAddress": "pedro.teixeira@sefaz.ce.gov.br"
}
```

---

## 9. Logs do Frontend (para debug)

O frontend agora loga informações úteis no console:

```
[Aponta Extension] Token obtido, tamanho: 1084
[Aponta Extension] WebContext: {"account":"sefaz-ceara-lab","project":"DEV","user":"08347002-d37b-6380-a5a7-645420d92a52"}
[detectAzureDevOpsEnvironment] {isEmbedded: true, source: 'azdo-extension', hasToken: true, hasOrg: true, isAzure: true}
[useAzureDevOps] Inicializado via URL params {hasToken: true, tokenLength: 1084, organization: 'sefaz-ceara-lab', project: 'DEV'}
```

---

## 10. Checklist para o Backend

- [ ] Aceitar header `Authorization: Bearer <token>`
- [ ] Detectar tipo de token (OAuth JWT vs PAT)
- [ ] Para OAuth: validar com `https://app.vssps.visualstudio.com/_apis/profile/profiles/me`
- [ ] Usar `follow_redirects=False` para detectar tokens inválidos (302)
- [ ] Extrair `user_id` do campo `nameid` do JWT
- [ ] Retornar erro 401 com mensagem clara se token inválido
- [ ] Logar tentativas de autenticação para debug

---

## 11. Variáveis de Ambiente Sugeridas

```env
# Habilitar/desabilitar autenticação (para dev)
AUTH_ENABLED=true

# Organização Azure DevOps permitida
AZURE_DEVOPS_ORG=sefaz-ceara-lab

# Timeout para validação de token (segundos)
TOKEN_VALIDATION_TIMEOUT=10
```

---

## 12. Referências

- [Azure DevOps Extension SDK](https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth)
- [VSS.getAccessToken()](https://learn.microsoft.com/en-us/azure/devops/extend/reference/client/vss-sdk)
- [Azure DevOps REST API - Profile](https://learn.microsoft.com/en-us/rest/api/azure/devops/profile/profiles/get)
