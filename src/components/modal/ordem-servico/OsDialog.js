import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../../lib/mensagemDeErro";
import { criarOs, listarTipos, secretariasDeOs, tecnicosDeOs } from "../../../services/ordemServico";
import CampoFotos from "../../iluminacao/CampoFotos";
import CapturaLocalizacao from "../../iluminacao/CapturaLocalizacao";
import { PRIORIDADES } from "../../ordem-servico/StatusOs";
import { Banner } from "../../ui/banner";
import { FormularioModal } from "../../ui/formulario-modal";

const VAZIO = {
  secretaria_id: "", tipo_servico_id: "", tecnico_id: "", local: "", endereco: "", descricao: "", problema: "",
  prioridade: "normal", prazo_dias: "", contato_nome: "", contato_telefone: "",
};

/** Abertura de OS: escolhe a secretaria destino, o tipo (da secretaria) e, se permitido, o técnico. */
export default function OsDialog({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(VAZIO);
  const [secretarias, setSecretarias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState({ permitido: false, tecnicos: [] });
  const [coords, setCoords] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(VAZIO); setCoords(null); setFotos([]); setErro(""); setTipos([]); setTecnicos({ permitido: false, tecnicos: [] });
    // O back já devolve só as secretarias do usuário (todas, para o admin); com uma só, ela vem preenchida.
    secretariasDeOs().then((lista) => {
      setSecretarias(lista);
      if (lista.length === 1) setForm((f) => ({ ...f, secretaria_id: lista[0].id }));
    }).catch(() => setErro("Não foi possível carregar as secretarias."));
  }, [open]);

  useEffect(() => {
    if (!open || !form.secretaria_id) { setTipos([]); setTecnicos({ permitido: false, tecnicos: [] }); return; }
    listarTipos(form.secretaria_id).then(setTipos).catch(() => setTipos([]));
    tecnicosDeOs(form.secretaria_id).then(setTecnicos).catch(() => setTecnicos({ permitido: false, tecnicos: [] }));
  }, [open, form.secretaria_id]);

  const aoMudar = ({ target: { name, value } }) =>
    setForm((f) => ({ ...f, [name]: value, ...(name === "secretaria_id" ? { tipo_servico_id: "", tecnico_id: "" } : {}) }));

  const campos = [
    { name: "secretaria_id", label: "Secretaria", required: true, options: secretarias.map((s) => ({ value: s.id, label: s.nome })), disabled: secretarias.length === 1, span: 6 },
    { name: "tipo_servico_id", label: "Tipo de serviço", required: true, options: tipos.map((t) => ({ value: t.id, label: t.nome })), disabled: !form.secretaria_id, span: 6 },
    ...(tecnicos.permitido ? [{ name: "tecnico_id", label: "Técnico (opcional)", options: tecnicos.tecnicos.map((t) => ({ value: t.id, label: t.name })), vazio: "Deixar para a secretaria", span: 6, dica: tecnicos.tecnicos.length === 0 ? "Nenhum técnico disponível: o usuário precisa ter o perfil Técnico (principal ou adicional), estar ativo e vinculado à secretaria desta OS." : undefined }] : []),
    { name: "prioridade", label: "Prioridade", options: PRIORIDADES, span: tecnicos.permitido ? 3 : 6 },
    { name: "prazo_dias", label: "Prazo (dias)", type: "number", span: tecnicos.permitido ? 3 : 6, dica: "Dias corridos a partir de hoje. Em branco: 10 dias." },
    { name: "local", label: "Local", required: true, max: 160 },
    { name: "endereco", label: "Endereço", max: 255 },
    { name: "descricao", label: "O que deve ser feito", required: true, rows: 3, max: 5000 },
    { name: "problema", label: "Problema constatado", rows: 3, max: 5000 },
    { name: "contato_nome", label: "Contato no local", max: 120, span: 6 },
    { name: "contato_telefone", label: "Telefone do contato", max: 30, span: 6 },
  ];

  const gravar = async () => {
    setSalvando(true);
    setErro("");
    const posicao = coords ? { latitude: coords.lat, longitude: coords.lng } : {};
    try {
      onSuccess && onSuccess(await criarOs({ ...form, ...posicao }, fotos));
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível abrir a OS."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <FormularioModal
      aberto={open}
      titulo="Nova ordem de serviço"
      aoFechar={onClose}
      aoGravar={gravar}
      campos={campos}
      valores={form}
      aoMudar={aoMudar}
      gravando={salvando}
      rotuloGravar="Abrir OS"
      antes={erro ? <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div> : null}
      depois={(
        <div className="mt-4 space-y-4">
          <CapturaLocalizacao valor={coords} aoCapturar={setCoords} desabilitado={salvando} />
          <CampoFotos fotos={fotos} aoMudar={setFotos} max={6} desabilitado={salvando} />
        </div>
      )}
    />
  );
}
