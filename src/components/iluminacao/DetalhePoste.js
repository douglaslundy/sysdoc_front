import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { ArrowLeft, ClipboardCheck, ExternalLink, Pencil, RotateCcw } from "lucide-react";
import AlertModal from "../messagesModal";
import DesfechoDialog from "../modal/iluminacao/DesfechoDialog";
import PosteDialog from "../modal/iluminacao/PosteDialog";
import ReabrirDialog from "../modal/iluminacao/ReabrirDialog";
import { AuthContext } from "../../contexts/AuthContext";
import MapaPonto from "../mapa/MapaPonto";
import StreetViewPanel from "../mapa/StreetViewPanel";
import { obterHistorico, obterPoste } from "../../services/iluminacaoPostes";
import { addMessage, turnAlert } from "../../store/ducks/Layout";
import { Banner } from "../ui/banner";
import { Button, buttonVariants } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Carregando } from "../ui/carregando";
import { Dado } from "../ui/dado";
import GaleriaFotos from "./GaleriaFotos";
import HistoricoPoste from "./HistoricoPoste";
import { StatusPoste } from "./StatusPoste";

const dataHora = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");
const metros = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

/** Detalhe de um poste. modo "cadastro" (pode editar o que é seu) ou "servico" (empresa: desfecho; admin: reabrir). */
export default function DetalhePoste({ modo = "cadastro", id }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [poste, setPoste] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [desfechando, setDesfechando] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);
  const { profile } = useContext(AuthContext) || {};

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const [dados, movimentos] = await Promise.all([obterPoste(id), obterHistorico(id)]);
      setPoste(dados);
      setHistorico(movimentos);
    } catch (e) {
      setErro(e?.response?.data?.message || "Não foi possível carregar o poste.");
    }
  }, [id]);

  useEffect(() => {
    if (router?.isReady === false || !id) return;
    carregar();
  }, [router?.isReady, id, carregar]);

  const aoEditar = () => {
    setEditando(false);
    dispatch(addMessage("Poste atualizado com sucesso!"));
    dispatch(turnAlert());
    carregar();
  };

  const aoRegistrar = (texto) => () => {
    setDesfechando(false);
    setReabrindo(false);
    dispatch(addMessage(texto));
    dispatch(turnAlert());
    carregar();
  };

  const voltar = (
    <Button variant="outline" className="min-h-11" onClick={() => router.push(`/iluminacao/${modo}`)}>
      <ArrowLeft /> Voltar
    </Button>
  );

  if (erro) {
    return (
      <div className="space-y-4">
        <CabecalhoDePagina titulo="Poste" acoes={voltar} />
        <Banner tom="perigo">{erro}</Banner>
      </div>
    );
  }

  if (!poste) return <Carregando className="justify-center py-16" />;

  const lat = Number(poste.latitude);
  const lng = Number(poste.longitude);
  const endereco = `${poste.logradouro}${poste.numero ? `, ${poste.numero}` : ""}`;
  const podeDesfecho = modo === "servico" && poste.status !== "concluido";
  const podeReabrir = modo === "servico" && profile === "admin" && poste.status === "concluido";
  const fotosCadastro = (poste.fotos || []).filter((f) => f.momento === "cadastro");

  return (
    <div className="space-y-4">
      <AlertModal />
      <CabecalhoDePagina
        titulo={poste.protocolo}
        subtitulo="Poste de iluminação pública"
        acoes={(
          <>
            <StatusPoste status={poste.status} />
            {modo === "cadastro" && poste.pode_editar ? (
              <Button variant="outline" className="min-h-11" onClick={() => setEditando(true)}><Pencil /> Editar</Button>
            ) : null}
            {voltar}
          </>
        )}
      />

      {podeDesfecho ? (
        <Button className="min-h-12 w-full text-base sm:w-auto sm:min-w-48" onClick={() => setDesfechando(true)}>
          <ClipboardCheck /> Desfecho
        </Button>
      ) : null}
      {podeReabrir ? (
        <Button variant="outline" className="min-h-12 w-full text-base sm:w-auto sm:min-w-48" onClick={() => setReabrindo(true)}>
          <RotateCcw /> Reabrir
        </Button>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Dado rotulo="Ponto de referência">{poste.ponto_referencia}</Dado>
          <Dado rotulo="Endereço">{endereco}</Dado>
          <Dado rotulo="Bairro">{poste.bairro}</Dado>
          <Dado rotulo="Cadastrado por">{poste.cadastrado_por?.name || "—"}</Dado>
          <Dado rotulo="Cadastrado em">{dataHora(poste.created_at)}</Dado>
          <Dado rotulo="Coordenadas">{`${poste.latitude}, ${poste.longitude}`}</Dado>
          {poste.precisao_m != null ? <Dado rotulo="Precisão do GPS">±{metros(Number(poste.precisao_m))} m</Dado> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fotos do cadastro</CardTitle></CardHeader>
        <CardContent>
          <GaleriaFotos posteId={poste.id} fotos={fotosCadastro} descricao={`cadastro do poste ${poste.protocolo}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-[280px] overflow-hidden rounded-lg border border-border md:h-[360px]"><MapaPonto lat={lat} lng={lng} rotulo="Mapa com a posição do poste" /></div>
            <div className="h-[280px] overflow-hidden rounded-lg border border-border md:h-[360px]"><StreetViewPanel lat={lat} lng={lng} /></div>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poste.latitude},${poste.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ variant: "outline" })} min-h-11`}
          >
            <ExternalLink /> Abrir no Google Maps
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoricoPoste posteId={poste.id} itens={historico} /></CardContent>
      </Card>

      {modo === "servico" ? (
        <>
          <DesfechoDialog open={desfechando} onClose={() => setDesfechando(false)} posteId={poste.id} onSuccess={aoRegistrar("Desfecho registrado com sucesso!")} />
          <ReabrirDialog open={reabrindo} onClose={() => setReabrindo(false)} posteId={poste.id} onSuccess={aoRegistrar("Poste reaberto com sucesso!")} />
        </>
      ) : null}
      {modo === "cadastro" ? <PosteDialog open={editando} onClose={() => setEditando(false)} poste={poste} onSuccess={aoEditar} /> : null}
    </div>
  );
}
