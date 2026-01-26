# Aponta — Apontamento de Horas para Azure DevOps

![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Plataforma](https://img.shields.io/badge/plataforma-Azure%20DevOps-0078D4)

## 📋 Sobre a Extensão

O **Aponta** é uma extensão para Azure DevOps que permite registrar, gerenciar e acompanhar o tempo investido em tarefas de projetos de engenharia de software. Com uma interface intuitiva integrada diretamente ao Azure DevOps, você pode lançar horas de trabalho sem sair do ambiente que já utiliza.

---

## ✨ Funcionalidades Principais

### 1. 📊 Folha de Horas (Timesheet)

A **Folha de Horas** é a funcionalidade central da extensão, oferecendo uma visão completa do tempo investido ao longo da semana.

**O que você pode fazer:**

- **Visualizar a semana completa**: Grade semanal mostrando todos os dias (segunda a domingo)
- **Hierarquia de Work Items**: Visualize suas tarefas organizadas em árvore (Epic → Feature → User Story → Task/Bug)
- **Expandir e colapsar níveis**: Navegue facilmente pela hierarquia de trabalho
- **Totais automáticos**: Veja o total de horas por dia, por semana e por item de trabalho
- **Navegar entre semanas**: Avance ou retorne para visualizar períodos anteriores ou futuros
- **Identificação visual**: Células coloridas indicam dias com apontamentos registrados

**Colunas da grade:**

| Coluna | Descrição |
|--------|-----------|
| **E** (Esforço) | Horas planejadas/estimadas para o item |
| **H** (Histórico) | Total de horas apontadas na semana |
| **S** (Saldo) | Diferença entre o estimado e o realizado |
| **Seg a Dom** | Horas apontadas em cada dia da semana |

---

### 2. ⏱️ Registro de Apontamento

O formulário de apontamento permite registrar suas horas de trabalho de forma rápida e prática.

**Campos disponíveis:**

| Campo | Descrição | Obrigatório |
|-------|-----------|:-----------:|
| **Usuário** | Identificação automática do usuário logado | ✅ |
| **Tarefa** | Busca por ID ou título do Work Item | ✅ |
| **Data** | Data em que o trabalho foi realizado | ✅ |
| **Duração** | Tempo trabalhado (formato HH:mm) | ✅ |
| **Tipo de Atividade** | Categoria do trabalho (ex: Desenvolvimento, Reunião) | ✅ |
| **Comentário** | Descrição opcional do trabalho realizado | ❌ |

**Atalhos de duração:**
- `+0.25h` (15 minutos)
- `+0.5h` (30 minutos)
- `+1h` (1 hora)
- `+2h` (2 horas)
- `+4h` (4 horas)

---

### 3. 📁 Gestão de Atividades

Gerencie os tipos de atividades que podem ser utilizados nos apontamentos.

**O que você pode fazer:**

- **Criar atividades**: Adicione novos tipos de atividade (ex: Desenvolvimento, Documentação, Review, Reunião)
- **Editar atividades**: Altere nome, descrição e projetos associados
- **Ativar/Desativar**: Controle quais atividades estão disponíveis para uso
- **Associar a projetos**: Vincule atividades a projetos específicos

---

### 4. 🔗 Integração com Work Items

Registre horas diretamente na página de um Work Item (Task ou Bug).

**Como funciona:**

1. Abra qualquer Task ou Bug no Azure DevOps
2. Na seção **"Apontamentos"** no painel lateral, clique em **"Apontar Tempo"**
3. Preencha o formulário com a duração e tipo de atividade
4. O apontamento é salvo e o Work Item é atualizado automaticamente

**Atualização automática no Azure DevOps:**
- O campo **Completed Work** (Trabalho Concluído) é incrementado
- O campo **Remaining Work** (Trabalho Restante) é decrementado
- Os valores são sincronizados em tempo real

---

## 📏 Regras de Negócio

Para garantir a integridade e consistência dos dados, as seguintes regras são aplicadas:

### Validações de Entrada

| Regra | Descrição |
|-------|-----------|
| **Duração mínima** | 15 minutos (00:15) por apontamento |
| **Duração máxima** | 8 horas (08:00) por apontamento |
| **Horas negativas** | Não permitido |
| **Data futura** | Não é possível apontar em datas futuras |
| **Data limite** | Máximo de 30 dias no passado |
| **Tarefa obrigatória** | Todo apontamento deve estar vinculado a um Work Item |

### Regras de Sincronização com Azure DevOps

| Regra | Descrição |
|-------|-----------|
| **Apenas Task/Bug** | Somente itens do tipo Task ou Bug são atualizados diretamente no Azure DevOps |
| **Remaining Work** | Nunca fica negativo (valor mínimo é zero) |
| **Completed Work** | Acumula as horas registradas |
| **Totais hierárquicos** | Epics, Features e User Stories exibem a soma dos filhos |

### Permissões de Edição/Exclusão

| Estado do Work Item | Pode Editar | Pode Excluir |
|---------------------|:-----------:|:------------:|
| **Proposed** (Novo) | ✅ | ✅ |
| **InProgress** (Em Andamento) | ✅ | ✅ |
| **Resolved** (Resolvido) | ✅ | ✅ |
| **Completed** (Concluído) | ❌ | ❌ |
| **Removed** (Removido) | ❌ | ❌ |

> ⚠️ **Importante**: Work Items com estado "Completed" ou "Removed" não permitem edição ou exclusão de apontamentos.

---

## 🖥️ Acesso à Extensão

Após a instalação, a extensão estará disponível em:

1. **Menu lateral do projeto** → **Apontamentos**
   - Folha de Horas
   - Gestão de Atividades

2. **Formulário de Work Item** → Painel **"Apontamentos"**

---

## 🔐 Permissões Necessárias

A extensão solicita as seguintes permissões:

| Permissão | Uso |
|-----------|-----|
| **vso.profile** | Identificar o usuário logado |
| **vso.work_write** | Ler e atualizar Work Items |
| **vso.identity** | Acessar informações de identidade |

---

## 💡 Dicas de Uso

1. **Apontamento rápido**: Use os botões de atalho (+0.5h, +1h, etc.) para adicionar tempo rapidamente
2. **Busca de tarefas**: Digite o ID (ex: #123) ou parte do título para encontrar rapidamente
3. **Navegação semanal**: Use as setas para navegar entre semanas ou clique em "Hoje" para voltar à semana atual
4. **Hierarquia expandida**: A árvore de Work Items começa expandida para facilitar a visualização
5. **Estado persistente**: O estado de expansão dos itens é salvo automaticamente

---

## 🏢 Sobre

**Desenvolvido para**: Sefaz Ceará  
**Objetivo**: Centralizar o registro de horas de trabalho em projetos de engenharia de software integrado ao Azure DevOps.

---

## 📞 Suporte

Em caso de dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
