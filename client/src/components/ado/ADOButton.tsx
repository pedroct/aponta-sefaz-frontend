import React from "react";
import { cn } from "@/lib/utils";

interface ADOButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante do botão */
  variant?: "primary" | "secondary" | "danger";
  /** Tamanho do botão */
  size?: "sm" | "md";
  /** Ícone à esquerda */
  icon?: React.ReactNode;
}

/**
 * Botão no estilo Azure DevOps
 */
export function ADOButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
  ...props
}: ADOButtonProps) {
  const variants = {
    primary: "bg-[#0078D4] text-white hover:bg-[#106EBE]",
    secondary: "bg-white text-[#201F1E] border border-[#8A8886] hover:bg-[#F3F2F1]",
    danger: "bg-[#A80000] text-white hover:bg-[#8B0000]"
  };

  const sizes = {
    sm: "h-7 px-3 text-xs",
    md: "h-8 px-4 text-sm"
  };

  return (
    <button
      className={cn(
        "font-semibold rounded-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
