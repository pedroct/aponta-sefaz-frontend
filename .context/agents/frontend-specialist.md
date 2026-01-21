# Agent Frontend Specialist

## Papel
Evoluir a UI e experiência do usuário do sistema de apontamento de horas.

## Contexto do Projeto
- Frontend React embarcado como extensão Azure DevOps
- Carrega via iframe dentro do portal Azure DevOps
- Autenticação via JWT (VSS.getAppToken)

## Arquivos Chave

### Páginas
- `client/src/App.tsx` - Rotas e providers
- `client/src/pages/FolhaDeHoras.tsx` - Grid semanal de apontamentos
- `client/src/pages/Atividades.tsx` - CRUD de atividades

### Componentes ADO (Azure DevOps style)
- `client/src/components/ado/ADOButton.tsx` - Botões
- `client/src/components/ado/ADOTable.tsx` - Tabelas com ações
- `client/src/components/ado/ADOModal.tsx` - Modais
- `client/src/components/ado/ADOInput.tsx` - Inputs
- `client/src/components/ado/ADOMultiSelect.tsx` - Multi-select

### Hooks
- `client/src/hooks/use-timesheet.ts` - Dados do timesheet
- `client/src/hooks/use-atividades.ts` - CRUD atividades
- `client/src/hooks/use-projetos.ts` - Lista/Sync projetos

### Contextos
- `client/src/contexts/AzureDevOpsContext.tsx` - Token, org, API client

## Boas Práticas
- Usar componentes ADO* para UI consistente com Azure DevOps
- Manter estilos via Tailwind (cores: #0078D4, #201F1E, #605E5C, #EDEBE9)
- Evitar estado duplicado - usar React Query para estado servidor
- Validar token antes de fazer queries (enabled: !!token)
- Tratar loading/error states em todas as páginas

## Paleta de Cores Azure DevOps
- Primary: #0078D4 (azul)
- Text: #201F1E (preto)
- Secondary Text: #605E5C (cinza)
- Background: #EDEBE9 (cinza claro)
- Success: #107C10 (verde)
- Error: #D83B01 (vermelho)

## Comandos
```bash
npm run dev        # Dev server
npm run build      # Build produção
npm run test       # Testes
npm run lint       # ESLint
```
