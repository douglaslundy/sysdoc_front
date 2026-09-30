import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/inputs/datePicker", () => ({ label }) => <input aria-label={label} />);
jest.mock("../../src/components/actions", () => ({
  ActionCreateFab: ({ title }) => <button aria-label={title}>add</button>,
}));

import QueueActionsGroup from "../../src/components/queue/QueueActionsGroup";

const base = {
  doneFrom: "2026-09-01",
  doneTo: "2026-09-30",
  onChangeFrom: jest.fn(),
  onChangeTo: jest.fn(),
  onPrint: jest.fn(),
  onAdd: jest.fn(),
  onAgenda: jest.fn(),
  isPrinting: false,
  controlSx: {},
  fabControlSx: {},
};

test("filtro Realizados: esconde a Agenda de Tratamentos e mostra os datepickers", () => {
  render(<QueueActionsGroup {...base} isDone />);

  expect(screen.queryByText(/agenda de tratamentos/i)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Baixa de")).toBeInTheDocument();
  expect(screen.getByLabelText("Baixa até")).toBeInTheDocument();
});

test("outros filtros: mostra a Agenda e não mostra datepickers", () => {
  render(<QueueActionsGroup {...base} isDone={false} />);

  expect(screen.getByText(/agenda de tratamentos/i)).toBeInTheDocument();
  expect(screen.queryByLabelText("Baixa de")).not.toBeInTheDocument();
});

test("datepickers, imprimir e adicionar ficam no mesmo grupo (mesma linha)", () => {
  render(<QueueActionsGroup {...base} isDone />);

  const group = screen.getByTestId("queue-actions-group");
  expect(group).toContainElement(screen.getByLabelText("Baixa de"));
  expect(group).toContainElement(screen.getByLabelText("Baixa até"));
  expect(group).toContainElement(screen.getByLabelText("imprimir"));
  expect(group).toContainElement(screen.getByLabelText("inserir na fila"));
  expect(group).toHaveStyle({ flexWrap: "nowrap" });
});
