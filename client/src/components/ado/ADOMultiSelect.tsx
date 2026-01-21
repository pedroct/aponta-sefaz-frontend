import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ADOMultiSelectOption {
  /** Valor único da opção (ID) */
  value: string;
  /** Texto exibido */
  label: string;
}

interface ADOMultiSelectProps {
  /** Label do campo */
  label?: string;
  /** Opções do dropdown */
  options: ADOMultiSelectOption[];
  /** Placeholder quando nenhum valor selecionado */
  placeholder?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Callback quando a seleção muda */
  onChange?: (values: string[]) => void;
  /** Valores selecionados (IDs) */
  value?: string[];
  /** Campo desabilitado */
  disabled?: boolean;
  /** Mensagem de erro */
  error?: string;
}

/**
 * Multi-select dropdown no estilo Azure DevOps
 */
export function ADOMultiSelect({
  label,
  options,
  placeholder = "Selecione...",
  className,
  onChange,
  value = [],
  disabled = false,
  error
}: ADOMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValues);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 w-full relative">
      {label && <label className="text-sm font-semibold text-[#201F1E]">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[32px] px-2 py-1 text-sm border border-[#605E5C] rounded-sm",
          "hover:border-[#323130] focus:outline-none focus:border-[#0078D4]",
          "focus:ring-1 focus:ring-[#0078D4] bg-white flex items-center justify-between text-left gap-1",
          disabled && "bg-[#F3F2F1] cursor-not-allowed opacity-60",
          error && "border-[#A80000] focus:border-[#A80000] focus:ring-[#A80000]",
          className
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-[#605E5C]">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#EDEBE9] text-[#201F1E] text-xs rounded"
              >
                <span className="truncate max-w-[100px]">{opt.label}</span>
                {!disabled && (
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-[#A4262C]"
                    onClick={(e) => handleRemove(opt.value, e)}
                  />
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-[#605E5C] flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#C8C6C4] shadow-lg z-50 flex flex-col">
          {/* Lista de opções com scroll */}
          <div className="max-h-52 overflow-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#605E5C]">Nenhuma opção disponível</div>
            ) : (
              options.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "px-3 py-2 text-sm text-[#201F1E] hover:bg-[#F3F2F1] cursor-pointer flex items-center gap-2",
                      isSelected && "bg-[#DEECF9]"
                    )}
                    onClick={() => handleToggle(opt.value)}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded-sm flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-[#0078D4] border-[#0078D4]" : "border-[#605E5C]"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé com ações */}
          {options.length > 0 && (
            <div className="border-t border-[#C8C6C4] px-3 py-2 flex justify-between">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-[#0078D4] hover:text-[#106EBE]"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(options.map((opt) => opt.value));
                }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selecionar tudo</span>
              </button>
              {value.length > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-[#605E5C] hover:text-[#201F1E]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.([]);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {error && <span className="text-xs text-[#A80000]">{error}</span>}
    </div>
  );
}
