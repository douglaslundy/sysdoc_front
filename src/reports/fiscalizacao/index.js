import { buildFiscalizacaoDocDefinition } from "./docDefinition";

export { buildFiscalizacaoDocDefinition };

/**
 * Abre o PDF do histórico da fiscalização. O pdfmake (e as fontes embutidas) só é
 * carregado no clique, para não pesar o carregamento das telas.
 */
export async function printFiscalizacaoPdf({ fiscalizacao, movimentacoes, modo = "interno" }) {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  pdfMake.createPdf(buildFiscalizacaoDocDefinition({ fiscalizacao, movimentacoes, modo })).open();
}
