import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import BaseCard from "../../src/components/baseCard/BaseCard";
import {
  modalFormRootSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../src/components/modal/_shared/modalFormStyles";
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

  if (loading) {
    return <Box sx={{ p: 4, color: "var(--lg-text-muted)" }}>Carregando configurações...</Box>;
  }

  return (
    <Box className="queue-page chat-config-page" sx={{ ...modalFormRootSx, maxWidth: 980, mx: "auto" }}>
      <BaseCard
        title="Configurações do Chat"
        subtitle="Escolha e configure o motor responsável pela comunicação em tempo real."
      >
        <Stack spacing={2.2}>
          {config?.configured && (
            <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>Conexão configurada</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {config.engine === "soketi" ? "Soketi" : "Pusher Cloud"}
                      {config.updated_at
                        ? ` · Atualizada em ${new Date(config.updated_at).toLocaleString("pt-BR")}`
                        : ""}
                    </Typography>
                  </Box>
                  <Chip
                    label={config.active ? "Ativa" : "Inativa"}
                    color={config.active ? "success" : "default"}
                    variant={config.active ? "filled" : "outlined"}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Status: credenciais salvas. Use “Testar conexão” para validar a comunicação com o motor.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Limites atuais: global {config?.rate_limit_global ?? 300}/min, sincronizaÃ§Ã£o {config?.rate_limit_sync ?? 120}/min, mensagens {config?.rate_limit_messages ?? 30}/min, digitaÃ§Ã£o {config?.rate_limit_typing ?? 60}/min e presenÃ§a {config?.rate_limit_presence ?? 60}/min. Janela: {config?.rate_limit_decay_minutes ?? 1} min.
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    onClick={testConnection}
                    disabled={testing || saving || changingStatus || deleting}
                    startIcon={<FeatherIcon icon="activity" width="17" />}
                    sx={modalSecondaryButtonSx}
                  >
                    {testing ? "Testando..." : "Testar conexão"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setEditing(true)}
                    disabled={saving || deleting}
                    startIcon={<FeatherIcon icon="edit-2" width="17" />}
                    sx={modalSecondaryButtonSx}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={toggleActive}
                    disabled={changingStatus || saving || deleting}
                    startIcon={<FeatherIcon icon={config.active ? "pause-circle" : "play-circle"} width="17" />}
                    sx={modalSecondaryButtonSx}
                  >
                    {changingStatus
                      ? "Atualizando..."
                      : config.active
                      ? "Desativar"
                      : "Ativar"}
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleting || saving || changingStatus}
                    startIcon={<FeatherIcon icon="trash-2" width="17" />}
                  >
                    {deleting ? "Apagando..." : "Apagar"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {(!config?.configured || editing) && (
            <>
          <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Motor de comunicação</Typography>
            <FormControl fullWidth>
              <InputLabel id="chat-engine-label">Motor do chat</InputLabel>
              <Select labelId="chat-engine-label" label="Motor do chat" value={form.engine} onChange={update("engine")}>
                <MenuItem value="pusher">Pusher Cloud</MenuItem>
                <MenuItem value="soketi">Soketi (servidor próprio)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Typography sx={{ fontWeight: 800, mb: 2 }}>Credenciais da aplicação</Typography>
            <Stack spacing={2}>
              <TextField
                label="App ID"
                value={form.app_id}
                onChange={update("app_id")}
                placeholder={secretPlaceholder("app_id", form.engine === "pusher" ? "Ex.: 1234567, disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_ID")}
                type="password"
                autoComplete="new-password"
              />
              <TextField
                label="App Key"
                value={form.app_key}
                onChange={update("app_key")}
                placeholder={secretPlaceholder("app_key", form.engine === "pusher" ? "Chave pública disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_KEY")}
                type="password"
                autoComplete="new-password"
              />
              <TextField
                label="App Secret"
                value={form.app_secret}
                onChange={update("app_secret")}
                placeholder={secretPlaceholder("app_secret", form.engine === "pusher" ? "Segredo disponível em App Keys no painel Pusher" : "Valor configurado em SOKETI_DEFAULT_APP_SECRET")}
                type="password"
                autoComplete="new-password"
              />
            </Stack>
          </Box>

          {form.engine === "pusher" ? (
            <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
              <Typography sx={{ fontWeight: 800, mb: 2 }}>Pusher Cloud</Typography>
              <TextField
                fullWidth
                label="Cluster"
                value={form.cluster}
                onChange={update("cluster")}
                placeholder="Ex.: mt1, us2, eu ou sa1, conforme o painel Pusher"
              />
            </Box>
          ) : (
            <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Servidor Soketi</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Informe o endereço público do servidor Soketi. Não inclua caminhos como <code>/app</code> ou <code>/apps</code>.
              </Typography>
              <Stack spacing={2}>
                <TextField label="Host do Soketi" value={form.host} onChange={update("host")} placeholder="Ex.: websocket.seudominio.com" />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <TextField
                    label="Porta"
                    type="number"
                    value={form.port}
                    onChange={update("port")}
                    placeholder="6001 sem proxy ou 443 com HTTPS"
                    inputProps={{ min: 1, max: 65535 }}
                  />
                  <FormControl fullWidth>
                    <InputLabel id="chat-scheme-label">Protocolo</InputLabel>
                    <Select labelId="chat-scheme-label" label="Protocolo" value={form.scheme} onChange={update("scheme")}>
                      <MenuItem value="https">HTTPS / WSS</MenuItem>
                      <MenuItem value="http">HTTP / WS</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormControlLabel
                  control={<Switch checked={form.use_tls} onChange={update("use_tls")} />}
                  label="Usar conexão segura TLS (recomendado em produção)"
                />
              </Stack>
            </Box>
          )}

          <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid var(--lg-border)", background: "var(--lg-glass-panel)" }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>ProteÃ§Ã£o contra excesso de uso</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Esses limites evitam spam, loops acidentais e consumo excessivo do chat. Use 0 para desativar um limite especÃ­fico.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              <TextField
                label="Janela de bloqueio (minutos)"
                type="number"
                value={form.rate_limit_decay_minutes}
                onChange={update("rate_limit_decay_minutes")}
                inputProps={{ min: 1, max: 60 }}
                helperText="Janela usada para contar as tentativas."
              />
              <TextField
                label="Limite global do chat / minuto"
                type="number"
                value={form.rate_limit_global}
                onChange={update("rate_limit_global")}
                inputProps={{ min: 0, max: 5000 }}
                helperText="Total de requisiÃ§Ãµes do mÃ³dulo por usuÃ¡rio."
              />
              <TextField
                label="SincronizaÃ§Ãµes / minuto"
                type="number"
                value={form.rate_limit_sync}
                onChange={update("rate_limit_sync")}
                inputProps={{ min: 0, max: 5000 }}
                helperText="Listagens, leitura, entrega e histÃ³rico."
              />
              <TextField
                label="Mensagens enviadas / minuto"
                type="number"
                value={form.rate_limit_messages}
                onChange={update("rate_limit_messages")}
                inputProps={{ min: 0, max: 5000 }}
                helperText="Envio real de mensagens e anexos."
              />
              <TextField
                label="Eventos de digitaÃ§Ã£o / minuto"
                type="number"
                value={form.rate_limit_typing}
                onChange={update("rate_limit_typing")}
                inputProps={{ min: 0, max: 5000 }}
                helperText="InÃ­cio e parada do indicador de digitaÃ§Ã£o."
              />
              <TextField
                label="AtualizaÃ§Ãµes de presenÃ§a / minuto"
                type="number"
                value={form.rate_limit_presence}
                onChange={update("rate_limit_presence")}
                inputProps={{ min: 0, max: 5000 }}
                helperText="Heartbeat, online, ausente e offline."
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.2 }}>
            {config?.configured && (
              <Button
                variant="outlined"
                onClick={() => {
                  applyConfig(config);
                  setEditing(false);
                }}
                disabled={saving}
                sx={modalSecondaryButtonSx}
              >
                Cancelar
              </Button>
            )}
            <Button
              variant="contained"
              onClick={save}
              disabled={saving || testing}
              startIcon={<FeatherIcon icon="save" width="17" />}
              sx={modalPrimaryButtonSx}
            >
              {saving ? "Salvando..." : "Salvar credenciais"}
            </Button>
          </Box>
            </>
          )}

          {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}
        </Stack>
      </BaseCard>
      <DestructiveConfirmDialog
        open={deleteDialogOpen}
        title="Apagar configurações do chat"
        message="As credenciais e a conexão em tempo real serão removidas. O chat deixará de receber atualizações em tempo real até uma nova configuração ser salva."
        confirmLabel="Apagar configurações"
        loading={deleting}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={deleteCredentials}
      />
    </Box>
  );
}
