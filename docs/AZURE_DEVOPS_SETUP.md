# Integração com Azure DevOps

## Setup Inicial

### 1. Instalar a Biblioteca

A biblioteca `azure-devops-node-api` já foi instalada via `npm install`.

### 2. Criar um Personal Access Token (PAT)

1. Acesse: https://dev.azure.com/{organization}/_usersSettings/tokens
2. Clique em "New Token"
3. Configure:
   - **Nome**: fe-aponta-integration
   - **Organização**: selecione sua organização
   - **Validade**: 1 ano (ou mais)
   - **Escopos**: 
     - Work Items (Leitura & Escrita)
     - Project & Team (Leitura)

4. Copie o token gerado

### 3. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env` ou ao environment do sistema:

```bash
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/{sua-organizacao}
AZURE_DEVOPS_PAT={seu-token-pessoal}
```

Exemplo:
```bash
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/mycompany
AZURE_DEVOPS_PAT=cbdeb34vzyuk5l4gxc4qfczn3lko3avfkfqyb47etahq6axpcqha
```

## Módulos Implementados

### 1. `azure-devops.ts`

Cliente wrapper para a API do Azure DevOps.

**Funções disponíveis:**

- `initializeAzureDevOps(config)` - Inicializar conexão
- `getWorkItem(projectId, workItemId)` - Obter um work item
- `getWorkItemFields(workItemId, fields?)` - Obter campos específicos
- `getWorkItemTimeInfo(workItemId)` - Obter informações de tempo (originalEstimate, remainingWork, completedWork)
- `updateWorkItem(workItemId, updates)` - Atualizar campos genéricos
- `updateWorkItemTime(workItemId, completedWork?, remainingWork?)` - Atualizar horas
- `queryWorkItems(projectId, wiql)` - Consultar work items com WIQL
- `listProjects()` - Listar projetos

### 2. `sync-service.ts`

Serviço de sincronização entre a API FastAPI e Azure DevOps.

**Funções disponíveis:**

- `syncApontamentoToAzure(workItemId, organizationName, projectId)` - Sincroniza um apontamento
- `syncAllApontamentosToAzure(organizationName, projectId)` - Sincroniza todos os apontamentos

## Como Usar

### Exemplo 1: Obter tempo de um work item

```typescript
import azureDevOps from './azure-devops';

azureDevOps.initializeAzureDevOps({
  organizationUrl: 'https://dev.azure.com/mycompany',
  personalAccessToken: 'seu-token'
});

const timeInfo = await azureDevOps.getWorkItemTimeInfo(123);
console.log(timeInfo);
// Output:
// {
//   originalEstimate: 8,
//   remainingWork: 3,
//   completedWork: 5
// }
```

### Exemplo 2: Atualizar horas de um work item

```typescript
const success = await azureDevOps.updateWorkItemTime(
  123,
  completedWork: 6,
  remainingWork: 2
);
```

### Exemplo 3: Sincronizar apontamentos

```typescript
import syncService from './sync-service';

const success = await syncService.syncApontamentoToAzure(
  123,
  'myorganization',
  'myproject'
);
```

## Campos Disponíveis para Atualização

Os campos que podem ser atualizados no Azure DevOps:

| Campo | API | Tipo | Descrição |
|-------|-----|------|-----------|
| Estimativa Original | `Microsoft.VSTS.Scheduling.OriginalEstimate` | number | Horas estimadas originalmente |
| Trabalho Restante | `Microsoft.VSTS.Scheduling.RemainingWork` | number | Horas restantes para completar |
| Trabalho Completado | `Microsoft.VSTS.Scheduling.CompletedWork` | number | Horas já completadas |

## Estrutura de Fluxo

```
ModalAdicionarTempo (Frontend)
         ↓
useCriarApontamento (React Hook)
         ↓
/api/apontamentos POST (Express Route)
         ↓
api-client.ts (Chamada para FastAPI 8001)
         ↓
FastAPI Backend (8001)
         ↓
Salva no banco de dados
         ↓
sync-service.ts (Sincronização automática)
         ↓
azure-devops.ts (Atualiza Azure DevOps)
```

## Próximos Passos

1. ✅ Biblioteca instalada
2. ✅ Módulos criados
3. ⏳ Integrar sincronização na rota de criação de apontamentos
4. ⏳ Implementar webhook para sincronização em tempo real
5. ⏳ Adicionar testes unitários

## Referências

- [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api)
- [Azure DevOps REST API Docs](https://docs.microsoft.com/en-us/rest/api/azure/devops)
- [Work Item Tracking API](https://docs.microsoft.com/en-us/rest/api/azure/devops/wit/work%20items)
