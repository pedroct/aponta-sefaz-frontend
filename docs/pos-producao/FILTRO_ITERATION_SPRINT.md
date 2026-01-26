# Filtro por Iteration (Sprint) - Tela Gestão de Apontamentos

## 📋 Visão Geral

Este documento descreve a implementação de um filtro por **Iteration (Sprint)** na tela de Gestão de Apontamentos (Folha de Horas). O objetivo é permitir que o usuário filtre os Work Items exibidos com base na Sprint/Iteration selecionada.

**Data:** 26/01/2026  
**Versão:** 1.1.0  
**Status:** Planejamento

---

## 🎯 Objetivo

Adicionar um seletor de Iteration/Sprint na interface da Folha de Horas, permitindo:

1. **Listar** todas as Iterations disponíveis do projeto (passadas, atual e futuras)
2. **Selecionar automaticamente** a Sprint atual ao carregar a página
3. **Filtrar** Work Items pela Iteration selecionada
4. **Manter** compatibilidade com o filtro de semana existente
5. **Otimizar** a visualização para sprints específicas

---

## 🚀 Comportamento Esperado

### Ao Carregar a Página

1. **Buscar todas as Iterations** do projeto via API
2. **Identificar a Sprint atual** (`timeFrame: "current"`)
3. **Selecionar automaticamente** a Sprint atual no dropdown
4. **Carregar os Work Items** filtrados pela Sprint atual

### Opções do Seletor

| Opção | Descrição |
|-------|-----------|
| 🔵 **Sprint Atual** | Pré-selecionada automaticamente |
| ⚪ Sprints Passadas | Listadas em ordem cronológica decrescente |
| ⚪ Sprints Futuras | Listadas em ordem cronológica crescente |
| ⚪ **Todas** | Exibe todos os Work Items (sem filtro de Sprint) |

### Agrupamento Visual no Dropdown

```
┌─────────────────────────────────┐
│ 🔵 Sprint 5 (20/01 - 02/02) ← atual
├─────────────────────────────────┤
│ ── Futuras ──                   │
│    Sprint 6 (03/02 - 16/02)     │
│    Sprint 7 (17/02 - 02/03)     │
├─────────────────────────────────┤
│ ── Passadas ──                  │
│    Sprint 4 (06/01 - 19/01)     │
│    Sprint 3 (23/12 - 05/01)     │
├─────────────────────────────────┤
│ ── Todas as Sprints ──          │
└─────────────────────────────────┘
```

---

## 📚 APIs do Azure DevOps

### 1. Listar Iterations (Sprints)

**Endpoint:** `GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations`

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `organization` | string | ✅ | Nome da organização |
| `project` | string | ✅ | ID ou nome do projeto |
| `team` | string | ❌ | ID ou nome do time (opcional, usa time padrão se omitido) |
| `$timeframe` | string | ❌ | Filtro: apenas `current` é suportado atualmente |
| `api-version` | string | ✅ | `7.2-preview.1` |

> ⚠️ **Importante:** O parâmetro `$timeframe` só suporta `current` atualmente. Para obter todas as sprints (passadas, atuais e futuras), **não passar** o parâmetro `$timeframe`.

**Estratégia de Chamadas:**

```
1ª Chamada (sem $timeframe): Lista TODAS as iterations
   GET .../_apis/work/teamsettings/iterations?api-version=7.2-preview.1
   
   Resposta inclui o campo "attributes.timeFrame" para cada iteration:
   - "past" = Sprint passada
   - "current" = Sprint atual ← usar para pré-selecionar
   - "future" = Sprint futura
```

**Exemplo de Request (todas as sprints):**
```http
GET https://dev.azure.com/sefaz-ceara/CESINF-DTE2/_apis/work/teamsettings/iterations?api-version=7.2-preview.1
```

**Exemplo de Response:**
```json
{
  "count": 5,
  "value": [
    {
      "id": "a589a806-bf11-4d4f-a031-c19813331551",
      "name": "Sprint 3",
      "path": "CESINF-DTE2\\Iteration\\Sprint 3",
      "attributes": {
        "startDate": "2025-12-23T00:00:00Z",
        "finishDate": "2026-01-05T00:00:00Z",
        "timeFrame": "past"
      },
      "url": "https://dev.azure.com/sefaz-ceara/..."
    },
    {
      "id": "a589a806-bf11-4d4f-a031-c19813331552",
      "name": "Sprint 4",
      "path": "CESINF-DTE2\\Iteration\\Sprint 4",
      "attributes": {
        "startDate": "2026-01-06T00:00:00Z",
        "finishDate": "2026-01-19T00:00:00Z",
        "timeFrame": "past"
      },
      "url": "https://dev.azure.com/sefaz-ceara/..."
    },
    {
      "id": "b589a806-bf11-4d4f-a031-c19813331553",
      "name": "Sprint 5",
      "path": "CESINF-DTE2\\Iteration\\Sprint 5",
      "attributes": {
        "startDate": "2026-01-20T00:00:00Z",
        "finishDate": "2026-02-02T00:00:00Z",
        "timeFrame": "current"
      },
      "url": "https://dev.azure.com/sefaz-ceara/..."
    },
    {
      "id": "c589a806-bf11-4d4f-a031-c19813331554",
      "name": "Sprint 6",
      "path": "CESINF-DTE2\\Iteration\\Sprint 6",
      "attributes": {
        "startDate": "2026-02-03T00:00:00Z",
        "finishDate": "2026-02-16T00:00:00Z",
        "timeFrame": "future"
      },
      "url": "https://dev.azure.com/sefaz-ceara/..."
    }
  ]
}
```

**Tipo de Resposta: `TeamSettingsIteration[]`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string (uuid) | ID único da iteration |
| `name` | string | Nome da iteration (ex: "Sprint 5") |
| `path` | string | Caminho completo (ex: "Project\\Iteration\\Sprint 5") |
| `attributes.startDate` | datetime | Data de início (pode ser `null`) |
| `attributes.finishDate` | datetime | Data de fim (pode ser `null`) |
| `attributes.timeFrame` | enum | `past`, `current`, `future` |
| `url` | string | URL da API |

**Enum `TimeFrame`:**

| Valor | Descrição |
|-------|-----------|
| `past` | Sprint já encerrada |
| `current` | Sprint em andamento (baseado nas datas) |
| `future` | Sprint ainda não iniciada |

---

### 2. Obter Work Items de uma Iteration

**Endpoint:** `GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/workitems`

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `organization` | string | ✅ | Nome da organização |
| `project` | string | ✅ | ID ou nome do projeto |
| `team` | string | ❌ | ID ou nome do time |
| `iterationId` | string (uuid) | ✅ | ID da iteration |
| `api-version` | string | ✅ | `7.2-preview.1` |

**Exemplo de Request:**
```http
GET https://dev.azure.com/sefaz-ceara/CESINF-DTE2/_apis/work/teamsettings/iterations/a589a806-bf11-4d4f-a031-c19813331553/workitems?api-version=7.2-preview.1
```

**Exemplo de Response:**
```json
{
  "workItemRelations": [
    {
      "rel": null,
      "source": null,
      "target": {
        "id": 1234,
        "url": "https://dev.azure.com/sefaz-ceara/_apis/wit/workItems/1234"
      }
    },
    {
      "rel": "System.LinkTypes.Hierarchy-Forward",
      "source": {
        "id": 1234,
        "url": "https://dev.azure.com/sefaz-ceara/_apis/wit/workItems/1234"
      },
      "target": {
        "id": 5678,
        "url": "https://dev.azure.com/sefaz-ceara/_apis/wit/workItems/5678"
      }
    }
  ],
  "url": "https://dev.azure.com/sefaz-ceara/...",
  "_links": {
    "self": { "href": "..." },
    "iteration": { "href": "..." }
  }
}
```

**Tipo de Resposta: `IterationWorkItems`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `workItemRelations` | WorkItemLink[] | Lista de relações de work items |
| `url` | string | URL da API |
| `_links` | object | Links relacionados |

**WorkItemLink:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `rel` | string | Tipo do link (`null` = root, `System.LinkTypes.Hierarchy-Forward` = filho) |
| `source` | WorkItemReference | Work item pai |
| `target` | WorkItemReference | Work item alvo |

**WorkItemReference:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID do Work Item |
| `url` | string | URL da API do Work Item |

---

## 🔧 Escopo de Permissão

Para acessar estas APIs é necessário o escopo:

```
vso.work - Grants the ability to read work items, queries, boards, 
           area and iterations paths, and other work item tracking 
           related metadata.
```

O PAT atual já possui este escopo configurado.

---

## 🏗️ Arquitetura Proposta

### Backend (api-aponta-vps)

#### 1. Novo Endpoint: Listar Iterations

**Arquivo:** `app/routers/iterations.py` (novo)

```python
@router.get("/iterations")
async def list_iterations(
    organization_name: str = Query(...),
    project_id: str = Query(...),
    team_id: str = Query(None),
    timeframe: str = Query(None, regex="^(past|current|future)$"),
) -> list[IterationResponse]:
    """Lista todas as iterations do projeto."""
    pass
```

#### 2. Modificar Endpoint: Get Timesheet

**Arquivo:** `app/routers/timesheet.py`

Adicionar parâmetro opcional `iteration_id`:

```python
@router.get("")
async def get_timesheet(
    organization_name: str = Query(...),
    project_id: str = Query(...),
    week_start: date | None = Query(None),
    iteration_id: str | None = Query(None, description="ID da Iteration para filtrar"),
    # ...
) -> TimesheetResponse:
    pass
```

#### 3. Novo Serviço: IterationService

**Arquivo:** `app/services/iteration_service.py` (novo)

```python
class IterationService:
    async def list_iterations(
        self, organization: str, project: str, team: str = None
    ) -> list[dict]:
        """Busca iterations do Azure DevOps."""
        pass
    
    async def get_iteration_work_items(
        self, organization: str, project: str, iteration_id: str
    ) -> list[int]:
        """Retorna IDs dos work items de uma iteration."""
        pass
```

#### 4. Novos Schemas

**Arquivo:** `app/schemas/iteration.py` (novo)

```python
class IterationAttributes(BaseModel):
    start_date: datetime | None
    finish_date: datetime | None
    time_frame: str | None  # past, current, future

class IterationResponse(BaseModel):
    id: str
    name: str
    path: str | None
    attributes: IterationAttributes
```

---

### Frontend (fe-aponta)

#### 1. Novo Hook: useIterations

**Arquivo:** `client/src/hooks/use-iterations.ts` (novo)

```typescript
export function useIterations(params: IterationsParams) {
  return useQuery({
    queryKey: ["iterations", organization, project],
    queryFn: async () => api.get<Iteration[]>("/iterations", params),
  });
}
```

#### 2. Modificar Hook: useTimesheet

**Arquivo:** `client/src/hooks/use-timesheet.ts`

Adicionar `iteration_id` opcional aos parâmetros:

```typescript
export interface TimesheetParams {
  organization_name: string;
  project_id: string;
  week_start?: string;
  iteration_id?: string;  // NOVO
}
```

#### 3. Novo Componente: IterationSelector

**Arquivo:** `client/src/components/custom/IterationSelector.tsx` (novo)

```typescript
interface Iteration {
  id: string;
  name: string;
  path: string | null;
  attributes: {
    startDate: string | null;
    finishDate: string | null;
    timeFrame: "past" | "current" | "future";
  };
}

interface IterationSelectorProps {
  value: string | null;  // null = "Todas"
  onChange: (iterationId: string | null) => void;
  iterations: Iteration[];
  isLoading: boolean;
}

export function IterationSelector({
  value,
  onChange,
  iterations,
  isLoading,
}: IterationSelectorProps) {
  // Agrupar por timeFrame
  const currentIteration = iterations.find(it => it.attributes.timeFrame === "current");
  const pastIterations = iterations
    .filter(it => it.attributes.timeFrame === "past")
    .sort((a, b) => new Date(b.attributes.startDate!).getTime() - new Date(a.attributes.startDate!).getTime());
  const futureIterations = iterations
    .filter(it => it.attributes.timeFrame === "future")
    .sort((a, b) => new Date(a.attributes.startDate!).getTime() - new Date(b.attributes.startDate!).getTime());

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return "";
    return `(${format(new Date(start), "dd/MM")} - ${format(new Date(end), "dd/MM")})`;
  };

  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === "" ? null : v)}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione uma Sprint" />
      </SelectTrigger>
      <SelectContent>
        {/* Sprint Atual - Destaque */}
        {currentIteration && (
          <SelectItem value={currentIteration.id} className="font-medium text-blue-600">
            🔵 {currentIteration.name} {formatDateRange(
              currentIteration.attributes.startDate,
              currentIteration.attributes.finishDate
            )} (Atual)
          </SelectItem>
        )}
        
        <SelectSeparator />
        
        {/* Sprints Futuras */}
        {futureIterations.length > 0 && (
          <>
            <SelectLabel className="text-xs text-muted-foreground">Futuras</SelectLabel>
            {futureIterations.map(it => (
              <SelectItem key={it.id} value={it.id}>
                {it.name} {formatDateRange(it.attributes.startDate, it.attributes.finishDate)}
              </SelectItem>
            ))}
            <SelectSeparator />
          </>
        )}
        
        {/* Sprints Passadas */}
        {pastIterations.length > 0 && (
          <>
            <SelectLabel className="text-xs text-muted-foreground">Passadas</SelectLabel>
            {pastIterations.map(it => (
              <SelectItem key={it.id} value={it.id}>
                {it.name} {formatDateRange(it.attributes.startDate, it.attributes.finishDate)}
              </SelectItem>
            ))}
            <SelectSeparator />
          </>
        )}
        
        {/* Opção "Todas" */}
        <SelectItem value="">
          📋 Todas as Sprints
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
```

#### 4. Modificar Página: FolhaDeHoras

**Arquivo:** `client/src/pages/FolhaDeHoras.tsx`

Adicionar seletor de Iteration no header, ao lado da navegação de semanas.

**Lógica de Inicialização:**

```typescript
export default function FolhaDeHoras() {
  // Estado do filtro de Iteration
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Buscar iterations
  const { data: iterations = [], isLoading: isLoadingIterations } = useIterations({
    organization_name: organization,
    project_id: project,
  });

  // Auto-selecionar Sprint atual na primeira carga
  useEffect(() => {
    if (!isInitialized && iterations.length > 0) {
      const currentSprint = iterations.find(it => it.attributes.timeFrame === "current");
      if (currentSprint) {
        setSelectedIterationId(currentSprint.id);
      }
      setIsInitialized(true);
    }
  }, [iterations, isInitialized]);

  // Buscar timesheet com filtro de iteration
  const { data: timesheet, isLoading } = useTimesheet({
    organization_name: organization,
    project_id: project,
    week_start: weekStartFormatted,
    iteration_id: selectedIterationId,  // Novo parâmetro
  });

  // Handler para mudança de Sprint
  const handleIterationChange = (iterationId: string | null) => {
    setSelectedIterationId(iterationId);
    // Opcional: ajustar week_start para a data de início da Sprint
    if (iterationId) {
      const iteration = iterations.find(it => it.id === iterationId);
      if (iteration?.attributes.startDate) {
        setCurrentDate(new Date(iteration.attributes.startDate));
      }
    }
  };

  return (
    <div>
      {/* Header com filtros */}
      <div className="flex items-center gap-4 mb-4">
        {/* Seletor de Sprint */}
        <IterationSelector
          value={selectedIterationId}
          onChange={handleIterationChange}
          iterations={iterations}
          isLoading={isLoadingIterations}
        />
        
        {/* Navegação de semanas existente */}
        <div className="flex items-center gap-2">
          <Button onClick={handlePrevWeek}><ChevronLeft /></Button>
          <span>{weekLabel}</span>
          <Button onClick={handleNextWeek}><ChevronRight /></Button>
          <Button onClick={handleGoToToday}>Hoje</Button>
        </div>
      </div>
      
      {/* Tabela de timesheet */}
      ...
    </div>
  );
}
```

---

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Frontend                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Usuário acessa FolhaDeHoras                                         │
│     └── useIterations() → GET /iterations                               │
│         └── Retorna lista com timeFrame para cada iteration             │
│                                                                          │
│  2. Identificar e pré-selecionar Sprint atual                           │
│     └── iterations.find(it => it.attributes.timeFrame === "current")    │
│     └── setSelectedIterationId(currentSprint.id)                        │
│                                                                          │
│  3. Carregar timesheet com filtro                                       │
│     └── useTimesheet({ iteration_id: selectedIterationId })             │
│                                                                          │
│  4. Usuário pode trocar Sprint no dropdown                              │
│     └── onChange → setSelectedIterationId(novoId)                       │
│     └── useTimesheet reexecuta com novo filtro                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Backend                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GET /iterations?organization_name=...&project_id=...                   │
│  └── IterationService.list_iterations()                                 │
│      └── GET dev.azure.com/.../teamsettings/iterations                  │
│      └── Retorna lista com timeFrame calculado automaticamente          │
│                                                                          │
│  GET /timesheet?iteration_id=uuid-...                                   │
│  └── TimesheetService.get_timesheet()                                   │
│      ├── SE iteration_id fornecido:                                     │
│      │   └── IterationService.get_iteration_work_items(iteration_id)    │
│      │       └── GET dev.azure.com/.../iterations/{id}/workitems        │
│      │       └── Extrai IDs: [1234, 5678, ...]                          │
│      │   └── Filtra work_items pelo conjunto de IDs da iteration        │
│      │                                                                   │
│      └── SE iteration_id NÃO fornecido:                                 │
│          └── Comportamento atual (todos os work items do usuário)       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Azure DevOps API                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Mockup da Interface

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Folha de Horas                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────┐   ◀ 20/01 - 26/01/2026 ▶  [Hoje]          │
│  │ 🔵 Sprint 5 (20/01 - 02/02) ▼│                                            │
│  └───────────────────────────────┘                                            │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Work Item              │ E │ H │ Seg │ Ter │ Qua │ Qui │ Sex │ Sáb │ Dom ││
│  ├────────────────────────┼───┼───┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤│
│  │ ▼ 📖 User Story #123   │ 8 │ 6 │     │     │     │     │     │     │     ││
│  │   └ 📋 Task #456       │ 4 │ 3 │ 2h  │ 1h  │     │     │     │     │     ││
│  │   └ 📋 Task #789       │ 4 │ 3 │     │ 2h  │ 1h  │     │     │     │     ││
│  │ ▶ 🐛 Bug #321          │ 2 │ 2 │     │     │ 2h  │     │     │     │     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Total: 4 work items da Sprint 5                                             │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌─── Dropdown Expandido ───────────────────────┐
│ 🔵 Sprint 5 (20/01 - 02/02)    ← Atual       │
├──────────────────────────────────────────────┤
│ Futuras                                       │
│   Sprint 6 (03/02 - 16/02)                   │
│   Sprint 7 (17/02 - 02/03)                   │
├──────────────────────────────────────────────┤
│ Passadas                                      │
│   Sprint 4 (06/01 - 19/01)                   │
│   Sprint 3 (23/12 - 05/01)                   │
│   Sprint 2 (09/12 - 22/12)                   │
├──────────────────────────────────────────────┤
│ 📋 Todas as Sprints                          │
└──────────────────────────────────────────────┘
```

---

## 📋 Regras de Negócio

### 1. Seleção Automática da Sprint Atual

| Cenário | Comportamento |
|---------|---------------|
| Existe Sprint com `timeFrame: "current"` | Pré-seleciona automaticamente |
| NÃO existe Sprint atual (gap entre sprints) | Seleciona "Todas as Sprints" |
| Projeto sem iterations configuradas | Exibe mensagem informativa, desabilita seletor |

### 2. Sincronização Sprint × Semana

| Ação do Usuário | Comportamento |
|-----------------|---------------|
| Seleciona nova Sprint | Navega automaticamente para a semana de início da Sprint |
| Navega para outra semana | Mantém filtro de Sprint (não muda automaticamente) |
| Seleciona "Todas as Sprints" | Mantém semana atual, remove filtro de Sprint |

### 3. Persistência de Estado

| Item | Persistir? | Storage |
|------|------------|---------|
| Sprint selecionada | ❌ Não | Sempre inicia na Sprint atual |
| Semana visualizada | ❌ Não | Sempre inicia na semana atual |
| Items expandidos | ✅ Sim | localStorage (já implementado) |

### 4. Casos de Borda

| Cenário | Tratamento |
|---------|------------|
| Sprint sem datas definidas | Exibe apenas o nome, sem período |
| API de iterations retorna erro | Oculta seletor, exibe todos os work items |
| Sprint selecionada é deletada | Volta para "Todas as Sprints" |
| Nenhum work item na Sprint | Exibe mensagem "Nenhum work item nesta Sprint" |

---

## ✅ Checklist de Implementação

### Backend

- [ ] Criar `app/schemas/iteration.py`
- [ ] Criar `app/services/iteration_service.py`
- [ ] Criar `app/routers/iterations.py`
- [ ] Registrar novo router em `app/main.py`
- [ ] Modificar `app/services/timesheet_service.py` para aceitar `iteration_id`
- [ ] Modificar `app/routers/timesheet.py` para aceitar `iteration_id`
- [ ] Adicionar testes unitários

### Frontend

- [ ] Criar tipos em `client/src/lib/iteration-types.ts`
- [ ] Criar `client/src/hooks/use-iterations.ts`
- [ ] Criar `client/src/components/custom/IterationSelector.tsx`
- [ ] Modificar `client/src/hooks/use-timesheet.ts`
- [ ] Modificar `client/src/lib/timesheet-types.ts`
- [ ] Modificar `client/src/pages/FolhaDeHoras.tsx`
- [ ] Adicionar testes

---

## 📈 Considerações de Performance

1. **Cache de Iterations**: As iterations mudam raramente. Usar `staleTime` alto (ex: 10 minutos)

2. **Filtro no Backend**: Filtrar work items no backend, não no frontend, para evitar tráfego desnecessário

3. **Paginação**: Se houver muitas iterations, considerar paginação ou limitar por timeframe

4. **Chamadas Paralelas**: `list_iterations` e `get_timesheet` podem ser chamados em paralelo se iteration_id não for passado inicialmente

---

## 🔗 Referências

- [Iterations - List](https://learn.microsoft.com/en-us/rest/api/azure/devops/work/iterations/list?view=azure-devops-rest-7.2)
- [Iterations - Get Iteration Work Items](https://learn.microsoft.com/en-us/rest/api/azure/devops/work/iterations/get-iteration-work-items?view=azure-devops-rest-7.2)
- [Work Items - Get Work Items Batch](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/get-work-items-batch)

---

## 📝 Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.1.0 | 26/01/2026 | Refinamento: comportamento de seleção automática da Sprint atual, regras de negócio, casos de borda, mockup detalhado do dropdown |
| 1.0.0 | 26/01/2026 | Documento inicial criado |
