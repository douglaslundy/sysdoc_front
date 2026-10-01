import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockRouter;
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/components/protocolo/NewProtocolModal", () => () => null);

jest.mock("../../src/services/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { api as mockApi } from "../../src/services/api";
import ProtocoloPage from "../../pages/protocolo/[...slug]";
import { AuthContext } from "../../src/contexts/AuthContext";

const units = [
  {
    id: 1, tipo: "secretaria", nome: "Saude", ativo: true, parent_id: null,
    children: [{ id: 2, tipo: "departamento", nome: "Vigilancia", ativo: true, parent_id: 1, children: [] }],
  },
];

const renderPage = () =>
  render(
    <AuthContext.Provider value={{ username: "u", user: 7, profile: "user" }}>
      <ProtocoloPage />
    </AuthContext.Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

test("detalhe carrega para usuario comum mesmo com /users negado (403)", async () => {
  mockRouter = { isReady: true, query: { slug: ["10"] }, push: jest.fn(), replace: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/users") return Promise.reject({ response: { status: 403 } });
    if (url === "/protocolos/unidades-organizacionais") return Promise.resolve({ data: units });
    if (url === "/protocolos/10") {
      return Promise.resolve({ data: { id: 10, numero: "PRT-1", assunto: "Assunto X", status: "recebido", recebido_em: "2026-01-01", responsavel_atual_id: 7, attachments: [{ id: 1, nome_original: "a.pdf" }] } });
    }
    return Promise.resolve({ data: [] });
  });

  renderPage();

  expect(await screen.findByText("Assunto X")).toBeInTheDocument();
  expect(screen.queryByText(/Não foi possível carregar os dados do protocolo/)).not.toBeInTheDocument();
  expect(screen.getByText("a.pdf")).toBeInTheDocument();
  // já recebido: não oferece "Receber" de novo
  expect(screen.queryByRole("button", { name: "Receber" })).not.toBeInTheDocument();
});

test("detalhe que falha ao carregar nao exibe Receber nem Encerrar", async () => {
  mockRouter = { isReady: true, query: { slug: ["10"] }, push: jest.fn(), replace: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/protocolos/10") return Promise.reject({ response: { status: 404 } });
    return Promise.resolve({ data: [] });
  });

  renderPage();

  expect(await screen.findByText(/Não foi possível carregar os dados do protocolo/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Receber" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Encerrar" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
});

test("estrutura permite editar e excluir unidade", async () => {
  mockRouter = { isReady: true, query: { slug: ["estrutura"] }, push: jest.fn(), replace: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/protocolos/unidades-organizacionais") return Promise.resolve({ data: units });
    return Promise.resolve({ data: [] });
  });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });

  renderPage();

  await screen.findByText("Vigilancia");
  const editar = screen.getAllByRole("button", { name: "Editar" });
  expect(editar).toHaveLength(2);

  fireEvent.click(editar[1]);
  const editDialog = within(await screen.findByRole("dialog"));
  fireEvent.change(editDialog.getByLabelText(/Nome/), { target: { value: "Vigilancia Sanitaria" } });
  fireEvent.click(editDialog.getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(mockApi.put).toHaveBeenCalledWith(
      "/protocolos/unidades-organizacionais/2",
      expect.objectContaining({ nome: "Vigilancia Sanitaria", parent_id: "1" })
    )
  );

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[1]);
  const confirmDialog = within(await screen.findByRole("dialog"));
  expect(confirmDialog.getByText(/Excluir a unidade/)).toBeInTheDocument();
  fireEvent.click(confirmDialog.getByRole("button", { name: "Excluir" }));
  await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/protocolos/unidades-organizacionais/2"));
});

test("caixa de entrada mostra o ícone de anexo só nos protocolos que têm arquivo", async () => {
  mockRouter = { isReady: true, query: { slug: ["caixa-entrada"] }, push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/protocolos/caixa-entrada") {
      return Promise.resolve({
        data: {
          total: 2,
          data: [
            { id: 1, numero: "PRT-1", assunto: "Com arquivo", status: "novo", attachments_count: 2 },
            { id: 2, numero: "PRT-2", assunto: "Sem arquivo", status: "novo", attachments_count: 0 },
          ],
        },
      });
    }
    return Promise.resolve({ data: {} });
  });

  renderPage();

  await screen.findByText("Com arquivo");
  const icons = screen.getAllByTestId("protocolo-anexo-icon");
  expect(icons).toHaveLength(1);
  expect(icons[0]).toHaveAttribute("title", "2 arquivo(s) anexado(s)");
});

describe("botão voltar do protocolo", () => {
  const detailMocks = () =>
    mockApi.get.mockImplementation((url) => {
      if (url === "/protocolos/10") {
        return Promise.resolve({ data: { id: 10, numero: "PRT-1", assunto: "Assunto X", status: "recebido", recebido_em: "2026-01-01", responsavel_atual_id: 7 } });
      }
      return Promise.resolve({ data: [] });
    });

  const setHistoryLength = (length) =>
    Object.defineProperty(window.history, "length", { value: length, configurable: true });

  test("volta para a página anterior quando há histórico", async () => {
    mockRouter = { isReady: true, query: { slug: ["10"] }, push: jest.fn(), replace: jest.fn(), back: jest.fn() };
    detailMocks();
    setHistoryLength(5);

    renderPage();
    await screen.findByText("Assunto X");
    fireEvent.click(screen.getAllByRole("button", { name: /Voltar/ })[0]);

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test("sem histórico (link aberto direto) cai na caixa de entrada", async () => {
    mockRouter = { isReady: true, query: { slug: ["10"] }, push: jest.fn(), replace: jest.fn(), back: jest.fn() };
    detailMocks();
    setHistoryLength(1);

    renderPage();
    await screen.findByText("Assunto X");
    fireEvent.click(screen.getAllByRole("button", { name: /Voltar/ })[0]);

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/protocolo/caixa-entrada");
  });
});

test("listagem mostra a data de criação do protocolo", async () => {
  mockRouter = { isReady: true, query: { slug: ["caixa-entrada"] }, push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/protocolos/caixa-entrada") {
      return Promise.resolve({
        data: { total: 1, data: [{ id: 1, numero: "PRT-1", assunto: "Com data", status: "novo", created_at: "2026-03-05T14:30:00.000000Z" }] },
      });
    }
    return Promise.resolve({ data: {} });
  });

  renderPage();

  await screen.findByText("Com data");
  expect(screen.getByRole("columnheader", { name: "Criado em" })).toBeInTheDocument();
  expect(screen.getByText(/05\/03\/2026/)).toBeInTheDocument();
});

test("estrutura organizacional tem botão Voltar", async () => {
  mockRouter = { isReady: true, query: { slug: ["estrutura"] }, push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  mockApi.get.mockImplementation((url) => {
    if (url === "/protocolos/unidades-organizacionais") return Promise.resolve({ data: units });
    return Promise.resolve({ data: [] });
  });
  Object.defineProperty(window.history, "length", { value: 5, configurable: true });

  renderPage();

  fireEvent.click(await screen.findByRole("button", { name: /Voltar/ }));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});
