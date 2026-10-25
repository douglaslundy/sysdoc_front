import GaleriaFotos from "./GaleriaFotos";
import { STATUS_POSTE } from "./StatusPoste";

const ACAO = {
  cadastro: "Cadastro do poste",
  edicao: "Edição dos dados",
  desfecho: "Desfecho",
  reabertura: "Reaberto pelo administrador",
  inativacao: "Poste excluído",
};

const rotuloStatus = (s) => STATUS_POSTE[s]?.rotulo || s;

/** Linha do tempo do poste (da mais antiga para a mais nova), com motivo e fotos de cada desfecho. */
export default function HistoricoPoste({ posteId, itens }) {
  if (!itens || itens.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>;

  return (
    <ol className="space-y-4">
      {itens.map((m) => (
        <li key={m.id} className="border-l-2 border-border pl-4">
          <p className="text-sm font-bold">{ACAO[m.acao] || m.acao}</p>
          <p className="text-xs text-muted-foreground">
            {m.user?.name || "Usuário removido"} · {m.created_at ? new Date(m.created_at).toLocaleString("pt-BR") : "—"}
          </p>
          {m.status_anterior || m.status_novo ? (
            <p className="mt-1 text-sm">
              <span>{rotuloStatus(m.status_anterior)} → {rotuloStatus(m.status_novo)}</span>
            </p>
          ) : null}
          {m.motivo ? <p className="mt-1 text-sm break-words">Motivo: {m.motivo}</p> : null}
          {m.fotos?.length ? (
            <div className="mt-2">
              <GaleriaFotos posteId={posteId} fotos={m.fotos} descricao={`${(ACAO[m.acao] || m.acao).toLowerCase()} do poste`} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
