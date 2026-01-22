# 📚 Índice de Documentação - Aponta SEFAZ Frontend

## 📖 Documentos por Categoria

### 🚀 Deploy & Infraestrutura

| Documento | Descrição |
|-----------|-----------|
| [CI_CD_PIPELINE.md](./docs/deploy/CI_CD_PIPELINE.md) | Configuração do GitHub Actions e fluxo de deploy |
| [INFRASTRUCTURE.md](./docs/deploy/INFRASTRUCTURE.md) | Detalhes da VPS, containers, URLs e rede Docker |
| [TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md) | **NOVO!** Problemas comuns e soluções |
| [CHANGELOG.md](./docs/deploy/CHANGELOG.md) | Histórico de versões e mudanças |

### 🔐 Autenticação Azure DevOps

| Documento | Descrição |
|-----------|-----------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | TL;DR - Comece por aqui! |
| [EXTENSION_AZURE_DEVOPS.md](./EXTENSION_AZURE_DEVOPS.md) | **NOVO!** Status e arquitetura da extensão |
| [ANALISE_ENTRA_ID.md](./ANALISE_ENTRA_ID.md) | Análise técnica profunda do Entra ID |
| [ESTRATEGIAS_OAUTH.md](./ESTRATEGIAS_OAUTH.md) | Padrões de autenticação documentados |
| [BACKEND_AUTH_CONTEXT.md](./BACKEND_AUTH_CONTEXT.md) | Contexto de autenticação para backend |
| [RELATORIO_FINAL.md](./RELATORIO_FINAL.md) | Implementação completa com código |

### 📁 Documentação Técnica

| Documento | Descrição |
|-----------|-----------|
| [architecture.md](./docs/architecture.md) | Arquitetura do sistema |
| [development-workflow.md](./docs/development-workflow.md) | Fluxo de desenvolvimento e Git |
| [data-flow.md](./docs/data-flow.md) | Fluxo de dados |
| [security.md](./docs/security.md) | Segurança |
| [testing-strategy.md](./docs/testing-strategy.md) | Estratégia de testes |
| [tooling.md](./docs/tooling.md) | Ferramentas utilizadas |

### 📝 Implementações Recentes

| Documento | Descrição |
|-----------|-----------|
| [IMPLEMENTATION_COLUNA_SALDO.md](./IMPLEMENTATION_COLUNA_SALDO.md) | **NOVO!** Coluna S (Saldo) no Timesheet |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Remoção do checkbox "Somente meus itens" |

---

## 🗺️ Mapa de Navegação

```
COMECE AQUI
     │
     ├─→ [DEPLOY] Precisa fazer deploy?
     │      └─→ docs/deploy/CI_CD_PIPELINE.md
     │
     ├─→ [DEV] Vai desenvolver?
     │      ├─→ docs/development-workflow.md
     │      └─→ docs/architecture.md
     │
     ├─→ [AUTH] Problemas com autenticação?
     │      ├─→ QUICK_REFERENCE.md
     │      └─→ EXTENSION_AZURE_DEVOPS.md  ← NOVO!
     │
     ├─→ [EXTENSÃO] Trabalhando na extensão Azure DevOps?
     │      └─→ EXTENSION_AZURE_DEVOPS.md  ← NOVO!
     │
     ├─→ [PROBLEMA] Algo não funciona?
     │      └─→ docs/deploy/TROUBLESHOOTING.md
     │
     └─→ [INFRA] Problemas no servidor?
            └─→ docs/deploy/INFRASTRUCTURE.md
```

---

## 🎯 Guia Rápido por Perfil

### 👨‍💻 Desenvolvedor
1. Ler [development-workflow.md](./docs/development-workflow.md)
2. Entender [architecture.md](./docs/architecture.md)
3. Configurar ambiente local

### 🚀 DevOps
1. Ler [CI_CD_PIPELINE.md](./docs/deploy/CI_CD_PIPELINE.md)
2. Verificar [INFRASTRUCTURE.md](./docs/deploy/INFRASTRUCTURE.md)
3. Consultar [TROUBLESHOOTING.md](./docs/deploy/TROUBLESHOOTING.md) se algo falhar

### 🏗️ Arquiteto
1. Ler [architecture.md](./docs/architecture.md)
2. Revisar [ANALISE_ENTRA_ID.md](./ANALISE_ENTRA_ID.md)
3. Avaliar [ESTRATEGIAS_OAUTH.md](./ESTRATEGIAS_OAUTH.md)

---

## 📊 Status do Projeto

| Ambiente | Status | Versão | Data |
|----------|--------|--------|------|
| **Staging** | ✅ Funcionando | v1.0.10 | 22/01/2026 |
| **Production** | 🔄 Pronto para deploy | - | - |
| **Extensão Azure DevOps** | ✅ Funcionando | v1.0.9 | 21/01/2026 |

### Funcionalidades Implementadas

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Timesheet (Folha de Horas)** | ✅ Funcionando | Grid semanal com colunas E, H, S e 7 dias |
| **Coluna Saldo (S)** | ✅ Novo | Exibe remaining_work do Work Item |
| **Gestão de Atividades** | ✅ Funcionando | CRUD completo de atividades |
| **Gestão de Projetos** | ✅ Funcionando | Sincronização com Azure DevOps |
| **Modal Apontamento** | ✅ Funcionando | Criação/edição de apontamentos |

### CI/CD Status

- ✅ GitHub Actions configurado
- ✅ Deploy automático staging (branch `develop`)
- ✅ Deploy automático production (branch `main`)
- ✅ Health checks funcionando
- ✅ Extensão Azure DevOps (2 hubs: Timesheet + Atividades)
- ✅ Autenticação JWT (getAppToken) funcionando
- ✅ Sincronização de projetos Azure DevOps

---

## 🌐 URLs

### Produção
- https://aponta.treit.com.br

### Staging  
- https://staging-aponta.treit.com.br

### API Docs
- https://staging-aponta.treit.com.br/docs (Swagger)
- https://staging-aponta.treit.com.br/redoc (ReDoc)

---

## 🔗 Links Importantes

### Repositórios
- **Frontend**: https://github.com/pedroct/aponta-sefaz-frontend
- **Backend**: https://github.com/pedroct/api-aponta-vps

### Actions
- [Staging Workflow](https://github.com/pedroct/aponta-sefaz-frontend/actions/workflows/deploy-staging.yml)
- [Production Workflow](https://github.com/pedroct/aponta-sefaz-frontend/actions/workflows/deploy-production.yml)

### Documentação Externa
- [Azure DevOps REST API](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
- [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 📋 Checklist de Onboarding

### Desenvolvedor Novo
- [ ] Clonar repositório
- [ ] Executar `npm install`
- [ ] Criar `.env` baseado em `.env.example`
- [ ] Executar `npm run dev`
- [ ] Ler [development-workflow.md](./docs/development-workflow.md)

### Acesso ao Deploy
- [ ] Obter acesso ao repositório GitHub
- [ ] Verificar permissões nos environments (staging/production)
- [ ] Testar push para branch `develop`
- [ ] Verificar workflow no Actions

---

**Versão**: 2.4
**Última atualização**: 22 de janeiro de 2026
**Status**: ✅ Staging v1.0.10 + Coluna Saldo (S) + Extensão Azure DevOps
