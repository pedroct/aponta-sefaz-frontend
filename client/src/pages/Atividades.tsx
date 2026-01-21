/**
 * Página de Gestão de Atividades
 * CRUD completo - Migrado de fe-aponta-gestao
 */

import React, { useState } from "react";
import { Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layouts";
import {
  ADOInput,
  ADOMultiSelect,
  ADOTable,
  ADOToolbar,
  ADOCard,
  ADOButton,
  ADOModal,
} from "@/components/ado";
import type { ADOTableColumn } from "@/components/ado";

// Hooks da API
import {
  useAtividades,
  useCriarAtividade,
  useAtualizarAtividade,
  useExcluirAtividade,
  type Atividade,
} from "@/hooks/use-atividades";
import { useProjetos, useSincronizarProjetos } from "@/hooks/use-projetos";
import { useAzureContext } from "@/contexts/AzureDevOpsContext";

// --- Column Definitions ---

const columns: ADOTableColumn<Atividade>[] = [
  {
    key: "nome",
    header: "Atividade",
    render: (row) => (
      <div>
        <span className="font-medium">{row.nome}</span>
        {row.descricao && (
          <p className="text-xs text-[#605E5C] mt-0.5 truncate max-w-xs">
            {row.descricao}
          </p>
        )}
      </div>
    )
  },
  {
    key: "projetos",
    header: "Projetos",
    render: (row) => {
      const projetos = row.projetos || [];
      if (projetos.length === 0) return "-";
      if (projetos.length === 1) return projetos[0].nome;
      return (
        <div className="flex flex-wrap gap-1">
          {projetos.slice(0, 2).map((p) => (
            <span
              key={p.id}
              className="inline-block px-1.5 py-0.5 bg-[#EDEBE9] text-[#201F1E] text-xs rounded"
            >
              {p.nome}
            </span>
          ))}
          {projetos.length > 2 && (
            <span
              className="inline-block px-1.5 py-0.5 bg-[#0078D4] text-white text-xs rounded"
              title={projetos.slice(2).map((p) => p.nome).join(", ")}
            >
              +{projetos.length - 2}
            </span>
          )}
        </div>
      );
    }
  },
  {
    key: "ativo",
    header: "Situação",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            row.ativo ? "bg-green-600" : "bg-gray-400"
          }`}
        />
        <span>{row.ativo ? "Ativo" : "Inativo"}</span>
      </div>
    )
  },
  {
    key: "criado_por",
    header: "Criado por",
    render: (row) => {
      const nome = row.criado_por || "Desconhecido";
      const inicial = nome.charAt(0).toUpperCase();
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-xs">
            {inicial}
          </div>
          <span className="truncate max-w-[150px]" title={nome}>
            {nome}
          </span>
        </div>
      );
    }
  }
];

// --- Page Component ---

export default function Atividades() {
  const { toast } = useToast();
  const { isLoading: isContextLoading, token } = useAzureContext();
  
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado do modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Atividade | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProjectIds, setEditProjectIds] = useState<string[]>([]);
  const [editAtivo, setEditAtivo] = useState(true);

  // Estado do modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Atividade | null>(null);

  // Queries
  const {
    data: atividadesData,
    isLoading: isLoadingAtividades,
    error: errorAtividades,
    refetch: refetchAtividades
  } = useAtividades();

  const {
    data: projetosData,
    isLoading: isLoadingProjetos
  } = useProjetos();

  // Mutations
  const criarAtividade = useCriarAtividade();
  const atualizarAtividade = useAtualizarAtividade();
  const excluirAtividade = useExcluirAtividade();
  const sincronizarProjetos = useSincronizarProjetos();

  // Dados
  const atividades = atividadesData?.items ?? [];
  const projetos = projetosData?.items ?? [];

  // Opções de projetos para o multi-select
  const projectOptions = projetos.map((p) => ({ value: p.id, label: p.nome }));

  // Filtro de busca local
  const atividadesFiltradas = searchTerm
    ? atividades.filter((a) =>
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.projetos?.some((p) => p.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        a.criado_por?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : atividades;

  // Handlers
  const handleSave = async () => {
    if (!activityName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome da atividade.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProjectIds.length === 0) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione pelo menos um projeto.",
        variant: "destructive",
      });
      return;
    }

    try {
      await criarAtividade.mutateAsync({
        nome: activityName.trim(),
        descricao: activityDescription.trim() || undefined,
        ids_projetos: selectedProjectIds,
        ativo: true,
      });

      toast({
        title: "Sucesso",
        description: "Atividade criada com sucesso!",
      });

      // Limpa o formulário
      setActivityName("");
      setActivityDescription("");
      setSelectedProjectIds([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: "Erro ao criar atividade",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (row: Atividade) => {
    setEditingActivity(row);
    setEditName(row.nome);
    setEditDescription(row.descricao || "");
    setEditProjectIds(row.projetos?.map((p) => p.id) || []);
    setEditAtivo(row.ativo);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingActivity) return;

    if (!editName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome da atividade.",
        variant: "destructive",
      });
      return;
    }

    if (editProjectIds.length === 0) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione pelo menos um projeto.",
        variant: "destructive",
      });
      return;
    }

    try {
      await atualizarAtividade.mutateAsync({
        id: editingActivity.id,
        data: {
          nome: editName.trim(),
          descricao: editDescription.trim() || undefined,
          ids_projetos: editProjectIds,
          ativo: editAtivo,
        },
      });

      toast({
        title: "Sucesso",
        description: "Atividade atualizada com sucesso!",
      });

      setEditModalOpen(false);
      setEditingActivity(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: "Erro ao atualizar atividade",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditingActivity(null);
  };

  const handleDelete = (row: Atividade) => {
    setDeletingActivity(row);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingActivity) return;

    try {
      await excluirAtividade.mutateAsync(deletingActivity.id);
      toast({
        title: "Sucesso",
        description: `Atividade "${deletingActivity.nome}" excluída.`,
      });
      setDeleteModalOpen(false);
      setDeletingActivity(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: "Erro ao excluir atividade",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeletingActivity(null);
  };

  // --- Header Form ---
  const headerForm = (
    <div className="flex flex-row gap-4 w-full max-w-5xl pb-1">
      <div className="flex-1">
        <ADOInput
          label="Nome da atividade"
          placeholder="Digite o nome da atividade"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          disabled={criarAtividade.isPending}
        />
      </div>
      <div className="w-44">
        <ADOInput
          label="Descrição"
          placeholder="Descrição (opcional)"
          value={activityDescription}
          onChange={(e) => setActivityDescription(e.target.value.slice(0, 50))}
          disabled={criarAtividade.isPending}
          maxLength={50}
        />
      </div>
      <div className="w-72">
        <ADOMultiSelect
          label="Projetos"
          options={projectOptions}
          placeholder={isLoadingProjetos ? "Carregando..." : "Selecione projetos"}
          value={selectedProjectIds}
          onChange={setSelectedProjectIds}
          disabled={criarAtividade.isPending}
        />
      </div>
      <div className="flex items-end pb-0.5">
        <button
          type="button"
          onClick={async () => {
            try {
              const result = await sincronizarProjetos.mutateAsync();
              toast({
                title: "Sincronização concluída",
                description: result.message || "Projetos sincronizados com sucesso!",
              });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Erro ao sincronizar";
              toast({
                title: "Erro na sincronização",
                description: message,
                variant: "destructive",
              });
            }
          }}
          disabled={sincronizarProjetos.isPending}
          className="p-2 rounded hover:bg-[#EDEBE9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sincronizar projetos do Azure DevOps"
        >
          <RefreshCw
            className={`w-5 h-5 text-[#0078D4] ${sincronizarProjetos.isPending ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      <div className="flex items-end pb-0.5">
        <ADOButton
          onClick={handleSave}
          icon={
            criarAtividade.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )
          }
          disabled={criarAtividade.isPending}
        >
          {criarAtividade.isPending ? "Salvando..." : "Salvar"}
        </ADOButton>
      </div>
    </div>
  );

  // --- Loading State (contexto Azure) ---
  if (isContextLoading) {
    return (
      <PageLayout title="Gestão de Atividades" headerContent={headerForm}>
        <ADOCard>
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
            <span className="text-sm text-[#605E5C]">Carregando...</span>
          </div>
        </ADOCard>
      </PageLayout>
    );
  }

  // --- Auth Check ---
  if (!token) {
    return (
      <PageLayout title="Gestão de Atividades" headerContent={headerForm}>
        <ADOCard>
          <div className="p-8 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-[#D83B01]" />
            <div className="text-center">
              <h3 className="font-semibold text-[#201F1E]">Autenticação Necessária</h3>
              <p className="text-sm text-[#605E5C] mt-1">
                Esta página requer autenticação via Azure DevOps.
              </p>
            </div>
          </div>
        </ADOCard>
      </PageLayout>
    );
  }

  // --- Error State ---
  if (errorAtividades) {
    return (
      <PageLayout title="Gestão de Atividades" headerContent={headerForm}>
        <ADOCard>
          <div className="p-8 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-center">
              <h3 className="font-semibold text-[#201F1E]">Erro ao carregar atividades</h3>
              <p className="text-sm text-[#605E5C] mt-1">
                {errorAtividades instanceof Error ? errorAtividades.message : "Não foi possível conectar com a API."}
              </p>
            </div>
            <ADOButton
              variant="secondary"
              onClick={() => refetchAtividades()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Tentar novamente
            </ADOButton>
          </div>
        </ADOCard>
      </PageLayout>
    );
  }

  // --- Main Render ---
  return (
    <PageLayout title="Gestão de Atividades" headerContent={headerForm}>
      <ADOCard>
        <ADOToolbar
          searchPlaceholder="Pesquisar atividades..."
          onSearch={setSearchTerm}
        />

        {isLoadingAtividades ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
            <span className="text-sm text-[#605E5C]">Carregando atividades...</span>
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#605E5C]">
              {searchTerm
                ? `Nenhuma atividade encontrada para "${searchTerm}".`
                : "Nenhuma atividade cadastrada. Crie a primeira acima!"}
            </p>
          </div>
        ) : (
          <ADOTable
            data={atividadesFiltradas}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            rowKey="id"
          />
        )}

        {/* Footer com total */}
        {!isLoadingAtividades && atividadesData && (
          <div className="px-4 py-2 border-t border-[#EAEAEA] text-xs text-[#605E5C]">
            {searchTerm ? (
              <>
                Exibindo {atividadesFiltradas.length} de {atividadesData.total} atividades
              </>
            ) : (
              <>Total: {atividadesData.total} atividades</>
            )}
          </div>
        )}
      </ADOCard>

      {/* Modal de Edição */}
      <ADOModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Editar Atividade"
        onConfirm={handleEditSave}
        onCancel={handleEditCancel}
        isLoading={atualizarAtividade.isPending}
        confirmText="Salvar"
        cancelText="Cancelar"
      >
        <div className="flex flex-col gap-4">
          <ADOInput
            label="Nome da atividade"
            placeholder="Digite o nome da atividade"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={atualizarAtividade.isPending}
          />
          <ADOInput
            label="Descrição"
            placeholder="Descrição (opcional)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value.slice(0, 50))}
            disabled={atualizarAtividade.isPending}
            maxLength={50}
          />
          <ADOMultiSelect
            label="Projetos"
            options={projectOptions}
            placeholder={isLoadingProjetos ? "Carregando..." : "Selecione projetos"}
            value={editProjectIds}
            onChange={setEditProjectIds}
            disabled={atualizarAtividade.isPending}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-ativo"
              checked={editAtivo}
              onChange={(e) => setEditAtivo(e.target.checked)}
              className="w-4 h-4 text-[#0078D4] border-[#8A8886] rounded focus:ring-[#0078D4]"
              disabled={atualizarAtividade.isPending}
            />
            <label htmlFor="edit-ativo" className="text-sm text-[#323130]">
              Atividade ativa
            </label>
          </div>
        </div>
      </ADOModal>

      {/* Modal de Confirmação de Exclusão */}
      <ADOModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Excluir Atividade"
        description={`Deseja realmente excluir a atividade "${deletingActivity?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={excluirAtividade.isPending}
        confirmText="Sim"
        cancelText="Não"
        confirmVariant="danger"
      >
        <div className="text-sm text-[#605E5C]">
          <p>
            A atividade <strong className="text-[#323130]">{deletingActivity?.nome}</strong> será
            removida permanentemente do sistema.
          </p>
        </div>
      </ADOModal>
    </PageLayout>
  );
}
