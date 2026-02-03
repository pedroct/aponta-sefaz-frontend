import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";
import {
  IterationsListResponse,
  IterationsParams,
  normalizeIterationAttributes,
} from "@/lib/iteration-types";

/**
 * Hook para buscar a lista de Iterations (Sprints) de um projeto.
 *
 * @param params - Parâmetros obrigatórios e opcionais
 * @param params.organization_name - Nome da organização no Azure DevOps
 * @param params.project_id - ID ou nome do projeto
 * @param params.team_id - ID ou nome do time (opcional)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useIterations({
 *   organization_name: "minha-org",
 *   project_id: "meu-projeto",
 * });
 *
 * // Iteration atual pré-selecionada
 * const currentIterationId = data?.current_iteration_id;
 * ```
 */
export function useIterations(params: IterationsParams) {
  const { organization_name, project_id, team_id } = params;
  const { api, token, isLoading } = useAzureContext();

  // Debug: verificar por que a query não está executando
  const isEnabled = !!token && !isLoading && !!organization_name && !!project_id;
  console.log("[useIterations] Estado:", {
    hasToken: !!token,
    isLoading,
    organization_name,
    project_id,
    isEnabled
  });

  return useQuery({
    queryKey: ["iterations", organization_name, project_id, team_id],
    queryFn: async (): Promise<IterationsListResponse> => {
      console.log("[useIterations] Executando queryFn, token disponível:", !!token);

      const queryParams: Record<string, string> = {
        organization_name,
        project_id,
      };

      if (team_id) {
        queryParams.team_id = team_id;
      }

      const response = await api.get<IterationsListResponse>("/iterations", queryParams);
      return {
        ...response,
        iterations: response.iterations.map((it) => ({
          ...it,
          attributes: normalizeIterationAttributes(it.attributes),
        })),
      };
    },
    // Só executar quando tiver token, não estiver carregando E tiver os params obrigatórios
    enabled: !!token && !isLoading && !!organization_name && !!project_id,
    // Iterations mudam raramente, usar cache longo
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}
