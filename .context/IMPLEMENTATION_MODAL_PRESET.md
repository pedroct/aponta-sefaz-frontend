# Implementação - Botão +0.25h (15 min) no Modal de Apontamento

## Status: ✅ CONCLUÍDO

**Data:** 22 de janeiro de 2026  
**Arquivo:** `client/src/components/custom/ModalAdicionarTempo.tsx`  
**Deploy:** Staging (automático via GitHub Actions)

---

## Objetivo

Adicionar um botão de preset de **+0.25h (15 minutos)** na lista de presets do modal de apontamento, facilitando apontamentos de curta duração.

---

## Contexto

O modal de apontamento possui botões de preset que permitem preencher rapidamente a duração. O usuário solicitou incluir a opção de 15 minutos (0.25h) para atender demandas de atividades rápidas.

---

## Mudança Implementada

### Antes
```typescript
const presets = ["+0.5h", "+1h", "+2h", "+4h"];
```

### Depois
```typescript
const presets = ["+0.25h", "+0.5h", "+1h", "+2h", "+4h"];
```

---

## Estrutura Visual

```
┌──────────────────────────────────────────────────────┐
│                Modal Adicionar Tempo                  │
├──────────────────────────────────────────────────────┤
│  Descrição: [___________________________]            │
│  Data:      [22/01/2026]                             │
│  Duração:   [00:00]                                  │
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ +0.25h  │ │ +0.5h   │ │  +1h    │ │  +2h    │ ...│
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│       ↑                                              │
│      NOVO                                            │
│                                                      │
│              [Cancelar]  [Salvar]                    │
└──────────────────────────────────────────────────────┘
```

---

## Comportamento

Ao clicar em **+0.25h**:
1. Adiciona 15 minutos à duração atual
2. O formato é convertido para HH:MM (ex: 00:15)
3. Múltiplos cliques acumulam (00:15 → 00:30 → 00:45...)

---

## Testes

```
✓ Test Files  1 passed (1)
✓ Tests       31 passed (31)
✓ Duration    7.23s
```

Todos os testes do modal continuam passando.

---

## Referências

- **Componente:** `ModalAdicionarTempo.tsx`
- **Função de conversão:** `addHoursToTime()` - converte decimal para HH:MM
- **Linha alterada:** ~55 (definição do array `presets`)
