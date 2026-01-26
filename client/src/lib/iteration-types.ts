/**
 * Tipos para Iterations (Sprints) do Azure DevOps.
 * Usados para filtrar a Folha de Horas por Sprint.
 */

/**
 * TimeFrame indica se a sprint é passada, atual ou futura.
 */
export type TimeFrame = "past" | "current" | "future";

/**
 * Atributos de uma Iteration.
 */
export interface IterationAttributes {
  /** Data de início da iteration (ISO 8601) */
  start_date: string | null;
  /** Data de fim da iteration (ISO 8601) */
  finish_date: string | null;
  /** Período: past, current, future */
  time_frame: TimeFrame | null;
}

/**
 * Iteration (Sprint) do Azure DevOps.
 */
export interface Iteration {
  /** ID único da iteration (UUID) */
  id: string;
  /** Nome da iteration (ex: "Sprint 5") */
  name: string;
  /** Caminho completo (ex: "Project\\Iteration\\Sprint 5") */
  path: string | null;
  /** Atributos (datas e timeFrame) */
  attributes: IterationAttributes;
  /** URL da API */
  url: string | null;
}

/**
 * Resposta da API de listagem de Iterations.
 */
export interface IterationsListResponse {
  /** Quantidade de iterations */
  count: number;
  /** Lista de iterations */
  iterations: Iteration[];
  /** ID da iteration atual (para pré-seleção) */
  current_iteration_id: string | null;
}

/**
 * Resposta da API de Work Items de uma Iteration.
 */
export interface IterationWorkItemsResponse {
  /** ID da iteration */
  iteration_id: string;
  /** Nome da iteration */
  iteration_name: string;
  /** Lista de IDs dos Work Items */
  work_item_ids: number[];
  /** Quantidade de Work Items */
  count: number;
}

/**
 * Parâmetros para buscar iterations.
 */
export interface IterationsParams {
  /** Nome da organização no Azure DevOps */
  organization_name: string;
  /** ID ou nome do projeto */
  project_id: string;
  /** ID ou nome do time (opcional) */
  team_id?: string;
}

/**
 * Formata a data de início e fim da iteration para exibição.
 * Ex: "(20/01 - 02/02)"
 */
export function formatIterationDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

  return `(${formatDate(start)} - ${formatDate(end)})`;
}

/**
 * Agrupa iterations por timeFrame.
 */
export function groupIterationsByTimeFrame(iterations: Iteration[]): {
  current: Iteration | null;
  future: Iteration[];
  past: Iteration[];
} {
  const current = iterations.find(
    (it) => it.attributes.time_frame === "current"
  ) || null;

  const future = iterations
    .filter((it) => it.attributes.time_frame === "future")
    .sort((a, b) => {
      if (!a.attributes.start_date || !b.attributes.start_date) return 0;
      return (
        new Date(a.attributes.start_date).getTime() -
        new Date(b.attributes.start_date).getTime()
      );
    });

  const past = iterations
    .filter((it) => it.attributes.time_frame === "past")
    .sort((a, b) => {
      if (!a.attributes.start_date || !b.attributes.start_date) return 0;
      return (
        new Date(b.attributes.start_date).getTime() -
        new Date(a.attributes.start_date).getTime()
      );
    });

  return { current, future, past };
}
