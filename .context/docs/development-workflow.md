---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Development Workflow

Fluxo diario com npm, Vite e testes automatizados. Deploy via GitHub Actions com staging antes de producao.

## Branching & Releases
- Validar staging antes de promover producao.
- Deploy somente via GitHub Actions (sem deploy manual).

## Local Development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

- Porta padrao do dev server: 5000.
- Variavel local: `VITE_API_URL=http://localhost:8000/api/v1`.

## Code Review Expectations
- `npm run test:run` e `npm run test:e2e` antes do PR.
- Usar Conventional Commits.
- Manter docs relevantes em `docs/`.

## Onboarding Tasks
- Ler `docs/CODEX_RULES.md` e `docs/AGENTS.md`.
- Ler `docs/README.md`.

## Related Resources
- [testing-strategy.md](./testing-strategy.md)
- [tooling.md](./tooling.md)
