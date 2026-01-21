/**
 * Hook para integração com Azure DevOps SDK
 *
 * Detecta automaticamente se está rodando dentro de um iframe do Azure DevOps
 * e fornece autenticação híbrida:
 * - Produção (iframe): usa SDK.getAccessToken() para Bearer OAuth
 * - Desenvolvimento (standalone): usa VITE_AZURE_PAT do .env
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, IProjectPageService } from 'azure-devops-extension-api';

export interface AzureContext {
  organization: string;
  project: string;
  projectId: string;
}

interface UseAzureDevOpsReturn {
  /** Se está rodando dentro do iframe do Azure DevOps */
  isInAzureDevOps: boolean;
  /** Se está carregando/inicializando o SDK */
  isLoading: boolean;
  /** Contexto com org/project (null se não disponível) */
  context: AzureContext | null;
  /** Token atual (OAuth ou PAT) */
  token: string | null;
  /** Função para renovar token (reativa - chamar após 401) */
  refreshToken: () => Promise<string>;
  /** Erro de inicialização, se houver */
  error: Error | null;
}

/**
 * Detecta se está rodando em iframe do Azure DevOps
 */
function detectAzureDevOpsEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  const inIframe = window.parent !== window;

  try {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);

    const isAzureReferrer = referrer.includes('dev.azure.com') ||
                            referrer.includes('visualstudio.com') ||
                            referrer.includes('.azure.com') ||
                            referrer.includes('vsassets.io') ||
                            referrer.includes('gallerycdn.vsassets.io');

    const hasAzureParams = urlParams.has('hostId') ||
                           urlParams.has('extensionId') ||
                           urlParams.has('__ado') ||
                           urlParams.has('organization') ||
                           urlParams.has('project');

    const isExtensionPath = window.location.pathname.startsWith('/dist/');

    console.log('[detectAzureDevOpsEnvironment]', {
      inIframe,
      referrer: referrer || '(empty)',
      isAzureReferrer,
      hasAzureParams,
      isExtensionPath,
      pathname: window.location.pathname,
    });

    return (inIframe && isAzureReferrer) || hasAzureParams || (inIframe && isExtensionPath);
  } catch (err) {
    console.error('[detectAzureDevOpsEnvironment] Erro:', err);
    return false;
  }
}

export function useAzureDevOps(): UseAzureDevOpsReturn {
  const [isInAzureDevOps, setIsInAzureDevOps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<AzureContext | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initializationRef = useRef<'pending' | 'initializing' | 'done'>('pending');

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

  const initializeAzureSDK = useCallback(async () => {
    if (initializationRef.current !== 'pending') return;
    initializationRef.current = 'initializing';

    try {
      console.log('[useAzureDevOps] Inicializando SDK npm...');
      
      await SDK.init();
      await SDK.ready();
      
      console.log('[useAzureDevOps] SDK.ready() concluído');

      const accessToken = await SDK.getAccessToken();
      console.log('[useAzureDevOps] Token obtido:', !!accessToken);

      const projectService = await SDK.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
      );
      const project = await projectService.getProject();
      const host = SDK.getHost();

      setIsInAzureDevOps(true);
      setToken(accessToken);
      setContext({
        organization: host.name,
        project: project?.name || '',
        projectId: project?.id || '',
      });

      SDK.notifyLoadSucceeded();

      console.log('[useAzureDevOps] SDK inicializado com sucesso', {
        organization: host.name,
        project: project?.name,
      });
    } catch (err) {
      console.error('[useAzureDevOps] Falha ao inicializar SDK:', err);
      setError(err instanceof Error ? err : new Error('Falha ao inicializar Azure DevOps SDK'));
      setIsInAzureDevOps(false);
      initializeStandalone();
    } finally {
      setIsLoading(false);
      initializationRef.current = 'done';
    }
  }, [initializeStandalone]);

  const refreshToken = useCallback(async (): Promise<string> => {
    if (isInAzureDevOps) {
      try {
        const newToken = await SDK.getAccessToken();
        setToken(newToken);
        console.log('[useAzureDevOps] Token renovado via SDK');
        return newToken;
      } catch (err) {
        console.error('[useAzureDevOps] Falha ao renovar token:', err);
        throw err;
      }
    }

    const pat = import.meta.env.VITE_AZURE_PAT || import.meta.env.VITE_API_TOKEN || '';
    return pat;
  }, [isInAzureDevOps]);

  useEffect(() => {
    const isAzureEnv = detectAzureDevOpsEnvironment();

    if (isAzureEnv) {
      console.log('[useAzureDevOps] Ambiente Azure DevOps detectado, inicializando SDK...');
      initializeAzureSDK();
    } else {
      console.log('[useAzureDevOps] Ambiente standalone detectado');
      initializeStandalone();
      initializationRef.current = 'done';
    }
  }, [initializeAzureSDK, initializeStandalone]);

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
