import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const formatValue = (value) => (value === null || value === undefined ? '—' : String(value));

export function auditoriaPDF(log) {
    const dataHora = new Date(log?.created_at ?? Date.now()).toLocaleString('pt-BR');
    const recurso = log?.model_type ?? '—';
    const id = log?.model_id ?? '—';
    const usuario = (log?.user_name ?? '—').toUpperCase();

    const oldValues = log?.old_values ?? {};
    const newValues = log?.new_values ?? {};

    const changedKeys = Object.keys(newValues).filter((k) => oldValues?.[k] !== newValues?.[k]);

    const tableBody = [
        [
            { text: 'Campo', bold: true, fillColor: '#f0f0f0' },
            { text: 'Antes', bold: true, fillColor: '#f0f0f0' },
            { text: 'Depois', bold: true, fillColor: '#f0f0f0' },
        ],
        ...changedKeys.map((k) => [
            { text: k, font: 'Courier', fontSize: 10 },
            { text: formatValue(oldValues?.[k]), color: '#c0392b', fontSize: 10 },
            { text: formatValue(newValues?.[k]), color: '#27ae60', fontSize: 10 },
        ]),
    ];

    const docDefinition = {
        pageMargins: [40, 40, 40, 40],
        defaultStyle: { font: 'Roboto', fontSize: 11 },
        content: [
            { text: 'ALTERAÇÃO DE REGISTRO', style: 'titulo' },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 4, 0, 8] },
            { columns: [{ width: 80, text: 'Data/Hora:', bold: true }, { width: '*', text: dataHora }], margin: [0, 0, 0, 4] },
            { columns: [{ width: 80, text: 'Usuário:', bold: true }, { width: '*', text: usuario }], margin: [0, 0, 0, 4] },
            { columns: [{ width: 80, text: 'Recurso:', bold: true }, { width: '*', text: `${recurso}  (ID: ${id})` }], margin: [0, 0, 0, 12] },
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

    const dataStr = new Date(log?.created_at ?? Date.now()).toISOString().slice(0, 10);
    const filename = `auditoria-${recurso}-${id}-${dataStr}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}
