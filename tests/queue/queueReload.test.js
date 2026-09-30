import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn() }, useRouter: () => ({ push: jest.fn(), pathname: "/queue" }) }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/modal/queue", () => () => null);
jest.mock("../../src/components/queue/TreatmentPlanPanel", () => () => null);
jest.mock("../../src/components/messagesModal", () => () => null);
jest.mock("../../src/reports/queues", () => jest.fn());
jest.mock("../../src/store/fetchActions/specialities", () => ({ getAllSpecialities: () => () => {} }));
// Modal de baixa simulado: expõe um botão que chama onSaved, como o real faz após gravar.
jest.mock("../../src/components/modal/outcomequeue", () => (props) => (
  <button onClick={() => props.onSaved && props.onSaved({ id: 7 })}>simular-baixa-gravada</button>
));

const mockGetAllQueues = jest.fn(() => () => {});
jest.mock("../../src/store/fetchActions/queues", () => ({
  getAllQueues: (params) => mockGetAllQueues(params),
  inactiveQueueFetch: jest.fn(),
  getQueueSpecialityOptions: () => () => {},
}));

import Queue from "../../src/components/queue";
import queuesReducer, { addQueues } from "../../src/store/ducks/queues";
import specialitiesReducer from "../../src/store/ducks/specialities";
import layoutReducer, { openOutcomeQueueModal } from "../../src/store/ducks/Layout";
import { AuthContext } from "../../src/contexts/AuthContext";

const renderPage = () => {
  const store = configureStore({
    reducer: { queues: queuesReducer, specialities: specialitiesReducer, layout: layoutReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  store.dispatch(addQueues([]));
  store.dispatch(openOutcomeQueueModal());
  return render(
    <Provider store={store}>
      <AuthContext.Provider value={{ profile: "admin", user: 1, myPermissions: [], permissionsLoaded: true }}>
        <Queue />
      </AuthContext.Provider>
    </Provider>
  );
};

const chooseOption = (name, optionText) => {
  fireEvent.mouseDown(document.getElementById(name));
  fireEvent.click(within(screen.getByRole("listbox")).getByText(optionText));
};

beforeEach(() => mockGetAllQueues.mockClear());

test("depois de gravar a baixa a lista é recarregada com o filtro atual (o item sai da lista de pendentes)", async () => {
  renderPage();
  await waitFor(() => expect(mockGetAllQueues).toHaveBeenCalled());
  const chamadasIniciais = mockGetAllQueues.mock.calls.length;

  fireEvent.click(screen.getByText("simular-baixa-gravada"));

  await waitFor(() => expect(mockGetAllQueues.mock.calls.length).toBe(chamadasIniciais + 1));
  const ultima = mockGetAllQueues.mock.calls[mockGetAllQueues.mock.calls.length - 1][0];
  expect(ultima).toMatchObject({ done: 0, page: 1 });
});

test("o recarregamento respeita o filtro de realizados e a ordenação escolhidos", async () => {
  renderPage();
  await waitFor(() => expect(mockGetAllQueues).toHaveBeenCalled());
  chooseOption("done", "SIM");
  await waitFor(() => expect(mockGetAllQueues.mock.calls[mockGetAllQueues.mock.calls.length - 1][0]).toMatchObject({ done: 1 }));
  const antes = mockGetAllQueues.mock.calls.length;

  fireEvent.click(screen.getByText("simular-baixa-gravada"));

  await waitFor(() => expect(mockGetAllQueues.mock.calls.length).toBe(antes + 1));
  expect(mockGetAllQueues.mock.calls[mockGetAllQueues.mock.calls.length - 1][0]).toMatchObject({
    done: 1, sort_by: "done_at", sort_dir: "desc",
  });
});
