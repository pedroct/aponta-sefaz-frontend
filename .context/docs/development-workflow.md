# Workflow de Desenvolvimento

## Setup Local

```bash
npm install
npm run dev        # Inicia Express + Vite middleware
npm run dev:client # Inicia apenas Vite
```

## Build e Start

```bash
npm run build  # Gera build de produção
npm run start  # Inicia servidor em modo produção
```

## Checagem de Tipos

```bash
npm run check  # TypeScript (tsc)
```

## Testes

```bash
npm run test        # Executa testes
npm run test:watch  # Testes em modo watch
```

## Porta

- Padrão: 5000 (override via `PORT`)

---

## Git Workflow

### Branches

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção | Automático → VPS prod |
| `develop` | Staging | Automático → VPS staging |
| `feature/*` | Desenvolvimento | Nenhum |

### Fluxo de Trabalho

```
feature/nova-funcionalidade
       ↓ (PR + Review)
   develop
       ↓ (PR + Aprovação)
     main
```

### Commits

- Usar [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` nova funcionalidade
  - `fix:` correção de bug
  - `docs:` documentação
  - `style:` formatação
  - `refactor:` refatoração
  - `test:` testes
  - `chore:` manutenção

### Exemplo

```bash
git checkout develop
git checkout -b feature/minha-feature
# ... desenvolve ...
git add .
git commit -m "feat: adiciona validação de horas"
git push origin feature/minha-feature
# Criar PR para develop
```

---

## Deploy

### Staging (Automático)

```bash
git checkout develop
git pull origin develop
git merge feature/minha-feature
git push origin develop
# GitHub Actions faz o deploy automaticamente
```

### Production (Automático)

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
# GitHub Actions faz o deploy automaticamente
```

### Verificar Deploy

1. Acessar: https://github.com/pedroct/aponta-sefaz-frontend/actions
2. Verificar se o workflow passou
3. Testar a aplicação no ambiente correspondente

---

## Contribuição

- Adotar commits pequenos e revisão focada
- Adicionar testes em `client/src/*.test.tsx` quando houver lógica
- Documentar mudanças significativas

---

**Última atualização**: 21 de janeiro de 2026
