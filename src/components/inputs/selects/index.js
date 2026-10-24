import React, { useEffect } from "react";
import { useDispatch } from 'react-redux';
import { CampoSelecao } from "../../ui/campos";
import { useUid } from "../../../lib/useUid";

export default function BasicSelect(props) {
  const {
    label,
    store,
    name,
    value,
    changeItem,
    getAllSelects,
    valueDefault,
    wd,
    disabled = false,
  } = props;
  const dispatch = useDispatch();
  const uid = useUid('select');
  const id = name || uid;

  useEffect(() => {
    getAllSelects ? dispatch(getAllSelects()) : '';
  }, [dispatch, getAllSelects]);

  // Ordenando o array store em ordem crescente pelo nome
  const sortedStore = [...store].sort((a, b) => a.name?.toString().localeCompare(b.name?.toString()));
  // O <select> nativo devolve texto; o MUI devolvia o id original (número). Quem usa espera o id original.
  const aoMudar = (e) => {
    const texto = e.target.value;
    const achado = sortedStore.find((d) => String(d.id) === texto);
    const original = achado ? achado.id : texto === '0' && valueDefault ? 0 : texto;
    changeItem({ ...e, target: { name: e.target.name, value: original } });
  };
  const semValor = value === '' || value === undefined || value === null;

  return (
    <div className="min-w-[120px]" style={wd ? { width: wd } : undefined}>
      <CampoSelecao id={id} label={label} obrigatorio name={name} value={semValor ? '' : value} disabled={disabled} onChange={aoMudar}>
        {semValor ? <option value="" disabled hidden /> : null}
        {valueDefault && <option key={0} value={0}>{valueDefault}</option>}
        {sortedStore.map((d) => (
          <option key={d.id} value={d.id}>{d.name?.toString().toUpperCase()}</option>
        ))}
      </CampoSelecao>
    </div>
  );
}
