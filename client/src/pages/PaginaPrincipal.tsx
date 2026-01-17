import React from "react";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";

export default function PaginaPrincipal() {
  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
      {/* 
        Como a extensão é apenas a popup, deixamos ela aberta por padrão 
        nesta página para que o usuário possa visualizar e testar o componente 
        diretamente no Replit.
      */}
      <ModalAdicionarTempo 
        isOpen={true} 
        onClose={() => {}} 
        taskId="#5"
        taskTitle="C02. Documentação do Projeto"
      />
    </div>
  );
}
