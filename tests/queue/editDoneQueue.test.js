jest.mock("../../src/services/api", () => ({ api: { put: jest.fn(), delete: jest.fn() } }));

import { api } from "../../src/services/api";
import { editDoneQueue, inactiveQueueFetch } from "../../src/store/fetchActions/queues";
import { editQueue, inactiveQueue } from "../../src/store/ducks/queues";
import { addAlertMessage } from "../../src/store/ducks/Layout";

const queue = { id: 7, obs: "antiga", obsConclusion: "feito", date_of_realized: "2026-09-30" };

const run = (thunk, dispatch = jest.fn()) => {
  thunk(dispatch);
  return dispatch;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => jest.clearAllMocks());

describe("editDoneQueue", () => {
  test("envia done=true, data e observação montada com segurança", async () => {
    api.put.mockResolvedValue({ data: { data: { id: 7, done: 1 } } });

    run(editDoneQueue(queue, jest.fn(), {}));
    await flush();

    const sent = api.put.mock.calls[0][1];
    expect(api.put.mock.calls[0][0]).toBe("/queues/7");
    expect(sent).toMatchObject({ done: true, date_of_realized: "2026-09-30", obs: "antiga\nFEITO" });
  });

  test("sem observação antiga nem conclusão não grava 'null' nem 'undefined'", async () => {
    api.put.mockResolvedValue({ data: { id: 7 } });

    run(editDoneQueue({ id: 7, obs: null }, jest.fn(), {}));
    await flush();

    expect(api.put.mock.calls[0][1].obs).toBe("");
  });

  test("sucesso atualiza a lista, fecha o formulário e avisa quem chamou", async () => {
    api.put.mockResolvedValue({ data: { data: { id: 7, done: 1 } } });
    const cleanForm = jest.fn();
    const onSaved = jest.fn();

    const dispatch = run(editDoneQueue(queue, cleanForm, { onSaved }));
    await flush();

    expect(dispatch).toHaveBeenCalledWith(editQueue({ id: 7, done: 1 }));
    expect(cleanForm).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  test("erro do servidor chama onError com mensagem clara e NÃO fecha o formulário", async () => {
    api.put.mockRejectedValue({ response: { status: 422, data: { message: "Dados inválidos." } } });
    const cleanForm = jest.fn();
    const onError = jest.fn();

    const dispatch = run(editDoneQueue(queue, cleanForm, { onError }));
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toContain("Dados inválidos.");
    expect(cleanForm).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: addAlertMessage.type }));
  });

  test("sem onError mantém o comportamento antigo (mensagem global)", async () => {
    api.put.mockRejectedValue({ response: { status: 500, data: {} } });

    const dispatch = run(editDoneQueue(queue, jest.fn()));
    await flush();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: addAlertMessage.type }));
  });

  test("falha só na atualização da tela depois de gravar não é reportada como erro de gravação", async () => {
    api.put.mockResolvedValue({ data: { data: { id: 7, done: 1 } } });
    const cleanForm = jest.fn();
    const onSaved = jest.fn();
    const onError = jest.fn();
    const dispatch = jest.fn((action) => {
      if (action?.type === editQueue.type) throw new Error("falha de UI");
    });

    run(editDoneQueue(queue, cleanForm, { onSaved, onError }), dispatch);
    await flush();

    expect(onError).not.toHaveBeenCalled();
    expect(cleanForm).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

describe("inactiveQueueFetch", () => {
  test("sucesso remove da lista", async () => {
    api.delete.mockResolvedValue({ data: {} });

    const dispatch = run(inactiveQueueFetch({ id: 3 }));
    await flush();

    expect(dispatch).toHaveBeenCalledWith(inactiveQueue({ id: 3 }));
  });

  test("erro sem resposta (rede) não quebra e usa onError", async () => {
    api.delete.mockRejectedValue({ request: {}, message: "Network Error" });
    const onError = jest.fn();

    run(inactiveQueueFetch({ id: 3 }, { onError }));
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatch(/conex/i);
  });
});
