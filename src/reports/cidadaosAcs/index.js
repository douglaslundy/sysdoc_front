import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const LOGO_URL = '/file/brasao.png';
const PRETO = '#000000';

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

const th = (text, alignment) => ({ text, bold: true, fontSize: 8, color: PRETO, alignment, fillColor: '#ffffff' });
const td = (text, extra = {}) => ({ text: text ?? '—', fontSize: 8, color: PRETO, ...extra });

// cidadaos: [{ nome, cpf, cns, idade, equipe, agente, condicoes }] já formatados pela página
// filtros: { equipeNome, agenteNome, condicaoLabel, faixaIdade, busca, multiDomicilio }
export default async function generateCidadaosAcsPDF({ cidadaos = [], filtros = {} }) {
    const logo = await loadImageAsDataUrl(LOGO_URL);
    const geradoEm = new Date().toLocaleString('pt-BR');

    const header = {
        stack: [
            logo ? { image: logo, width: 70, height: 52, alignment: 'center', margin: [0, 8, 0, 6] } : null,
            { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 11, bold: true, alignment: 'center', color: PRETO },
            { text: 'RELATÓRIO DE CIDADÃOS — MONITOR APS', fontSize: 14, bold: true, alignment: 'center', color: PRETO, margin: [0, 8, 0, 2] },
            { text: `Documento gerado em ${geradoEm}`, fontSize: 8, alignment: 'center', color: PRETO, margin: [0, 0, 0, 6] },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 810, y2: 0, lineWidth: 0.5, lineColor: PRETO }] },
        ].filter(Boolean),
    };

    const filtroItems = [
        `Equipe: ${filtros.equipeNome || 'Todas'}`,
        `Agente: ${filtros.agenteNome || 'Todos'}`,
        `Condição: ${filtros.condicaoLabel || 'Todas'}`,
        `Idade: ${filtros.faixaIdade || 'Todas'}`,
        filtros.busca ? `Busca: ${filtros.busca}` : null,
        filtros.multiDomicilio ? 'Somente múltiplos domicílios' : null,
    ].filter(Boolean);

    const filtroLine = {
        text: [
            { text: 'Filtros: ', bold: true, fontSize: 8, color: PRETO },
            { text: filtroItems.join('  |  '), fontSize: 8, color: PRETO },
        ],
        margin: [0, 6, 0, 4],
    };

    const total = {
        text: `Total de cidadãos: ${cidadaos.length.toLocaleString('pt-BR')}`,
        bold: true, fontSize: 9, color: PRETO, margin: [0, 0, 0, 6],
    };

    const rows = cidadaos.map((c, i) => [
        td(String(i + 1), { alignment: 'right' }),
        td(c.nome),
        td(c.cpf),
        td(c.cns),
        td(c.idade, { alignment: 'right' }),
        td(c.equipe),
        td(c.agente),
        td(c.condicoes || '—'),
    ]);

    const tabela = {
        table: {
            headerRows: 1,
            widths: [22, '*', 70, 82, 36, 80, 100, 70],
            body: [
                [th('#', 'right'), th('NOME'), th('CPF'), th('CNS'), th('IDADE', 'right'), th('EQUIPE'), th('AGENTE'), th('CONDIÇÕES')],
                ...(rows.length ? rows : [[{ text: 'Nenhum cidadão encontrado com os filtros aplicados.', colSpan: 8, alignment: 'center', fontSize: 9, color: PRETO }, {}, {}, {}, {}, {}, {}, {}]]),
            ],
        },
        layout: {
            hLineWidth: (i) => (i <= 1 ? 0.8 : 0.3),
            vLineWidth: () => 0,
            hLineColor: () => PRETO,
            paddingTop: () => 2,
            paddingBottom: () => 2,
        },
    };

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [16, 22, 16, 28],
        defaultStyle: { color: PRETO },
        content: [header, filtroLine, total, tabela],
        footer: (currentPage, pageCount) => ({
            columns: [
                { text: 'Monitor APS — Cidadãos', fontSize: 7, color: PRETO, margin: [16, 0, 0, 0] },
                { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: PRETO, alignment: 'right', margin: [0, 0, 16, 0] },
            ],
        }),
    };

    pdfMake.createPdf(docDefinition).open();
}
