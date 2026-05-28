import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const LOGO_URL = '/file/brasao.png';

const SITUACAO_LABEL = {
    aguardando:     'Aguardando Atendimento',
    atendidos:      'Cidadãos Atendidos',
    nao_aguardaram: 'Não Aguardaram',
};

async function loadImageAsDataUrl(url) {
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
    } catch {
        return null;
    }
}

function formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

export default async function generateFilaEsusPDF({
    dados,
    unidadeNome,
    cnes,
    dataFiltro,
    situacao,
    equipeNome,
    profissionalNome,
}) {
    const logo = await loadImageAsDataUrl(LOGO_URL);
    const tituloSituacao = SITUACAO_LABEL[situacao] ?? situacao;
    const registros = dados?.aguardando ?? [];
    const cont = dados?.contadores ?? {};
    const geradoEm = new Date().toLocaleString('pt-BR');

    // ── Cabeçalho ────────────────────────────────────────────────────────────
    const header = {
        stack: [
            logo
                ? { image: logo, width: 70, height: 52, alignment: 'center', margin: [0, 8, 0, 6] }
                : null,
            { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 11, bold: true, alignment: 'center' },
            { text: unidadeNome ?? '', fontSize: 10, alignment: 'center' },
            cnes ? { text: `CNES: ${cnes}`, fontSize: 9, alignment: 'center', color: '#666' } : null,
            { text: `FILA DE ATENDIMENTO — ${tituloSituacao.toUpperCase()}`, fontSize: 14, bold: true, alignment: 'center', margin: [0, 8, 0, 2] },
            { text: `Documento gerado em ${geradoEm}`, fontSize: 8, alignment: 'center', color: '#666', margin: [0, 0, 0, 6] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }] },
        ].filter(Boolean),
    };

    // ── Filtros aplicados ────────────────────────────────────────────────────
    const filtros = {
        table: {
            widths: ['*', '*', '*', '*'],
            body: [
                [
                    { text: 'Data', fontSize: 8, color: '#666', border: [false, false, false, false] },
                    { text: 'Situação', fontSize: 8, color: '#666', border: [false, false, false, false] },
                    { text: 'Equipe', fontSize: 8, color: '#666', border: [false, false, false, false] },
                    { text: 'Profissional', fontSize: 8, color: '#666', border: [false, false, false, false] },
                ],
                [
                    { text: formatDate(dataFiltro), fontSize: 9, bold: true, border: [false, false, false, false] },
                    { text: tituloSituacao, fontSize: 9, bold: true, border: [false, false, false, false] },
                    { text: equipeNome || 'Todas', fontSize: 9, bold: true, border: [false, false, false, false] },
                    { text: profissionalNome || 'Todos', fontSize: 9, bold: true, border: [false, false, false, false] },
                ],
            ],
        },
        margin: [0, 8, 0, 10],
    };

    // ── Cards de contadores ──────────────────────────────────────────────────
    const contadores = {
        table: {
            widths: ['*', '*', '*', '*'],
            body: [
                [
                    { text: 'Em Espera', fontSize: 8, color: '#666', alignment: 'center', border: [true, true, true, false], fillColor: '#EDF1FA' },
                    { text: 'Atendidos', fontSize: 8, color: '#666', alignment: 'center', border: [true, true, true, false], fillColor: '#EDF7EE' },
                    { text: 'Não Aguardaram', fontSize: 8, color: '#666', alignment: 'center', border: [true, true, true, false], fillColor: '#FEF0EE' },
                    { text: 'Tempo Médio Espera', fontSize: 8, color: '#666', alignment: 'center', border: [true, true, true, false], fillColor: '#F4EFF9' },
                ],
                [
                    { text: String(cont.aguardando ?? '—'), fontSize: 18, bold: true, color: '#1351B4', alignment: 'center', border: [true, false, true, true], fillColor: '#EDF1FA' },
                    { text: String(cont.atendidos ?? '—'), fontSize: 18, bold: true, color: '#168821', alignment: 'center', border: [true, false, true, true], fillColor: '#EDF7EE' },
                    { text: String(cont.nao_aguardaram ?? '—'), fontSize: 18, bold: true, color: '#E52207', alignment: 'center', border: [true, false, true, true], fillColor: '#FEF0EE' },
                    { text: String(cont.tempo_medio_espera ?? '—'), fontSize: 14, bold: true, color: '#7A4CC2', alignment: 'center', border: [true, false, true, true], fillColor: '#F4EFF9' },
                ],
            ],
        },
        margin: [0, 0, 0, 14],
    };

    // ── Tabela de registros ──────────────────────────────────────────────────
    const headerRow = [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Cidadão', style: 'tableHeader' },
        { text: 'Data', style: 'tableHeader' },
        { text: 'Chegada', style: 'tableHeader', alignment: 'center' },
        { text: 'Saída', style: 'tableHeader', alignment: 'center' },
        { text: 'Tempo Espera', style: 'tableHeader', alignment: 'center' },
        { text: 'Equipe', style: 'tableHeader' },
        { text: 'Profissional', style: 'tableHeader' },
    ];

    const dataRows = registros.length > 0
        ? registros.map((row, i) => [
            { text: String(i + 1), fontSize: 8, color: '#666', alignment: 'center' },
            { text: row.cidadao || '—', fontSize: 9, bold: true },
            { text: row.data_atendimento || '—', fontSize: 9, alignment: 'center' },
            { text: row.hr_chegada || '—', fontSize: 9, alignment: 'center' },
            { text: row.hr_saida || '—', fontSize: 9, alignment: 'center' },
            { text: row.tempo_espera || '—', fontSize: 9, alignment: 'center' },
            { text: row.equipe || '—', fontSize: 9 },
            { text: row.profissional || '—', fontSize: 9 },
        ])
        : [[{ text: 'Nenhum registro encontrado para os filtros selecionados.', colSpan: 8, alignment: 'center', fontSize: 9, color: '#666', margin: [0, 6, 0, 6] }, '', '', '', '', '', '', '']];

    const tabela = {
        table: {
            headerRows: 1,
            widths: [18, '*', 50, 42, 42, 58, 85, 85],
            body: [headerRow, ...dataRows],
        },
        layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.8 : 0.3,
            vLineWidth: () => 0,
            hLineColor: (i) => i === 1 ? '#1351B4' : '#ddd',
            fillColor: (rowIndex) => rowIndex === 0 ? '#1351B4' : rowIndex % 2 === 0 ? '#F7F9FC' : null,
        },
    };

    // ── Rodapé total ─────────────────────────────────────────────────────────
    const rodapeTotal = {
        text: `Total de registros exibidos: ${registros.length}`,
        fontSize: 8,
        color: '#666',
        alignment: 'right',
        margin: [0, 4, 0, 0],
    };

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [20, 25, 20, 30],
        content: [header, filtros, contadores, tabela, rodapeTotal],
        styles: {
            tableHeader: {
                fontSize: 9,
                bold: true,
                color: '#fff',
                fillColor: '#1351B4',
            },
        },
        footer: (currentPage, pageCount) => ({
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            margin: [0, 0, 20, 0],
            fontSize: 8,
            color: '#666',
        }),
    };

    pdfMake.createPdf(docDefinition).open();
}
