import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { parseISO, format } from 'date-fns';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

class PDFGenerator {
    constructor(queues) {
        this.queues = queues.filter(queue => queue.done === 0);
        this.logoUrl = '/file/brasao.png';
    }

    async loadImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro ao carregar imagem: ${response.statusText}`);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } catch (error) {
            console.error("Erro ao carregar a imagem:", error);
            return null;
        }
    }

    groupAndSortQueues() {
        return Object.entries(
            this.queues.reduce((acc, queue) => {
                const specialityName = queue.speciality?.name || 'Sem Especialidade';
                acc[specialityName] = acc[specialityName] || [];
                acc[specialityName].push(queue);
                return acc;
            }, {})
        ).sort(([a], [b]) => a.localeCompare(b));
    }

    processQueue(queueList, urgency) {
        return queueList
            .filter(q => q.urgency === urgency)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((q, index) => ({ ...q, position: index + 1 }));
    }

    async generate() {
        const logoImage = await this.loadImage(this.logoUrl);
        const groupedQueues = this.groupAndSortQueues();
        const content = [this.getHeader(logoImage)];

        groupedQueues.forEach(([specialityName, queues]) => {
            const urgentQueue = this.processQueue(queues, 1);
            const commonQueue = this.processQueue(queues, 0);
            content.push(...this.getSpecialitySection(specialityName, commonQueue, urgentQueue));
        });

        this.createPDF(content);
    }

    getHeader(logoImage) {
        return {
            stack: [
                logoImage ? { image: logoImage, width: 80, height: 60, alignment: 'center', margin: [0, 10, 0, 10] } : null,
                { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12, alignment: 'center' },
                { text: 'Rua 02 de Novembro, 96 - Centro TEL: 0800 035 1319', fontSize: 10, alignment: 'center' },
                { text: 'saude@ilicinea.mg.gov.br', fontSize: 10, alignment: 'center' },
                { text: 'LISTA DE ESPECIALIDADES / FILA - SUS', fontSize: 16, alignment: 'center', margin: [0, 10, 0, 0] }, 
                { 
                    text: `Documento gerado em ${new Date().toLocaleString('pt-BR')}`, 
                    fontSize: 10, 
                    alignment: 'center', 
                    margin: [0, 0, 0, 10] 
                }
            ].filter(Boolean)
        };
    }

    getSpecialitySection(specialityName, commonQueue, urgentQueue) {
        return [
            { text: `Especialidade: ${specialityName.toUpperCase()}`, bold: true, fontSize: 16, margin: [0, 10, 0, 5] },
            {
                table: {
                    widths: ['50%', '50%'],
                    body: this.getQueueTableBody(commonQueue, urgentQueue)
                },
                layout: 'lightHorizontalLines',
                margin: [0, 5, 0, 15]
            },
            { text: '', pageBreak: 'after' }
        ];
    }

    getQueueTableBody(commonQueue, urgentQueue) {
        const maxLength = Math.max(commonQueue.length, urgentQueue.length);
        const tableBody = [
            [{ text: `Fila Comum (${commonQueue.length} registros )`, bold: true, alignment: 'center' },
             { text: `Fila de Urgência (${urgentQueue.length} registros )`, bold: true, alignment: 'center' }]
        ];
        
        for (let i = 0; i < maxLength; i++) {
            tableBody.push([
                this.getQueueItem(commonQueue[i], 'yellow'),
                this.getQueueItem(urgentQueue[i], 'red')
            ]);
        }
        return tableBody;
    }

    getQueueItem(queueItem, color) {
        if (!queueItem) return '';
        return {
            columns: [
                { width: '15%', canvas: [{ type: 'rect', x: 0, y: 2, w: 30, h: 10, color }] },
                {
                    width: '85%', 
                            text: [
                                'Posição: ', { text: `${queueItem.position}º`, bold: true, fontSize: 16 },
                                ' - Protocolo: ',{ text: `${queueItem.id}`, bold: true, fontSize: 16 }
                            ]
                }
            ],
            columnGap: 2
        };
    }

    createPDF(content) {
        const definitions = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [15, 30, 15, 30],
            content,
            footer: (currentPage, pageCount) => ({
                text: `${currentPage} / ${pageCount}`,
                alignment: 'right',
                margin: [0, 0, 20, 0],
                fontSize: 10
            })
        };
        pdfMake.createPdf(definitions).print();
    }
}

export default async function generateQueuePDF(queues) {
    const pdfGenerator = new PDFGenerator(queues);
    await pdfGenerator.generate();
}















// import pdfMake from 'pdfmake/build/pdfmake';
// import pdfFonts from 'pdfmake/build/vfs_fonts';
// import { parseISO, format } from 'date-fns';


// async function generateQueuePDF(queues) {
//     pdfMake.vfs = pdfFonts.pdfMake.vfs;

//     const loadImage = async (url) => {
//         try {
//             const response = await fetch(url);
//             if (!response.ok) {
//                 throw new Error(`Falha ao carregar a imagem: ${response.statusText}`);
//             }
//             const blob = await response.blob();
//             const base64ImageData = await new Promise((resolve, reject) => {
//                 const reader = new FileReader();
//                 reader.readAsDataURL(blob);
//                 reader.onloadend = () => {
//                     resolve(reader.result);
//                 };
//                 reader.onerror = reject;
//             });
//             return base64ImageData;
//         } catch (error) {
//             console.error("Erro ao carregar a imagem:", error);
//             return null;
//         }
//     };
    
//     const logoImage = await loadImage('/file/brasao.png');
    
//     const logo = logoImage ? [
//         {
//             image: logoImage,
//             width: 80,
//             height: 60,
//             alignment: 'center',
//             margin: [0, 10, 0, 10]
//         }
//     ] : [];

//     const company = [
//         {
//             stack: [logo.length > 0 ? logo : undefined],
//         },
//         {           
//             stack: [
//                 { text: 'SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA', fontSize: 12 },
//                 { text: 'Rua 02 de Novembro, 96 - Centro TEL: 0800 035 1319', fontSize: 10 },
//                 { text: 'saude@ilicinea.mg.gov.br', fontSize: 10 },
//             ],
//             alignment: 'center',
//             margin: [0, 0, 0, 5]
//         },
//         {
//             stack: [
//                 { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
//             ],
//             fontSize: 12,
//             alignment: 'center',
//             margin: [0, 0, 0, 0]
//         },
//         {
//             stack: [
//                 { text: `L I S T A   D E   E S P E C I A L I D A D E S   /   F I L A  -  S U S`, fontSize: 16 },
//             ],
//             alignment: 'center',
//             margin: [0, 0, 0, 0]
//         },
//         {
//             stack: [
//                 { text: `--------------------------------------------------------------------------------------------------------------------------------------------------------------------------` },
//             ],
//             fontSize: 12,
//             alignment: 'center',
//             margin: [0, 0, 0, 0]
//         }
//     ];
    
//     // Filtrar registros com done = 0
//     const filteredQueues = queues.filter(queue => queue.done === 0);

//     // Agrupar por especialidade e ordenar alfabeticamente
//     const groupedBySpeciality = filteredQueues.reduce((acc, queue) => {
//         const specialityName = queue.speciality?.name || 'Sem Especialidade';
//         if (!acc[specialityName]) {
//             acc[specialityName] = [];
//         }
//         acc[specialityName].push(queue);
//         return acc;
//     }, {});

//     // Ordenar as especialidades alfabeticamente
//     const sortedSpecialities = Object.keys(groupedBySpeciality).sort();
    
//     // Criar o conteúdo do PDF
//     const content = [company];

//     sortedSpecialities.forEach((specialityName, index) => {
//         const queues = groupedBySpeciality[specialityName];
        
//         // Separar em urgência (1) e comum (0), ordenando por created_at
//         const urgentQueue = queues
//             .filter(q => q.urgency === 1)
//             .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
//             .map((q, index) => ({ ...q, position: index + 1 })); // Criar cópia e adicionar posição

//         const commonQueue = queues
//             .filter(q => q.urgency === 0)
//             .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
//             .map((q, index) => ({ ...q, position: index + 1 })); // Criar cópia e adicionar posição

//         content.push({
//             text: [
//                 'Especialidade: ', 
//                  {text: `${specialityName.toUpperCase()}`, bold: true, fontSize: 16 }
//             ],
//             margin: [0, 10, 0, 5]
//         });

//         // Criar estrutura de tabela com duas colunas
//         const maxLength = Math.max(commonQueue.length, urgentQueue.length);
//         const tableBody = [
//             [{ text: `Fila Comum (${commonQueue.length} registros)`, bold: true, alignment: 'center' }, { text: `Fila de Urgência (${urgentQueue.length} registros)`, bold: true, alignment: 'center' }]
//         ];

//         for (let i = 0; i < maxLength; i++) {
//             const commonItem = commonQueue[i]
//                 ? {
//                     columns: [
//                         { width: '15%', canvas: [{ type: 'rect', x: 0, y: 2, w: 30, h: 10, color: 'yellow' }] },
//                         { 
//                             width: '85%', 
//                             text: [
//                                 'Posição: ', 
//                                 { text: `${commonQueue[i].position}º`, bold: true, fontSize: 16 },
//                                 ' - Protocolo: ', 
//                                 { text: `${commonQueue[i].id}`, bold: true, fontSize: 16 }
//                             ], 
//                             margin: [2, 0, 0, 0] 
//                         }
//                     ],
//                     columnGap: 2
//                 }
//                 : '';
        
//             const urgentItem = urgentQueue[i]
//                 ? {
//                     columns: [
//                         { width: '15%', canvas: [{ type: 'rect', x: 0, y: 2, w: 30, h: 10, color: 'red' }] },
//                         { 
//                             width: '85%', 
//                             text: [
//                                 'Posição: ', 
//                                 { text: `${urgentQueue[i].position}º`, bold: true, fontSize: 16 },
//                                 ' - Protocolo: ', 
//                                 { text: `${urgentQueue[i].id}`, bold: true, fontSize: 16 }
//                             ], 
//                             margin: [2, 0, 0, 0] 
//                         }
//                     ],
//                     columnGap: 2
//                 }
//                 : '';
        
//             tableBody.push([commonItem, urgentItem]);
//         }
        

//         content.push({
//             table: {
//                 widths: ['50%', '50%'],
//                 body: tableBody
//             },
//             layout: 'lightHorizontalLines',
//             margin: [0, 5, 0, 15]
//         });

//         // Inserir quebra de página após cada especialidade, exceto na última
//         if (index < sortedSpecialities.length - 1) {
//             content.push({ text: '', pageBreak: 'after' });
//         }
//     });
    
//     const definitions = {
//         pageSize: 'A4',
//         pageOrientation: 'portrait',
//         pageMargins: [15, 30, 15, 30],     
//         content,
//         footer: function(currentPage, pageCount) {
//             return {
//                 text: `${currentPage} / ${pageCount}`,
//                 alignment: 'right',
//                 margin: [0, 0, 20, 0],
//                 fontSize: 10
//             };
//         }
//     };
    
//     pdfMake.createPdf(definitions).print();
// }

// export default generateQueuePDF;


















