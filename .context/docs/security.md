---
type: doc
name: security
description: Security policies, authentication, secrets management, and compliance requirements
category: security
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Security & Compliance Notes

Frontend sem secrets no codigo-fonte. Configuracoes sensiveis ficam em `.env.local`.

## Authentication & Authorization
- A autenticacao e responsabilidade do backend.
- O frontend consome a API via `VITE_API_URL`.

## Secrets & Sensitive Data
- Nao commitar `.env` ou `.env.local`.
- Em staging/prod, `VITE_API_URL=/api/v1`.

## Compliance & Policies
- Sem requisitos formais de compliance documentados.

## Incident Response
- Ver contatos em `docs/CODEX_RULES.md` quando aplicavel.

## Related Resources
- [architecture.md](./architecture.md)
