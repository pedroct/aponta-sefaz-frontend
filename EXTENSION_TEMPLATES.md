# 📦 Templates Prontos para Implementação

## 1️⃣ Extension Manifest Template

**Arquivo**: `extension/vss-extension.json` ou `extension/extension.vsomanifest`

```json
{
  "manifestVersion": 1,
  "id": "aponta-extension",
  "version": "1.0.0",
  "name": "Apontar Tempo",
  "description": "Extensão para apontar tempo em tasks e bugs do Azure DevOps",
  "publisher": "pedroct",
  
  "targets": [
    {
      "id": "Microsoft.VisualStudio.Services"
    }
  ],
  
  "scopes": [
    "vso.work_write",
    "vso.identity",
    "vso.profile"
  ],
  
  "contributions": [
    {
      "id": "aponta-tempo-panel",
      "type": "ms.vss-work-web.work-item-form-group",
      "description": "Painel para apontar tempo na página de task/bug",
      "targets": [
        "ms.vss-work-web.work-item-form"
      ],
      "properties": {
        "title": "Apontar Tempo",
        "name": "Apontar Tempo",
        "height": 200,
        "group": "contributed",
        "uri": "pages/panel/index.html",
        "registeredObjectId": "ApontarTempoPanel"
      },
      "constraints": [
        {
          "name": "WorkItemType",
          "properties": {
            "workItemTypes": ["Task", "Bug"]
          }
        }
      ]
    },
    {
      "id": "aponta-tempo-context-menu",
      "type": "ms.vss-web.action-provider",
      "description": "Menu de contexto com opção de apontar tempo",
      "targets": [
        "ms.vss-work-web.work-item-context-menu"
      ],
      "properties": {
        "title": "Aponta",
        "group": "contributed",
        "uri": "pages/context-menu/index.html",
        "registeredObjectId": "ApontarTempoContextMenu"
      }
    },
    {
      "id": "aponta-tempo-dialog",
      "type": "ms.vss-web.control",
      "description": "Dialog para apontar tempo",
      "targets": [],
      "properties": {
        "uri": "pages/dialog/index.html"
      }
    }
  ],
  
  "files": [
    {
      "path": "pages",
      "addressable": true
    },
    {
      "path": "images",
      "addressable": true
    }
  ]
}
```

---

## 2️⃣ HTML do Painel (Recomendado para MVP)

**Arquivo**: `extension/pages/panel/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Apontar Tempo</title>
    <link rel="stylesheet" href="styles.css" />
    <script type="text/javascript" src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
</head>
<body>
    <div id="app"></div>
    
    <script type="module">
        import React from 'https://esm.sh/react@18.2.0';
        import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
        import App from './App.jsx';
        
        // Inicializar VSS SDK
        VSS.init({
            usePlatformScripts: true,
            usePlatformStyles: true,
            explicitNotifyLoaded: false,
            applyTheme: true
        });
        
        VSS.ready(function() {
            const root = ReactDOM.createRoot(document.getElementById('app'));
            root.render(React.createElement(App));
        });
    </script>
</body>
</html>
```

---

## 3️⃣ Componente React do Painel

**Arquivo**: `extension/pages/panel/App.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import './styles.css';

export default function App() {
  const [workItem, setWorkItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apontamentos, setApontamentos] = useState([]);

  useEffect(() => {
    initializePanel();
  }, []);

  async function initializePanel() {
    try {
      setLoading(true);
      
      // Obter contexto do Azure DevOps
      const webContext = VSS.getWebContext();
      const config = VSS.getContribution().initialConfig;
      
      // Dados da task/bug
      const workItemData = {
        id: config.workItem?.id,
        title: config.workItem?.fields?.['System.Title'],
        type: config.workItem?.fields?.['System.WorkItemType'],
        projectId: webContext.project?.name,
        organizationName: webContext.collection?.name,
        userId: webContext.user?.id,
        userName: webContext.user?.name
      };
      
      setWorkItem(workItemData);
      
      // Buscar apontamentos existentes
      if (workItemData.id) {
        await fetchApontamentos(workItemData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApontamentos(wi) {
    try {
      const response = await fetch(
        `https://staging-aponta.treit.com.br/api/v1/apontamentos/work-item/${wi.id}?` +
        `organization_name=${wi.organizationName}&project_id=${wi.projectId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setApontamentos(data.items || []);
      }
    } catch (err) {
      console.error('Erro ao buscar apontamentos:', err);
    }
  }

  function handleApontarTempo() {
    if (!workItem) return;
    
    // Abrir dialog
    VSS.ready(() => {
      const dialogService = VSS.getService(VSS.ServiceIds.Dialog);
      const extensionContext = VSS.getExtensionContext();
      
      const dialogOptions = {
        title: 'Apontar Tempo',
        width: 500,
        height: 600,
        resizable: false,
        urlReplacementObject: { id: workItem.id },
        buttons: [],
        close: () => {
          // Recarregar apontamentos após fechar
          fetchApontamentos(workItem);
        }
      };
      
      dialogService
        .openDialog(
          `${extensionContext.publisherId}.${extensionContext.extensionId}.aponta-tempo-dialog`,
          dialogOptions
        )
        .then(dialog => {
          // Dialog aberto com sucesso
        })
        .catch(err => {
          console.error('Erro ao abrir dialog:', err);
        });
    });
  }

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  return (
    <div className="aponta-panel">
      <div className="panel-header">
        <h3>Apontar Tempo</h3>
        <button 
          className="btn-apontar"
          onClick={handleApontarTempo}
          title="Clique para apontar novo tempo"
        >
          ➕ Apontar Tempo
        </button>
      </div>
      
      <div className="panel-body">
        {apontamentos.length === 0 ? (
          <p className="empty-state">
            Nenhum apontamento registrado ainda
          </p>
        ) : (
          <div className="apontamentos-list">
            <h4>Histórico ({apontamentos.length})</h4>
            {apontamentos.map(apt => (
              <div key={apt.id} className="apontamento-item">
                <div className="apt-date">{apt.data_apontamento}</div>
                <div className="apt-details">
                  <strong>{apt.duracao_horas}h</strong>
                  <span>{apt.atividade?.nome}</span>
                  {apt.comentario && <p>{apt.comentario}</p>}
                </div>
              </div>
            ))}
            <div className="total-hours">
              <strong>
                Total: {apontamentos.reduce((sum, a) => sum + a.duracao_horas, 0).toFixed(1)}h
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4️⃣ CSS do Painel

**Arquivo**: `extension/pages/panel/styles.css`

```css
.aponta-panel {
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f3f3f3;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.panel-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.btn-apontar {
  padding: 6px 12px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-apontar:hover {
  background: #005a9e;
}

.panel-body {
  background: white;
  border-radius: 4px;
  padding: 12px;
  min-height: 100px;
}

.empty-state {
  text-align: center;
  color: #666;
  font-size: 13px;
  margin: 20px 0;
}

.apontamentos-list h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.apontamento-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.apt-date {
  font-weight: 600;
  color: #0078d4;
  min-width: 80px;
}

.apt-details {
  flex: 1;
}

.apt-details strong {
  display: block;
}

.apt-details span {
  display: block;
  color: #666;
  font-size: 11px;
}

.apt-details p {
  margin: 4px 0 0 0;
  color: #888;
  font-size: 11px;
  font-style: italic;
}

.total-hours {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #0078d4;
  text-align: right;
  font-size: 13px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 13px;
}

.error {
  color: #d32f2f;
  background: #ffebee;
}
```

---

## 5️⃣ Dialog/Modal Component

**Arquivo**: `extension/pages/dialog/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Apontar Tempo</title>
    <script type="text/javascript" src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        input, select, textarea { 
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }
        textarea { resize: vertical; min-height: 80px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .buttons { display: flex; gap: 8px; margin-top: 20px; }
        button { padding: 10px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
        .btn-primary { background: #0078d4; color: white; }
        .btn-primary:hover { background: #005a9e; }
        .btn-secondary { background: #f3f3f3; color: #333; border: 1px solid #ddd; }
    </style>
</head>
<body style="padding: 16px;">
    <form id="apontamento-form">
        <div class="form-group">
            <label for="data">Data</label>
            <input type="date" id="data" name="data" required>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="hora-inicio">Hora Início</label>
                <input type="time" id="hora-inicio" name="hora-inicio" required>
            </div>
            <div class="form-group">
                <label for="duracao">Duração (horas)</label>
                <input type="number" id="duracao" name="duracao" step="0.5" min="0.5" max="24" required>
            </div>
        </div>
        
        <div class="form-group">
            <label for="atividade">Tipo de Atividade</label>
            <select id="atividade" name="atividade" required>
                <option value="">Selecione...</option>
                <option value="dev-001">Desenvolvimento</option>
                <option value="doc-001">Documentação</option>
                <option value="test-001">Testes</option>
                <option value="review-001">Code Review</option>
                <option value="support-001">Suporte</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="comentario">Comentário</label>
            <textarea id="comentario" name="comentario" placeholder="Adicione um comentário (opcional)"></textarea>
        </div>
        
        <div class="buttons">
            <button type="submit" class="btn-primary">Salvar</button>
            <button type="button" class="btn-secondary" onclick="closeDialog()">Cancelar</button>
        </div>
    </form>
    
    <script>
        let workItemId = null;
        let projectId = null;
        let organizationName = null;
        
        VSS.init();
        
        VSS.ready(function() {
            // Obter parâmetros da URL
            const params = new URLSearchParams(window.location.search);
            workItemId = params.get('id');
            
            // Obter contexto
            const context = VSS.getWebContext();
            projectId = context.project?.name || '';
            organizationName = context.collection?.name || '';
            
            // Data padrão = hoje
            document.getElementById('data').valueAsDate = new Date();
            
            // Setup form handler
            document.getElementById('apontamento-form').addEventListener('submit', handleSubmit);
        });
        
        async function handleSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const data = new FormData(form);
            
            try {
                const response = await fetch(
                    'https://staging-aponta.treit.com.br/api/v1/apontamentos',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + (await VSS.getAccessToken()).token
                        },
                        body: JSON.stringify({
                            work_item_id: parseInt(workItemId),
                            project_id: projectId,
                            organization_name: organizationName,
                            data_apontamento: data.get('data'),
                            duracao: data.get('hora-inicio') + ':00', // Formato HH:mm
                            duracao_horas: parseFloat(data.get('duracao')),
                            id_atividade: data.get('atividade'),
                            comentario: data.get('comentario') || null,
                            usuario_id: VSS.getWebContext().user.id,
                            usuario_nome: VSS.getWebContext().user.name,
                            usuario_email: VSS.getWebContext().user.email
                        })
                    }
                );
                
                if (response.ok) {
                    alert('Apontamento salvo com sucesso!');
                    closeDialog();
                } else {
                    alert('Erro ao salvar apontamento');
                }
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        }
        
        function closeDialog() {
            VSS.getService(VSS.ServiceIds.Dialog)
                .then(dialog => dialog.getDialogResultDeferred().resolve())
                .catch(() => window.close());
        }
    </script>
</body>
</html>
```

---

## 📂 Estrutura de Arquivos

```
extension/
├─ vss-extension.json              ← Manifest principal
├─ images/
│  └─ icon-64.png                 ← Ícone (64x64px)
└─ pages/
   ├─ panel/
   │  ├─ index.html               ← HTML do painel
   │  ├─ App.jsx                  ← Componente React
   │  └─ styles.css               ← CSS do painel
   ├─ dialog/
   │  └─ index.html               ← HTML dialog
   └─ context-menu/
      └─ index.html               ← HTML menu (futuro)
```

---

## 🚀 Próximos Passos

1. **Copie os templates acima**
2. **Ajuste URLs e endpoints** para seu ambiente
3. **Teste localmente** com `tfx extension create`
4. **Publique** no Azure DevOps Marketplace ou servidor interno

---

**Data**: 22 de janeiro de 2026  
**Status**: ✅ Templates Prontos para Usar
