# ⚡ RESOLUÇÃO RÁPIDA - Erro: "relation api_aponta_staging.apontamentos does not exist"

## 🎯 Problema

```
500 Internal Server Error
(psycopg2.errors.UndefinedTable) relation "api_aponta_staging.apontamentos" does not exist
```

**Causa**: As tabelas do banco de dados foram deletadas ou nunca foram criadas.

---

## ✅ Solução em 5 Passos

### 1️⃣ SSH para o servidor de staging

```bash
ssh usuario@staging-aponta.treit.com.br
```

### 2️⃣ Acesse o PostgreSQL

```bash
psql postgresql://user:password@localhost:5432/aponta_staging
```

> **Nota**: Se estiver em Docker:
> ```bash
> docker exec -it postgres_container psql -U user -d aponta_staging
> ```

### 3️⃣ Copie e execute o arquivo SQL

Copie todo o conteúdo de [database_reset_complete.sql](database_reset_complete.sql):

```bash
# Opção A: Copiar do arquivo
psql postgresql://user:password@localhost:5432/aponta_staging < database_reset_complete.sql

# Opção B: Cola diretamente no psql
# \c aponta_staging
# [Cole o SQL aqui]
```

### 4️⃣ Reinicie o backend

```bash
docker-compose restart backend
# ou
sudo systemctl restart aponta-backend
```

### 5️⃣ Teste

```bash
curl -i https://staging-aponta.treit.com.br/api/v1/atividades
```

**Esperado**: Retorna JSON com lista de atividades (não erro 500)

---

## 📝 O que o script SQL faz

| Ação | Descrição |
|------|-----------|
| 🗑️ **DROP** | Remove schema antigo com TODOS os dados |
| ✨ **CREATE** | Cria novo schema limpo |
| 📋 **TABELAS** | Cria 3 tabelas: `apontamentos`, `atividades`, `sync_queue` |
| 🔑 **ÍNDICES** | Cria 9 índices para melhor performance |
| 📦 **DADOS** | Insere 9 atividades padrão |

---

## 🧪 Testes Após Executar

1. **Verificar tabelas foram criadas**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'api_aponta_staging';
   ```

2. **Verificar atividades foram inseridas**:
   ```sql
   SELECT COUNT(*) FROM api_aponta_staging.atividades;
   -- Esperado: 9
   ```

3. **Testar endpoint do backend**:
   ```bash
   curl https://staging-aponta.treit.com.br/api/v1/atividades
   ```

4. **Testar no frontend**:
   - Acesse https://staging-aponta.treit.com.br
   - Faça login
   - Tente buscar um Work Item
   - Tente criar um apontamento

---

## 🚨 Algo Deu Errado?

### Erro: "FATAL: remaining connection slots are reserved for non-replication superuser connections"

```bash
# Encerre conexões antigas
psql postgresql://user:password@localhost:5432/postgres
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'aponta_staging' AND pid != pg_backend_pid();
\q

# Tente novamente
psql postgresql://user:password@localhost:5432/aponta_staging
```

### Erro: "Permission denied"

```bash
# Verificar usuário
\du

# Dar permissions (substitua "backend_user")
GRANT USAGE ON SCHEMA api_aponta_staging TO backend_user;
GRANT CREATE ON SCHEMA api_aponta_staging TO backend_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA api_aponta_staging TO backend_user;
```

### Backend ainda retorna erro 500

1. Verifique os logs:
   ```bash
   docker logs aponta-backend -f --tail=50
   ```

2. Verifique credenciais do DB no `.env`:
   ```bash
   cat /app/.env | grep DATABASE_URL
   ```

3. Teste conexão manual:
   ```bash
   psql postgresql://user:password@localhost:5432/aponta_staging -c "SELECT 1;"
   ```

---

## 📚 Referências

- [Guia Completo de Reset](DATABASE_RESET_GUIDE.md)
- [Script SQL Completo](database_reset_complete.sql)
- [Estrutura de Dados Esperada](docs/migration/backend/BACKEND_INTEGRATION_CHECKLIST.md)

---

## ⏱️ Tempo Estimado

- **Tempo total**: 5-10 minutos
- **Tempo crítico**: Apenas o momento de DROP (irreversível)

---

**Última atualização**: 22 de janeiro de 2026  
**Status**: ✅ Testado em staging
