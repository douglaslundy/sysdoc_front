import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

let mockRouter;
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/components/modal/fiscalizacao", () => () => null);
const mockGetAll = jest.fn(() => () => {});
jest.mock("../../src/store/fetchActions/fiscalizacoes", () => ({
  getAllFiscalizacoes: (params) => mockGetAll(params),
  removeFiscalizacaoFetch: () => () => {},
}));
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

import ListaFiscalizacoes from "../../src/components/fiscalizacoes";
import fiscalizacoesReducer from "../../src/store/ducks/fiscalizacoes";
import layoutReducer from "../../src/store/ducks/Layout";

const renderLista = () => {
  const store = configureStore({ reducer: { fiscalizacoes: fiscalizacoesReducer, Layout: layoutReducer } });
  return render(<Provider store={store}><ListaFiscalizacoes /></Provider>);
};

beforeEach(() => jest.clearAllMocks());

test("abre já filtrada pelo protocolo vindo do kanban (?busca=)", () => {
  mockRouter = { isReady: true, query: { busca: "FIS-2026-000050" }, push: jest.fn() };

  renderLista();

  expect(screen.getByPlaceholderText(/Pesquisar por protocolo/)).toHaveValue("FIS-2026-000050");
  expect(mockGetAll).toHaveBeenCalledWith(expect.objectContaining({ busca: "FIS-2026-000050", page: 1 }));
});

test("sem ?busca= carrega a lista normal", () => {
  mockRouter = { isReady: true, query: {}, push: jest.fn() };

  renderLista();

  expect(mockGetAll).toHaveBeenCalledWith(expect.not.objectContaining({ busca: expect.anything() }));
});

test("espera o roteador ficar pronto antes de carregar", () => {
  mockRouter = { isReady: false, query: {}, push: jest.fn() };

  renderLista();

  expect(mockGetAll).not.toHaveBeenCalled();
});
