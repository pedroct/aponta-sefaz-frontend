import React, { useState, useEffect } from "react";
import { X, Clock, Calendar as CalendarIcon, Search, Save, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCriarApontamento, useAtualizarApontamento } from "@/hooks/use-api";
import { useInvalidateTimesheet } from "@/hooks/use-timesheet";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSearchWorkItems } from "@/hooks/use-search-work-items";
import { useAtividades } from "@/hooks/use-atividades";
import { toast } from "@/hooks/use-toast";
import { ApontamentoDia } from "@/lib/timesheet-types";

// Ícone SVG oficial do Azure DevOps retornado pelo backend
const WorkItemIcon = ({ iconUrl, type }: { iconUrl?: string; type: string }) => {
  if (iconUrl) {
    return (
      <img src={iconUrl} alt={type} width={16} height={16} className="flex-shrink-0" />
    );
  }
  // Fallback: ícone genérico caso iconUrl não esteja disponível
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
      <rect width="16" height="16" rx="2" fill="#666"/>
      <rect x="4" y="7" width="8" height="2" fill="white"/>
    </svg>
  );
};

export type ModalMode = "create" | "edit";

interface ModalAdicionarTempoProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  taskId?: string;
  organizationName?: string;
  projectId?: string;
  // Props para modo de edição
  mode?: ModalMode;
  apontamentoParaEditar?: ApontamentoDia | null;
  dataApontamento?: string; // YYYY-MM-DD
  podeEditar?: boolean;
  // Modo embedded (iframe inline sem backdrop)
  embedded?: boolean;
}

export const ModalAdicionarTempo = ({
  isOpen,
  onClose,
  taskTitle = "",
  taskId = "",
  organizationName = "",
  projectId = "",
  mode = "create",
  apontamentoParaEditar = null,
  dataApontamento,
  podeEditar = true,
  embedded = false,
}: ModalAdicionarTempoProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [comment, setComment] = useState("");
  const [activity, setActivity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkItem, setSelectedWorkItem] = useState<{ id: number; title: string } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isEditMode = mode === "edit" && apontamentoParaEditar !== null;

  // Hooks de API
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { mutateAsync: criarApontamento, isPending: isCreating } = useCriarApontamento();
  const { mutateAsync: atualizarApontamento, isPending: isUpdating } = useAtualizarApontamento(
    apontamentoParaEditar?.id || ""
  );
  const { invalidate: invalidateTimesheet } = useInvalidateTimesheet();
  const { data: atividades, isLoading: isLoadingAtividades } = useAtividades({ ativo: true });
  const { results: searchResults, isLoading: isSearching, handleSearch } = useSearchWorkItems(
    projectId,
    !!projectId, // Habilita quando temos projectId - a query interna já verifica o tamanho do termo
    organizationName
  );

  const isSaving = isCreating || isUpdating;

  // Reset quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      // Se estiver editando, pré-preencher com dados do apontamento
      if (isEditMode && apontamentoParaEditar) {
        setDuration(apontamentoParaEditar.duracao);
        setComment(apontamentoParaEditar.comentario || "");
        setActivity(apontamentoParaEditar.id_atividade);
        
        // Data do apontamento
        if (dataApontamento) {
          setDate(parseISO(dataApontamento));
        }
        
        // Work Item pré-selecionado
        if (taskId && taskTitle) {
          setSelectedWorkItem({ id: parseInt(taskId), title: taskTitle });
          setSearchTerm(`#${taskId} ${taskTitle}`);
        }
      } else {
        // Modo criação
        setDuration("00:00");
        setComment("");
        setActivity("");
        
        // Se data específica foi passada, usar ela; caso contrário, hoje
        if (dataApontamento) {
          setDate(parseISO(dataApontamento));
        } else {
          setDate(new Date());
        }
        
        if (taskId && taskTitle) {
          setSelectedWorkItem({ id: parseInt(taskId), title: taskTitle });
          setSearchTerm(`#${taskId} ${taskTitle}`);
        } else {
          setSelectedWorkItem(null);
          setSearchTerm("");
        }
      }
    }
  }, [isOpen, taskId, taskTitle, isEditMode, apontamentoParaEditar, dataApontamento]);

  // Busca de work items com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2 && !selectedWorkItem) {
        handleSearch(searchTerm);
        setShowSearchResults(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch, selectedWorkItem]);

  if (!isOpen) return null;

  // Obtém iniciais do usuário
  const getUserInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const presets = ["+0.25h", "+0.5h", "+1h", "+2h", "+4h"];

  const handleAddPreset = (preset: string) => {
    const val = parseFloat(preset.replace("+", "").replace("h", ""));
    const parts = duration.split(":");
    const currentHours = parseInt(parts[0]) || 0;
    const currentMins = parseInt(parts[1]) || 0;
    
    // Converter horas para minutos usando Math.round para evitar problemas de ponto flutuante
    // 0.5h = 30min, 1h = 60min, 2h = 120min, 4h = 240min
    const minutesToAdd = Math.round(val * 60);
    let totalMins = (currentHours * 60) + currentMins + minutesToAdd;
    
    // Limite máximo de 08:00 (480 minutos)
    if (totalMins > 480) {
      totalMins = 480;
    }
    
    // Limite mínimo de 00:15 (15 minutos)
    if (totalMins > 0 && totalMins < 15) {
      totalMins = 15;
    }
    
    const newHours = Math.floor(totalMins / 60);
    const newMins = Math.round(totalMins % 60);
    
    setDuration(`${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // só números
    if (value.length > 4) value = value.slice(0, 4);
    // Insere : automaticamente após 2 dígitos
    if (value.length > 2) {
      value = value.slice(0,2) + ':' + value.slice(2);
    }
    setDuration(value);
  };

  // Limita para 08:00 e mínimo 00:15 ao sair do campo
  const handleDurationBlur = () => {
    let value = duration.replace(/[^0-9]/g, "");
    if (value.length < 4) value = value.padStart(4, '0');
    let h = parseInt(value.slice(0,2)) || 0;
    let m = parseInt(value.slice(2,4)) || 0;
    
    // Limitar minutos a 59
    if (m > 59) m = 59;
    
    // Limitar horas a 8
    if (h > 8) {
      h = 8;
      m = 0;
    }
    
    // Se horas = 8, minutos deve ser 0
    if (h === 8 && m > 0) {
      m = 0;
    }
    
    let total = (h * 60) + m;
    
    // Máximo 08:00 (480 minutos)
    if (total > 480) {
      h = 8;
      m = 0;
      total = 480;
    }
    
    // Mínimo 00:15 (15 minutos) - qualquer valor abaixo de 15 vira 15
    // Isso inclui 00:00 ou campo vazio
    if (total < 15) {
      h = 0;
      m = 15;
    }
    
    const formatted = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    setDuration(formatted);
  };

  // Validação para habilitar botão Salvar
  // Requer: Tarefa, Data, Duração > 0 e Tipo de Atividade
  const canSave = () => {
    if (!selectedWorkItem) return false;
    if (!date) return false;
    if (!activity) return false; // Tipo de Atividade obrigatório
    
    const parts = duration.split(":");
    if (parts.length !== 2) return false;
    
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const totalMins = (h * 60) + m;
    
    return totalMins > 0; // Duração deve ser maior que zero
  };

  // Função para salvar apontamento
  const handleSave = async () => {
    if (!canSave() || !selectedWorkItem || !date || !currentUser) return;

    // Verifica permissão de edição
    if (isEditMode && !podeEditar) {
      toast({
        title: "Ação não permitida",
        description: "Não é possível editar apontamentos de Work Items em estado Completed ou Removed.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parts = duration.split(":");
      const hours = parseInt(parts[0]) || 0;
      const mins = parseInt(parts[1]) || 0;
      const totalHours = hours + (mins / 60);

      if (isEditMode) {
        // Modo edição: atualiza apontamento existente
        await atualizarApontamento({
          duracao: duration,
          data_apontamento: format(date, "yyyy-MM-dd"),
          comentario: comment || undefined,
          id_atividade: activity || "",
        });

        // Invalida cache do timesheet para atualizar a grade
        invalidateTimesheet();

        toast({
          title: "Apontamento atualizado",
          description: `${totalHours.toFixed(1)}h atualizadas com sucesso!`,
        });
      } else {
        // Modo criação: cria novo apontamento
        await criarApontamento({
          work_item_id: selectedWorkItem.id,
          duracao: duration,
          data_apontamento: format(date, "yyyy-MM-dd"),
          comentario: comment || undefined,
          id_atividade: activity || "",
          organization_name: organizationName,
          project_id: projectId,
          usuario_id: currentUser.id,
          usuario_nome: currentUser.displayName,
          usuario_email: currentUser.emailAddress || undefined,
        });

        // Invalida cache do timesheet para atualizar a grade
        invalidateTimesheet();

        toast({
          title: "Apontamento criado",
        description: `${totalHours.toFixed(1)}h registradas com sucesso!`,
      });
      }

      onClose();
    } catch (error) {
      toast({
        title: isEditMode ? "Erro ao atualizar" : "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Aviso se Work Item está bloqueado
  const showBlockedWarning = isEditMode && !podeEditar;

  return (
    <div className={cn(
      "z-[100] flex items-center justify-center",
      embedded
        ? "w-full h-full"
        : "fixed inset-0 bg-black/40 backdrop-blur-[1px]"
    )}>
      <div className={cn(
        "bg-white shadow-2xl rounded-sm border border-[#C8C6C4] flex flex-col",
        embedded
          ? "w-full max-w-[420px] mx-auto"
          : "w-[400px] animate-in fade-in zoom-in duration-200"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#EAEAEA]">
          <h2 className="text-sm font-semibold text-[#201F1E]">
            {isEditMode ? "Editar Apontamento" : "Apontar Tempo Trabalhado"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F3F2F1] rounded-sm transition-colors text-[#605E5C]">
            <X size={16} />
          </button>
        </div>

        {/* Aviso de Work Item bloqueado */}
        {showBlockedWarning && (
          <div className="mx-4 mt-4 p-3 bg-[#FFF4CE] border border-[#FFB900] rounded-sm flex items-start gap-2">
            <AlertTriangle size={16} className="text-[#FFB900] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#323130]">
              <strong>Work Item bloqueado:</strong> Não é possível editar apontamentos de Work Items em estado Completed ou Removed.
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {/* User Display */}
          <div className="flex items-center gap-2 p-1.5 border border-[#C8C6C4] rounded-sm bg-[#FAF9F8]">
             <div className="w-5 h-5 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[10px] font-bold">
               {isLoadingUser ? "..." : getUserInitials(currentUser?.displayName || "US")}
             </div>
             <span className="text-xs text-[#201F1E]">
               {isLoadingUser ? "Carregando..." : currentUser?.displayName?.toUpperCase() || "USUÁRIO"}
             </span>
          </div>

          {/* Searchable Task Field */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-[11px] text-[#605E5C]">Tarefa</label>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-2 top-2.5 w-3.5 h-3.5 text-[#605E5C] animate-spin" />
              ) : (
                <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-[#605E5C]" />
              )}
              <input 
                type="text"
                className={cn(
                  "w-full h-9 pl-8 pr-2 text-xs border rounded-sm focus:outline-none focus:border-[#0078D4] text-[#201F1E] font-semibold",
                  selectedWorkItem 
                    ? "bg-[#FFF4CE]/30 border-[#C8C6C4] border-l-4 border-l-[#FFB900]" 
                    : "bg-white border-[#C8C6C4]",
                  // Desabilita edição quando a tarefa já vem pré-definida (célula azul)
                  taskId && "cursor-not-allowed opacity-80"
                )}
                value={searchTerm}
                onChange={(e) => {
                  // Não permite alterar tarefa se já veio pré-definida
                  if (taskId) return;
                  setSearchTerm(e.target.value);
                  setSelectedWorkItem(null);
                }}
                onFocus={() => !taskId && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                placeholder="Pesquisar tarefa..."
                readOnly={!!taskId}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && !selectedWorkItem && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C6C4] rounded-sm shadow-lg z-[120] max-h-48 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#F3F2F1] flex items-center gap-2 border-b border-[#EDEBE9] last:border-b-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedWorkItem({ id: item.id, title: item.title });
                      setSearchTerm(`#${item.id} ${item.title}`);
                      setShowSearchResults(false);
                    }}
                  >
                    <WorkItemIcon iconUrl={item.iconUrl} type={item.type} />
                    <span className="text-xs text-[#323130] font-medium">#{item.id}</span>
                    <span className="text-xs text-[#605E5C] truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
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
                  onBlur={handleDurationBlur}
                  placeholder="00:00"
                  maxLength={5}
                  inputMode="numeric"
                  pattern="[0-9]{2}:[0-9]{2}"
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
               disabled={isLoadingAtividades}
             >
                <option value="">[Não definido]</option>
                {atividades?.items?.map((atv) => (
                  <option key={atv.id} value={atv.id}>
                    {atv.nome}
                  </option>
                ))}
             </select>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1">
             <label className="text-[11px] text-[#605E5C]">Adicionar comentário</label>
             <textarea 
               className={cn(
                 "w-full p-2 text-sm border border-[#C8C6C4] rounded-sm min-h-[80px] focus:border-[#0078D4] outline-none placeholder:text-[#A19F9D]",
                 showBlockedWarning && "bg-[#F3F2F1] cursor-not-allowed"
               )}
               placeholder="Adicione um comentário..."
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               disabled={showBlockedWarning}
             />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#FAF9F8] border-t border-[#EAEAEA]">
           <button 
             onClick={onClose}
             disabled={isSaving}
             className="px-4 py-1.5 text-xs font-semibold text-[#201F1E] hover:bg-[#EDEBE9] rounded-sm border border-[#C8C6C4] disabled:opacity-50"
           >
             Cancelar
           </button>
           <button 
             onClick={handleSave}
             disabled={!canSave() || isSaving || showBlockedWarning}
             className={cn(
               "px-6 py-1.5 text-xs font-semibold text-white rounded-sm flex items-center gap-1.5",
               canSave() && !isSaving && !showBlockedWarning
                 ? "bg-[#0078D4] hover:bg-[#106EBE]"
                 : "bg-[#C8C6C4] cursor-not-allowed"
             )}
           >
             {isSaving ? (
               <>
                 <Loader2 size={14} className="animate-spin" />
                 {isEditMode ? "Atualizando..." : "Salvando..."}
               </>
             ) : (
               isEditMode ? "Atualizar" : "Salvar"
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
