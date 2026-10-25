import { useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "../../../lib/mensagemDeErro";
import { novoUuid } from "../../../lib/uuid";
import { atualizarPoste, criarPoste } from "../../../services/iluminacaoPostes";
import CampoFotos from "../../iluminacao/CampoFotos";
import CapturaLocalizacao, { PRECISAO_MAXIMA_M } from "../../iluminacao/CapturaLocalizacao";
import { Banner } from "../../ui/banner";
import { FormularioModal } from "../../ui/formulario-modal";

const VAZIO = { ponto_referencia: "", logradouro: "", numero: "", bairro: "" };
const CHAVE_RASCUNHO = "iluminacao.rascunho";

const CAMPOS = [
  { name: "ponto_referencia", label: "Ponto de referência", required: true, max: 160 },
  { name: "logradouro", label: "Rua", required: true, max: 160, span: 8 },
  { name: "numero", label: "Número", max: 20, span: 4, dica: "Use S/N se não houver número." },
  { name: "bairro", label: "Bairro", required: true, max: 100 },
];

// Rascunho só do texto, em localStorage (pode falhar em janela privada); fotos nunca.
const lerRascunho = () => {
  try {
    return { ...VAZIO, ...JSON.parse(window.localStorage.getItem(CHAVE_RASCUNHO) || "{}") };
  } catch (e) {
    return VAZIO;
  }
};
const salvarRascunho = (form) => {
  try {
    window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(form));
  } catch (e) {
    /* sem armazenamento: segue sem rascunho */
  }
};
const limparRascunho = () => {
  try {
    window.localStorage.removeItem(CHAVE_RASCUNHO);
  } catch (e) {
    /* idem */
  }
};

const doPoste = (p) => ({
  ponto_referencia: p.ponto_referencia || "",
  logradouro: p.logradouro || "",
  numero: p.numero || "",
  bairro: p.bairro || "",
});

/** Cadastro (poste = null) ou edição de um poste do cadastrador. */
export default function PosteDialog({ open, onClose, poste = null, onSuccess }) {
  const [form, setForm] = useState(VAZIO);
  const [coords, setCoords] = useState(null);
  const [capturouAgora, setCapturouAgora] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const uuid = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErro("");
    setFotos([]);
    setCapturouAgora(false);
    uuid.current = novoUuid();
    if (poste) {
      setForm(doPoste(poste));
      setCoords({ lat: Number(poste.latitude), lng: Number(poste.longitude), precisao: poste.precisao_m != null ? Number(poste.precisao_m) : null });
    } else {
      setForm(lerRascunho());
      setCoords(null);
    }
  }, [open, poste?.id]);

  const aoMudar = ({ target: { name, value } }) => {
    const proximo = { ...form, [name]: value };
    setForm(proximo);
    if (!poste) salvarRascunho(proximo);
  };

  const aoCapturar = (nova) => {
    setCoords(nova);
    setCapturouAgora(true);
  };

  const podeGravar = Boolean(coords) && !(coords.precisao > PRECISAO_MAXIMA_M);

  const gravar = async () => {
    setSalvando(true);
    setErro("");
    const texto = { ...form, numero: form.numero || null };
    const posicao = coords ? { latitude: coords.lat, longitude: coords.lng, precisao_m: coords.precisao != null ? Math.round(coords.precisao * 100) / 100 : null } : {};
    try {
      const resposta = poste
        ? await atualizarPoste(poste.id, { ...texto, ...(capturouAgora ? posicao : {}) })
        : await criarPoste({ ...texto, ...posicao, client_uuid: uuid.current }, fotos);
      if (!poste) limparRascunho();
      onSuccess && onSuccess(resposta);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gravar o poste."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <FormularioModal
      aberto={open}
      titulo={poste ? "Editar poste" : "Novo poste"}
      aoFechar={onClose}
      aoGravar={gravar}
      campos={CAMPOS}
      valores={form}
      aoMudar={aoMudar}
      gravando={salvando || !podeGravar}
      antes={(
        <div className="mb-4 space-y-3">
          {erro ? <Banner tom="perigo">{erro}</Banner> : null}
          <CapturaLocalizacao valor={coords} aoCapturar={aoCapturar} desabilitado={salvando} />
        </div>
      )}
      depois={poste ? null : (
        <div className="mt-4">
          <CampoFotos fotos={fotos} aoMudar={setFotos} desabilitado={salvando} />
        </div>
      )}
    />
  );
}
