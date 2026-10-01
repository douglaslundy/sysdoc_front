import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockRouter;
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../src/services/peticaoPublica", () => ({
  registrarPeticao: jest.fn(),
  consultarPeticao: jest.fn(),
  listarMotivos: jest.fn(),
}));
jest.mock("../../src/reports/fiscalizacao", () => ({ printFiscalizacaoPdf: jest.fn() }));

import { registrarPeticao, consultarPeticao, listarMotivos } from "../../src/services/peticaoPublica";
import { printFiscalizacaoPdf } from "../../src/reports/fiscalizacao";
import Petition from "../../pages/petition";
import PetitionTrack from "../../pages/petition/track";

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter = { isReady: true, query: {}, push: jest.fn() };
  listarMotivos.mockResolvedValue([]);
});

const preencherObrigatorios = () => {
  fireEvent.change(screen.getByLabelText(/Assunto/), { target: { value: "Falta de higiene" } });
  fireEvent.change(screen.getByLabelText(/Descreva a petição/), { target: { value: "Alimentos expostos." } });
  fireEvent.change(screen.getByLabelText(/Local\/endereço/), { target: { value: "Rua das Flores, 100" } });
};

describe("página pública de petição", () => {
  test("identificação é opcional: envia só com os campos obrigatórios e mostra protocolo, senha e endereço de consulta", async () => {
    registrarPeticao.mockResolvedValue({
      protocolo: "FIS-2026-000042",
      senha: "K7Q29XMD",
      url_consulta: "https://sistema.gov.br/petition/track?protocolo=FIS-2026-000042",
    });

    render(<Petition />);
    expect(screen.getByLabelText(/Seu nome \(opcional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contato \(opcional\)/)).toBeInTheDocument();
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText("FIS-2026-000042");
    expect(screen.getByText("K7Q29XMD")).toBeInTheDocument();
    expect(screen.getByText("https://sistema.gov.br/petition/track?protocolo=FIS-2026-000042")).toBeInTheDocument();
    expect(screen.getByText(/guarde a senha/i)).toBeInTheDocument();

    const enviado = registrarPeticao.mock.calls[0][0];
    expect(enviado.get("assunto")).toBe("Falta de higiene");
    expect(enviado.get("local_endereco")).toBe("Rua das Flores, 100");
    expect(enviado.get("website")).toBe("");
    expect(enviado.get("denunciante_nome") || "").toBe("");
  });

  test("não envia sem os campos obrigatórios", async () => {
    render(<Petition />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText(/preencha o assunto, a descrição e o local/i);
    expect(registrarPeticao).not.toHaveBeenCalled();
  });

  test("mostra a mensagem do servidor quando o limite de envios é atingido", async () => {
    registrarPeticao.mockRejectedValue({ response: { status: 429, data: { message: "Muitas denúncias enviadas deste local." } } });

    render(<Petition />);
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText("Muitas denúncias enviadas deste local.");
    expect(screen.queryByText("K7Q29XMD")).not.toBeInTheDocument();
  });

  test("mostra os erros de validação por campo", async () => {
    registrarPeticao.mockRejectedValue({
      response: { status: 422, data: { message: "invalid", errors: { "files.0": ["Envie apenas fotos (JPG, PNG, WEBP) ou PDF."] } } },
    });

    render(<Petition />);
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText("Envie apenas fotos (JPG, PNG, WEBP) ou PDF.");
  });

  test("limita a 5 arquivos", async () => {
    render(<Petition />);
    const arquivos = Array.from({ length: 6 }, (_, i) => new File(["x"], `f${i}.jpg`, { type: "image/jpeg" }));

    fireEvent.change(screen.getByLabelText(/Fotos e arquivos/), { target: { files: arquivos } });

    await screen.findByText(/no máximo 5 arquivos/i);
  });

  test("campo isca existe, é invisível para pessoas e vai vazio", () => {
    render(<Petition />);
    const isca = document.querySelector('input[name="website"]');

    expect(isca).toBeInTheDocument();
    expect(isca).toHaveAttribute("tabindex", "-1");
    expect(isca.closest("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("motivo da petição", () => {
  const motivos = [
    { id: 1, nome: "Denúncia", descricao: "Irregularidade sanitária" },
    { id: 2, nome: "Solicitar vistoria", descricao: null },
  ];

  test("mostra os motivos ativos em um select e envia o escolhido", async () => {
    listarMotivos.mockResolvedValue(motivos);
    registrarPeticao.mockResolvedValue({ protocolo: "FIS-2026-000050", senha: "ABCD2345", url_consulta: "https://x/petition/track?protocolo=FIS-2026-000050" });

    render(<Petition />);
    const select = await screen.findByLabelText(/Motivo da petição/);
    expect(screen.getByRole("option", { name: "Solicitar vistoria" })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "2" } });
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText("FIS-2026-000050");
    expect(registrarPeticao.mock.calls[0][0].get("motivo_id")).toBe("2");
  });

  test("com motivos cadastrados, não envia sem escolher o motivo", async () => {
    listarMotivos.mockResolvedValue(motivos);

    render(<Petition />);
    await screen.findByLabelText(/Motivo da petição/);
    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));

    await screen.findByText(/escolha o motivo da petição/i);
    expect(registrarPeticao).not.toHaveBeenCalled();
  });

  test("sem motivos cadastrados, o select não aparece e o envio segue normal", async () => {
    listarMotivos.mockResolvedValue([]);
    registrarPeticao.mockResolvedValue({ protocolo: "FIS-2026-000051", senha: "ABCD2345", url_consulta: "https://x" });

    render(<Petition />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(listarMotivos).toHaveBeenCalled();
    expect(screen.queryByLabelText(/Motivo da petição/)).not.toBeInTheDocument();

    preencherObrigatorios();
    fireEvent.click(screen.getByRole("button", { name: "Enviar petição" }));
    await screen.findByText("FIS-2026-000051");
  });
});

describe("página pública de acompanhamento", () => {
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
    consultarPeticao.mockResolvedValue(resposta);

    render(<PetitionTrack />);
    expect(screen.getByLabelText("Protocolo")).toHaveValue("FIS-2026-000042");

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "K7Q29XMD" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await screen.findByText("Vistoria marcada.");
    expect(consultarPeticao).toHaveBeenCalledWith({ protocolo: "FIS-2026-000042", senha: "K7Q29XMD" });
    expect(screen.getByText("Pendente de apuração")).toBeInTheDocument();
    expect(screen.getByText("Mensagem ao denunciante")).toBeInTheDocument();
  });

  test("protocolo ou senha inválidos mostram uma mensagem única", async () => {
    consultarPeticao.mockRejectedValue({ response: { status: 404, data: { error: "Protocolo ou senha inválidos." } } });

    render(<PetitionTrack />);
    fireEvent.change(screen.getByLabelText("Protocolo"), { target: { value: "fis-2026-000001" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "ERRADA" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    await screen.findByText("Protocolo ou senha inválidos.");
    expect(consultarPeticao).toHaveBeenCalledWith({ protocolo: "FIS-2026-000001", senha: "ERRADA" });
  });

  test("Imprimir PDF gera a versão pública (só movimentações públicas)", async () => {
    consultarPeticao.mockResolvedValue(resposta);

    render(<PetitionTrack />);
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
