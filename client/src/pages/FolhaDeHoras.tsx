import React, { useState, useCallback, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight, ChevronLeft, Calendar as CalendarIcon, AlertCircle, Loader2, ChevronsDown, ChevronsUp } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModalAdicionarTempo, ModalMode } from "@/components/custom/ModalAdicionarTempo";
import { CelulaApontamento } from "@/components/custom/CelulaApontamento";
import { DialogConfirmarExclusao } from "@/components/custom/DialogConfirmarExclusao";
import { IterationSelector } from "@/components/custom/IterationSelector";
import { TeamSelector } from "@/components/custom/TeamSelector";
import { WorkItemLink } from "@/components/custom/WorkItemLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkItemIcon } from "@/components/ui/work-item-icon";
import { useTimesheet } from "@/hooks/use-timesheet";
import { useIterations } from "@/hooks/use-iterations";
import { useTeams } from "@/hooks/use-teams";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";
import {
  WorkItemTimesheet,
  ApontamentoDia,
  getMondayOfWeek,
  formatDateForApi
} from "@/lib/timesheet-types";

// Chave para persistir estado de expansão no localStorage
const EXPANDED_STORAGE_KEY = "folha-horas-expanded";

export default function FolhaDeHoras() {
  // Contexto do Azure DevOps - organização e projeto dinâmicos
  const { organization, project, projectId, isLoading: isContextLoading, isInAzureDevOps } = useAzureContext();
  const effectiveProjectId = projectId || project;

  const {
    data: teamsData,
    isLoading: isLoadingTeams,
  } = useTeams({
    organization_name: organization,
    project_id: effectiveProjectId,
    enabled: !!organization && !!effectiveProjectId,
  });

  // Estado do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedWorkItem, setSelectedWorkItem] = useState<{id: number, title: string, podeEditar: boolean} | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [apontamentoParaEditar, setApontamentoParaEditar] = useState<ApontamentoDia | null>(null);
  
  // Estado do dialog de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [apontamentoParaExcluir, setApontamentoParaExcluir] = useState<{id: string, nome: string, podeExcluir: boolean} | null>(null);

  // Estado de navegação e filtros
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Estado do filtro de Iteration (Sprint)
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [isIterationInitialized, setIsIterationInitialized] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Calcular week_start (segunda-feira da semana atual)
  const weekStart = getMondayOfWeek(currentDate);
  const weekStartFormatted = formatDateForApi(weekStart);

  // Definir equipe padrão quando dados carregarem
  useEffect(() => {
    if (isLoadingTeams) {
      return;
    }

    const availableTeams = teamsData?.teams ?? [];

    if (!teamsData || availableTeams.length === 0) {
      if (selectedTeamId !== null) {
        setSelectedTeamId(null);
      }
      return;
    }

    const alreadySelected =
      selectedTeamId && availableTeams.some((team) => team.id === selectedTeamId);

    if (alreadySelected) {
      return;
    }

    const fallbackId =
      (teamsData.default_team_id &&
        availableTeams.some((team) => team.id === teamsData.default_team_id)
        ? teamsData.default_team_id
        : availableTeams[0]?.id) ?? null;

    if (fallbackId) {
      setSelectedTeamId(fallbackId);
    }
  }, [teamsData, selectedTeamId, isLoadingTeams]);

  const teams = teamsData?.teams ?? [];
  const selectedTeam =
    selectedTeamId && teams.length > 0
      ? teams.find((team) => team.id === selectedTeamId) ?? null
      : null;
  const isAdminUser = teamsData?.is_admin ?? false;
  const shouldRequireTeamSelection = teams.length > 0;
  const showTeamSelector = isAdminUser || teams.length > 1;
  const isWaitingForTeamSelection =
    !isLoadingTeams && shouldRequireTeamSelection && !selectedTeamId;
  const iterationsEnabled =
    !isLoadingTeams && (shouldRequireTeamSelection ? !!selectedTeamId : true);
  const timesheetEnabled = iterationsEnabled;

  // Hook para buscar iterations (sprints)
  const {
    data: iterationsData,
    isLoading: isLoadingIterations,
  } = useIterations(
    {
      organization_name: organization,
      project_id: effectiveProjectId,
      team_id: selectedTeamId ?? undefined,
    },
    { enabled: iterationsEnabled }
  );

  // Sempre que a equipe mudar, resetar seleção de sprint
  useEffect(() => {
    if (!selectedTeamId) {
      return;
    }

    setIsIterationInitialized(false);
    setSelectedIterationId(null);
  }, [selectedTeamId]);

  // Auto-selecionar Sprint atual na primeira carga
  useEffect(() => {
    if (!isIterationInitialized && iterationsData && iterationsData.iterations.length > 0) {
      if (iterationsData.current_iteration_id) {
        setSelectedIterationId(iterationsData.current_iteration_id);
      }
      setIsIterationInitialized(true);
    }
  }, [iterationsData, isIterationInitialized]);

  // Hook para buscar dados do timesheet
  const {
    data: timesheet,
    isLoading,
    isFetching,
    isError,
    error
  } = useTimesheet(
    {
      organization_name: organization,
      project_id: effectiveProjectId,
      week_start: weekStartFormatted,
      iteration_id: selectedIterationId ?? undefined,
      team_id: selectedTeamId ?? undefined,
    },
    { enabled: timesheetEnabled }
  );

  const isTableLoading =
    isLoadingTeams ||
    (iterationsEnabled && isLoadingIterations) ||
    (timesheetEnabled && isLoading) ||
    isWaitingForTeamSelection;
  const hasTimesheetData = (timesheet?.work_items?.length ?? 0) > 0;

  const handleTeamChange = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
  }, []);

  // Handler para mudança de Sprint
  const handleIterationChange = useCallback((iterationId: string | null) => {
    setSelectedIterationId(iterationId);
    // Opcional: navegar para a semana de início da Sprint
    if (iterationId && iterationsData) {
      const iteration = iterationsData.iterations.find(it => it.id === iterationId);
      if (iteration?.attributes.start_date) {
        setCurrentDate(new Date(iteration.attributes.start_date));
      }
    }
  }, [iterationsData]);

  // Persistir estado de expansão no localStorage
  useEffect(() => {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Navegação de semanas
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleGoToToday = () => setCurrentDate(new Date());

  // Toggle expansão de item
  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Expandir todos os work items
  const expandAll = useCallback(() => {
    if (!timesheet) return;

    const getAllWorkItemIds = (items: WorkItemTimesheet[]): string[] => {
      const ids: string[] = [];
      items.forEach(item => {
        ids.push(item.id.toString());
        if (item.children && item.children.length > 0) {
          ids.push(...getAllWorkItemIds(item.children));
        }
      });
      return ids;
    };

    const allIds = getAllWorkItemIds(timesheet.work_items);
    const newExpandedState: Record<string, boolean> = {};
    allIds.forEach(id => {
      newExpandedState[id] = true;
    });
    console.log('[expandAll] Expandindo', allIds.length, 'work items');
    setExpandedItems(newExpandedState);
  }, [timesheet]);

  // Recolher todos os work items
  const collapseAll = useCallback(() => {
    console.log('[collapseAll] Recolhendo todos os work items');
    setExpandedItems({});
  }, []);

  // Handlers do modal
  const handleNovoApontamento = useCallback((workItemId?: number, workItemTitle?: string, data?: string, podeEditar?: boolean) => {
    setModalMode("create");
    setApontamentoParaEditar(null);
    
    if (workItemId && workItemTitle) {
      setSelectedWorkItem({ id: workItemId, title: workItemTitle, podeEditar: podeEditar ?? true });
      setSelectedDate(data);
    } else {
      setSelectedWorkItem(null);
      setSelectedDate(undefined);
    }
    
    setIsModalOpen(true);
  }, []);

  const handleEditarApontamento = useCallback((
    apontamento: ApontamentoDia, 
    workItemId: number, 
    workItemTitle: string, 
    data: string,
    podeEditar: boolean
  ) => {
    setModalMode("edit");
    setApontamentoParaEditar(apontamento);
    setSelectedWorkItem({ id: workItemId, title: workItemTitle, podeEditar });
    setSelectedDate(data);
    setIsModalOpen(true);
  }, []);

  const handleExcluirApontamento = useCallback((apontamentoId: string, atividadeNome: string, podeExcluir: boolean) => {
    setApontamentoParaExcluir({ id: apontamentoId, nome: atividadeNome, podeExcluir });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWorkItem(null);
    setSelectedDate(undefined);
    setApontamentoParaEditar(null);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setApontamentoParaExcluir(null);
  }, []);

  // Renderização recursiva da hierarquia de Work Items
  const renderWorkItemRow = (item: WorkItemTimesheet, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id.toString()] ?? true; // Expandido por padrão
    const paddingLeft = 24 + (level * 24); // Indentação por nível
    
    // Determinar se é um item "folha" (Task ou Bug) que permite apontamentos diretos
    const isLeafItem = item.type === "Task" || item.type === "Bug";
    const rowOpacity = !item.pode_editar ? "opacity-60" : "";

    return (
      <React.Fragment key={item.id}>
        <tr className={cn(
          "border-b border-[#EDEBE9] transition-colors",
          level === 0 && "bg-[#FAF9F8]",
          level > 0 && "bg-white hover:bg-[#F3F2F1]/50",
          rowOpacity
        )}>
          {/* Coluna Work Item */}
          <td 
            className="p-3 border-r border-[#EDEBE9]"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button 
                  onClick={() => toggleExpand(item.id.toString())} 
                  className="p-1 hover:bg-[#EDEBE9] rounded-sm transition-transform"
                >
                  {isExpanded 
                    ? <ChevronDown size={16} className="text-[#605E5C]" /> 
                    : <ChevronRight size={16} className="text-[#605E5C]" />
                  }
                </button>
              ) : (
                <div className="w-6" /> // Espaçador para alinhar itens sem filhos
              )}
              
              <WorkItemIcon type={item.type} size={18} />

              {isLeafItem ? (
                <WorkItemLink
                  workItemId={item.id}
                  workItemType={item.type}
                  className={cn(
                    "text-[12px] truncate max-w-[200px] inline-flex items-center gap-1",
                    level === 0 && "font-black uppercase tracking-tight",
                    level === 1 && "font-bold uppercase",
                    level === 2 && "font-medium",
                    level >= 3 && "font-medium text-[#605E5C]"
                  )}
                >
                  #{item.id} {item.title}
                </WorkItemLink>
              ) : (
                <span className={cn(
                  "text-[12px] truncate max-w-[200px]",
                  level === 0 && "font-black uppercase tracking-tight",
                  level === 1 && "font-bold uppercase",
                  level === 2 && "font-medium",
                  level >= 3 && "font-medium text-[#605E5C]"
                )}>
                  {item.title}
                </span>
              )}
            </div>
          </td>

          {/* Coluna E (Esforço) - Azul */}
          <td className="p-3 text-center border-r border-[#EDEBE9] text-[#0078D4] font-bold text-[12px]">
            {item.original_estimate != null ? item.original_estimate : ""}
          </td>

          {/* Coluna H (Histórico) - Verde */}
          <td className="p-3 text-center border-r border-[#EDEBE9] text-[#107C10] font-bold text-[12px]">
            {item.total_semana_horas > 0 ? item.total_semana_horas : ""}
          </td>

          {/* Coluna S (Saldo) - Dinâmico: Verde (0), Vermelho (<0), Laranja (>0) */}
          {/* Calcula saldo real: E - completed_work (permite negativos) */}
          {(() => {
            const saldoReal = item.original_estimate != null && item.completed_work != null
              ? Number((item.original_estimate - item.completed_work).toFixed(2))
              : item.remaining_work;
            return (
              <td className={cn(
                "p-3 text-center border-r border-[#EDEBE9] font-bold text-[12px]",
                saldoReal == null && "text-[#605E5C]",
                saldoReal === 0 && "text-[#107C10]",
                saldoReal != null && saldoReal > 0 && "text-[#FF8C00]",
                saldoReal != null && saldoReal < 0 && "text-[#D13438]"
              )}>
                {saldoReal != null ? saldoReal : ""}
              </td>
            );
          })()}

          {/* Células dos 7 dias */}
          {item.dias.map((dia, index) => (
            <td key={index} className="border-r border-[#EDEBE9] text-center p-0 relative">
              {isLeafItem ? (
                <CelulaApontamento
                  celula={dia}
                  workItemId={item.id}
                  workItemTitle={item.title}
                  podeEditar={item.pode_editar}
                  podeExcluir={item.pode_excluir}
                  onNovoApontamento={(wId, wTitle, data) => handleNovoApontamento(wId, wTitle, data, item.pode_editar)}
                  onEditarApontamento={(ap, wId, wTitle, data) => handleEditarApontamento(ap, wId, wTitle, data, item.pode_editar)}
                  onExcluirApontamento={(apId, nome) => handleExcluirApontamento(apId, nome, item.pode_excluir)}
                />
              ) : (
                // Células vazias para níveis pai (Epic, Feature, Story)
                <div className={cn(
                  "w-full h-full py-3",
                  dia.eh_hoje && "bg-[#EFF6FC]/30",
                  dia.eh_fim_semana && "bg-[#F3F2F1]/30"
                )} />
              )}
            </td>
          ))}

          {/* Coluna Semanal Σ */}
          <td className="p-3 text-center bg-[#F3F2F1] font-black text-[#0078D4] text-[13px]">
            {item.total_semana_horas > 0 ? item.total_semana_formatado : ""}
          </td>
        </tr>

        {/* Renderizar filhos se expandido */}
        {hasChildren && isExpanded && item.children.map(child => renderWorkItemRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // Skeleton loading
  const renderSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b border-[#EDEBE9]">
          <td className="p-3 border-r border-[#EDEBE9]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </td>
          <td className="p-3 border-r border-[#EDEBE9]"><Skeleton className="h-4 w-8 mx-auto" /></td>
          <td className="p-3 border-r border-[#EDEBE9]"><Skeleton className="h-4 w-8 mx-auto" /></td>
          <td className="p-3 border-r border-[#EDEBE9]"><Skeleton className="h-4 w-8 mx-auto" /></td>
          {[...Array(7)].map((_, j) => (
            <td key={j} className="p-3 border-r border-[#EDEBE9]"><Skeleton className="h-4 w-10 mx-auto" /></td>
          ))}
          <td className="p-3 bg-[#F3F2F1]"><Skeleton className="h-4 w-12 mx-auto" /></td>
        </tr>
      ))}
    </>
  );

  // Estado de erro
  const renderError = () => (
    <tr>
      <td colSpan={12} className="p-8 text-center">
        <div className="flex flex-col items-center gap-3 text-[#A4262C]">
          <AlertCircle size={48} />
          <p className="text-sm font-semibold">Erro ao carregar dados</p>
          <p className="text-xs text-[#605E5C]">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      </td>
    </tr>
  );

  // Estado vazio
  const renderEmpty = () => (
    <tr>
      <td colSpan={12} className="p-8 text-center">
        <div className="flex flex-col items-center gap-3 text-[#605E5C]">
          <CalendarIcon size={48} className="text-[#C8C6C4]" />
          <p className="text-sm font-semibold">Nenhum Work Item encontrado</p>
          <p className="text-xs">
            Não há Work Items disponíveis para esta semana.
          </p>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex flex-col">
      {/* Clean Header based on Image */}
      <header className="h-16 bg-white border-b border-[#EDEBE9] flex items-center px-6 justify-between shrink-0">
        <h1 className="text-xl font-semibold text-[#201F1E]">Gestão de Apontamentos</h1>
      </header>

      {/* Toolbar / Filters Bar */}
      <div className="h-14 bg-white border-b border-[#EDEBE9] flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleNovoApontamento()}
            variant="azure"
            size="azure"
            className="gap-1.5 font-semibold shadow-sm"
          >
            <Plus size={16} /> Novo Apontamento
          </Button>

          {(showTeamSelector || isLoadingTeams || selectedTeam) && (
            <div className="flex items-center gap-2">
              {showTeamSelector ? (
                <TeamSelector
                  value={selectedTeamId}
                  onChange={handleTeamChange}
                  teams={teams}
                  isLoading={isLoadingTeams}
                  className="w-[260px] h-8 text-xs"
                />
              ) : isLoadingTeams ? (
                <div className="w-[260px] h-8 rounded-sm border border-dashed border-[#C8C6C4] bg-[#F8F8F8] animate-pulse" />
              ) : (
                <div className="flex flex-col justify-center h-10 px-3 py-1 border border-[#EDEBE9] rounded-sm bg-[#FAF9F8]">
                  <span className="text-[10px] uppercase text-[#605E5C] tracking-[0.08em]">Equipe</span>
                  <span className="text-sm font-semibold text-[#201F1E] leading-tight">
                    {selectedTeam?.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Seletor de Sprint */}
          <IterationSelector
            value={selectedIterationId}
            onChange={handleIterationChange}
            iterations={iterationsData?.iterations ?? []}
            isLoading={isLoadingIterations}
            className="w-[260px] h-8 text-xs"
          />
        </div>
        
        <div className="flex items-center gap-3 text-[#605E5C]">
          <Button 
            onClick={handleGoToToday} 
            variant="outline"
            size="azure"
            className="hover:bg-[#F3F2F1] text-[#201F1E] bg-white shadow-sm"
          >
            Hoje
          </Button>
          
          <div className="flex items-center gap-1 ml-1 bg-[#F3F2F1]/50 p-0.5 rounded-sm border border-[#EDEBE9]">
            <Button 
              onClick={handlePrevWeek}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-white hover:shadow-sm text-[#201F1E]"
              title="Semana Anterior"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="h-4 w-[1px] bg-[#EDEBE9] mx-0.5" />
            <Button 
              onClick={handleNextWeek}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-white hover:shadow-sm text-[#201F1E]"
              title="Próxima Semana"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          
          <span className="font-semibold text-[#201F1E] flex items-center gap-2 text-xs border border-[#EDEBE9] px-3 py-1.5 rounded-sm bg-white shadow-sm ml-1">
            <CalendarIcon size={14} className="text-[#0078D4]" />
            {timesheet?.semana_label || `${format(weekStart, "dd/MM")} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), "dd/MM")}`}
          </span>

          {/* Botões de Expandir/Recolher Todos */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              title="Expandir todos os work items"
              className="gap-1 text-xs h-7 px-2"
              disabled={!timesheet || timesheet.work_items.length === 0}
            >
              <ChevronsDown size={14} />
              Expandir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              title="Recolher todos os work items"
              className="gap-1 text-xs h-7 px-2"
              disabled={!timesheet || timesheet.work_items.length === 0}
            >
              <ChevronsUp size={14} />
              Recolher Todos
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6 bg-[#F8F9FA]">
        <div className="bg-white border border-[#EDEBE9] rounded-sm shadow-md overflow-hidden relative">
          {/* Overlay de loading quando está buscando dados (refresh/mudança de sprint) */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-lg shadow-lg border border-[#EDEBE9]">
                <Loader2 size={32} className="animate-spin text-[#0078D4]" />
                <span className="text-sm font-medium text-[#605E5C]">Carregando Work Items...</span>
              </div>
            </div>
          )}
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#FAF9F8] border-b-2 border-[#EDEBE9] sticky top-0 z-10">
              <tr>
                <th className="p-3 font-bold text-[#605E5C] border-r border-[#EDEBE9] min-w-[240px] max-w-[300px] uppercase tracking-wider">
                  Escopo de Trabalho
                </th>
                <th className="w-12 p-3 border-r border-[#EDEBE9] text-center" title="Esforço - Estimativa Original (Original Estimate)">
                  <div className="w-6 h-6 mx-auto border-2 border-[#0078D4] rounded-full flex items-center justify-center text-[10px] text-[#0078D4] font-black">E</div>
                </th>
                <th className="w-12 p-3 border-r border-[#EDEBE9] text-center" title="Histórico - Trabalho Completado (Completed Work)">
                  <div className="w-6 h-6 mx-auto border-2 border-[#107C10] rounded-full flex items-center justify-center text-[10px] text-[#107C10] font-black">H</div>
                </th>
                <th className="w-12 p-3 border-r border-[#EDEBE9] text-center" title="Saldo - Trabalho Restante (Remaining Work)">
                  <div className="w-6 h-6 mx-auto border-2 border-[#FF8C00] rounded-full flex items-center justify-center text-[10px] text-[#FF8C00] font-black">S</div>
                </th>
                {(timesheet?.totais_por_dia || []).length > 0 
                  ? timesheet!.totais_por_dia.map((dia, i) => (
                      <th key={i} className={cn(
                        "p-3 font-bold text-center border-r border-[#EDEBE9] min-w-[70px] flex-1 transition-colors", 
                        dia.eh_hoje && "bg-[#EFF6FC] text-[#0078D4]"
                      )}>
                        <div className="uppercase text-[10px] opacity-70 mb-1">{dia.dia_semana}</div>
                        <div className="text-sm">{dia.dia_numero}</div>
                      </th>
                    ))
                  : [...Array(7)].map((_, i) => {
                      const day = new Date(weekStart);
                      day.setDate(day.getDate() + i);
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <th key={i} className={cn(
                          "p-3 font-bold text-center border-r border-[#EDEBE9] min-w-[70px] flex-1 transition-colors", 
                          isToday && "bg-[#EFF6FC] text-[#0078D4]"
                        )}>
                          <div className="uppercase text-[10px] opacity-70 mb-1">
                            {format(day, "eee", { locale: ptBR })}
                          </div>
                          <div className="text-sm">{format(day, "dd")}</div>
                        </th>
                      );
                    })
                }
                <th className="p-3 font-bold text-center text-[#201F1E] w-28 bg-[#F3F2F1] uppercase tracking-wider">
                  Semanal Σ
                </th>
              </tr>
            </thead>
            <tbody>
              {isTableLoading && renderSkeleton()}
              {!isTableLoading && isError && renderError()}
              {!isTableLoading && !isError && !hasTimesheetData && renderEmpty()}
              {!isTableLoading && !isError && hasTimesheetData && timesheet?.work_items.map(item => renderWorkItemRow(item))}
            </tbody>
            <tfoot className="bg-[#FAF9F8] font-black border-t-4 border-[#EDEBE9] text-[12px]">
              <tr>
                <td className="p-4 border-r border-[#EDEBE9] font-black uppercase tracking-widest text-[#605E5C]">
                  TOTAL GERAL
                </td>
                <td className="p-4 text-center border-r border-[#EDEBE9] bg-[#F3F2F1] font-black text-[#0078D4]">
                  {timesheet?.total_esforco || ""}
                </td>
                <td className="p-4 text-center border-r border-[#EDEBE9] bg-[#F3F2F1] font-black text-[#107C10]">
                  {timesheet?.total_historico || ""}
                </td>
                <td className="p-4 text-center border-r border-[#EDEBE9] bg-[#F3F2F1] font-black text-[#FF8C00]">
                  {/* Saldo não tem total */}
                </td>
                {(timesheet?.totais_por_dia || [...Array(7)]).map((dia, i) => (
                  <td key={i} className="p-4 text-center border-r border-[#EDEBE9] text-[#201F1E]">
                    {typeof dia === 'object' && dia.total_horas > 0 ? dia.total_formatado : ""}
                  </td>
                ))}
                <td className="p-4 text-center bg-[#F3F2F1] text-[#0078D4] font-black text-sm">
                  {timesheet?.total_geral_formatado || ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center text-[10px] text-[#A19F9D] uppercase tracking-tighter">
          <div>© 2026 - CESOP - Gestão de Projetos</div>
          <div>Total de {timesheet?.total_work_items || 0} atividades listadas</div>
        </div>
      </main>

      {/* Modal de Apontamento */}
      <ModalAdicionarTempo 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        taskId={selectedWorkItem?.id.toString()}
        taskTitle={selectedWorkItem?.title}
        organizationName={organization}
        projectId={effectiveProjectId}
        mode={modalMode}
        apontamentoParaEditar={apontamentoParaEditar}
        dataApontamento={selectedDate}
        podeEditar={selectedWorkItem?.podeEditar ?? true}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <DialogConfirmarExclusao
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        apontamentoId={apontamentoParaExcluir?.id || null}
        atividadeNome={apontamentoParaExcluir?.nome}
        podeExcluir={apontamentoParaExcluir?.podeExcluir ?? false}
      />
    </div>
  );
}
