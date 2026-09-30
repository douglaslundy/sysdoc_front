import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { format, parseISO } from "date-fns";

import HistoryDrawer from "../../src/components/history/HistoryDrawer";

const items = [
  { id: 2, titulo: "Editou o cadastro", detalhe: "Nome: Maria → Maria Silva", usuario: "Operadora", data: "2026-09-30T12:00:00.000000Z" },
  { id: 1, titulo: "Visualizou o cadastro", detalhe: null, usuario: "Admin", data: "2026-09-30T11:00:00.000000Z" },
];

const renderDrawer = (props = {}) =>
  render(<HistoryDrawer open onClose={jest.fn()} title="Histórico" subtitle="Maria" items={items} {...props} />);

test("mostra os itens na ordem recebida, com usuário e data/hora", () => {
  renderDrawer();

  const titles = screen.getAllByTestId("history-item-title").map((el) => el.textContent);
  expect(titles).toEqual(["Editou o cadastro", "Visualizou o cadastro"]);
  expect(screen.getByText("Nome: Maria → Maria Silva")).toBeInTheDocument();
  expect(screen.getByText(/Operadora/)).toBeInTheDocument();
  expect(screen.getByText(format(parseISO(items[0].data), "dd/MM/yyyy HH:mm"))).toBeInTheDocument();
  expect(screen.getByText("Maria")).toBeInTheDocument();
});

test("estado vazio", () => {
  renderDrawer({ items: [] });
  expect(screen.getByText("Nenhum registro.")).toBeInTheDocument();
});

test("estado de carregamento e de erro", () => {
  const { rerender } = renderDrawer({ items: [], loading: true });
  expect(screen.getByText("Carregando histórico...")).toBeInTheDocument();

  rerender(<HistoryDrawer open onClose={jest.fn()} title="Histórico" items={[]} error="Falha ao carregar" />);
  expect(screen.getByText("Falha ao carregar")).toBeInTheDocument();
});

test("botão Carregar mais só aparece com mais páginas e dispara o callback", () => {
  const onLoadMore = jest.fn();
  const { rerender } = renderDrawer({ hasMore: false, onLoadMore });
  expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();

  rerender(<HistoryDrawer open onClose={jest.fn()} title="Histórico" items={items} hasMore onLoadMore={onLoadMore} />);
  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

test("botão Fechar chama onClose", () => {
  const onClose = jest.fn();
  renderDrawer({ onClose });
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
