# 🔌 Análise Detalhada: 7pace Reference Implementation

## 📍 Localização Exata do Botão "Add Time"

Analisando o arquivo `extension.vsomanifest`, identifiquei **3 localizações** onde o botão "Add Time" aparece:

---

## 1️⃣ **PAINEL LATERAL NA TASK** (Mais Importante)

### Arquivo de Configuração
```json
{
  "id": "work-item-new-panel",
  "type": "ms.vss-work-web.work-item-form-group",
  "targets": ["ms.vss-work-web.work-item-form"],
  "properties": {
    "title": "7pace Timetracker",
    "height": 100,
    "uri": "/pages/panel/panel.html?host=https://{{account.name}}.timehub.7pace.com/&...",
    "registeredObjectId": "WorkItemPanelItems"
  }
}
```

### O que é `work-item-form-group`?
- ✅ Adiciona um painel/grupo na página de task/bug
- ✅ Aparece na aba "Details" da task
- ✅ Integrado nativamente no Azure DevOps
- ✅ Melhor para informações e ações rápidas

### Onde aparece:
```
┌─────────────────────────────────────────────────────────────┐
│  TASK: "Implementar login"                                  │
├─────────────────────────────────────────────────────────────┤
│  Details   Discussion   Links   Attachments                  │
├──────────────┬────────────────────────────────────────────┐
│              │                                            │
│  Left Pane   │  Right Pane (Centro)                       │
│  (Campos)    │                                            │
│              │  ┌─────────────────────────────────────┐  │
│              │  │ 7pace Timetracker Panel ← AQUI!    │  │
│              │  │                                     │  │
│              │  │  [Add Time] Button                  │  │
│              │  │  History                            │  │
│              │  │  Total: 10.5 horas                  │  │
│              │  └─────────────────────────────────────┘  │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

---

## 2️⃣ **MENU DE CONTEXTO** (Clique Direito)

### Arquivo de Configuração
```json
{
  "id": "workItemContextMenu",
  "type": "ms.vss-web.action-provider",
  "targets": ["ms.vss-work-web.work-item-context-menu"],
  "properties": {
    "uri": "/pages/contextMenu/contextMenu.html?host=..."
  }
}
```

### O que é `action-provider`?
- ✅ Adiciona itens ao menu de contexto
- ✅ Aparece em clique direito na task
- ✅ Múltiplas ações possíveis (Add Time, Start Tracking, etc)

### Onde aparece:
```
Task List:
│
├─ [Task #1] ← Clique direito aqui
│  ├─ ✏️ Edit
│  ├─ 🗑️ Delete
│  ├─ 🔗 Add Link
│  ├─ ──────────────
│  ├─ ⏱️ Add Time ← Inserido pelo 7pace
│  ├─ ▶️ Start Tracking ← Inserido pelo 7pace
│  └─ ──────────────
└─ [Task #2]
```

### Código que Apareça (from contextMenu.html):
```html
<script>
  // Itens do menu contexto
  const menuItems = [
    {
      text: "Add Time",
      icon: <TimeIcon />,
      action: () => openAddTimeDialog()
    },
    {
      text: "Start Tracking",
      icon: <PlayIcon />,
      action: () => startTracking()
    }
  ];
</script>
```

---

## 3️⃣ **DIALOG/MODAL** (Pop-up com Formulário)

### Arquivo de Configuração
```json
{
  "id": "addTimePopupDialog",
  "type": "ms.vss-web.control",
  "targets": [],
  "properties": {
    "uri": "https://{{account.name}}.timehub.7pace.com/Integration/AddTimePopupDialog/{{id}}"
  }
}
```

### O que é `ms.vss-web.control`?
- ✅ Renderiza um dialog/modal
- ✅ URL externa (pode ser seu servidor)
- ✅ `{{id}}` = ID do Work Item passado como parâmetro
- ✅ Usado tanto pelo painel quanto pelo menu contexto

### Como é Aberto (from embeddedWorkItemPanel.js)

```javascript
const dialogService = await VSS.getService(VSS.ServiceIds.Dialog);
const extensionContext = VSS.getExtensionContext();

const dialogOptions = {
  title: "Add Time",
  width: 410,
  height: 586,
  resizable: false,
  urlReplacementObject: { id: workItemId },
  buttons: [],
  close: () => { /* handle close */ }
};

// Abre o dialog
const dialog = await dialogService.openDialog(
  `${extensionContext.publisherId}.${extensionContext.extensionId}.addTimePopupDialog`,
  dialogOptions
);
```

### Onde aparece:
```
┌──────────────────────────────────┐
│  Add Time              [X]        │  ← Dialog Modal
├──────────────────────────────────┤
│                                  │
│  Date: [____/____/____]          │
│  Time:  [__:__]                  │
│  Duration: [_____] hours         │
│  Activity: [Select ▼]            │
│  Comment: [____________]         │
│                                  │
│           [Save] [Cancel]        │
│                                  │
└──────────────────────────────────┘
```

---

## 🏗️ Fluxo Completo de Interação

```
USUÁRIO ABRE TASK
   ↓
┌─ PAINEL LATERAL (work-item-form-group) APARECE
│  ├─ Título: "7pace Timetracker"
│  ├─ Botão: [Add Time]
│  ├─ Histórico: Mostra apontamentos anteriores
│  └─ Clique no botão [Add Time]
│     ↓
│  ┌─ DIALOG MODAL ABRE (ms.vss-web.control)
│  │  ├─ URL: .../AddTimePopupDialog/{{workItemId}}
│  │  ├─ Formulário de apontamento
│  │  └─ Usuario preenche e clica [Save]
│  │     ↓
│  │  ┌─ BACKEND RECEBE DADOS
│  │  │  ├─ POST /Integration/AddTime
│  │  │  ├─ Salva no DB
│  │  │  └─ DIALOG FECHA
│  │  └─
│  └─
│  └─ PAINEL ATUALIZA (refresh automático)
│     └─ Novo apontamento aparece no histórico
│
└─ ALTERNATIVA: MENU DE CONTEXTO
   ├─ Clique direito na task
   ├─ Menu aparece (action-provider)
   ├─ Seleciona "Add Time"
   └─ DIALOG ABRE (mesmo dialog acima)
```

---

## 🔧 Componentes Técnicos do 7pace

### 1. **Panel Component** (React)
- **Arquivo**: `/pages/panel/panel.html` + JavaScript
- **Função**: Renderiza painel lateral
- **O que faz**:
  - Busca dados da task (via VSS SDK)
  - Exibe histórico de apontamentos
  - Botão para abrir dialog

### 2. **Dialog Component** (React)
- **Arquivo**: `/pages/panel/scripts/embeddedWorkItemPanel.js`
- **Função**: Gerencia abertura do dialog
- **O que faz**:
  - Cria dialog options
  - Abre dialog modal
  - Passa parâmetros (workItemId, projectId)
  - Configura callbacks de fechamento

### 3. **Button Component** (React/Styled)
- **Arquivo**: `/pages/panel/scripts/embeddedWorkItemPanel.js` (AddTimeBtn)
- **Código encontrado**:
  ```typescript
  t.AddTimeBtn = ({clickHandler:e}) => 
    l.createElement(f, {onClick:e}, 
      l.createElement(s,null,
        l.createElement(u.AddIcon,null)
      ),
      "Add Time"
    );
  ```

### 4. **Context Menu Handler**
- **Arquivo**: `/pages/contextMenu/contextMenu.html`
- **Função**: Registro de ações de menu
- **O que faz**:
  - Define itens de menu
  - Click handlers para cada item
  - Abre o mesmo dialog

---

## 📊 Estrutura de Dados Trocados

### Contexto Passado (VSS SDK → Panel)
```javascript
{
  webContext: {
    collection: { id, name },           // Organização
    project: { id, name },              // Projeto
    user: { id, name, email },          // Usuário logado
    team: { id }                        // Time
  },
  contribution: {
    properties: { isCloud: true/false },
    initialConfig: {}
  }
}
```

### Parâmetros na URL do Dialog
```
/Integration/AddTimePopupDialog/{{id}}

Onde:
- {{id}} = Work Item ID (ex: 1234)
- {{account.name}} = Organization (ex: sefaz-ceara-lab)
```

---

## 🎯 Implementação "Apontar Tempo"

Para implementar similar ao 7pace, você precisa:

### 1. **Extension Manifest** ✅
- ID da contribuição: `aponta-tempo-panel`
- Tipo: `ms.vss-work-web.work-item-form-group`
- URI: Apontar para sua página

### 2. **Página HTML do Painel**
- Usar VSS SDK para obter contexto
- Renderizar componente React
- Adicionar botão "Apontar Tempo"

### 3. **Dialog Modal**
- Mesmo tipo: `ms.vss-web.control`
- Formulário com campos
- Chamar seu backend

### 4. **Context Menu** (Opcional)
- Tipo: `ms.vss-web.action-provider`
- Adiciona "Apontar Tempo" ao clique direito

---

## 📝 Comparação: 7pace vs Seu Projeto

| Aspecto | 7pace | Seu Projeto |
|---------|-------|-----------|
| **Panel Type** | `work-item-form-group` | `work-item-form-group` ✅ |
| **Panel URI** | `/pages/panel/panel.html` | `/extension-panel.html` |
| **Dialog Type** | `ms.vss-web.control` | `ms.vss-web.control` ✅ |
| **Dialog URI** | `/Integration/AddTimePopupDialog/{{id}}` | `/apontar-tempo/dialog.html?id={{id}}` |
| **Context Menu** | `action-provider` | `action-provider` ✅ |
| **Backend** | 7pace API | Seu backend (staging-aponta) |
| **Endpoint** | `/Integration/AddTime` | `/api/v1/apontamentos` ✅ |

---

## 💾 Onde Copiar Código (Se Necessário)

Para obter código pronto do 7pace, você pode:

1. **Abra DevTools** (F12) na página de task com 7pace
2. **Sources → Procure por**:
   - `embeddedWorkItemPanel.js` - Panel logic
   - `contextMenu.html` - Context menu setup
   - `VSS.SDK.js` - Initialization

3. **Elements → Procure por**:
   - `<div id="app">` - Root element
   - `.work-item-form-group` - Panel class

4. **Network → Procure por**:
   - Requisição para `/Integration/AddTime`
   - Headers com autenticação
   - Payload esperado

---

## 📞 Próximo Passo

**Você quer que eu crie:**

1. ✅ **Template do extension.vsomanifest** pronto?
2. ✅ **Página HTML** de painel?
3. ✅ **Componente React** integrado?
4. ✅ **TypeScript types** para VSS SDK?

**Ou prefere:**
- Copiar código do seu ambiente de produção primeiro?
- Fazer print dos DevTools?

---

**Baseado em**: 7pace Timetracker Extension  
**Data Análise**: 22 de janeiro de 2026  
**Status**: ✅ Pronto para Próximo Passo
