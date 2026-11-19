import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, FileDown } from "lucide-react";
import { mensagemDeErro } from "../../lib/mensagemDeErro";
import {
  atribuirOs, baixarFotoOs, baixarPdfOs, cancelarOs, concluirOs, encaminharOs, iniciarOs, listarTipos, obterOs, secretariasDeOs, tecnicosDeOs,
} from "../../services/ordemServico";
import CampoFotos from "../iluminacao/CampoFotos";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Carregando } from "../ui/carregando";
import { Dado } from "../ui/dado";
import { FormularioModal } from "../ui/formulario-modal";
import { PRIORIDADES, STATUS_OS, StatusOs } from "./StatusOs";

const dataHora = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");

function FotoOs({ osId, foto }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let u;
    baixarFotoOs(osId, foto.id).then((blob) => { u = URL.createObjectURL(blob); setUrl(u); }).catch(() => {});
    return () => u && URL.revokeObjectURL(u);
  }, [osId, foto.id]);
  return url ? <img src={url} alt={`Foto da ${foto.fase}`} className="aspect-square w-full rounded-lg border border-border object-cover" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />;
}

/** Detalhe da OS com as ações que cada papel pode fazer (a API informa em `pode`). */
export default function DetalheOs({ id }) {
  const router = useRouter();
  const [os, setOs] = useState(null);
  const [erro, setErro] = useState("");
  const [acao, setAcao] = useState(null); // "atribuir" | "concluir" | "cancelar"
  const [form, setForm] = useState({});
  const [fotos, setFotos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [secretarias, setSecretarias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setOs(await obterOs(id));
      setErro("");
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível carregar a OS."));
    }
  }, [id]);

  useEffect(() => { if (id) carregar(); }, [id, carregar]);

  const abrir = async (qual) => {
    setForm({}); setFotos([]); setErro("");
    if (qual === "atribuir") {
      try { setTecnicos((await tecnicosDeOs(os.secretaria_id)).tecnicos); } catch (e) { setTecnicos([]); }
    }
    if (qual === "encaminhar") {
      try { setSecretarias(await secretariasDeOs()); } catch (e) { setSecretarias([]); }
      setTipos([]); setTecnicos([]);
    }
    setAcao(qual);
  };

  // Ao escolher a secretaria de destino, carrega os tipos de serviço e os técnicos dela.
  useEffect(() => {
    // Só mexe na lista quando a ação é "encaminhar": em "atribuir" a lista vem do abrir() e não pode ser zerada.
    if (acao !== "encaminhar") return;
    if (!form.secretaria_id) { setTipos([]); setTecnicos([]); return; }
    listarTipos(form.secretaria_id).then(setTipos).catch(() => setTipos([]));
    tecnicosDeOs(form.secretaria_id).then((r) => setTecnicos(r.tecnicos)).catch(() => setTecnicos([]));
  }, [acao, form.secretaria_id]);

  const executar = async (fn) => {
    setOcupado(true);
    setErro("");
    try {
      await fn();
      setAcao(null);
      await carregar();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível concluir a ação."));
    } finally {
      setOcupado(false);
    }
  };

  const baixarPdf = () => executar(async () => {
    const blob = await baixarPdfOs(id);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `OS-${os.numero.replace("/", "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const aoMudar = ({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value, ...(name === "secretaria_id" ? { tipo_servico_id: "", tecnico_id: "" } : {}) }));

  if (!os) return erro ? <Banner tom="perigo">{erro}</Banner> : <Carregando />;

  const pode = os.pode || {};
  const camposAcao = {
    atribuir: { titulo: "Atribuir técnico", rotulo: "Atribuir", campos: [{ name: "tecnico_id", label: "Técnico", required: true, options: tecnicos.map((t) => ({ value: t.id, label: t.name })), dica: tecnicos.length === 0 ? "Nenhum técnico disponível: o usuário precisa ter o perfil Técnico (principal ou adicional), estar ativo e vinculado à secretaria desta OS." : undefined }], gravar: () => atribuirOs(id, form.tecnico_id) },
    encaminhar: {
      titulo: "Encaminhar OS", rotulo: "Encaminhar",
      campos: [
        { name: "secretaria_id", label: "Secretaria de destino", required: true, options: secretarias.map((s) => ({ value: s.id, label: s.nome })) },
        { name: "tipo_servico_id", label: "Tipo de serviço", required: true, options: tipos.map((t) => ({ value: t.id, label: t.nome })), disabled: !form.secretaria_id },
        { name: "tecnico_id", label: "Técnico (opcional)", options: tecnicos.map((t) => ({ value: t.id, label: t.name })), vazio: "Deixar para a secretaria", disabled: !form.secretaria_id },
        { name: "observacao", label: "Observação (opcional)", rows: 2, max: 500 },
      ],
      gravar: () => encaminharOs(id, { secretaria_id: form.secretaria_id, tipo_servico_id: form.tipo_servico_id, tecnico_id: form.tecnico_id || null, observacao: form.observacao }),
    },
    concluir: {
      titulo: "Concluir OS", rotulo: "Concluir",
      campos: [
        { name: "relato", label: "Relato do atendimento", required: true, rows: 4, max: 5000 },
        { name: "materiais", label: "Materiais usados", rows: 2, max: 3000 },
        { name: "tempo_gasto_min", label: "Tempo gasto (minutos)", type: "number" },
      ],
      gravar: () => concluirOs(id, form, fotos),
    },
    cancelar: { titulo: "Cancelar OS", rotulo: "Cancelar OS", campos: [{ name: "observacao", label: "Motivo (opcional)", rows: 2, max: 500 }], gravar: () => cancelarOs(id, form.observacao) },
  }[acao];

  return (
    <>
      <CabecalhoDePagina
        titulo={`OS ${os.numero}`}
        subtitulo={`${os.tipo?.nome || ""} · ${os.secretaria?.nome || ""}`}
        acoes={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/ordem-servico")}><ArrowLeft /> Voltar</Button>
            <Button variant="outline" disabled={ocupado} onClick={baixarPdf}><FileDown /> PDF</Button>
            {pode.atribuir ? <Button variant="outline" onClick={() => abrir("atribuir")}>{os.tecnico ? "Trocar técnico" : "Atribuir técnico"}</Button> : null}
            {pode.encaminhar ? <Button variant="outline" onClick={() => abrir("encaminhar")}>Encaminhar</Button> : null}
            {pode.iniciar ? <Button disabled={ocupado} onClick={() => executar(() => iniciarOs(id))}>Iniciar atendimento</Button> : null}
            {pode.concluir ? <Button onClick={() => abrir("concluir")}>Concluir</Button> : null}
            {pode.cancelar ? <Button variant="outline" onClick={() => abrir("cancelar")}>Cancelar OS</Button> : null}
          </div>
        )}
      />
      {erro && !acao ? <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Dados <StatusOs status={os.status} /></CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Dado rotulo="Local">{os.local}</Dado>
            <Dado rotulo="Endereço">{os.endereco || "—"}</Dado>
            <Dado rotulo="Prioridade">{PRIORIDADES.find((p) => p.value === os.prioridade)?.label || os.prioridade}</Dado>
            <Dado rotulo="Prazo">{os.prazo ? new Date(`${os.prazo}T00:00:00`).toLocaleDateString("pt-BR") : "—"}</Dado>
            <Dado rotulo="Solicitante">{os.solicitante?.name}</Dado>
            <Dado rotulo="Técnico">{os.tecnico?.name || "—"}</Dado>
            <Dado rotulo="Contato no local">{[os.contato_nome, os.contato_telefone].filter(Boolean).join(" · ") || "—"}</Dado>
            <Dado rotulo="Localização">{os.latitude ? `${os.latitude}, ${os.longitude}` : "—"}</Dado>
            <Dado rotulo="O que deve ser feito" className="sm:col-span-2">{os.descricao}</Dado>
            <Dado rotulo="Problema constatado" className="sm:col-span-2">{os.problema || "—"}</Dado>
            {os.fechamento_relato ? (
              <>
                <Dado rotulo="Relato do atendimento" className="sm:col-span-2">{os.fechamento_relato}</Dado>
                <Dado rotulo="Materiais usados">{os.materiais || "—"}</Dado>
                <Dado rotulo="Tempo gasto">{os.tempo_gasto_min != null ? `${os.tempo_gasto_min} min` : "—"}</Dado>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {(os.historico || []).map((h) => (
                <li key={h.id}>
                  <p className="font-semibold">{STATUS_OS[h.status_para]?.rotulo || h.acao}</p>
                  <p className="text-xs text-muted-foreground">{h.user?.name || "—"} · {dataHora(h.created_at)}</p>
                  {h.observacao ? <p className="text-xs">{h.observacao}</p> : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {(os.fotos || []).length > 0 ? (
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Fotos</CardTitle></CardHeader>
            <CardContent>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,200px))] gap-3">
                {os.fotos.map((f) => (
                  <li key={f.id}><FotoOs osId={os.id} foto={f} /><p className="mt-1 text-xs text-muted-foreground">{f.fase === "fechamento" ? "Fechamento" : "Abertura"}</p></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {camposAcao ? (
        <FormularioModal
          aberto
          titulo={camposAcao.titulo}
          aoFechar={() => setAcao(null)}
          aoGravar={() => executar(camposAcao.gravar)}
          campos={camposAcao.campos}
          valores={form}
          aoMudar={aoMudar}
          gravando={ocupado}
          rotuloGravar={camposAcao.rotulo}
          antes={erro ? <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div> : null}
          depois={acao === "concluir" ? <div className="mt-4"><CampoFotos fotos={fotos} aoMudar={setFotos} max={6} desabilitado={ocupado} legenda="Fotos do fechamento" /></div> : null}
        />
      ) : null}
    </>
  );
}
