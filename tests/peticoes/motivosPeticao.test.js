import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../src/services/api", () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

import { api } from "../../src/services/api";
import MotivosPeticao from "../../src/components/peticoes/MotivosPeticao";

const units = [
  { id: 1, tipo: "secretaria", nome: "Secretaria de Saude", ativo: true, children: [
    { id: 2, tipo: "departamento", nome: "Vigilancia Sanitaria", ativo: true, children: [] },
  ] },
];
const motivos = [
  { id: 10, nome: "Denúncia", descricao: "Irregularidade", unit_id: 2, unit: { id: 2, nome: "Vigilancia Sanitaria" }, ativo: true, ordem: 1 },
  { id: 11, nome: "Antigo", descricao: null, unit_id: null, unit: null, ativo: false, ordem: 2 },
];

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === "/peticao-motivos") return Promise.resolve({ data: motivos });
    if (url === "/protocolos/unidades-organizacionais") return Promise.resolve({ data: units });
    return Promise.resolve({ data: [] });
  });
  api.post.mockResolvedValue({ data: { id: 12 } });
  api.put.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
});

test("lista os motivos com a unidade responsável e o estado", async () => {
  render(<MotivosPeticao />);

  expect(await screen.findByText("Denúncia")).toBeInTheDocument();
  expect(screen.getByText("Vigilancia Sanitaria")).toBeInTheDocument();
  expect(screen.getByText("Inativo")).toBeInTheDocument();
});

test("cadastra um novo motivo com a unidade responsável escolhida", async () => {
  render(<MotivosPeticao />);
  await screen.findByText("Denúncia");

  fireEvent.click(screen.getByRole("button", { name: "Novo motivo" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.change(dialog.getByLabelText(/Nome/), { target: { value: "Solicitar vistoria" } });

  const label = dialog.getByText("Unidade responsável", { selector: "label" });
  fireEvent.mouseDown(label.parentElement.querySelector('[role="button"]'));
  fireEvent.click(await screen.findByRole("option", { name: /Vigilancia Sanitaria/ }));

  fireEvent.click(dialog.getByRole("button", { name: "Salvar" }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/peticao-motivos", expect.objectContaining({ nome: "Solicitar vistoria", unit_id: 2, ativo: true }))
  );
});

test("edita e exclui um motivo", async () => {
  render(<MotivosPeticao />);
  await screen.findByText("Denúncia");

  fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.change(dialog.getByLabelText(/Nome/), { target: { value: "Denúncia sanitária" } });
  fireEvent.click(dialog.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/peticao-motivos/10", expect.objectContaining({ nome: "Denúncia sanitária" })));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
  const confirm = within(await screen.findByRole("dialog"));
  fireEvent.click(confirm.getByRole("button", { name: "Excluir" }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/peticao-motivos/10"));
});
