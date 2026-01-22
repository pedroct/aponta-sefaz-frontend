import React from "react";
import ReactDOM from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import {
  WorkItemTrackingServiceIds,
  IWorkItemFormService,
} from "azure-devops-extension-api/WorkItemTracking";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";
import "@/index.css";

/**
 * Componente Host para o botão "Aponta Tempo" na toolbar do Work Item
 * 
 * Fluxo:
 * 1. SDK.init() e SDK.register()
 * 2. Ao clicar no botão, captura contexto do Work Item
 * 3. Valida estado (Entregue, Corrigido, Cancelado = bloqueado)
 * 4. Renderiza ModalAdicionarTempo com props pré-preenchidas
 */

interface ToolbarContext {
  isOpen: boolean;
  taskId: string;
  taskTitle: string;
  projectId: string;
  organizationName: string;
  podeEditar: boolean;
}

// Root React para renderização da modal
let root: ReactDOM.Root | null = null;
const rootElement = document.getElementById("root");

/**
 * Renderiza a modal com contexto do Work Item
 */
function renderModal(context: ToolbarContext) {
  if (!rootElement) return;

  if (!root) {
    root = ReactDOM.createRoot(rootElement);
  }

  const handleClose = () => {
    renderModal({ ...context, isOpen: false });
  };

  root.render(
    <React.StrictMode>
      <ModalAdicionarTempo
        isOpen={context.isOpen}
        onClose={handleClose}
        taskId={context.taskId}
        taskTitle={context.taskTitle}
        projectId={context.projectId}
        organizationName={context.organizationName}
        mode="create"
        podeEditar={context.podeEditar}
      />
    </React.StrictMode>
  );
}

/**
 * Captura contexto do Work Item e abre a modal
 */
async function openTimeTrackingModal() {
  try {
    // 1. Obter o serviço de formulário do Work Item
    const formService = await SDK.getService<IWorkItemFormService>(
      WorkItemTrackingServiceIds.WorkItemFormService
    );

    // 2. Capturar dados do item atual em paralelo
    const [id, title, project, state] = await Promise.all([
      formService.getId(),
      formService.getFieldValue("System.Title"),
      formService.getFieldValue("System.TeamProject"),
      formService.getFieldValue("System.State"),
    ]);

    // 3. Validar Categoria de Estado (Regra Kanban v1.0.0)
    // Estados bloqueados: Entregue (HU), Corrigido (Bug), Cancelado
    const estadosBloqueados = ["Entregue", "Corrigido", "Cancelado"];
    const isBlocked = estadosBloqueados.includes(state as string);

    // 4. Obter organização (fallback para hostname se não disponível)
    let organizationName = "";
    try {
      const host = SDK.getHost();
      organizationName = host.name || "";
    } catch {
      // Fallback: extrair do hostname
      const hostname = window.location.hostname;
      const match = hostname.match(/^([^.]+)\./);
      organizationName = match ? match[1] : "dev.azure.com";
    }

    // 5. Renderizar modal com contexto
    renderModal({
      isOpen: true,
      taskId: id.toString(),
      taskTitle: (title as string) || "",
      projectId: (project as string) || "",
      organizationName,
      podeEditar: !isBlocked,
    });
  } catch (error) {
    console.error("[Toolbar Button] Erro ao abrir modal:", error);
    
    // Mostrar mensagem de erro ao usuário
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; text-align: center;">
          <h3>Erro ao carregar modal</h3>
          <p>Não foi possível abrir a modal de apontamento.</p>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }
}

/**
 * Inicialização do SDK e registro do handler
 */
SDK.init().then(() => {
  console.log("[Toolbar Button] SDK inicializado com sucesso");

  SDK.register("aponta-tempo-toolbar-button", () => {
    return {
      /**
       * Método chamado quando o usuário clica no botão "Aponta Tempo"
       */
      execute: async (context: any) => {
        console.log("[Toolbar Button] Botão clicado, contexto:", context);
        await openTimeTrackingModal();
      },
    };
  });

  console.log("[Toolbar Button] Handler registrado: aponta-tempo-toolbar-button");
});
