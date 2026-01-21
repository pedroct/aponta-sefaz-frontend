import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

export interface WorkItemSearchResult {
  id: number;
  title: string;
  type: string;
  url?: string;
  iconUrl?: string;
}

interface SearchResponse {
  query: string;
  project?: string;
  count: number;
  results: WorkItemSearchResult[];
}

/**
 * Hook para buscar Work Items por título com debouncing
 * @param project - ID do projeto (ex: "DEV", "DEMO")
 * @param enabled - Se a busca está habilitada
 */
export function useSearchWorkItems(
  project: string,
  enabled: boolean = true,
  organizationName?: string
) {
  const [searchTerm, setSearchTerm] = useState("");
  const { api, token, isLoading } = useAzureContext();

  const query = useQuery<SearchResponse>({
    queryKey: ["work-items-search", project, searchTerm],
    queryFn: async () => {
      console.log('[useSearchWorkItems] Executando queryFn, token disponível:', !!token);
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          query: "",
          project,
          count: 0,
          results: [],
        };
      }

      return api.get<SearchResponse>("/work-items/search", {
        query: searchTerm,
        project_id: project,
        limit: 10,
        organization_name: organizationName,
        work_item_types: "Task,Bug", // Apenas Task e Bug podem receber apontamentos
      });
    },
    enabled: !!token && !isLoading && enabled && searchTerm.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes: cacheTime)
    retry: 1,
  });

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clear = useCallback(() => {
    setSearchTerm("");
  }, []);

  return {
    searchTerm,
    results: query.data?.results || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    handleSearch,
    clear,
  };
}
