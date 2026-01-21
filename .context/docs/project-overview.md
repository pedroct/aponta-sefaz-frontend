# Visao geral do projeto

## Proposito
Frontend do aplicativo de apontamento de horas no Azure DevOps. O projeto inclui uma extensao Azure DevOps que carrega o frontend em um iframe dentro do portal.

## Principais capacidades
- **Folha de Horas (Timesheet)**: Grid semanal com work items hierarquicos (Epic > Feature > Story > Task)
- **Gestao de Atividades**: CRUD completo de atividades com multi-select de projetos
- **Gestao de Projetos**: Sincronizacao com Azure DevOps
- **Extensao Azure DevOps**: 2 hubs (Timesheet + Atividades) com autenticacao JWT
- Componentes reutilizaveis estilo Azure DevOps em `client/src/components/ado`
- Componentes UI base em `client/src/components/ui`
- React Query para gerenciamento de estado e cache

## Stack
- React 18 + Vite 7 (client)
- TypeScript
- React Query (TanStack Query v5)
- Tailwind CSS
- Radix UI + shadcn/ui
- Wouter (roteamento)

## Estrutura de Pastas Principais
```
client/src/
├── components/
│   ├── ado/           # Componentes estilo Azure DevOps (ADOButton, ADOTable, etc)
│   ├── ui/            # Componentes base (shadcn/ui)
│   ├── layouts/       # PageLayout, etc
│   └── custom/        # Modais e componentes especificos
├── contexts/          # AzureDevOpsContext (autenticacao)
├── hooks/             # React Query hooks (useAtividades, useProjetos, useTimesheet)
├── pages/             # FolhaDeHoras, Atividades
└── lib/               # Utilitarios e tipos
```

## Rotas do Frontend
- `/` - Folha de Horas (Timesheet)
- `/atividades` - Gestao de Atividades

## Extensao Azure DevOps
- Publisher: `sefaz-ceara`
- ID: `aponta-projetos-staging` (staging) / `aponta-projetos` (producao)
- Versao: 1.0.9
- Hubs: Timesheet + Atividades

## Como iniciar
- `npm install`
- `npm run dev` (Vite dev server)
- `npm run build` (build de producao)
- `npm run test` (testes com Vitest)

## Observacoes
- Backend: FastAPI em https://staging-aponta.treit.com.br
- Autenticacao: JWT via VSS.getAppToken()
- Deploy: GitHub Actions (develop → staging, main → production)
