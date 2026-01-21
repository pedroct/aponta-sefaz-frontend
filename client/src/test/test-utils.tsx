/**
 * Utilitários de teste para componentes React
 * 
 * Fornece wrappers com providers necessários para os testes
 */

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock do ApiClient para testes
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

// Mock do contexto Azure DevOps
export const mockAzureContext = {
  isInAzureDevOps: false,
  isLoading: false,
  organization: 'test-org',
  project: 'test-project',
  projectId: 'test-project-id',
  api: mockApiClient,
  token: 'test-token',
  getToken: vi.fn().mockResolvedValue('test-token'),
  refreshToken: vi.fn().mockResolvedValue('test-token'),
  error: null,
};

// Criar QueryClient para testes
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper apenas com QueryClient (sem AzureDevOps)
 */
export function QueryOnlyProvider({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Render com apenas QueryClient
 */
export function renderWithQuery(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: QueryOnlyProvider, ...options });
}

// Re-exportar tudo de testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Exportar utilitários customizados
export { renderWithQuery as customRender };
