import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { parseISO, format } from 'date-fns';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

function generateTripsPDF(trips) {
    const content = [];

    let totalQTD_0803010125 = 0;
    let totalQTD_0803010109 = 0;

    // Primeiro, fazemos os cálculos dos totais
    trips.forEach(trip => {
        const { clients, route } = trip;
        const confirmedClients = clients.filter(c => c.pivot.is_confirmed);

        confirmedClients.forEach(client => {
            const qtd = parseFloat((route.distance * 2 / 50).toFixed(1));
            const procedimento = client.pivot.person_type?.toUpperCase() === 'PASSENGER' ? '0803010125' : '0803010109';

            if (procedimento === '0803010125') {
                totalQTD_0803010125 += qtd;
            } else if (procedimento === '0803010109') {
                totalQTD_0803010109 += qtd;
            }
        });
    });

    const valorTotal_0803010125 = (totalQTD_0803010125 * 4.95).toFixed(2);
    const valorTotal_0803010109 = (totalQTD_0803010109 * 4.95).toFixed(2);

    content.push({
        text: `QTD 0803010125 - PACIENTE = ${totalQTD_0803010125.toFixed(1)} Total (R$ ${valorTotal_0803010125}) \n QTD 0803010109 - ACOMPANHANTE = ${totalQTD_0803010109.toFixed(1)} Total: (R$ ${valorTotal_0803010109})`,
        fontSize: 11,
        bold: true,
        margin: [0, 0, 0, 10]
    });

    // Agora geramos o conteúdo das viagens
    trips.forEach(trip => {
        const { id, departure_date, route, clients } = trip;

        content.push({
            stack: [
                { text: `VIAGEM Nº ${id}`, fontSize: 14, bold: true, alignment: 'center', margin: [0, 10, 0, 5] },
                { text: `Data: ${format(parseISO(departure_date), 'dd/MM/yyyy')} | Destino: ${route.destination?.toUpperCase()}`, fontSize: 11, alignment: 'center', margin: [0, 0, 0, 10] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 1 }] }
            ]
        });

        const confirmedClients = clients.filter(c => c.pivot.is_confirmed);
        const tableBody = [
            [
                { text: 'Nome', bold: true, fontSize: 10 },
                { text: 'CNS', bold: true, fontSize: 10 },
                { text: 'CPF', bold: true, fontSize: 10 },
                { text: 'Procedimento', bold: true, fontSize: 10 },
                { text: 'QTD', bold: true, fontSize: 10 },
            ]
        ];

        confirmedClients.forEach(client => {
            const procedimento = client.pivot.person_type?.toUpperCase() === 'PASSENGER' ? '0803010125' : '0803010109';
            const qtd = (route.distance * 2 / 50).toFixed(1);

            tableBody.push([
                { text: client.name?.toUpperCase() || '', fontSize: 9 },
                { text: client.cns || '-', fontSize: 9 },
                { text: client.cpf || '-', fontSize: 9 },
                { text: procedimento, fontSize: 9 },
                { text: qtd, fontSize: 9 }
            ]);
        });

        content.push({
            style: 'tableStyle',
            table: {
                headerRows: 1,
                widths: ['30%', '20%', '20%', '15%', '15%'],
                body: tableBody
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 10]
        });
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [20, 40, 20, 40],
        content,
        styles: {
            tableStyle: {
                margin: [0, 5, 0, 15]
            }
        }
    };

    pdfMake.createPdf(docDefinition).open();
}

export default generateTripsPDF;
