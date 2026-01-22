# 🎯 Implementar AddTimePopupDialog - Modal Único

**Objetivo**: Adicionar um modal "Apontar Tempo" que abre quando clicado em uma Task/Bug  
**Tempo**: 20 minutos  
**Complexidade**: Baixa  
**Arquivo principal**: `vss-extension.staging.json`

---

## 📋 O que é o AddTimePopupDialog?

É um **modal/dialog** que:
- ✅ Abre ao clicar em um botão na interface da Task/Bug
- ✅ Mostra um formulário para apontar horas
- ✅ Envia dados para seu backend
- ✅ Fecha automaticamente após sucesso

**Diferente de**: Painel lateral, menu de contexto, etc. → Só modal!

---

## 🔧 Passo 1: Adicionar ao vss-extension.staging.json

Abra [extension/vss-extension.staging.json](extension/vss-extension.staging.json) e adicione esta contribuição:

```json
{
    "id": "addTimePopupDialog",
    "type": "ms.vss-web.control",
    "description": "Modal para apontar tempo em task/bug",
    "targets": [],
    "properties": {
        "uri": "pages/addTimePopupDialog/index.html?workItemId={{id}}"
    }
}
```

**Onde adicionar**: Na seção `"contributions"` do arquivo, ao lado dos outros controles.

---

## 📁 Passo 2: Criar Pasta da Modal

```bash
mkdir -p extension/pages/addTimePopupDialog
```

---

## 💻 Passo 3: Criar pages/addTimePopupDialog/index.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Apontar Tempo</title>
    <script src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
            padding: 20px;
            margin: 0;
            background: #f6f6f6;
        }
        .dialog-container {
            max-width: 500px;
            background: white;
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h2 {
            color: #0078d4;
            margin-top: 0;
            font-size: 18px;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
            font-size: 13px;
        }
        input[type="date"],
        input[type="time"],
        input[type="number"],
        select,
        textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #d0d0d0;
            border-radius: 3px;
            font-size: 13px;
            font-family: inherit;
            box-sizing: border-box;
        }
        input:focus,
        select:focus,
        textarea:focus {
            outline: none;
            border-color: #0078d4;
            box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
        }
        textarea {
            resize: vertical;
            min-height: 80px;
        }
        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        button {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 3px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .btn-save {
            background-color: #0078d4;
            color: white;
        }
        .btn-save:hover {
            background-color: #106ebe;
        }
        .btn-save:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .btn-cancel {
            background-color: #f0f0f0;
            color: #333;
        }
        .btn-cancel:hover {
            background-color: #e0e0e0;
        }
        .error {
            color: #d13438;
            font-size: 12px;
            margin-top: 4px;
        }
        .success {
            color: #107c10;
            font-size: 12px;
            margin-top: 4px;
        }
        .loading {
            display: inline-block;
            animation: spinner 1s linear infinite;
        }
        @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="dialog-container">
        <h2>⏱️ Apontar Tempo</h2>

        <form id="apontamento-form">
            <div class="form-group">
                <label for="data">Data *</label>
                <input type="date" id="data" name="data" required>
            </div>

            <div class="form-group">
                <label for="hora-inicio">Hora Início *</label>
                <input type="time" id="hora-inicio" name="hora-inicio" required>
            </div>

            <div class="form-group">
                <label for="duracao">Duração (horas) *</label>
                <input type="number" id="duracao" name="duracao" min="0.5" step="0.5" 
                       placeholder="ex: 1.5" required>
            </div>

            <div class="form-group">
                <label for="atividade">Tipo de Atividade *</label>
                <select id="atividade" name="atividade" required>
                    <option value="">-- Selecione --</option>
                    <option value="dev">Desenvolvimento</option>
                    <option value="docs">Documentação</option>
                    <option value="test">Testes</option>
                    <option value="review">Code Review</option>
                    <option value="admin">Administração</option>
                </select>
            </div>

            <div class="form-group">
                <label for="comentario">Comentário</label>
                <textarea id="comentario" name="comentario" 
                          placeholder="Ex: Implementação da feature X"></textarea>
            </div>

            <div id="mensagem"></div>

            <div class="buttons">
                <button type="submit" class="btn-save" id="btn-salvar">
                    💾 Salvar
                </button>
                <button type="button" class="btn-cancel" id="btn-cancelar">
                    ✕ Cancelar
                </button>
            </div>
        </form>
    </div>

    <script>
        // ====== INICIALIZAÇÃO ======
        VSS.init({
            usePlatformScripts: true,
            usePlatformStyles: true
        });

        VSS.ready(async function() {
            try {
                // Obter contexto do Azure DevOps
                const webContext = VSS.getWebContext();
                const workItemId = getUrlParam('workItemId');
                
                console.log('Work Item ID:', workItemId);
                console.log('Organization:', webContext.account.name);
                console.log('Project:', webContext.project.name);

                // Pré-preencher data com hoje
                const hoje = new Date().toISOString().split('T')[0];
                document.getElementById('data').value = hoje;

                // Setup do formulário
                setupFormHandlers(workItemId, webContext);

            } catch (error) {
                console.error('Erro ao inicializar:', error);
                showMessage('Erro ao inicializar modal', 'error');
            }
        });

        // ====== FUNÇÕES AUXILIARES ======

        function getUrlParam(param) {
            const params = new URLSearchParams(window.location.search);
            return params.get(param);
        }

        function setupFormHandlers(workItemId, webContext) {
            const form = document.getElementById('apontamento-form');
            const btnSalvar = document.getElementById('btn-salvar');
            const btnCancelar = document.getElementById('btn-cancelar');

            // Botão salvar
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await salvarApontamento(workItemId, webContext);
            });

            // Botão cancelar
            btnCancelar.addEventListener('click', () => {
                fecharDialog();
            });
        }

        async function salvarApontamento(workItemId, webContext) {
            const btnSalvar = document.getElementById('btn-salvar');
            const form = document.getElementById('apontamento-form');

            try {
                // Desabilitar botão
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = '<span class="loading">⏳</span> Salvando...';

                // Coletar dados
                const dados = {
                    work_item_id: parseInt(workItemId),
                    data: document.getElementById('data').value,
                    hora_inicio: document.getElementById('hora-inicio').value,
                    duracao_horas: parseFloat(document.getElementById('duracao').value),
                    tipo_atividade: document.getElementById('atividade').value,
                    comentario: document.getElementById('comentario').value,
                    project_id: webContext.project.id,
                    organization_name: webContext.account.name,
                    usuario_id: webContext.user.id,
                    usuario_nome: webContext.user.name
                };

                console.log('Dados a enviar:', dados);

                // Obter token
                const token = await VSS.getAccessToken();

                // POST para backend
                const response = await fetch(
                    'https://staging-aponta.treit.com.br/api/v1/apontamentos',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token.token}`
                        },
                        body: JSON.stringify(dados)
                    }
                );

                if (!response.ok) {
                    const erro = await response.json();
                    throw new Error(erro.detail || `Erro ${response.status}`);
                }

                const resultado = await response.json();
                console.log('Sucesso:', resultado);

                showMessage('✅ Apontamento salvo com sucesso!', 'success');

                // Fechar após 1 segundo
                setTimeout(() => {
                    fecharDialog();
                }, 1500);

            } catch (error) {
                console.error('Erro ao salvar:', error);
                showMessage('❌ Erro ao salvar: ' + error.message, 'error');
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = '💾 Salvar';
            }
        }

        function showMessage(msg, tipo) {
            const container = document.getElementById('mensagem');
            container.innerHTML = `<div class="${tipo}">${msg}</div>`;
        }

        function fecharDialog() {
            // Fechar via VSS SDK se disponível
            if (typeof VSS !== 'undefined' && VSS.getWebContext) {
                VSS.notifyLoadSucceeded();
            }
            // Ou fechar a janela
            window.close();
        }
    </script>
</body>
</html>
```

---

## 🖱️ Passo 4: Disparar o Modal da Task/Bug

Você precisa de um botão na interface da task/bug que abra este modal. Existem 2 formas:

### Opção A: Botão via Context Menu (Recomendado)

Crie um `action-provider` que adiciona um botão:

```json
{
    "id": "addTimeAction",
    "type": "ms.vss-web.action-provider",
    "targets": ["ms.vss-work-web.work-item-context-menu"],
    "properties": {
        "uri": "pages/actions/addTimeAction.html"
    }
}
```

Crie `pages/actions/addTimeAction.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
</head>
<body>
    <script>
        VSS.init({ usePlatformScripts: true });
        VSS.ready(function() {
            const context = VSS.getWebContext();
            const projectId = context.project.id;
            
            // Registrar ação
            VSS.register(VSS.getContributionId(), {
                getMenuItems: function(context) {
                    return [{
                        title: "⏱️ Apontar Tempo",
                        action: function(workItem) {
                            openAddTimeDialog(workItem.id);
                        }
                    }];
                }
            });
        });

        function openAddTimeDialog(workItemId) {
            const extensionContext = VSS.getExtensionContext();
            const baseUri = `${extensionContext.baseUri}`;
            const dialogUrl = `${baseUri}pages/addTimePopupDialog/index.html?workItemId=${workItemId}`;

            const dialogOptions = {
                title: "Apontar Tempo",
                width: 600,
                height: 700,
                buttons: []
            };

            VSS.getService(VSS.ServiceIds.Dialog).openDialog(dialogUrl, dialogOptions);
        }
    </script>
</body>
</html>
```

### Opção B: Botão via Form Group (Alternativo)

Se preferir um botão sempre visível na task:

```json
{
    "id": "addTimeButton",
    "type": "ms.vss-work-web.work-item-form-group",
    "targets": ["ms.vss-work-web.work-item-form"],
    "properties": {
        "title": "Apontar Tempo",
        "uri": "pages/addTimeButton/button.html",
        "height": 50
    }
}
```

---

## 📊 Fluxo Completo

```
1. Usuário abre uma Task/Bug no Azure DevOps
    ↓
2. Vê um botão "⏱️ Apontar Tempo" (menu ou form group)
    ↓
3. Clica no botão
    ↓
4. Modal addTimePopupDialog abre (pages/addTimePopupDialog/index.html)
    ↓
5. Preenche o formulário (data, hora, duração, tipo)
    ↓
6. Clica "Salvar"
    ↓
7. Envia POST para https://staging-aponta.treit.com.br/api/v1/apontamentos
    ↓
8. Backend salva no banco de dados
    ↓
9. Modal fecha automaticamente
    ↓
10. Sucesso! ✅
```

---

## 🔐 Ajustes Necessários

### 1. URLs do Backend

No arquivo `pages/addTimePopupDialog/index.html`, linha ~210:

```javascript
// ANTES
'https://staging-aponta.treit.com.br/api/v1/apontamentos'

// DEPOIS (se for produção)
'https://seu-servidor-backend.com.br/api/v1/apontamentos'
```

### 2. Tipos de Atividade

No arquivo HTML, ajuste o `<select>` com seus tipos:

```html
<select id="atividade" name="atividade" required>
    <option value="dev">Desenvolvimento</option>
    <option value="docs">Documentação</option>
    <!-- Adicione seus tipos aqui -->
</select>
```

### 3. Servidor de Backend

Certifique-se que:
- ✅ Backend está rodando em `https://staging-aponta.treit.com.br`
- ✅ Endpoint `/api/v1/apontamentos` existe
- ✅ Aceita POST com o payload correto

---

## ✅ Estrutura Final

```
extension/
├─ vss-extension.staging.json  (com addTimePopupDialog)
└─ pages/
   └─ addTimePopupDialog/
      └─ index.html           (modal com formulário)
   └─ actions/                (opcional)
      └─ addTimeAction.html   (botão disparador)
```

---

## 🧪 Testar

```bash
# 1. Build da extensão
tfx extension create --manifest-globs extension/vss-extension.staging.json

# 2. Publicar localmente ou em seu servidor

# 3. Abrir uma Task no Azure DevOps

# 4. Procurar por "Apontar Tempo"

# 5. Clicar e preencher formulário
```

---

## 📝 Dados Enviados para Backend

```json
{
  "work_item_id": 4,
  "data": "2026-01-22",
  "hora_inicio": "09:30",
  "duracao_horas": 1.5,
  "tipo_atividade": "dev",
  "comentario": "Implementação da feature X",
  "project_id": "50a9ca09-710f-4478-8278-2d069902d2af",
  "organization_name": "sefaz-ceara-lab",
  "usuario_id": "seu-usuario-id",
  "usuario_nome": "João Silva"
}
```

---

## 🎯 Resumo

- ✅ 1 arquivo de configuração: `vss-extension.staging.json`
- ✅ 1 página HTML: `pages/addTimePopupDialog/index.html`
- ✅ 1 botão disparador: `pages/actions/addTimeAction.html` (opcional)
- ✅ Formulário simples e funcional
- ✅ Integração com backend via POST

**Pronto para usar!** 🚀
