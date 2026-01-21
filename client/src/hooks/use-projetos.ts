/**
 * Hooks React Query para gerenciamento de Projetos
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

// ============================================
// Tipos
// ============================================

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  url?: string;
  state?: string;
}

export interface ProjetoListResponse {
  items: Projeto[];
  total: number;
}

export interface SincronizacaoResponse {
  message: string;
  projetos_sincronizados?: number;
}

// ============================================
// Query Keys
// ============================================

export const projetosKeys = {
  all: ["projetos"] as const,
  lists: () => [...projetosKeys.all, "list"] as const,
  list: () => [...projetosKeys.lists(), "local"] as const,
  azure: () => [...projetosKeys.lists(), "azure"] as const,
};

// ============================================
// Funções auxiliares
// ============================================

function normalizeProjetosResponse(data: unknown): ProjetoListResponse {
  if (Array.isArray(data)) {
    return { items: data as Projeto[], total: data.length };
  }

  if (data && typeof data === "object" && "items" in data) {
    const payload = data as { items?: Projeto[]; total?: number };
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
 * Hook para listar projetos do cache local
 */
export function useProjetos() {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: projetosKeys.list(),
    queryFn: async () => {
      const response = await api.get("/projetos");
      return normalizeProjetosResponse(response);
    },
    enabled: !!token && !isLoading,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para listar projetos diretamente do Azure DevOps
 */
export function useProjetosAzure() {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: projetosKeys.azure(),
    queryFn: async () => {
      const response = await api.get("/integracao/projetos");
      return response as Projeto[];
    },
    enabled: false, // Não executa automaticamente
  });
}

// ============================================
// Hooks de Mutation
// ============================================

/**
 * Hook para sincronizar projetos do Azure DevOps
 */
export function useSincronizarProjetos() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/integracao/sincronizar");
      return response as SincronizacaoResponse;
    },
    onSuccess: () => {
      // Invalida lista de projetos para recarregar
      queryClient.invalidateQueries({ queryKey: projetosKeys.lists() });
    },
  });
}
