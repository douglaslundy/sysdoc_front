import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn() }, useRouter: () => ({ push: jest.fn() }) }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/components/modal/fiscalizacao", () => () => null);

const mockGetAll = jest.fn(() => () => {});
jest.mock("../../src/store/fetchActions/fiscalizacoes", () => ({
  getAllFiscalizacoes: (params) => mockGetAll(params),
  removeFiscalizacaoFetch: () => () => {},
}));
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../../src/reports/fiscalizacao", () => ({ printFiscalizacaoPdf: jest.fn() }));

import { api } from "../../src/services/api";
import { printFiscalizacaoPdf } from "../../src/reports/fiscalizacao";
import ListaFiscalizacoes from "../../src/components/fiscalizacoes";
import fiscalizacoesReducer, { addFiscalizacoes } from "../../src/store/ducks/fiscalizacoes";
import layoutReducer from "../../src/store/ducks/Layout";

const interna = {
  id: 1, protocolo: "FIS-2026-000001", origem: "interna", resultado: "Conforme", data_visita: "2026-09-06",
  estabelecimento: { nome_estabelecimento: "Padaria Central" }, fiscal: { name: "Fiscal A" },
};
const denuncia = {
  id: 2, protocolo: "FIS-2026-000002", origem: "denuncia", resultado: "Pendente de apuração", data_visita: null,
  estabelecimento: { nome_estabelecimento: "Bar do Zé" }, fiscal: { name: null },
};

const renderPage = () => {
  const store = configureStore({
    reducer: { fiscalizacoes: fiscalizacoesReducer, layout: layoutReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  store.dispatch(addFiscalizacoes([interna, denuncia]));
  return render(
    <Provider store={store}>
      <ListaFiscalizacoes />
    </Provider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({
    data: [
      { id: 9, titulo: "Mensagem ao denunciante", detalhe: "Vistoria marcada.", usuario: "Fiscal A", data: "2026-09-30T12:00:00.000000Z", publico: true },
      { id: 8, titulo: "Denúncia recebida", detalhe: null, usuario: "Denunciante", data: "2026-09-30T11:00:00.000000Z", publico: true },
    ],
  });
  api.post.mockResolvedValue({ data: { id: 10 } });
});

test("lista mostra o protocolo e marca as denúncias", () => {
  renderPage();

  expect(screen.getByText("FIS-2026-000001")).toBeInTheDocument();
  expect(screen.getByText("FIS-2026-000002")).toBeInTheDocument();
  expect(screen.getAllByText("Denúncia")).toHaveLength(1);
  expect(screen.getByText("Pendente de apuração")).toBeInTheDocument();
  expect(screen.getAllByText("—", { selector: "p" }).length).toBeGreaterThan(0); // denúncia sem data de visita
});

test("filtro de origem recarrega a listagem", () => {
  renderPage();

  fireEvent.mouseDown(screen.getByLabelText("Origem"));
  fireEvent.click(within(screen.getByRole("listbox")).getByText("Denúncias"));

  expect(mockGetAll).toHaveBeenLastCalledWith(expect.objectContaining({ origem: "denuncia", page: 1 }));
});

test("botão Histórico abre o painel com a movimentação da fiscalização", async () => {
  renderPage();

  fireEvent.click(screen.getAllByTitle("Histórico")[1]);

  await screen.findByText("Mensagem ao denunciante");
  expect(api.get).toHaveBeenCalledWith("/fiscalizacoes/2/historico");
  expect(screen.getByText("Vistoria marcada.")).toBeInTheDocument();
  expect(screen.getAllByText("Público").length).toBeGreaterThan(0);
});

test("o histórico é só leitura: não há campo de nova movimentação", async () => {
  renderPage();
  fireEvent.click(screen.getAllByTitle("Histórico")[1]);
  await screen.findByText("Mensagem ao denunciante");

  expect(screen.queryByLabelText("Nova movimentação")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Adicionar" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Imprimir PDF" })).toBeInTheDocument();
});

test("botão Imprimir PDF gera o documento interno com a movimentação", async () => {
  renderPage();
  fireEvent.click(screen.getAllByTitle("Histórico")[1]);
  await screen.findByText("Mensagem ao denunciante");

  fireEvent.click(screen.getByRole("button", { name: "Imprimir PDF" }));

  expect(printFiscalizacaoPdf).toHaveBeenCalledWith(
    expect.objectContaining({
      modo: "interno",
      fiscalizacao: expect.objectContaining({ protocolo: "FIS-2026-000002" }),
      movimentacoes: expect.arrayContaining([expect.objectContaining({ id: 9 })]),
    })
  );
});
