import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { mensagemDeErro } from "../../lib/mensagemDeErro";
import {
  atualizarTipo, criarTipo, listarConfiguracoes, listarTipos, salvarConfiguracao, secretariasDeOs,
} from "../../services/ordemServico";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CampoSelecao, CampoTexto } from "../ui/campos";
import { Interruptor } from "../ui/interruptor";

/** Tipos de serviço (gestor da secretaria ou admin) e regra de apontar técnico (admin: padrão global e por secretaria). */
export default function ConfiguracaoOs() {
  const { profile } = useContext(AuthContext) || {};
  const admin = profile === "admin";
  const [secretarias, setSecretarias] = useState([]);
  const [secretariaId, setSecretariaId] = useState("");
  const [tipos, setTipos] = useState([]);
  const [novo, setNovo] = useState("");
  const [configs, setConfigs] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    secretariasDeOs().then((l) => { setSecretarias(l); if (l[0]) setSecretariaId(String(l[0].id)); }).catch(() => setErro("Não foi possível carregar as secretarias."));
    if (admin) listarConfiguracoes().then(setConfigs).catch(() => {});
  }, [admin]);

  const carregarTipos = useCallback(() => {
    if (!secretariaId) return;
    listarTipos(secretariaId, true).then(setTipos).catch(() => setTipos([]));
  }, [secretariaId]);

  useEffect(carregarTipos, [carregarTipos]);

  const tentar = async (fn) => {
    setErro("");
    try { await fn(); } catch (e) { setErro(mensagemDeErro(e)); }
  };

  const adicionar = () => tentar(async () => {
    if (!novo.trim()) return;
    await criarTipo({ secretaria_id: Number(secretariaId), nome: novo.trim() });
    setNovo("");
    carregarTipos();
  });

  const alternar = (t) => tentar(async () => { await atualizarTipo(t.id, { nome: t.nome, ativo: !t.ativo }); carregarTipos(); });

  const valorConfig = (sid) => Boolean(configs.find((c) => (c.secretaria_id ?? null) === sid)?.solicitante_aponta_tecnico);
  const mudarConfig = (sid, valor) => tentar(async () => {
    await salvarConfiguracao({ secretaria_id: sid, solicitante_aponta_tecnico: valor });
    setConfigs(await listarConfiguracoes());
  });

  return (
    <>
      <CabecalhoDePagina titulo="Configuração de OS" subtitulo="Tipos de serviço por secretaria e regra para apontar técnico." />
      {erro ? <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tipos de serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CampoSelecao id="os-cfg-secretaria" label="Secretaria" value={secretariaId} onChange={({ target: { value } }) => setSecretariaId(value)}>
              {secretarias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </CampoSelecao>
            <div className="flex items-end gap-2">
              <div className="flex-1"><CampoTexto id="os-cfg-novo" label="Novo tipo" value={novo} maxLength={120} onChange={({ target: { value } }) => setNovo(value)} /></div>
              <Button onClick={adicionar}>Adicionar</Button>
            </div>
            <ul className="divide-y divide-border">
              {tipos.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className={t.ativo ? "" : "text-muted-foreground line-through"}>{t.nome}</span>
                  <Button size="sm" variant="outline" onClick={() => alternar(t)}>{t.ativo ? "Desativar" : "Ativar"}</Button>
                </li>
              ))}
              {tipos.length === 0 ? <li className="py-2 text-sm text-muted-foreground">Nenhum tipo cadastrado.</li> : null}
            </ul>
          </CardContent>
        </Card>

        {admin ? (
          <Card>
            <CardHeader><CardTitle>Solicitante aponta o técnico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Interruptor id="os-cfg-global" marcado={valorConfig(null)} aoMudar={(v) => mudarConfig(null, v)}>Padrão para todas as secretarias</Interruptor>
              <hr className="border-border" />
              <p className="text-sm text-muted-foreground">Regra da secretaria selecionada (sobrepõe o padrão):</p>
              <Interruptor id="os-cfg-secretaria-sw" marcado={valorConfig(Number(secretariaId))} aoMudar={(v) => mudarConfig(Number(secretariaId), v)}>
                Solicitante pode escolher o técnico
              </Interruptor>
              <p className="text-xs text-muted-foreground">Desligado: o solicitante só escolhe a secretaria e o gestor aponta o técnico.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
