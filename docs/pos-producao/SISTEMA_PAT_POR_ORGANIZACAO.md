# Sistema de PATs por Organização

**Data:** 26 de Janeiro de 2026  
**Versão:** 1.2.1  
**Status:** ✅ Implementado e Testado em Staging  
**Autor:** Implementação assistida por IA

---

## 📋 Sumário

1. [Contexto e Motivação](#contexto-e-motivação)
2. [Problema Identificado](#problema-identificado)
3. [Solução Implementada](#solução-implementada)
4. [Arquitetura](#arquitetura)
5. [Backend: Detalhes da Implementação](#backend-detalhes-da-implementação)
6. [Frontend: Detalhes da Implementação](#frontend-detalhes-da-implementação)
7. [Extensão Azure DevOps](#extensão-azure-devops)
8. [Configuração e Deploy](#configuração-e-deploy)
9. [Uso da Interface](#uso-da-interface)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Contexto e Motivação

O sistema Aponta precisa acessar work items de **múltiplas organizações Azure DevOps**:

| Organização | Descrição |
|-------------|-----------|
| `sefaz-ceara` | Organização principal |
| `sefaz-ceara-lab` | Ambiente de laboratório |
| `sefaz-ce-siscoex2` | Sistema de Comércio Exterior |
| `sefaz-ce-diligencia` | Sistema de Diligências |

Cada organização Azure DevOps requer um **Personal Access Token (PAT) próprio** para autenticação. O sistema anterior utilizava variáveis de ambiente para armazenar os PATs, o que dificultava a manutenção e renovação.

---

## 🚨 Problema Identificado

Durante os testes em produção (26/01/2026), identificamos que:

1. **PAT único não funciona para múltiplas organizações** - Um PAT gerado em uma organização retorna `302 Redirect` ao tentar acessar outra organização
2. **Erros de autenticação** - `401 Unauthorized` e `302 Found` ao consultar work items de organizações diferentes
3. **Dificuldade de manutenção** - PATs armazenados em variáveis de ambiente requerem reinício de containers para atualização

### Exemplo de Erro

```json
{
  "error": "Erro ao buscar work items",
  "details": "API Azure DevOps retornou status 302",
  "organization": "sefaz-ce-siscoex2"
}
```

---

## ✅ Solução Implementada

### Funcionalidades

1. **Interface de Gerenciamento de PATs** - Página web para cadastrar, editar e excluir PATs por organização
2. **Armazenamento Seguro** - PATs criptografados com Fernet (AES-128-CBC) no banco de dados
3. **Validação Online** - Verificação do PAT contra a API do Azure DevOps antes de salvar
4. **Fallback para Env Vars** - Mantém compatibilidade com configuração via variáveis de ambiente
5. **Gerenciamento de Status** - Ativar/desativar PATs sem excluí-los

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                    Requisição de Work Items                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              TimesheetService._get_pat_for_org()                │
├─────────────────────────────────────────────────────────────────┤
│  1. Busca PAT ativo no banco (organization_pats)                │
│  2. Se não encontrar, busca em AZURE_DEVOPS_ORG_PATS            │
│  3. Se não encontrar, usa AZURE_DEVOPS_PAT (fallback)           │
│  4. Se não encontrar nenhum, retorna erro                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Chamada API Azure DevOps                           │
│              Authorization: Basic base64(:PAT)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
├─────────────────────────────────────────────────────────────────┤
│  ConfiguracaoPats.tsx    ← Página de gerenciamento              │
│  use-organization-pats.ts ← Hooks React Query                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                 │
├─────────────────────────────────────────────────────────────────┤
│  organization_pats.py (router) ← REST API                       │
│  organization_pat_service.py   ← Lógica de negócio              │
│  organization_pat.py (repo)    ← Acesso ao banco                │
│  organization_pat.py (model)   ← Modelo SQLAlchemy              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                │
├─────────────────────────────────────────────────────────────────┤
│  Schema: aponta_sefaz                                           │
│  Tabela: organization_pats                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐍 Backend: Detalhes da Implementação

### Arquivos Criados/Modificados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `app/models/organization_pat.py` | Novo | Modelo SQLAlchemy com criptografia |
| `app/models/__init__.py` | Modificado | Export do novo modelo |
| `app/schemas/organization_pat.py` | Novo | Schemas Pydantic para API |
| `app/repositories/organization_pat.py` | Novo | Repository CRUD |
| `app/services/organization_pat_service.py` | Novo | Service com validação |
| `app/routers/organization_pats.py` | Novo | Endpoints REST |
| `app/main.py` | Modificado | Registro do novo router |
| `app/config.py` | Modificado | Configuração `pat_encryption_key` |
| `app/services/timesheet_service.py` | Modificado | Uso de PAT por organização |
| `alembic/versions/e5f6...organization_pats.py` | Novo | Migration da tabela |

### Modelo de Dados

```python
class OrganizationPat(Base):
    __tablename__ = "organization_pats"

    id = Column(GUID(), primary_key=True)
    organization_name = Column(String(255), unique=True, index=True)  # ex: sefaz-ceara
    organization_url = Column(String(500))  # https://dev.azure.com/sefaz-ceara
    pat_encrypted = Column(Text, nullable=False)  # PAT criptografado
    descricao = Column(Text)
    expira_em = Column(DateTime)
    ativo = Column(Boolean, default=True)
    criado_por = Column(String(255), index=True)
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now())
```

### Criptografia do PAT

```python
from cryptography.fernet import Fernet

def get_cipher():
    """Retorna o cipher para criptografia do PAT."""
    settings = get_settings()
    key = settings.pat_encryption_key
    if not key:
        # Gera chave derivada do secret_key (fallback)
        hash_key = hashlib.sha256(settings.secret_key.encode()).digest()
        key = base64.urlsafe_b64encode(hash_key)
    return Fernet(key)

class OrganizationPat:
    def set_pat(self, pat: str):
        """Criptografa e armazena o PAT."""
        cipher = get_cipher()
        self.pat_encrypted = cipher.encrypt(pat.encode()).decode()

    def get_pat(self) -> str:
        """Descriptografa e retorna o PAT."""
        cipher = get_cipher()
        return cipher.decrypt(self.pat_encrypted.encode()).decode()

    @property
    def pat_masked(self) -> str:
        """Retorna o PAT mascarado para exibição."""
        pat = self.get_pat()
        if len(pat) <= 8:
            return "***"
        return f"{pat[:4]}...{pat[-4:]}"
```

### Validação de PAT

O service valida o PAT tentando listar os projetos da organização:

```python
async def validate_pat(self, organization_name: str, pat: str):
    url = f"https://dev.azure.com/{organization_name}/_apis/projects?api-version=7.1"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, auth=("", pat))
        
        if response.status_code == 200:
            data = response.json()
            projects = [p["name"] for p in data.get("value", [])]
            return {"valid": True, "projects_count": len(projects), "projects": projects[:10]}
        elif response.status_code == 401:
            return {"valid": False, "message": "PAT inválido ou expirado (401)"}
        elif response.status_code == 302:
            return {"valid": False, "message": "PAT não tem acesso a esta organização (302)"}
```

---

## ⚛️ Frontend: Detalhes da Implementação

### Arquivos Criados/Modificados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `client/src/hooks/use-organization-pats.ts` | Novo | React Query hooks |
| `client/src/pages/ConfiguracaoPats.tsx` | Novo | Página de gerenciamento |
| `client/src/App.tsx` | Modificado | Rota `/configuracao/pats` |

### React Query Hooks

```typescript
// Listar PATs
export function useOrganizationPats() {
  return useQuery({
    queryKey: ["organization-pats"],
    queryFn: () => api.get<OrganizationPatList>("/api/v1/organization-pats"),
  });
}

// Criar PAT
export function useCriarOrganizationPat() {
  return useMutation({
    mutationFn: (data: OrganizationPatCreate) =>
      api.post<OrganizationPat>("/api/v1/organization-pats", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-pats"] }),
  });
}

// Validar PAT armazenado
export function useValidarPatArmazenado() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<OrganizationPatValidateResponse>(`/api/v1/organization-pats/${id}/validate`),
  });
}
```

### Rota da Página

```typescript
// App.tsx
<Route path="/configuracao/pats" component={ConfiguracaoPats} />
```

### URL de Acesso

```
http://aponta.treit.com.br/#/configuracao/pats
```

---

## 🔌 Extensão Azure DevOps

A configuração de PATs está integrada diretamente no **Organization Settings** do Azure DevOps através de um hub administrativo.

### Contribution no Manifesto

```json
{
  "id": "configuracao-pats-hub",
  "type": "ms.vss-web.hub",
  "description": "Hub de configuração de PATs por organização no Organization Settings",
  "targets": [
    "ms.vss-web.collection-admin-hub-group"
  ],
  "properties": {
    "name": "Aponta - PATs",
    "order": 100,
    "uri": "pages/configuracao-pats/index.html",
    "icon": {
      "light": "images/icon-16.png",
      "dark": "images/icon-16-dark.png"
    }
  }
}
```

### Arquivos da Extensão

| Arquivo | Descrição |
|---------|-----------|
| `extension/pages/configuracao-pats/index.html` | Wrapper que carrega o frontend via iframe |
| `extension/vss-extension.json` | Manifesto de produção |
| `extension/vss-extension.staging.json` | Manifesto de staging |

### Acesso via Azure DevOps

1. **Navegação:** `Organization Settings` → `Extensions` → `Aponta - PATs`
2. **URL Direta (Staging):** 
   ```
   https://dev.azure.com/{organization}/_settings/sefaz-ceara.aponta-projetos-staging.configuracao-pats-hub
   ```
3. **URL Direta (Produção):**
   ```
   https://dev.azure.com/{organization}/_settings/sefaz-ceara.aponta-projetos.configuracao-pats-hub
   ```

### Fluxo de Carregamento

```
┌─────────────────────────────────────────────────────────────────┐
│               Azure DevOps Organization Settings                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           pages/configuracao-pats/index.html (wrapper)          │
├─────────────────────────────────────────────────────────────────┤
│  1. Carrega VSS SDK (fallback: CDN jsdelivr/unpkg)              │
│  2. Inicializa VSS.init()                                       │
│  3. Obtém webContext e appToken                                 │
│  4. Cria iframe apontando para frontend externo                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│       https://staging-aponta.treit.com.br/#/configuracao/pats   │
│               (Frontend React hospedado externamente)           │
└─────────────────────────────────────────────────────────────────┘
```

### Versões do VSIX

| Ambiente | Versão | Arquivo |
|----------|--------|---------|
| Staging | 1.1.98 | `sefaz-ceara.aponta-projetos-staging-1.1.98.vsix` |
| Produção | 1.0.1 | `sefaz-ceara.aponta-projetos-1.0.1.vsix` |

---

## ⚙️ Configuração e Deploy

### Variáveis de Ambiente (Backend)

```env
# Chave para criptografia dos PATs (opcional - gera automaticamente se não informada)
PAT_ENCRYPTION_KEY=sua-chave-fernet-base64

# Chave secreta para derivação da chave de criptografia (obrigatório se PAT_ENCRYPTION_KEY não for definida)
SECRET_KEY=sua-chave-secreta
```

### Gerar Chave Fernet

```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
# Resultado: exemplo: YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=
```

### Migration

```bash
# Na VPS (produção)
ssh root@92.112.178.252
cd /home/ubuntu/aponta-sefaz/production/backend

# Executar migration
docker exec api-aponta-prod alembic upgrade head
```

### Deploy Backend

```bash
# Upload do código
scp -r app/ root@92.112.178.252:/home/ubuntu/aponta-sefaz/production/backend/
scp -r alembic/ root@92.112.178.252:/home/ubuntu/aponta-sefaz/production/backend/

# Rebuild do container
ssh root@92.112.178.252
cd /home/ubuntu/aponta-sefaz/production/backend
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up -d --build
```

### Deploy Frontend

```bash
# Build local
cd c:\Projetos\Azure\fe-aponta
npm run build

# Upload
scp -r dist/* root@92.112.178.252:/home/ubuntu/aponta-sefaz/production/frontend/dist/

# Restart container
ssh root@92.112.178.252
docker restart fe-aponta-prod
```

---

## 📖 Uso da Interface

### Acessando a Página

1. Acesse `http://aponta.treit.com.br/#/configuracao/pats`
2. A página lista todos os PATs cadastrados

### Cadastrando um Novo PAT

1. Clique em **"Novo PAT"**
2. Preencha os campos:
   - **Nome da Organização** (obrigatório): ex: `sefaz-ceara`
   - **PAT** (obrigatório): Cole o token gerado no Azure DevOps
   - **URL da Organização** (opcional): Preenchido automaticamente
   - **Data de Expiração** (opcional): Para alertas de renovação
   - **Descrição** (opcional): Observações
3. Marque **"Validar PAT antes de salvar"** (recomendado)
4. Clique em **"Criar PAT"**

### Gerando um PAT no Azure DevOps

1. Acesse [Azure DevOps User Settings](https://dev.azure.com/_usersSettings/tokens)
2. Clique em **"New Token"**
3. Configure:
   - **Name**: `Aponta - sefaz-ceara`
   - **Organization**: Selecione a organização
   - **Expiration**: Custom (máximo 1 ano)
   - **Scopes**:
     - ✅ Work Items: Read & Write
     - ✅ Code: Read
     - ✅ Project and Team: Read
4. Clique em **"Create"** e copie o token

### Validando um PAT Existente

1. Na tabela, clique no ícone **🔄 (Validar)**
2. O sistema tentará listar os projetos da organização
3. Resultado:
   - ✅ **Verde**: PAT válido (mostra quantidade de projetos)
   - ❌ **Vermelho**: PAT inválido (mostra mensagem de erro)

### Ativando/Desativando um PAT

1. Na tabela, clique no ícone **⊕/⊖**
2. O PAT será ativado ou desativado
3. PATs inativos não são usados nas requisições

---

## 📚 API Reference

### Listar PATs

```http
GET /api/v1/organization-pats
```

**Query Parameters:**
- `skip` (int, default: 0): Registros a pular
- `limit` (int, default: 100): Limite de registros
- `only_active` (bool, default: false): Apenas PATs ativos

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "organization_name": "sefaz-ceara",
      "organization_url": "https://dev.azure.com/sefaz-ceara",
      "pat_masked": "G9YC...qns=",
      "descricao": "PAT principal",
      "expira_em": "2027-01-26T00:00:00",
      "ativo": true,
      "criado_por": "usuario@email.com",
      "criado_em": "2026-01-26T10:00:00",
      "atualizado_em": "2026-01-26T10:00:00"
    }
  ],
  "total": 1
}
```

### Criar PAT

```http
POST /api/v1/organization-pats?validate_first=true
```

**Body:**
```json
{
  "organization_name": "sefaz-ceara",
  "pat": "G9YCUqns...",
  "organization_url": "https://dev.azure.com/sefaz-ceara",
  "descricao": "PAT principal",
  "expira_em": "2027-01-26",
  "ativo": true
}
```

### Validar PAT (sem salvar)

```http
POST /api/v1/organization-pats/validate
```

**Body:**
```json
{
  "organization_name": "sefaz-ceara",
  "pat": "G9YCUqns..."
}
```

**Response:**
```json
{
  "valid": true,
  "organization_name": "sefaz-ceara",
  "message": "PAT válido. 5 projeto(s) encontrado(s).",
  "projects_count": 5,
  "projects": ["Projeto1", "Projeto2", "Projeto3", "Projeto4", "Projeto5"]
}
```

### Validar PAT Armazenado

```http
POST /api/v1/organization-pats/{id}/validate
```

### Toggle Ativo

```http
POST /api/v1/organization-pats/{id}/toggle-active
```

### Atualizar PAT

```http
PUT /api/v1/organization-pats/{id}
```

### Excluir PAT

```http
DELETE /api/v1/organization-pats/{id}
```

---

## 🔧 Troubleshooting

### Erro: "PAT não tem acesso a esta organização (302)"

**Causa:** O PAT foi gerado para uma organização diferente.

**Solução:** Gere um novo PAT na organização correta em [Azure DevOps User Settings](https://dev.azure.com/_usersSettings/tokens).

### Erro: "PAT inválido ou expirado (401)"

**Causa:** O PAT expirou ou foi revogado.

**Solução:** Renove o PAT no Azure DevOps e atualize no sistema.

### Erro: "Erro de criptografia"

**Causa:** A chave de criptografia mudou ou está incorreta.

**Solução:** Verifique se `PAT_ENCRYPTION_KEY` ou `SECRET_KEY` estão corretos nas variáveis de ambiente.

### Erro: "PAT não está sendo usado"

**Causa:** O PAT pode estar desativado ou a busca não encontra.

**Verificação:**
```sql
SELECT organization_name, ativo, expira_em 
FROM aponta_sefaz.organization_pats 
WHERE organization_name = 'sefaz-ceara';
```

### Erro: "422 Unprocessable Content" ao criar PAT

**Causa 1:** Campo `expira_em` em formato incorreto (apenas data sem hora).

**Solução:** Frontend deve converter para datetime ISO: `2027-01-24T23:59:59.000Z`

**Causa 2:** Validators duplicados no schema Pydantic.

**Solução:** Verificar se há apenas um `@field_validator` por campo com `mode="before"`.

### Erro: "datetime_parsing - invalid datetime separator"

**Causa:** O campo de data está sendo enviado como `YYYY-MM-DD` mas o backend espera datetime ISO.

**Solução:** No frontend, converter a data antes de enviar:
```typescript
const expiraEmDatetime = formData.expira_em
  ? new Date(formData.expira_em + "T23:59:59").toISOString()
  : undefined;
```

---

## 📝 Changelog

### v1.2.1 (26/01/2026)

- 🔧 **Corrigido (Backend):** Unificação de validators duplicados para `organization_url` no schema Pydantic
  - Problema: Dois `@field_validator` com `mode="before"` causavam conflitos e erro 422
  - Solução: Unificados em único validator que converte string vazia para None e gera URL automaticamente
  - Commit: `e7b3490`
- 🔧 **Corrigido (Frontend):** Conversão de `expira_em` para datetime ISO
  - Problema: Input `type="date"` enviava `YYYY-MM-DD`, backend esperava datetime ISO
  - Solução: Conversão para `YYYY-MM-DDTHH:mm:ss.sssZ` antes do envio
  - Commit: `da7dcb8`
- ✅ **Testado:** Criação e validação de PATs funcionando em staging
- 📦 **VSIX Staging:** v1.1.98

### v1.2.0 (26/01/2026)

- ✨ **Novo:** Hub administrativo no Organization Settings do Azure DevOps
- ✨ **Novo:** Contribution `ms.vss-web.collection-admin-hub-group` para acesso direto
- ✨ **Novo:** Wrapper HTML com fallback de VSS SDK (jsdelivr/unpkg)
- 🔧 **Corrigido:** URL do iframe agora aponta para frontend externo (`staging-aponta.treit.com.br`)
- 🔧 **Corrigido:** Caminho do VSS SDK local (`../../lib/VSS.SDK.min.js`)
- 📦 **VSIX Staging:** v1.1.97

### v1.1.0 (26/01/2026)

- ✨ **Novo:** Interface de gerenciamento de PATs
- ✨ **Novo:** Criptografia Fernet para armazenamento seguro
- ✨ **Novo:** Validação online de PATs
- ✨ **Novo:** Suporte a múltiplos PATs por organização
- 🔧 **Melhorado:** TimesheetService usa PAT específico por organização
- 🔧 **Melhorado:** Fallback para variáveis de ambiente mantido

---

## 🔗 Links Relacionados

- [DEPLOY_STAGING_WORKFLOW.md](./DEPLOY_STAGING_WORKFLOW.md) - Workflow de deploy staging
- [DEPLOY_PRODUCAO_V1.0.md](./DEPLOY_PRODUCAO_V1.0.md) - Deploy inicial de produção
- [DIVERGENCIAS_GIT_AMBIENTES.md](./DIVERGENCIAS_GIT_AMBIENTES.md) - Sincronização Git
- [Azure DevOps Extension Targets](https://learn.microsoft.com/en-us/azure/devops/extend/reference/targets/overview)
- [Azure DevOps PAT Guide](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
