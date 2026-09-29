import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn() }, useRouter: () => ({ push: jest.fn() }) }));
jest.mock("../../../store/fetchActions/models", () => ({ getAllModels: () => () => {} }));
jest.mock("../../modal/model/view", () => () => null);
jest.mock("../../messagesModal", () => () => null);
jest.mock("feather-icons-react", () => () => null);

import Models from "../index";
import modelsReducer, { addModels } from "../../../store/ducks/models";
import { AuthContext } from "../../../contexts/AuthContext";

const makeStore = (models) => {
  const store = configureStore({ reducer: { models: modelsReducer } });
  store.dispatch(addModels(models));
  return store;
};

const renderPage = (models) =>
  render(
    <Provider store={makeStore(models)}>
      <AuthContext.Provider value={{ profile: "admin" }}>
        <Models />
      </AuthContext.Provider>
    </Provider>
  );

test("lista modelos normalmente", () => {
  renderPage([
    { id: 1, user: { name: "Maria" }, created_at: "2026-01-02T10:00:00Z", sender: "a", recipient: "b", summary: "resumo", model: "texto" },
  ]);
  expect(screen.getByText("MARIA")).toBeInTheDocument();
});

test("nao quebra quando o modelo nao tem usuario, data ou textos", () => {
  renderPage([
    { id: 2, user: null, created_at: null, sender: null, recipient: null, summary: null, model: null },
    { id: 3, created_at: "data-invalida", sender: 123 },
  ]);
  expect(screen.getByText(/Foram gerados 2 Modelos/)).toBeInTheDocument();
});
