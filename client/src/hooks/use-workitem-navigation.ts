import { useCallback, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  IWorkItemFormNavigationService,
  WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";

export function useWorkItemNavigation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openWorkItem = useCallback(async (workItemId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const navigationService = await SDK.getService<IWorkItemFormNavigationService>(
        WorkItemTrackingServiceIds.WorkItemFormNavigationService
      );

      if (!navigationService) {
        throw new Error("WorkItemFormNavigationService não disponível");
      }

      // false = abre em modal, true = abre em nova aba
      await navigationService.openWorkItem(workItemId, false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao abrir work item";
      setError(errorMessage);
      console.error("Erro ao abrir work item:", err);

      // Fallback: abrir em nova aba usando URL direta
      const context = SDK.getExtensionContext();
      const orgUrl = context.host.uri;
      window.open(`${orgUrl}/_workitems/edit/${workItemId}`, "_blank");

    } finally {
      setIsLoading(false);
    }
  }, []);

  return { openWorkItem, isLoading, error };
}
