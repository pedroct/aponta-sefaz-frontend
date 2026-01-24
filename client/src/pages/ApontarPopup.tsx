import React, { useEffect, useState, useCallback } from "react";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";

/**
 * Página que renderiza o modal de apontamento diretamente.
 * Usada quando acessada via popup do Work Item Form Group do Azure DevOps.
 * 
 * URL esperada: /#/apontar?workItemId=123&workItemTitle=...&organization=...&projectId=...&token=...
 * 
 * Modos:
 * - popup: Janela popup tradicional (window.open)
 * - dialog: Host Dialog nativo do Azure DevOps (iframe dentro do dialog)
 */

interface PopupParams {
  workItemId: string;
  workItemTitle: string;
  organization: string;
  project: string;
  projectId: string;
  token: string;
  embedded: boolean;
  mode: "popup" | "dialog";
  source: string;
}

// Helper para enviar mensagens para o parent (dialog host)
function sendToParent(type: string, data?: Record<string, unknown>) {
  if (window.parent !== window) {
    const message = { type, ...data };
    console.log("[ApontarPopup] Enviando para parent:", message);
    window.parent.postMessage(message, "*");
  }
}

export default function ApontarPopup() {
  const [params, setParams] = useState<PopupParams | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ApontarPopup] Componente montado");
    console.log("[ApontarPopup] URL completa:", window.location.href);
    console.log("[ApontarPopup] Hash:", window.location.hash);

    try {
      // Extrair parâmetros da URL hash
      const hash = window.location.hash || "";
      const queryStartIndex = hash.indexOf("?");
      const queryString = queryStartIndex !== -1 ? hash.slice(queryStartIndex + 1) : "";
      
      console.log("[ApontarPopup] Query string extraída:", queryString);
      
      const searchParams = new URLSearchParams(queryString);
      
      const workItemId = searchParams.get("workItemId") || "";
      const workItemTitle = decodeURIComponent(searchParams.get("workItemTitle") || "");
      const organization = searchParams.get("organization") || "";
      const project = searchParams.get("project") || "";
      const projectId = searchParams.get("projectId") || "";
      const token = searchParams.get("token") || "";
      const embedded = searchParams.get("embedded") === "true";
      const mode = (searchParams.get("mode") as "popup" | "dialog") || "popup";
      const source = searchParams.get("source") || "unknown";

      console.log("[ApontarPopup] Parâmetros extraídos:", {
        workItemId,
        workItemTitle: workItemTitle.substring(0, 50) + "...",
        organization,
        project,
        projectId,
        hasToken: !!token,
        tokenLength: token.length,
        embedded,
        mode,
        source
      });

      // Validar parâmetros essenciais
      if (!workItemId) {
        console.warn("[ApontarPopup] workItemId não encontrado");
      }

      // Armazenar token no localStorage se fornecido
      if (token) {
        localStorage.setItem("azdo_token", token);
        console.log("[ApontarPopup] Token armazenado no localStorage");
      }

      // Armazenar contexto do Azure DevOps
      if (organization && projectId) {
        const context = {
          organization,
          project,
          projectId,
          source: "azdo-workitem-form"
        };
        localStorage.setItem("azdo_context", JSON.stringify(context));
        console.log("[ApontarPopup] Contexto armazenado:", context);
      }

      setParams({
        workItemId,
        workItemTitle,
        organization,
        project,
        projectId,
        token,
        embedded,
        mode,
        source
      });

      // Se estiver em modo dialog, configurar listener para mensagens do host
      if (mode === "dialog") {
        const handleHostMessage = (event: MessageEvent) => {
          const data = event.data;
          if (!data || !data.type) return;
          
          console.log("[ApontarPopup] Mensagem do host:", data);
          
          if (data.type === "SAVE_FORM") {
            // O host está solicitando salvar o formulário
            // Isso será tratado pelo ModalAdicionarTempo via callback onSave
            const saveEvent = new CustomEvent("apontar:save-form");
            window.dispatchEvent(saveEvent);
          }
        };

        window.addEventListener("message", handleHostMessage);
        return () => window.removeEventListener("message", handleHostMessage);
      }
    } catch (err) {
      console.error("[ApontarPopup] Erro ao processar parâmetros:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }, []);

  const handleClose = () => {
    console.log("[ApontarPopup] Fechando modal/popup");

    // Se estiver em modo dialog, comunicar com o host
    if (params?.mode === "dialog" && window.parent !== window) {
      console.log("[ApontarPopup] Enviando CLOSE_FORM para host dialog");
      sendToParent("CLOSE_FORM");
      return;
    }

    // Se estiver em modo embedded (iframe), comunicar com parent
    if (params?.embedded && window.parent !== window) {
      console.log("[ApontarPopup] Enviando CLOSE_FORM para parent");
      window.parent.postMessage({ type: "CLOSE_FORM" }, "*");
      return;
    }

    // Tentar fechar a janela popup
    try {
      window.close();
    } catch (e) {
      console.log("[ApontarPopup] Não foi possível fechar janela, redirecionando...");
      // Se não conseguir fechar (ex: não é popup), redirecionar para home
      window.location.href = "/#/";
    }
  };

  // Callback para quando o formulário salvar com sucesso
  const handleSaveSuccess = useCallback((result: unknown) => {
    console.log("[ApontarPopup] Formulário salvo com sucesso:", result);
    
    // Se estiver em modo dialog, comunicar com o host
    if (params?.mode === "dialog" && window.parent !== window) {
      sendToParent("FORM_SAVED", { result, success: true });
    }
  }, [params?.mode]);

  // Callback para notificar mudanças de validação do formulário
  const handleValidationChange = useCallback((isValid: boolean) => {
    if (params?.mode === "dialog" && window.parent !== window) {
      sendToParent("FORM_VALID_CHANGED", { isValid });
    }
  }, [params?.mode]);

  // Estado de erro
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Estado de carregamento
  if (!params) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
          <p className="mt-1 text-xs text-gray-400">ApontarPopup v1.1.84</p>
        </div>
      </div>
    );
  }

  // Modo dialog: não mostrar o fundo modal, apenas o conteúdo
  const isDialogMode = params.mode === "dialog";

  return (
    <div className={isDialogMode ? "h-full bg-white" : params.embedded ? "h-full bg-white" : "min-h-screen bg-white"}>
      <ModalAdicionarTempo
        isOpen={true}
        onClose={handleClose}
        taskId={params.workItemId}
        taskTitle={params.workItemTitle}
        organizationName={params.organization}
        projectId={params.projectId}
        mode="create"
        embedded={params.embedded || isDialogMode}
        hostDialog={isDialogMode}
        onSaveSuccess={handleSaveSuccess}
        onValidationChange={handleValidationChange}
      />
    </div>
  );
}
