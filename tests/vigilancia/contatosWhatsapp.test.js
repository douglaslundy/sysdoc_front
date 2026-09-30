import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

import { api } from "../../src/services/api";
import ContatosWhatsapp from "../../src/components/vigilancia/ContatosWhatsapp";

const ana = { id: 1, nome: "Ana Fiscal", telefone: "35998765432", ativo: true };
const bia = { id: 2, nome: "Bia Sanitária", telefone: "35991112222", ativo: false };

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: [ana, bia] });
  api.post.mockResolvedValue({ data: { id: 3 } });
  api.put.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
});

test("lista os profissionais com telefone formatado e situação", async () => {
  render(<ContatosWhatsapp />);

  await screen.findByText("Ana Fiscal");
  expect(api.get).toHaveBeenCalledWith("/vigilancia/contatos-whatsapp");
  expect(screen.getByText("(35) 99876-5432")).toBeInTheDocument();
  expect(screen.getByText("Bia Sanitária")).toBeInTheDocument();
  expect(screen.getAllByText("Inativo")).toHaveLength(1);
});

test("sem cadastros mostra orientação", async () => {
  api.get.mockResolvedValue({ data: [] });

  render(<ContatosWhatsapp />);

  expect(await screen.findByText(/Nenhum profissional cadastrado/)).toBeInTheDocument();
});

test("cadastra nome e telefone e recarrega a lista", async () => {
  render(<ContatosWhatsapp />);
  await screen.findByText("Ana Fiscal");

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Carla Nova" } });
  fireEvent.change(screen.getByLabelText("WhatsApp (com DDD)"), { target: { value: "35 98888-7777" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/vigilancia/contatos-whatsapp", { nome: "Carla Nova", telefone: "35988887777" })
  );
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
});

test("não envia com nome vazio ou telefone incompleto", async () => {
  render(<ContatosWhatsapp />);
  await screen.findByText("Ana Fiscal");

  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(await screen.findByText("Informe o nome do profissional.")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Carla" } });
  fireEvent.change(screen.getByLabelText("WhatsApp (com DDD)"), { target: { value: "123" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(await screen.findByText(/Telefone inválido/)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

test("mostra a mensagem do servidor quando o cadastro falha", async () => {
  api.post.mockRejectedValue({ response: { status: 422, data: { message: "Telefone inválido: informe DDD + número (10 a 13 dígitos)." } } });
  render(<ContatosWhatsapp />);
  await screen.findByText("Ana Fiscal");

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Carla" } });
  fireEvent.change(screen.getByLabelText("WhatsApp (com DDD)"), { target: { value: "35988887777" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

  expect(await screen.findByText("Telefone inválido: informe DDD + número (10 a 13 dígitos).")).toBeInTheDocument();
});

test("ativar/desativar envia o cadastro completo", async () => {
  render(<ContatosWhatsapp />);
  await screen.findByText("Ana Fiscal");

  fireEvent.click(screen.getAllByRole("checkbox")[0]);

  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/vigilancia/contatos-whatsapp/1", { nome: "Ana Fiscal", telefone: "35998765432", ativo: false })
  );
});

test("remover pede confirmação", async () => {
  render(<ContatosWhatsapp />);
  await screen.findByText("Ana Fiscal");

  fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/Remover Ana Fiscal/)).toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole("button", { name: "Remover" }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/vigilancia/contatos-whatsapp/1"));
});
