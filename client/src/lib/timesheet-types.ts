/**
 * Tipos para Timesheet (Folha de Horas)
 * Baseados na especificação docs/IMPLEMENTACAO_TIMESHEET_FRONTEND.md
 */

// ============================================================================
// TIMESHEET RESPONSE
// ============================================================================

export interface TimesheetResponse {
  // Período
  semana_inicio: string;           // "2026-01-19" (YYYY-MM-DD)
  semana_fim: string;              // "2026-01-25"
  semana_label: string;            // "19/01 - 25/01"
  
  // Hierarquia de Work Items
  work_items: WorkItemTimesheet[];
  
  // Totais gerais
  total_geral_horas: number;       // 42.5
  total_geral_formatado: string;   // "42:30"
  totais_por_dia: TotalDia[];
  
  // Metadados
  total_work_items: number;
  total_esforco: number;           // Coluna E (soma)
  total_historico: number;         // Coluna H (soma)
}

// ============================================================================
// WORK ITEM TIMESHEET
// ============================================================================

export interface WorkItemTimesheet {
  // Identificação
  id: number;                      // ID do Work Item no Azure DevOps
  title: string;
  type: WorkItemType;              // "Epic", "Feature", "User Story", "Task", "Bug"
  state: string;                   // "New", "Active", "Resolved", "Closed"
  state_category: StateCategory;   // "Proposed", "InProgress", "Resolved", "Completed", "Removed"
  icon_url: string;
  assigned_to: string | null;
  
  // Campos de esforço
  original_estimate: number | null; // Coluna E - Esforço planejado (horas)
  completed_work: number | null;
  remaining_work: number | null;
  
  // Totais da semana
  total_semana_horas: number;      // Coluna H - Histórico
  total_semana_formatado: string;  // "08:30"
  
  // Células dos dias da semana (7 itens: seg a dom)
  dias: CelulaDia[];
  
  // Hierarquia
  nivel: number;                   // 0=Epic, 1=Feature, 2=Story, 3=Task/Bug
  parent_id: number | null;
  children: WorkItemTimesheet[];
  
  // Permissões
  pode_editar: boolean;
  pode_excluir: boolean;
}

export type WorkItemType = "Epic" | "Feature" | "User Story" | "Task" | "Bug";
export type StateCategory = "Proposed" | "InProgress" | "Resolved" | "Completed" | "Removed";

// ============================================================================
// CÉLULA DIA
// ============================================================================

export interface CelulaDia {
  data: string;                    // "2026-01-19" (YYYY-MM-DD)
  dia_semana: string;              // "seg", "ter", "qua", "qui", "sex", "sáb", "dom"
  dia_numero: number;              // 19
  total_horas: number;             // 2.5
  total_formatado: string;         // "02:30" (vazio se 0)
  apontamentos: ApontamentoDia[];
  eh_hoje: boolean;
  eh_fim_semana: boolean;
}

// ============================================================================
// APONTAMENTO DIA
// ============================================================================

export interface ApontamentoDia {
  id: string;                      // UUID
  duracao: string;                 // "02:00"
  duracao_horas: number;           // 2.0
  id_atividade: string;            // UUID da atividade
  atividade_nome: string;          // "Desenvolvimento"
  comentario: string | null;
}

// ============================================================================
// TOTAL DIA
// ============================================================================

export interface TotalDia {
  data: string;
  dia_semana: string;
  dia_numero: number;
  total_horas: number;
  total_formatado: string;
  eh_hoje: boolean;
}

// ============================================================================
// STATE CATEGORY RESPONSE
// ============================================================================

export interface StateCategoryResponse {
  work_item_id: number;
  state: string;
  state_category: StateCategory;
  can_edit: boolean;
  can_delete: boolean;
}

// ============================================================================
// PARAMS PARA HOOKS
// ============================================================================

export interface TimesheetParams {
  organization_name: string;
  project_id: string;
  week_start?: string;             // YYYY-MM-DD (segunda-feira)
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Calcula a segunda-feira da semana para uma data
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formata data para API (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Verifica se Work Item pode ser editado baseado na categoria do estado
 */
export function canEditByStateCategory(stateCategory: StateCategory): boolean {
  return !["Completed", "Removed"].includes(stateCategory);
}

// ============================================================================
// BLUE CELLS - Work Item Revisions
// ============================================================================

export interface WorkItemRevisionFields {
  'System.ChangedDate': string;
  'System.State': string | null;
  'System.AssignedTo'?: {
    id: string;
    displayName?: string;
  } | null;
}

export interface WorkItemRevision {
  rev: number;
  fields: WorkItemRevisionFields;
}

export interface WorkItemRevisionsResponse {
  work_item_id: number;
  revisions: WorkItemRevision[];
}

// ============================================================================
// BLUE CELLS - Process State Mapping
// ============================================================================

export type ProcessStateMap = Record<string, string>;

export interface ProcessStateMappingResponse {
  state_map: ProcessStateMap;
}
