# Contexto de Debug - Autenticação OAuth Azure DevOps

**Data:** 21/01/2026  
**Ambiente:** Staging (`https://staging-aponta.treit.com.br`)  
**Status:** 401 Unauthorized - **PROBLEMA CONFIRMADO NO BACKEND**

---

## 🔴 CONFIRMAÇÃO: O PROBLEMA É NO BACKEND

### Evidência dos Logs do Frontend (21/01/2026 - Última versão)

```
[Aponta Extension] Token obtido, tamanho: 1102                    ← ✅ Token obtido do Azure DevOps
[useAzureDevOps] Inicializado via URL params {tokenLength: 1102}  ← ✅ Token passado para React
[useCurrentUser] Executando queryFn, token disponível: true       ← ✅ Query executando
[AzureDevOpsContext] getToken chamado: (1102 chars)               ← ✅ Token PRESENTE na requisição!
GET /api/v1/user 401 (Unauthorized)                               ← ❌ Backend rejeita
```

**O frontend está enviando o token de 1102 caracteres corretamente.**
**O backend está retornando 401.**

---

## 1. Resumo do Problema

O frontend está enviando corretamente o token OAuth obtido via `VSS.getAccessToken()` do Azure DevOps SDK, mas o backend está retornando **401 Unauthorized** em todas as requisições.

---

## 2. Fluxo de Autenticação (Frontend)

```
┌─────────────────────────────────────────────────────────────────┐
│ Azure DevOps Extension (timesheet.html)                         │
│                                                                 │
│  1. VSS.init() → Inicializa SDK                                │
│  2. VSS.getAccessToken() → Obtém token OAuth                   │
│  3. Token passado via URL param para iframe React              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ React App (iframe)                                              │
│                                                                 │
│  4. useAzureDevOps hook lê token da URL                        │
│  5. ApiClient envia: Authorization: Bearer <token>             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend API                                                     │
│                                                                 │
│  6. Recebe header Authorization: Bearer <token>                │
│  7. Valida token → RETORNA 401 ❌                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Evidências dos Logs do Frontend

### Token Obtido com Sucesso
```
[Aponta Extension] Token obtido, tamanho: 1102
[Aponta Extension] WebContext: {
  "account": "sefaz-ceara-lab",
  "project": "DEV", 
  "user": "08347002-d37b-6380-a5a7-645420d92a52"
}
```

### Ambiente Detectado Corretamente
```
[detectAzureDevOpsEnvironment] {
  isEmbedded: true, 
  source: 'azdo-extension', 
  isAzureSource: true, 
  hasToken: true, 
  hasOrg: true
}

[useAzureDevOps] Inicializado via URL params {
  hasToken: true, 
  tokenLength: 1102, 
  organization: 'sefaz-ceara-lab', 
  project: 'DEV', 
  userId: '08347002-d37b-6380-a5a7-645420d92a52'
}
```

### Requisições Falhando
```
GET https://staging-aponta.treit.com.br/api/v1/user 401 (Unauthorized)
GET https://staging-aponta.treit.com.br/api/v1/atividades?ativo=true 401 (Unauthorized)
GET https://staging-aponta.treit.com.br/api/v1/timesheet?organization_name=sefaz-ceara-lab&project_id=DEV&week_start=2026-01-19&only_my_items=false 401 (Unauthorized)
```

---

## 4. Formato do Token

O token obtido via `VSS.getAccessToken()` é um **Azure DevOps OAuth Access Token**, NÃO é um JWT padrão.

### Características:
- **Tamanho:** ~1100 caracteres
- **Formato:** String opaca (não é JWT decodificável)
- **Tipo:** Bearer token
- **Origem:** Azure DevOps OAuth 2.0

### Como o Frontend Envia:
```http
GET /api/v1/user HTTP/1.1
Host: staging-aponta.treit.com.br
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...
```

---

## 5. Validação do Token (Backend)

### ❌ Método INCORRETO (NÃO funciona para tokens de extensão)
Validar como JWT padrão ou contra Azure AD/Entra ID.

### ✅ Método CORRETO
O token deve ser validado fazendo uma chamada à API do Azure DevOps:

```python
# Python - Exemplo de validação
import requests

def validate_azure_devops_token(token: str) -> dict | None:
    """
    Valida token OAuth do Azure DevOps chamando a API de perfil.
    Se o token for válido, retorna os dados do usuário.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Endpoint para validar o token e obter informações do usuário
    url = "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()  # Token válido, retorna dados do usuário
    else:
        return None  # Token inválido
```

```csharp
// C# - Exemplo de validação
public async Task<UserProfile?> ValidateAzureDevOpsToken(string token)
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", token);
    
    var response = await client.GetAsync(
        "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1"
    );
    
    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<UserProfile>(json);
    }
    
    return null;
}
```

### Resposta Esperada (token válido):
```json
{
  "displayName": "Pedro Teixeira",
  "publicAlias": "08347002-d37b-6380-a5a7-645420d92a52",
  "emailAddress": "pedro.teixeira@sefaz.ce.gov.br",
  "coreRevision": 123456789,
  "timeStamp": "2026-01-21T12:00:00.000Z",
  "id": "08347002-d37b-6380-a5a7-645420d92a52",
  "revision": 123456789
}
```

---

## 6. Scopes do Token

A extensão está configurada com os seguintes scopes no manifesto:

```json
{
  "scopes": [
    "vso.profile",      // Leitura de perfil do usuário
    "vso.work_write",   // Leitura e escrita de work items
    "vso.identity"      // Acesso a identidades
  ]
}
```

O token obtido via `VSS.getAccessToken()` terá permissões baseadas nesses scopes.

---

## 7. Checklist de Debug para Backend

### 7.1. Verificar se o token está chegando
```python
@app.before_request
def log_auth_header():
    auth_header = request.headers.get('Authorization')
    print(f"Authorization header: {auth_header[:50]}..." if auth_header else "No auth header")
```

### 7.2. Verificar formato do token
```python
def extract_token(auth_header: str) -> str | None:
    if not auth_header:
        return None
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]  # Remove "Bearer "
```

### 7.3. Validar contra Azure DevOps API
```python
async def validate_token(token: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code == 200
```

### 7.4. Logar resposta da validação
```python
if response.status_code != 200:
    print(f"Token validation failed: {response.status_code}")
    print(f"Response: {response.text}")
```

---

## 8. Possíveis Causas do 401

| Causa | Como Verificar | Solução |
|-------|----------------|---------|
| Token não está chegando | Logar `Authorization` header | Verificar CORS/proxy |
| Token mal formatado | Verificar se começa com "Bearer " | Ajustar parsing |
| Validação incorreta | Backend tentando validar como JWT | Usar API do Azure DevOps |
| URL de validação errada | Verificar endpoint usado | Usar `app.vssps.visualstudio.com` |
| Token expirado | Verificar tempo de vida | Frontend deveria renovar, mas não consegue em iframe |
| CORS bloqueando | Verificar preflight OPTIONS | Configurar CORS no backend |

---

## 9. Teste Manual do Token

Para testar se o token é válido, execute este curl:

```bash
# Substitua <TOKEN> pelo token capturado dos logs
curl -H "Authorization: Bearer <TOKEN>" \
     "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1"
```

Se retornar 200 com dados do usuário, o token é válido e o problema está na lógica de validação do backend.

---

## 10. Informações Adicionais

### Organização Azure DevOps
- **Nome:** sefaz-ceara-lab
- **URL:** https://dev.azure.com/sefaz-ceara-lab

### Projeto
- **ID:** DEV

### Usuário de Teste
- **ID:** 08347002-d37b-6380-a5a7-645420d92a52

### URLs da API
- **Staging:** https://staging-aponta.treit.com.br/api/v1/
- **Endpoints testados:**
  - GET /user
  - GET /atividades
  - GET /timesheet

---

## 11. Ação Requerida do Backend

1. **Logar** o header `Authorization` recebido para confirmar que o token chega
2. **Implementar/corrigir** a validação do token usando a API do Azure DevOps (`app.vssps.visualstudio.com`)
3. **Retornar** os dados do usuário obtidos da validação para uso na aplicação
4. **Logar** erros de validação com detalhes para debug

---

## 12. Referências

- [Azure DevOps REST API - Profiles](https://learn.microsoft.com/en-us/rest/api/azure/devops/profile/profiles/get?view=azure-devops-rest-7.1)
- [Azure DevOps Extension SDK - getAccessToken](https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth?view=azure-devops)
- [OAuth 2.0 in Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/oauth?view=azure-devops)
