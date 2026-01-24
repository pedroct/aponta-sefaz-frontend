Análise do Código
ApontarPopup.tsx
Propósito: Página que renderiza o modal de apontamento diretamente quando acessada via popup do Work Item Form Group do Azure DevOps.

Funcionamento:

Extrai parâmetros da URL hash (formato: /#/apontar?workItemId=123&workItemTitle=...)
Armazena o token e contexto do Azure DevOps no localStorage
Renderiza o ModalAdicionarTempo com os parâmetros extraídos
Possui estados de erro e carregamento
Função handleClose tenta fechar a janela popup ou redireciona para home
Parâmetros esperados:

workItemId, workItemTitle, organization, project, projectId, token
ModalAdicionarTempo.tsx
Propósito: Modal reutilizável para criar ou editar apontamentos de tempo.

Funcionalidades principais:

Dois modos: create (novo apontamento) e edit (editar existente)
Campo de busca de tarefas com autocomplete (desabilitado quando taskId é pré-definido)
Seletor de data com calendário
Campo de duração com presets (+0.25h, +0.5h, +1h, +2h, +4h)
Limite: mínimo 00:15, máximo 08:00
Seletor de tipo de atividade (obrigatório)
Campo de comentário (opcional)
Validação: requer tarefa, data, duração > 0 e tipo de atividade
Aviso de bloqueio para Work Items em estado Completed/Removed
Props principais:

Prop	Descrição
isOpen	Controla visibilidade
taskId/taskTitle	Work Item pré-selecionado
organizationName/projectId	Contexto Azure DevOps
mode	"create" ou "edit"
apontamentoParaEditar	Dados para edição
podeEditar	Bloqueia edição se false
