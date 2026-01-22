# Implementação - Fix Gestão de Atividades (Endpoint /gestao)

## Status: ✅ CONCLUÍDO

**Data:** 22 de janeiro de 2026  
**Arquivos:**
- `client/src/hooks/use-atividades.ts`
- `client/src/pages/Atividades.tsx`

**Deploy:** Staging (automático via GitHub Actions)

---

## Problema

A tela de **Gestão de Atividades** não estava exibindo os projetos associados às atividades. A coluna "Projetos" aparecia vazia para todas as atividades.

---

## Causa Raiz

O endpoint `/api/v1/atividades` (usado pelo hook `useAtividades`) retornava atividades **sem popular o array `projetos[]`** - era retornado vazio ou com IDs apenas.

O backend possui um endpoint específico `/api/v1/atividades/gestao` que retorna as atividades **com os projetos populados** (nome, id, etc.).

---

## Solução

### 1. Criar novo hook `useAtividadesGestao`

```typescript
// use-atividades.ts

/**
 * Hook para buscar atividades com projetos populados (para gestão)
 * Usa o endpoint /atividades/gestao que retorna projetos expandidos
 */
export function useAtividadesGestao() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["atividades-gestao"],
    queryFn: async () => {
      return api.get<AtividadeGestao[]>("/atividades/gestao");
    },
  });
}
```

### 2. Atualizar página Atividades.tsx

```typescript
// Atividades.tsx

// ❌ ANTES
const { data: atividades, ... } = useAtividades();

// ✅ DEPOIS
const { data: atividades, ... } = useAtividadesGestao();
```

---

## Diferença entre Endpoints

| Endpoint | Uso | Projetos |
|----------|-----|----------|
| `GET /atividades` | Dropdown de seleção | ❌ Não populados |
| `GET /atividades/gestao` | Tela de CRUD | ✅ Populados |

---

## Resultado

A coluna "Projetos" na tabela de Gestão de Atividades agora exibe corretamente os nomes dos projetos associados a cada atividade.

---

## Testes

```
✓ Listagem de atividades com projetos
✓ CRUD funcional (criar, editar, excluir)
✓ Projetos exibidos na tabela
```

---

## Referências

- **Hook original:** `useAtividades()` - continua funcionando para dropdowns
- **Hook novo:** `useAtividadesGestao()` - para página de gestão
- **Backend:** `GET /api/v1/atividades/gestao` (FastAPI)
