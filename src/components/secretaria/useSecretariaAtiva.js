import { useContext, useEffect, useState } from "react";
import { ReactReduxContext } from "react-redux";

/** Secretaria ativa ('all' | id em string | null). Lê o store por contexto, sem useSelector. */
export default function useSecretariaAtiva() {
  const ctx = useContext(ReactReduxContext);
  const [ativa, setAtiva] = useState(() => ctx?.store.getState().secretaria?.ativa ?? null);
  useEffect(() => {
    if (!ctx) return undefined;
    const ler = () => setAtiva(ctx.store.getState().secretaria?.ativa ?? null);
    ler();
    return ctx.store.subscribe(ler);
  }, [ctx]);
  return ativa;
}
