---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Project Overview

fe-aponta e o frontend do sistema de apontamentos de tempo. A aplicacao e React + Vite, inclui interface web e artefatos para extensao Azure DevOps, e se integra com o backend via API configurada por `VITE_API_URL`.

## Codebase Reference

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts
- Root: `C:\Projetos\Azure\fe-aponta`
- Linguagens principais: TypeScript/TSX, CSS, Markdown, Shell
- Entrypoints: `client/src/main.tsx`, `client/src/extension-entry.tsx`, `vite.config.ts`
- Producao: `http://aponta.treit.com.br` (redirect para HTTPS)
- Staging: `https://staging-aponta.treit.com.br`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points
- `client/src/main.tsx` — bootstrap do app web.
- `client/src/extension-entry.tsx` — bootstrap da extensao Azure DevOps.
- `client/src/App.tsx` — componente raiz.
- `vite.config.ts` — configuracao do build.
- `Dockerfile` — build de imagem com Nginx.

## Key Exports
- Componentes UI em `client/src/components/`.
- Hooks de integracao em `client/src/hooks/`.
- Types e schema em `shared/schema.ts`.

## File Structure & Code Organization
- `client/` — aplicacao React.
- `client/src/pages/` — paginas e rotas.
- `client/src/components/` — componentes reutilizaveis.
- `client/src/hooks/` — hooks de dados e integracao.
- `client/src/lib/` — utilitarios.
- `client/src/contexts/` — contextos React.
- `shared/` — tipos compartilhados.
- `extension/` — manifests e assets da extensao.
- `docs/` — documentacao e guias.
- `scripts/` — scripts de build e validacao.
- `tests/` — testes.

## Technology Stack Summary
- React 19 + Vite + TypeScript.
- Tailwind CSS + shadcn/ui.
- TanStack Query, React Hook Form, Zod.
- Vitest (unit/integration) e Playwright (E2E).
- Nginx em container.

## Core Framework Stack
- React para UI.
- Vite para build e dev server.

## UI & Interaction Libraries
- Radix UI, lucide-react, framer-motion.

## Development Tools Overview
- Node.js + npm.
- `npx tfx` para empacotar extensao.
- Playwright e Vitest para testes.

## Getting Started Checklist
1. Rode `npm install`.
2. Crie `.env.local` com `VITE_API_URL=http://localhost:8000/api/v1`.
3. Inicie o ambiente com `npm run dev` (porta 5000).
4. Para build, rode `npm run build`.

## Next Steps
- Leitura obrigatoria: `docs/CODEX_RULES.md`.
- Leia `docs/AGENTS.md` e `docs/README.md`.
- Consulte `docs/migration/` para contexto de migracao.

## Related Resources
- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
- [codebase-map.json](./codebase-map.json)
