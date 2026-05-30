# Design — Download PDF por linha na Auditoria

**Data:** 2026-05-30  
**Status:** Aprovado

---

## Contexto

A tela `/auditoria` exibe um histórico paginado de todas as ações do sistema. Linhas com `action === 'UPDATE'` já mostram um diff campo a campo (Antes / Depois) ao expandir a linha. O objetivo é permitir baixar esse diff como PDF para conferência e arquivamento.

---

## Escopo

- **Somente frontend** — nenhuma mudança no backend.
- `pdfmake` já está instalado (`^0.2.5`).
- Afeta apenas linhas com `action === 'UPDATE'`.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/auditoria/index.js` | Adiciona botão download na coluna Detalhes |
| `src/reports/auditoria/index.js` | Novo arquivo — função `auditoriaPDF(log)` |

---

## Comportamento

### Botão na tabela

Na coluna **Detalhes**, linhas UPDATE recebem um segundo botão ao lado do "ver":

- Ícone: `download` (FeatherIcon, 14×14 — igual ao chevron existente)
- Tamanho: `small`
- Sem label de texto
- Exibido apenas quando `log.action === 'UPDATE' && log.old_values && log.new_values`
- Ao clicar: chama `auditoriaPDF(log)` e dispara o download imediatamente

Linhas de outras ações (LOGIN, CREATE, DELETE, etc.) não são afetadas.

---

## Função `auditoriaPDF(log)`

**Localização:** `src/reports/auditoria/index.js`

**Estrutura do PDF:**

```
ALTERAÇÃO DE REGISTRO
─────────────────────────────────────────────
Data/Hora:   30/05/2026 14:32:10
Usuário:     DOUGLAS
Recurso:     Client  (ID: 42)
─────────────────────────────────────────────

CAMPOS ALTERADOS

Campo         | Antes           | Depois
─────────────────────────────────────────────
nome          | João Silva      | João M. Silva
telefone      | 99999-0000      | 98888-1111
```

**Regras:**
- Exibe apenas campos onde `old_values[k] !== new_values[k]` (filtra campos inalterados)
- Valores `null` ou `undefined` são exibidos como `—`
- Data formatada com `toLocaleString('pt-BR')`
- Sem cabeçalho institucional (brasão, endereço)

**Nome do arquivo de download:**  
`auditoria-{model_type}-{model_id}-{YYYY-MM-DD}.pdf`  
Exemplo: `auditoria-Client-42-2026-05-30.pdf`

---

## O que não está no escopo

- PDF por usuário (todas as alterações de um usuário)
- PDF de linhas que não sejam UPDATE
- Geração no backend
- Cabeçalho institucional
