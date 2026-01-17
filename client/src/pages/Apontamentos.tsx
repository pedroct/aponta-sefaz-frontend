import React, { useState } from "react";
import { ChevronDown, Search, Filter, MoreHorizontal, Check, X, User, Edit2, Trash2, Calendar as CalendarIcon, Clock, MessageSquare, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// --- Components mimicking Azure DevOps UI ---

const ADOHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  return (
    <div className="bg-white border-b border-[#EAEAEA] px-6 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#201F1E]">{title}</h1>
      </div>
      
      {/* Progress Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#605E5C]" />
          <span className="text-[#605E5C] font-normal"><span className="text-[#201F1E] font-bold">Estimado</span> 8 horas</span>
          <span className="text-[#605E5C] font-normal"><span className="text-[#201F1E] font-bold">Executado</span> 7 horas : 45 minutos</span>
        </div>
        <div className="w-full max-w-md h-4 bg-[#F3F2F1] rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-[#CA5010] transition-all duration-500 ease-out flex items-center justify-end px-2"
            style={{ width: "96.8%" }}
          >
            <span className="text-[10px] text-white font-bold">96.8%</span>
          </div>
        </div>
      </div>

      {children && <div className="flex items-end gap-6 mt-2">{children}</div>}
    </div>
  );
};

const ADOField = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-1.5 w-full", className)}>
    <label className="text-xs font-semibold text-[#605E5C]">{label}</label>
    {children}
  </div>
);

const ADODropdown = ({ 
  label, 
  options, 
  placeholder = "Select...", 
  className, 
  onSelect,
  value 
}: { 
  label?: string; 
  options: (string | number)[]; 
  placeholder?: string; 
  className?: string; 
  onSelect?: (val: string) => void;
  value?: string | number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-[#605E5C]">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm hover:border-[#323130] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] bg-white flex items-center justify-between text-left transition-colors",
          className
        )}
      >
        <span className={value !== undefined ? "text-[#201F1E]" : "text-[#605E5C]"}>
          {value !== undefined ? value.toString() : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#605E5C]" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#C8C6C4] shadow-lg z-50 max-h-60 overflow-auto">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-3 py-1.5 text-sm text-[#201F1E] hover:bg-[#F3F2F1] cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                if (onSelect) onSelect(opt.toString());
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ADOTable = ({ data, onEdit, onDelete }: { data: any[]; onEdit?: (row: any) => void; onDelete?: (row: any) => void }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="border-b border-[#EAEAEA] bg-[#FAF9F8]">
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C] w-[120px]">Data</th>
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C] w-[140px]">Tempo apontado</th>
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C] w-[200px]">Apontado por</th>
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C] w-[350px]">Atividade</th>
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C]">Comentário</th>
            <th className="py-2 px-4 text-xs font-semibold text-[#605E5C] text-center w-[100px]">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="group hover:bg-[#F3F2F1] border-b border-[#EAEAEA] last:border-0 transition-colors">
              <td className="py-2.5 px-4 text-sm text-[#201F1E]">{row.date}</td>
              <td className="py-2.5 px-4 text-sm text-[#201F1E]">{row.time}</td>
              <td className="py-2.5 px-4 text-sm text-[#201F1E]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[10px] font-bold">
                    {row.user.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  {row.user}
                </div>
              </td>
              <td className="py-2.5 px-4 text-sm text-[#201F1E] font-medium">{row.activity}</td>
              <td className="py-2.5 px-4 text-sm text-[#605E5C] truncate max-w-xs" title={row.comment}>
                {row.comment}
              </td>
              <td className="py-2.5 px-4 text-sm text-[#201F1E] text-center">
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit && onEdit(row)}
                    className="p-1 hover:bg-[#E1DFDD] rounded-sm text-[#605E5C] hover:text-[#0078D4]" title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete && onDelete(row)}
                    className="p-1 hover:bg-[#FDE7E9] rounded-sm text-[#605E5C] hover:text-[#A80000]" title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Page Implementation ---

const MOCK_DATA = [
  { date: "16/01/2026", time: "01:30", user: "Pedro Teixeira", activity: "Refinamento Funcional", comment: "Discussão sobre os requisitos da nova tela." },
  { date: "15/01/2026", time: "04:00", user: "Laurêncio Lima", activity: "Desenvolvimento Frontend", comment: "Criação dos componentes base." },
  { date: "15/01/2026", time: "02:15", user: "Pedro Teixeira", activity: "Code Review", comment: "Revisão do PR #123." },
];

export default function ApontamentosPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hours, setHours] = useState<string | undefined>(undefined);
  const [minutes, setMinutes] = useState<string | undefined>(undefined);
  const [activity, setActivity] = useState<string>("");
  const [comment, setComment] = useState("");

  const ACTIVITIES = ["Refinamento Funcional", "Desenvolvimento Frontend", "Code Review", "Reunião de Alinhamento", "Testes QA"];
  const HOURS_OPTIONS = Array.from({ length: 9 }, (_, i) => i);
  const MINUTES_OPTIONS = ["00", "15", "30", "45"];

  const handleSave = () => {
    const missingFields = [];
    if (!date) missingFields.push("Data");
    if (hours === undefined) missingFields.push("Hora");
    if (minutes === undefined) missingFields.push("Minutos");
    if (!activity) missingFields.push("Atividade");

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha o(s) campo(s): ${missingFields.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Apontamento registrado com sucesso!",
    });
    
    // Reset fields
    setComment("");
    setActivity("");
    setHours(undefined);
    setMinutes(undefined);
  };

  const handleEdit = (row: any) => {
    toast({
      title: "Editar Apontamento",
      description: `Editando o apontamento de: ${row.date}`,
    });
  };

  const handleDelete = (row: any) => {
    toast({
      title: "Apontamento removido",
      description: "O apontamento foi excluído.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex flex-col font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif] pt-4">
      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Form Fields */}
        <ADOHeader title="Apontamento de Horas">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full items-end pb-1">
            
            {/* Data */}
            <ADOField label="Data *">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm hover:border-[#323130] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] bg-white flex items-center gap-2 text-[#201F1E]">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#605E5C]" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2 bg-white shadow-xl border border-[#C8C6C4] z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                    className="bg-white w-full"
                  />
                </PopoverContent>
              </Popover>
            </ADOField>

            {/* Hora */}
            <ADODropdown 
              label="Hora *" 
              options={HOURS_OPTIONS} 
              placeholder="Selecionar..."
              value={hours}
              onSelect={setHours}
            />

            {/* Minutos */}
            <ADODropdown 
              label="Minutos *" 
              options={MINUTES_OPTIONS} 
              placeholder="Selecionar..."
              value={minutes}
              onSelect={setMinutes}
            />

            {/* Atividade */}
            <div className="md:col-span-2">
              <ADODropdown 
                label="Atividade *" 
                options={ACTIVITIES} 
                placeholder="Selecionar..."
                value={activity}
                onSelect={setActivity}
              />
            </div>

            {/* Comentário */}
            <div className="md:col-span-1">
              <ADOField label="Comentário">
                <input 
                  type="text"
                  maxLength={100}
                  placeholder="Comentário"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-[#C8C6C4] rounded-sm hover:border-[#323130] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-colors placeholder:text-[#605E5C]"
                  data-testid="input-comment"
                />
              </ADOField>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-start">
              <button 
                onClick={handleSave}
                className="h-8 px-6 bg-[#0078D4] text-white text-sm font-semibold rounded-sm hover:bg-[#106EBE] flex items-center justify-center gap-2 transition-colors w-fit min-w-[100px]"
                data-testid="button-save"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </ADOHeader>

        <div className="p-4 md:p-6 flex-1">
          <div className="bg-white rounded-sm shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden">
            {/* Table Component */}
            <ADOTable data={MOCK_DATA} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
