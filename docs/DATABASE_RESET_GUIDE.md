# 🔄 Guia Completo: Reset e Reconfigurção do Banco de Dados

## 🎯 Problema Atual

```
(psycopg2.errors.UndefinedTable) relation "api_aponta_staging.apontamentos" does not exist
```

**Causa**: As tabelas do banco de dados não foram criadas ou foram deletadas.

---

## 📍 Localização do Código Backend

O backend **não está neste repositório** (`fe-aponta`). 

O backend está rodando em: **https://staging-aponta.treit.com.br/api/v1**

**Database**: PostgreSQL com schema `api_aponta_staging`

---

## 🔧 Passos para Resolver (Ordem de Prioridade)

### 1️⃣ **VERIFICAR SE O BACKEND EXISTE**

Acesse: https://staging-aponta.treit.com.br/api/v1/atividades

- ✅ Se retornar JSON: Backend está online
- ❌ Se retornar erro: Backend offline ou não configurado

---

### 2️⃣ **ACESSAR O SERVIDOR DE STAGING**

Se você tem acesso SSH:

```bash
# Acesse o servidor
ssh usuario@staging-aponta.treit.com.br

# Ou se estiver em Docker:
docker exec -it <container_name> /bin/bash
```

---

### 3️⃣ **RESET COMPLETO DO BANCO DE DADOS** (⚠️ DESTRUTIVO)

#### 3.A - Conectar ao PostgreSQL

```bash
# Local (desenvolvedor)
psql postgresql://user:password@localhost:5432/aponta_staging

# Remoto (via SSH tunnel)
ssh -L 5432:localhost:5432 usuario@staging-aponta.treit.com.br
psql postgresql://user:password@127.0.0.1:5432/aponta_staging
```

#### 3.B - Remover Schema Existente (⚠️ DELETARÁ TODOS OS DADOS)

```sql
-- Conexão ao banco
\c aponta_staging

-- Remover schema antigo (com cascata)
DROP SCHEMA IF EXISTS api_aponta_staging CASCADE;

-- Criar schema novo
CREATE SCHEMA api_aponta_staging;

-- Confirmar
\dn
-- Deve mostrar "api_aponta_staging | <owner>"
```

#### 3.C - Executar Migrations (SE DISPONÍVEL)

**Via Python (FastAPI/Alembic)**:

```bash
# No servidor backend
cd /path/to/backend

# Se usa Alembic (recomendado)
alembic upgrade head

# Ou se usa SQLAlchemy direct
python -m backend.scripts.init_db
```

**Se NÃO há migrations, executar script manual** (ver abaixo).

---

### 4️⃣ **CRIAR TABELAS MANUALMENTE** (Se Migrations não existem)

```sql
-- Executar no PostgreSQL conectado a aponta_staging

-- Tabela: atividades
CREATE TABLE api_aponta_staging.atividades (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_por VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: apontamentos (CRÍTICA - onde está o erro)
CREATE TABLE api_aponta_staging.apontamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id INTEGER NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    organization_name VARCHAR(100) NOT NULL,
    data_apontamento DATE NOT NULL,
    duracao TIME NOT NULL,
    duracao_horas DECIMAL(5,2) NOT NULL,
    id_atividade VARCHAR(50) NOT NULL,
    comentario TEXT,
    usuario_id VARCHAR(100) NOT NULL,
    usuario_nome VARCHAR(200) NOT NULL,
    usuario_email VARCHAR(200),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_atividade) REFERENCES api_aponta_staging.atividades(id),
    UNIQUE(work_item_id, data_apontamento, usuario_id)
);

-- Índices (melhoram performance)
CREATE INDEX idx_apontamentos_work_item 
    ON api_aponta_staging.apontamentos(work_item_id);
CREATE INDEX idx_apontamentos_usuario 
    ON api_aponta_staging.apontamentos(usuario_id);
CREATE INDEX idx_apontamentos_data 
    ON api_aponta_staging.apontamentos(data_apontamento);
CREATE INDEX idx_apontamentos_organization 
    ON api_aponta_staging.apontamentos(organization_name);

-- Tabela: sync_queue (para retry de falhas)
CREATE TABLE api_aponta_staging.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apontamento_id UUID NOT NULL,
    tentativas INTEGER DEFAULT 0,
    proximo_retry TIMESTAMP,
    erro_mensagem TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apontamento_id) REFERENCES api_aponta_staging.apontamentos(id) ON DELETE CASCADE
);

-- Inserir atividades padrão
INSERT INTO api_aponta_staging.atividades (id, nome, descricao) VALUES
    ('dev-001', 'Desenvolvimento', 'Desenvolvimento de features'),
    ('doc-001', 'Documentação', 'Criação de documentação'),
    ('test-001', 'Testes', 'Testes automatizados e manuais'),
    ('infra-001', 'Infraestrutura', 'DevOps e setup'),
    ('review-001', 'Code Review', 'Revisão de código'),
    ('support-001', 'Suporte', 'Atendimento ao cliente'),
    ('admin-001', 'Administrativo', 'Tarefas administrativas');

-- Verificar criação
\dt api_aponta_staging.*
-- Deve mostrar 3 tabelas
```

---

### 5️⃣ **VALIDAR A CRIAÇÃO**

```sql
-- Listar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'api_aponta_staging'
ORDER BY table_name;

-- Esperado:
-- apontamentos
-- atividades
-- sync_queue

-- Verificar colunas da tabela apontamentos
\d api_aponta_staging.apontamentos

-- Deve mostrar todas as colunas corretamente
```

---

### 6️⃣ **TESTAR NO FRONTEND**

Após criar as tabelas:

1. Acesse: https://staging-aponta.treit.com.br
2. Faça login com Azure DevOps PAT
3. Tente buscar um Work Item (deve funcionar)
4. Tente criar um apontamento (deve funcionar agora)

---

## 🚨 Se Nada Funcionar

### Opção A: Verificar Logs do Backend

```bash
# SSH ao servidor
ssh usuario@staging-aponta.treit.com.br

# Ver logs (se usando Docker)
docker logs aponta-backend -f --tail=100

# Ver logs (se usando systemd)
sudo journalctl -u aponta-backend -f --lines=100

# Ver logs (se usando supervisor)
tail -f /var/log/aponta-backend.log
```

### Opção B: Verificar Credenciais do DB

```bash
# SSH ao servidor
echo "SELECT version();" | psql postgresql://user:password@localhost:5432/aponta_staging
```

### Opção C: Reiniciar Backend

```bash
# Se Docker
docker-compose restart backend

# Se systemd
sudo systemctl restart aponta-backend

# Depois aguarde 10 segundos
sleep 10

# Test
curl -i https://staging-aponta.treit.com.br/api/v1/atividades
```

---

## 📊 Arquitetura Esperada Após Completar

```
PostgreSQL (staging-aponta.treit.com.br:5432)
    ↓
Database: aponta_staging
    ↓
Schema: api_aponta_staging
    ├── Tabela: apontamentos (de onde vinha o erro 500)
    ├── Tabela: atividades
    └── Tabela: sync_queue
```

---

## 🔗 Referências

- **Frontend**: [client/src/lib/api-client.ts](../../client/src/lib/api-client.ts)
- **Database Schema**: Veja acima (seção 4️⃣)
- **Endpoints**: [docs/migration/backend/BACKEND_CONTEXT.md](backend/BACKEND_CONTEXT.md#-frontend-api-expectations)

---

## ✅ Checklist de Sucesso

- [ ] Backend está respondendo (teste: `curl https://staging-aponta.treit.com.br/api/v1/atividades`)
- [ ] Schema `api_aponta_staging` existe
- [ ] 3 tabelas foram criadas (apontamentos, atividades, sync_queue)
- [ ] Atividades padrão foram inseridas
- [ ] Frontend consegue fazer login
- [ ] Frontend consegue buscar Work Items
- [ ] Frontend consegue criar um apontamento
- [ ] Apontamento aparece no histórico

---

**Última atualização**: 22 de janeiro de 2026  
**Crítico**: Esse erro de tabela indefinida impedirá TODOS os apontamentos
