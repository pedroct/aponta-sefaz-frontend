/**
 * Tipos compartilhados entre cliente e servidor
 * Espelhando os tipos da API FastAPI
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://aponta.treit.com.br";
const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, "");

export const API_BASE_URL = NORMALIZED_API_URL.endsWith("/api/v1")
  ? NORMALIZED_API_URL
  : `${NORMALIZED_API_URL}/api/v1`;

const API_TOKEN = import.meta.env.VITE_API_TOKEN;

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function buildApiHeaders(options?: { json?: boolean; headers?: HeadersInit }) {
  const headers = new Headers(options?.headers);

  if (options?.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (API_TOKEN) {
    headers.set("Authorization", `Bearer ${API_TOKEN}`);
  }

  return headers;
}

// ============================================================================
// APONTAMENTOS
// ============================================================================

export interface Apontamento {
  id: string;
  work_item_id: number;
  project_id: string;
  organization_name: string;
  data_apontamento: string;
  duracao: string;
  duracao_horas: number;
  id_atividade: string;
  atividade: {
    id: string;
    nome: string;
  };
  comentario?: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ApontamentoCreate {
  data_apontamento: string;
  duracao: string;
  id_atividade: string;
  comentario?: string;
  work_item_id: number;
  project_id: string;
  organization_name: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email?: string;
}

export interface ApontamentoUpdate {
  data_apontamento?: string;
  duracao?: string;
  id_atividade?: string;
  comentario?: string;
}

export interface ApontamentoResumo {
  work_item_id: number;
  total_apontamentos: number;
  total_horas: number;
  total_formatado: string;
}

export interface AzureWorkItemInfo {
  originalEstimate?: number;
  remainingWork?: number;
  completedWork?: number;
}
