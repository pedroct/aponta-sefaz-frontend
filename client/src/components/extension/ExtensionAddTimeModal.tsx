import React, { useEffect, useState } from "react";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";

/**
 * Componente wrapper para usar o ModalAdicionarTempo na extensão do Azure DevOps
 * Este componente lê os parâmetros do localStorage (injetados pelo VSS SDK)
 * e renderiza o modal já aberto
 */
export const ExtensionAddTimeModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [workItemId, setWorkItemId] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    // Ler dados do localStorage (injetados pelo extension.html via VSS SDK)
    const id = localStorage.getItem("vss_workitem_id") || "";
    const org = localStorage.getItem("vss_organization") || "";
    const proj = localStorage.getItem("vss_project") || "";

    console.log("📋 ExtensionAddTimeModal - Dados carregados:", {
      id,
      org,
      proj,
    });

    setWorkItemId(id);
    setOrganizationName(org);
    setProjectId(proj);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Fechar a janela do dialog após um delay
    setTimeout(() => {
      window.close();
    }, 300);
  };

  return (
    <ModalAdicionarTempo
      isOpen={isOpen}
      onClose={handleClose}
      taskId={workItemId}
      taskTitle=""
      organizationName={organizationName}
      projectId={projectId}
      mode="create"
    />
  );
};

export default ExtensionAddTimeModal;
