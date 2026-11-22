import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { CampoSelecao, CampoTexto } from "../ui/campos";
import {
  baixarAnexoOuvidoria, comentarManifestacao, destinatariosOuvidoria, encaminharManifestacao,
  mudarStatusManifestacao, obterManifestacao, responderManifestacao,
} from "../../services/ouvidoria";
import { StatusOuvidoria } from "./StatusOuvidoria";

const formatar = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");
const mensagem = (e, padrao) => e?.response?.data?.message || Object.values(e?.response?.data?.errors || {}).flat()[0] || padrao;

const ACOES = { registrada: "Registrada", respondida: "Respondida", resposta_alterada: "Resposta alterada", status: "Status alterado", comentario: "Comentário interno", encaminhada: "Encaminhada" };

export default function DetalheOuvidoria({ id }) {
  const router = useRouter();
  const [m, setM] = useState(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [resposta, setResposta] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [obsStatus, setObsStatus] = useState("");
  const [comentario, setComentario] = useState("");
  const [destinos, setDestinos] = useState([]);
  const [destinoId, setDestinoId] = useState("");
  const [destinoSec, setDestinoSec] = useState("");
  const [obsEnc, setObsEnc] = useState("");

  const carregar = useCallback(() =>
    obterManifestacao(id)
      .then((d) => { setM(d); setResposta(""); setErro(""); })
      .catch((e) => setErro(e?.response?.status === 404 ? "Manifestação não encontrada." : "Não foi possível carregar a manifestação.")), [id]);

  useEffect(() => { if (id) carregar(); }, [id, carregar]);
  useEffect(() => { if (m?.pode_agir) destinatariosOuvidoria().then(setDestinos).catch(() => setDestinos([])); }, [m?.pode_agir, m?.id]);

  const executar = async (fn, ok, limpar) => {
    setErro(""); setAviso("");
    try {
      await fn();
      setAviso(ok);
      limpar?.();
      await carregar();
    } catch (e) {
      setErro(mensagem(e, "Não foi possível concluir a ação."));
    }
  };

  const baixar = async (a) => {
    try {
      const blob = await baixarAnexoOuvidoria(m.id, a.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = a.original_name || "anexo";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não foi possível baixar o anexo.");
    }
  };

  if (!m) return erro ? <Banner tom="perigo">{erro}</Banner> : <p className="text-sm text-muted-foreground">Carregando...</p>;

  const pode = m.pode_agir && !["encerrada", "arquivada"].includes(m.status);
  const destinoEscolhido = destinos.find((d) => String(d.id) === String(destinoId));

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDePagina
        titulo={m.protocolo}
        subtitulo={`${m.tipo_rotulo} · ${m.secretaria?.nome || ""}`}
        acoes={<><StatusOuvidoria status={m.status} /><Button variant="outline" onClick={() => router.push("/sistema/ouvidoria")}>Voltar</Button></>}
      />
      {erro ? <Banner tom="perigo">{erro}</Banner> : null}
      {aviso ? <Banner tom="sucesso">{aviso}</Banner> : null}
      {!m.pode_agir ? <Banner tom="info">Somente leitura: esta manifestação foi encaminhada a outra secretaria.</Banner> : null}

      <section className="rounded-lg border border-input p-4 text-sm">
        <h2 className="mb-2 font-semibold">{m.assunto}</h2>
        <p className="whitespace-pre-wrap">{m.descricao}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Registrada em {formatar(m.created_at)} · Prazo {formatar(m.prazo_em)} · Responsável: {m.responsavel?.name || "—"}
        </p>
      </section>

      <section className="rounded-lg border border-input p-4 text-sm">
        <h2 className="mb-2 font-semibold">Cidadão</h2>
        {m.anonimo ? <p>Manifestação anônima.</p> : (
          <ul className="space-y-1">
            <li>Nome: {m.nome}</li>
            {m.email ? <li>E-mail: {m.email}</li> : null}
            {m.phone ? <li>Telefone: {m.phone}</li> : null}
            {m.cpf ? <li>CPF: {m.cpf}</li> : null}
          </ul>
        )}
      </section>

      {m.anexos?.length ? (
        <section className="rounded-lg border border-input p-4 text-sm">
          <h2 className="mb-2 font-semibold">Anexos</h2>
          <ul className="space-y-1">
            {m.anexos.map((a) => (
              <li key={a.id}><button type="button" className="text-primary-text underline" onClick={() => baixar(a)}>{a.original_name || `Anexo ${a.id}`}</button></li>
            ))}
          </ul>
        </section>
      ) : null}

      {m.resposta ? (
        <section className="rounded-lg border border-input bg-surface p-4 text-sm">
          <h2 className="mb-2 font-semibold">Resposta oficial</h2>
          <p className="whitespace-pre-wrap">{m.resposta}</p>
          <p className="mt-2 text-xs text-muted-foreground">Respondida em {formatar(m.respondida_em)}</p>
        </section>
      ) : null}

      {pode ? (
        <section className="flex flex-col gap-4 rounded-lg border border-input p-4">
          <h2 className="font-semibold">Ações</h2>

          <div className="flex flex-col gap-2">
            <CampoTexto id="resposta" label="Resposta ao cidadão" multiline rows={5} maxLength={5000} value={resposta} onChange={(e) => setResposta(e.target.value)} />
            <div><Button disabled={resposta.trim().length < 5} onClick={() => executar(() => responderManifestacao(m.id, resposta.trim()), "Resposta registrada.")}>Responder</Button></div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-52">
              <CampoSelecao id="novo-status" label="Mudar status" value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                <option value="">Selecione</option>
                <option value="em_analise">Em análise</option>
                <option value="encerrada">Encerrada</option>
                <option value="arquivada">Arquivada</option>
              </CampoSelecao>
            </div>
            <div className="min-w-0 flex-1"><CampoTexto id="obs-status" label="Observação (opcional)" maxLength={1000} value={obsStatus} onChange={(e) => setObsStatus(e.target.value)} /></div>
            <Button variant="outline" disabled={!novoStatus} onClick={() => executar(() => mudarStatusManifestacao(m.id, novoStatus, obsStatus || undefined), "Status atualizado.", () => { setNovoStatus(""); setObsStatus(""); })}>Alterar</Button>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-64">
              <CampoSelecao id="destino" label="Encaminhar para" value={destinoId} onChange={(e) => { setDestinoId(e.target.value); setDestinoSec(""); }}>
                <option value="">Selecione</option>
                {destinos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </CampoSelecao>
            </div>
            <div className="w-full sm:w-52">
              <CampoSelecao id="destino-sec" label="Secretaria do destino" value={destinoSec} onChange={(e) => setDestinoSec(e.target.value)}>
                <option value="">Selecione</option>
                {(destinoEscolhido?.secretarias || []).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </CampoSelecao>
            </div>
            <div className="min-w-0 flex-1"><CampoTexto id="obs-enc" label="Observação (opcional)" maxLength={1000} value={obsEnc} onChange={(e) => setObsEnc(e.target.value)} /></div>
            <Button variant="outline" disabled={!destinoId || !destinoSec}
              onClick={() => executar(() => encaminharManifestacao(m.id, { user_id: Number(destinoId), secretaria_id: Number(destinoSec), observacao: obsEnc || undefined }), "Manifestação encaminhada.", () => { setDestinoId(""); setDestinoSec(""); setObsEnc(""); })}>
              Encaminhar
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <CampoTexto id="comentario" label="Comentário interno (o cidadão não vê)" multiline rows={2} maxLength={2000} value={comentario} onChange={(e) => setComentario(e.target.value)} />
            <div><Button variant="outline" disabled={comentario.trim().length < 2} onClick={() => executar(() => comentarManifestacao(m.id, comentario.trim()), "Comentário registrado.", () => setComentario(""))}>Comentar</Button></div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-input p-4 text-sm">
        <h2 className="mb-2 font-semibold">Histórico</h2>
        <ul className="space-y-2">
          {(m.historico || []).map((h) => (
            <li key={h.id}>
              <span className="font-medium">{ACOES[h.acao] || h.acao}</span>
              {h.status_para ? ` → ${h.status_para.replace("_", " ")}` : ""}
              {h.interno ? <span className="ml-1 text-xs text-muted-foreground">(interno)</span> : null}
              <span className="ml-1 text-xs text-muted-foreground">{formatar(h.created_at)}{h.user?.name ? ` · ${h.user.name}` : " · cidadão"}</span>
              {h.observacao ? <p className="whitespace-pre-wrap text-muted-foreground">{h.observacao}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
