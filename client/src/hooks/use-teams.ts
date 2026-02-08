import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";
import { TeamsResponse, TeamsParams } from "@/lib/team-types";

interface UseTeamsParams extends TeamsParams {
  enabled?: boolean;
}

/**
 * Hook para carregar as equipes do projeto atual.
 */
export function useTeams(params: UseTeamsParams) {
  const { organization_name, project_id, enabled = true } = params;
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: ["teams", organization_name, project_id],
    queryFn: async (): Promise<TeamsResponse> => {
      return api.get<TeamsResponse>("/teams", {
        organization_name,
        project_id,
      });
    },
    enabled:
      enabled &&
      !!token &&
      !isLoading &&
      !!organization_name &&
      !!project_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export default useTeams;
