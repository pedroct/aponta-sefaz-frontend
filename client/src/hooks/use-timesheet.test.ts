import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useTimesheet,
  useWorkItemStateCategory,
  useInvalidateTimesheet,
} from "./use-timesheet";
import { formatDateForApi, getMondayOfWeek } from "@/lib/timesheet-types";

const mockApiGet = vi.fn();

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: { get: mockApiGet },
    token: "mock-token",
    isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useTimesheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve usar week_start calculado quando não informado", async () => {
    const expectedWeekStart = formatDateForApi(getMondayOfWeek(new Date()));

    mockApiGet.mockResolvedValueOnce({
      semana_inicio: "2026-02-02",
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

    const { result } = renderHook(
      () =>
        useTimesheet({
          organization_name: "org",
          project_id: "proj",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/timesheet",
      expect.objectContaining({
        organization_name: "org",
        project_id: "proj",
        week_start: expectedWeekStart,
      })
    );
  });

  it("deve enviar iteration_id quando informado", async () => {
    mockApiGet.mockResolvedValueOnce({
      semana_inicio: "2026-02-02",
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

    const { result } = renderHook(
      () =>
        useTimesheet({
          organization_name: "org",
          project_id: "proj",
          week_start: "2026-02-02",
          iteration_id: "iter-123",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/timesheet",
      expect.objectContaining({
        iteration_id: "iter-123",
      })
    );
  });

  it("deve enviar team_id quando informado", async () => {
    mockApiGet.mockResolvedValueOnce({
      semana_inicio: "2026-02-02",
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

    const { result } = renderHook(
      () =>
        useTimesheet({
          organization_name: "org",
          project_id: "proj",
          week_start: "2026-02-02",
          team_id: "team-123",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/timesheet",
      expect.objectContaining({
        team_id: "team-123",
      })
    );
  });

  it("não executa quando enabled=false", async () => {
    const { result } = renderHook(
      () =>
        useTimesheet(
          {
            organization_name: "org",
            project_id: "proj",
            week_start: "2026-02-02",
          },
          { enabled: false }
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

describe("useWorkItemStateCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não executa quando workItemId é null", async () => {
    const { result } = renderHook(
      () => useWorkItemStateCategory(null, "org", "proj"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

describe("useInvalidateTimesheet", () => {
  it("deve invalidar queries padrão e por semana", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useInvalidateTimesheet(), { wrapper });

    result.current.invalidate();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["timesheet"] });

    result.current.invalidateForWeek("org", "proj", "2026-02-02");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["timesheet", "org", "proj", "2026-02-02"],
    });
  });
});
