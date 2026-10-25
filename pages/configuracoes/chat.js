import React, { useCallback, useEffect, useState } from "react";
import { Activity, Pencil, PauseCircle, PlayCircle, Save, Trash2 } from "lucide-react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoSelecao, CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Carregando } from "../../src/components/ui/carregando";
import { Interruptor } from "../../src/components/ui/interruptor";
import { Pilula } from "../../src/components/ui/pilula";
import { api } from "../../src/services/api";
import DestructiveConfirmDialog from "../../src/components/confirmDialog/DestructiveConfirmDialog";

const emptyForm = {
  engine: "pusher",
  active: false,
  app_id: "",
  app_key: "",
  app_secret: "",
  cluster: "mt1",
  host: "",
  port: 6001,
  scheme: "https",
  use_tls: true,
  rate_limit_decay_minutes: 1,
  rate_limit_global: 300,
  rate_limit_sync: 120,
  rate_limit_messages: 30,
  rate_limit_typing: 60,
  rate_limit_presence: 60,
  auto_open_on_message: false,
  play_sound_on_message: true,
};

export default function ChatConfigPage() {
  const [form, setForm] = useState(emptyForm);
  const [config, setConfig] = useState(null);
  const [configured, setConfigured] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const applyConfig = useCallback((data, clearSecrets = true) => {
    setConfig(data || null);
    setForm((current) => ({
      ...current,
      engine: data?.engine || "pusher",
      active: Boolean(data?.active),
      cluster: data?.cluster || "mt1",
      host: data?.host || "",
      port: data?.port || 6001,
      scheme: data?.scheme || "https",
      use_tls: Boolean(data?.use_tls),
      rate_limit_decay_minutes: data?.rate_limit_decay_minutes ?? 1,
      rate_limit_global: data?.rate_limit_global ?? 300,
      rate_limit_sync: data?.rate_limit_sync ?? 120,
      rate_limit_messages: data?.rate_limit_messages ?? 30,
      rate_limit_typing: data?.rate_limit_typing ?? 60,
      rate_limit_presence: data?.rate_limit_presence ?? 60,
      auto_open_on_message: Boolean(data?.auto_open_on_message),
      play_sound_on_message:
        data?.play_sound_on_message === undefined
          ? true
          : Boolean(data?.play_sound_on_message),
      app_id: clearSecrets ? "" : current.app_id,
      app_key: clearSecrets ? "" : current.app_key,
      app_secret: clearSecrets ? "" : current.app_secret,
    }));
    setConfigured({
      app_id: Boolean(data?.has_app_id),
      app_key: Boolean(data?.has_app_key),
      app_secret: Boolean(data?.has_app_secret),
    });
  }, []);

  const loadConfig = useCallback(async () => {
    const { data } = await api.get("/chat/config");
    applyConfig(data);
    setEditing(!data?.configured);
  }, [applyConfig]);

  useEffect(() => {
    loadConfig()
      .catch((error) =>
        setFeedback({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Não foi possível carregar as configurações do chat.",
        })
      )
      .finally(() => setLoading(false));
  }, [loadConfig]);

  const update = (field) => (event) => {
    const value =
      event?.target?.type === "checkbox"
        ? event.target.checked
        : event?.target?.value;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "scheme"
        ? { use_tls: value === "https" }
        : field === "use_tls"
        ? { scheme: value ? "https" : "http" }
        : {}),
    }));
  };

  const payload = () => ({
    ...form,
    port: Number(form.port || 0),
    rate_limit_decay_minutes: Number(form.rate_limit_decay_minutes || 1),
    rate_limit_global: Number(form.rate_limit_global || 0),
    rate_limit_sync: Number(form.rate_limit_sync || 0),
    rate_limit_messages: Number(form.rate_limit_messages || 0),
    rate_limit_typing: Number(form.rate_limit_typing || 0),
    rate_limit_presence: Number(form.rate_limit_presence || 0),
  });

  const errorMessage = (error, fallback) => {
    if (error?.response?.status === 429) {
      return "Too Many Attempts. Aguarde alguns instantes antes de tentar novamente.";
    }

    const validation = error?.response?.data?.errors;
    const firstValidation = validation
      ? Object.values(validation).flat().find(Boolean)
      : null;

    return firstValidation || error?.response?.data?.message || fallback;
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await api.put("/chat/config", payload());
      applyConfig(data);
      setEditing(false);
      window.dispatchEvent(new Event("chat-realtime-config-updated"));
      setFeedback({
        type: "success",
        message: "Conexão salva com sucesso.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: errorMessage(error, "Não foi possível salvar as credenciais."),
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const { data } = await api.post("/chat/config/test", payload());
      setFeedback({
        type: data?.ok ? "success" : "error",
        message: data?.message || "Teste concluído.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: errorMessage(error, "Não foi possível validar a conexão."),
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleActive = async () => {
    setChangingStatus(true);
    setFeedback(null);
    try {
      const { data } = await api.patch("/chat/config/status", {
        active: !config?.active,
      });
      applyConfig(data);
      window.dispatchEvent(new Event("chat-realtime-config-updated"));
      setFeedback({
        type: "success",
        message: data?.active ? "Conexão ativada." : "Conexão desativada.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: errorMessage(error, "Não foi possível alterar o estado da conexão."),
      });
    } finally {
      setChangingStatus(false);
    }
  };

  const deleteCredentials = async () => {
    setDeleting(true);
    setFeedback(null);
    try {
      const { data } = await api.delete("/chat/config");
      applyConfig(data);
      setEditing(true);
      setDeleteDialogOpen(false);
      window.dispatchEvent(new Event("chat-realtime-config-updated"));
      setFeedback({ type: "success", message: "Credenciais apagadas." });
    } catch (error) {
      setDeleteDialogOpen(false);
      setFeedback({
        type: "error",
        message: errorMessage(error, "Não foi possível apagar as credenciais."),
      });
    } finally {
      setDeleting(false);
    }
  };

  const secretPlaceholder = (field, example) =>
    configured[field]
      ? "Já configurado. Deixe em branco para manter o valor atual."
      : example;

  const toggle = (field) => (checked) => update(field)({ target: { type: "checkbox", checked } });

  if (loading) {
    return <Carregando className="justify-center py-16">Carregando configurações...</Carregando>;
  }

  const tomDoFeedback = feedback?.type === "success" ? "sucesso" : "perigo";

  return (
    <div className="ui-reset mx-auto flex max-w-3xl flex-col gap-4">
      <CabecalhoDePagina
        titulo="Configurações do Chat"
        subtitulo="Escolha e configure o motor responsável pela comunicação em tempo real."
      />

      {config?.configured && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-extrabold">Conexão configurada</p>
                <p className="text-sm text-muted-foreground">
                  {config.engine === "soketi" ? "Soketi" : "Pusher Cloud"}
                  {config.updated_at
                    ? ` · Atualizada em ${new Date(config.updated_at).toLocaleString("pt-BR")}`
                    : ""}
                </p>
              </div>
              <Pilula tom={config.active ? "sucesso" : "neutro"}>{config.active ? "Ativa" : "Inativa"}</Pilula>
            </div>

            <p className="text-sm text-muted-foreground">
              Status: credenciais salvas. Use “Testar conexão” para validar a comunicação com o motor.
            </p>
            <p className="text-sm text-muted-foreground">
              Limites atuais: global {config?.rate_limit_global ?? 300}/min, sincronização {config?.rate_limit_sync ?? 120}/min, mensagens {config?.rate_limit_messages ?? 30}/min, digitação {config?.rate_limit_typing ?? 60}/min e presença {config?.rate_limit_presence ?? 60}/min. Janela: {config?.rate_limit_decay_minutes ?? 1} min.
            </p>
            <p className="text-sm text-muted-foreground">
              Comportamento ao receber mensagem: abertura automática {config?.auto_open_on_message ? "ativada" : "desativada"} e som {config?.play_sound_on_message ? "ativado" : "desativado"}.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={testConnection} disabled={testing || saving || changingStatus || deleting}>
                <Activity /> {testing ? "Testando..." : "Testar conexão"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(true)} disabled={saving || deleting}>
                <Pencil /> Editar
              </Button>
              <Button variant="outline" onClick={toggleActive} disabled={changingStatus || saving || deleting}>
                {config.active ? <PauseCircle /> : <PlayCircle />}
                {changingStatus ? "Atualizando..." : config.active ? "Desativar" : "Ativar"}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={deleting || saving || changingStatus}>
                <Trash2 /> {deleting ? "Apagando..." : "Apagar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!config?.configured || editing) && (
        <>
          <Card>
            <CardHeader><CardTitle>Motor de comunicação</CardTitle></CardHeader>
            <CardContent>
              <CampoSelecao id="chat-engine" label="Motor do chat" value={form.engine} onChange={update("engine")}>
                <option value="pusher">Pusher Cloud</option>
                <option value="soketi">Soketi (servidor próprio)</option>
              </CampoSelecao>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Credenciais da aplicação</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CampoTexto
                id="chat-app-id"
                label="App ID"
                value={form.app_id}
                onChange={update("app_id")}
                placeholder={secretPlaceholder("app_id", form.engine === "pusher" ? "Ex.: 1234567, disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_ID")}
                type="password"
                autoComplete="new-password"
              />
              <CampoTexto
                id="chat-app-key"
                label="App Key"
                value={form.app_key}
                onChange={update("app_key")}
                placeholder={secretPlaceholder("app_key", form.engine === "pusher" ? "Chave pública disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_KEY")}
                type="password"
                autoComplete="new-password"
              />
              <CampoTexto
                id="chat-app-secret"
                label="App Secret"
                value={form.app_secret}
                onChange={update("app_secret")}
                placeholder={secretPlaceholder("app_secret", form.engine === "pusher" ? "Segredo disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_SECRET")}
                type="password"
                autoComplete="new-password"
              />
            </CardContent>
          </Card>

          {form.engine === "pusher" ? (
            <Card>
              <CardHeader><CardTitle>Pusher Cloud</CardTitle></CardHeader>
              <CardContent>
                <CampoTexto
                  id="chat-cluster"
                  label="Cluster"
                  value={form.cluster}
                  onChange={update("cluster")}
                  placeholder="Ex.: mt1, us2, eu ou sa1, conforme o painel Pusher"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Servidor Soketi</CardTitle>
                <CardDescription>
                  Informe o endereço público do servidor Soketi. Não inclua caminhos como <code>/app</code> ou <code>/apps</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CampoTexto id="chat-host" label="Host do Soketi" value={form.host} onChange={update("host")} placeholder="Ex.: websocket.seudominio.com" />
                <div className="grid gap-4 md:grid-cols-2">
                  <CampoTexto
                    id="chat-port"
                    label="Porta"
                    type="number"
                    value={form.port}
                    onChange={update("port")}
                    placeholder="6001 sem proxy ou 443 com HTTPS"
                    min={1}
                    max={65535}
                  />
                  <CampoSelecao id="chat-scheme" label="Protocolo" value={form.scheme} onChange={update("scheme")}>
                    <option value="https">HTTPS / WSS</option>
                    <option value="http">HTTP / WS</option>
                  </CampoSelecao>
                </div>
                <Interruptor id="chat-tls" marcado={form.use_tls} aoMudar={toggle("use_tls")}>
                  Usar conexão segura TLS (recomendado em produção)
                </Interruptor>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Proteção contra excesso de uso</CardTitle>
              <CardDescription>
                Esses limites evitam spam, loops acidentais e consumo excessivo do chat. Use 0 para desativar um limite específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <CampoTexto id="chat-rl-decay" label="Janela de bloqueio (minutos)" type="number" value={form.rate_limit_decay_minutes} onChange={update("rate_limit_decay_minutes")} min={1} max={60} dica="Janela usada para contar as tentativas." />
              <CampoTexto id="chat-rl-global" label="Limite global do chat / minuto" type="number" value={form.rate_limit_global} onChange={update("rate_limit_global")} min={0} max={5000} dica="Total de requisições do módulo por usuário." />
              <CampoTexto id="chat-rl-sync" label="Sincronizações / minuto" type="number" value={form.rate_limit_sync} onChange={update("rate_limit_sync")} min={0} max={5000} dica="Listagens, leitura, entrega e histórico." />
              <CampoTexto id="chat-rl-messages" label="Mensagens enviadas / minuto" type="number" value={form.rate_limit_messages} onChange={update("rate_limit_messages")} min={0} max={5000} dica="Envio real de mensagens e anexos." />
              <CampoTexto id="chat-rl-typing" label="Eventos de digitação / minuto" type="number" value={form.rate_limit_typing} onChange={update("rate_limit_typing")} min={0} max={5000} dica="Início e parada do indicador de digitação." />
              <CampoTexto id="chat-rl-presence" label="Atualizações de presença / minuto" type="number" value={form.rate_limit_presence} onChange={update("rate_limit_presence")} min={0} max={5000} dica="Heartbeat, online, ausente e offline." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comportamento de notificação</CardTitle>
              <CardDescription>
                Defina como o chat deve reagir quando uma nova mensagem chegar para o usuário.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Interruptor id="chat-auto-open" marcado={form.auto_open_on_message} aoMudar={toggle("auto_open_on_message")}>
                Abrir o painel do chat automaticamente ao receber mensagem
              </Interruptor>
              <Interruptor id="chat-sound" marcado={form.play_sound_on_message} aoMudar={toggle("play_sound_on_message")}>
                Tocar som de alerta ao receber mensagem
              </Interruptor>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            {config?.configured && (
              <Button
                variant="outline"
                onClick={() => {
                  applyConfig(config);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            )}
            <Button onClick={save} disabled={saving || testing}>
              <Save /> {saving ? "Salvando..." : "Salvar credenciais"}
            </Button>
          </div>
        </>
      )}

      {feedback && <Banner tom={tomDoFeedback}>{feedback.message}</Banner>}

      <DestructiveConfirmDialog
        open={deleteDialogOpen}
        title="Apagar configurações do chat"
        message="As credenciais e a conexão em tempo real serão removidas. O chat deixará de receber atualizações em tempo real até uma nova configuração ser salva."
        confirmLabel="Apagar configurações"
        loading={deleting}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={deleteCredentials}
      />
    </div>
  );
}
