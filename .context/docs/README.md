# Documentation Index

Base de conhecimento do frontend. Comece pelo overview do projeto e siga para arquitetura, fluxo de dados e workflow.

## Core Guides
- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)

## Repository Snapshot
- `AGENTS.md` — contexto rapido para agentes.
- `.context/` — documentacao gerada pelo AI Coders Context.
- `client/` — aplicacao React (UI, hooks, pages).
- `shared/` — tipos e schemas compartilhados.
- `extension/` — artefatos da extensao Azure DevOps.
- `docs/` — documentacao operacional e tecnica.
- `scripts/` — scripts de build, validacao e utilitarios.
- `tests/` — testes (unit/integration).
- `testsprite_tests/` — testes automatizados auxiliares.
- `playwright.config.ts` — configuracao Playwright.
- `vitest.config.ts` — configuracao Vitest.
- `vite.config.ts` — configuracao Vite.
- `Dockerfile` — build de imagem.
- `docker-compose.yml` — compose local.
- `docker-compose.staging.yml` — compose staging.
- `docker-compose.prod.yml` — compose producao.
- `nginx.conf` — Nginx do container.
- `nginx-vps.conf` — Nginx para VPS.
- `package.json` — scripts e dependencias.

## Document Map
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | `project-overview.md` | docs/README.md, docs/AGENTS.md, docs/CODEX_RULES.md |
| Architecture Notes | `architecture.md` | docs/CODEX_RULES.md, docs/migration/* |
| Development Workflow | `development-workflow.md` | docs/DEVELOPMENT_GUIDE.md, package.json |
| Testing Strategy | `testing-strategy.md` | package.json, playwright.config.ts, vitest.config.ts |
| Glossary & Domain Concepts | `glossary.md` | docs/README.md, docs/migration/* |
| Data Flow & Integrations | `data-flow.md` | docs/FRONTEND_INTEGRATION_CONTEXT.md, docs/migration/* |
| Security & Compliance Notes | `security.md` | docs/CODEX_RULES.md |
| Tooling & Productivity Guide | `tooling.md` | package.json, scripts/* |
