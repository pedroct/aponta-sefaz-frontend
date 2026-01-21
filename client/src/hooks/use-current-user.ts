import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

export interface CurrentUser {
  id: string;
  displayName: string;
  emailAddress: string | null;
  avatarUrl?: string | null;
}

/**
 * Hook para obter o usuário autenticado no Azure DevOps
 */
export function useCurrentUser() {
  const { api, token, isLoading } = useAzureContext();

  return useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      console.log('[useCurrentUser] Executando queryFn, token disponível:', !!token);
      try {
        return await api.get<CurrentUser>("/user");
      } catch (error) {
        console.error('[useCurrentUser] Erro ao buscar usuário:', error);
        // Retornar valores padrão em caso de erro
        return {
          id: "unknown",
          displayName: "Usuário",
          emailAddress: "",
          avatarUrl: null,
        };
      }
    },
    // Só executar quando tiver token e não estiver carregando
    enabled: !!token && !isLoading,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 1,
  });
}
