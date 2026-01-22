# 🎯 Guia de Implementação: Botão "Apontar Tempo" em Tasks/Bugs

## 📋 Análise do 7pace Reference

Baseado na análise da implementação do 7pace Timetracker, criei este guia para implementar um botão "Apontar Tempo" similar.

---

## 🏗️ Arquitetura da Solução

### 1. **Extension Manifest** (`extension.vsomanifest`)

O arquivo principal que declara as contribuições para Azure DevOps. As contribuições principais são:

```
Contribuições criadas pelo 7pace:
├─ work-item-form-group          ← Painel lateral em Tasks/Bugs
├─ work-item-form-page           ← Aba adicional em Tasks/Bugs
├─ work-item-context-menu        ← Menu de contexto
├─ addTimePopupDialog            ← Dialog (modal) para adicionar tempo
└─ workItemContextMenu           ← Action provider para context menu
```

### 2. **Tipos de Contribuição Usados**

| Tipo | Uso | Local |
|------|-----|-------|
| `ms.vss-work-web.work-item-form-group` | **Painel na página de task** | Lado direito da task |
| `ms.vss-work-web.work-item-form-page` | Aba customizada | Abas da task |
| `ms.vss-web.action-provider` | **Menu de contexto** | Clique direito em task |
| `ms.vss-web.control` | **Dialog/Modal** | Pop-up para formulário |

---

## 📍 Localização do Botão "Add Time" (7pace)

### Onde aparece:
1. **Painel Lateral** - Na página de task/bug (tipo: `work-item-form-group`)
2. **Menu de Contexto** - Clique direito em task na lista (tipo: `action-provider`)
3. **Modal Dialog** - Pop-up com formulário (tipo: `ms.vss-web.control`)

### Dados técnicos:

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

**Explicação**:
- `{{account.name}}` → Nome da organização Azure (ex: sefaz-ceara-lab)
- `{{id}}` → ID do Work Item
- Abre um dialog externo que redirecionará para uma URL com contexto

---

## 🔧 Para Implementar "Apontar Tempo"

### Opção 1: Painel Lateral na Task (Recomendado para MVP)

**Arquivo**: `extension.vsomanifest`

```json
{
  "id": "aponta-tempo-panel",
  "type": "ms.vss-work-web.work-item-form-group",
  "targets": ["ms.vss-work-web.work-item-form"],
  "properties": {
    "title": "Apontar Tempo",
    "name": "Apontar Tempo",
    "height": 100,
    "group": "contributed",
    "uri": "https://staging-aponta.treit.com.br/extension-panel.html?workItemId={{workItem.id}}&projectId={{project.id}}&organizationName={{account.name}}",
    "registeredObjectId": "ApontarTempoPanel"
  }
}
```

**O que isto faz**:
- Adiciona um painel na página de task
- Carrega arquivo HTML da sua aplicação
- Passa parâmetros: ID da task, projeto, organização

### Opção 2: Botão no Menu de Contexto

**Arquivo**: `extension.vsomanifest`

```json
{
  "id": "aponta-tempo-context-menu",
  "type": "ms.vss-web.action-provider",
  "targets": ["ms.vss-work-web.work-item-context-menu"],
  "properties": {
    "title": "Aponta",
    "group": "contributed",
    "uri": "https://staging-aponta.treit.com.br/context-menu-provider.html?host=..."
  }
}
```

### Opção 3: Dialog/Modal (Como 7pace)

```json
{
  "id": "aponta-tempo-dialog",
  "type": "ms.vss-web.control",
  "targets": [],
  "properties": {
    "uri": "https://staging-aponta.treit.com.br/Integration/ApontarTempoDialog/{{id}}"
  }
}
```

---

## 📦 Estrutura de Arquivos Necessária

```
extension/
├─ extension.vsomanifest         ← Manifest principal
├─ vss-extension.json            ← Metadados da extensão
├─ images/
│  └─ extension-icon.png         ← Ícone (48x48 ou 64x64)
└─ pages/
   ├─ extension-panel.html       ← Painel lateral
   ├─ extension-panel.tsx        ← Componente React
   ├─ context-menu-provider.html ← Menu de contexto
   └─ apontar-tempo-dialog.html  ← Modal com formulário
```

---

## 🔌 Como Comunicar com Azure DevOps (VSS SDK)

### 1. Arquivo HTML da Extensão

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <script type="text/javascript" src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
</head>
<body>
    <div id="app"></div>
    <script>
        // Inicializar VSS SDK
        VSS.init();
        
        // Obter contexto
        VSS.ready(function() {
            const webContext = VSS.getWebContext();
            const workItem = VSS.getContribution().initialConfig.workItem;
            
            console.log('Work Item:', workItem);
            console.log('Project:', webContext.project);
            console.log('Organization:', webContext.collection);
        });
    </script>
</body>
</html>
```

### 2. Componente React

```typescript
import { VSS } from './vss-types';

export function ApontarTempoPanel() {
  const [workItem, setWorkItem] = React.useState(null);
  
  React.useEffect(() => {
    VSS.ready(() => {
      const context = VSS.getWebContext();
      const config = VSS.getContribution().initialConfig;
      
      setWorkItem({
        id: config.workItem?.id,
        title: config.workItem?.title,
        projectId: context.project?.id,
        organizationName: context.collection?.name
      });
    });
  }, []);
  
  const handleApontarTempo = async () => {
    // Chamar API do seu backend
    await fetch('/api/v1/apontamentos', {
      method: 'POST',
      body: JSON.stringify({
        work_item_id: workItem.id,
        project_id: workItem.projectId,
        organization_name: workItem.organizationName,
        // ... outros dados
      })
    });
  };
  
  return (
    <div>
      <h3>Apontar Tempo</h3>
      <p>Task: {workItem?.title}</p>
      <button onClick={handleApontarTempo}>
        Apontar Tempo
      </button>
    </div>
  );
}
```

---

## 📝 Exemplo Completo do `extension.vsomanifest`

```json
{
  "manifestVersion": 1,
  "scopes": [
    "vso.work_write",
    "vso.identity"
  ],
  "contributions": [
    {
      "id": "aponta-tempo-panel",
      "type": "ms.vss-work-web.work-item-form-group",
      "description": "Painel para apontar tempo em tasks e bugs",
      "targets": ["ms.vss-work-web.work-item-form"],
      "properties": {
        "title": "Apontar Tempo",
        "name": "Apontar Tempo",
        "height": 150,
        "group": "contributed",
        "uri": "pages/panel/extension-panel.html",
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
      "targets": ["ms.vss-work-web.work-item-context-menu"],
      "properties": {
        "title": "Apontar",
        "group": "contributed",
        "uri": "pages/contextMenu/context-menu-provider.html"
      }
    },
    {
      "id": "aponta-tempo-dialog",
      "type": "ms.vss-web.control",
      "targets": [],
      "properties": {
        "uri": "pages/dialog/apontar-tempo-dialog.html?workItemId={{id}}"
      }
    }
  ]
}
```

---

## 🔑 Parâmetros Disponíveis via VSS SDK

Dentro do seu código React/TypeScript, você tem acesso a:

```typescript
const context = VSS.getWebContext();

// Organização
context.collection.name        // Ex: "sefaz-ceara-lab"
context.collection.id          // Ex: "123e4567-e89b"

// Projeto
context.project.name           // Ex: "DEV"
context.project.id             // Ex: "456e7890-f90a"

// Usuário
context.user.name              // Ex: "João Silva"
context.user.email             // Ex: "joao@example.com"
context.user.id                // Ex: "user-123"

// Work Item (se disponível)
VSS.getContribution().initialConfig.workItem.id     // Ex: 1234
VSS.getContribution().initialConfig.workItem.title  // Ex: "Implement login"
```

---

## 📂 Próximo Passo: Copiar Código do Browser

Para complementar a implementação, você pode:

1. **Abra o DevTools** (F12) na página de task/bug com 7pace
2. **Console → Copie código JavaScript** que inicializa o painel
3. **Analise** como VSS SDK é inicializado
4. **Adapte** para seu projeto

Exemplo de código a procurar:

```javascript
// No Console, procure por:
- VSS.init()
- VSS.ready(function)
- VSS.getWebContext()
- VSS.getExtensionContext()
- VSS.getContribution()
```

---

## 🚀 Recomendação MVP

Para um MVP rápido, implemente:

### 1. **Painel Lateral** (`work-item-form-group`)
   - ✅ Mais simples de implementar
   - ✅ Sempre visível
   - ✅ Bom para usuário rápido

### 2. **Dialog/Modal** (opcional)
   - Para abrir formulário completo
   - Similar ao 7pace

### 3. **Context Menu** (futuro)
   - Para ações rápidas
   - Pode vir depois

---

## 📞 Próximos Passos

1. **Você quer copiar código do browser** da produção?
   - Abra https://prod-aponta.com em outro navegador
   - Vá para uma task/bug
   - Abra DevTools (F12)
   - Cole aqui ou faça print do código

2. **Eu posso criar** os arquivos de template prontos
   - `extension.vsomanifest` completo
   - Página HTML de painel
   - Componente React
   - TypeScript types

3. **Ou você prefere** eu guiar passo a passo?

---

**Baseado em**: 7pace Timetracker v2024  
**Data**: 22 de janeiro de 2026  
**Status**: ✅ Documentado e Pronto para Implementação
