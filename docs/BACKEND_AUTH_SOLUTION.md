# 🔴 SOLUÇÃO: Autenticação Correta para Extensão Azure DevOps

**Data:** 21/01/2026  
**Status:** ✅ FRONTEND FUNCIONANDO - ⏳ AGUARDANDO IMPLEMENTAÇÃO NO BACKEND

---

## 📊 Status Atual

| Componente | Status | Observação |
|------------|--------|------------|
| Frontend - getAppToken() | ✅ OK | Token JWT de 421 chars obtido |
| Frontend - Passa token para iframe | ✅ OK | Via URL params |
| Frontend - Envia token nas requisições | ✅ OK | Header Authorization |
| Backend - Valida token | ❌ PENDENTE | Retornando 401 |

---

## 1. O Problema

Estamos usando `getAccessToken()` e tentando validá-lo no backend contra a API do Azure DevOps. **ISSO NÃO FUNCIONA.**

O token de `getAccessToken()` é para uso **direto** com APIs do Azure DevOps (work items, profiles, etc), NÃO para validação por backends terceiros.

---

## 2. A Solução Correta

Segundo a [documentação oficial](https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth):

### Para autenticar com SEU PRÓPRIO BACKEND, use `getAppToken()`:

```javascript
import * as SDK from "azure-devops-extension-sdk";
import { getAppToken } from "azure-devops-extension-sdk";

SDK.init();

getAppToken().then((token) => {
    // Este token pode ser validado pelo seu backend usando o secret da extensão
    console.log(token);
});
```

### Diferença entre os tokens:

| Método | Uso | Validação |
|--------|-----|-----------|
| `getAccessToken()` | Chamar APIs do Azure DevOps diretamente | Não precisa validar, Azure DevOps valida |
| `getAppToken()` | Autenticar com seu próprio backend | Backend valida usando o **secret da extensão** |

---

## 3. Como Implementar

### 3.1. Frontend (timesheet.html)

Usar `getAppToken()` ao invés de `getAccessToken()`:

```javascript
VSS.ready(function() {
    // Para seu próprio backend, use getAppToken()
    VSS.getAppToken().then(function(appToken) {
        // appToken é um JWT assinado com o secret da extensão
        console.log('[Aponta Extension] App Token obtido:', appToken);
        
        var params = new URLSearchParams({
            // ... outros params ...
            token: appToken  // Usar appToken ao invés de accessToken
        });
        
        iframe.src = baseUrl + '?' + params.toString();
    });
});
```

### 3.2. Backend - Obter o Secret da Extensão

1. Acesse o [portal de gerenciamento de extensões](https://aka.ms/vsmarketplace-manage)
2. Clique com botão direito na extensão publicada
3. Selecione "Certificate"
4. Baixe/copie o **secret** da extensão

### 3.3. Backend - Validar o Token

O token de `getAppToken()` é um JWT padrão assinado com o secret (HS256):

```python
# Python com PyJWT
import jwt
from datetime import datetime, timezone

# Secret obtido do portal do Marketplace (ver seção 3.2)
EXTENSION_SECRET = "ey9asfasdmax...9faf7eh"

def validate_app_token(token: str) -> dict | None:
    """
    Valida um App Token do Azure DevOps Extension SDK.
    
    Claims esperados:
    - nameid: ID do usuário Azure DevOps
    - tid: Tenant ID
    - iss: app.vstoken.visualstudio.com
    - aud: ID da extensão (560de67c-a2e8-408a-86ae-be7ea6bd0b7a)
    - exp: Timestamp de expiração
    """
    try:
        payload = jwt.decode(
            token,
            EXTENSION_SECRET,
            algorithms=["HS256"],
            audience="560de67c-a2e8-408a-86ae-be7ea6bd0b7a",  # App ID da extensão
            options={
                "require": ["exp", "nameid", "iss", "aud"],
                "verify_exp": True,
            }
        )
        
        # Validar issuer
        if payload.get("iss") != "app.vstoken.visualstudio.com":
            print(f"Issuer inválido: {payload.get('iss')}")
            return None
            
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expirado")
        return None
    except jwt.InvalidAudienceError:
        print("Audience inválido")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Token inválido: {e}")
        return None


# Exemplo de uso no endpoint
def get_user_id_from_token(token: str) -> str | None:
    payload = validate_app_token(token)
    if payload:
        return payload.get("nameid")  # ID do usuário Azure DevOps
    return None
```

```csharp
// C# com System.IdentityModel.Tokens.Jwt
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

var validationParameters = new TokenValidationParameters()
{
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(EXTENSION_SECRET)),
    ValidIssuer = "app.vstoken.visualstudio.com",
    ValidAudience = "560de67c-a2e8-408a-86ae-be7ea6bd0b7a",
    ValidateIssuer = true,
    ValidateAudience = true,
    RequireSignedTokens = true,
    RequireExpirationTime = true,
    ValidateLifetime = true
};

var tokenHandler = new JwtSecurityTokenHandler();
var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
var userId = principal.FindFirst("nameid")?.Value;
```

---

## 4. Claims do App Token (CONFIRMADO EM PRODUÇÃO)

O JWT de `getAppToken()` contém (formato real testado em 21/01/2026):

```json
{
  "nameid": "08347002-d37b-6380-a5a7-645420d92a52",  // ID do usuário Azure DevOps
  "tid": "e9ad8643-b5e9-447f-b324-d78e61d7ed84",     // Tenant ID
  "jti": "5a3a4469-9908-446f-bd72-837bc8bb9f39",     // JWT ID único
  "iss": "app.vstoken.visualstudio.com",             // Issuer (NÃO tem https://)
  "aud": "560de67c-a2e8-408a-86ae-be7ea6bd0b7a",     // App ID da extensão
  "nbf": 1769006959,                                  // Not Before
  "exp": 1769011159                                   // Expiration (~70 min)
}
```

**⚠️ IMPORTANTE:**
- O `iss` é `app.vstoken.visualstudio.com` (sem `https://`)
- O `aud` é o **App ID** da extensão, não o ID do publisher
- O token expira em aproximadamente **70 minutos**
- `nameid` é o ID do usuário (mesmo que vem do webContext)

---

## 5. Alternativa: Proxy Backend

Se quisermos **continuar usando `getAccessToken()`**, o fluxo seria diferente:

1. Frontend obtém `accessToken` do SDK
2. Frontend envia `accessToken` para o backend
3. Backend **NÃO valida** o token
4. Backend **USA** o token para chamar APIs do Azure DevOps em nome do usuário
5. O Azure DevOps valida o token automaticamente

Neste caso, o backend seria um **proxy** que repassa o token para o Azure DevOps.

```python
# Backend como proxy
async def get_user_from_azure(access_token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.0",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return response.json()
```

---

## 6. Recomendação

### Opção A: Usar `getAppToken()` (RECOMENDADO)
- ✅ Token validável pelo backend
- ✅ Não depende de Azure DevOps para validação
- ✅ Mais seguro (secret controlado)
- ❌ Requer obter o secret da extensão

### Opção B: Backend como Proxy
- ✅ Não precisa de secret
- ✅ Token já funciona
- ❌ Toda requisição depende do Azure DevOps
- ❌ Latência adicional

---

## 7. Ações Imediatas

### Para Frontend:
1. Alterar `VSS.getAccessToken()` para `VSS.getAppToken()`
2. Passar o `appToken` para o iframe

### Para Backend:
1. Obter o **secret** da extensão no portal do Marketplace
2. Validar o JWT usando o secret (algoritmo HS256)
3. Extrair informações do usuário dos claims

---

## 8. Código Atualizado para Frontend

```javascript
// timesheet.html - VERSÃO CORRIGIDA
VSS.ready(function() {
    var webContext = VSS.getWebContext();
    
    // Usar getAppToken() para autenticação com backend próprio
    VSS.getAppToken().then(function(appToken) {
        console.log('[Aponta Extension] App Token obtido, tamanho:', appToken.length);
        
        var params = new URLSearchParams({
            organization: webContext.account.name,
            project: webContext.project.name,
            projectId: webContext.project.id,
            userId: webContext.user.id,
            userName: webContext.user.name,
            userEmail: webContext.user.email || '',
            embedded: 'true',
            source: 'azdo-extension',
            token: appToken  // App token, não access token
        });
        
        // ... resto do código
    });
});
```

---

## 9. Referências

- [Authenticate and secure web extensions](https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth?view=azure-devops)
- [getAppToken vs getAccessToken](https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth?view=azure-devops#authenticate-requests-to-your-service)
