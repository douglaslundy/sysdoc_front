jest.mock("../../src/services/api", () => ({ api: { get: jest.fn() } }));

import { api } from "../../src/services/api";
import qrlogReducer, { addQrCodeLogs, setQrCodeLogsTotal } from "../../src/store/ducks/qrcodelogs";
import { getAllQrCodeLogs } from "../../src/store/fetchActions/qrcodelogs";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("pede ao servidor a página e o tamanho (page é 1-based)", async () => {
  api.get.mockResolvedValue({ data: { data: [{ id: 7 }], total: 41 } });
  const dispatch = jest.fn();

  getAllQrCodeLogs({ page: 2, perPage: 10 })(dispatch);
  await flush();

  expect(api.get).toHaveBeenCalledWith("/qrcode-logs", { params: { page: 3, per_page: 10 } });
  expect(dispatch).toHaveBeenCalledWith(addQrCodeLogs([{ id: 7 }]));
  expect(dispatch).toHaveBeenCalledWith(setQrCodeLogsTotal(41));
});

test("reducer guarda o total informado pelo servidor", () => {
  const state = qrlogReducer(undefined, setQrCodeLogsTotal(41));

  expect(state.total).toBe(41);
});
