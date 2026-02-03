import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/user", () => {
    return HttpResponse.json({
      id: "user-123",
      displayName: "Test User",
      emailAddress: "test@example.com",
      avatarUrl: null,
    });
  }),

  http.get("/atividades", () => {
    return HttpResponse.json({
      items: [],
      total: 0,
    });
  }),

  http.get("/projetos", () => {
    return HttpResponse.json({
      items: [],
      total: 0,
    });
  }),

  http.get("/integracao/projetos", () => {
    return HttpResponse.json([]);
  }),

  http.get("/organization-pats", () => {
    return HttpResponse.json({
      items: [],
      total: 0,
    });
  }),

  http.post("/organization-pats/validate", async () => {
    return HttpResponse.json({
      valid: true,
      organization_name: "org",
      message: "OK",
      projects_count: 0,
      projects: [],
    });
  }),

  http.post(/\/organization-pats\/[^/]+\/validate/, async () => {
    return HttpResponse.json({
      valid: true,
      organization_name: "org",
      message: "OK",
      projects_count: 0,
      projects: [],
    });
  }),

  http.post("/integracao/sincronizar", () => {
    return HttpResponse.json({
      message: "ok",
      projetos_sincronizados: 0,
    });
  }),

  http.get("/timesheet", ({ request }) => {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get("week_start") ?? "2026-02-02";
    return HttpResponse.json({
      semana_inicio: weekStart,
      semana_fim: "2026-02-08",
      semana_label: "02/02 - 08/02",
      work_items: [],
      total_geral_horas: 0,
      total_geral_formatado: "00:00",
      totais_por_dia: [],
      total_work_items: 0,
      total_esforco: 0,
      total_historico: 0,
    });
  }),

  http.get(/\/timesheet\/work-item\/\d+\/state-category/, () => {
    return HttpResponse.json({
      work_item_id: 1,
      state: "Active",
      state_category: "InProgress",
      can_edit: true,
      can_delete: true,
    });
  }),
];
