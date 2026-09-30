import { buildConclusionObs, queueErrorMessage } from "../../src/store/fetchActions/queues/queueErrors";

describe("queueErrorMessage", () => {
  test("erro de validação/regra devolve a mensagem do servidor e deixa claro que não gravou", () => {
    const message = queueErrorMessage({ response: { status: 422, data: { message: "The obs must not be greater than 1000 characters." } } }, "dar baixa");

    expect(message).toContain("The obs must not be greater than 1000 characters.");
    expect(message).toMatch(/NÃO foi (registrada|concluída)/i);
  });

  test("403 explica a falta de permissão", () => {
    const message = queueErrorMessage({ response: { status: 403, data: { message: "Você não possui permissão para executar esta ação." } } }, "dar baixa");

    expect(message).toContain("Você não possui permissão para executar esta ação.");
  });

  test("erro 500 não vaza detalhes técnicos e orienta o usuário", () => {
    const message = queueErrorMessage({ response: { status: 500, data: "<html>Whoops</html>" } }, "dar baixa");

    expect(message).not.toContain("<html>");
    expect(message).toMatch(/erro interno/i);
  });

  test("falha de rede: avisa que não dá para saber se gravou e manda conferir a lista", () => {
    const message = queueErrorMessage({ request: {}, message: "Network Error" }, "dar baixa");

    expect(message).toMatch(/conex/i);
    expect(message).toMatch(/atualiz/i);
  });

  test("erro sem resposta nem request ainda gera mensagem (sem 'undefined')", () => {
    expect(queueErrorMessage(new Error("boom"), "dar baixa")).not.toMatch(/undefined|null/);
    expect(queueErrorMessage(undefined, "dar baixa")).not.toMatch(/undefined|null/);
  });
});

describe("buildConclusionObs", () => {
  test("junta observação antiga e conclusão em maiúsculas", () => {
    expect(buildConclusionObs("antiga", "concluído ok")).toBe("antiga\nCONCLUÍDO OK");
  });

  test("nunca gera 'null' nem 'undefined'", () => {
    expect(buildConclusionObs(null, undefined)).toBe("");
    expect(buildConclusionObs(null, "fim")).toBe("FIM");
    expect(buildConclusionObs("antiga", "")).toBe("antiga");
    expect(buildConclusionObs(undefined, "  ")).toBe("");
  });
});
