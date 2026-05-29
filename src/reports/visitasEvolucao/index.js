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

// ── Gráfico de linhas via SVG (suporta texto nos pontos) ─────────────────────
function buildLineChart(series) {
    if (!series.length) return null;

    const SVG_W    = 750;
    const PLOT_H   = 180;
    const PAD_L    = 46;   // espaço para rótulos do eixo Y
    const PAD_T    = 18;   // espaço para rótulos de valor acima dos pontos
    const PAD_B    = 18;   // espaço para rótulos do eixo X
    const NUM_GRID = 5;
    const SVG_H    = PAD_T + PLOT_H + PAD_B;
    const PLOT_W   = SVG_W - PAD_L;

    const allVals = series.flatMap(s => s.meses ?? []).filter(v => v != null && v >= 0);
    if (!allVals.length) return null;

    const rawMax  = Math.max(...allVals, 1);
    const step    = rawMax <= 50 ? 10 : rawMax <= 200 ? 50 : rawMax <= 1000 ? 100 : rawMax <= 5000 ? 500 : 1000;
    const niceMax = Math.ceil(rawMax / step) * step;

    const xPos = m  => PAD_L + (m + 0.5) * (PLOT_W / 12);
    const yPos = v  => PAD_T + PLOT_H - Math.max(0, Math.min((v ?? 0) / niceMax, 1)) * PLOT_H;

    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}">`;
    svg += `<rect width="${SVG_W}" height="${SVG_H}" fill="white"/>`;

    // Grade horizontal + rótulos eixo Y
    for (let g = 0; g <= NUM_GRID; g++) {
        const y  = PAD_T + PLOT_H - (g / NUM_GRID) * PLOT_H;
        const lw = g === 0 ? 0.8 : 0.3;
        const lc = g === 0 ? '#bbbbbb' : '#e8e8e8';
        svg += `<line x1="${PAD_L}" y1="${y}" x2="${SVG_W}" y2="${y}" stroke="${lc}" stroke-width="${lw}"/>`;
        svg += `<text x="${PAD_L - 3}" y="${y + 2.5}" font-size="7" fill="#888888" text-anchor="end" font-family="Helvetica">${esc(Math.round((g / NUM_GRID) * niceMax).toLocaleString('pt-BR'))}</text>`;
    }

    // Grade vertical leve (um traço por mês)
    for (let m = 0; m < 12; m++) {
        const x = xPos(m);
        svg += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + PLOT_H}" stroke="#f0f0f0" stroke-width="0.2"/>`;
    }

    // Séries: linha → marcadores → rótulos de valor
    for (let si = 0; si < series.length; si++) {
        const color = CORES[si] ?? '#888888';
        const meses = series[si].meses ?? Array(12).fill(0);

        // Linha
        const pts = meses.map((v, m) => `${xPos(m)},${yPos(v ?? 0)}`).join(' ');
        svg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/>`;

        // Marcadores e rótulos
        meses.forEach((v, m) => {
            const x = xPos(m);
            const y = yPos(v ?? 0);
            svg += `<circle cx="${x}" cy="${y}" r="3.5" fill="white" stroke="${color}" stroke-width="1.8"/>`;
            const label = v != null ? v.toLocaleString('pt-BR') : '0';
            // desloca rótulos de séries diferentes para evitar sobreposição
            const dy = y - 7 - si * 9;
            svg += `<text x="${x}" y="${dy}" font-size="7" fill="${color}" text-anchor="middle" font-family="Helvetica" font-weight="bold">${esc(label)}</text>`;
        });
    }

    // Rótulos eixo X (meses)
    for (let m = 0; m < 12; m++) {
        svg += `<text x="${xPos(m)}" y="${PAD_T + PLOT_H + 13}" font-size="7" fill="#777777" text-anchor="middle" font-family="Helvetica">${MESES[m]}</text>`;
    }

    svg += '</svg>';

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
        stack: [{ svg, width: SVG_W }, legend],
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
                text: Number(v ?? 0).toLocaleString('pt-BR'),
                fontSize: 8, alignment: 'right',
                color: (v ?? 0) > 0 ? '#222' : '#bbb',
            })),
            { text: total.toLocaleString('pt-BR'), fontSize: 9, bold: true, alignment: 'right' },
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
