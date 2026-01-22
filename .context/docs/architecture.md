# Arquitetura

## Visão Geral

Frontend React para apontamento de horas, embarcado como extensão Azure DevOps. O backend é uma API separada em FastAPI/Python.

## Arquitetura Geral

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Azure DevOps Portal                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Extensão Aponta (Hub Group)                        │  │
│  │  ┌────────────────────┐  ┌────────────────────┐                      │  │
│  │  │ Hub: Timesheet     │  │ Hub: Atividades    │                      │  │
│  │  │ (timesheet.html)   │  │ (atividades.html)  │                      │  │
│  │  └────────┬───────────┘  └────────┬───────────┘                      │  │
│  │           │                       │                                   │  │
│  │           │    VSS.getAppToken() → JWT                               │  │
│  │           │    VSS.getWebContext() → org, project, user              │  │
│  │           │                       │                                   │  │
│  │           └───────────┬───────────┘                                   │  │
│  │                       │                                               │  │
│  │                       ▼                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │                  iframe (Frontend React)                      │   │  │
│  │  │                                                               │   │  │
│  │  │   URL: https://staging-aponta.treit.com.br?token=...         │   │  │
│  │  │        &organization=...&project=...&userId=...&userName=... │   │  │
│  │  │                                                               │   │  │
│  │  │   Rotas:                                                      │   │  │
│  │  │   - /          → FolhaDeHoras.tsx (Timesheet)                │   │  │
│  │  │   - /atividades → Atividades.tsx (CRUD)                      │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Authorization: Bearer <JWT>
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          VPS (Docker Compose)                               │
│                                                                             │
│  ┌─────────────────────┐           ┌─────────────────────┐                │
│  │   nginx:alpine      │           │   python:3.12       │                │
│  │   (frontend)        │──────────▶│   (FastAPI backend) │                │
│  │   porta 3001        │   /api    │   porta 8000        │                │
│  └─────────────────────┘           └─────────────────────┘                │
│                                              │                             │
│                                              ▼                             │
│                                    ┌─────────────────────┐                │
│                                    │     Supabase        │                │
│                                    │   (PostgreSQL)      │                │
│                                    └─────────────────────┘                │
└────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              │ PAT (Basic Auth)
                                              ▼
                                ┌─────────────────────────────┐
                                │    Azure DevOps REST API    │
                                │    - Work Items             │
                                │    - Projects               │
                                │    - User Profiles          │
                                └─────────────────────────────┘
```

## Camadas do Frontend

```
client/src/
├── components/
│   ├── ado/              # Componentes estilo Azure DevOps
│   │   ├── ADOButton     # Botões primários/secundários
│   │   ├── ADOCard       # Cards com sombra
│   │   ├── ADOHeader     # Cabeçalho de página
│   │   ├── ADOInput      # Inputs com label
│   │   ├── ADOModal      # Modais
│   │   ├── ADOMultiSelect# Select múltiplo
│   │   ├── ADOTable      # Tabelas com ações
│   │   └── ADOToolbar    # Barra de ferramentas
│   │
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── layouts/          # PageLayout
│   └── custom/           # Modais específicos
│
├── contexts/
│   └── AzureDevOpsContext  # Autenticação e API client
│
├── hooks/
│   ├── use-atividades.ts   # CRUD atividades
│   ├── use-projetos.ts     # Lista/Sync projetos
│   ├── use-timesheet.ts    # Timesheet semanal
│   └── use-current-user.ts # Dados do usuário
│
├── pages/
│   ├── FolhaDeHoras.tsx    # Grid semanal
│   └── Atividades.tsx      # CRUD atividades
│
└── lib/
    ├── api-client.ts       # Fetch wrapper
    └── timesheet-types.ts  # Tipos do timesheet
```

## Fluxo de Autenticação

```
1. Usuário acessa Azure DevOps → Hub Aponta
2. timesheet.html/atividades.html executa:
   - VSS.init()
   - VSS.getAppToken() → JWT assinado com secret da extensão
   - VSS.getWebContext() → org, project, user
3. Monta URL com parâmetros e carrega iframe
4. Frontend React lê parâmetros via AzureDevOpsContext
5. Requisições à API incluem: Authorization: Bearer <JWT>
6. Backend valida JWT com AZURE_EXTENSION_SECRET
7. Backend usa PAT para chamar Azure DevOps API
```

## Componentes Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `App.tsx` | Rotas e providers |
| `FolhaDeHoras.tsx` | Grid semanal de apontamentos |
| `Atividades.tsx` | CRUD de atividades |
| `AzureDevOpsContext.tsx` | Token, org, project, API client |
| `use-timesheet.ts` | Queries do timesheet |
| `use-atividades.ts` | Queries/mutations de atividades |

## Estrutura do Timesheet (Colunas)

| Coluna | Campo | Cor | Descrição |
|--------|-------|-----|-----------|
| **ESCOPO DE TRABALHO** | `title` | - | Título do Work Item (hierárquico) |
| **E** | `original_estimate` | 🔵 Azul `#0078D4` | Esforço estimado (Original Estimate) |
| **H** | `total_semana_horas` | 🟢 Verde `#107C10` | Histórico - Total da semana |
| **S** | `remaining_work` | Dinâmico* | Saldo - Trabalho restante |
| **SEG-DOM** | `dias[0-6]` | - | Células de apontamento por dia |
| **SEMANAL Σ** | soma | - | Total semanal de horas |

**\* Cores do Saldo (S):**
- 🟢 Verde `#107C10`: S = 0 (completou o estimado)
- 🟠 Laranja `#FF8C00`: S > 0 (pendente)
- 🔴 Vermelho `#D13438`: S < 0 (excedeu estimativa)

## Ambientes

| Ambiente | Frontend URL | Backend URL | Extensão |
|----------|--------------|-------------|----------|
| Staging | staging-aponta.treit.com.br | :3001/api | sefaz-ceara.aponta-projetos-staging |
| Production | aponta.treit.com.br | :3000/api | sefaz-ceara.aponta-projetos |

## Decisões Arquiteturais

1. **Iframe**: Azure DevOps carrega o frontend via iframe para isolamento
2. **JWT (getAppToken)**: Autenticação validável pelo backend próprio
3. **React Query**: Cache e sincronização de estado com servidor
4. **Componentes ADO**: UI consistente com Azure DevOps
5. **Hooks separados**: Cada entidade tem seu próprio hook

---

**Última atualização**: 22 de janeiro de 2026
**Versão**: 2.1
