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
