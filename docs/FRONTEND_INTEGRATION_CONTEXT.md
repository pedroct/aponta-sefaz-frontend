# Contexto de Integração Frontend → Backend (API Aponta VPS)

**Última atualização:** 2026-01-18

## 1) Objetivo
Este documento prepara o contexto para iniciar a integração do frontend com o backend FastAPI da API Aponta. Deve ser usado como ponto de partida para implementar chamadas HTTP, autenticação, modelos e tratamento de erros.

---

## 2) Base URL e Documentação
- **Base URL (produção):** http://aponta.treit.com.br
- **Swagger:** http://aponta.treit.com.br/docs
- **ReDoc:** http://aponta.treit.com.br/redoc

---

## 3) Autenticação
Todos os endpoints (exceto health e API info) exigem autenticação.

**Header:**
```
Authorization: Bearer <TOKEN>
```

**Token esperado:**
- PAT do Azure DevOps **ou** token obtido via Azure DevOps Extension SDK.

**Observação:**
- Quando `AUTH_ENABLED=false` no backend (desenvolvimento), o backend usa um usuário mock.

---

## 4) Endpoints essenciais

### Health / Info
- `GET /`
- `GET /health`
- `GET /healthz`
- `GET /api/v1`

### Atividades
- `GET /api/v1/atividades` (paginado)
- `GET /api/v1/atividades/{id}`
- `POST /api/v1/atividades`
- `PUT /api/v1/atividades/{id}`
- `DELETE /api/v1/atividades/{id}`

### Apontamentos
- `POST /api/v1/apontamentos`
- `GET /api/v1/apontamentos/work-item/{work_item_id}`
- `GET /api/v1/apontamentos/work-item/{work_item_id}/resumo`
- `GET /api/v1/apontamentos/work-item/{work_item_id}/azure-info`
- `GET /api/v1/apontamentos/{apontamento_id}`
- `PUT /api/v1/apontamentos/{apontamento_id}`
- `DELETE /api/v1/apontamentos/{apontamento_id}`

### Projetos
- `GET /api/v1/projetos` (cache local)
- `POST /api/v1/integracao/sincronizar` (sincroniza do Azure)

### Integração Azure DevOps
- `GET /api/v1/integracao/projetos` (consulta direta ao Azure)

### Work Items
- `GET /api/v1/work-items/search`
  - Query: `query`, `project_id`, `organization_name`, `limit`

### Usuário
- `GET /api/v1/user`

---

## 5) Modelos relevantes (resumo)

### Atividade (resposta)
- `id: UUID`
- `nome: string`
- `descricao: string | null`
- `ativo: boolean`
- `projetos: Array<{ id: UUID, nome: string }>`
- `id_projeto?: UUID` (retrocompatibilidade)
- `nome_projeto?: string | null` (retrocompatibilidade)
- `criado_em: ISO datetime`
- `atualizado_em: ISO datetime`

**Importante (N:N):**
- Para criação/atualização use `ids_projetos: UUID[]` (mínimo 1).
- `id_projeto` ainda é aceito, mas não é o formato recomendado.

### Apontamento (request)
- `work_item_id: int`
- `project_id: string` (ID ou nome do projeto Azure DevOps)
- `organization_name: string`
- `usuario_id: string`
- `usuario_nome: string`
- `usuario_email?: string`
- `data_apontamento: YYYY-MM-DD`
- `duracao: "HH:mm"` (ex: 02:30)
- `id_atividade: UUID`
- `comentario?: string`

### Apontamento (response)
Inclui campos acima +:
- `duracao_horas: number`
- `atividade: { id: UUID, nome: string }`
- `criado_em`, `atualizado_em`

### Work Item (search response)
- `id: number`
- `title: string`
- `type: string`
- `project: string`
- `url: string`
- `originalEstimate?: number`
- `completedWork?: number`
- `remainingWork?: number`
- `state: string`

### User (response)
- `id: string`
- `displayName: string`
- `emailAddress: string | null`
- `avatarUrl: string | null`

---

## 6) Padrões de resposta e erros

**Erro padrão:**
```json
{ "detail": "Mensagem do erro" }
```

**Erro de validação (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "campo"],
      "msg": "mensagem",
      "type": "tipo"
    }
  ]
}
```

---

## 7) Paginação
Listas usam:
- `skip` (default 0)
- `limit` (default 100, max 1000)

---

## 8) CORS (produção)
Origens liberadas:
- http://aponta.treit.com.br
- https://dev.azure.com
- https://vsassets.io
- https://sefaz-ceara.gallerycdn.vsassets.io
- https://sefaz-ceara-lab.gallerycdn.vsassets.io

---

## 9) Recomendações para o frontend
1. Centralizar HTTP client (fetch/axios) com injeção do Bearer Token.
2. Criar types/interfaces para Atividade, Apontamento, Projeto, WorkItem e User.
3. Padronizar tratamento de erros (401/403/422/500).
4. Adicionar helpers para paginação (skip/limit).
5. Normalizar `duracao` em HH:mm no formulário.
6. Usar `ids_projetos` em toda criação/atualização de atividade.

---

## 10) Referências
- [README.md](../../README.md)
- [API_DOCUMENTATION.md](../api/API_DOCUMENTATION.md)
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md)
