import React, { useState, useEffect } from "react";
import { X, Clock, Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ModalAdicionarTempoProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  taskId?: string;
}

export const ModalAdicionarTempo = ({ isOpen, onClose, taskTitle = "C02. Documentação do Projeto", taskId = "#5" }: ModalAdicionarTempoProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [comment, setComment] = useState("");
  const [activity, setActivity] = useState("[Não definido]");
  const [isBillable, setIsBillable] = useState(true);

  if (!isOpen) return null;

  const presets = ["+0.5h", "+1h", "+2h", "+4h"];

  const handleAddPreset = (hours: string) => {
    const val = parseFloat(hours.replace("+", "").replace("h", ""));
    // Simplificado para o mockup
    setDuration(`${Math.floor(val).toString().padStart(2, '0')}:${((val % 1) * 60).toString().padStart(2, '0')}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[400px] shadow-2xl rounded-sm border border-[#C8C6C4] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#EAEAEA]">
          <h2 className="text-sm font-semibold text-[#201F1E]">Adicionar Tempo</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F3F2F1] rounded-sm transition-colors text-[#605E5C]">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {/* User Display */}
          <div className="flex items-center gap-2 p-1.5 border border-[#C8C6C4] rounded-sm bg-[#FAF9F8]">
             <div className="w-5 h-5 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[10px] font-bold">PT</div>
             <span className="text-xs text-[#201F1E]">PEDRO CICERO TEIXEIRA</span>
          </div>

          {/* Task Info */}
          <div className="p-2 border border-[#C8C6C4] rounded-sm bg-[#FFF4CE]/30 border-l-4 border-l-[#FFB900]">
             <span className="text-xs font-semibold text-[#201F1E] flex items-center gap-1">
               <span className="text-[#0078D4]">{taskId}</span> {taskTitle}
             </span>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#605E5C]">Data</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="w-full h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm hover:border-[#323130] focus:outline-none focus:border-[#0078D4] bg-white flex items-center gap-2 text-[#201F1E]">
                  <CalendarIcon size={14} className="text-[#605E5C]" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-2 bg-white shadow-xl z-[110]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if(d) { setDate(d); setIsCalendarOpen(false); } }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration & Presets */}
          <div className="flex flex-col gap-1">
             <label className="text-[11px] text-[#605E5C]">Duração</label>
             <div className="flex items-center gap-2">
                <input 
                  className="w-20 h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm text-center font-mono"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <div className="flex gap-1">
                   {presets.map(p => (
                     <button 
                       key={p} 
                       onClick={() => handleAddPreset(p)}
                       className="px-2 py-1 text-[10px] border border-[#C8C6C4] rounded-sm hover:bg-[#F3F2F1] text-[#201F1E] transition-colors"
                     >
                       {p}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Activity Selector */}
          <div className="flex flex-col gap-1">
             <label className="text-[11px] text-[#605E5C]">Tipo de Atividade</label>
             <select 
               className="w-full h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm bg-white focus:border-[#0078D4] outline-none"
               value={activity}
               onChange={(e) => setActivity(e.target.value)}
             >
                <option>[Não definido]</option>
                <option>Desenvolvimento</option>
                <option>Documentação</option>
                <option>Reunião</option>
             </select>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1">
             <label className="text-[11px] text-[#605E5C]">Adicionar comentário</label>
             <textarea 
               className="w-full p-2 text-sm border border-[#C8C6C4] rounded-sm min-h-[80px] focus:border-[#0078D4] outline-none placeholder:text-[#A19F9D]"
               placeholder="Adicione um comentário..."
               value={comment}
               onChange={(e) => setComment(e.target.value)}
             />
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-[#EAEAEA] mt-2">
             <span className="text-xs text-[#605E5C]">Horas faturáveis</span>
             <button 
               onClick={() => setIsBillable(!isBillable)}
               className={cn(
                 "w-8 h-4 rounded-full relative transition-colors duration-200",
                 isBillable ? "bg-[#0078D4]" : "bg-[#C8C6C4]"
               )}
             >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200",
                  isBillable ? "left-4.5" : "left-0.5"
                )} />
             </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#FAF9F8] border-t border-[#EAEAEA]">
           <button 
             onClick={onClose}
             className="px-4 py-1.5 text-xs font-semibold text-[#201F1E] hover:bg-[#EDEBE9] rounded-sm border border-[#C8C6C4]"
           >
             Cancelar
           </button>
           <button 
             onClick={onClose}
             className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm flex items-center gap-1.5"
           >
             Salvar
           </button>
        </div>
      </div>
    </div>
  );
};
