import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { parseISO, format } from 'date-fns';

async function queuePDF({ id, uuid, obs, urgency, done, created_at, updated_at, client, user, speciality }) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    const loadImage = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao carregar a imagem: ${response.statusText}`);
            }
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
        } catch (error) {
            console.error("Erro ao carregar a imagem:", error);
            return null;
        }
    };

    const title = [
        {
            text: `Recibo de Cadastramento de Especialidadeº ${id}`,
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [20, 20, 0, 45]
        }
    ];

    const logoImage = await loadImage('/file/brasao.png');

    const logo = logoImage ? [
        {
            image: logoImage,
            width: 80,
            height: 60,
            alignment: 'center',
            margin: [20, 20, 0, 45]
        }
    ] : [];

    const company = [
        {
            stack: [
                { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12 },
                { text: 'Rua 02 de Novembro, 96 - Centro TEL: 0800 035 1319', fontSize: 10 },
                { text: 'saude@ilicinea.mg.gov.br', fontSize: 10 },
            ],
            alignment: 'center',
            margin: [0, 40, 0, 5]
        },
        {
            stack: [
                { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
            ],
            fontSize: 12,
            alignment: 'center',
            margin: [0, 0, 0, 0]
        },
        {
            stack: [
                { text: `R E C I B O   D E   C A D A S T R O   D E   E S P E C I A L I D A D E S`, fontSize: 16 },
            ],
            alignment: 'center',
            margin: [0, 0, 0, 0]
        },
        {
            stack: [
                { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
            ],
            fontSize: 12,
            alignment: 'center',
            margin: [0, 0, 0, 0]
        }
    ];

    const clientText = [
        {
            stack: [
                id != null ? ({ text: `PROTOCOLO Nº ${id}` }) : { text: `` }
            ],
            fontSize: 11,
            bold: true,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                created_at != null ? ({ text: `DATA DO CADASTRO: ${format(parseISO(created_at), 'dd/MM/yyyy HH:mm:ss')}` }) : { text: `` }
            ],
            fontSize: 11,
            bold: true,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                urgency != null ? { text: 'FILA: ' + (urgency == 1 ? 'URGÊNCIA' : 'COMUM') } : { text: `` }
            ],
            fontSize: 11,
            bold: true,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                client != null ? ({ text: `CLIENTE: ${client.id} - ${client.name}` }) : { text: `NÃO FOI ATRIBUIDO CLIENTE PARA ESTA ESPECIALIDADE` }
            ],
            fontSize: 11,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                client.cpf != null ? ({ text: `CPF: ${client?.cpf}` }) : { text: `SEM INFORMAÇÕES...` }
            ],
            fontSize: 11,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                client.cns != null ? ({ text: `CNS: ${client?.cns}` }) : { text: `SEM INFORMAÇÕES...` }
            ],
            fontSize: 11,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                speciality != null ? ({ text: `ESPECIALIDADE: ${speciality.name.toUpperCase()}` }) : { text: `NÃO FOI ATRIBUIDA UMA ESPECIALIDADE` }
            ],
            fontSize: 16,
            bold: true,
            margin: [0, 1, 0, 1]
        },
        {
            stack: [
                { text: 'OBSERVAÇÕES: ' + obs?.toLowerCase(), margin: [0, 1, 0, 1] },
            ],
            fontSize: 11,
            alignment: 'justify',
            margin: [0, 10, 0, 10]
        }
    ];

    // Bloco com o QR Code e a mensagem abaixo dele com quebra de linha após "consultar"
    const qrCodeBlock = [
        {
            qr: `http://sysdoc.dlsistemas.com.br/showqueue/${uuid}`,
            // qr: `http://localhost:3000/showqueue/${uuid}`,
            fit: 100,
            alignment: 'right',
            margin: [0, 5, 15, 0]
        },
        {
            // text: 'Escaneie aqui para consultar\nsua posição na fila',
            text: 'Aponte sua câmera para o QR Code\n e veja sua posição na fila',
            fontSize: 10,
            alignment: 'center',
            margin: [120, 10, 0, 0]
        }
    ];

    // Estrutura de colunas: texto do cliente à esquerda e QR Code com mensagem à direita
    const columnsContent = {
        columns: [
            {
                width: '50%',
                stack: clientText,
                alignment: 'left'
            },
            {
                width: '50%',
                stack: qrCodeBlock,
                alignment: 'right'
            }
        ]
    };

    const lbTrack = [
        {
            stack: [
                { text: `http://sysdoc.dlsistemas.com.br/showqueue/${uuid}` },
            ],
            fontSize: 8,
            alignment: 'center',
            margin: [0, 0, 0, 0]
        }
    ];

    const lbSingn = [
        {
            stack: [
                { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
            ],
            fontSize: 12,
            alignment: 'center',
            margin: [0, 0, 0, 0]
        }
    ];

    const definitions = {
        pageSize: 'A5',
        pageOrientation: 'landscape',
        pageMargins: [15, 50, 15, 40],
        header: logo.length > 0 ? logo : undefined,
        content: [company, columnsContent, lbTrack, lbSingn],
    };

    pdfMake.createPdf(definitions).print();
}

export default queuePDF;
