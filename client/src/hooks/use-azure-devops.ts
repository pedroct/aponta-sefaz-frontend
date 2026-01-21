/**
 * Hook para integração com Azure DevOps SDK
 * 
 * Detecta automaticamente se está rodando dentro de um iframe do Azure DevOps
 * e fornece autenticação híbrida:
 * - Produção (iframe): usa SDK.getAccessToken() para Bearer OAuth
 * - Desenvolvimento (standalone): usa VITE_AZURE_PAT do .env
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos importados apenas para tipagem (não executa código)
import type { IProjectPageService } from 'azure-devops-extension-api';

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

// Referência para o SDK carregado dinamicamente
let sdkModule: typeof import('azure-devops-extension-sdk') | null = null;
let apiModule: typeof import('azure-devops-extension-api') | null = null;

/**
 * Detecta se está rodando em iframe do Azure DevOps
 * Verifica tanto o iframe quanto a presença de indicadores específicos do Azure DevOps
 */
function detectAzureDevOpsEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar se está em iframe
  const inIframe = window.parent !== window;
  
  // Verificar se a URL do parent parece ser Azure DevOps
  try {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar referrer para domínios Azure
    const isAzureReferrer = referrer.includes('dev.azure.com') ||
                            referrer.includes('visualstudio.com') ||
                            referrer.includes('.azure.com');

    // Verificar parâmetros específicos do Azure DevOps na URL
    const hasAzureParams = urlParams.has('hostId') || 
                           urlParams.has('extensionId') ||
                           urlParams.has('__ado');

    // Verificar path específico da extensão (dist/*.html)
    const isExtensionPath = window.location.pathname.startsWith('/dist/');

    // Log para debug
    console.log('[detectAzureDevOpsEnvironment]', {
      inIframe,
      referrer: referrer || '(empty)',
      isAzureReferrer,
      hasAzureParams,
      isExtensionPath,
      pathname: window.location.pathname,
      search: window.location.search,
    });

    // Considerar Azure DevOps se:
    // 1. Está em iframe E tem referrer Azure, OU
    // 2. Tem parâmetros Azure na URL, OU
    // 3. Está em iframe E está no path /dist/ (path da extensão)
    const isAzureEnv = (inIframe && isAzureReferrer) || 
                       hasAzureParams || 
                       (inIframe && isExtensionPath);

    return isAzureEnv;
  } catch (err) {
    console.error('[detectAzureDevOpsEnvironment] Erro:', err);
async function loadAzureSDK() {
  if (!sdkModule) {
    sdkModule = await import('azure-devops-extension-sdk');
  }
  if (!apiModule) {
    apiModule = await import('azure-devops-extension-api');
  }
  return { SDK: sdkModule, API: apiModule };
}

export function useAzureDevOps(): UseAzureDevOpsReturn {
  const [isInAzureDevOps, setIsInAzureDevOps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<AzureContext | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Ref para evitar inicialização duplicada
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
   * Inicializa o Azure DevOps SDK quando em iframe
   */
  const initializeAzureSDK = useCallback(async () => {
    if (initializationRef.current !== 'pending') return;
    initializationRef.current = 'initializing';

    try {
      // Carregar SDK dinamicamente (só quando realmente precisar)
      const { SDK, API } = await loadAzureSDK();
      
      // Inicializar SDK
      await SDK.init();
      await SDK.ready();

      // Obter token de acesso
      const accessToken = await SDK.getAccessToken();
      
      // Obter contexto do projeto
      const projectService = await SDK.getService<IProjectPageService>(
        API.CommonServiceIds.ProjectPageService
      );
      const project = await projectService.getProject();
      
      // Obter nome da organização do host
      const host = SDK.getHost();
      
      setIsInAzureDevOps(true);
      setToken(accessToken);
      setContext({
        organization: host.name,
        project: project?.name || '',
        projectId: project?.id || '',
      });
      
      // Notificar Azure DevOps que a extensão carregou com sucesso
      SDK.notifyLoadSucceeded();
      
      console.log('[useAzureDevOps] SDK inicializado com sucesso', {
        organization: host.name,
        project: project?.name,
      });
    } catch (err) {
      console.error('[useAzureDevOps] Falha ao inicializar SDK:', err);
      setError(err instanceof Error ? err : new Error('Falha ao inicializar Azure DevOps SDK'));
      setIsInAzureDevOps(false);
      
      // Fallback para modo standalone
      initializeStandalone();
    } finally {
      setIsLoading(false);
      initializationRef.current = 'done';
    }
  }, [initializeStandalone]);

  /**
   * Renova o token de acesso
   * - Em produção: chama SDK.getAccessToken() novamente
   * - Em desenvolvimento: retorna o PAT (não expira)
   */
  const refreshToken = useCallback(async (): Promise<string> => {
    if (isInAzureDevOps && sdkModule) {
      try {
        const newToken = await sdkModule.getAccessToken();
        setToken(newToken);
        console.log('[useAzureDevOps] Token renovado via SDK');
        return newToken;
      } catch (err) {
        console.error('[useAzureDevOps] Falha ao renovar token:', err);
        throw err;
      }
    }
    
    // Modo standalone - PAT não expira
    const pat = import.meta.env.VITE_AZURE_PAT || import.meta.env.VITE_API_TOKEN || '';
    return pat;
  }, [isInAzureDevOps]);

  // Efeito de inicialização
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
