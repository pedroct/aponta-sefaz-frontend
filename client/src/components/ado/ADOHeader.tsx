import React from "react";

interface ADOHeaderProps {
  /** Título da página */
  title: string;
  /** Conteúdo adicional (formulário, botões, etc) */
  children?: React.ReactNode;
}

/**
 * Header no estilo Azure DevOps
 * Exibe título da página e área para formulário/ações
 */
export function ADOHeader({ title, children }: ADOHeaderProps) {
  return (
    <div className="bg-white border-b border-[#EAEAEA] px-6 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#201F1E]">{title}</h1>
      </div>
      {children && <div className="flex items-end gap-4">{children}</div>}
    </div>
  );
}
