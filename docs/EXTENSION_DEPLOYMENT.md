# Guia de Deploy da Extensão Azure DevOps

## Pacote Gerado

- **Arquivo**: `dist/extension/sefaz-ceara-lab.aponta-projetos-staging-1.0.0.vsix`
- **Publisher**: `sefaz-ceara-lab`
- **Extension ID**: `aponta-projetos-staging`
- **Versão**: `1.0.0`

## Estrutura da Extensão

### Contributions (Funcionalidades)

| ID | Tipo | Descrição |
|---|---|---|
| `aponta-hub-group` | Hub Group | Grupo principal "Aponta (Staging)" no menu do projeto |
| `timesheet-hub` | Hub | Página de Timesheet para apontamentos |
| `atividades-hub` | Hub | Página de gerenciamento de Atividades |
| `work-item-form-group` | Work Item Form Group | Painel de apontamentos embutido em Tasks/Bugs |

### Permissões (Scopes)

- `vso.profile` - Leitura do perfil do usuário
- `vso.work_write` - Leitura/escrita em Work Items

## Publicação Manual no Azure DevOps

### Opção 1: Via Marketplace (Recomendado)

1. Acesse [Visual Studio Marketplace Management](https://marketplace.visualstudio.com/manage/publishers)
2. Faça login com a conta do publisher `sefaz-ceara-lab`
3. Clique em **"New extension"** → **"Azure DevOps"**
4. Faça upload do arquivo `.vsix`
5. Após o upload, clique em **"Share/Unshare"**
6. Adicione a organização: `sefaz-ceara-lab`

### Opção 2: Via TFX CLI

```bash
# Login no publisher (primeira vez)
npx tfx extension login --service-url https://marketplace.visualstudio.com

# Publicar a extensão
npx tfx extension publish --vsix dist/extension/sefaz-ceara-lab.aponta-projetos-staging-1.0.0.vsix

# Compartilhar com a organização
npx tfx extension share --publisher sefaz-ceara-lab --extension-id aponta-projetos-staging --share-with sefaz-ceara-lab
```

**Nota**: Você precisará de um Personal Access Token (PAT) com permissões de Marketplace.

## Instalação na Organização

Após a publicação e compartilhamento:

1. Acesse a organização: `https://dev.azure.com/sefaz-ceara-lab`
2. Vá em **Organization settings** → **Extensions**
3. Clique em **"Shared"** 
4. Encontre **"Aponta Timetracker (Staging)"**
5. Clique em **"Install"**
6. Selecione o projeto onde deseja instalar

## Verificação da Instalação

Após a instalação:

1. Acesse qualquer projeto na organização
2. No menu lateral, deve aparecer **"Aponta (Staging)"**
3. Clique para ver as opções **"Timesheet"** e **"Atividades"**
4. Abra um Work Item do tipo Task ou Bug
5. Deve aparecer a seção **"Apontamentos (Staging)"**

## URLs do Ambiente Staging

- **Frontend**: https://staging-aponta.treit.com.br
- **API**: https://staging-aponta.treit.com.br/api/
- **Health Check**: https://staging-aponta.treit.com.br/health

## Troubleshooting

### Extensão não aparece no menu
- Verifique se a extensão está instalada no projeto específico
- Limpe o cache do navegador ou use modo anônimo
- Verifique se o usuário tem permissões adequadas

### Erro de CORS
- Verifique se o `baseUri` no manifest aponta para o servidor correto
- Confirme que o servidor staging está configurado com headers CORS apropriados

### Painel não carrega no Work Item
- Verifique se o Work Item é do tipo Task ou Bug
- Confirme que o JavaScript está carregando corretamente (DevTools → Console)

## Atualização da Extensão

Para publicar uma nova versão:

1. Atualize a versão em `extension/vss-extension.staging.json`
2. Gere novo pacote: `npx tfx extension create --manifest-globs vss-extension.staging.json --output-path ../dist/extension`
3. Publique via Marketplace ou CLI

## Arquivos da Extensão

```
extension/
├── vss-extension.staging.json   # Manifest para staging
├── vss-extension.json           # Manifest para produção
├── dist/
│   ├── timesheet.html           # Hub de Timesheet
│   ├── atividades.html          # Hub de Atividades
│   └── work-item-panel.html     # Painel do Work Item
└── images/
    ├── icon-128.png             # Ícone principal
    ├── icon-16.png              # Ícone do menu (light)
    └── icon-16-dark.png         # Ícone do menu (dark)
```
