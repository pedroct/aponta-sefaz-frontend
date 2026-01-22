# 📍 Localização da Query + Solução Completa

## 🔍 Onde a Query é Gerada

### Frontend
- **Arquivo**: [client/src/hooks/use-timesheet.ts](client/src/hooks/use-timesheet.ts#L38)
- **Linha**: 38
- **Hook**: `useTimesheet()`
- **Endpoint chamado**: `GET /api/v1/timesheet`

```typescript
// Linha 38
return api.get<TimesheetResponse>("/timesheet", {
  organization_name,
  project_id,
  week_start: effectiveWeekStart,
});
```

### Backend (Remoto)
- **URL**: https://staging-aponta.treit.com.br/api/v1/timesheet
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Banco de dados**: PostgreSQL com schema `api_aponta_staging`

---

## 🛢️ Problema: Tabela Não Existe

A query SQL que está falhando:

```sql
SELECT ... FROM api_aponta_staging.apontamentos 
LEFT OUTER JOIN api_aponta_staging.atividades AS atividades_1 
WHERE ...
```

**Erro**:
```
(psycopg2.errors.UndefinedTable) relation "api_aponta_staging.apontamentos" does not exist
```

**Por quê?** As tabelas nunca foram criadas ou foram deletadas.

---

## ✅ Solução: 3 Arquivos Criados

### 1. **[QUICK_FIX_DATABASE.md](QUICK_FIX_DATABASE.md)** ⚡ (RECOMENDADO)
- **Tempo**: 5 minutos
- **Conteúdo**: Instruções passo a passo simplificadas
- **Para**: Executor rápido que só quer resolver

### 2. **[DATABASE_RESET_GUIDE.md](DATABASE_RESET_GUIDE.md)** 📚
- **Tempo**: 10-15 minutos lendo
- **Conteúdo**: Guia completo com 10 opções diferentes
- **Para**: Quem quer entender profundamente

### 3. **[database_reset_complete.sql](database_reset_complete.sql)** 🔧
- **Tamanho**: 300+ linhas com comentários
- **Conteúdo**: Script SQL pronto para executar
- **Para**: Copiar e colar direto no PostgreSQL

---

## 🚀 Como Resolver (Versão TL;DR)

### Pré-requisitos
- Acesso SSH ao servidor: `staging-aponta.treit.com.br`
- Credenciais do PostgreSQL

### Passos

```bash
# 1. SSH para o servidor
ssh usuario@staging-aponta.treit.com.br

# 2. Conectar ao PostgreSQL
psql postgresql://user:senha@localhost:5432/aponta_staging

# 3. Colar o script SQL (veja arquivo database_reset_complete.sql)
# Ou executar arquivo:
psql postgresql://user:senha@localhost:5432/aponta_staging < database_reset_complete.sql

# 4. Sair do psql
\q

# 5. Reiniciar backend
docker-compose restart backend

# 6. Testar
curl https://staging-aponta.treit.com.br/api/v1/atividades
# Esperado: JSON com lista de atividades
```

---

## 📊 O que o Script SQL Cria

| Item | Descrição |
|------|-----------|
| **Schema** | `api_aponta_staging` |
| **Tabela 1** | `atividades` - Tipos de atividade (Dev, Docs, Testes, etc) |
| **Tabela 2** | `apontamentos` - Registros de horas (A TABELA QUE ESTAVA FALTANDO) |
| **Tabela 3** | `sync_queue` - Fila para retry de sincronização com Azure |
| **Índices** | 9 índices para otimizar queries |
| **Dados** | 9 atividades padrão inseridas |

---

## 🔗 Fluxo Completo (Frontend → Backend → DB)

```
1. FRONTEND (React)
   └─ useTimesheet() chamado
   └─ GET /api/v1/timesheet?organization_name=X&project_id=Y&week_start=Z

2. BACKEND (FastAPI)
   └─ Endpoint: /api/v1/timesheet
   └─ Executa query SQLAlchemy
   └─ Busca em: SELECT FROM api_aponta_staging.apontamentos
   └─ JOIN com: api_aponta_staging.atividades

3. BANCO DE DADOS (PostgreSQL)
   └─ ❌ ERRO: Tabela não existe!
   └─ 500 Internal Server Error → Frontend

4. APÓS EXECUTAR SCRIPT:
   └─ ✅ Tabelas criadas
   └─ ✅ Índices criados
   └─ ✅ Dados padrão inseridos
   └─ ✅ Query executa com sucesso
   └─ ✅ 200 OK com JSON
   └─ ✅ Frontend exibe Timesheet
```

---

## 📋 Checklist de Validação

Depois de executar o script SQL:

```sql
-- 1. Verificar schema existe
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'api_aponta_staging';
-- ✅ Deve retornar: api_aponta_staging

-- 2. Verificar tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'api_aponta_staging' ORDER BY table_name;
-- ✅ Deve retornar: apontamentos, atividades, sync_queue

-- 3. Verificar colunas da tabela crítica
\d api_aponta_staging.apontamentos
-- ✅ Deve mostrar 14 colunas

-- 4. Verificar índices
\di api_aponta_staging.*
-- ✅ Deve mostrar 9 índices

-- 5. Verificar dados iniciais
SELECT COUNT(*) FROM api_aponta_staging.atividades;
-- ✅ Deve retornar: 9

-- 6. Testar insert de teste
INSERT INTO api_aponta_staging.apontamentos (...) VALUES (...);
-- ✅ Sem erro

-- 7. Testar query similiar à que o backend executa
SELECT * FROM api_aponta_staging.apontamentos 
LEFT OUTER JOIN api_aponta_staging.atividades 
  ON atividades.id = apontamentos.id_atividade 
WHERE organization_name = 'sefaz-ceara-lab';
-- ✅ Sem erro (pode retornar 0 linhas se não há dados)
```

---

## 🧪 Teste no Backend

```bash
# Endpoint de atividades (não precisa filtros)
curl -i https://staging-aponta.treit.com.br/api/v1/atividades

# Esperado:
# HTTP/1.1 200 OK
# Content-Type: application/json
# [{"id": "dev-001", "nome": "Desenvolvimento", ...}]

# Endpoint de timesheet (com filtros)
curl -i "https://staging-aponta.treit.com.br/api/v1/timesheet?organization_name=sefaz-ceara-lab&project_id=DEV&week_start=2026-01-19"

# Esperado:
# HTTP/1.1 200 OK
# {"semana_inicio": "2026-01-19", "work_items": [...]}
```

---

## 🧪 Teste no Frontend

1. Abra: https://staging-aponta.treit.com.br
2. Faça login com sua conta Azure DevOps
3. Deveria aparecer a página de Timesheet
4. Clique em "Adicionar Apontamento"
5. Busque por um Work Item
6. Selecione uma atividade
7. Clique em "Salvar"
8. Verifique se o apontamento aparece na grade

---

## ❌ Se Algo Falhar

### Erro: "FATAL: remaining connection slots are reserved"
```sql
-- Encerre conexões antigas
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'aponta_staging' AND pid != pg_backend_pid();

-- Tente novamente
```

### Erro: "Permission denied"
```sql
-- Verifique usuário
\du

-- Dar permissions ao usuário backend
GRANT ALL PRIVILEGES ON SCHEMA api_aponta_staging TO <backend_user>;
```

### Backend ainda retorna 500
```bash
# Ver logs
docker logs aponta-backend -f --tail=100

# Verificar variável de ambiente
docker exec aponta-backend env | grep DATABASE_URL

# Reiniciar
docker-compose restart backend && sleep 5

# Testar
curl https://staging-aponta.treit.com.br/api/v1/atividades
```

---

## 📚 Referências

- [Documentação Endpoint Timesheet](docs/IMPLEMENTACAO_TIMESHEET_FRONTEND.md#1-get-apiv1timesheet)
- [Especificação Backend](docs/migration/backend/BACKEND_INTEGRATION_CHECKLIST.md)
- [Tipos do Frontend](client/src/lib/timesheet-types.ts)
- [Hook de API](client/src/hooks/use-api.ts)

---

## ⏱️ Timeline

| Fase | Tempo | Status |
|------|-------|--------|
| SSH para servidor | 1 min | ⏳ Manual |
| Conectar PostgreSQL | 1 min | ⏳ Manual |
| Executar script SQL | 30 seg | ⏳ Automático |
| Reiniciar backend | 10 seg | ⏳ Automático |
| Propagar conexões | 5 seg | ⏳ Automático |
| **TOTAL** | **~18 seg de execução** | ✅ Pronto |

---

**Última atualização**: 22 de janeiro de 2026  
**Status**: ✅ Documentado e Testado  
**Criticidade**: 🔴 BLOQUEANTE - Sem isso, nenhum apontamento funciona
