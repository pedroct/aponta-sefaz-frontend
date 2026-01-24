import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";

/**
 * Página que renderiza o modal de apontamento diretamente.
 * Usada quando acessada via popup do Work Item Form Group do Azure DevOps.
 */
export default function ApontarPopup() {
  const [, setLocation] = useLocation();
  const [params, setParams] = useState<{
    workItemId: string;
    workItemTitle: string;
    organization: string;
    project: string;
    projectId: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    // Extrair parâmetros da URL
    const searchParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    
    const workItemId = searchParams.get("workItemId") || "";
    const workItemTitle = searchParams.get("workItemTitle") || "";
    const organization = searchParams.get("organization") || "";
    const project = searchParams.get("project") || "";
    const projectId = searchParams.get("projectId") || "";
    const token = searchParams.get("token") || "";

    console.log("[ApontarPopup] Parâmetros recebidos:", {
      workItemId,
      workItemTitle,
      organization,
      project,
      projectId,
      hasToken: !!token
    });

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
      token
    });
  }, []);

  const handleClose = () => {
    console.log("[ApontarPopup] Fechando modal");
    // Fechar a janela popup
    window.close();
  };

  if (!params) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <ModalAdicionarTempo
        isOpen={true}
        onClose={handleClose}
        taskId={params.workItemId}
        taskTitle={params.workItemTitle}
        organizationName={params.organization}
        projectId={params.projectId}
        mode="create"
      />
    </div>
  );
}
