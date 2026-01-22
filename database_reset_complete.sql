-- ============================================================================
-- 🔄 SCRIPT RESET COMPLETO - BANCO DE DADOS APONTA STAGING
-- ============================================================================
-- Última atualização: 22 de janeiro de 2026
-- Propósito: Remover e recriar TODAS as tabelas do schema api_aponta_staging
-- Status: ⚠️ DESTRUTIVO - Deleta todos os dados existentes
-- ============================================================================

-- ============================================================================
-- 1️⃣ CONECTAR AO BANCO DE DADOS
-- ============================================================================
-- Certifique-se que você está conectado ao banco: aponta_staging
-- No psql: \c aponta_staging

-- Verificar conexão
SELECT current_database() as banco, current_user as usuario;
-- Esperado: banco=aponta_staging

-- ============================================================================
-- 2️⃣ REMOVER SCHEMA ANTIGO (COM TODOS OS DADOS)
-- ============================================================================
-- ⚠️ PONTO DE NÃO RETORNO - Todos os dados serão deletados

DROP SCHEMA IF EXISTS api_aponta_staging CASCADE;

-- Aguardar 2 segundos
-- SELECT pg_sleep(2);

-- ============================================================================
-- 3️⃣ CRIAR NOVO SCHEMA
-- ============================================================================

CREATE SCHEMA api_aponta_staging;

-- Verificar criação
\dn api_aponta_staging

-- ============================================================================
-- 4️⃣ CRIAR TABELA: atividades (Activity Types)
-- ============================================================================

CREATE TABLE api_aponta_staging.atividades (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_por VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5️⃣ CRIAR TABELA: apontamentos (Time Entries - TABELA PRINCIPAL)
-- ============================================================================
-- ⚠️ ESSA é a tabela que estava dando erro 500

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
    azure_sync_status VARCHAR(20) DEFAULT 'pending',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Relacionamentos
    FOREIGN KEY (id_atividade) REFERENCES api_aponta_staging.atividades(id) ON DELETE RESTRICT,
    -- Constraint: Um usuário não pode criar 2 apontamentos para o mesmo dia/task
    UNIQUE(work_item_id, data_apontamento, usuario_id)
);

-- ============================================================================
-- 6️⃣ CRIAR TABELA: sync_queue (Fila de Retry para Sincronização Azure)
-- ============================================================================

CREATE TABLE api_aponta_staging.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apontamento_id UUID NOT NULL,
    tentativas INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    proximo_retry TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    erro_mensagem TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Relacionamento
    FOREIGN KEY (apontamento_id) REFERENCES api_aponta_staging.apontamentos(id) ON DELETE CASCADE
);

-- ============================================================================
-- 7️⃣ CRIAR ÍNDICES (Melhor Performance)
-- ============================================================================

-- Índices na tabela apontamentos
CREATE INDEX idx_apontamentos_work_item 
    ON api_aponta_staging.apontamentos(work_item_id);

CREATE INDEX idx_apontamentos_usuario 
    ON api_aponta_staging.apontamentos(usuario_id);

CREATE INDEX idx_apontamentos_data 
    ON api_aponta_staging.apontamentos(data_apontamento);

CREATE INDEX idx_apontamentos_organization 
    ON api_aponta_staging.apontamentos(organization_name);

CREATE INDEX idx_apontamentos_project 
    ON api_aponta_staging.apontamentos(project_id);

-- Índice composto (mais eficiente para queries típicas)
CREATE INDEX idx_apontamentos_org_project_date 
    ON api_aponta_staging.apontamentos(organization_name, project_id, data_apontamento);

-- Índices na tabela sync_queue
CREATE INDEX idx_sync_queue_apontamento 
    ON api_aponta_staging.sync_queue(apontamento_id);

CREATE INDEX idx_sync_queue_retry 
    ON api_aponta_staging.sync_queue(proximo_retry);

-- ============================================================================
-- 8️⃣ INSERIR DADOS INICIAIS: Atividades Padrão
-- ============================================================================

INSERT INTO api_aponta_staging.atividades (id, nome, descricao, ativo, criado_em) VALUES
    ('dev-001', 'Desenvolvimento', 'Desenvolvimento de features e melhorias', true, CURRENT_TIMESTAMP),
    ('doc-001', 'Documentação', 'Criação e atualização de documentação', true, CURRENT_TIMESTAMP),
    ('test-001', 'Testes', 'Testes automatizados e manuais', true, CURRENT_TIMESTAMP),
    ('infra-001', 'Infraestrutura', 'DevOps, deploy e configurações', true, CURRENT_TIMESTAMP),
    ('review-001', 'Code Review', 'Revisão de código e pull requests', true, CURRENT_TIMESTAMP),
    ('support-001', 'Suporte', 'Atendimento ao cliente e bugs', true, CURRENT_TIMESTAMP),
    ('admin-001', 'Administrativo', 'Tarefas administrativas e reuniões', true, CURRENT_TIMESTAMP),
    ('design-001', 'Design', 'Design de UI/UX e prototipagem', true, CURRENT_TIMESTAMP),
    ('analysis-001', 'Análise', 'Análise de requisitos e planejamento', true, CURRENT_TIMESTAMP);

-- ============================================================================
-- 9️⃣ VERIFICAR CRIAÇÃO
-- ============================================================================

-- Listar tabelas criadas
\dt api_aponta_staging.*

-- Esperado: 3 tabelas
-- - api_aponta_staging | apontamentos
-- - api_aponta_staging | atividades
-- - api_aponta_staging | sync_queue

-- Ver estrutura da tabela apontamentos
\d api_aponta_staging.apontamentos

-- Ver índices
\di api_aponta_staging.*

-- Contar atividades inseridas
SELECT COUNT(*) as total_atividades FROM api_aponta_staging.atividades;
-- Esperado: 9

-- Ver atividades
SELECT id, nome, ativo FROM api_aponta_staging.atividades ORDER BY id;

-- ============================================================================
-- 🔟 GRANTS (Permissions) - IMPORTANTE PARA BACKEND
-- ============================================================================
-- Descomente se o backend usa usuário específico

-- Dar permissions ao usuário backend (substitua "backend_user" pelo seu usuário)
-- GRANT USAGE ON SCHEMA api_aponta_staging TO backend_user;
-- GRANT CREATE ON SCHEMA api_aponta_staging TO backend_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api_aponta_staging TO backend_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api_aponta_staging TO backend_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA api_aponta_staging GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO backend_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA api_aponta_staging GRANT USAGE, SELECT ON SEQUENCES TO backend_user;

-- ============================================================================
-- 1️⃣1️⃣ VALIDAÇÃO FINAL
-- ============================================================================

-- Verificar se tudo está correto
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api_aponta_staging'
    AND table_name = 'apontamentos'
ORDER BY ordinal_position;

-- Teste de insert (inserir um apontamento de teste)
-- IMPORTANTE: Substitua os valores conforme necessário
INSERT INTO api_aponta_staging.apontamentos (
    work_item_id,
    project_id,
    organization_name,
    data_apontamento,
    duracao,
    duracao_horas,
    id_atividade,
    comentario,
    usuario_id,
    usuario_nome,
    usuario_email,
    azure_sync_status
) VALUES (
    1001,
    'DEV',
    'sefaz-ceara-lab',
    CURRENT_DATE,
    '02:30',
    2.5,
    'dev-001',
    'Teste de apontamento - pode ser deletado',
    'user-123',
    'Usuário Teste',
    'teste@example.com',
    'pending'
);

-- Verificar inserção
SELECT 
    id,
    work_item_id,
    data_apontamento,
    duracao_horas,
    usuario_nome,
    criado_em
FROM api_aponta_staging.apontamentos
ORDER BY criado_em DESC
LIMIT 5;

-- ============================================================================
-- ✅ SCRIPT CONCLUÍDO COM SUCESSO
-- ============================================================================
-- 
-- Próximos passos:
-- 1. Reiniciar o backend: docker-compose restart backend
-- 2. Testar endpoint: curl https://staging-aponta.treit.com.br/api/v1/atividades
-- 3. Testar no frontend: fazer login e criar um apontamento
-- 
-- ============================================================================
