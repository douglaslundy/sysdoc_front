import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn() }, useRouter: () => ({ push: jest.fn() }) }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/modal/client", () => () => null);
jest.mock("../../src/components/modal/client/view", () => () => null);
jest.mock("../../src/components/modal/client/trips", () => () => null);
jest.mock("../../src/components/modal/client/report", () => () => null);
jest.mock("../../src/components/clients/DuplicateCleanupModal", () => () => null);
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/store/fetchActions/clients", () => ({
  getAllClients: () => () => {},
  inactiveClientFetch: () => () => {},
}));
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn() } }));

import { api } from "../../src/services/api";
import Clients from "../../src/components/clients";
import clientsReducer, { addClients } from "../../src/store/ducks/clients";
import layoutReducer from "../../src/store/ducks/Layout";
import { AuthContext } from "../../src/contexts/AuthContext";

const client = { id: 12, name: "Maria da Silva", mother: "Mae", cpf: "111.222.333-44", cns: "1", phone: "3", born_date: "1990-01-01", active: true };

const renderPage = (auth) => {
  const store = configureStore({
    reducer: { clients: clientsReducer, layout: layoutReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  store.dispatch(addClients([client]));
  return render(
    <Provider store={store}>
      <AuthContext.Provider value={{ profile: "user", ...auth }}>
        <Clients />
      </AuthContext.Provider>
    </Provider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: { current_page: 1, last_page: 1, data: [{ id: 1, titulo: "Visualizou o cadastro", detalhe: null, usuario: "Admin", data: "2026-09-30T11:00:00.000000Z" }] } });
});

test("sem a permissão o botão Histórico não aparece", () => {
  renderPage({ canViewClientHistory: false });
  expect(screen.getByText(/maria da silva/i)).toBeInTheDocument();
  expect(screen.queryByTitle("Histórico do cidadão")).not.toBeInTheDocument();
});

test("com a permissão o botão abre o painel lateral com o histórico", async () => {
  renderPage({ canViewClientHistory: true });

  fireEvent.click(screen.getByTitle("Histórico do cidadão"));

  await screen.findByText("Visualizou o cadastro");
  expect(api.get).toHaveBeenCalledWith("/clients/12/historico", { params: { page: 1 } });
  expect(screen.getByText("Histórico do cidadão", { selector: "h6" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  await waitFor(() => expect(screen.queryByText("Visualizou o cadastro")).not.toBeInTheDocument());
});
