import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../src/services/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

import { api } from "../../src/services/api";
import NewProtocolModal from "../../src/components/protocolo/NewProtocolModal";
import { AuthContext } from "../../src/contexts/AuthContext";

const units = [
  {
    id: 1, tipo: "secretaria", nome: "Secretaria de Saude", ativo: true, parent_id: null,
    children: [
      {
        id: 2, tipo: "departamento", nome: "Vigilancia Sanitaria", ativo: true, parent_id: 1,
        children: [{ id: 3, tipo: "setor", nome: "Setor de Alvaras", ativo: true, parent_id: 2, children: [] }],
      },
      { id: 4, tipo: "departamento", nome: "Departamento Inativo", ativo: false, parent_id: 1, children: [] },
    ],
  },
];

const mockApi = ({ users = [] } = {}) =>
  api.get.mockImplementation((url) => {
    if (url === "/protocolos/unidades-organizacionais") return Promise.resolve({ data: units });
    if (url === "/protocolos/tipos") return Promise.resolve({ data: [] });
    if (url === "/protocolos/contexto-novo") return Promise.resolve({ data: { origin: null, origin_locked: false } });
    if (url === "/protocolos/usuarios-elegiveis") return Promise.resolve({ data: users });
    return Promise.resolve({ data: [] });
  });

const renderModal = () =>
  render(
    <AuthContext.Provider value={{ username: "u" }}>
      <NewProtocolModal open onClose={jest.fn()} onCreated={jest.fn()} />
    </AuthContext.Provider>
  );

const openSelect = async (label) => {
  const labelEl = await screen.findByText(label, { selector: "label" });
  const combo = labelEl.parentElement.querySelector('[role="button"]');
  fireEvent.mouseDown(combo);
  return within(await screen.findByRole("listbox"));
};

beforeEach(() => jest.clearAllMocks());

test("o destino lista secretarias, departamentos e subdepartamentos ativos", async () => {
  mockApi();
  renderModal();

  const list = await openSelect("Destino");

  expect(await list.findByText(/Secretaria de Saude/)).toBeInTheDocument();
  expect(list.getByText(/Vigilancia Sanitaria/)).toBeInTheDocument();
  expect(list.getByText(/Setor de Alvaras/)).toBeInTheDocument();
  expect(list.queryByText(/Departamento Inativo/)).not.toBeInTheDocument();
});

test("escolher um departamento busca só usuários daquela unidade", async () => {
  mockApi({ users: [{ id: 9, name: "Fiscal Maria" }] });
  renderModal();

  const list = await openSelect("Destino");
  fireEvent.click(await list.findByText(/Vigilancia Sanitaria/));

  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/protocolos/usuarios-elegiveis", { params: { unit_id: "2" } })
  );
});

test("sem usuário lotado na unidade, avisa para cadastrar a lotação na estrutura", async () => {
  mockApi({ users: [] });
  renderModal();

  const list = await openSelect("Destino");
  fireEvent.click(await list.findByText(/Vigilancia Sanitaria/));

  expect(await screen.findByText(/lota/i)).toBeInTheDocument();
  expect(screen.getByText(/\/protocolo\/estrutura/)).toBeInTheDocument();
});
