import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { parseISO, format } from 'date-fns'

pdfMake.vfs = pdfFonts.pdfMake.vfs;

async function tripsPDF(trips = []) {
    const loadImage = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao carregar imagem");
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } catch (error) {
            console.error("Erro ao carregar imagem:", error);
            return null;
        }
    };

    const logoImage = await loadImage('/file/brasao.png');
    const logo = logoImage
        ? [{
            image: logoImage,
            width: 80,
            height: 60,
            alignment: 'center',
            margin: [20, 20, 0, 45]
        }]
        : [];

    const pagesContent = trips.map((trip) => {
        const {
            id, departure_date, departure_time, obs, clients,
            driver, vehicle, route
        } = trip;

       
        const company = [
            {
                stack: [
                    { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12 },
                    { text: 'Rua 02 de Novembro, 96 - Centro TEL: 3599961-7854', fontSize: 10 },
                    { text: 'saude@ilicinea.mg.gov.br', fontSize: 10 },
                ],
                alignment: 'center',
                margin: [0, 40, 0, 5]
            },
            { text: '--------------------------------------------------------------------------------------------------------------------------------------------------------------------------', alignment: 'center', margin: [0, 0, 0, 0] },
            {
                stack: [
                    { text: `P L A N I L H A   D E   V I A G E M  Nº ${id}` , fontSize: 16 },
                    { text: 'Boa Viagem - Vá com DEUS!', fontSize: 12 }
                ],
                alignment: 'center',
            },
            { text: '--------------------------------------------------------------------------------------------------------------------------------------------------------------------------', alignment: 'center', margin: [0, 0, 0, 0] }
        ];

        const dataOfTrip = [
            {
                text: `${departure_date ? "DIA: " + format(parseISO(departure_date), 'dd/MM/yyyy') : ''} - ${departure_time ? "Saída às " + departure_time.substring(0, 5) : ''}    /    Chegada às ___:___`,
                fontSize: 11,
                bold: true,
                margin: [0, 1, 0, 1]
            },
            {
                text: driver ? `MOTORISTA: ${driver.id} - ${driver.name?.toUpperCase()}` : 'NÃO FOI ATRIBUIDO MOTORISTA PARA ESTA VIAGEM',
                fontSize: 13,
                bold: true,
                margin: [0, 1, 0, 1]
            },
            {
                text: route ? `DESTINO: ${route.destination?.toUpperCase()} - VEÍCULO ${vehicle ? vehicle.license_plate?.toUpperCase() : 'NÃO FOI ATRIBUIDO VEÍCULO'}` : 'NÃO FOI ATRIBUIDA UMA ROTA',
                fontSize: 11,
                margin: [0, 1, 0, 1]
            },
            { text: '--------------------------------------------------------------------------------------------------------------------------------------------------------------------------', alignment: 'center' }
        ];

        const dados = clients?.filter(cli => cli?.pivot?.is_confirmed)
            .map(cli => [
                { text: cli.name?.toUpperCase(), fontSize: 9 },
                { text: cli?.pivot?.departure_location?.toUpperCase(), fontSize: 9 },
                { text: cli?.pivot?.phone, fontSize: 9 },
                { text: cli?.pivot?.destination_location?.toUpperCase(), fontSize: 9 },
                { text: cli?.pivot?.time?.substring(0, 5), fontSize: 9 }
            ]) || [];

        const dataOfClients = {
            table: {
                headerRows: 1,
                widths: ['27%', '27%', '12%', '27%', '7%'],
                body: [
                    [
                        { text: 'PACIENTE', fontSize: 10, bold: true },
                        { text: 'ENDEREÇO', fontSize: 10, bold: true },
                        { text: 'TELEFONE', fontSize: 10, bold: true },
                        { text: 'DESTINO', fontSize: 10, bold: true },
                        { text: 'HORAS', fontSize: 10, bold: true },
                    ],
                    ...dados
                ]
            },
            layout: 'headerLineOnly',
            margin: [0, 10, 0, 10]
        };

        const lbObs = {
            text: obs?.toUpperCase() || '',
            fontSize: 8,
            alignment: 'justify',
            margin: [0, 5, 0, 5]
        };

        const lbSign = [
            { text: '------------------------------------------------------------------------', alignment: 'center', margin: [0, 20, 0, 0] },
            { text: 'DIRETOR TFD', alignment: 'center', fontSize: 10 }
        ];

        return {
            stack: [...company, ...dataOfTrip, dataOfClients, lbObs, ...lbSign],
            pageBreak: 'after'
        };
    });

    // Remove o `pageBreak` da última página
    if (pagesContent.length > 0) {
        delete pagesContent[pagesContent.length - 1].pageBreak;
    }

    const definitions = {
        pageSize: 'A4',
        pageMargins: [15, 50, 15, 40],
        header: logo.length > 0 ? logo : undefined,
        content: pagesContent
    };

    pdfMake.createPdf(definitions).print();
}

export default tripsPDF;
