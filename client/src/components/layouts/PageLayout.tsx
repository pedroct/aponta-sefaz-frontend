import React from "react";
import { ADOHeader } from "@/components/ado/ADOHeader";

interface PageLayoutProps {
  /** Título da página */
  title: string;
  /** Conteúdo do header (formulário, botões, etc) */
  headerContent?: React.ReactNode;
  /** Conteúdo principal da página */
  children: React.ReactNode;
}

/**
 * Layout padrão de página no estilo Azure DevOps
 *
 * Estrutura:
 * - Spacer (faixa cinza no topo)
 * - Header (título + conteúdo opcional)
 * - Content (área principal com fundo cinza)
 */
export function PageLayout({ title, headerContent, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F8] flex flex-col font-[Segoe UI]">
      {/* Spacer - separação do topo */}
      <div className="h-4 bg-[#FAF9F8]" />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ADOHeader title={title}>
          {headerContent}
        </ADOHeader>

        {/* Main Content */}
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
