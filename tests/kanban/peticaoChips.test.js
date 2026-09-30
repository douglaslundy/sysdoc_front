import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import PeticaoChips from "../../src/components/kanban/PeticaoChips";

const item = {
  id: 5,
  titulo: "Petição FIS-2026-000050 — Solicitar vistoria",
  unit: { id: 2, nome: "Vigilância Sanitária" },
  fiscalizacao: { id: 9, protocolo: "FIS-2026-000050" },
};

test("mostra a unidade responsável e o protocolo da petição", () => {
  render(<PeticaoChips item={item} onOpen={jest.fn()} />);

  expect(screen.getByText("Vigilância Sanitária")).toBeInTheDocument();
  expect(screen.getByText("FIS-2026-000050")).toBeInTheDocument();
});

test("Abrir fiscalização chama onOpen com o protocolo", () => {
  const onOpen = jest.fn();
  render(<PeticaoChips item={item} onOpen={onOpen} />);

  fireEvent.click(screen.getByRole("button", { name: "Abrir fiscalização" }));

  expect(onOpen).toHaveBeenCalledWith("FIS-2026-000050");
});

test("card comum (sem fiscalização) não renderiza nada", () => {
  const { container } = render(<PeticaoChips item={{ id: 1, titulo: "Tarefa" }} onOpen={jest.fn()} />);

  expect(container).toBeEmptyDOMElement();
});
