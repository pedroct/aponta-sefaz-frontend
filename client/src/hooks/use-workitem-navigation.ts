import { useCallback, useState } from "react";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

export function useWorkItemNavigation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInAzureDevOps, organization } = useAzureContext();

  const openWorkItem = useCallback(async (workItemId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Se estamos em iframe do Azure DevOps, solicitar ao parent que abra o work item
      if (isInAzureDevOps && window.parent !== window) {
        console.log("[useWorkItemNavigation] Solicitando ao parent para abrir work item", workItemId);

        // Enviar mensagem para o parent window usando VSS SDK
        window.parent.postMessage({
          type: "OPEN_WORK_ITEM",
          workItemId: workItemId,
        }, "*");

        // Como a navegação é delegada ao parent, marcar como completo imediatamente
        setIsLoading(false);
        return;
      }

      // Fallback: abrir em nova aba usando URL direta
      // Isso funciona tanto em desenvolvimento quanto em casos onde o modal não está disponível
      const baseUrl = `https://dev.azure.com/${organization}`;
      const url = `${baseUrl}/_workitems/edit/${workItemId}`;

      console.log("[useWorkItemNavigation] Abrindo work item em nova aba:", url);
      window.open(url, "_blank");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao abrir work item";
      setError(errorMessage);
      console.error("Erro ao abrir work item:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isInAzureDevOps, organization]);

  return { openWorkItem, isLoading, error };
}
