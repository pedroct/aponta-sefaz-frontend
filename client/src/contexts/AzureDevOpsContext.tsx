/**
 * Context Provider para integração com Azure DevOps
 *
 * Fornece:
 * - Cliente API configurado com autenticação
 * - Contexto da organização/projeto
 * - Estado de loading
 * - Detecção de ambiente (iframe vs standalone)
 */

import { createContext, useContext, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useAzureDevOps } from '@/hooks/use-azure-devops';
import { ApiClient } from '@/lib/api';

export interface AzureDevOpsContextType {
  /** Se está rodando dentro do iframe do Azure DevOps */
  isInAzureDevOps: boolean;
  /** Se está carregando/inicializando o SDK */
  isLoading: boolean;
  /** Nome da organização Azure DevOps */
  organization: string;
  /** Nome do projeto Azure DevOps */
  project: string;
  /** ID do projeto Azure DevOps */
  projectId: string;
  /** Cliente API configurado com autenticação */
  api: ApiClient;
  /** Token atual (para casos especiais) */
  token: string | null;
  /** Função para obter token (para hooks que precisam) */
  getToken: () => Promise<string>;
  /** Função para renovar token */
  refreshToken: () => Promise<string>;
  /** Erro de inicialização, se houver */
  error: Error | null;
}

const AzureDevOpsContext = createContext<AzureDevOpsContextType | null>(null);

interface AzureDevOpsProviderProps {
  children: ReactNode;
}

export function AzureDevOpsProvider({ children }: AzureDevOpsProviderProps) {
  const {
    isInAzureDevOps,
    isLoading,
    context,
    token,
    refreshToken,
    error,
  } = useAzureDevOps();

  // Usar ref para armazenar o token atual
  // Isso permite que getToken sempre retorne o valor mais recente
  const tokenRef = useRef<string | null>(token);
  
  // ✅ CORREÇÃO CRÍTICA: Atualizar ref SINCRONAMENTE durante o render
  // useEffect roda APÓS o render, mas TanStack Query dispara queries DURANTE o render
  // Isso garante que getToken() retorne o valor correto imediatamente
  tokenRef.current = token;
  
  // Log para debug (mantém useEffect só para logging)
  useEffect(() => {
    console.log('[AzureDevOpsContext] Token disponível:', token ? `(${token.length} chars)` : 'null');
  }, [token]);

  // getToken usa a ref, então sempre retorna o valor atual
  // Não precisa recriar quando token muda
  const getToken = useCallback(async () => {
    const currentToken = tokenRef.current || '';
    console.log('[AzureDevOpsContext] getToken chamado:', currentToken ? `(${currentToken.length} chars)` : 'vazio');
    return currentToken;
  }, []);

  // Wrapper do refreshToken para manter compatibilidade
  const refreshTokenCallback = useCallback(async (): Promise<string> => {
    const newToken = await refreshToken();
    tokenRef.current = newToken;
    return newToken;
  }, [refreshToken]);

  // Criar instância única do ApiClient
  // Agora usa callbacks estáveis, então só é criado uma vez
  const api = useMemo(() => {
    console.log('[AzureDevOpsContext] Criando ApiClient');
    return new ApiClient(getToken, refreshTokenCallback);
  }, [getToken, refreshTokenCallback]);

  // Valores do contexto
  const contextValue = useMemo<AzureDevOpsContextType>(() => ({
    isInAzureDevOps,
    isLoading,
    organization: context?.organization || import.meta.env.VITE_AZURE_ORG || 'sefaz-ceara-lab',
    project: context?.project || import.meta.env.VITE_AZURE_PROJECT || 'DEV',
    projectId: context?.projectId || '',
    api,
    token,
    getToken,
    refreshToken: refreshTokenCallback,
    error,
  }), [isInAzureDevOps, isLoading, context, api, token, getToken, refreshTokenCallback, error]);

  return (
    <AzureDevOpsContext.Provider value={contextValue}>
      {children}
    </AzureDevOpsContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do Azure DevOps
 *
 * @throws Error se usado fora do AzureDevOpsProvider
 */
export function useAzureContext(): AzureDevOpsContextType {
  const context = useContext(AzureDevOpsContext);

  if (!context) {
    throw new Error(
      'useAzureContext must be used within an AzureDevOpsProvider. ' +
      'Wrap your app with <AzureDevOpsProvider> in App.tsx'
    );
  }

  return context;
}

/**
 * Hook opcional que retorna null se fora do provider
 * Útil para componentes que podem existir dentro ou fora do contexto
 */
export function useAzureContextOptional(): AzureDevOpsContextType | null {
  return useContext(AzureDevOpsContext);
}

export default AzureDevOpsProvider;
