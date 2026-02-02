# Deploy Produção - Aponta v1.0

**Data:** 25-26 de Janeiro de 2026  
**Versão:** 1.0.1  
**Ambiente:** Produção  
**Autor:** Deploy automatizado com assistência de IA

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Infraestrutura](#infraestrutura)
3. [Configurações de Ambiente](#configurações-de-ambiente)
4. [Extensão Azure DevOps](#extensão-azure-devops)
5. [Backend API](#backend-api)
6. [Problemas Resolvidos](#problemas-resolvidos)
7. [Organizações Configuradas](#organizações-configuradas)
8. [Comandos Úteis](#comandos-úteis)
9. [Checklist de Verificação](#checklist-de-verificação)

---

## 🎯 Visão Geral

O sistema Aponta é uma extensão para Azure DevOps que permite o gerenciamento de apontamentos de horas em atividades dos projetos de engenharia de software da Sefaz Ceará.

### Componentes do Sistema

| Componente | Tecnologia | URL/Local |
|------------|------------|-----------|
| Frontend (Extensão) | React + Vite + TypeScript | Marketplace Azure DevOps |
| Backend API | FastAPI + Python 3.12 | http://aponta.treit.com.br/api |
| Banco de Dados | PostgreSQL 15 | Container `postgres-aponta` |
| Reverse Proxy | Nginx Alpine | Container `nginx-aponta` |
| Frontend Web | Nginx Alpine | Container `fe-aponta-prod` |

---

## 🏗️ Infraestrutura

### VPS (Produção)

- **IP:** 92.112.178.252
- **Usuário:** root
- **Diretório Base:** `/home/ubuntu/aponta-sefaz/production/`

### Containers Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    aponta-shared-network                        │
├─────────────────────────────────────────────────────────────────┤
│  nginx-aponta      ← Porta 80/443 (Reverse Proxy + SSL)         │
│  fe-aponta-prod    ← Frontend React (interno)                   │
│  api-aponta-prod   ← Backend FastAPI (porta 8001 interna)       │
│  postgres-aponta   ← PostgreSQL (porta 5432)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Rede Docker

- **Nome:** `aponta-shared-network`
- **Driver:** bridge

---

## ⚙️ Configurações de Ambiente

### Arquivo: `/root/prod.env`

```env
DATABASE_URL=postgresql://aponta_user:***@postgres-aponta:5432/gestao_projetos
DATABASE_SCHEMA=aponta_sefaz
CORS_ORIGINS=http://aponta.treit.com.br,https://dev.azure.com,https://*.visualstudio.com,https://*.vsassets.io
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/sefaz-ceara
AZURE_DEVOPS_PAT=<PAT_SEFAZ_CEARA>
AZURE_DEVOPS_ORG_PATS=sefaz-ce-diligencia=<PAT_DILIGENCIA>,sefaz-ce-siscoex2=<PAT_SISCOEX2>
ENVIRONMENT=production
AZURE_EXTENSION_SECRET=<EXTENSION_SECRET>
```

### Variáveis de Ambiente Críticas

| Variável | Descrição |
|----------|-----------|
| `AZURE_DEVOPS_PAT` | PAT para organização principal (sefaz-ceara) |
| `AZURE_DEVOPS_ORG_PATS` | PATs adicionais no formato `org1=pat1,org2=pat2` |
| `AZURE_EXTENSION_SECRET` | Secret para validar App Tokens JWT da extensão |
| `DATABASE_SCHEMA` | Schema do PostgreSQL: `aponta_sefaz` |

---

## 🧩 Extensão Azure DevOps

### Informações do Marketplace

- **Publisher:** `sefaz-ceara`
- **ID:** `aponta-projetos`
- **Nome:** Aponta
- **Versão Atual:** 1.0.1
- **URL:** https://marketplace.visualstudio.com/manage/publishers/sefaz-ceara

### Scopes Necessários

```json
"scopes": [
  "vso.extension.default",
  "vso.profile",
  "vso.work_write",
  "vso.identity"
]
```

### Arquivos da Extensão

```
extension/
├── vss-extension.json          ← Manifesto de produção
├── vss-extension.staging.json  ← Manifesto de staging
├── overview-prod.md            ← Descrição para Marketplace
├── images/
│   └── icon.png
├── lib/
│   └── VSS.SDK.min.js
├── pages/
│   ├── atividades/index.html   ← Hub de Atividades
│   ├── timesheet/index.html    ← Hub de Timesheet
│   ├── workitem/index.html     ← Work Item Group
│   ├── apontar-dialog/index.html
│   └── addTimePopupDialog/index.html
└── vsix/
    ├── staging/
    └── production/
        └── sefaz-ceara.aponta-projetos-1.0.1.vsix
```

### Autenticação da Extensão

**IMPORTANTE:** As páginas da extensão usam `VSS.getAppToken()` (NÃO `getAccessToken()`).

| Método | Token | Uso |
|--------|-------|-----|
| `getAppToken()` | JWT ~400-500 chars | ✅ Validação com backend próprio |
| `getAccessToken()` | OAuth ~1000+ chars | ❌ Apenas APIs do Azure DevOps |

O backend valida o App Token JWT usando o `AZURE_EXTENSION_SECRET` obtido em:
https://aka.ms/vsmarketplace-manage > Botão direito na extensão > Certificate

---

## 🔧 Backend API

### Estrutura de Diretórios (VPS)

```
/home/ubuntu/aponta-sefaz/production/backend/
├── app/
│   ├── __init__.py
│   ├── auth.py              ← Autenticação Azure DevOps
│   ├── config.py            ← Configurações e multi-org
│   ├── database.py
│   ├── main.py
│   ├── models/
│   │   └── projeto.py       ← Inclui coluna 'organizacao'
│   ├── repositories/
│   ├── routers/
│   │   ├── atividades.py    ← Inclui rota /gestao
│   │   ├── projetos.py
│   │   └── integracao.py
│   ├── schemas/
│   │   └── projeto.py       ← Inclui campo 'organizacao'
│   └── services/
│       └── projeto_service.py ← Sincronização multi-org
├── alembic/
│   └── versions/
│       └── add_organizacao_column.py
└── scripts/
    └── start.sh
```

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/api/v1/integracao/sincronizar` | Sincroniza projetos de todas as organizações |
| GET | `/api/v1/projetos` | Lista projetos do cache local |
| GET | `/api/v1/atividades` | Lista atividades |
| GET | `/api/v1/atividades/gestao` | Lista atividades para tela de gestão |

### Multi-Organização

O backend agora suporta múltiplas organizações Azure DevOps:

```python
# config.py
def get_all_organizations(self) -> list[dict]:
    """Retorna lista de todas as organizações configuradas."""
    # 1. Organização principal (AZURE_DEVOPS_ORG_URL + AZURE_DEVOPS_PAT)
    # 2. Organizações adicionais (AZURE_DEVOPS_ORG_PATS)
```

---

## 🐛 Problemas Resolvidos

### 1. Erro 403 - Nginx bloqueando vsassets.io

**Problema:** Nginx retornava 403 para requisições com referer `vsassets.io`.

**Solução:** Adicionado `vsassets.io` no map `from_azure_devops` do nginx.conf:
```nginx
map $http_referer $from_azure_devops {
    default 0;
    "~*vsassets\.io" 1;
    # ...
}
```

### 2. Erro CSP frame-ancestors

**Problema:** Content Security Policy bloqueava iframe de `vsassets.io`.

**Solução:** Adicionado `https://*.vsassets.io` no header CSP:
```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://dev.azure.com https://*.visualstudio.com https://*.azure.com https://*.vsassets.io" always;
```

### 3. Erro 401 - Token OAuth inválido

**Problema:** Backend retornava 401 porque tentava validar OAuth token contra API do Azure DevOps.

**Causa:** Frontend usava `VSS.getAccessToken()` que retorna token OAuth (~1091 chars) destinado apenas para APIs do Azure DevOps.

**Solução:** Alterado para usar `VSS.getAppToken()` que retorna JWT (~421 chars) validável pelo backend.

**Arquivos alterados:**
- `extension/pages/atividades/index.html`
- `extension/pages/timesheet/index.html`
- `extension/pages/apontar-dialog/index.html`
- `extension/pages/workitem/index.html`
- `extension/pages/addTimePopupDialog/index.html`

### 4. Erro 422 - Rota /gestao não encontrada

**Problema:** Endpoint `/api/v1/atividades/gestao` retornava 422 (UUID parsing error).

**Causa:** Arquivo `atividades.py` no VPS estava desatualizado e não tinha a rota `/gestao`.

**Solução:** Copiado arquivo atualizado que inclui a rota corretamente posicionada.

### 5. Sincronização apenas da organização principal

**Problema:** Endpoint `/api/v1/integracao/sincronizar` buscava apenas projetos de `sefaz-ceara`.

**Solução:** Implementado suporte multi-organização:
- Novo método `get_all_organizations()` em `config.py`
- Nova coluna `organizacao` na tabela `projetos`
- `projeto_service.py` agora itera todas as organizações

---

## 🏢 Organizações Configuradas

| Organização | Projetos | PAT |
|-------------|----------|-----|
| sefaz-ceara | 8 | `AZURE_DEVOPS_PAT` |
| sefaz-ce-diligencia | 1 | `AZURE_DEVOPS_ORG_PATS` |
| sefaz-ce-siscoex2 | 1 | `AZURE_DEVOPS_ORG_PATS` |

### Projetos Sincronizados

```
nome               | organizacao
-------------------+---------------------
Diligência         | sefaz-ce-diligencia
SISCOEX2           | sefaz-ce-siscoex2
CESINF-CFA         | sefaz-ceara
CESINF-DT-e        | sefaz-ceara
CESINF-DTE2        | sefaz-ceara
CESINF-IPVA        | sefaz-ceara
CESINF-ITCD        | sefaz-ceara
CESOP-CAF-e        | sefaz-ceara
CESOP-Diligencia   | sefaz-ceara
CESOP-Next         | sefaz-ceara
```

---

## 💻 Comandos Úteis

### Acesso ao VPS

```bash
ssh root@92.112.178.252
```

### Logs dos Containers

```bash
# Backend
docker logs api-aponta-prod --tail 50

# Frontend
docker logs fe-aponta-prod --tail 50

# Nginx
docker logs nginx-aponta --tail 50
```

### Reiniciar Containers

```bash
docker restart api-aponta-prod
docker restart fe-aponta-prod
docker restart nginx-aponta
```

### Verificar Saúde

```bash
curl -s http://localhost:8001/health
```

### Sincronizar Projetos

```bash
curl -s -X POST http://localhost:8001/api/v1/integracao/sincronizar \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

### Consultar Banco de Dados

```bash
docker exec postgres-aponta psql -U aponta_user -d gestao_projetos -c \
  'SELECT nome, organizacao FROM aponta_sefaz.projetos ORDER BY organizacao, nome;'
```

### Copiar Arquivos para VPS

```bash
# Via WSL
wsl -d Ubuntu-24.04 -e bash -c "scp <arquivo_local> root@92.112.178.252:<destino>"
```

### Gerar VSIX de Produção

```bash
npm run create:vsix:prod
```

---

## ✅ Checklist de Verificação

### Backend
- [ ] Container `api-aponta-prod` está rodando
- [ ] Health check retorna `{"status":"healthy"}`
- [ ] Endpoint `/api/v1/atividades/gestao` retorna 200
- [ ] Sincronização traz projetos de todas as organizações

### Frontend
- [ ] Container `fe-aponta-prod` está rodando
- [ ] Extensão carrega no Azure DevOps sem erros
- [ ] App Token JWT é obtido corretamente (~400-500 chars)
- [ ] Requisições à API retornam 200

### Nginx
- [ ] SSL/TLS funcionando (http://aponta.treit.com.br)
- [ ] Requisições de vsassets.io são permitidas
- [ ] CSP frame-ancestors inclui vsassets.io

### Banco de Dados
- [ ] Schema `aponta_sefaz` existe
- [ ] Tabela `projetos` tem coluna `organizacao`
- [ ] Projetos estão com organização preenchida

---

## 📁 Arquivos de Configuração

### Local (Desenvolvimento)

```
fe-aponta/
├── .env.production           ← Variáveis de ambiente para build
├── extension/
│   ├── vss-extension.json    ← Manifesto produção
│   └── vss-extension.staging.json
├── nginx.conf                ← Config nginx local
└── scripts/
    ├── prepare-production.js ← Troca URLs staging/prod
    └── move-vsix.js          ← Organiza VSIX por ambiente
```

### VPS (Produção)

```
/root/prod.env                              ← Variáveis de ambiente
/home/ubuntu/aponta-sefaz/
├── production/
│   ├── backend/                            ← Código do backend
│   ├── frontend/                           ← Build do frontend
│   └── docker-compose.yml
└── shared/
    └── nginx/
        └── nginx.conf                      ← Config nginx compartilhada
```

---

## 📝 Notas Importantes

1. **Nunca usar `getAccessToken()`** nas páginas da extensão para autenticar com o backend. Use sempre `getAppToken()`.

2. **Extension Secret** deve ser obtido no Marketplace a cada publicação/atualização da extensão.

3. **PATs têm validade**. Verificar e renovar periodicamente.

4. **Ao adicionar nova organização**, atualizar `AZURE_DEVOPS_ORG_PATS` no `/root/prod.env` e reiniciar o container.

5. **Migrations** são executadas automaticamente ao iniciar o container `api-aponta-prod`.

---

*Documento gerado em: 26 de Janeiro de 2026*
