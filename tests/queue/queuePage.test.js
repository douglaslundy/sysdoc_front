import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn() }, useRouter: () => ({ push: jest.fn(), pathname: "/queue" }) }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/modal/queue", () => () => null);
jest.mock("../../src/components/modal/outcomequeue", () => () => null);
jest.mock("../../src/components/queue/TreatmentPlanPanel", () => () => null);
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/reports/queues", () => jest.fn());
jest.mock("../../src/store/fetchActions/specialities", () => ({ getAllSpecialities: () => () => {} }));

const mockGetAllQueues = jest.fn(() => () => {});
jest.mock("../../src/store/fetchActions/queues", () => ({
  getAllQueues: (params) => mockGetAllQueues(params),
  inactiveQueue: jest.fn(),
  getQueueSpecialityOptions: () => () => {},
}));

import Queue from "../../src/components/queue";
import queuesReducer, { addQueues } from "../../src/store/ducks/queues";
import specialitiesReducer from "../../src/store/ducks/specialities";
import layoutReducer from "../../src/store/ducks/Layout";
import { AuthContext } from "../../src/contexts/AuthContext";

const row = {
  id: 7, uuid: "u", id_client: 1, id_specialities: 1, id_user: 1, position: 0, done: 1, urgency: 0,
  date_of_realized: "2026-05-08", obs: "", attachments_count: 0,
  created_at: "2026-03-05T12:00:00.000000Z",
  done_at: "2026-05-10T15:30:00.000000Z",
  client: { id: 1, name: "Paciente X", mother: "M", cpf: "1", cns: "2", phone: "3" },
  speciality: { id: 1, name: "Fisio" },
  user: { id: 1, name: "Operador" },
};

const renderPage = () => {
  const store = configureStore({
    reducer: { queues: queuesReducer, specialities: specialitiesReducer, layout: layoutReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  store.dispatch(addQueues([row]));
  return render(
    <Provider store={store}>
      <AuthContext.Provider value={{ profile: "admin", user: 1, myPermissions: [], permissionsLoaded: true }}>
        <Queue />
      </AuthContext.Provider>
    </Provider>
  );
};

const lastParams = () => mockGetAllQueues.mock.calls[mockGetAllQueues.mock.calls.length - 1][0];

// O componente de select usa id={name} no elemento com role=combobox.
const chooseOption = (name, optionText) => {
  fireEvent.mouseDown(document.getElementById(name));
  fireEvent.click(within(screen.getByRole("listbox")).getByText(optionText));
};

beforeEach(() => mockGetAllQueues.mockClear());

test("filtro padrão (não realizados): sem ordenação e primeira coluna com a data de entrada", async () => {
  renderPage();
  await waitFor(() => expect(mockGetAllQueues).toHaveBeenCalled());

  expect(lastParams()).not.toHaveProperty("sort_by");
  expect(lastParams()).not.toHaveProperty("date_from");
  expect(screen.queryByText("Ordenar por")).not.toBeInTheDocument();
  expect(screen.getByText(/05\/03\/2026/)).toBeInTheDocument();
});

test("filtro Realizado = SIM: mostra a data da baixa, as opções de ordenação e envia à API", async () => {
  renderPage();
  await waitFor(() => expect(mockGetAllQueues).toHaveBeenCalled());

  chooseOption("done", "SIM");

  await waitFor(() => expect(screen.getByText("Ordenar por")).toBeInTheDocument());
  expect(screen.getByText("Ordem")).toBeInTheDocument();
  expect(screen.getByText(/Baixa: 10\/05\/2026/)).toBeInTheDocument();
  expect(lastParams()).toMatchObject({ done: 1, sort_by: "done_at", sort_dir: "desc" });

  chooseOption("sortBy", "ID");
  await waitFor(() => expect(lastParams()).toMatchObject({ sort_by: "id" }));

  chooseOption("sortDir", "CRESCENTE");
  await waitFor(() => expect(lastParams()).toMatchObject({ sort_by: "id", sort_dir: "asc" }));
});
