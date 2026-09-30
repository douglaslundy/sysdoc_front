import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), pathname: "/" }) }));
jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn() } }));

import { api } from "../../src/services/api";
import ProtocolBell from "../../src/components/protocolo/ProtocolBell";
import { AuthContext } from "../../src/contexts/AuthContext";

const renderBell = (auth) =>
  render(
    <AuthContext.Provider value={{ permissionsLoaded: true, profile: "user", myPermissions: [], authorizedPages: [], ...auth }}>
      <ProtocolBell />
    </AuthContext.Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: { novos: 2, vence_em_breve: 0, vencidos: 0, recentes: [] } });
});

test("quem não tem página de protocolo não consulta a API nem vê o sino", async () => {
  const { container } = renderBell({ myPermissions: ["/queue", "/clients"] });

  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(api.get).not.toHaveBeenCalled();
  expect(container).toBeEmptyDOMElement();
});

test("quem tem alguma página de protocolo consulta os contadores", async () => {
  renderBell({ myPermissions: ["/protocolo/caixa-entrada"] });

  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/protocolos/contadores"));
});

test("administrador sempre consulta", async () => {
  renderBell({ profile: "admin" });

  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/protocolos/contadores"));
});

test("páginas liberadas vindas de authorizedPages também valem", async () => {
  renderBell({ authorizedPages: [{ ativo: true, path: "/protocolo" }] });

  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
});
