# 🎯 Resolução do Erro 500 - Guia Simplificado

## O Erro
```
500 Internal Server Error
relation "api_aponta_staging.apontamentos" does not exist
```

## O Problema
As tabelas do banco de dados **não existem**.

## A Solução

### 1️⃣ Conectar ao servidor
```bash
ssh usuario@staging-aponta.treit.com.br
```

### 2️⃣ Conectar ao PostgreSQL
```bash
psql postgresql://user:senha@localhost:5432/aponta_staging
```

### 3️⃣ Copiar e executar o script
[Abra este arquivo: **database_reset_complete.sql**](database_reset_complete.sql)

Copie **TODO O CONTEÚDO** e cole no terminal do psql.

Ou execute direto:
```bash
psql postgresql://user:senha@localhost:5432/aponta_staging < database_reset_complete.sql
```

### 4️⃣ Reiniciar o backend
```bash
docker-compose restart backend
```

### 5️⃣ Testar
```bash
curl https://staging-aponta.treit.com.br/api/v1/atividades
```

**Esperado**: Retorna JSON com atividades, não erro 500.

## ✅ Pronto!

Agora o frontend funciona novamente.

---

## Tempo Total: **~5 minutos**

---

## Arquivos Criados

| Arquivo | Para Quem |
|---------|-----------|
| **QUICK_FIX_DATABASE.md** | Quem quer instruções rápidas |
| **database_reset_complete.sql** | O script para executar |
| **DATABASE_RESET_GUIDE.md** | Quem quer detalhes completos |
| **COMPLETE_SOLUTION.md** | Referência técnica |
| **SOLUTION_VISUAL.md** | Entender visualmente |
| **FILES_INDEX.md** | Índice de tudo |

---

**Data**: 22 de janeiro de 2026
