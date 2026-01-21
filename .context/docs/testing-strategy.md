# Estratégia de Testes

**Última Atualização:** 21/01/2026  
**Status:** ✅ 83 testes passando

---

## Framework

- **Vitest** v4.0.17 + React Testing Library
- Ambiente `jsdom`
- Configuração em `vitest.config.ts` e `vitest.setup.ts`

## Onde ficam os testes

```
client/src/
├── App.test.tsx                              # Testes de rotas
├── hooks/
│   ├── use-current-user.test.ts              # Hook de usuário
│   └── use-atividades.test.ts                # Hook de atividades
├── pages/
│   ├── FolhaDeHoras.test.tsx                 # Página principal
│   └── not-found.test.tsx                    # Página 404
└── components/custom/
    └── ModalAdicionarTempo.test.tsx          # Modal de apontamento
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run test` | Roda todos os testes |
| `npm run test -- --run` | Roda uma vez e sai |
| `npm run test -- --watch` | Modo watch |
| `npm run test -- --ui` | Interface visual |

## CI/CD Integration

Os testes rodam automaticamente no GitHub Actions:
- **Staging:** Branch `develop` → `deploy-staging.yml`
- **Production:** Branch `main` → `deploy-production.yml`

```yaml
# .github/workflows/deploy-staging.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test -- --run
```

## Boas práticas

- Prefira testes de renderização e comportamento da UI
- Mock de chamadas HTTP usando objeto mock do `ApiClient`
- Mock de contextos (`AzureDevOpsContext`, `QueryClientProvider`)
- Usar `waitFor` para operações assíncronas

## Exemplo de teste

```typescript
// client/src/hooks/use-current-user.test.ts
describe("useCurrentUser", () => {
  it("deve retornar dados do usuário com sucesso", async () => {
    const mockUser = {
      id: "123",
      displayName: "Test User",
      emailAddress: "test@example.com",
    };

    mockApiClient.get.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });
});
```

## Métricas

| Métrica | Valor |
|---------|-------|
| Total de testes | 83 |
| Arquivos de teste | 6 |
| Tempo médio | ~9s |
| Cobertura | Não definida (meta futura)
