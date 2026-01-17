import React, { useState } from "react";
import { X, Clock, Calendar as CalendarIcon, Search, Save } from "lucide-react";
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

export const ModalAdicionarTempo = ({ isOpen, onClose, taskTitle = "C02. Documentação do Projeto", taskId = "5" }: ModalAdicionarTempoProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [duration, setDuration] = useState("01:00");
  const [comment, setComment] = useState("");
  const [activity, setActivity] = useState("Documentação");
  const [searchTerm, setSearchTerm] = useState(`#${taskId} ${taskTitle}`);

  if (!isOpen) return null;

  const presets = ["+0.5h", "+1h", "+2h", "+4h"];

  const handleAddPreset = (preset: string) => {
    const val = parseFloat(preset.replace("+", "").replace("h", ""));
    const parts = duration.split(":");
    const currentHours = parseInt(parts[0]) || 0;
    const currentMins = parseInt(parts[1]) || 0;
    
    let totalMins = (currentHours * 60) + currentMins + (val * 60);
    
    // Limite máximo de 08:00 (480 minutos)
    if (totalMins > 480) {
      totalMins = 480;
    }
    
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    
    setDuration(`${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Se o usuário digitar algo que não seja número ou :
    if (!/^[0-9:]*$/.test(value)) return;

    setDuration(value);

    // Validação ao perder o foco ou completar o campo seria ideal, 
    // mas para o mockup vamos validar o formato básico e o limite
    const parts = value.split(":");
    if (parts.length === 2) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const total = (h * 60) + m;
      
      if (total > 480) {
        setDuration("08:00");
      }
    } else if (parts.length === 1) {
      const h = parseInt(parts[0]) || 0;
      if (h > 8) {
        setDuration("08:00");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[400px] shadow-2xl rounded-sm border border-[#C8C6C4] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#EAEAEA]">
          <h2 className="text-sm font-semibold text-[#201F1E]">Apontar Tempo Trabalhado</h2>
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

          {/* Searchable Task Field */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#605E5C]">Tarefa</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-[#605E5C]" />
              <input 
                type="text"
                className="w-full h-9 pl-8 pr-2 text-xs border border-[#C8C6C4] rounded-sm bg-[#FFF4CE]/30 border-l-4 border-l-[#FFB900] focus:outline-none focus:border-[#0078D4] text-[#201F1E] font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar tarefa..."
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#605E5C]">Data</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="w-full h-9 px-2 text-sm border border-[#C8C6C4] rounded-sm hover:border-[#323130] focus:outline-none focus:border-[#0078D4] bg-white flex items-center gap-2 text-[#201F1E]">
                  <CalendarIcon size={14} className="text-[#605E5C]" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-3 bg-white shadow-xl z-[110] border border-[#C8C6C4]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if(d) { setDate(d); setIsCalendarOpen(false); } }}
                  locale={ptBR}
                  className="bg-white w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration & Presets */}
          <div className="flex flex-col gap-1">
             <label className="text-[11px] text-[#605E5C]">Duração</label>
             <div className="flex items-center gap-2">
                <input 
                  className="w-20 h-9 px-2 text-sm border border-[#C8C6C4] rounded-sm text-center font-mono focus:border-[#0078D4] outline-none"
                  value={duration}
                  onChange={handleDurationChange}
                  placeholder="00:00"
                />
                <div className="flex gap-1">
                   {presets.map(p => (
                     <button 
                       key={p} 
                       onClick={() => handleAddPreset(p)}
                       className="px-2.5 h-8 text-[11px] border border-[#C8C6C4] rounded-sm bg-[#EFF6FC] hover:bg-[#DEECF9] text-[#201F1E] transition-colors font-medium"
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
               className="w-full h-9 px-2 text-sm border border-[#C8C6C4] rounded-sm bg-white focus:border-[#0078D4] outline-none"
               value={activity}
               onChange={(e) => setActivity(e.target.value)}
             >
                <option value="[Não definido]">[Não definido]</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Documentação">Documentação</option>
                <option value="Reunião">Reunião</option>
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
             className="px-6 py-1.5 text-xs font-semibold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm flex items-center gap-1.5"
           >
             Salvar
           </button>
        </div>
      </div>
    </div>
  );
};
