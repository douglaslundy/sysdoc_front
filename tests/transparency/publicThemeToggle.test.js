import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("feather-icons-react", () => ({ icon }) => <span data-testid="icon">{icon}</span>);
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn().mockResolvedValue({ data: { items: [], reference_date: '', reference_month: '', last_update_at: null } }) } }));

import { ColorModeContext } from "../../src/contexts/ThemeContext";
import PublicThemeToggle from "../../src/components/transparency/PublicThemeToggle";
import MedicinesPublic from "../../src/components/transparency/medicinesPublic";
import MedicinesPanel from "../../src/components/transparency/medicinesPanel";
import MedicinesMonthlyPublic from "../../src/components/transparency/medicinesMonthlyPublic";

const withMode = (mode, toggleColorMode, ui) =>
  render(<ColorModeContext.Provider value={{ mode, toggleColorMode }}>{ui}</ColorModeContext.Provider>);

test("no tema escuro oferece o modo claro e alterna ao clicar", () => {
  const toggle = jest.fn();
  withMode("dark", toggle, <PublicThemeToggle />);

  const button = screen.getByRole("button", { name: /alternar tema/i });
  expect(screen.getByTestId("icon")).toHaveTextContent("sun");

  fireEvent.click(button);
  expect(toggle).toHaveBeenCalledTimes(1);
});

test("no tema claro oferece o modo escuro", () => {
  withMode("light", jest.fn(), <PublicThemeToggle />);

  expect(screen.getByTestId("icon")).toHaveTextContent("moon");
});

test.each([
  ["consulta pública", MedicinesPublic],
  ["painel", MedicinesPanel],
  ["aquisições mensais", MedicinesMonthlyPublic],
])("a página de transparência (%s) tem o botão de tema", async (_nome, Page) => {
  withMode("dark", jest.fn(), <Page />);

  expect(await screen.findByRole("button", { name: /alternar tema/i })).toBeInTheDocument();
});
