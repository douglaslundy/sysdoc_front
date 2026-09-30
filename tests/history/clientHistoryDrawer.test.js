import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../src/services/api", () => ({ api: { get: jest.fn() } }));

import { api } from "../../src/services/api";
import ClientHistoryDrawer from "../../src/components/clients/ClientHistoryDrawer";

const page = (ids, { current, last }) => ({
  data: {
    current_page: current,
    last_page: last,
    data: ids.map((id) => ({ id, titulo: `Evento ${id}`, detalhe: null, usuario: "Admin", data: "2026-09-30T11:00:00.000000Z" })),
  },
});

beforeEach(() => jest.clearAllMocks());

test("busca a primeira página ao abrir e mostra os eventos", async () => {
  api.get.mockResolvedValueOnce(page([3, 2], { current: 1, last: 1 }));

  render(<ClientHistoryDrawer open onClose={jest.fn()} client={{ id: 12, name: "Maria" }} />);

  await screen.findByText("Evento 3");
  expect(api.get).toHaveBeenCalledWith("/clients/12/historico", { params: { page: 1 } });
  expect(screen.getByText("Evento 2")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
});

test("Carregar mais concatena a página seguinte", async () => {
  api.get
    .mockResolvedValueOnce(page([3, 2], { current: 1, last: 2 }))
    .mockResolvedValueOnce(page([1], { current: 2, last: 2 }));

  render(<ClientHistoryDrawer open onClose={jest.fn()} client={{ id: 12, name: "Maria" }} />);

  await screen.findByText("Evento 3");
  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

  await screen.findByText("Evento 1");
  expect(api.get).toHaveBeenLastCalledWith("/clients/12/historico", { params: { page: 2 } });
  expect(screen.getAllByTestId("history-item-title").map((el) => el.textContent)).toEqual(["Evento 3", "Evento 2", "Evento 1"]);
});

test("mostra mensagem clara quando a permissão é negada", async () => {
  api.get.mockRejectedValueOnce({ response: { status: 403, data: { message: "Você não possui permissão para ver o histórico do cidadão." } } });

  render(<ClientHistoryDrawer open onClose={jest.fn()} client={{ id: 12, name: "Maria" }} />);

  await screen.findByText("Você não possui permissão para ver o histórico do cidadão.");
});

test("não busca nada enquanto fechado", () => {
  render(<ClientHistoryDrawer open={false} onClose={jest.fn()} client={{ id: 12, name: "Maria" }} />);
  expect(api.get).not.toHaveBeenCalled();
});
