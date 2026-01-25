# Aponta (Staging) – Visão Geral

Este documento resume objetivo, arquitetura e processo de deploy da extensão Aponta em staging. Ele deve ser referenciado pelo `vss-extension.staging.json` e oferece contexto para quem revisa cada pacote.

## Objetivo

O Aponta centraliza o apontamento de horas dos projetos de engenharia de software da SEFAZ Ceará dentro do Azure DevOps Boards. A versão de staging replica as funcionalidades de produção, permitindo validar correções (UI, SDK, tokens, telemetria etc.) antes da publicação no marketplace.

## Arquitetura em Alto Nível

- **Frontend**: aplicação React + Vite (`client/index.html` e `client/extension.html`). O build gera arquivos em `dist/public`, que são copiados para `extension/dist/public` durante o empacotamento.
- **Acesso à API**: todas as chamadas REST usam `useAzureContext()`, que injeta token, organização e projeto oriundos do frame do Azure DevOps.
- **Superfícies no Azure DevOps**:
  - `pages/timesheet/index.html` – hub de Folha de Horas.
  - `pages/atividades/index.html` – gestão de atividades.
  - `pages/workitem/index.html` – grupo na tela do Work Item com o histórico.
  - `pages/apontar-dialog/index.html` – diálogo exibido ao clicar em “Apontar Tempo”.
- **Contrato Compartilhado**: modelos TypeScript ficam em `shared/schema.ts` para garantir consistência entre as telas.

## Fluxo de Build e Empacotamento

1. `npm run type-check` – valida a superfície TypeScript.
2. `npm run test:run -- --passWithNoTests` – executa os testes Vitest.
3. `npm run build` – gera o bundle de produção em `dist/public`.
4. Copiar `dist/public` para `extension/dist/public` e garantir a presença de `icon.png`.
5. Incrementar `version` em `extension/vss-extension.staging.json`.
6. `npm run create:vsix` – produz `extension/vsix/sefaz-ceara.aponta-projetos-staging-<versao>.vsix` e valida os HTMLs.

## Deploy em Staging

Commits em `develop` disparam `.github/workflows/deploy-staging.yml`, que:

- Executa type check e testes.
- Sincroniza o repositório (excluindo pastas pesadas) para a VM de staging definida pelos segredos `VPS_*`.
- Reconstrói o container `frontend` com `docker compose up -d --build --force-recreate --no-deps frontend`.
- Faz health check (`curl -sf http://localhost/health`).

Após o workflow, publicar manualmente o VSIX recém-gerado no marketplace (compartilhamento privado) para que a organização de staging instale a mesma versão do código implantado.

## Checklist de Testes Antes do Publish

- [ ] Folha de Horas exibe dados filtrados pelo usuário autenticado (`useTimesheet` envia `user_email`).
- [ ] Dialog do Work Item obtém token (`VSS.getAccessToken`) e registra horas com os novos logs.
- [ ] CRUD de atividades funciona contra a API (Create, Update, Delete via React Query).
- [ ] Script `validate:vsix` lista todos os HTMLs sem erro.

## Comandos Úteis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor Vite local na porta 5000. |
| `npm run build:extension` | Build + empacota toda a extensão. |
| `npm run validate:vsix` | Lista HTMLs presentes no VSIX mais recente. |
| `node scripts/move-vsix.js` | Move VSIX do diretório raiz para `extension/vsix/`. |

## Referências

- Manifesto: `extension/vss-extension.staging.json`
- Workflow: `.github/workflows/deploy-staging.yml`
- Índice de docs: `docs/FILES_INDEX.md`

Atualize esta visão sempre que surgirem novas superfícies, alterações de deploy ou ajustes no checklist de revisão.
