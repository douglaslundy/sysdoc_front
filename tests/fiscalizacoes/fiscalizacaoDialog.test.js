import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("feather-icons-react", () => () => null);
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ estabelecimentos: { selectList: [] } }),
}));
const mockEdit = jest.fn(() => ({ type: "edit" }));
jest.mock("../../src/store/fetchActions/fiscalizacoes", () => ({
  addFiscalizacaoFetch: jest.fn(() => ({ type: "add" })),
  editFiscalizacaoFetch: (...args) => mockEdit(...args),
}));
jest.mock("../../src/store/fetchActions/estabelecimentos", () => ({ getEstabelecimentosSelect: () => ({ type: "sel" }) }));
jest.mock("../../src/services/fiscalizacaoAttachments", () => ({
  listFiscalizacaoAttachments: jest.fn().mockResolvedValue([]),
  uploadFiscalizacaoAttachments: jest.fn(),
  deleteFiscalizacaoAttachment: jest.fn(),
  downloadFiscalizacaoAttachment: jest.fn(),
}));

import FiscalizacaoDialog from "../../src/components/modal/fiscalizacao";

const denuncia = {
  id: 2, origem: "denuncia", estabelecimento_id: 5, data_visita: "2026-09-06",
  resultado: "Pendente de apuração", observacoes: "",
};

const renderDialog = (fiscalizacao) =>
  render(<FiscalizacaoDialog open onClose={jest.fn()} fiscalizacao={fiscalizacao} onSuccess={jest.fn()} />);

beforeEach(() => jest.clearAllMocks());

test("não existe um segundo campo de mensagem ao denunciante", () => {
  renderDialog(denuncia);

  expect(screen.queryByLabelText(/Mensagem visível ao denunciante/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Visível ao denunciante")).toBeInTheDocument();
});

test("a caixa publica a própria observação: envia a flag e nunca mensagem_publica", () => {
  renderDialog(denuncia);

  fireEvent.change(screen.getByLabelText(/Observações/), { target: { value: "Estabelecimento notificado." } });
  fireEvent.click(screen.getByLabelText("Visível ao denunciante"));
  fireEvent.click(screen.getByRole("button", { name: "Gravar" }));

  const dados = mockEdit.mock.calls[0][1];
  expect(dados.observacoes).toBe("Estabelecimento notificado.");
  expect(dados.visivel_ao_denunciante).toBe(true);
  expect(dados).not.toHaveProperty("mensagem_publica");
});

test("fiscalização interna não mostra a caixa", () => {
  renderDialog({ ...denuncia, origem: "interna" });

  expect(screen.queryByLabelText("Visível ao denunciante")).not.toBeInTheDocument();
});
