import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  TimesheetResponse, 
  TimesheetParams, 
  StateCategoryResponse,
  getMondayOfWeek,
  formatDateForApi 
} from "@/lib/timesheet-types";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

/**
 * Hook para buscar a grade semanal do Timesheet
 * 
 * @param params - Parâmetros obrigatórios e opcionais
 * @param params.organization_name - Nome da organização no Azure DevOps
 * @param params.project_id - ID ou nome do projeto
 * @param params.week_start - Data de início da semana (segunda-feira, YYYY-MM-DD)
 * @param params.only_my_items - Filtrar apenas Work Items atribuídos ao usuário
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTimesheet({
 *   organization_name: "minha-org",
 *   project_id: "meu-projeto",
 *   week_start: "2026-01-19",
 *   only_my_items: true
 * });
 * ```
 */
export function useTimesheet(params: TimesheetParams) {
  const { organization_name, project_id, week_start, only_my_items } = params;
  const { api, token, isLoading } = useAzureContext();
  
  // Calcula week_start padrão se não fornecido
  const effectiveWeekStart = week_start || formatDateForApi(getMondayOfWeek(new Date()));
  
  return useQuery({
    queryKey: ["timesheet", organization_name, project_id, effectiveWeekStart, only_my_items],
    queryFn: async (): Promise<TimesheetResponse> => {
      console.log('[useTimesheet] Executando queryFn, token disponível:', !!token);
      return api.get<TimesheetResponse>("/timesheet", {
        organization_name,
        project_id,
        week_start: effectiveWeekStart,
        only_my_items,
      });
    },
    // Só executar quando tiver token, não estiver carregando E tiver os params obrigatórios
    enabled: !!token && !isLoading && !!organization_name && !!project_id,
    staleTime: 2 * 60 * 1000, // Cache de 2 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para verificar a categoria de estado de um Work Item
 * Útil para validar permissões antes de editar/excluir apontamentos
 * 
 * @param workItemId - ID do Work Item no Azure DevOps
 * @param organizationName - Nome da organização
 * @param projectId - ID ou nome do projeto
 */
export function useWorkItemStateCategory(
  workItemId: number | null,
  organizationName: string,
  projectId: string
) {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: ["timesheet", "state-category", workItemId, organizationName, projectId],
    queryFn: async (): Promise<StateCategoryResponse> => {
      console.log('[useWorkItemStateCategory] Executando queryFn, token disponível:', !!token);
      return api.get<StateCategoryResponse>(
        `/timesheet/work-item/${workItemId}/state-category`,
        {
          organization_name: organizationName,
          project_id: projectId,
        }
      );
    },
    enabled: !!token && !isLoading && !!workItemId && !!organizationName && !!projectId,
  });
}

/**
 * Hook para invalidar o cache do timesheet após criar/editar/excluir apontamentos
 */
export function useInvalidateTimesheet() {
  const queryClient = useQueryClient();
  
  return {
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet"] });
    },
    invalidateForWeek: (organizationName: string, projectId: string, weekStart: string) => {
      queryClient.invalidateQueries({ 
        queryKey: ["timesheet", organizationName, projectId, weekStart] 
      });
    }
  };
}
