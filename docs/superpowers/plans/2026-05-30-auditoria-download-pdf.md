# Auditoria — Download PDF por linha — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um botão de download em cada linha UPDATE da tela de Auditoria que gera um PDF simples com os campos alterados (Antes / Depois).

**Architecture:** Função pura `auditoriaPDF(log)` em `src/reports/auditoria/index.js` usa pdfmake (já instalado) para montar e disparar o download client-side. O componente `Auditoria` importa essa função e chama ao clicar no botão — sem mudança de backend.

**Tech Stack:** pdfmake 0.2.x, React 17, MUI v5, FeatherIcon

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `src/reports/auditoria/index.js` | **Criar** — função `auditoriaPDF(log)` |
| `src/components/auditoria/index.js` | **Modificar** — importar função + adicionar botão na coluna Detalhes |

---

## Task 1: Criar a função `auditoriaPDF`

**Files:**
- Create: `src/reports/auditoria/index.js`

- [ ] **Step 1: Criar o arquivo com a função**

Crie `sysdoc_front/src/reports/auditoria/index.js` com o conteúdo abaixo:

```javascript
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export function auditoriaPDF(log) {
    const dataHora = new Date(log.created_at).toLocaleString('pt-BR');
    const recurso  = log.model_type ?? '—';
    const id       = log.model_id   ?? '—';
    const usuario  = (log.user_name ?? '—').toUpperCase();

    const changedKeys = Object.keys(log.new_values ?? {}).filter(
        k => String(log.old_values?.[k] ?? '') !== String(log.new_values?.[k] ?? '')
    );

    const tableBody = [
        [
            { text: 'Campo',  bold: true, fillColor: '#f0f0f0' },
            { text: 'Antes',  bold: true, fillColor: '#f0f0f0' },
            { text: 'Depois', bold: true, fillColor: '#f0f0f0' },
        ],
        ...changedKeys.map(k => [
            { text: k,                                         font: 'Courier', fontSize: 10 },
            { text: String(log.old_values?.[k] ?? '—'),        color: '#c0392b', fontSize: 10 },
            { text: String(log.new_values?.[k] ?? '—'),        color: '#27ae60', fontSize: 10 },
        ]),
    ];

    const docDefinition = {
        pageMargins: [40, 40, 40, 40],
        defaultStyle: { font: 'Roboto', fontSize: 11 },
        content: [
            { text: 'ALTERAÇÃO DE REGISTRO', style: 'titulo' },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 4, 0, 8] },
            {
                columns: [
                    { width: 80,  text: 'Data/Hora:', bold: true },
                    { width: '*', text: dataHora },
                ],
                margin: [0, 0, 0, 4],
            },
            {
                columns: [
                    { width: 80,  text: 'Usuário:', bold: true },
                    { width: '*', text: usuario },
                ],
                margin: [0, 0, 0, 4],
            },
            {
                columns: [
                    { width: 80,  text: 'Recurso:', bold: true },
                    { width: '*', text: `${recurso}  (ID: ${id})` },
                ],
                margin: [0, 0, 0, 12],
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 12] },
            { text: 'CAMPOS ALTERADOS', bold: true, margin: [0, 0, 0, 8] },
            changedKeys.length > 0
                ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*'],
                        body: tableBody,
                    },
                    layout: 'lightHorizontalLines',
                }
                : { text: 'Nenhuma diferença detectada.', color: '#888', italics: true },
        ],
        styles: {
            titulo: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
        },
    };

    const dataStr = new Date(log.created_at).toISOString().slice(0, 10);
    const filename = `auditoria-${recurso}-${id}-${dataStr}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}
```

- [ ] **Step 2: Verificar que o arquivo foi criado**

```bash
ls sysdoc_front/src/reports/auditoria/
```

Esperado: `index.js`

- [ ] **Step 3: Commit**

```bash
cd sysdoc_front
git add src/reports/auditoria/index.js
git commit -m "feat: função auditoriaPDF — gera PDF de uma alteração de registro"
```

---

## Task 2: Adicionar botão de download no componente Auditoria

**Files:**
- Modify: `src/components/auditoria/index.js`

- [ ] **Step 1: Adicionar o import da função**

No topo de `src/components/auditoria/index.js`, após os imports existentes, adicione:

```javascript
import { auditoriaPDF } from '../../reports/auditoria';
```

O bloco de imports existente termina na linha com `import { api } from '../../services/api';`. Adicione a linha nova logo abaixo dela.

- [ ] **Step 2: Adicionar o botão de download na coluna Detalhes**

Localize o bloco da coluna Detalhes (por volta da linha 295). O código atual é:

```jsx
<TableCell>
    {(log.old_values || log.new_values) && (
        <Button size="small" onClick={() => toggle(log.id)}
            endIcon={<FeatherIcon icon={expanded[log.id] ? 'chevron-up' : 'chevron-down'} width="14" height="14" />}>
            ver
        </Button>
    )}
</TableCell>
```

Substitua por:

```jsx
<TableCell>
    <Box display="flex" alignItems="center" gap={0.5}>
        {(log.old_values || log.new_values) && (
            <Button size="small" onClick={() => toggle(log.id)}
                endIcon={<FeatherIcon icon={expanded[log.id] ? 'chevron-up' : 'chevron-down'} width="14" height="14" />}>
                ver
            </Button>
        )}
        {log.action === 'UPDATE' && log.old_values && log.new_values && (
            <Button size="small" onClick={() => auditoriaPDF(log)}
                title="Baixar PDF desta alteração">
                <FeatherIcon icon="download" width="14" height="14" />
            </Button>
        )}
    </Box>
</TableCell>
```

- [ ] **Step 3: Verificar que o componente compila sem erros**

```bash
cd sysdoc_front
npm run build 2>&1 | tail -20
```

Esperado: build finaliza sem erros de compilação.

- [ ] **Step 4: Testar manualmente**

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse `http://localhost:3000/auditoria`
3. Confirme que linhas UPDATE exibem o botão de ícone `download` ao lado do botão "ver"
4. Confirme que linhas de outras ações (LOGIN, CREATE, etc.) **não** exibem o botão download
5. Clique no botão download de uma linha UPDATE
6. Confirme que o download do PDF é disparado com nome no formato `auditoria-{Recurso}-{ID}-{data}.pdf`
7. Abra o PDF e confirme: cabeçalho (Data/Hora, Usuário, Recurso/ID), tabela Campo/Antes/Depois com apenas os campos que mudaram

- [ ] **Step 5: Commit**

```bash
cd sysdoc_front
git add src/components/auditoria/index.js
git commit -m "feat: botão download PDF por linha UPDATE na tela de auditoria"
```
