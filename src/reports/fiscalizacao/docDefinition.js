import { format, isValid, parseISO } from "date-fns";

const dateTime = (value) => {
  if (!value) return "—";
  const parsed = parseISO(String(value).replace(" ", "T"));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy HH:mm") : "—";
};

const date = (value) => {
  if (!value) return "—";
  const parsed = parseISO(String(value).substring(0, 10));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "—";
};

const row = (label, value) => [
  { text: label, bold: true, fontSize: 10, color: "#333333" },
  { text: value || "—", fontSize: 10 },
];

/**
 * Monta o documento (pdfmake) do histórico de uma fiscalização.
 *
 * modo "interno": todos os dados, fiscal responsável, dados do denunciante e TODAS as movimentações.
 * modo "publico": versão do cidadão — só movimentações públicas e nunca o nome do fiscal.
 * As movimentações chegam já ordenadas (mais recente primeiro).
 *
 * Função pura (sem pdfmake) para poder ser testada.
 */
export function buildFiscalizacaoDocDefinition({ fiscalizacao = {}, movimentacoes = [], modo = "interno" }) {
  const interno = modo === "interno";
  const f = fiscalizacao || {};

  const dados = [
    row("Protocolo", f.protocolo),
    row("Situação", f.resultado),
    row("Origem", f.origem === "peticao" ? "Petição" : f.origem ? "Fiscalização interna" : ""),
    row("Assunto", f.assunto),
    row("Estabelecimento", f.estabelecimento?.nome_estabelecimento || f.estabelecimento_nome_informado),
    row("Local", f.local_endereco),
    row("Registrada em", dateTime(f.created_at)),
  ];

  if (interno) {
    dados.push(
      row("Data da visita", date(f.data_visita)),
      row("Fiscal responsável", f.fiscal?.name),
      row("Denunciante", f.denunciante_nome),
      row("Contato do denunciante", f.denunciante_contato)
    );
  }

  const visiveis = (movimentacoes || []).filter((mov) => interno || mov.publico);

  const linhas = visiveis.flatMap((mov) => [
    {
      columns: [
        { text: mov.titulo, bold: true, fontSize: 11, width: "*" },
        { text: dateTime(mov.data), fontSize: 9, color: "#555555", alignment: "right", width: "auto" },
      ],
      margin: [0, 8, 0, 0],
    },
    ...(interno && mov.usuario ? [{ text: `Por: ${mov.usuario}${mov.publico ? " • visível ao denunciante" : ""}`, fontSize: 9, color: "#555555" }] : []),
    ...(mov.detalhe ? [{ text: mov.detalhe, fontSize: 10, margin: [0, 2, 0, 0] }] : []),
    { canvas: [{ type: "line", x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: "#cccccc" }] },
  ]);

  return {
    info: { title: `Fiscalização ${f.protocolo || ""}`.trim() },
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    content: [
      { text: "SECRETARIA MUNICIPAL DE SAÚDE — VIGILÂNCIA SANITÁRIA", fontSize: 11, bold: true, alignment: "center" },
      {
        text: interno ? "HISTÓRICO DA FISCALIZAÇÃO" : "ACOMPANHAMENTO DA DENÚNCIA",
        fontSize: 15,
        bold: true,
        alignment: "center",
        margin: [0, 6, 0, 14],
      },
      { table: { widths: [130, "*"], body: dados }, layout: "lightHorizontalLines", margin: [0, 0, 0, 16] },
      { text: "Movimentação (mais recente primeiro)", fontSize: 12, bold: true, margin: [0, 0, 0, 4] },
      ...(linhas.length ? linhas : [{ text: "Nenhuma movimentação registrada.", fontSize: 10, italics: true, margin: [0, 6, 0, 0] }]),
    ],
    footer: (currentPage, pageCount) => ({
      text: `Emitido em ${format(new Date(), "dd/MM/yyyy HH:mm")} • Página ${currentPage} de ${pageCount}`,
      fontSize: 8,
      alignment: "center",
      color: "#777777",
    }),
  };
}
