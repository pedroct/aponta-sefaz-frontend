import { useQuery } from "@tanstack/react-query";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

export interface Atividade {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  projetos?: { id: string; nome: string }[];
}

interface AtividadeListResponse {
  items: Atividade[];
  total: number;
}

function normalizeAtividadesResponse(data: unknown): AtividadeListResponse {
  if (Array.isArray(data)) {
    return { items: data as Atividade[], total: data.length };
  }

  if (data && typeof data === "object" && "items" in data) {
    const payload = data as { items?: Atividade[]; total?: number };
    return {
      items: payload.items ?? [],
      total: payload.total ?? payload.items?.length ?? 0,
    };
  }

  return { items: [], total: 0 };
}

export function useAtividades(params?: {
  ativo?: boolean;
  id_projeto?: string;
  skip?: number;
  limit?: number;
}) {
  const { api, token, isLoading } = useAzureContext();

  return useQuery({
    queryKey: ["atividades", params],
    queryFn: async () => {
      console.log('[useAtividades] Executando queryFn, token disponível:', !!token);
      const data = await api.get("/atividades", {
        ativo: params?.ativo,
        id_projeto: params?.id_projeto,
        skip: params?.skip,
        limit: params?.limit,
      });
      return normalizeAtividadesResponse(data);
    },
    // Só executar quando tiver token e não estiver carregando
    enabled: !!token && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
