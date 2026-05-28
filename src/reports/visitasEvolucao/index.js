import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const LOGO_URL = '/file/brasao.png';
const MESES    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES    = ['#1351B4', '#168821', '#FF8C00'];

async function loadImage(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
        });
    } catch { return null; }
}

// ── Gráfico de linhas via canvas pdfmake ────────────────────────────────────
function buildLineChart(series) {
    if (!series.length) return null;

    const CHART_W  = 700;
    const CHART_H  = 180;
    const PAD_T    = 10;   // topo interno do canvas
    const NUM_GRID = 5;
    const Y_COL_W  = 46;   // coluna dos rótulos do eixo Y

    const allVals = series.flatMap(s => s.meses ?? []).filter(v => v > 0);
    if (!allVals.length) return null;

    // Arredonda para cima até intervalo "bonito"
    const rawMax  = Math.max(...allVals);
    const step    = rawMax <= 50 ? 10 : rawMax <= 200 ? 50 : rawMax <= 1000 ? 100 : rawMax <= 5000 ? 500 : 1000;
    const niceMax = Math.ceil(rawMax / step) * step;

    // Pontos centralizados em 12 colunas iguais (alinha com rótulos dos meses)
    const xPos = m => (m + 0.5) * (CHART_W / 12);
    const yPos = v => PAD_T + CHART_H - Math.max(0, Math.min(v / niceMax, 1)) * CHART_H;

    const shapes = [];

    // Rect transparente para forçar altura do canvas
    shapes.push({ type: 'rect', x: 0, y: 0, w: CHART_W, h: PAD_T + CHART_H + 4, color: 'white', lineColor: 'white' });

    // Linhas de grade horizontais
    for (let g = 0; g <= NUM_GRID; g++) {
        const y = PAD_T + CHART_H - (g / NUM_GRID) * CHART_H;
        shapes.push({
            type: 'line',
            x1: 0, y1: y, x2: CHART_W, y2: y,
            lineWidth: g === 0 ? 0.8 : 0.3,
            lineColor: g === 0 ? '#bbb' : '#e8e8e8',
        });
    }

    // Linhas de grade verticais leves (um por mês)
    for (let m = 0; m < 12; m++) {
        const x = xPos(m);
        shapes.push({
            type: 'line',
            x1: x, y1: PAD_T, x2: x, y2: PAD_T + CHART_H,
            lineWidth: 0.2,
            lineColor: '#f0f0f0',
        });
    }

    // Séries: linha + marcadores
    for (let si = 0; si < series.length; si++) {
        const color = CORES[si] ?? '#888';
        const meses = series[si].meses ?? Array(12).fill(0);
        const pts   = meses.map((v, m) => ({ x: xPos(m), y: yPos(v ?? 0) }));

        // Linha conectando os pontos
        shapes.push({
            type: 'polyline',
            points: pts,
            lineColor: color,
            lineWidth: 2,
            closePath: false,
        });

        // Marcadores (círculo branco com borda colorida)
        pts.forEach(p => {
            shapes.push({ type: 'ellipse', x: p.x, y: p.y, r1: 3.5, r2: 3.5, color: '#fff', lineWidth: 1.8, lineColor: color });
        });
    }

    // Rótulos eixo Y (coluna separada à esquerda do canvas)
    const gridStepVal  = niceMax / NUM_GRID;
    const gridStepPx   = CHART_H / NUM_GRID;
    const yLabels = [];
    for (let g = NUM_GRID; g >= 0; g--) {
        const isTop = g === NUM_GRID;
        yLabels.push({
            text: Math.round(gridStepVal * g).toLocaleString('pt-BR'),
            fontSize: 6.5,
            color: '#888',
            alignment: 'right',
            // primeiro label tem margem = PAD_T - metade do font; os seguintes = espaço entre grades - font
            margin: [0, isTop ? PAD_T - 4 : gridStepPx - 10.5, 3, 0],
        });
    }

    // Rótulos eixo X (meses)
    const xLabels = {
        columns: MESES.map(() => ({ width: CHART_W / 12, text: '' })), // placeholder — sobrescrito abaixo
        columnGap: 0,
    };
    const xLabelRow = {
        columns: MESES.map(m => ({
            width: CHART_W / 12,
            text: m,
            fontSize: 7,
            color: '#777',
            alignment: 'center',
        })),
        columnGap: 0,
        margin: [0, 2, 0, 0],
    };

    // Legenda
    const legend = {
        columns: [
            { width: '*', text: '' },
            ...series.map((s, i) => ({
                width: 'auto',
                columns: [
                    { width: 14, canvas: [{ type: 'rect', x: 0, y: 3, w: 14, h: 7, color: CORES[i] ?? '#888', r: 1 }] },
                    { width: 'auto', text: String(s.ano), fontSize: 9, bold: true, color: CORES[i] ?? '#888', margin: [4, 0, 22, 0] },
                ],
                columnGap: 0,
            })),
            { width: '*', text: '' },
        ],
        margin: [0, 8, 0, 0],
    };

    return {
        stack: [
            // Gráfico: coluna Y + canvas
            {
                columns: [
                    { width: Y_COL_W, stack: yLabels },
                    {
                        width: CHART_W,
                        stack: [
                            { canvas: shapes },
                            xLabelRow,
                        ],
                    },
                ],
                columnGap: 0,
            },
            legend,
        ],
        margin: [0, 0, 0, 18],
    };
}

// ── Tabela de dados mês × ano ────────────────────────────────────────────────
function buildDataTable(series) {
    const headerRow = [
        { text: 'ANO', style: 'th', alignment: 'center' },
        ...MESES.map(m => ({ text: m, style: 'th', alignment: 'right' })),
        { text: 'TOTAL', style: 'th', alignment: 'right' },
    ];

    const rows = series.map((s, i) => {
        const total = (s.meses ?? []).reduce((a, b) => a + (b ?? 0), 0);
        return [
            { text: String(s.ano), fontSize: 9, bold: true, alignment: 'center', color: CORES[i] ?? '#333' },
            ...(s.meses ?? Array(12).fill(0)).map(v => ({
                text: v > 0 ? Number(v).toLocaleString('pt-BR') : '—',
                fontSize: 8, alignment: 'right',
                color: v > 0 ? '#222' : '#bbb',
            })),
            { text: total > 0 ? total.toLocaleString('pt-BR') : '—', fontSize: 9, bold: true, alignment: 'right' },
        ];
    });

    return {
        table: {
            headerRows: 1,
            widths: [30, ...Array(12).fill('*'), 38],
            body: [headerRow, ...rows],
        },
        layout: {
            hLineWidth: (i, node) => i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.3,
            vLineWidth: () => 0,
            hLineColor: i => i === 1 ? '#1351B4' : '#ddd',
            fillColor: row => row === 0 ? '#1351B4' : row % 2 === 0 ? '#F7F9FC' : null,
        },
        margin: [0, 0, 0, 0],
    };
}

// ── Export principal ─────────────────────────────────────────────────────────
export default async function generateVisitasEvolucaoPDF({
    series = [],
    filtros = {},
    anoAtual,
}) {
    const logo     = await loadImage(LOGO_URL);
    const geradoEm = new Date().toLocaleString('pt-BR');

    const DESFECHO_LABEL = { '': 'Todos', '1': 'Realizadas', '2': 'Recusadas', '3': 'Ausentes' };
    const GEO_LABEL      = { '': 'Todas', 'sim': 'Com geolocalização', 'nao': 'Sem geolocalização' };

    const anos = series.map(s => s.ano).join(', ');

    const header = {
        stack: [
            logo ? { image: logo, width: 65, height: 48, alignment: 'center', margin: [0, 8, 0, 5] } : null,
            { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 10, bold: true, alignment: 'center' },
            { text: `EVOLUÇÃO DE VISITAS ACS / TACS — ${anos || anoAtual}`, fontSize: 13, bold: true, alignment: 'center', margin: [0, 6, 0, 1] },
            { text: `Gerado em ${geradoEm}`, fontSize: 8, alignment: 'center', color: '#666', margin: [0, 0, 0, 5] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 760, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }] },
        ].filter(Boolean),
    };

    const filtroItems = [
        filtros.equipeNome ? `Equipe: ${filtros.equipeNome}` : 'Equipe: Todas',
        filtros.agente     ? `Agente: ${filtros.agente}`     : 'Agente: Todos',
        `Desfecho: ${DESFECHO_LABEL[filtros.desfecho ?? ''] ?? 'Todos'}`,
        `Geolocalização: ${GEO_LABEL[filtros.geo ?? ''] ?? 'Todas'}`,
    ];
    const filtroLine = {
        text: [
            { text: 'Filtros: ', bold: true, fontSize: 8 },
            { text: filtroItems.join('  |  '), fontSize: 8, color: '#555' },
        ],
        margin: [0, 6, 0, 14],
    };

    if (!series.length) {
        pdfMake.createPdf({
            pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [20, 22, 20, 28],
            content: [header, filtroLine, { text: 'Sem dados para o período selecionado.', alignment: 'center', color: '#888', fontSize: 11, margin: [0, 40] }],
            footer: (p, t) => ({ text: `Página ${p} de ${t}`, alignment: 'right', fontSize: 7, color: '#999', margin: [0, 0, 20, 0] }),
        }).open();
        return;
    }

    const lineChart  = buildLineChart(series);
    const dataTable  = buildDataTable(series);

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [20, 22, 20, 28],
        content: [
            header,
            filtroLine,
            { text: 'Gráfico — Visitas por Mês', fontSize: 10, bold: true, margin: [0, 0, 0, 8] },
            lineChart,
            { text: 'Dados — Visitas por Mês e Ano', fontSize: 10, bold: true, margin: [0, 0, 0, 8] },
            dataTable,
        ],
        styles: {
            th: { fontSize: 8, bold: true, color: '#fff', fillColor: '#1351B4' },
        },
        footer: (currentPage, pageCount) => ({
            columns: [
                { text: 'Monitor APS — Evolução de Visitas ACS/TACS', fontSize: 7, color: '#999', margin: [20, 0, 0, 0] },
                { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: '#999', alignment: 'right', margin: [0, 0, 20, 0] },
            ],
        }),
    };

    pdfMake.createPdf(docDefinition).open();
}
