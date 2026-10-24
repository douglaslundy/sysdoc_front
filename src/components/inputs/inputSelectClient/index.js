import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../services/api";
import { Combobox } from "../../ui/combobox";
import { Label } from "../../ui/campos";
import { useUid } from "../../../lib/useUid";

export default function InputSelectClient(props) {
  const [remoteClients, setRemoteClients] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const searchRef = useRef(null);
  const { label, setClient, clients, wd, value } = props;
  const id = useUid("cliente");
  const safeClients = Array.isArray(clients) ? clients : [];
  const options = remoteClients.length > 0 ? remoteClients : safeClients;

  const selectedClient = useMemo(
    () => options.find((cli) => Number(cli.id) === Number(value)) || null,
    [options, value]
  );

  useEffect(() => {
    setRemoteClients(safeClients);
  }, [safeClients]);

  useEffect(() => () => clearTimeout(searchRef.current), []);

  // Busca no servidor enquanto o usuário digita (com espera de 350ms).
  const buscar = (texto) => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setCarregando(true);
      api.get("/clients/select", { params: { search: texto || undefined, limit: 50 } })
        .then((res) => setRemoteClients(res.data || []))
        .catch(() => {})
        .finally(() => setCarregando(false));
    }, 350);
  };

  return (
    <div className="space-y-1" style={wd ? { width: wd } : undefined}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        id={id}
        rotulo={label}
        opcoes={options}
        selecionado={selectedClient}
        aoDigitar={buscar}
        aoSelecionar={(c) => setClient(c || {})}
        carregando={carregando}
        vazio="Cliente inexistente!!!"
        rotuloDaOpcao={(option) => `${(option.name || "").toUpperCase()} ${option.cns || ''} ${option.cpf || ''} ${option.phone || ''}`}
      />
    </div>
  );
}
