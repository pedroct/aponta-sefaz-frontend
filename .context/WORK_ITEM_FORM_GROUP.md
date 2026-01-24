# Work Item Form Group - Apontamento de Tempo

**Data:** 24/01/2026
**Versão:** 1.1.74

---

## Resumo

O Work Item Form Group é uma contribuição da extensão Azure DevOps que adiciona uma seção "Apontamentos" diretamente no formulário de Work Items. Permite que usuários registrem horas trabalhadas sem sair da tela do Work Item.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Azure DevOps Work Item Form                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Details │ Related Work │ History │ Apontamentos (Staging) │ ...       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              Work Item Form Group (iframe)                             │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  extension/pages/workitem/index.html                            │  │  │
│  │  │                                                                 │  │  │
│  │  │  [Botão: Apontar Tempo]  ──────────┐                            │  │  │
│  │  │                                    │ window.open()              │  │  │
│  │  └────────────────────────────────────┼────────────────────────────┘  │  │
│  └───────────────────────────────────────┼───────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Popup Window                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  staging-aponta.treit.com.br/#/apontar?workItemId=...&token=...       │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                 ApontarPopup.tsx                                 │  │  │
│  │  │                        │                                        │  │  │
│  │  │                        ▼                                        │  │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │              ModalAdicionarTempo.tsx                      │  │  │  │
│  │  │  │                                                           │  │  │  │
│  │  │  │  - Usuário (readonly)                                     │  │  │  │
│  │  │  │  - Tarefa (readonly, pré-preenchida)                      │  │  │  │
│  │  │  │  - Data                                                   │  │  │  │
│  │  │  │  - Duração + Presets (+0.25h, +0.5h, +1h, +2h, +4h)       │  │  │  │
│  │  │  │  - Tipo de Atividade (obrigatório)                        │  │  │  │
│  │  │  │  - Comentário (opcional)                                  │  │  │  │
│  │  │  │  - [Cancelar] [Salvar]                                    │  │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Limitações do Azure DevOps

### Por que usar Popup em vez de Modal Inline?

O Azure DevOps **isola iframes por segurança**. Um iframe de extensão:
- Não pode renderizar conteúdo fora de seus limites
- Não pode abrir modais overlay na página principal
- Está limitado ao tamanho definido no manifest (`height: 250`)

**Alternativas consideradas:**

| Abordagem | Descrição | Viabilidade |
|-----------|-----------|-------------|
| Iframe inline | Formulário dentro do iframe | Limitado pelo tamanho |
| Popup (window.open) | Janela separada | ✅ **Implementado** |
| Dialog Contribution | Contribuição registrada no manifest | Requer mudanças maiores |

A abordagem de **popup** foi escolhida por ser a mais simples e funcional.

---

## Arquivos Principais

### extension/pages/workitem/index.html

HTML/JS puro que roda dentro do iframe do Work Item Form Group.

**Responsabilidades:**
1. Carregar VSS SDK
2. Obter contexto do Work Item (id, title, state, type)
3. Obter contexto do Azure DevOps (organization, project, projectId)
4. Obter token de acesso (getAccessToken)
5. Renderizar botão "Apontar Tempo"
6. Abrir popup com formulário ao clicar

**Código-chave:**

```javascript
// Obter dados do Work Item
service.getFieldValues([
    "System.Id",
    "System.Title",
    "System.State",
    "System.WorkItemType"
]).then(function(values) {
    workItemContext.id = values["System.Id"];
    workItemContext.title = values["System.Title"];
    // ...
});

// Abrir popup
function abrirModalApontamento() {
    var params = new URLSearchParams({
        embedded: 'false',
        workItemId: workItemContext.id,
        workItemTitle: workItemContext.title,
        organization: workItemContext.organization,
        project: workItemContext.project,
        projectId: workItemContext.projectId,
        token: workItemContext.token
    });

    var targetUrl = 'https://staging-aponta.treit.com.br/#/apontar?' + params.toString();

    window.open(targetUrl, 'ApontarTempo',
        'width=450,height=620,resizable=no,scrollbars=no'
    );
}
```

### client/src/pages/ApontarPopup.tsx

Página React que renderiza o formulário de apontamento.

**Responsabilidades:**
1. Extrair parâmetros da URL hash
2. Armazenar token e contexto no localStorage
3. Renderizar `ModalAdicionarTempo`
4. Fechar popup ao salvar/cancelar

**Parâmetros da URL:**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| workItemId | ID do Work Item | `5` |
| workItemTitle | Título do Work Item | `C02. Documentação` |
| organization | Nome da organização | `sefaz-ceara-lab` |
| project | Nome do projeto | `DEV` |
| projectId | ID do projeto (GUID) | `50a9ca09-710f-...` |
| token | Access Token JWT | `eyJ0eXAiOiJKV1...` |
| embedded | Modo embedded | `false` |

### client/src/components/custom/ModalAdicionarTempo.tsx

Componente modal reutilizável para criar/editar apontamentos.

**Props principais:**

| Prop | Tipo | Descrição |
|------|------|-----------|
| isOpen | boolean | Visibilidade do modal |
| onClose | () => void | Callback ao fechar |
| taskId | string | ID do Work Item |
| taskTitle | string | Título do Work Item |
| organizationName | string | Nome da organização |
| projectId | string | ID do projeto |
| mode | "create" \| "edit" | Modo de operação |
| embedded | boolean | Se true, remove backdrop |

**Validações:**
- Duração mínima: 00:15 (15 minutos)
- Duração máxima: 08:00 (8 horas)
- Tipo de Atividade: obrigatório
- Tarefa: obrigatória

---

## Manifest da Extensão

```json
{
  "id": "aponta-tempo-modal-work-item-form-group",
  "type": "ms.vss-work-web.work-item-form-group",
  "targets": [
    "ms.vss-work-web.work-item-form"
  ],
  "properties": {
    "name": "Apontamentos (Staging)",
    "uri": "pages/workitem/index.html",
    "height": 250
  }
}
```

---

## Fluxo de Autenticação

```
1. Work Item Form Group carrega
   │
   ├─→ VSS.getAccessToken()
   │   └─→ Token OAuth para Azure DevOps APIs
   │
2. Usuário clica em "Apontar Tempo"
   │
   ├─→ window.open() com token na URL
   │
3. Popup carrega ApontarPopup
   │
   ├─→ Extrai token da URL
   ├─→ Armazena no localStorage
   │
4. ModalAdicionarTempo renderiza
   │
   ├─→ useCurrentUser() → GET /api/v1/user
   ├─→ useAtividades() → GET /api/v1/atividades
   │
5. Usuário preenche e salva
   │
   ├─→ POST /api/v1/apontamentos
   │   Headers: Authorization: Bearer {token}
   │
6. Popup fecha
   └─→ window.close()
```

---

## API Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/user` | Obtém usuário atual |
| GET | `/api/v1/atividades?ativo=true` | Lista atividades ativas |
| POST | `/api/v1/apontamentos` | Cria apontamento |

**Payload de criação:**

```json
{
  "work_item_id": 5,
  "duracao": "02:00",
  "data_apontamento": "2026-01-24",
  "id_atividade": "uuid-da-atividade",
  "comentario": "Documentação do projeto",
  "organization_name": "sefaz-ceara-lab",
  "project_id": "50a9ca09-710f-4478-8278-2d069902d2af",
  "usuario_id": "user-uuid",
  "usuario_nome": "Pedro Cicero"
}
```

---

## Troubleshooting

### Popup não abre

**Causa:** Bloqueador de popups do navegador.
**Solução:** Permitir popups para `dev.azure.com`.

### Token não é passado

**Causa:** `VSS.getAccessToken()` falhou.
**Solução:** Verificar logs no console (F12) por erros do VSS SDK.

### Formulário não carrega

**Causa:** CORS ou erro de rede.
**Solução:** Verificar se `staging-aponta.treit.com.br` está acessível.

### Atividades não aparecem

**Causa:** Token inválido ou expirado.
**Solução:** Recarregar a página do Work Item e tentar novamente.

---

## Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.1.74 | 24/01/2026 | Popup com embedded=false, remoção de iframe inline |
| 1.1.73 | 24/01/2026 | Reversão para popup (limitação de iframe) |
| 1.1.72 | 24/01/2026 | Tentativa de iframe inline (não funcionou) |
| 1.1.70 | 23/01/2026 | Primeira implementação com popup |

---

**Última Atualização:** 24/01/2026
