import { Pilula } from "../ui/pilula";

export const STATUS_POSTE = {
  pendente: { rotulo: "Pendente", tom: "alerta" },
  aguardando: { rotulo: "Aguardando", tom: "info" },
  nao_concluido: { rotulo: "Não concluído", tom: "perigo" },
  concluido: { rotulo: "Concluído", tom: "sucesso" },
};

export function StatusPoste({ status }) {
  const { rotulo, tom } = STATUS_POSTE[status] || { rotulo: status || "—", tom: "neutro" };
  return <Pilula tom={tom}>{rotulo}</Pilula>;
}
