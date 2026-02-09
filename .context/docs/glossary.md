---
type: doc
name: glossary
description: Project terminology, type definitions, domain entities, and business rules
category: glossary
generated: 2026-02-08
status: filled
scaffoldVersion: "2.0.0"
---
## Glossary & Domain Concepts

Termos principais do dominio de apontamentos de tempo.

## Type Definitions
- Types e schemas em `shared/schema.ts`.

## Enumerations
- Enumerations proximas aos schemas e tipos em `shared/`.

## Core Terms
- Apontamento: registro de horas trabalhadas.
- Atividade: unidade de trabalho.
- Projeto: agrupador de atividades.
- Timesheet: visao agregada por periodo.
- Work Item: item de trabalho no Azure DevOps.
- Iteracao: ciclo/sprint no Azure DevOps.

## Acronyms & Abbreviations
- ADO: Azure DevOps.
- PAT: Personal Access Token.
- UI: User Interface.

## Personas / Actors
- Usuario final que registra apontamentos.
- Gestor que acompanha timesheet.

## Domain Rules & Invariants
- A UI depende da API em `VITE_API_URL`.

## Related Resources
- [project-overview.md](./project-overview.md)
