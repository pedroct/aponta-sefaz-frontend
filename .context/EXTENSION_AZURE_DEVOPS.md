# 🎯 Extensão Azure DevOps - Status e Arquitetura

**Data:** 21/01/2026  
**Status:** ✅ **FUNCIONANDO EM STAGING**

---

## 📊 Status Atual

| Componente | Status | Observações |
|------------|--------|-------------|
| Extensão VSIX | ✅ v1.0.9 | Publicada no Marketplace (sefaz-ceara) |
| Hub Timesheet | ✅ Funcionando | Folha de horas semanal |
| Hub Atividades | ✅ **NOVO** | CRUD de atividades |
| VSS.SDK (getAppToken) | ✅ Funcionando | Token JWT de 421 chars |
| Frontend (iframe) | ✅ Funcionando | React carrega corretamente |
| Backend (validação JWT) | ⚠️ Pendente | App ID errado no token |
| Sincronização Projetos | ✅ **NOVO** | Botão de sync na tela Atividades |

### ⚠️ Problema Conhecido: Token com App ID Errado

O token JWT está retornando `aud: f3855d44-0193-4bec-956b-31322cf8a205` mas o backend espera `560de67c-a2e8-408a-86ae-be7ea6bd0b7a`.

**Solução:** Atualizar a extensão no Marketplace (Update, não Publish) ou ajustar o `AZURE_EXTENSION_SECRET` no backend.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Azure DevOps (Host)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     Extension Hub (timesheet.html)                       ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  1. VSS.init()                                                      │││
│  │  │  2. VSS.getAppToken() → JWT (421 chars)                             │││
│  │  │  3. VSS.getWebContext() → { organization, project, user }           │││
│  │  │  4. iframe.src = staging-aponta.treit.com.br?token=...&userName=... │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                │                                         ││
│  │                                ▼                                         ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │                     Frontend React (iframe)                          │││
│  │  │  - Lê parâmetros da URL (token, userName, organization, etc)        │││
│  │  │  - Envia token JWT no header Authorization                          │││
│  │  │  - Exibe timesheet com work items                                   │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Authorization: Bearer <JWT>
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Backend (FastAPI)                                   │
│  1. Valida JWT com AZURE_EXTENSION_SECRET (algoritmo HS256)                 │
│  2. Extrai nameid (ID do usuário) do token                                  │
│  3. Usa AZURE_DEVOPS_PAT para chamar APIs do Azure DevOps                   │
│  4. Retorna work items, timesheet, etc                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Basic Auth (PAT)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Azure DevOps API                                    │
│  - Work Items (WIQL)                                                        │
│  - User Profiles                                                            │
│  - etc                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Autenticação: getAppToken() vs getAccessToken()

### ❌ getAccessToken() - NÃO USAR para backend próprio
- Retorna token para chamar APIs do Azure DevOps **diretamente**
- Não pode ser validado por backends de terceiros
- Uso correto: Frontend → Azure DevOps API

### ✅ getAppToken() - USAR para backend próprio
- Retorna JWT assinado com **secret da extensão**
- Pode ser validado pelo backend usando o secret
- Uso correto: Frontend → Seu Backend

### Estrutura do App Token JWT

```json
{
  "nameid": "08347002-d37b-6380-a5a7-645420d92a52",  // ID do usuário
  "tid": "e9ad8643-b5e9-447f-b324-d78e61d7ed84",     // Tenant ID
  "jti": "5a3a4469-9908-446f-bd72-837bc8bb9f39",     // JWT ID único
  "iss": "app.vstoken.visualstudio.com",             // Issuer (sem https://)
  "aud": "560de67c-a2e8-408a-86ae-be7ea6bd0b7a",     // App ID da extensão
  "nbf": 1769006959,                                  // Not Before
  "exp": 1769011159                                   // Expiration (~70 min)
}
```

---

## 📁 Arquivos da Extensão

```
extension/
├── dist/
│   ├── timesheet.html          # HTML wrapper para Folha de Horas
│   ├── atividades.html         # HTML wrapper para Gestão de Atividades (NOVO)
│   └── images/
│       ├── icon-16.png         # Ícone 16x16
│       ├── icon-128.png        # Ícone 128x128
│       └── logo.png            # Logo
├── vss-extension.json          # Manifest de produção
├── vss-extension.staging.json  # Manifest de staging (v1.0.9)
└── README.md                   # Documentação da extensão
```

### Hubs Disponíveis

| Hub | Arquivo | Rota Frontend | Descrição |
|-----|---------|---------------|-----------|
| Timesheet | timesheet.html | `/` | Folha de horas semanal |
| Atividades | atividades.html | `/atividades` | CRUD de atividades |

### timesheet.html - Pontos-chave

```javascript
// 1. Inicializa VSS.SDK
VSS.init({
    usePlatformScripts: true,
    usePlatformStyles: true
});

// 2. Obtém App Token (JWT para backend)
VSS.getAppToken().then(function(tokenResult) {
    // tokenResult pode ser string ou objeto {token: string}
    var appToken = typeof tokenResult === 'string' 
        ? tokenResult 
        : (tokenResult && tokenResult.token);
    
    // 3. Obtém contexto (org, project, user)
    var webContext = VSS.getWebContext();
    
    // 4. Monta URL com parâmetros
    var params = new URLSearchParams({
        organization: webContext.account.name,
        project: webContext.project.name,
        userId: webContext.user.id,
        userName: webContext.user.name,  // Nome real do usuário!
        token: appToken
    });
    
    // 5. Carrega frontend no iframe
    iframe.src = baseUrl + '?' + params.toString();
});
```

---

## 🐛 Correções Implementadas

### 1. Race Condition no Token (20/01/2026)
**Problema:** React Query disparava queries antes do token estar disponível.  
**Solução:** Mudou de `useEffect` para atualização síncrona do `tokenRef` durante o render.

### 2. Tipo de Retorno do getAppToken() (21/01/2026)
**Problema:** `getAppToken()` retorna objeto `{token: string}`, não string direta.  
**Solução:** Tratamento condicional para ambos os tipos.

### 3. displayName Inválido do Backend (21/01/2026)
**Problema:** Backend retornava `"008753C9"` em vez do nome real.  
**Solução:** Frontend usa `userName` do webContext como fallback.

```typescript
// client/src/hooks/use-current-user.ts
function isValidDisplayName(name: string): boolean {
  if (/^User-/i.test(name)) return false;      // "User-08347002"
  if (/^[0-9A-F]{8}$/i.test(name)) return false; // "008753C9"
  if (/^[0-9a-f-]{36}$/i.test(name)) return false; // GUIDs
  return true;
}

// Se backend retorna nome inválido, usa webContext
if (!isValidDisplayName(backendUser.displayName) && context?.userName) {
  displayName = context.userName; // "PEDRO CICERO TEIXEIRA"
}
```

---

## 🔧 Configuração do Backend

### Variáveis de Ambiente Necessárias

```env
AZURE_EXTENSION_SECRET=ey9asfas...  # Secret do Marketplace (validar JWT)
AZURE_DEVOPS_PAT=xxxxx              # PAT para chamar Azure DevOps API
AZURE_DEVOPS_ORG=sefaz-ceara-lab    # Nome da organização
```

### Validação do JWT (Python)

```python
import jwt

def validate_app_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            EXTENSION_SECRET,
            algorithms=["HS256"],
            audience="560de67c-a2e8-408a-86ae-be7ea6bd0b7a"
        )
        if payload.get("iss") != "app.vstoken.visualstudio.com":
            return None
        return payload
    except jwt.InvalidTokenError:
        return None
```

---

## 📦 Gerar Nova Versão da Extensão

```bash
cd extension

# Atualizar versão no manifest (se necessário)
# Só precisa gerar nova versão se alterar timesheet.html ou manifest

# Gerar VSIX
npx tfx-cli extension create \
  --manifest-globs vss-extension.staging.json \
  --output-path . \
  --override "{\"version\": \"1.0.9\"}"

# Publicar (via Marketplace ou CLI)
npx tfx-cli extension publish \
  --manifest-globs vss-extension.staging.json \
  --token $MARKETPLACE_PAT
```

---

## 🔗 Links

- **Extensão Staging:** https://marketplace.visualstudio.com/publishers/sefaz-ceara
- **Azure DevOps Org:** https://dev.azure.com/sefaz-ceara-lab
- **Frontend Staging:** https://staging-aponta.treit.com.br
- **Documentação SDK:** https://learn.microsoft.com/en-us/azure/devops/extend/develop/auth

---

**Última Atualização:** 21/01/2026 12:45
