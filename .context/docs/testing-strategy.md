---
type: doc
name: testing-strategy
description: Test frameworks, patterns, coverage requirements, and quality gates
category: testing
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Testing Strategy

Vitest para testes unitarios/integracao e Playwright para E2E.

## Test Types
- Unit/Integration: Vitest.
- E2E: Playwright.

## Running Tests

```bash
npm run test
npm run test:run
npm run test:coverage
npm run test:e2e
npm run test:all
```

## Quality Gates
- Rodar Vitest + Playwright antes de merge.
- Garantir build limpo com `npm run build`.

## Troubleshooting
- Se o E2E falhar, rode `npm run test:e2e:headed` para depurar.

## Related Resources
- [development-workflow.md](./development-workflow.md)
