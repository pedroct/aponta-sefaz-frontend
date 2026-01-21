import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

export interface CurrentUser {
  id: string;
  displayName: string;
  emailAddress: string | null;
  avatarUrl?: string | null;
}

/**
 * Verifica se o displayName parece ser um nome real (não um ID ou código)
 */
function isValidDisplayName(name: string | undefined | null): boolean {
  if (!name || name.length < 3) return false;
  // Rejeitar se parecer ser um ID (ex: "User-08347002", "008753C9", GUIDs)
  if (/^User-/i.test(name)) return false;
  if (/^[0-9A-F]{8}$/i.test(name)) return false; // Código hex de 8 chars
  if (/^[0-9a-f-]{36}$/i.test(name)) return false; // GUID
  if (/^\d{6,}/.test(name)) return false; // Começa com muitos números
  return true;
}

/**
 * Hook para obter o usuário autenticado no Azure DevOps
 * 
 * Prioriza o nome do webContext (passado via URL) quando o backend
 * retorna um identificador em vez do nome real do usuário.
 */
export function useCurrentUser() {
  const { api, token, isLoading, context } = useAzureContext();

  return useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      console.log('[useCurrentUser] Executando queryFn, token disponível:', !!token);
      try {
        const backendUser = await api.get<CurrentUser>("/user");
        
        // Verificar se o displayName do backend é válido
        // Se não for, usar o userName do contexto do Azure DevOps (webContext)
        let displayName = backendUser.displayName;
        
        if (!isValidDisplayName(displayName) && context?.userName) {
          console.log('[useCurrentUser] displayName inválido do backend:', displayName);
          console.log('[useCurrentUser] Usando userName do contexto:', context.userName);
          displayName = context.userName;
        }
        
        // Também usar email do contexto se backend não retornou
        const emailAddress = backendUser.emailAddress || context?.userEmail || null;
        
        return {
          ...backendUser,
          displayName,
          emailAddress,
        };
      } catch (error) {
        console.error('[useCurrentUser] Erro ao buscar usuário:', error);
        // Retornar valores do contexto em caso de erro
        return {
          id: context?.userId || "unknown",
          displayName: context?.userName || "Usuário",
          emailAddress: context?.userEmail || "",
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
