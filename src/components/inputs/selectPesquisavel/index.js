import React, { useMemo, useState } from "react";
import { Combobox } from "../../ui/combobox";
import { Label } from "../../ui/campos";
import { useUid } from "../../../lib/useUid";

const normalizar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Mesmo contrato do inputs/selects (label, store, name, value, changeItem), mas com campo de pesquisa:
 * a lista filtra conforme o usuário digita. `chaveBusca(item)` define o texto pesquisado (padrão: name).
 */
export default function SelectPesquisavel({ label, store = [], name, value, changeItem, chaveBusca, wd, disabled = false }) {
  const id = useUid("selpesq");
  const [consulta, setConsulta] = useState("");
  const buscaDe = chaveBusca || ((d) => d.name);

  const ordenado = useMemo(
    () => [...store].sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""))),
    [store]
  );
  const opcoes = useMemo(() => {
    const q = normalizar(consulta.trim());
    return q ? ordenado.filter((d) => normalizar(buscaDe(d)).includes(q)) : ordenado;
  }, [ordenado, consulta]);

  const selecionado = useMemo(
    () => ordenado.find((d) => String(d.id) === String(value)) || null,
    [ordenado, value]
  );

  return (
    <div className="min-w-[120px] space-y-1" style={wd ? { width: wd } : undefined}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        id={id}
        rotulo={label}
        opcoes={opcoes}
        selecionado={selecionado}
        aoDigitar={setConsulta}
        aoSelecionar={(d) => {
          setConsulta("");
          if (d) changeItem({ target: { name, value: d.id } });
        }}
        rotuloDaOpcao={(d) => String(d.name ?? "").toUpperCase()}
        vazio="Nenhum resultado."
        disabled={disabled}
      />
    </div>
  );
}
