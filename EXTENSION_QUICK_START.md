# ⚡ QUICK START: Implementar "Apontar Tempo"

**Tempo estimado**: 30 minutos para MVP  
**Nível**: Intermediário  
**Pré-requisitos**: Node.js, npm, TypeScript

---

## 📋 Checklist Rápido

- [ ] Copiar template `vss-extension.json`
- [ ] Copiar template `pages/panel/index.html`
- [ ] Copiar template `pages/panel/App.jsx`
- [ ] Copiar template `pages/panel/styles.css`
- [ ] Copiar template `pages/dialog/index.html`
- [ ] Ajustar URLs para seu servidor
- [ ] Testar localmente
- [ ] Build e publicar

---

## 🚀 Passo 1: Setup Inicial (5 min)

### 1.1 Criar pasta da extensão

```bash
mkdir -p extension/pages/{panel,dialog}
mkdir -p extension/images
cd extension
```

### 1.2 Copiar arquivo manifest

Crie `extension/vss-extension.json` com o template de [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md#1️⃣-extension-manifest-template)

### 1.3 Ajustar URLs

```json
{
  "publisher": "seu-usuario",  // seu usuário
  "name": "aponta-tempo",      // seu nome
  "version": "1.0.0",          // sua versão
  ...
}
```

---

## 🎨 Passo 2: Painel Lateral (10 min)

### 2.1 Criar `pages/panel/index.html`

Copie de [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md#2️⃣-html-do-painel-recomendado-para-mvp)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://vsscode.dev/scripts/VSS.SDK.js"></script>
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

### 2.2 Criar `pages/panel/App.jsx`

Copie de [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md#3️⃣-componente-react-do-painel)

**Pontos principais:**
- `VSS.ready()` para inicializar
- `VSS.getWebContext()` para contexto
- `fetch()` para chamar seu backend
- `setState()` para atualizar UI

### 2.3 Criar `pages/panel/styles.css`

Copie de [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md#4️⃣-css-do-painel)

---

## 📝 Passo 3: Dialog/Modal (10 min)

### 3.1 Criar `pages/dialog/index.html`

Copie de [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md#5️⃣-dialogmodal-component)

**Pontos principais:**
```html
<form id="apontamento-form">
    <input type="date" required>
    <input type="time" required>
    <input type="number" step="0.5" required>
    <select required>...</select>
    <textarea></textarea>
    <button type="submit">Salvar</button>
</form>
```

### 3.2 Adicionar handler de submit

```javascript
document.getElementById('apontamento-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    // POST para seu backend
    // Fechar dialog se sucesso
  });
```

---

## 🧪 Passo 4: Testar Localmente (5 min)

### 4.1 Instalar TFX CLI

```bash
npm install -g tfx-cli
```

### 4.2 Criar extensão

```bash
cd extension
tfx extension create --manifest-globs vss-extension.json
```

### 4.3 Resultado

```bash
✓ Extensão criada: aponta-tempo-1.0.0.vsix
```

---

## 🌐 Passo 5: Publicar (Opcional)

### 5.1 No Azure DevOps Cloud

```bash
tfx extension publish \
  --manifest-globs vss-extension.json \
  --token <seu-token>
```

### 5.2 On-Premises

```bash
# Copiar arquivo .vsix para seu servidor
# E instalar via UI do Azure DevOps
```

---

## 🔍 Passo 6: Validar

### 6.1 Abra uma task/bug no Azure DevOps

```
Você deve ver:
✅ Novo painel "Apontar Tempo"
✅ Botão "➕ Apontar Tempo"
✅ Lista de apontamentos existentes
```

### 6.2 Clique no botão

```
Você deve ver:
✅ Dialog modal abre
✅ Formulário de apontamento
✅ Campos preenchidos corretamente
```

### 6.3 Preencha e salve

```
Você deve ver:
✅ Dialog fecha
✅ Painel recarrega
✅ Novo apontamento aparece na lista
```

---

## 🎯 Estrutura Final

```
extension/
├─ vss-extension.json
├─ images/
│  └─ icon-64.png
└─ pages/
   ├─ panel/
   │  ├─ index.html
   │  ├─ App.jsx
   │  └─ styles.css
   └─ dialog/
      └─ index.html

Resultado: extension-1.0.0.vsix
```

---

## ⚠️ Pontos de Atenção

### URLs de Backend

**Antes:**
```javascript
'https://localhost:8000/api/v1/apontamentos'
```

**Depois (Produção):**
```javascript
'https://staging-aponta.treit.com.br/api/v1/apontamentos'
```

### Token de Autenticação

**Correto:**
```javascript
const token = (await VSS.getAccessToken()).token;
```

**Errado:**
```javascript
const token = 'meu-token-hardcoded'; // ❌ Nunca faça isso!
```

### CORS

Se receber erro CORS no backend:

```python
# No FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dev.azure.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **"VSS is not defined"** | Adicionar `<script>` do VSS SDK |
| **"Access Denied"** | Verificar token e permissões |
| **Dialog não abre** | Verificar Console (F12) para erros |
| **Dados não salvam** | Verificar endpoint do backend |
| **Painel não aparece** | Verificar manifest `targets` |

---

## 🎉 Sucesso!

Quando tudo funcionar:

1. ✅ Painel visible na task
2. ✅ Botão "Apontar Tempo" funciona
3. ✅ Dialog abre e fecha corretamente
4. ✅ Dados salvam no backend
5. ✅ Lista atualiza automaticamente

---

## 📚 Próximas Pastas (Melhorias)

Depois do MVP, você pode adicionar:

- [ ] Menu de contexto
- [ ] Ícones melhores
- [ ] Validações avançadas
- [ ] Integração com calendário
- [ ] Reportes
- [ ] Suporte offline

---

## 📝 Arquivo de Referência

Todos os templates prontos em:
- [EXTENSION_TEMPLATES.md](EXTENSION_TEMPLATES.md)

Entender a arquitetura:
- [EXTENSION_IMPLEMENTATION_GUIDE.md](EXTENSION_IMPLEMENTATION_GUIDE.md)

Diagrama visual:
- [EXTENSION_VISUAL_DIAGRAMS.md](EXTENSION_VISUAL_DIAGRAMS.md)

---

**Tempo Total**: ~30 minutos  
**Resultado**: Extensão funcional MVP  
**Status**: ✅ Pronto para testar
