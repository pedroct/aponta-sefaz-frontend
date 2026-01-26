/**
 * Hook para gerenciamento de PATs de organizações Azure DevOps
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

// Types
export interface OrganizationPat {
  id: string;
  organization_name: string;
  organization_url: string | null;
  pat_masked: string | null;
  descricao: string | null;
  expira_em: string | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  status_validacao: string | null;
}

export interface OrganizationPatCreate {
  organization_name: string;
  organization_url?: string;
  pat: string;
  descricao?: string;
  expira_em?: string;
  ativo?: boolean;
}

export interface OrganizationPatUpdate {
  organization_url?: string;
  pat?: string;
  descricao?: string;
  expira_em?: string;
  ativo?: boolean;
}

export interface OrganizationPatList {
  items: OrganizationPat[];
  total: number;
}

export interface OrganizationPatValidateRequest {
  organization_name: string;
  pat: string;
}

export interface OrganizationPatValidateResponse {
  valid: boolean;
  organization_name: string;
  message: string;
  projects_count?: number;
  projects?: string[];
}

// === Hooks ===

/**
 * Hook para listar PATs
 */
export function useOrganizationPats(params?: { 
  skip?: number; 
  limit?: number; 
  only_active?: boolean 
}) {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: ["organization-pats", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) queryParams.set("limit", params.limit.toString());
      if (params?.only_active !== undefined) queryParams.set("only_active", params.only_active.toString());
      
      const url = `/organization-pats${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return api.get<OrganizationPatList>(url);
    },
    enabled: !!token && !isLoading,
  });
}

/**
 * Hook para criar PAT
 */
export function useCriarOrganizationPat() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (data: OrganizationPatCreate & { validate_first?: boolean }) => {
      const { validate_first = true, ...patData } = data;
      const url = `/organization-pats?validate_first=${validate_first}`;
      return api.post<OrganizationPat>(url, patData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-pats"] });
    },
  });
}

/**
 * Hook para atualizar PAT
 */
export function useAtualizarOrganizationPat() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OrganizationPatUpdate }) => {
      return api.put<OrganizationPat>(`/organization-pats/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-pats"] });
    },
  });
}

/**
 * Hook para excluir PAT
 */
export function useExcluirOrganizationPat() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/organization-pats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-pats"] });
    },
  });
}

/**
 * Hook para validar PAT (sem salvar)
 */
export function useValidarPat() {
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (data: OrganizationPatValidateRequest) => {
      return api.post<OrganizationPatValidateResponse>("/organization-pats/validate", data);
    },
  });
}

/**
 * Hook para validar PAT armazenado
 */
export function useValidarPatArmazenado() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<OrganizationPatValidateResponse>(`/organization-pats/${id}/validate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-pats"] });
    },
  });
}

/**
 * Hook para alternar status ativo
 */
export function useTogglePatAtivo() {
  const queryClient = useQueryClient();
  const { api } = useAzureContext();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<OrganizationPat>(`/organization-pats/${id}/toggle-active`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-pats"] });
    },
  });
}
