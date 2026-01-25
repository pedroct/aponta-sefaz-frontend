/**
 * Cliente HTTP com suporte a autenticação híbrida e retry automático
 * 
 * Características:
 * - Retry automático em 401 (token expirado)
 * - Suporte a Bearer OAuth (produção) e PAT (desenvolvimento)
 * - Métodos tipados para GET, POST, PUT, DELETE
 * - Compatível com TanStack Query
 */

// Detectar se está em desenvolvimento local (Docker) ou produção
function getDefaultApiUrl(): string {
  // Se VITE_API_URL está definido, usar ele
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Em localhost, usar URL relativa (nginx proxy)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/api/v1';
  }
  
  // Produção: usar domínio da API
  return 'https://api-aponta.pedroct.com.br/api/v1';
}

const API_URL = getDefaultApiUrl();

// Normalizar URL removendo barras finais e garantindo /api/v1
function normalizeApiUrl(url: string): string {
  // Se já é URL relativa, não modificar
  if (url.startsWith('/')) return url;
  
  const normalized = url.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

export const API_BASE_URL = normalizeApiUrl(API_URL);

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

type GetTokenFn = () => Promise<string>;
type RefreshTokenFn = () => Promise<string>;

export class ApiClient {
  private getToken: GetTokenFn;
  private refreshToken: RefreshTokenFn;
  private baseUrl: string;

  constructor(
    getToken: GetTokenFn,
    refreshToken: RefreshTokenFn,
    baseUrl: string = API_BASE_URL
  ) {
    this.getToken = getToken;
    this.refreshToken = refreshToken;
    this.baseUrl = baseUrl;
  }

  /**
   * Executa uma requisição HTTP com retry automático em 401
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    console.log('[ApiClient] Requisição:', options.method || 'GET', url);
    console.log('[ApiClient] Token presente:', !!token, token ? `(${token.length} chars)` : '');

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('[ApiClient] Response status:', response.status, response.statusText);

    // Retry em 401 (token expirado)
    if (response.status === 401) {
      console.log('[ApiClient] Token expirado, renovando...');
      const newToken = await this.refreshToken();

      const retryHeaders = new Headers(options.headers);
      if (!retryHeaders.has('Content-Type') && options.body) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newToken}`);

      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new ApiClientError(
          retryResponse.status,
          `API Error: ${retryResponse.status}`,
          errorText
        );
      }

      // Handle 204 No Content
      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json();
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiClientError(
        response.status,
        `API Error: ${response.status}`,
        errorText
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;
