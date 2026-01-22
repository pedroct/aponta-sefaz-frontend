# fe-aponta - Frontend-Only React SPA

## 🚀 Quick Start

### Desenvolvendo Localmente
```bash
npm install          # Instalar dependências (já foi feito)
npm run dev          # Iniciar servidor dev em http://localhost:5000
```

### Build para Produção
```bash
npm run build        # Criar dist/
npm run preview      # Preview da build de produção
```

### Testes
```bash
npm run test         # Executar testes (watch mode)
npm run test:run     # Executar testes uma vez
npm run test:coverage # Gerar relatório de cobertura
```

---

## 📋 Status da Otimização (Conclusão Recente)

✅ **Limpeza de Dependências**: 62 → 21 packages (-67%)
✅ **Simplificação de Componentes**: 49 → 10 UI components (-84%)
✅ **Build Verification**: npm run build ✅ npm run dev ✅
✅ **Zero Vulnerabilidades**: 0 security issues

Veja [CLEANUP_FINAL_REPORT.md](./CLEANUP_FINAL_REPORT.md) para detalhes completos.

---

## 🏗️ Arquitetura

### Frontend Stack
- **React 19.2.0** - UI Framework
- **Vite 7.1.9** - Build tool & dev server
- **TypeScript 5.6.3** - Type safety
- **TanStack Query 5.60.5** - Server state management
- **React Hook Form 7.66.0** - Form handling
- **Zod 3.25.76** - Schema validation
- **Tailwind CSS 4.1.14** - Styling

### UI Components (10 Essenciais)
- **button.tsx** - Variantes de botões
- **calendar.tsx** - Date picker com popover
- **card.tsx** - Componente layout
- **command.tsx** - Combobox search
- **dialog.tsx** - Modal base
- **popover.tsx** - Overlay primitive
- **toast.tsx** - Sistema de notificações
- **toaster.tsx** - Toast provider
- **tooltip.tsx** - Tooltips
- **work-item-icon.tsx** - Custom icon display

### Estrutura de Pastas
```
/client/src/
  ├── components/
  │   ├── custom/        # Componentes específicos (ModalAdicionarTempo)
  │   └── ui/            # Componentes reutilizáveis
  ├── hooks/             # Custom React hooks
  ├── lib/               # Utilitários
  ├── pages/             # Page components
  ├── App.tsx            # Root component
  └── main.tsx           # Entry point
/shared/
  └── schema.ts          # Shared types & validation
```

---

## 📡 API Backend

Aguarda backend em: `http://localhost:8000`

**Endpoints Esperados**:
- `GET /api/user` - Usuário autenticado
- `GET /api/atividades` - Lista de atividades
- `GET /api/v1/work-items/search?query=...` - Busca de tarefas
- `POST /api/apontamentos` - Criar apontamento de tempo

---

## 🎯 Funcionalidade Principal

**ModalAdicionarTempo.tsx** (456 linhas)
- Formulário para adicionar apontamento de tempo
- Campos:
  - Usuário (display)
  - Tarefa (search autocomplete)
  - Data (picker, hoje e 30 dias antes)
  - Duração (HH:mm com presets)
  - Atividade (dropdown)
  - Comentário (opcional)
- Validações: 15min-8h duração, data válida, tarefa selecionada

---

## 📝 Padrões de Desenvolvimento

### Naming Conventions
- Componentes React: `PascalCase` (e.g., `ModalAdicionarTempo`)
- Arquivos: `kebab-case.tsx` (e.g., `modal-adicionar-tempo.tsx`)
- Funções/vars: `camelCase` (e.g., `handleSubmit`)
- Tipos/Interfaces: `PascalCase` (e.g., `IAtividade`)

### Imports
```tsx
// Componentes internos
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";
import { Button } from "@/components/ui/button";

// Hooks customizados
import { useCurrentUser } from "@/hooks/use-current-user";

// Utilitários
import { cn } from "@/lib/utils";
```

### Validação com Zod
```tsx
const schema = z.object({
  duration: z.string().regex(/^\d{2}:\d{2}$/),
  date: z.date().max(new Date()),
  taskId: z.string().min(1)
});
```

---

## 🔍 Troubleshooting

### Componente não encontrado?
Verificar se está em `/client/src/components/ui/` ou `/client/src/components/custom/`

### Erro de tipo TypeScript?
Rodar `npm run type-check` para verificar tipos

### Build falhando?
- Verificar se todos os imports estão corretos
- Rodar `npm install` novamente
- Deletar `node_modules/` e `.env` se necessário

### Dev server não inicia?
- Porta 5000 pode estar em uso
- Verificar `.env` e `.env.example`
- Reiniciar: `npm run dev`

---

## 🔐 Variáveis de Ambiente

Veja `.env.example` para configuração necessária.

Backend esperado em: `http://localhost:8000`

---

## 📚 Documentação

- [CLEANUP_FINAL_REPORT.md](./CLEANUP_FINAL_REPORT.md) - Detalhes da otimização
- [.context/docs/](./docs/migration/) - Guias de migração (frontend-only)
- [AGENTS.md](./AGENTS.md) - Instruções para agentes IA

---

## 🚫 Removido Recentemente

- ❌ `/server/` - Backend Express
- ❌ `/script/` - Scripts de build
- ❌ 39 componentes UI não utilizados
- ❌ 41 dependências npm desnecessárias
- ❌ Plugins Replit-específicos

→ Veja [CLEANUP_FINAL_REPORT.md](./CLEANUP_FINAL_REPORT.md)

---

## 📞 Suporte

Para ajuda com desenvolvimento:
1. Verificar testes: `npm run test`
2. Verificar tipos: `npm run type-check`
3. Ver erros: Ver console do navegador (F12)
4. Logs: Verificar console do terminal dev

---

**Última atualização**: Limpeza e otimização completa - 100% operacional ✅

Próximas prioridades:
1. ✅ Build verificado
2. ✅ Dev server rodando
3. ⏳ Implementar backend em localhost:8000
4. ⏳ E2E tests quando backend pronto
