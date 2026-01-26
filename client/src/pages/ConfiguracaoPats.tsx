/**
 * Página de Configuração de PATs de Organizações
 * Permite cadastrar e gerenciar PATs para múltiplas organizações Azure DevOps
 */

import React, { useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layouts";
import {
  ADOInput,
  ADOTable,
  ADOCard,
  ADOButton,
  ADOModal,
} from "@/components/ado";
import type { ADOTableColumn } from "@/components/ado";

import {
  useOrganizationPats,
  useCriarOrganizationPat,
  useAtualizarOrganizationPat,
  useExcluirOrganizationPat,
  useValidarPatArmazenado,
  useTogglePatAtivo,
  type OrganizationPat,
} from "@/hooks/use-organization-pats";

// --- Form Data Interface ---

interface PatFormData {
  organization_name: string;
  pat: string;
  organization_url: string;
  descricao: string;
  expira_em: string;
}

const emptyFormData: PatFormData = {
  organization_name: "",
  pat: "",
  organization_url: "",
  descricao: "",
  expira_em: "",
};

// --- Column Definitions ---

const columns: ADOTableColumn<OrganizationPat>[] = [
  {
    key: "organization_name",
    header: "Organização",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-ado-blue" />
        <div>
          <span className="font-medium">{row.organization_name}</span>
          {row.organization_url && (
            <p className="text-xs text-ado-text-secondary truncate max-w-xs">
              {row.organization_url}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "pat_masked",
    header: "PAT",
    render: (row) => (
      <code className="text-xs bg-ado-bg px-2 py-1 rounded font-mono">
        {row.pat_masked || "***"}
      </code>
    ),
  },
  {
    key: "ativo",
    header: "Status",
    render: (row) => (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          row.ativo
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {row.ativo ? (
          <>
            <CheckCircle2 className="w-3 h-3" /> Ativo
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3" /> Inativo
          </>
        )}
      </span>
    ),
  },
  {
    key: "expira_em",
    header: "Expira em",
    render: (row) => {
      if (!row.expira_em) return "-";
      const date = new Date(row.expira_em);
      const now = new Date();
      const isExpired = date < now;
      const isExpiringSoon = date < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return (
        <span
          className={`text-sm ${
            isExpired
              ? "text-red-600 font-medium"
              : isExpiringSoon
              ? "text-orange-600"
              : "text-ado-text"
          }`}
        >
          {date.toLocaleDateString("pt-BR")}
          {isExpired && " (Expirado)"}
        </span>
      );
    },
  },
  {
    key: "descricao",
    header: "Descrição",
    render: (row) => (
      <span className="text-sm text-ado-text-secondary truncate max-w-xs block">
        {row.descricao || "-"}
      </span>
    ),
  },
];

// --- Main Page Component ---

export function ConfiguracaoPats() {
  const { toast } = useToast();

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPat, setSelectedPat] = useState<OrganizationPat | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<PatFormData>(emptyFormData);
  const [showPat, setShowPat] = useState(false);
  const [validateFirst, setValidateFirst] = useState(true);

  // Queries & Mutations
  const { data, isLoading, error, refetch } = useOrganizationPats();
  const criarMutation = useCriarOrganizationPat();
  const atualizarMutation = useAtualizarOrganizationPat();
  const excluirMutation = useExcluirOrganizationPat();
  const validarMutation = useValidarPatArmazenado();
  const toggleMutation = useTogglePatAtivo();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isFormOpen && selectedPat && formMode === "edit") {
      setFormData({
        organization_name: selectedPat.organization_name,
        pat: "",
        organization_url: selectedPat.organization_url || "",
        descricao: selectedPat.descricao || "",
        expira_em: selectedPat.expira_em
          ? new Date(selectedPat.expira_em).toISOString().split("T")[0]
          : "",
      });
    } else if (isFormOpen && formMode === "create") {
      setFormData(emptyFormData);
    }
  }, [isFormOpen, selectedPat, formMode]);

  // Handlers
  const handleCreate = () => {
    setSelectedPat(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEdit = (pat: OrganizationPat) => {
    setSelectedPat(pat);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDelete = (pat: OrganizationPat) => {
    setSelectedPat(pat);
    setIsDeleteOpen(true);
  };

  const handleValidate = async (pat: OrganizationPat) => {
    try {
      const result = await validarMutation.mutateAsync(pat.id);
      if (result.valid) {
        toast({
          title: "PAT Válido",
          description: `${result.projects_count} projeto(s) encontrado(s): ${result.projects?.join(", ")}`,
        });
      } else {
        toast({
          title: "PAT Inválido",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível validar o PAT",
        variant: "destructive",
      });
    }
  };

  const handleToggleAtivo = async (pat: OrganizationPat) => {
    try {
      await toggleMutation.mutateAsync(pat.id);
      toast({
        title: "Status Alterado",
        description: `PAT ${pat.ativo ? "desativado" : "ativado"} com sucesso`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async () => {
    try {
      // Converte data para datetime ISO (input date retorna YYYY-MM-DD, backend espera datetime)
      const expiraEmDatetime = formData.expira_em
        ? new Date(formData.expira_em + "T23:59:59").toISOString()
        : undefined;

      if (formMode === "create") {
        await criarMutation.mutateAsync({
          organization_name: formData.organization_name,
          pat: formData.pat,
          organization_url: formData.organization_url || undefined,
          descricao: formData.descricao || undefined,
          expira_em: expiraEmDatetime,
          validate_first: validateFirst,
        });
        toast({
          title: "PAT Criado",
          description: `PAT para ${formData.organization_name} cadastrado com sucesso`,
        });
      } else if (selectedPat) {
        await atualizarMutation.mutateAsync({
          id: selectedPat.id,
          data: {
            organization_url: formData.organization_url || undefined,
            pat: formData.pat || undefined,
            descricao: formData.descricao || undefined,
            expira_em: expiraEmDatetime,
          },
        });
        toast({
          title: "PAT Atualizado",
          description: `PAT para ${formData.organization_name} atualizado com sucesso`,
        });
      }
      setIsFormOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar PAT";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPat) return;
    try {
      await excluirMutation.mutateAsync(selectedPat.id);
      toast({
        title: "PAT Excluído",
        description: `PAT para ${selectedPat.organization_name} removido com sucesso`,
      });
      setIsDeleteOpen(false);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o PAT",
        variant: "destructive",
      });
    }
  };

  // Actions column
  const actionsColumn: ADOTableColumn<OrganizationPat> = {
    key: "actions",
    header: "Ações",
    render: (row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleValidate(row)}
          className="p-1.5 text-ado-blue hover:bg-ado-hover rounded"
          title="Validar PAT"
          disabled={validarMutation.isPending}
        >
          {validarMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => handleToggleAtivo(row)}
          className={`p-1.5 rounded ${
            row.ativo
              ? "text-orange-600 hover:bg-orange-50"
              : "text-green-600 hover:bg-green-50"
          }`}
          title={row.ativo ? "Desativar" : "Ativar"}
        >
          {row.ativo ? (
            <XCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => handleEdit(row)}
          className="p-1.5 text-ado-text-secondary hover:bg-ado-hover rounded"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(row)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  };

  // Form content for modal
  const formContent = (
    <div className="space-y-4">
      <ADOInput
        label="Nome da Organização"
        value={formData.organization_name}
        onChange={(e) =>
          setFormData({ ...formData, organization_name: e.target.value })
        }
        placeholder="ex: sefaz-ceara"
        disabled={formMode === "edit"}
        required
      />

      <div className="relative">
        <ADOInput
          label={formMode === "create" ? "PAT" : "Novo PAT (deixe vazio para manter)"}
          value={formData.pat}
          onChange={(e) => setFormData({ ...formData, pat: e.target.value })}
          placeholder="Cole o Personal Access Token aqui"
          type={showPat ? "text" : "password"}
          required={formMode === "create"}
        />
        <button
          type="button"
          className="absolute right-2 top-8 p-1 text-ado-text-secondary hover:text-ado-text"
          onClick={() => setShowPat(!showPat)}
        >
          {showPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <ADOInput
        label="URL da Organização"
        value={formData.organization_url}
        onChange={(e) =>
          setFormData({ ...formData, organization_url: e.target.value })
        }
        placeholder="https://dev.azure.com/sua-org (automático se vazio)"
      />

      <ADOInput
        label="Data de Expiração"
        value={formData.expira_em}
        onChange={(e) =>
          setFormData({ ...formData, expira_em: e.target.value })
        }
        type="date"
      />

      <ADOInput
        label="Descrição"
        value={formData.descricao}
        onChange={(e) =>
          setFormData({ ...formData, descricao: e.target.value })
        }
        placeholder="Observações sobre este PAT"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="validateFirst"
          checked={validateFirst}
          onChange={(e) => setValidateFirst(e.target.checked)}
          className="rounded border-ado-border"
        />
        <label htmlFor="validateFirst" className="text-sm text-ado-text">
          Validar PAT antes de salvar
        </label>
      </div>
    </div>
  );

  return (
    <PageLayout title="Configuração de PATs">
      <div className="space-y-4">
        {/* Header with buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ado-text">PATs de Organizações</h2>
            <p className="text-sm text-ado-text-secondary">
              Gerencie os Personal Access Tokens para cada organização Azure DevOps
            </p>
          </div>
          <div className="flex gap-2">
            <ADOButton onClick={() => refetch()} variant="secondary">
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </ADOButton>
            <ADOButton onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Novo PAT
            </ADOButton>
          </div>
        </div>

        {/* Info Card */}
        <ADOCard className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Cada organização Azure DevOps precisa de um PAT próprio</li>
                <li>
                  O PAT deve ter permissões: <code className="bg-blue-100 px-1 rounded">Work Items (Read & Write)</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">Code (Read)</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">Project and Team (Read)</code>
                </li>
                <li>
                  Crie PATs em:{" "}
                  <a
                    href="https://dev.azure.com/_usersSettings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Azure DevOps User Settings
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </ADOCard>

        {/* Error State */}
        {error && (
          <ADOCard className="bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Erro ao carregar PATs: {error.message}</span>
            </div>
          </ADOCard>
        )}

        {/* Table */}
        <ADOCard>
          <ADOTable
            data={data?.items || []}
            columns={[...columns, actionsColumn]}
            isLoading={isLoading}
            emptyText="Nenhum PAT cadastrado. Clique em 'Novo PAT' para começar."
            rowKey="id"
            showActions={false}
          />
        </ADOCard>

        {/* Form Modal */}
        <ADOModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={formMode === "create" ? "Novo PAT de Organização" : "Editar PAT"}
          description={formMode === "create" 
            ? "Cadastre um novo PAT para uma organização Azure DevOps"
            : "Atualize as informações do PAT"}
          isLoading={criarMutation.isPending || atualizarMutation.isPending}
          onConfirm={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          confirmText={formMode === "create" ? "Criar PAT" : "Salvar"}
          confirmDisabled={formMode === "create" && (!formData.organization_name || !formData.pat)}
        >
          {formContent}
        </ADOModal>

        {/* Delete Confirmation Modal */}
        <ADOModal
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja excluir o PAT da organização ${selectedPat?.organization_name}?`}
          isLoading={excluirMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteOpen(false)}
          confirmText="Excluir"
          confirmVariant="danger"
        >
          <p className="text-sm text-ado-text-secondary">
            Esta ação não pode ser desfeita. Os work items desta organização não
            serão mais carregados.
          </p>
        </ADOModal>
      </div>
    </PageLayout>
  );
}

export default ConfiguracaoPats;
