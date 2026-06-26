import React, { useEffect, useState } from "react";
import { Alert, Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { modalFormRootSx } from "../../src/components/modal/_shared/modalFormStyles";
import { api } from "../../src/services/api";

const initialForm = {
  allow_external_protocols: true,
  allow_reopen: true,
  notify_whatsapp: false,
  default_priority: "normal",
  default_due_days: 5,
  observacoes: "",
};

const priorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "baixa", label: "Baixa" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export default function ProtocoloConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    api
      .get("/protocolos/configuracoes")
      .then(({ data }) => {
        setForm({
          allow_external_protocols: Boolean(data?.allow_external_protocols),
          allow_reopen: Boolean(data?.allow_reopen),
          notify_whatsapp: Boolean(data?.notify_whatsapp),
          default_priority: data?.default_priority || "normal",
          default_due_days: data?.default_due_days ?? 5,
          observacoes: data?.observacoes || "",
        });
      })
      .catch(() => setMessage("Não foi possível carregar as configurações do protocolo."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { data } = await api.put("/protocolos/configuracoes", form);
      setForm({
        allow_external_protocols: Boolean(data?.allow_external_protocols),
        allow_reopen: Boolean(data?.allow_reopen),
        notify_whatsapp: Boolean(data?.notify_whatsapp),
        default_priority: data?.default_priority || "normal",
        default_due_days: data?.default_due_days ?? 5,
        observacoes: data?.observacoes || "",
      });
      setMessage("Configurações do protocolo salvas com sucesso.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível salvar as configurações do protocolo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="body1">Carregando configurações do protocolo...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ ...modalFormRootSx, maxWidth: 1120, mx: "auto", p: { xs: 2, md: 3 } }} className="queue-page protocolo-page">
      <BaseCard
        title="Configurações do Protocolo"
        subtitle="Apenas regras do fluxo de protocolo, sem integração de envio."
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {message ? <Alert severity={message.toLowerCase().includes("não foi possível") ? "error" : "success"}>{message}</Alert> : null}
          <Alert severity="info">
            A configuração de WhatsApp fica em /configuracoes/whatsapp e a de e-mail em /configuracoes/email.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Prioridade padrão</InputLabel>
                <Select
                  value={form.default_priority}
                  label="Prioridade padrão"
                  onChange={(e) => setForm((prev) => ({ ...prev, default_priority: e.target.value }))}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Prazo padrão em dias"
                value={form.default_due_days}
                onChange={(e) => setForm((prev) => ({ ...prev, default_due_days: e.target.value }))}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Observações"
                value={form.observacoes}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  type="button"
                  variant={form.allow_external_protocols ? "contained" : "outlined"}
                  onClick={() => setForm((prev) => ({ ...prev, allow_external_protocols: !prev.allow_external_protocols }))}
                >
                  {form.allow_external_protocols ? "Protocolos externos permitidos" : "Protocolos externos desativados"}
                </Button>
                <Button
                  type="button"
                  variant={form.allow_reopen ? "contained" : "outlined"}
                  onClick={() => setForm((prev) => ({ ...prev, allow_reopen: !prev.allow_reopen }))}
                >
                  {form.allow_reopen ? "Reabertura permitida" : "Reabertura desativada"}
                </Button>
                <Button
                  type="button"
                  variant={form.notify_whatsapp ? "contained" : "outlined"}
                  onClick={() => setForm((prev) => ({ ...prev, notify_whatsapp: !prev.notify_whatsapp }))}
                >
                  {form.notify_whatsapp ? "Alertas WhatsApp ativados" : "Alertas WhatsApp desativados"}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </Stack>
        </Box>
      </BaseCard>
    </Box>
  );
}
