import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { parseISO, format } from 'date-fns';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const LABEL_DONE    = { 0: 'NÃO', 1: 'SIM', 2: 'TODOS' };
const LABEL_URGENCY = { 0: 'NÃO', 1: 'SIM', 2: 'TODOS' };

async function loadImage(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror   = reject;
        });
    } catch {
        return null;
    }
}

function buildFilterLine(filters = {}) {
    const { search, specialityName, done, urgency } = filters;
    const parts = [];
    if (specialityName)                          parts.push(`Especialidade: ${specialityName}`);
    if (done    !== undefined && done    != 2)   parts.push(`Realizado: ${LABEL_DONE[done] ?? done}`);
    if (urgency !== undefined && urgency != 2)   parts.push(`Urgente: ${LABEL_URGENCY[urgency] ?? urgency}`);
    if (search)                                  parts.push(`Busca: "${search}"`);
    return parts.length ? parts.join('   |   ') : 'Todos os registros';
}

function fmtDate(val) {
    try { return val ? format(parseISO(val), 'dd/MM/yyyy') : '—'; } catch { return '—'; }
}

export default async function generateQueuePDF(queues, filters = {}) {
    const logo = await loadImage('/file/brasao.png');

    // ── Cabeçalho ──────────────────────────────────────────────────────────
    const header = {
        stack: [
            logo ? { image: logo, width: 70, height: 52, alignment: 'center', margin: [0, 6, 0, 6] } : null,
            { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 11, alignment: 'center', bold: true },
            { text: 'Rua 02 de Novembro, 96 - Centro  |  TEL: 0800 035 1319  |  saude@ilicinea.mg.gov.br', fontSize: 9, alignment: 'center' },
            { text: 'FILA DE ESPECIALIDADES — SUS', fontSize: 14, bold: true, alignment: 'center', margin: [0, 8, 0, 2] },
            { text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, fontSize: 8, alignment: 'center', color: '#555' },
            { text: `Filtros: ${buildFilterLine(filters)}   |   Total: ${queues.length} registro${queues.length !== 1 ? 's' : ''}`, fontSize: 8, alignment: 'center', color: '#555', margin: [0, 1, 0, 8] },
        ].filter(Boolean),
    };

    // ── Tabela ─────────────────────────────────────────────────────────────
    const COL_GRAY  = '#f0f0f0';
    const COL_WHITE = '#ffffff';

    const tableHeader = [
        { text: 'POS', bold: true, fontSize: 8, fillColor: '#2c3e50', color: '#fff', alignment: 'center' },
        { text: 'DATA / URGÊNCIA', bold: true, fontSize: 8, fillColor: '#2c3e50', color: '#fff' },
        { text: 'CIDADÃO', bold: true, fontSize: 8, fillColor: '#2c3e50', color: '#fff' },
        { text: 'ESPECIALIDADE', bold: true, fontSize: 8, fillColor: '#2c3e50', color: '#fff' },
        { text: 'REALIZADO', bold: true, fontSize: 8, fillColor: '#2c3e50', color: '#fff', alignment: 'center' },
    ];

    const rows = queues.map((q, idx) => {
        const bg        = idx % 2 === 0 ? COL_WHITE : COL_GRAY;
        const isUrgent  = q.urgency == 1;
        const isDone    = q.done    == 1;

        return [
            {
                stack: [
                    { text: `${q.position ?? idx + 1}º`, bold: true, fontSize: 11 },
                    { text: `#${q.id}`, fontSize: 7, color: '#888' },
                ],
                fillColor: bg, alignment: 'center',
            },
            {
                stack: [
                    { text: fmtDate(q.created_at), fontSize: 8 },
                    {
                        text: isUrgent ? 'URGENTE' : 'ROTINA',
                        fontSize: 7, bold: true,
                        color: isUrgent ? '#c0392b' : '#555',
                    },
                ],
                fillColor: bg,
            },
            {
                stack: [
                    { text: q.client?.name?.toUpperCase() ?? '—', fontSize: 8, bold: true },
                    q.client?.mother ? { text: `Mãe: ${q.client.mother.toUpperCase()}`, fontSize: 7, color: '#555' } : null,
                    { text: [q.client?.cpf, q.client?.cns, q.client?.phone].filter(Boolean).join(' / '), fontSize: 7, color: '#555' },
                ].filter(Boolean),
                fillColor: bg,
            },
            { text: q.speciality?.name?.toUpperCase() ?? '—', fontSize: 8, fillColor: bg },
            {
                stack: [
                    { text: isDone ? 'SIM' : 'NÃO', bold: true, fontSize: 8, color: isDone ? '#27ae60' : '#c0392b', alignment: 'center' },
                    isDone && q.date_of_realized
                        ? { text: fmtDate(q.date_of_realized), fontSize: 7, alignment: 'center', color: '#555' }
                        : null,
                ].filter(Boolean),
                fillColor: bg,
                alignment: 'center',
            },
        ];
    });

    const table = queues.length > 0
        ? {
            table: {
                headerRows: 1,
                widths: [30, 55, '*', 100, 45],
                body: [tableHeader, ...rows],
            },
            layout: {
                hLineWidth: (i) => (i === 0 || i === 1) ? 1 : 0.3,
                vLineWidth: () => 0.3,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
                paddingLeft:   () => 4,
                paddingRight:  () => 4,
                paddingTop:    () => 3,
                paddingBottom: () => 3,
            },
        }
        : { text: 'Nenhum registro encontrado para os filtros selecionados.', alignment: 'center', margin: [0, 20, 0, 0], color: '#888' };

    // ── Documento ──────────────────────────────────────────────────────────
    pdfMake.createPdf({
        pageSize:        'A4',
        pageOrientation: 'landscape',
        pageMargins:     [15, 20, 15, 25],
        content:         [header, table],
        footer: (cur, total) => ({
            text: `${cur} / ${total}`,
            alignment: 'right',
            margin: [0, 0, 20, 0],
            fontSize: 8,
            color: '#888',
        }),
    }).print();
}
