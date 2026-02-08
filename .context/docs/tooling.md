---
type: doc
name: tooling
description: Scripts, IDE settings, automation, and developer productivity tips
category: tooling
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Tooling & Productivity Guide

Ferramentas principais para desenvolvimento, testes e empacotamento da extensao.

## Required Tooling
- Node.js + npm.
- Vite.
- Playwright.
- Vitest.
- `tfx` (via `npx tfx`).

## Recommended Automation
- Dev server: `npm run dev`.
- Build: `npm run build`.
- Empacotar extensao: `npm run build:extension` e `npm run build:extension:prod`.
- Validacoes: `npm run validate:build` e `npm run validate:vsix`.

## IDE / Editor Setup
- VS Code com extensoes de TypeScript, ESLint (se usado) e Tailwind.
- Workspace: `fe-aponta.code-workspace`.

## Productivity Tips
- Use `npm run test:all` antes de releases.
- Para depurar E2E, use `npm run test:e2e:ui`.

## Related Resources
- [development-workflow.md](./development-workflow.md)
