# Implementação - Coluna "S" (Saldo) no Timesheet

## Status: ✅ CONCLUÍDO + CORES SEMÂNTICAS

**Data:** 22 de janeiro de 2026  
**Commits:**
- `589d584` - feat(timesheet): adicionar coluna S (Saldo) na grade semanal
- `7ea9bc9` - feat(timesheet): cores semânticas para colunas E, H, S com saldo dinâmico

**Deploy:** Staging (automático via GitHub Actions)

---

## Objetivo

Adicionar a coluna **S (Saldo)** entre as colunas **H (Histórico)** e **SEG (Segunda-feira)** na grade do timesheet, exibindo o campo `remaining_work` retornado pelo backend.

**Melhoria UX:** Implementar cores semânticas para as colunas E, H e S, com cor dinâmica para o saldo baseada no valor.

---

## Contexto

O backend já retorna o campo `remaining_work` em cada Work Item no endpoint `/api/v1/timesheet`. Este campo representa o trabalho restante calculado como:

```
remaining_work = original_estimate - completed_work
```

---

## Estrutura de Colunas (Atualizada)

| Posição | Coluna | Campo | Descrição |
|---------|--------|-------|-----------|
| 1 | **ESCOPO DE TRABALHO** | `title` | Título do Work Item |
| 2 | **E** | `original_estimate` | Estimado (Original Estimate) |
| 3 | **H** | `total_semana_horas` | Histórico da semana |
| 4 | **S** ⬅️ **NOVA** | `remaining_work` | Saldo (Remaining Work) |
| 5 | **SEG** | `dias[0]` | Segunda-feira |
| 6 | **TER** | `dias[1]` | Terça-feira |
| 7 | **QUA** | `dias[2]` | Quarta-feira |
| 8 | **QUI** | `dias[3]` | Quinta-feira |
| 9 | **SEX** | `dias[4]` | Sexta-feira |
| 10 | **SÁB** | `dias[5]` | Sábado |
| 11 | **DOM** | `dias[6]` | Domingo |
| 12 | **SEMANAL Σ** | soma dos dias | Total semanal |

---

## Mudanças Implementadas

### Arquivo: `client/src/pages/FolhaDeHoras.tsx`

#### 1. Cabeçalho da Tabela (linha ~389)

Adicionada coluna S após a coluna H:

```tsx
<th className="w-12 p-3 border-r border-[#EDEBE9] text-center" title="Saldo - Trabalho Restante (Remaining Work)">
  <div className="w-6 h-6 mx-auto border-2 border-[#605E5C] rounded-full flex items-center justify-center text-[10px] text-[#605E5C] font-black">S</div>
</th>
```

#### 2. Linha do Work Item (linha ~210)

Adicionada célula exibindo `remaining_work`:

```tsx
{/* Coluna S (Saldo) */}
<td className="p-3 text-center border-r border-[#EDEBE9] text-[#605E5C] font-bold text-[12px]">
  {item.remaining_work != null ? item.remaining_work : ""}
</td>
```

#### 3. Skeleton Loading (linha ~262)

Adicionada célula de loading para a nova coluna:

```tsx
<td className="p-3 border-r border-[#EDEBE9]"><Skeleton className="h-4 w-8 mx-auto" /></td>
```

#### 4. Estado de Erro (linha ~275)

Atualizado `colSpan` de 11 para 12:

```tsx
<td colSpan={12} className="p-8 text-center">
```

#### 5. Estado Vazio (linha ~295)

Atualizado `colSpan` de 11 para 12:

```tsx
<td colSpan={12} className="p-8 text-center">
```

#### 6. Rodapé da Tabela (linha ~448)

Adicionada célula vazia (saldo não tem soma total):

```tsx
<td className="p-4 text-center border-r border-[#EDEBE9] bg-[#F3F2F1] font-black">
  {/* Saldo não tem total */}
</td>
```

---

---

## Cores Semânticas (UX Enhancement)

### Conceito

As colunas E, H, S agora possuem cores semânticas para facilitar a leitura:

| Coluna | Cor | Hex | Significado |
|--------|-----|-----|-------------|
| **E** (Esforço) | 🔵 Azul | `#0078D4` | Planejamento |
| **H** (Histórico) | 🟢 Verde | `#107C10` | Progresso/Concluído |
| **S** (Saldo) | Dinâmico | - | Ver abaixo |

### Saldo Dinâmico

O saldo muda de cor conforme o valor:

| Condição | Cor | Hex | Significado |
|----------|-----|-----|-------------|
| `S = 0` | 🟢 Verde | `#107C10` | Completou o estimado |
| `S > 0` | 🟠 Laranja | `#FF8C00` | Pendente |
| `S < 0` | 🔴 Vermelho | `#D13438` | Excedeu estimativa |

### Código Implementado

```tsx
{/* Cabeçalho E - Azul */}
<th className="..." title="Esforço Estimado (Original Estimate)">
  <div className="... text-[#0078D4] border-[#0078D4]">E</div>
</th>

{/* Cabeçalho H - Verde */}
<th className="..." title="Histórico da Semana">
  <div className="... text-[#107C10] border-[#107C10]">H</div>
</th>

{/* Cabeçalho S - Laranja */}
<th className="..." title="Saldo - Trabalho Restante">
  <div className="... text-[#FF8C00] border-[#FF8C00]">S</div>
</th>

{/* Célula S - Dinâmico */}
<td className={cn(
  "p-3 text-center border-r border-[#EDEBE9] font-bold text-[12px]",
  item.remaining_work == null && "text-[#605E5C]",
  item.remaining_work === 0 && "text-[#107C10]",
  item.remaining_work != null && item.remaining_work > 0 && "text-[#FF8C00]",
  item.remaining_work != null && item.remaining_work < 0 && "text-[#D13438]"
)}>
  {item.remaining_work != null ? item.remaining_work : ""}
</td>
```

---

## Exemplo Visual

```
| ESCOPO DE TRABALHO              | E | H    | S    | SEG | TER | QUA | QUI | SEX | SÁB | DOM | SEMANAL Σ |
|                                 |🔵 | 🟢   |🟠/🟢/🔴|     |     |     |     |     |     |     |           |
|--------------------------------|---|------|------|-----|-----|-----|-----|-----|-----|-----|-----------|
| #4 C01. Implementar Extensão   | 8 | 2.5  | 5.5  |     |     |01:00|01:30|     |     |     | 02:30     |
| #8 Testar Apontamento          | 2 |      | 2    |     |     |     |     |     |     |     |           |
```

---

## Testes

### Resultado
```
✓ Test Files  1 passed (1)
✓ Tests       25 passed (25)
✓ Duration    13.87s
```

Todos os testes existentes continuam passando.

### Testes Atualizados

Os testes de acessibilidade foram atualizados para verificar os novos atributos `title`:

```typescript
// Verificar tooltips das colunas
expect(screen.getByTitle("Esforço Estimado (Original Estimate)"))
expect(screen.getByTitle("Histórico da Semana"))
expect(screen.getByTitle("Saldo - Trabalho Restante (Remaining Work)"))
```

---

## Deploy

- **Branch:** `develop`
- **Workflow:** `deploy-staging.yml`
- **Destino:** `staging-aponta.treit.com.br`
- **Status:** ✅ Automático via GitHub Actions

---

## Notas Técnicas

1. O campo `remaining_work` pode ser `null` se o Work Item não tiver `OriginalEstimate` definido no Azure DevOps
2. Se for `null`, a célula fica vazia (não exibe "-")
3. A coluna **S** não tem linha de totais (diferente de **E** e **H**)
4. O valor é atualizado automaticamente no Azure DevOps quando apontamentos são criados/editados/excluídos

---

## Referências

- **Backend Endpoint:** `GET /api/v1/timesheet`
- **Interface:** `WorkItemTimesheet.remaining_work` em `timesheet-types.ts`
- **Commits:**
  - `589d584` - feat(timesheet): adicionar coluna S (Saldo) na grade semanal
  - `7ea9bc9` - feat(timesheet): cores semânticas para colunas E, H, S com saldo dinâmico
- **Paleta de Cores:** Azure DevOps Fluent UI
