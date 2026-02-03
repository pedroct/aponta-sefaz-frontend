# AGENTS.md - Frontend Aponta

## Regras para Codex

- Documento: `docs/CODEX_RULES.md`

## Dev environment tips
- Instale dependências com `npm install`.
- Use `npm run dev` para ambiente local (porta 5000).
- Use `npm run build` antes de abrir PR.

## Testing instructions
- Execute `npm run test` para modo interativo.
- Use `npm run test:run` para simular o CI.
- Use `npm run test:e2e` para testes E2E (Playwright).
- Use `npm run test:all` para rodar Vitest + Playwright.
- Adicione ou atualize testes ao mudar lógica crítica.

## PR instructions
- Siga Conventional Commits (ex.: `feat(ui): ajusta layout`).
- Mantenha docs relevantes atualizadas quando alterar fluxo de deploy.

## Repository map
- `client/` — aplicação React (UI e integrações)
- `docs/` — documentação operacional e técnica
- `nginx.conf` — Nginx do container (inclui `/health`)
- `docker-compose*.yml` — compose local/staging/prod
