# 🚀 Deploy AddTimePopupDialog - Passo a Passo

**Data**: 22/01/2026  
**Status**: ✅ Pronto para Deploy  
**Arquivos criados**: 3 arquivos + 1 configuração  

---

## 📋 Arquivos Criados

```
extension/
├─ vss-extension.staging.json ✅ (MODIFICADO - adicionado addTimePopupDialog)
└─ pages/
   ├─ addTimePopupDialog/
   │  └─ index.html ✅ (NOVO - modal com formulário)
   └─ actions/
      └─ addTimeAction.html ✅ (NOVO - disparador do modal)
```

---

## 🔧 Configuração Adicionada ao vss-extension.staging.json

```json
{
  "id": "addTimePopupDialog",
  "type": "ms.vss-web.control",
  "description": "Modal para apontar tempo em task/bug",
  "targets": [],
  "properties": {
    "uri": "pages/addTimePopupDialog/index.html?workItemId={{id}}"
  }
},
{
  "id": "addTimeAction",
  "type": "ms.vss-web.action-provider",
  "description": "Ação para abrir modal de apontamento",
  "targets": [
    "ms.vss-work-web.work-item-context-menu"
  ],
  "properties": {
    "title": "⏱️ Apontar Tempo",
    "uri": "pages/actions/addTimeAction.html"
  }
}
```

---

## 📚 Fluxo de Funcionamento

```
1️⃣ Usuário abre uma Task/Bug no Azure DevOps
           ↓
2️⃣ Clica com botão direito (context menu)
           ↓
3️⃣ Vê opção "⏱️ Apontar Tempo" (action provider)
           ↓
4️⃣ Clica na opção
           ↓
5️⃣ openAddTimeDialog() é chamado (addTimeAction.html)
           ↓
6️⃣ Modal abre via VSS Dialog Service
           ↓
7️⃣ Carrega pages/addTimePopupDialog/index.html com workItemId={{id}}
           ↓
8️⃣ Usuário preenche formulário
           ↓
9️⃣ Clica em "Salvar"
           ↓
🔟 POST para https://staging-aponta.treit.com.br/api/v1/apontamentos
           ↓
1️⃣1️⃣ Backend salva no banco de dados
           ↓
1️⃣2️⃣ Modal fecha automaticamente
           ↓
✅ Sucesso!
```

---

## 🧪 Como Testar Localmente

### Passo 1: Verificar Estrutura

```bash
# Verifique se os arquivos existem
ls extension/pages/addTimePopupDialog/index.html
ls extension/pages/actions/addTimeAction.html
cat extension/vss-extension.staging.json | grep "addTimePopupDialog"
```

**Esperado:**
```
✅ extension/pages/addTimePopupDialog/index.html exist
✅ extension/pages/actions/addTimeAction.html exist
✅ "addTimePopupDialog" encontrado no manifest
```

### Passo 2: Build da Extensão

```bash
cd extension

# Instalar TFX CLI (se não tiver)
npm install -g tfx-cli

# Criar extensão
tfx extension create --manifest-globs vss-extension.staging.json
```

**Esperado:**
```
✅ Extensão criada: aponta-projetos-staging-1.0.9.vsix
```

### Passo 3: Publicar Localmente (Dev)

```bash
# Opção A: Publicar no Azure DevOps Marketplace
tfx extension publish \
  --manifest-globs vss-extension.staging.json \
  --token <seu-PAT-token>

# Opção B: Instalar manualmente no seu Azure DevOps
# 1. Vá para: https://dev.azure.com/sefaz-ceara-lab
# 2. Clique em "Project Settings"
# 3. Vá em "Extensions"
# 4. Clique em "Manage extensions"
# 5. Clique em "Upload new extension"
# 6. Selecione o arquivo .vsix gerado
```

### Passo 4: Testar na Interface

```
1. Vá para: https://dev.azure.com/sefaz-ceara-lab/DEV/_workitems/edit/4
2. Espere carregar
3. Clique com botão direito em qualquer lugar
4. Procure por "⏱️ Apontar Tempo"
5. Clique na opção
6. Modal deve abrir
7. Preencha o formulário
8. Clique em "Salvar"
```

---

## 🔍 Verificação de Erros

### Se o botão não aparecer:

**Verificar no Console do Navegador (F12):**

```javascript
// Procure por:
// ✅ "✅ Action Provider pronto"
// ✅ "✅ Inicialização OK"
// ❌ "❌ Erro ao inicializar: ..."

// Se tiver erro, copie e verifique
```

**Causas comuns:**

| Erro | Causa | Solução |
|------|-------|---------|
| "Extensão não carregada" | Manifest inválido | Validar JSON com `jsonlint` |
| "Work Item ID não fornecido" | URL sem `workItemId` | Verificar `{{id}}` no manifest |
| "Erro 404 em addTimeAction.html" | Arquivo não existe | Criar arquivo em `pages/actions/` |
| "Modal não abre" | Dialog Service erro | Verificar token de autenticação |

---

## 🛠️ Customizações Necessárias

### 1️⃣ URL do Backend

No arquivo `pages/addTimePopupDialog/index.html`, linha ~189:

**Antes (Staging):**
```javascript
'https://staging-aponta.treit.com.br/api/v1/apontamentos'
```

**Depois (Produção):**
```javascript
'http://aponta.treit.com.br/api/v1/apontamentos'
```

### 2️⃣ Tipos de Atividade

No arquivo `pages/addTimePopupDialog/index.html`, linha ~68-75:

```html
<select id="atividade" name="atividade" required>
    <option value="">-- Selecione --</option>
    <option value="dev">Desenvolvimento</option>        ← Customizar conforme necessário
    <option value="docs">Documentação</option>
    <option value="test">Testes</option>
    <!-- Adicione seus tipos aqui -->
</select>
```

### 3️⃣ Título do Botão

No arquivo `vss-extension.staging.json`, procure por:

```json
"title": "⏱️ Apontar Tempo"  ← Customize se quiser outro nome
```

---

## 📊 Estrutura de Dados Enviada

Quando o usuário salva, estes dados são enviados para o backend:

```json
{
  "work_item_id": 4,                                    // ID da Task/Bug
  "data": "2026-01-22",                                 // Data do apontamento
  "hora_inicio": "09:30",                               // Hora início (HH:mm)
  "duracao_horas": 1.5,                                 // Duração em horas
  "tipo_atividade": "dev",                              // Tipo de atividade
  "comentario": "Implementação da feature X",           // Comentário livre
  "project_id": "50a9ca09-710f-4478-8278-...",         // Project ID Azure DevOps
  "organization_name": "sefaz-ceara-lab",              // Org Azure DevOps
  "usuario_id": "user-id-123",                         // ID do usuário
  "usuario_nome": "João Silva"                         // Nome do usuário
}
```

**Endpoint esperado:**
```
POST https://staging-aponta.treit.com.br/api/v1/apontamentos
Content-Type: application/json
Authorization: Bearer <token>

{ ...dados acima }
```

---

## ✅ Checklist de Deploy

- [ ] Estrutura de pastas criada (pages/addTimePopupDialog e pages/actions)
- [ ] Arquivo `index.html` criado em pages/addTimePopupDialog/
- [ ] Arquivo `addTimeAction.html` criado em pages/actions/
- [ ] Contribuições adicionadas ao vss-extension.staging.json
- [ ] JSON validado (sem erros de sintaxe)
- [ ] URL do backend customizada (se necessário)
- [ ] Tipos de atividade customizados (se necessário)
- [ ] Build da extensão realizado: `tfx extension create`
- [ ] Extensão publicada/instalada no Azure DevOps
- [ ] Testado: botão aparece no context menu
- [ ] Testado: modal abre ao clicar
- [ ] Testado: formulário valida
- [ ] Testado: POST é enviado com sucesso
- [ ] Testado: dados salvos no banco de dados

---

## 🐛 Troubleshooting Avançado

### Console mostra "Extension timed out"

**Solução:**
```javascript
// No arquivo addTimeAction.html, adicione timeout maior:
const dialogOptions = {
    title: "⏱️ Apontar Tempo",
    width: 600,
    height: 700,
    buttons: [],
    postContent: { message: "Loading...", timeout: 30000 }  // ← Adicione
};
```

### Modal fica em branco

**Verificar:**
```javascript
// No console do navegador (F12):
// 1. Procure por "Error loading script"
// 2. Procure por "403 Forbidden"
// 3. Verifique se VSS.SDK.js carregou
```

### POST retorna erro 403

**Causa:** Token expirado ou sem permissão

**Solução:**
```javascript
// No backend FastAPI, adicione CORS:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dev.azure.com", "https://visualstudio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📞 Próximos Passos

1. **Verificar se extensão está publicada:**
   ```
   https://dev.azure.com/sefaz-ceara-lab/_settings/extensions
   ```

2. **Se tiver erro no backend:**
   - Verifique logs do FastAPI
   - Confirme que `/api/v1/apontamentos` existe
   - Teste endpoint manualmente com Postman

3. **Se tudo funcionar:**
   - Mova configuração para `vss-extension.json` (produção)
   - Incremente versão: `1.0.10`
   - Republique

---

## 🎉 Resultado Final

**Quando tudo estiver funcionando:**

- ✅ Task/Bug aberta no Azure DevOps
- ✅ Botão "⏱️ Apontar Tempo" aparece no context menu
- ✅ Clica no botão
- ✅ Modal abre com formulário bonito
- ✅ Preenche dados
- ✅ Clica em "Salvar"
- ✅ Dados enviados para backend
- ✅ Banco de dados recebe apontamento
- ✅ Modal fecha automaticamente
- ✅ Sucesso! ✨

---

**Arquivo de referência completo:**
- [EXTENSION_ADDTIME_DIALOG_ONLY.md](EXTENSION_ADDTIME_DIALOG_ONLY.md)

**Documentação 7pace original:**
- [7pace-reference/extension.vsomanifest](7pace-reference/extension.vsomanifest)
