import { Pilula } from "../ui/pilula";

export const STATUS_OUVIDORIA = {
  recebida: { rotulo: "Recebida", tom: "alerta" },
  em_analise: { rotulo: "Em análise", tom: "info" },
  encaminhada: { rotulo: "Encaminhada", tom: "info" },
  respondida: { rotulo: "Respondida", tom: "sucesso" },
  encerrada: { rotulo: "Encerrada", tom: "neutro" },
  arquivada: { rotulo: "Arquivada", tom: "neutro" },
};

export function StatusOuvidoria({ status }) {
  const { rotulo, tom } = STATUS_OUVIDORIA[status] || { rotulo: status || "—", tom: "neutro" };
  return <Pilula tom={tom}>{rotulo}</Pilula>;
}

export default StatusOuvidoria;
