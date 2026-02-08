/**
 * Tipos auxiliares para listagem de equipes (times) do Azure DevOps.
 */

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  url?: string | null;
  identity_url?: string | null;
  project_id: string;
  project_name: string;
}

export interface TeamsResponse {
  count: number;
  teams: Team[];
  mine_only: boolean;
  is_admin: boolean;
  default_team_id: string | null;
}

export interface TeamsParams {
  organization_name: string;
  project_id: string;
}
