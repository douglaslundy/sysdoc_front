import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("feather-icons-react", () => () => null);
jest.mock("../../src/components/charts/ApexChartSafe", () => () => null);
jest.mock("../../src/services/api", () => ({ api: { get: jest.fn() } }));

import { api } from "../../src/services/api";
import VigilanciaDashboard from "../../src/components/dashboard/VigilanciaDashboard";

const base = {
  totais: { estabelecimentos: 10, alvaras: 8, vigentes: 5, vencidos: 2, a_vencer: 1, vencendo_em_30: 1 },
  por_status: {}, por_nivel_risco: {}, por_mes: {}, proximos_vencimentos: [],
};

// O card é: <h6 titulo> + <h3 valor>. Procura o valor irmão do título.
const valorDo = async (titulo) => {
  const label = await screen.findByText(titulo);
  return label.parentElement.querySelector("h3").textContent;
};

test("mostra os indicadores de fiscalizações", async () => {
  api.get.mockResolvedValue({
    data: { ...base, fiscalizacoes: { no_ano: 42, no_mes: 7, denuncias_pendentes: 3, autos_infracao_ano: 5 } },
  });

  render(<VigilanciaDashboard />);

  expect(await valorDo("Fiscalizações no ano")).toBe("42");
  expect(await valorDo("Fiscalizações no mês")).toBe("7");
  expect(await valorDo("Denúncias pendentes")).toBe("3");
  expect(await valorDo("Autos de infração no ano")).toBe("5");
});

test("continua mostrando os totais de alvarás", async () => {
  api.get.mockResolvedValue({ data: { ...base, fiscalizacoes: { no_ano: 0, no_mes: 0, denuncias_pendentes: 0, autos_infracao_ano: 0 } } });

  render(<VigilanciaDashboard />);

  expect(await valorDo("Estabelecimentos")).toBe("10");
  expect(await valorDo("Vencidos")).toBe("2");
});

test("resposta sem o bloco de fiscalizações (cache antigo) não quebra e mostra zero", async () => {
  api.get.mockResolvedValue({ data: base });

  render(<VigilanciaDashboard />);

  expect(await valorDo("Fiscalizações no ano")).toBe("0");
  expect(await valorDo("Denúncias pendentes")).toBe("0");
});
