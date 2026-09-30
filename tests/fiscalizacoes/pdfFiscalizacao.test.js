import { format, parseISO } from "date-fns";

import { buildFiscalizacaoDocDefinition } from "../../src/reports/fiscalizacao/docDefinition";

const fiscalizacao = {
  id: 2,
  protocolo: "FIS-2026-000002",
  origem: "denuncia",
  resultado: "Pendente de apuração",
  assunto: "Falta de higiene",
  local_endereco: "Rua das Flores, 100",
  estabelecimento: { nome_estabelecimento: "Bar do Zé" },
  fiscal: { name: "Fiscal Secreto" },
  denunciante_nome: "Maria Denunciante",
  denunciante_contato: "35 99999-0000",
  data_visita: null,
  created_at: "2026-09-30 08:00:00",
};

const movimentacoes = [
  { id: 3, titulo: "Situação alterada", detalhe: "Situação: Pendente → Notificação", usuario: "Fiscal Secreto", data: "2026-09-30T14:00:00.000000Z", publico: false },
  { id: 2, titulo: "Mensagem ao denunciante", detalhe: "Vistoria marcada.", usuario: "Fiscal Secreto", data: "2026-09-30T13:00:00.000000Z", publico: true },
  { id: 1, titulo: "Denúncia recebida", detalhe: null, usuario: "Denunciante", data: "2026-09-30T12:00:00.000000Z", publico: true },
];

const text = (docDefinition) => JSON.stringify(docDefinition.content);

test("modo interno traz todos os dados, o fiscal e todas as movimentações", () => {
  const doc = buildFiscalizacaoDocDefinition({ fiscalizacao, movimentacoes, modo: "interno" });
  const content = text(doc);

  expect(content).toContain("FIS-2026-000002");
  expect(content).toContain("Pendente de apuração");
  expect(content).toContain("Bar do Zé");
  expect(content).toContain("Rua das Flores, 100");
  expect(content).toContain("Fiscal Secreto");
  expect(content).toContain("Maria Denunciante");
  expect(content).toContain("Situação: Pendente → Notificação");
  expect(content).toContain("Vistoria marcada.");
  expect(content).toContain("Denúncia recebida");
  expect(content).toContain(format(parseISO(movimentacoes[0].data), "dd/MM/yyyy HH:mm"));
});

test("modo interno preserva a ordem recebida (mais recente primeiro)", () => {
  const content = text(buildFiscalizacaoDocDefinition({ fiscalizacao, movimentacoes, modo: "interno" }));

  expect(content.indexOf("Situação alterada")).toBeLessThan(content.indexOf("Mensagem ao denunciante"));
  expect(content.indexOf("Mensagem ao denunciante")).toBeLessThan(content.indexOf("Denúncia recebida"));
});

test("modo público mostra só o que é público e nunca o nome do fiscal ou notas internas", () => {
  const content = text(buildFiscalizacaoDocDefinition({ fiscalizacao, movimentacoes, modo: "publico" }));

  expect(content).toContain("FIS-2026-000002");
  expect(content).toContain("Vistoria marcada.");
  expect(content).toContain("Denúncia recebida");
  expect(content).not.toContain("Fiscal Secreto");
  expect(content).not.toContain("Situação alterada");
  expect(content).not.toContain("Situação: Pendente → Notificação");
});

test("sem movimentações mostra aviso e não quebra com campos vazios", () => {
  const doc = buildFiscalizacaoDocDefinition({ fiscalizacao: { protocolo: "FIS-2026-000009" }, movimentacoes: [], modo: "interno" });

  expect(text(doc)).toContain("Nenhuma movimentação registrada.");
  expect(doc.info.title).toContain("FIS-2026-000009");
});
