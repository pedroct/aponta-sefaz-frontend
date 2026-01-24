/**
 * Hook para gerenciar a funcionalidade de Blue Cells (Células Azuis)
 * Busca revisões de Work Items e determina quais células devem ser destacadas
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  WorkItemRevisionsResponse,
  ProcessStateMappingResponse,
} from '@/lib/timesheet-types';
import { getBlueCellsForWeek } from '@/lib/blue-cells-logic';
import { useAzureContext } from '@/contexts/AzureDevOpsContext';

// ============================================================================
// Hook para buscar revisões de um Work Item
// ============================================================================

interface UseWorkItemRevisionsParams {
  workItemId: number;
  organization: string;
  project: string;
  enabled?: boolean;
}

export function useWorkItemRevisions({
  workItemId,
  organization,
  project,
  enabled = true,
}: UseWorkItemRevisionsParams) {
  const { api, token, isLoading: isLoadingContext } = useAzureContext();

  return useQuery({
    queryKey: ['work-item-revisions', workItemId, organization, project],
    queryFn: async (): Promise<WorkItemRevisionsResponse> => {
      return api.get<WorkItemRevisionsResponse>(
        `/timesheet/work-item/${workItemId}/revisions`,
        {
          organization_name: organization,
          project_id: project,
        }
      );
    },
    enabled: enabled && !!token && !isLoadingContext,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ============================================================================
// Hook para buscar mapeamento de estados do processo
// ============================================================================

interface UseProcessStatesParams {
  organization: string;
  project: string;
  processId: string;
  workItemType: string;
  enabled?: boolean;
}

export function useProcessStates({
  organization,
  project,
  processId,
  workItemType,
  enabled = true,
}: UseProcessStatesParams) {
  const { api, token, isLoading: isLoadingContext } = useAzureContext();

  return useQuery({
    queryKey: ['process-states', organization, processId, workItemType],
    queryFn: async (): Promise<ProcessStateMappingResponse> => {
      return api.get<ProcessStateMappingResponse>('/timesheet/process-states', {
        organization_name: organization,
        project_id: project,
        process_id: processId,
        work_item_type: workItemType,
      });
    },
    enabled: enabled && !!token && !isLoadingContext,
    staleTime: 60 * 60 * 1000, // 1 hora (raramente muda)
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
  });
}

// ============================================================================
// Hook principal para determinar células azuis
// ============================================================================

interface UseBlueCellsParams {
  workItemId: number;
  organization: string;
  project: string;
  processId: string;
  workItemType: string;
  weekDates: string[]; // Array com as 7 datas da semana
  userId: string;
  enabled?: boolean;
}

export function useBlueCells({
  workItemId,
  organization,
  project,
  processId,
  workItemType,
  weekDates,
  userId,
  enabled = true,
}: UseBlueCellsParams) {
  // Buscar revisões do Work Item
  const {
    data: revisionsData,
    isLoading: isLoadingRevisions,
    error: revisionsError,
  } = useWorkItemRevisions({
    workItemId,
    organization,
    project,
    enabled,
  });

  // Buscar mapeamento de estados (com cache longo)
  const {
    data: stateMapData,
    isLoading: isLoadingStateMap,
    error: stateMapError,
  } = useProcessStates({
    organization,
    project,
    processId,
    workItemType,
    enabled,
  });

  // Calcular células azuis
  const blueCells = React.useMemo(() => {
    if (!revisionsData || !stateMapData || !userId) {
      return Array(7).fill(false);
    }

    return getBlueCellsForWeek(
      revisionsData.revisions,
      weekDates,
      userId,
      stateMapData.state_map
    );
  }, [revisionsData, stateMapData, weekDates, userId]);

  return {
    blueCells,
    isLoading: isLoadingRevisions || isLoadingStateMap,
    error: revisionsError || stateMapError,
  };
}