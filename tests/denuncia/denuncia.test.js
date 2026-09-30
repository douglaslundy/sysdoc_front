import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockRouter;
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../src/services/denunciaPublica", () => ({
  registrarDenuncia: jest.fn(),
  consultarDenuncia: jest.fn(),
}));
jest.mock("../../src/reports/fiscalizacao", () => ({ printFiscalizacaoPdf: jest.fn() }));

import { registrarDenuncia, consultarDenuncia } from "../../src/services/denunciaPublica";
import { printFiscalizacaoPdf } from "../../src/reports/fiscalizacao";
import Denuncia from "../../pages/denuncia";
import ConsultaDenuncia from "../../pages/denuncia/consulta";

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter = { isReady: true, query: {}, push: jest.fn() };
});

const preencherObrigatorios = () => {
  fireEvent.change(screen.getByLabelText(/Assunto/), { target: { value: "Falta de higiene" } });
  fireEvent.change(screen.getByLabelText(/Descreva a denúncia/), { target: { value: "Alimentos expostos." } });
  fireEvent.change(screen.getByLabelText(/Local\/endereço/), { target: { value: "Rua das Flores, 100" } });
};

describe("página pública de denúncia", () => {
  test("identificação é opcional: envia só com os campos obrigatórios e mostra protocolo, senha e endereço de consulta", async () => {
    registrarDenuncia.mockResolvedValue({
      protocolo: "FIS-2026-000042",
      senha: "K7Q29XMD",
      url_consulta: "https://sistema.gov.br/denuncia/consulta?protocolo=FIS-2026-000042",
    });

    render(<Denuncia />);
    expect(screen.getByLabelText(/Seu nome \(opcional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contato \(opcional\)/)).toBeInTheDocument();
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar denúncia" }));

    await screen.findByText("FIS-2026-000042");
    expect(screen.getByText("K7Q29XMD")).toBeInTheDocument();
    expect(screen.getByText("https://sistema.gov.br/denuncia/consulta?protocolo=FIS-2026-000042")).toBeInTheDocument();
    expect(screen.getByText(/guarde a senha/i)).toBeInTheDocument();

    const enviado = registrarDenuncia.mock.calls[0][0];
    expect(enviado.get("assunto")).toBe("Falta de higiene");
    expect(enviado.get("local_endereco")).toBe("Rua das Flores, 100");
    expect(enviado.get("website")).toBe("");
    expect(enviado.get("denunciante_nome") || "").toBe("");
  });

  test("não envia sem os campos obrigatórios", async () => {
    render(<Denuncia />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar denúncia" }));

    await screen.findByText(/preencha o assunto, a descrição e o local/i);
    expect(registrarDenuncia).not.toHaveBeenCalled();
  });

  test("mostra a mensagem do servidor quando o limite de envios é atingido", async () => {
    registrarDenuncia.mockRejectedValue({ response: { status: 429, data: { message: "Muitas denúncias enviadas deste local." } } });

    render(<Denuncia />);
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar denúncia" }));

    await screen.findByText("Muitas denúncias enviadas deste local.");
    expect(screen.queryByText("K7Q29XMD")).not.toBeInTheDocument();
  });

  test("mostra os erros de validação por campo", async () => {
    registrarDenuncia.mockRejectedValue({
      response: { status: 422, data: { message: "invalid", errors: { "files.0": ["Envie apenas fotos (JPG, PNG, WEBP) ou PDF."] } } },
    });

    render(<Denuncia />);
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar denúncia" }));

    await screen.findByText("Envie apenas fotos (JPG, PNG, WEBP) ou PDF.");
  });

  test("limita a 5 arquivos", async () => {
    render(<Denuncia />);
    const arquivos = Array.from({ length: 6 }, (_, i) => new File(["x"], `f${i}.jpg`, { type: "image/jpeg" }));

    fireEvent.change(screen.getByLabelText(/Fotos e arquivos/), { target: { files: arquivos } });

    await screen.findByText(/no máximo 5 arquivos/i);
  });

  test("campo isca existe, é invisível para pessoas e vai vazio", () => {
    render(<Denuncia />);
    const isca = document.querySelector('input[name="website"]');

    expect(isca).toBeInTheDocument();
    expect(isca).toHaveAttribute("tabindex", "-1");
    expect(isca.closest("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("página pública de consulta", () => {
  const resposta = {
    protocolo: "FIS-2026-000042",
    situacao: "Pendente de apuração",
    assunto: "Falta de higiene",
    local_endereco: "Rua das Flores, 100",
    registrada_em: "2026-09-30T11:00:00.000000Z",
    movimentacoes: [
      { titulo: "Mensagem ao denunciante", descricao: "Vistoria marcada.", data: "2026-09-30T13:00:00.000000Z" },
      { titulo: "Denúncia recebida", descricao: "Denúncia recebida", data: "2026-09-30T11:00:00.000000Z" },
    ],
  };

  test("pré-preenche o protocolo pela URL e mostra a situação e a movimentação", async () => {
    mockRouter = { isReady: true, query: { protocolo: "FIS-2026-000042" }, push: jest.fn() };
    consultarDenuncia.mockResolvedValue(resposta);

    render(<ConsultaDenuncia />);
    expect(screen.getByLabelText("Protocolo")).toHaveValue("FIS-2026-000042");

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "K7Q29XMD" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await screen.findByText("Vistoria marcada.");
    expect(consultarDenuncia).toHaveBeenCalledWith({ protocolo: "FIS-2026-000042", senha: "K7Q29XMD" });
    expect(screen.getByText("Pendente de apuração")).toBeInTheDocument();
    expect(screen.getByText("Mensagem ao denunciante")).toBeInTheDocument();
  });

  test("protocolo ou senha inválidos mostram uma mensagem única", async () => {
    consultarDenuncia.mockRejectedValue({ response: { status: 404, data: { error: "Protocolo ou senha inválidos." } } });

    render(<ConsultaDenuncia />);
    fireEvent.change(screen.getByLabelText("Protocolo"), { target: { value: "fis-2026-000001" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "ERRADA" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await screen.findByText("Protocolo ou senha inválidos.");
    expect(consultarDenuncia).toHaveBeenCalledWith({ protocolo: "FIS-2026-000001", senha: "ERRADA" });
  });

  test("Imprimir PDF gera a versão pública (só movimentações públicas)", async () => {
    consultarDenuncia.mockResolvedValue(resposta);

    render(<ConsultaDenuncia />);
    fireEvent.change(screen.getByLabelText("Protocolo"), { target: { value: "FIS-2026-000042" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "K7Q29XMD" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    await screen.findByText("Vistoria marcada.");

    fireEvent.click(screen.getByRole("button", { name: "Imprimir PDF" }));

    await waitFor(() => expect(printFiscalizacaoPdf).toHaveBeenCalledTimes(1));
    const args = printFiscalizacaoPdf.mock.calls[0][0];
    expect(args.modo).toBe("publico");
    expect(args.fiscalizacao).toMatchObject({ protocolo: "FIS-2026-000042", resultado: "Pendente de apuração", assunto: "Falta de higiene" });
    expect(args.movimentacoes).toHaveLength(2);
    expect(args.movimentacoes.every((m) => m.publico === true)).toBe(true);
  });
});
