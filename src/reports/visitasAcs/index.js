import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const LOGO_URL = '/file/brasao.png';

const COR = {
    total:      '#1351B4',
    realizadas: '#168821',
    recusadas:  '#E52207',
    ausentes:   '#FF8C00',
    domicilios: '#7B2D8B',
    fa:         '#555555',
};

const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não inf.' };

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

function n(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('pt-BR');
}

function fmtData(val, hora) {
    if (!val) return '—';
    try {
        const d = new Date(val.length === 10 ? val + 'T12:00:00' : val).toLocaleDateString('pt-BR');
        const h = hora != null ? ` ${String(hora).padStart(2, '0')}:00` : '';
        return d + h;
    } catch { return val; }
}

function truncate(str, max = 20) {
    if (!str) return '—';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

// ── Seção de cards de métricas ───────────────────────────────────────────────
function buildCardsSection(totais, pcts) {
    const t = totais;

    function card(titulo, valor, cor, sub1 = null, sub2 = null, sub1Destaque = false) {
        return {
            stack: [
                { canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 68, color: cor, r: 0 }], absolutePosition: { x: 0, y: 0 } },
                { text: titulo, fontSize: 7.5, color: '#666', margin: [6, 6, 4, 1] },
                { text: valor ?? '—', fontSize: 18, bold: true, color: cor, margin: [6, 0, 4, sub1 || sub2 ? 2 : 6] },
                sub1 ? {
                    text: sub1,
                    fontSize: sub1Destaque ? 9 : 7,
                    bold: sub1Destaque,
                    color: sub1Destaque ? '#42A5F5' : '#888',
                    margin: [6, 0, 4, sub2 ? 0 : 4],
                } : null,
                sub2 ? { text: sub2, fontSize: 7, color: '#888', margin: [6, 0, 4, 4] } : null,
            ].filter(Boolean),
        };
    }

    const domVisitados   = t.domicilios_visitados;
    const domAcomp       = t.domicilios_acompanhados;
    const domPendentes   = Math.max((t.domicilios_com_moradores ?? 0) - (t.domicilios_acompanhados ?? 0), 0);
    const domRecusados   = t.domicilios_recusados;
    const domAusentes    = t.domicilios_ausentes;
    const domTotal       = t.domicilios_total;
    const domComMoradors = t.domicilios_com_moradores;
    const domCasaVazia   = t.domicilios_casa_vazia;

    const row1 = [
        card(
            'TOTAL DE VISITAS',
            n(t.total),
            COR.total,
            domVisitados != null ? `${n(domVisitados)} domicílios visitados` : null,
        ),
        card(
            'REALIZADAS',
            `${n(t.realizadas)} (${pcts.pctReal}%)`,
            COR.realizadas,
            domAcomp != null ? `${n(domAcomp)} (${pcts.pctDomAcomp}%) - domicílios acompanhados` : null,
            domPendentes > 0 ? `${n(domPendentes)} (${pcts.pctDomPendentes}%) - domicílios pendentes` : null,
            true, // sub1Destaque — azul, bold, maior
        ),
        card(
            'RECUSADAS',
            `${n(t.recusadas)} (${pcts.pctRecusadas}%)`,
            COR.recusadas,
            domRecusados != null ? `${n(domRecusados)} (${pcts.pctDomRecus}%) domicílios` : null,
        ),
        card(
            'AUSENTES',
            `${n(t.ausentes)} (${pcts.pctAusentes}%)`,
            COR.ausentes,
            domAusentes != null ? `${n(domAusentes)} (${pcts.pctDomAusent}%) domicílios` : null,
        ),
        card(
            'DOMICÍLIOS CADASTRADOS',
            n(domTotal ?? 0),
            COR.domicilios,
            domComMoradors != null ? `${n(domComMoradors)} (${pcts.pctDomMoradores}%) com moradores` : null,
            domCasaVazia != null ? `${n(domCasaVazia)} (${pcts.pctDomCasaVazia}%) casa vazia` : null,
        ),
        card('DOMICÍLIOS FA', n(t.domicilios_fa ?? 0), COR.fa, 'Fora de Área'),
    ];

    return {
        table: {
            widths: Array(6).fill('*'),
            body: [row1],
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
            fillColor: () => '#FAFAFA',
        },
        margin: [0, 0, 0, 14],
    };
}

// ── Aba Tabela ───────────────────────────────────────────────────────────────
function buildTabelaSection(visitas) {
    const headerRow = [
        { text: 'DATA / HORA',   style: 'th' },
        { text: 'CIDADÃO',       style: 'th' },
        { text: 'AGENTE',        style: 'th' },
        { text: 'CBO',           style: 'th' },
        { text: 'EQUIPE',        style: 'th' },
        { text: 'INSTRUMENTO',   style: 'th' },
        { text: 'GEO',           style: 'th', alignment: 'center' },
        { text: 'DESFECHO',      style: 'th', alignment: 'center' },
    ];

    const rows = visitas.length > 0
        ? visitas.map(v => {
            const desfecho = LABEL_DESFECHO[v.desfecho_id] ?? '—';
            const desfechoCor = v.desfecho_id === 1 ? '#168821'
                              : v.desfecho_id === 2 ? '#E52207'
                              : v.desfecho_id === 3 ? '#FF8C00' : '#888';
            return [
                { text: fmtData(v.data, v.hora), fontSize: 8 },
                { text: v.cidadao ?? '—', fontSize: 8 },
                { text: truncate(v.agente, 20), fontSize: 8, bold: true },
                { text: v.cbo ?? '—', fontSize: 7, color: '#666' },
                { text: v.equipe?.nome ?? '—', fontSize: 8 },
                { text: v.instrumento ?? '—', fontSize: 7, color: '#555' },
                { text: v.has_geo ? 'Sim' : 'Não', fontSize: 8, alignment: 'center', color: v.has_geo ? '#168821' : '#888' },
                { text: desfecho, fontSize: 8, alignment: 'center', bold: true, color: desfechoCor },
            ];
        })
        : [[{
            text: 'Nenhuma visita encontrada para os filtros selecionados.',
            colSpan: 8, alignment: 'center', fontSize: 9, color: '#888', margin: [0, 8, 0, 8],
        }, '', '', '', '', '', '', '']];

    return {
        table: {
            headerRows: 1,
            widths: [70, '*', 90, 38, 85, 75, 28, 55],
            body: [headerRow, ...rows],
        },
        layout: {
            hLineWidth: (i, node) => i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.3,
            vLineWidth: () => 0,
            hLineColor: i => i === 1 ? '#1351B4' : '#ddd',
            fillColor: row => row === 0 ? '#1351B4' : row % 2 === 0 ? '#F7F9FC' : null,
        },
    };
}

// ── Aba Por Agente ───────────────────────────────────────────────────────────
// Ordem das colunas alinhada com a tabela da tela:
// Agente | Equipe | Cidadãos | Realizadas | Recusadas | Ausentes | Total |
// Domicílios | Dom.Visitados | Dom.Ausentes | Dom.Recusados | C/Moradores | Casa Vazia | Dom.Acomp.
function buildAgentesSection(agentes) {
    const headerRow = [
        { text: 'AGENTE',          style: 'th' },
        { text: 'EQUIPE',          style: 'th' },
        { text: 'CIDADÃOS',        style: 'th', alignment: 'right' },
        { text: 'REALIZADAS',      style: 'th', alignment: 'right' },
        { text: 'RECUSADAS',       style: 'th', alignment: 'right' },
        { text: 'AUSENTES',        style: 'th', alignment: 'right' },
        { text: 'TOTAL',           style: 'th', alignment: 'right' },
        { text: 'DOMICÍLIOS',      style: 'th', alignment: 'right' },
        { text: 'DOM.VISITADOS',   style: 'th', alignment: 'right' },
        { text: 'DOM.AUSENTES',    style: 'th', alignment: 'right' },
        { text: 'DOM.RECUSADOS',   style: 'th', alignment: 'right' },
        { text: 'C/MORADORES',     style: 'th', alignment: 'right' },
        { text: 'CASA VAZIA',      style: 'th', alignment: 'right' },
        { text: 'DOM.ACOMP.',      style: 'th', alignment: 'right' },
    ];

    const rows = agentes.length > 0
        ? agentes.map(a => {
            const pctAcompCor = (a.pct_dom_acompanhados ?? 0) >= 70 ? '#168821' : '#FF8C00';
            const domAcompText = a.domicilios_acompanhados != null
                ? `${n(a.domicilios_acompanhados)}${a.pct_dom_acompanhados != null ? ` (${a.pct_dom_acompanhados}%)` : ''}`
                : '—';
            return [
                { text: truncate(a.agente, 20), fontSize: 8, bold: true },
                { text: a.equipe?.nome ? a.equipe.nome.split(' - ').slice(1).join(' - ').trim() : '—', fontSize: 7 },
                { text: n(a.cidadaos), fontSize: 8, alignment: 'right' },
                { text: n(a.realizadas), fontSize: 8, alignment: 'right', color: '#168821' },
                { text: n(a.recusadas), fontSize: 8, alignment: 'right', color: '#E52207' },
                { text: n(a.ausentes), fontSize: 8, alignment: 'right', color: '#FF8C00' },
                { text: n(a.total), fontSize: 8, alignment: 'right', bold: true },
                { text: a.domicilios_total != null ? n(a.domicilios_total) : '—', fontSize: 8, alignment: 'right' },
                { text: a.domicilios_visitados != null ? n(a.domicilios_visitados) : '—', fontSize: 8, alignment: 'right' },
                { text: a.domicilios_ausentes_visita != null ? n(a.domicilios_ausentes_visita) : '—', fontSize: 8, alignment: 'right', color: '#FF8C00' },
                { text: a.domicilios_recusados_visita != null ? n(a.domicilios_recusados_visita) : '—', fontSize: 8, alignment: 'right', color: '#E52207' },
                { text: a.domicilios_com_moradores != null ? n(a.domicilios_com_moradores) : '—', fontSize: 8, alignment: 'right' },
                { text: a.domicilios_casa_vazia != null ? n(a.domicilios_casa_vazia) : '—', fontSize: 8, alignment: 'right' },
                { text: domAcompText, fontSize: 8, alignment: 'right', bold: true, color: pctAcompCor },
            ];
        })
        : [[{
            text: 'Nenhum agente encontrado para o período.',
            colSpan: 14, alignment: 'center', fontSize: 9, color: '#888', margin: [0, 8, 0, 8],
        }, ...Array(13).fill('')]];

    return {
        table: {
            headerRows: 1,
            widths: [72, 68, 32, 40, 38, 36, 30, 38, 42, 40, 42, 40, 36, 44],
            body: [headerRow, ...rows],
        },
        layout: {
            hLineWidth: (i, node) => i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.3,
            vLineWidth: () => 0,
            hLineColor: i => i === 1 ? '#1351B4' : '#ddd',
            fillColor: row => row === 0 ? '#1351B4' : row % 2 === 0 ? '#F7F9FC' : null,
        },
    };
}

// ── Export principal ─────────────────────────────────────────────────────────
export default async function generateVisitasAcsPDF({
    aba,
    totais,
    pcts,
    visitas = [],
    agentes = [],
    filtros = {},
    totalVisitas = 0,
}) {
    const logo = await loadImage(LOGO_URL);
    const geradoEm = new Date().toLocaleString('pt-BR');

    const ABA_LABEL = { tabela: 'Lista de Visitas', agentes: 'Por Agente', mapa: 'Mapa' };
    const DESFECHO_LABEL = { '': 'Todos', '1': 'Realizadas', '2': 'Recusadas', '3': 'Ausentes' };
    const GEO_LABEL = { '': 'Todas', 'sim': 'Com geolocalização', 'nao': 'Sem geolocalização' };

    // ── Cabeçalho ──────────────────────────────────────────────────────────
    const header = {
        stack: [
            logo
                ? { image: logo, width: 65, height: 48, alignment: 'center', margin: [0, 8, 0, 5] }
                : null,
            { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 10, bold: true, alignment: 'center' },
            {
                text: `RELATÓRIO DE VISITAS ACS / TACS — ${filtros.mesLabel?.toUpperCase() ?? ''} ${filtros.ano ?? ''}`,
                fontSize: 13, bold: true, alignment: 'center', margin: [0, 6, 0, 1],
            },
            {
                text: `Aba: ${ABA_LABEL[aba] ?? aba}  ·  Gerado em ${geradoEm}`,
                fontSize: 8, alignment: 'center', color: '#666', margin: [0, 0, 0, 5],
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 780, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }] },
        ].filter(Boolean),
    };

    // ── Filtros aplicados ──────────────────────────────────────────────────
    const filtroItems = [
        filtros.equipeNome ? `Equipe: ${filtros.equipeNome}` : 'Equipe: Todas',
        filtros.filtroAgente ? `Agente: ${filtros.filtroAgente}` : 'Agente: Todos',
        `Desfecho: ${DESFECHO_LABEL[filtros.filtroDesfecho ?? ''] ?? 'Todos'}`,
        `Geolocalização: ${GEO_LABEL[filtros.filtroGeo ?? ''] ?? 'Todas'}`,
    ];
    const filtroLine = {
        text: [
            { text: 'Filtros: ', bold: true, fontSize: 8 },
            { text: filtroItems.join('  |  '), fontSize: 8, color: '#555' },
        ],
        margin: [0, 6, 0, 10],
    };

    // ── Conteúdo da aba ────────────────────────────────────────────────────
    let abaContent;
    if (aba === 'tabela') {
        abaContent = [
            {
                text: [
                    { text: 'Visitas — ', bold: true, fontSize: 9 },
                    {
                        text: `exibindo ${visitas.length.toLocaleString('pt-BR')} de ${totalVisitas.toLocaleString('pt-BR')} registros`,
                        fontSize: 8, color: '#666',
                    },
                ],
                margin: [0, 0, 0, 6],
            },
            buildTabelaSection(visitas),
        ];
    } else if (aba === 'agentes') {
        abaContent = [
            { text: `Por Agente — ${agentes.length} agente(s)`, bold: true, fontSize: 9, margin: [0, 0, 0, 6] },
            buildAgentesSection(agentes),
        ];
    } else {
        abaContent = [{
            text: 'A aba Mapa não está disponível para impressão em PDF.\nUtilize o botão de impressão disponível diretamente na aba Mapa.',
            alignment: 'center', color: '#888', fontSize: 10, margin: [0, 30, 0, 0],
        }];
    }

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [16, 22, 16, 28],
        content: [header, filtroLine, buildCardsSection(totais, pcts), ...abaContent],
        styles: {
            th: { fontSize: 7.5, bold: true, color: '#fff', fillColor: '#1351B4' },
        },
        footer: (currentPage, pageCount) => ({
            columns: [
                { text: `Monitor APS — Visitas ACS/TACS — ${filtros.mesLabel} ${filtros.ano}`, fontSize: 7, color: '#999', margin: [16, 0, 0, 0] },
                { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: '#999', alignment: 'right', margin: [0, 0, 16, 0] },
            ],
        }),
    };

    pdfMake.createPdf(docDefinition).open();
}
