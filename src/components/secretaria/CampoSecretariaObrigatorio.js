import React, { useContext, useEffect, useState } from "react";
import { ReactReduxContext } from "react-redux";
import { CampoSelecao } from "../ui/campos";

/**
 * Controle do campo "Secretaria" dos formulários de criação.
 * Só exige a escolha quando a secretaria ativa é 'all' (admin vendo todas); com uma
 * secretaria específica o back resolve sozinho e o campo nem o payload existem.
 * Lê o store por contexto (sem useSelector) para não quebrar telas montadas sem Provider.
 */
export function useSecretariaObrigatoria({ ativo = true } = {}) {
  const ctx = useContext(ReactReduxContext);
  const [estado, setEstado] = useState(() => ctx?.store.getState().secretaria);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!ctx) return undefined;
    const ler = () => setEstado(ctx.store.getState().secretaria);
    ler();
    return ctx.store.subscribe(ler);
  }, [ctx]);

  const exigir = Boolean(ativo) && estado?.ativa === "all";

  return {
    exigir,
    // telas de configuracao: so carrega/salva depois de escolher a secretaria (quando ativa = 'all')
    pronta: !exigir || Boolean(valor),
    lista: estado?.lista || [],
    valor,
    erro,
    setErro,
    escolher: (v) => { setValor(v); setErro(""); },
    limpar: () => { setValor(""); setErro(""); },
    validar: () => {
      if (exigir && !valor) {
        setErro("Selecione a secretaria.");
        return false;
      }
      return true;
    },
    payload: () => (exigir ? { secretaria_id: Number(valor) } : {}),
    // 422 `errors.secretaria_id` do back: mostra junto ao campo. Devolve true se tratou.
    tratarErro: (error) => {
      const m = error?.response?.data?.errors?.secretaria_id;
      const texto = Array.isArray(m) ? m[0] : m;
      if (!texto) return false;
      setErro(String(texto));
      return true;
    },
  };
}

export default function CampoSecretariaObrigatorio({ controle, id = "secretaria-id", label = "Secretaria" }) {
  if (!controle.exigir) return null;
  return (
    <CampoSelecao
      id={id}
      label={label}
      obrigatorio
      value={controle.valor}
      erro={controle.erro || undefined}
      onChange={(e) => controle.escolher(e.target.value)}
    >
      <option value="">Selecione a secretaria</option>
      {controle.lista.map((s) => (
        <option key={s.id} value={String(s.id)}>{s.nome}</option>
      ))}
    </CampoSelecao>
  );
}
