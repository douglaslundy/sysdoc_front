import { Pilula } from "../ui/pilula";

export const STATUS_OS = {
  aberta: { rotulo: "Aberta", tom: "alerta" },
  atribuida: { rotulo: "Atribuída", tom: "info" },
  em_atendimento: { rotulo: "Em atendimento", tom: "info" },
  concluida: { rotulo: "Concluída", tom: "sucesso" },
  cancelada: { rotulo: "Cancelada", tom: "neutro" },
};

export const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export function StatusOs({ status }) {
  const { rotulo, tom } = STATUS_OS[status] || { rotulo: status || "—", tom: "neutro" };
  return <Pilula tom={tom}>{rotulo}</Pilula>;
}
