import React from "react";
import { Search, Filter } from "lucide-react";

interface ADOToolbarProps {
  /** Placeholder do campo de busca */
  searchPlaceholder?: string;
  /** Callback ao digitar na busca */
  onSearch?: (value: string) => void;
  /** Callback ao clicar em filtrar */
  onFilter?: () => void;
  /** Mostrar botão de filtro */
  showFilter?: boolean;
  /** Conteúdo adicional à esquerda */
  leftContent?: React.ReactNode;
  /** Conteúdo adicional à direita */
  rightContent?: React.ReactNode;
  /** Valor atual da busca */
  searchValue?: string;
}

/**
 * Toolbar no estilo Azure DevOps
 * Barra de ferramentas com filtro e busca
 */
export function ADOToolbar({
  searchPlaceholder = "Pesquisar...",
  onSearch,
  onFilter,
  showFilter = true,
  leftContent,
  rightContent,
  searchValue
}: ADOToolbarProps) {
  return (
    <div className="px-4 py-3 border-b border-[#EAEAEA] flex justify-between items-center bg-white">
      <div className="flex gap-2">
        {showFilter && (
          <button
            onClick={onFilter}
            className="flex items-center gap-1 text-sm text-[#201F1E] hover:bg-[#F3F2F1] px-2 py-1 rounded-sm"
          >
            <Filter className="w-4 h-4 text-[#0078D4]" />
            <span>Filtrar</span>
          </button>
        )}
        {leftContent}
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1.5 text-[#605E5C]" />
          <input
            className="h-8 pl-8 pr-4 text-sm border border-transparent hover:border-[#605E5C] focus:border-[#0078D4] rounded-sm w-48 transition-colors"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
