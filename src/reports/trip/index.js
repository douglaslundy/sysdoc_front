import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { parseISO, format } from 'date-fns';

async function tripPDF({ id, departure_date, departure_time, obs, clients, driver, vehicle, route }) {
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

    const title = [
        {
            text: `Planilha de Viagem Nº ${id}`,
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [20, 20, 0, 45] // left, top, right, bottom
        }
    ];

    const logo = [
        {
            // image: "data:image/png;base64, codigo convertido da imagem em base 64 aqui",
            image: await loadImage('https://sysdoc.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbrasao.f5a21054.png&w=256&q=75'),

            width: 80,
            height: 60,
            alignment: 'center',
            margin: [20, 20, 0, 45] // left, top, right, bottom
        },
    ]

    const company = [
        // logo,
        {
            stack: [
                { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12 },
                { text: 'Rua 02 de Novembro, 96 - Centro TEL: 3599961-7854', fontSize: 10 },
                { text: 'saude@ilicinea.mg.gov.br', fontSize: 10 },
            ],
            alignment: 'center',
            margin: [0, 40, 0, 5] // left, top, right, bottom
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
                { text: `P L A N I L H A   D E   V I A G E M `, fontSize: 16 },
                { text: `Boa Viagem - Vá com DEUS!`, fontSize: 12 },
                // { text: `Vá com DEUS!`, fontSize: 12, bold: true }
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

    const dataOfTrip = [
        {
            stack: [
                departure_date != null ? ({ text: `${departure_date != null ? "DIA: " + format(parseISO(departure_date), 'dd/MM/yyyy') : ''} - ${departure_time != null ? "Saída às " + departure_time.substring(0, 5) : ''}` })
                    : { text: `` }
            ],
            fontSize: 11,
            bold: true,
            margin: [0, 1, 0, 1] // left, top, right, bottom
        },

        {
            stack: [
                driver != null ? ({ text: `MOTORISTA: ${driver.id} - ${driver.name}` })
                    : { text: `NÃO FOI ATRIBUIDO MOTORISTA PARA ESTA VIAGEM` }
            ],
            fontSize: 11,
            bold: false,
            margin: [0, 1, 0, 1] // left, top, right, bottom
        },

        {
            stack: [
                route != null ? ({ text: `DESTINO: ${route.destination.toUpperCase()} - VEÍCULO ${vehicle != null ? vehicle.license_plate.toUpperCase() : 'NÃO FOI ATRIBUIDO VEÍCULO A ESTA VIAGEM'} ` })
                    : { text: `NÃO FOI ATRIBUIDO UMA TORA PARA ESTA VIAGEM` }
            ],
            fontSize: 11,
            bold: false,
            margin: [0, 1, 0, 1] // left, top, right, bottom
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



    const dados = clients?.map((cli) => {
        return [
            { text: cli.name?.toUpperCase(), fontSize: 9, margin: [0, 1, 0, 1] },
            { text: cli.addresses?.street.substring(0, 30).toUpperCase() + ' Nº ' + cli.addresses?.number, fontSize: 9, margin: [0, 1, 0, 1] },
            { text: cli?.phone, fontSize: 9, margin: [0, 1, 0, 1] },
            { text: cli?.pivot?.time.substring(0, 5), fontSize: 9, margin: [0, 1, 0, 1] },
            { text: cli?.pivot?.destination_location.toUpperCase(), fontSize: 9, margin: [0, 1, 0, 1] },
        ]
    });

    const dataOfClients = [
        {
            table: {
                headerRows: 1,
                widths: ['27%', '27%', '12%', '7%', '27%'],
                body: [
                    [
                        // { text: 'DESTINO', style: 'tableHeader', fontSize: 10 },
                        { text: 'PACIENTE', style: 'tableHeader', fontSize: 10 },
                        { text: 'ENDEREÇO', style: 'tableHeader', fontSize: 10 },
                        { text: 'TELEFONE', style: 'tableHeader', fontSize: 10 },
                        { text: 'HORAS', style: 'tableHeader', fontSize: 10 },
                        { text: 'DESTINO', style: 'tableHeader', fontSize: 10 }
                    ],
                    ...dados
                ]
            },
            // layout: 'lightHorizontalLines' // headerLineOnly
            layout: 'headerLineOnly'
        }, {
            stack: [
                { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
            ],
        }
    ];

    const lbObs = [

        {
            stack: [
                { text: obs?.toUpperCase(), margin: [0, 1, 0, 1] },
            ],
            fontSize: 8,
            alignment: 'justify',
            margin: [0, 0, 0, 0] // left, top, right, bottom
        },
    ]

    const lbSingn = [

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
            margin: [0, 0, 0, 0]  // left, top, right, bottom
        }
    ];

    const definitions = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [15, 50, 15, 40],
        header: [logo],
        content: [company, dataOfTrip, dataOfClients, lbObs, lbSingn],
        // footer: footer
    };

    pdfMake.createPdf(definitions).print();

}

export default tripPDF;