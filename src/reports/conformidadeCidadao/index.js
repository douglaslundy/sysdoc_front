import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const ACAO_LABELS = {
    criar: 'Criar',
    atualizar: 'Atualizar',
    obito: 'Obito',
};

function formatValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function formatDate(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('pt-BR');
    } catch (_) {
        return '-';
    }
}

function payloadToText(item) {
    if (item.acao === 'criar') return 'Novo cadastro';
    if (item.acao === 'obito') return 'Inativar cadastro e filas';

    const payload = item.payload ?? {};
    const fields = Object.keys(payload)
        .filter((key) => key !== 'address')
        .map((key) => {
            if (key === 'nome') return 'Nome';
            if (key === 'born_date') return 'Nascimento';
            if (key === 'phone') return 'Telefone';
            return key;
        });

    if (payload.address) fields.push('Endereco');
    return fields.join(', ') || '-';
}

export function generateConformidadeHistoricoPDF(sync, itens) {
    const rows = itens.length > 0
        ? itens.map((item, index) => [
            { text: String(index + 1), fontSize: 8, alignment: 'center' },
            { text: ACAO_LABELS[item.acao] ?? item.acao, fontSize: 8 },
            { text: formatValue(item.nome_esus), fontSize: 8 },
            { text: `${formatValue(item.cpf)}\n${formatValue(item.cns)}`, fontSize: 8 },
            { text: payloadToText(item), fontSize: 8 },
            { text: item.erro ? formatValue(item.erro) : (item.aplicado ? 'Aplicado' : 'Pendente'), fontSize: 8 },
        ])
        : [[{ text: 'Nenhuma atualizacao registrada.', colSpan: 6, alignment: 'center', fontSize: 9 }, '', '', '', '', '']];

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [24, 28, 24, 32],
        content: [
            { text: 'Historico de atualizacoes - Conformidade de Cidadaos', style: 'title' },
            { text: `Job: ${sync?.job_id ?? '-'}`, fontSize: 8, color: '#555', margin: [0, 2, 0, 2] },
            {
                columns: [
                    { text: `Status: ${sync?.status ?? '-'}`, fontSize: 9 },
                    { text: `Criado em: ${formatDate(sync?.created_at)}`, fontSize: 9 },
                    { text: `Aplicado em: ${formatDate(sync?.aplicado_em)}`, fontSize: 9 },
                ],
                margin: [0, 0, 0, 10],
            },
            {
                columns: [
                    { text: `Criados: ${sync?.result_criados ?? sync?.preview_criados ?? 0}`, fontSize: 9, bold: true },
                    { text: `Atualizados: ${sync?.result_atualizados ?? sync?.preview_atualizados ?? 0}`, fontSize: 9, bold: true },
                    { text: `Obitos: ${sync?.result_obitos ?? sync?.preview_obitos ?? 0}`, fontSize: 9, bold: true },
                    { text: `Erros: ${sync?.result_erros ?? 0}`, fontSize: 9, bold: true },
                ],
                margin: [0, 0, 0, 12],
            },
            {
                table: {
                    headerRows: 1,
                    widths: [24, 58, '*', 88, '*', 100],
                    body: [
                        [
                            { text: '#', style: 'tableHeader', alignment: 'center' },
                            { text: 'Acao', style: 'tableHeader' },
                            { text: 'Nome e-SUS', style: 'tableHeader' },
                            { text: 'CPF / CNS', style: 'tableHeader' },
                            { text: 'Campos', style: 'tableHeader' },
                            { text: 'Resultado', style: 'tableHeader' },
                        ],
                        ...rows,
                    ],
                },
                layout: 'lightHorizontalLines',
            },
        ],
        styles: {
            title: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
            tableHeader: { fontSize: 8, bold: true, color: '#fff', fillColor: '#1351B4' },
        },
        footer: (currentPage, pageCount) => ({
            text: `Pagina ${currentPage} de ${pageCount}`,
            alignment: 'right',
            margin: [0, 0, 24, 0],
            fontSize: 8,
            color: '#666',
        }),
    };

    const date = new Date().toISOString().slice(0, 10);
    pdfMake.createPdf(docDefinition).download(`conformidade-cidadao-${sync?.job_id ?? date}.pdf`);
}
