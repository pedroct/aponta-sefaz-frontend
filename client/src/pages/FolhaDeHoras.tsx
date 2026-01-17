import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Tipagens ---

interface LinhaApontamento {
  id: string;
  idTarefa: string;
  titulo: string;
  projeto: string;
  nivel: number;
  expandido: boolean;
  horas: { [data: string]: string };
  isHeader?: boolean;
}

// --- Componentes ---

const TabelaApontamentosGrid = ({ dataInicio }: { dataInicio: Date }) => {
  const [apontamentos, setApontamentos] = useState<LinhaApontamento[]>([
    {
      id: "1",
      idTarefa: "01",
      titulo: "GESTÃO DE PROJETOS",
      projeto: "",
      nivel: 0,
      expandido: true,
      horas: {},
      isHeader: true
    },
    {
      id: "2",
      idTarefa: "01.01",
      titulo: "ATIVIDADES DE PROJETO",
      projeto: "01",
      nivel: 1,
      expandido: true,
      horas: {},
      isHeader: true
    },
    {
      id: "3",
      idTarefa: "01.01.01",
      titulo: "HU de Desenvolvimento",
      projeto: "01.01",
      nivel: 2,
      expandido: true,
      horas: {},
      isHeader: true
    },
    {
      id: "4",
      idTarefa: "C01",
      titulo: "Implementar Extensão",
      projeto: "01.01.01",
      nivel: 3,
      expandido: true,
      horas: {
        "2026-01-12": "8",
        "2026-01-13": "1.5",
        "2026-01-16": "1",
        "2026-01-17": "0.5"
      }
    },
    {
      id: "5",
      idTarefa: "01.01.02",
      titulo: "Documentação do Projeto",
      projeto: "01.01",
      nivel: 2,
      expandido: true,
      horas: {},
      isHeader: true
    },
    {
      id: "6",
      idTarefa: "C02",
      titulo: "Documentação do Projeto",
      projeto: "01.01.02",
      nivel: 3,
      expandido: true,
      horas: {
        "2026-01-12": "7",
        "2026-01-13": "1",
        "2026-01-15": "1"
      }
    }
  ]);

  const toggleExpandir = (id: string) => {
    setApontamentos(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, expandido: !item.expandido };
      }
      return item;
    }));
  };

  const isVisivel = (item: LinhaApontamento): boolean => {
    if (item.nivel === 0) return true;
    
    // Para tarefas (nivel 3), o pai é o item cujo idTarefa é item.projeto
    if (item.nivel === 3) {
      const pai = apontamentos.find(a => a.idTarefa === item.projeto);
      return pai ? pai.expandido && isVisivel(pai) : true;
    }
    
    // Para níveis hierárquicos (Épico, Feature, HU), o pai é baseado no idTarefa
    const partes = item.idTarefa.split('.');
    const idTarefaPai = partes.slice(0, -1).join('.');
    if (!idTarefaPai) return true;
    
    const pai = apontamentos.find(a => a.idTarefa === idTarefaPai);
    return pai ? pai.expandido && isVisivel(pai) : true;
  };

  const diasDaSemana = Array.from({ length: 7 }, (_, i) => addDays(dataInicio, i));

  const handleHoraChange = (id: string, dataStr: string, valor: string) => {
    setApontamentos(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, horas: { ...item.horas, [dataStr]: valor } };
      }
      return item;
    }));
  };

  const calcularTotalLinha = (horas: { [data: string]: string }) => {
    return Object.values(horas).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  };

  const calcularTotalDia = (dataStr: string) => {
    return apontamentos
      .filter(item => !item.isHeader && isVisivel(item))
      .reduce((acc, item) => acc + (parseFloat(item.horas[dataStr]) || 0), 0);
  };

  return (
    <div className="w-full bg-white border border-[#EAEAEA] rounded-sm overflow-hidden text-[#201F1E]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#FAF9F8] border-b border-[#EAEAEA]">
            <th className="p-2 border-r border-[#EAEAEA] w-8"></th>
            <th className="p-2 border-r border-[#EAEAEA] w-24 text-center text-[10px] text-[#605E5C] uppercase">ID</th>
            <th className="p-2 border-r border-[#EAEAEA] min-w-[300px] text-left">Título</th>
            {diasDaSemana.map((dia) => (
              <th key={dia.toString()} className="p-2 border-r border-[#EAEAEA] w-24 text-center">
                <div className="text-[10px] text-[#605E5C] uppercase">{format(dia, "eee", { locale: ptBR })}</div>
                <div className={cn("text-xs", isSameDay(dia, new Date()) && "text-[#0078D4] font-bold")}>
                  {format(dia, "dd", { locale: ptBR })}
                </div>
              </th>
            ))}
            <th className="p-2 bg-[#F3F2F1] w-24 text-center font-bold">Semana Σ</th>
          </tr>
        </thead>
        <tbody>
          {apontamentos.map((item) => {
            if (!isVisivel(item)) return null;
            
            return (
              <tr key={item.id} className={cn("border-b border-[#EAEAEA] hover:bg-[#F3F2F1] transition-colors", item.isHeader && "bg-[#FAF9F8]/50")}>
                <td className="p-1 border-r border-[#EAEAEA] text-center">
                  {item.nivel < 3 ? (
                    <button onClick={() => toggleExpandir(item.id)} className="p-1 hover:bg-[#E1DFDD] rounded-sm">
                      {item.expandido ? (
                        <ChevronDown className="w-3 h-3 text-[#605E5C]" />
                      ) : (
                        <ChevronRightIcon className="w-3 h-3 text-[#605E5C]" />
                      )}
                    </button>
                  ) : null}
                </td>
                <td className="p-1 border-r border-[#EAEAEA] text-center text-[10px] text-[#605E5C] font-mono">{item.idTarefa}</td>
                <td className="p-1 border-r border-[#EAEAEA]">
                  <div className="flex items-center" style={{ paddingLeft: `${item.nivel * 16}px` }}>
                     <span className={cn(item.isHeader ? "font-bold text-[11px] uppercase tracking-tight" : "text-sm")}>
                        {item.nivel === 0 && "👑 "}
                        {item.nivel === 1 && "🏆 "}
                        {item.nivel === 2 && "📘 "}
                        {item.nivel === 3 && "📋 "}
                        {item.titulo}
                     </span>
                  </div>
                </td>
                {diasDaSemana.map((dia) => {
                  const dataStr = format(dia, "yyyy-MM-dd");
                  return (
                    <td key={dataStr} className="p-0 border-r border-[#EAEAEA]">
                      {!item.isHeader && (
                        <input
                          type="text"
                          value={item.horas[dataStr] || ""}
                          onChange={(e) => handleHoraChange(item.id, dataStr, e.target.value)}
                          className="w-full h-8 text-center bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0078D4] transition-all"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="p-2 bg-[#F3F2F1]/50 text-center font-semibold">
                  {!item.isHeader ? calcularTotalLinha(item.horas) : ""}
                </td>
              </tr>
            );
          })}
          <tr className="bg-[#F3F2F1] font-bold">
            <td colSpan={3} className="p-2 border-r border-[#EAEAEA] text-right uppercase text-xs">Total</td>
            {diasDaSemana.map((dia) => (
              <td key={dia.toString()} className="p-2 border-r border-[#EAEAEA] text-center">
                {calcularTotalDia(format(dia, "yyyy-MM-dd")) || ""}
              </td>
            ))}
            <td className="p-2 text-center text-[#0078D4]">
              {apontamentos
                .filter(item => !item.isHeader && isVisivel(item))
                .reduce((acc, item) => acc + calcularTotalLinha(item.horas), 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function FolhaDeHoras() {
  const [dataInicio, setDataInicio] = useState(startOfWeek(new Date("2026-01-12"), { weekStartsOn: 1 }));

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex flex-col font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif] pt-4">
      <div className="px-6 py-2 flex items-center justify-between border-b border-[#EAEAEA] bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#201F1E]">
            <button onClick={() => setDataInicio(addDays(dataInicio, -7))} className="p-1 hover:bg-[#F3F2F1] rounded-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm">
              {format(dataInicio, "MMM dd", { locale: ptBR })} - {format(addDays(dataInicio, 6), "MMM dd, yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setDataInicio(addDays(dataInicio, 7))} className="p-1 hover:bg-[#F3F2F1] rounded-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-[#0078D4] font-bold uppercase bg-[#DEECF9] px-2 py-0.5 rounded-full">Semana em progresso</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#201F1E] hover:bg-[#F3F2F1] rounded-sm transition-colors border border-transparent hover:border-[#C8C6C4]">
            <Plus className="w-3.5 h-3.5 text-[#0078D4]" />
            Adicionar Tempo
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <TabelaApontamentosGrid dataInicio={dataInicio} />
      </div>
    </div>
  );
}
