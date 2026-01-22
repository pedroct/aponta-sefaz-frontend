import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

// ============================================
// Tipos
// ============================================

export interface ProjetoSimples {
  id: string;
  nome: string;
}

export interface Atividade {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  projetos?: ProjetoSimples[];
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface AtividadeCreate {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  ids_projetos: string[];
}

export interface AtividadeUpdate {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  ids_projetos?: string[];
}

interface AtividadeListResponse {
  items: Atividade[];
  total: number;
}

// ============================================
// Query Keys
// ============================================

export const atividadesKeys = {
  all: ["atividades"] as const,
  lists: () => [...atividadesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...atividadesKeys.lists(), params] as const,
  details: () => [...atividadesKeys.all, "detail"] as const,
  detail: (id: string) => [...atividadesKeys.details(), id] as const,
};

// ============================================
// Funções auxiliares
// ============================================

function normalizeAtividadesResponse(data: unknown): AtividadeListResponse {
  if (Array.isArray(data)) {
    return { items: data as Atividade[], total: data.length };
  }

  if (data && typeof data === "object" && "items" in data) {
    const payload = data as { items?: Atividade[]; total?: number };
    return {
      items: payload.items ?? [],
      total: payload.total ?? payload.items?.length ?? 0,
    };
  }

  return { items: [], total: 0 };
}

// ============================================
// Hooks de Query
// ============================================

/**
 * Hook para listar atividades
 */
export function useAtividades(params?: {
  ativo?: boolean;
  id_projeto?: string;
  skip?: number;
  limit?: number;
}) {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: atividadesKeys.list(params),
    queryFn: async () => {
      console.log('[useAtividades] Executando queryFn, token disponível:', !!token);
      const data = await api.get("/atividades", {
        ativo: params?.ativo,
        id_projeto: params?.id_projeto,
        skip: params?.skip,
        limit: params?.limit,
      });
      console.log('[useAtividades] Dados recebidos (raw):', JSON.stringify(data, null, 2));
      const normalized = normalizeAtividadesResponse(data);
      console.log('[useAtividades] Dados normalizados:', JSON.stringify(normalized, null, 2));
      return normalized;
    },
    // Só executar quando tiver token e não estiver carregando
    enabled: !!token && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter uma atividade específica por ID
 */
export function useAtividade(id: string) {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: atividadesKeys.detail(id),
    queryFn: async () => {
      const data = await api.get(`/atividades/${id}`);
      return data as Atividade;
    },
    enabled: !!id && !!token && !isLoading,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Hooks de Mutation
// ============================================

/**
 * Hook para criar uma nova atividade
 */
export function useCriarAtividade() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (data: AtividadeCreate) => {
      console.log('[useCriarAtividade] Dados enviados:', JSON.stringify(data, null, 2));
      const response = await api.post("/atividades", data);
      console.log('[useCriarAtividade] Resposta:', JSON.stringify(response, null, 2));
      return response as Atividade;
    },
    onSuccess: () => {
      // Invalida a lista para recarregar
      queryClient.invalidateQueries({ queryKey: atividadesKeys.lists() });
    },
  });
}

/**
 * Hook para atualizar uma atividade existente
 */
export function useAtualizarAtividade() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AtividadeUpdate }) => {
      console.log('[useAtualizarAtividade] ID:', id);
      console.log('[useAtualizarAtividade] Dados enviados:', JSON.stringify(data, null, 2));
      const response = await api.put(`/atividades/${id}`, data);
      console.log('[useAtualizarAtividade] Resposta:', JSON.stringify(response, null, 2));
      return response as Atividade;
    },
    onSuccess: (_, variables) => {
      // Invalida a lista e o detalhe específico
      queryClient.invalidateQueries({ queryKey: atividadesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: atividadesKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook para excluir uma atividade
 */
export function useExcluirAtividade() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/atividades/${id}`);
    },
    onSuccess: () => {
      // Invalida a lista para recarregar
      queryClient.invalidateQueries({ queryKey: atividadesKeys.lists() });
    },
  });
}
