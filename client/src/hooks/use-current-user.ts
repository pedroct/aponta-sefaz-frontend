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
  if (/^AZURE USER/i.test(name)) return false; // "AZURE USER 08347002"
  if (/^[0-9A-F]{8}$/i.test(name)) return false; // Código hex de 8 chars
  if (/^[0-9a-f-]{36}$/i.test(name)) return false; // GUID
  if (/^\d{6,}/.test(name)) return false; // Começa com muitos números
  return true;
}

/**
 * Extrai um nome amigável do uniqueName (email) do Azure DevOps
 * Ex: "pedro.cicero@contoso.com" -> "Pedro Cicero"
 */
function extractNameFromUniqueName(uniqueName: string | undefined | null): string | null {
  if (!uniqueName) return null;
  
  // uniqueName geralmente é um email: pedro.cicero.teixeira@sefaz.ce.gov.br
  const emailPart = uniqueName.split('@')[0];
  if (!emailPart) return null;
  
  // Substituir pontos e underscores por espaços, capitalizar cada palavra
  const nameParts = emailPart
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  
  if (nameParts.length === 0) return null;
  
  return nameParts.join(' ');
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
      console.log('[useCurrentUser] Contexto:', {
        userName: context?.userName,
        userUniqueName: context?.userUniqueName,
        userEmail: context?.userEmail,
      });
      
      try {
        const backendUser = await api.get<CurrentUser>("/user");
        
        // Verificar se o displayName do backend é válido
        // Se não for, tentar alternativas na ordem:
        // 1. userName do contexto (webContext.user.name)
        // 2. Nome extraído do uniqueName (email)
        // 3. Fallback para "Usuário"
        let displayName = backendUser.displayName;
        
        if (!isValidDisplayName(displayName)) {
          console.log('[useCurrentUser] displayName inválido do backend:', displayName);
          
          // Tentar userName do contexto
          if (isValidDisplayName(context?.userName)) {
            console.log('[useCurrentUser] Usando userName do contexto:', context?.userName);
            displayName = context!.userName!;
          } 
          // Tentar extrair nome do uniqueName (email)
          else {
            const extractedName = extractNameFromUniqueName(context?.userUniqueName);
            if (extractedName) {
              console.log('[useCurrentUser] Nome extraído do uniqueName:', extractedName);
              displayName = extractedName;
            } else {
              console.log('[useCurrentUser] Sem alternativa válida, mantendo:', displayName);
            }
          }
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
        // Tentar extrair nome válido
        let displayName = context?.userName;
        if (!isValidDisplayName(displayName)) {
          const extractedName = extractNameFromUniqueName(context?.userUniqueName);
          displayName = extractedName || "Usuário";
        }
        
        return {
          id: context?.userId || "unknown",
          displayName: displayName || "Usuário",
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
