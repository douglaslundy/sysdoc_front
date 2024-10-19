import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { parseISO, format } from 'date-fns';

async function tripsPDF(trips) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    const loadImage = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const base64ImageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
        });
        return base64ImageData;
    };

    const logo = await loadImage('https://sysdoc.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbrasao.f5a21054.png&w=256&q=75');

    const createCompanyHeader = () => {
        return [
            {
                stack: [
                    {
                        image: logo,
                        width: 80,
                        height: 60,
                        alignment: 'center',
                        margin: [0, 5, 0, 10] // Ajuste os valores para posicionar a logo conforme necessário
                    },
                    { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12 },
                    { text: 'Rua 02 de Novembro, 96 - Centro TEL: 3599961-7854', fontSize: 10 },
                    { text: 'saude@ilicinea.mg.gov.br', fontSize: 10 },
                ],
                alignment: 'center',
                margin: [0, 5, 0, 5] // left, top, right, bottom
            },
            {
                stack: [
                    { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
                ],
                fontSize: 12,
                alignment: 'center',
                margin: [0, 0, 0, 0] // left, top, right, bottom
            },
            {
                stack: [
                    { text: `M A P A   D E   V I A G E N S `, fontSize: 16 },
                    { text: `Boa Viagem - Vá com DEUS!`, fontSize: 12 },
                ],
                alignment: 'center',
                margin: [0, 0, 0, 0] // left, top, right, bottom
            },
            {
                stack: [
                    { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
                ],
                fontSize: 12,
                alignment: 'center',
                margin: [0, 0, 0, 0] // left, top, right, bottom
            }
        ];
    };

    // Agrupa as viagens por data
    const groupedTrips = trips.reduce((acc, trip) => {
        const date = format(parseISO(trip?.departure_date), 'dd/MM/yyyy');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(trip);
        return acc;
    }, {});

    // Cria uma tabela de viagens para cada data
    const createTableForDate = (date, tripsForDate) => {
        const dados = tripsForDate.map((trip) => {
            return [
                { text: trip?.driver?.name.toUpperCase(), fontSize: 9, margin: [0, 1, 0, 1] },
                { text: trip?.route?.destination?.substring(0, 30).toUpperCase(), fontSize: 9, margin: [0, 1, 0, 1] },
                { text: trip?.clients?.length + ' PESSOAS', fontSize: 9, margin: [0, 1, 0, 1] },
                { text: trip?.departure_time?.substring(0, 5), fontSize: 9, margin: [0, 1, 0, 1] },
                { text: trip?.vehicle?.license_plate?.toUpperCase(), fontSize: 9, margin: [0, 1, 0, 1] },
            ];
        });


        const lbSign = [
            {
                stack: [
                    { text: `------------------------------------------------------------------------` },
                ],
                fontSize: 10,
                alignment: 'center',
                margin: [0, 20, 0, 0] // left, top, right, bottom
            },
            {
                text: [
                    `DIRETOR TFD`,
                ],
                fontSize: 10,
                alignment: 'center',
                margin: [0, 5, 0, 10]  // left, top, right, bottom
            }
        ];
        return [
            ...createCompanyHeader(),  // Inclui o cabeçalho da empresa com a logo para cada nova data
            {
                text: `Data: ${date}`,
                fontSize: 12,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['32%', '29%', '15%', '12%', '12%'],
                    body: [
                        [
                            { text: 'MOTORISTA', style: 'tableHeader', fontSize: 10 },
                            { text: 'ROTA', style: 'tableHeader', fontSize: 10 },
                            { text: 'LOTAÇÃO', style: 'tableHeader', fontSize: 10 },
                            { text: 'HORA', style: 'tableHeader', fontSize: 10 },
                            { text: 'VEÍCULO', style: 'tableHeader', fontSize: 10 },
                        ],
                        ...dados
                    ]
                },
                layout: 'headerLineOnly'
            },
            {
                stack: [
                    { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
                ],
            },

            ...lbSign // Inclui a assinatura após cada grupo de viagens por data
        ];
    };

    // Monta o conteúdo agrupado por data
    const content = [];
    for (const [date, tripsForDate] of Object.entries(groupedTrips)) {
        content.push(...createTableForDate(date, tripsForDate));
    }


    const definitions = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [15, 50, 15, 40],
        content: content,
    };

    pdfMake.createPdf(definitions).print();
}

export default tripsPDF;
