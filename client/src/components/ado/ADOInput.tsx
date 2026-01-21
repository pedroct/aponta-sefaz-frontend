import React from "react";
import { cn } from "@/lib/utils";

interface ADOInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label do campo */
  label?: string;
  /** Mensagem de erro */
  error?: string;
}

/**
 * Input no estilo Azure DevOps
 */
export function ADOInput({ label, placeholder, className, error, ...props }: ADOInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-[#201F1E]">{label}</label>}
      <div className="relative group">
        <input
          className={cn(
            "w-full h-8 px-2 text-sm border border-[#605E5C] rounded-sm",
            "hover:border-[#323130] focus:outline-none focus:border-[#0078D4]",
            "focus:ring-1 focus:ring-[#0078D4] transition-colors placeholder:text-[#605E5C]",
            error && "border-[#A80000] focus:border-[#A80000] focus:ring-[#A80000]",
            className
          )}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-[#A80000]">{error}</span>}
    </div>
  );
}
