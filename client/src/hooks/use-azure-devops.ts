/**
 * Hook para integração com Azure DevOps
 *
 * Quando rodando dentro de um iframe do Azure DevOps (via extensão),
 * o token OAuth e contexto são passados via URL query params pelo HTML wrapper.
 * 
 * Quando rodando standalone (desenvolvimento), usa VITE_AZURE_PAT do .env.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AzureContext {
  organization: string;
  project: string;
  projectId: string;
  userId?: string;
  userName?: string;
  userUniqueName?: string; // uniqueName do Azure (geralmente é o email)
  userEmail?: string;
  workItemId?: string;
  workItemTitle?: string;
  workItemType?: string;
}

interface UseAzureDevOpsReturn {
  /** Se está rodando dentro do iframe do Azure DevOps */
  isInAzureDevOps: boolean;
  /** Se está carregando/inicializando */
  isLoading: boolean;
  /** Contexto com org/project (null se não disponível) */
  context: AzureContext | null;
  /** Token atual (OAuth ou PAT) */
  token: string | null;
  /** Função para renovar token (não implementada - token vem da URL) */
  refreshToken: () => Promise<string>;
  /** Erro de inicialização, se houver */
  error: Error | null;
}

/**
 * Extrai parâmetros da URL passados pelo HTML wrapper da extensão
 *
 * Suporta dois formatos de URL:
 * 1. Query params normais: https://example.com?token=xxx
 * 2. Params após hash (hash routing): https://example.com/#/page?token=xxx
 */
function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();

  // Primeiro tenta os query params normais
  if (window.location.search) {
    return new URLSearchParams(window.location.search);
  }

  // Se não há search params, verifica se há params no hash (após ?)
  // URL format: https://example.com/#/atividades?embedded=true&token=xxx
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf('?');
  if (hashQueryIndex !== -1) {
    const hashQuery = hash.substring(hashQueryIndex);
    return new URLSearchParams(hashQuery);
  }

  return new URLSearchParams();
}

/**
 * Detecta se está rodando em iframe do Azure DevOps
 * Verifica a presença de parâmetros específicos passados pelo wrapper HTML
 */
function detectAzureDevOpsEnvironment(): { isAzure: boolean; params: URLSearchParams } {
  const params = getUrlParams();
  
  // O wrapper HTML passa 'embedded=true' e 'source=azdo-*' quando em Azure DevOps
  const isEmbedded = params.get('embedded') === 'true';
  const source = params.get('source') || '';
  const isAzureSource = source.startsWith('azdo-');
  
  // Também verifica se tem token e organization (só presentes quando vem do Azure)
  const hasToken = params.has('token') && params.get('token') !== '';
  const hasOrg = params.has('organization') && params.get('organization') !== '';
  
  const isAzure = (isEmbedded && isAzureSource) || (hasToken && hasOrg);
  
  console.log('[detectAzureDevOpsEnvironment]', {
    isEmbedded,
    source,
    isAzureSource,
    hasToken,
    hasOrg,
    isAzure,
  });
  
  return { isAzure, params };
}

export function useAzureDevOps(): UseAzureDevOpsReturn {
  const [isInAzureDevOps, setIsInAzureDevOps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<AzureContext | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initializationRef = useRef<'pending' | 'initializing' | 'done'>('pending');

  /**
   * Inicializa modo standalone (desenvolvimento local)
   */
  const initializeStandalone = useCallback(() => {
    const pat = import.meta.env.VITE_AZURE_PAT || import.meta.env.VITE_API_TOKEN;
    const org = import.meta.env.VITE_AZURE_ORG || 'sefaz-ceara-lab';
    const project = import.meta.env.VITE_AZURE_PROJECT || 'DEV';

    setIsInAzureDevOps(false);
    setToken(pat || null);
    setContext({
      organization: org,
      project: project,
      projectId: '',
    });
    setIsLoading(false);

    console.log('[useAzureDevOps] Modo standalone inicializado', {
      hasToken: !!pat,
      organization: org,
      project: project,
    });
  }, []);

  /**
   * Inicializa usando parâmetros passados via URL pelo wrapper HTML
   */
  const initializeFromUrlParams = useCallback((params: URLSearchParams) => {
    try {
      const accessToken = params.get('token') || '';
      const organization = params.get('organization') || '';
      const project = params.get('project') || '';
      const projectId = params.get('projectId') || '';
      const userId = params.get('userId') || '';
      const userName = params.get('userName') || '';
      const userUniqueName = params.get('userUniqueName') || '';
      const userEmail = params.get('userEmail') || '';
      const workItemId = params.get('workItemId') || undefined;
      const workItemTitle = params.get('workItemTitle') || undefined;
      const workItemType = params.get('workItemType') || undefined;

      if (!accessToken) {
        throw new Error('Token não encontrado nos parâmetros da URL');
      }

      setIsInAzureDevOps(true);
      setToken(accessToken);
      setContext({
        organization,
        project,
        projectId,
        userId,
        userName,
        userUniqueName,
        userEmail,
        workItemId,
        workItemTitle,
        workItemType,
      });
      setIsLoading(false);

      console.log('[useAzureDevOps] Inicializado via URL params', {
        hasToken: !!accessToken,
        tokenLength: accessToken.length,
        organization,
        project,
        userId,
        userName,
        userUniqueName,
        workItemId,
      });
    } catch (err) {
      console.error('[useAzureDevOps] Erro ao inicializar via URL:', err);
      setError(err instanceof Error ? err : new Error('Falha ao inicializar'));
      // Fallback para standalone
      initializeStandalone();
    }
  }, [initializeStandalone]);

  /**
   * Renova o token de acesso
   * Nota: Quando em iframe, o token vem da URL e não pode ser renovado aqui.
   */
  const refreshToken = useCallback(async (): Promise<string> => {
    if (isInAzureDevOps) {
      console.warn('[useAzureDevOps] Token refresh não suportado em modo iframe. Token atual será retornado.');
      return token || '';
    }
    
    const pat = import.meta.env.VITE_AZURE_PAT || import.meta.env.VITE_API_TOKEN || '';
    return pat;
  }, [isInAzureDevOps, token]);

  // Efeito de inicialização
  useEffect(() => {
    if (initializationRef.current !== 'pending') return;
    initializationRef.current = 'initializing';

    const { isAzure, params } = detectAzureDevOpsEnvironment();

    if (isAzure) {
      console.log('[useAzureDevOps] Ambiente Azure DevOps detectado, lendo parâmetros da URL...');
      initializeFromUrlParams(params);
    } else {
      console.log('[useAzureDevOps] Ambiente standalone detectado');
      initializeStandalone();
    }

    initializationRef.current = 'done';
  }, [initializeFromUrlParams, initializeStandalone]);

  return {
    isInAzureDevOps,
    isLoading,
    context,
    token,
    refreshToken,
    error,
  };
}

export default useAzureDevOps;
