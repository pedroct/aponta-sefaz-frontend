import React from "react";
import { cn } from "@/lib/utils";

interface ADOCardProps {
  /** Conteúdo do card */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Card no estilo Azure DevOps
 * Container com fundo branco e sombra sutil
 */
export function ADOCard({ children, className }: ADOCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
