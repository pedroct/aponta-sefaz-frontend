# 📋 Changelog - Aponta SEFAZ Frontend

## [1.0.1] - 2026-01-21 (Staging)

### 🐛 Correções

- **X-Frame-Options**: Removido via Cloudflare Transform Rules para permitir iframe no Azure DevOps
- **nginx.conf**: Adicionado redirecionamento de `/dist/*.html` para `index.html` (suporte à extensão Azure DevOps)
- **502 Bad Gateway**: Documentado procedimento de restart do nginx-aponta após deploys

### 📁 Arquivos Modificados

- `nginx.conf`: Nova location para `/dist/*.html`

---

## [1.0.0] - 2026-01-21 (Staging)

### 🚀 Lançamento Inicial

Esta é a primeira versão do frontend em staging, com CI/CD completo configurado.

### ✅ Funcionalidades

- **Folha de Horas**: Interface para apontamento de horas
- **Integração Azure DevOps**: Busca de Work Items via PAT
- **Modal de Apontamento**: Adicionar tempo em tasks/bugs
- **Grid Semanal**: Visualização de horas por semana
- **Autenticação**: Identificação do usuário via Entra ID

### 🛠️ Infraestrutura

- **CI/CD GitHub Actions**: Deploy automático via push
- **Docker**: Container nginx:alpine para servir SPA
- **VPS**: Deploy em servidor próprio (92.112.178.252)
- **Ambientes**: Staging (develop) e Production (main)

### 📁 Arquivos Criados

- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

### 🐛 Correções Durante Setup

1. **nginx upstream**: Alterado de `host.docker.internal` para `api:8000`
2. **Health check**: Alterado de `wget` para `curl` (nginx:alpine)

### 📊 Stack Técnica

| Tecnologia | Versão |
|------------|--------|
| React | 18.x |
| Vite | 5.x |
| TypeScript | 5.x |
| TailwindCSS | 3.x |
| shadcn/ui | - |
| nginx | alpine |

### 🔗 Repositórios

- **Frontend**: https://github.com/pedroct/aponta-sefaz-frontend
- **Backend**: https://github.com/pedroct/api-aponta-vps

### 👥 Time

- Deploy configurado por: GitHub Copilot + Pedro

---

## Próximas Versões

### [1.1.0] - Planejado
- [ ] Testes E2E automatizados
- [ ] Cache de Work Items
- [ ] Modo offline básico

### [1.2.0] - Planejado  
- [ ] Dashboard de métricas
- [ ] Exportação de relatórios
- [ ] Notificações push
