# Arquitetura

## Visão Geral

O projeto é um monorepo com client React e server Express. Em dev, o Express cria um server HTTP e injeta o Vite em modo middleware. Em produção, **nginx** serve os arquivos estáticos (SPA).

## Camadas

- **Client**: `client/src` com React, rotas via Wouter, estado local e React Query.
- **Server**: Backend separado (api-aponta-vps) em FastAPI/Python.
- **Shared**: `shared/schema.ts` com tipos compartilhados.

## Componentes Chave

- `client/src/App.tsx`: rotas e providers
- `client/src/pages/FolhaDeHoras.tsx`: tela principal de apontamentos
- `client/src/lib/queryClient.ts`: wrapper de fetch e React Query
- `client/src/hooks/use-*.ts`: hooks customizados (atividades, timesheet, etc.)

## Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────┐
│                        VPS                               │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │   nginx:alpine  │       │  python:3.12    │          │
│  │   (frontend)    │──────▶│  (backend API)  │          │
│  │   porta 80      │  /api │  porta 8000     │          │
│  └─────────────────┘       └─────────────────┘          │
│           │                         │                    │
│           └────────┬────────────────┘                    │
│                    │                                     │
│         aponta-shared-network                            │
└─────────────────────────────────────────────────────────┘
```

## Comunicação

1. **Browser** → nginx (porta 3001 staging / 3000 prod)
2. **nginx** → arquivos estáticos (SPA React)
3. **nginx** → proxy `/api/*` → backend (porta 8000)
4. **Backend** → Supabase (banco de dados)
5. **Backend** → Azure DevOps API (work items)

## Decisões e Padrões

- **SPA**: Single Page Application servida por nginx
- **API Proxy**: nginx faz proxy de `/api` para o backend
- **Containers Separados**: Frontend e backend são containers independentes
- **Rede Compartilhada**: Comunicação via Docker network

## Ambientes

| Ambiente | Frontend | Backend |
|----------|----------|---------|
| Staging | `fe-aponta-staging` | `api-aponta-staging` |
| Production | `fe-aponta-prod` | `api-aponta-prod` |

## Riscos e Trade-offs

- Backend deve estar rodando para `/api` funcionar
- nginx.conf deve usar nome do serviço Docker (`api`), não `localhost`
- Health checks dependem do curl (não wget) no nginx:alpine

---

**Última atualização**: 21 de janeiro de 2026
