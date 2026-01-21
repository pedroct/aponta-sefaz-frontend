import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ADOTableColumn<T> {
  /** Chave do campo no objeto de dados */
  key: keyof T | string;
  /** Título da coluna */
  header: string;
  /** Renderizador customizado */
  render?: (row: T) => React.ReactNode;
  /** Alinhamento da coluna */
  align?: "left" | "center" | "right";
  /** Largura da coluna */
  width?: string;
}

interface ADOTableProps<T> {
  /** Dados da tabela */
  data: T[];
  /** Definição das colunas */
  columns: ADOTableColumn<T>[];
  /** Callback ao editar */
  onEdit?: (row: T) => void;
  /** Callback ao excluir */
  onDelete?: (row: T) => void;
  /** Mostrar coluna de ações */
  showActions?: boolean;
  /** Chave única para cada linha */
  rowKey?: keyof T;
  /** Texto quando não há dados */
  emptyText?: string;
  /** Estado de carregamento */
  isLoading?: boolean;
}

/**
 * Tabela no estilo Azure DevOps
 */
export function ADOTable<T>({
  data,
  columns,
  onEdit,
  onDelete,
  showActions = true,
  rowKey,
  emptyText = "Nenhum registro encontrado",
  isLoading = false
}: ADOTableProps<T>) {
  const getRowKey = (row: T, index: number): string | number => {
    if (rowKey && (row as Record<string, unknown>)[rowKey as string] !== undefined) {
      return String((row as Record<string, unknown>)[rowKey as string]);
    }
    return index;
  };

  const getCellValue = (row: T, key: keyof T | string): React.ReactNode => {
    const value = (row as Record<string, unknown>)[key as string];
    if (value === null || value === undefined) return "-";
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center text-[#605E5C]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#EAEAEA]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "py-2.5 px-4 text-xs font-semibold text-[#605E5C] uppercase tracking-wider",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
            {showActions && (
              <th className="py-2.5 px-4 text-xs font-semibold text-[#605E5C] uppercase tracking-wider text-right">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (showActions ? 1 : 0)} 
                className="py-8 px-4 text-center text-[#605E5C]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="group hover:bg-[#F3F2F1] border-b border-[#EAEAEA] last:border-0 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "py-3 px-4 text-sm text-[#201F1E]",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render ? col.render(row) : getCellValue(row, col.key)}
                  </td>
                ))}
                {showActions && (
                  <td className="py-3 px-4 text-sm text-[#201F1E] text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 hover:bg-[#E1DFDD] rounded-sm text-[#605E5C] hover:text-[#0078D4]"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 hover:bg-[#FDE7E9] rounded-sm text-[#605E5C] hover:text-[#A80000]"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
