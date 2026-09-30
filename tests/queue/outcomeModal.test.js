import React from "react";
import { render, screen, waitFor, fireEvent, within, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/inputs/inputSelectClient", () => () => null);
jest.mock("../../src/store/fetchActions/specialities", () => ({ getAllSpecialities: () => () => {} }));
jest.mock("../../src/services/api", () => ({ api: { put: jest.fn(), get: jest.fn() } }));

import { api } from "../../src/services/api";
import OutcomeModal from "../../src/components/modal/outcomequeue";
import BlockingErrorDialog from "../../src/components/messagesModal/BlockingErrorDialog";
import queuesReducer, { showQueue } from "../../src/store/ducks/queues";
import layoutReducer, { openOutcomeQueueModal } from "../../src/store/ducks/Layout";

const queue = {
  id: 7, obs: "antiga", done: 0,
  client: { name: "Maria" }, speciality: { name: "Fisioterapia" },
};

const renderModal = (props = {}) => {
  const store = configureStore({
    reducer: { queues: queuesReducer, layout: layoutReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  store.dispatch(showQueue(queue));
  store.dispatch(openOutcomeQueueModal());
  const view = render(
    <Provider store={store}>
      <OutcomeModal {...props} />
    </Provider>
  );
  return { store, ...view };
};

const gravarEConfirmar = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Gravar" }));
  fireEvent.click(await screen.findByRole("button", { name: /Sim/ }));
};

beforeEach(() => jest.clearAllMocks());

describe("BlockingErrorDialog", () => {
  test("só fecha pelo botão: Escape e clique fora não fecham", () => {
    const onClose = jest.fn();
    render(<BlockingErrorDialog open title="Falha" message="Algo deu errado." onClose={onClose} />);

    expect(screen.getByText("Algo deu errado.")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    fireEvent.click(document.querySelector(".MuiBackdrop-root"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Algo deu errado.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("é um alerta acessível e chamativo", () => {
    render(<BlockingErrorDialog open title="Falha" message="Msg" onClose={jest.fn()} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});

describe("modal de baixa (desfecho)", () => {
  test("erro do servidor mostra o diálogo persistente e mantém o modal aberto", async () => {
    api.put.mockRejectedValue({ response: { status: 422, data: { message: "Dados inválidos." } } });
    renderModal();

    await gravarEConfirmar();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Dados inválidos\./)).toBeInTheDocument();
    expect(within(dialog).getByText(/NÃO foi registrada/)).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    fireEvent.click(document.querySelectorAll(".MuiBackdrop-root")[document.querySelectorAll(".MuiBackdrop-root").length - 1]);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText(/DESFECHO/)).toBeInTheDocument(); // modal de baixa segue aberto para tentar de novo
  });

  test("falha de rede avisa que não dá para confirmar a gravação", async () => {
    api.put.mockRejectedValue({ request: {}, message: "Network Error" });
    renderModal();

    await gravarEConfirmar();

    expect(await screen.findByText(/não foi possível confirmar se a operação foi registrada/i)).toBeInTheDocument();
  });

  test("sucesso avisa a tela (para recarregar a lista) e não mostra erro", async () => {
    api.put.mockResolvedValue({ data: { data: { id: 7, done: 1 } } });
    const onSaved = jest.fn();
    renderModal({ onSaved });

    await gravarEConfirmar();

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  test("enquanto grava, o botão Gravar fica desabilitado (sem baixa duplicada)", async () => {
    let resolve;
    api.put.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderModal({ onSaved: jest.fn() });

    await gravarEConfirmar();

    await waitFor(() => expect(screen.getByRole("button", { name: /Gravar|Gravando/ })).toBeDisabled());
    expect(api.put).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ data: { data: { id: 7, done: 1 } } }));
  });

  test("a observação enviada não contém 'null' nem 'undefined'", async () => {
    api.put.mockResolvedValue({ data: { data: { id: 7, done: 1 } } });
    renderModal();

    await gravarEConfirmar();

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0][1].obs).toBe("antiga");
  });
});
