import React, { useEffect, useState } from "react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoSelecao, CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent } from "../../src/components/ui/card";
import { Carregando } from "../../src/components/ui/carregando";
import { api } from "../../src/services/api";

const initialForm = {
  allow_external_protocols: true,
  allow_reopen: true,
  notify_whatsapp: false,
  default_priority: "normal",
  default_due_days: 10,
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
          default_due_days: data?.default_due_days ?? 10,
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
        default_due_days: data?.default_due_days ?? 10,
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
    return <Carregando className="justify-center py-16">Carregando configurações do protocolo...</Carregando>;
  }

  const alterna = (campo) => () => setForm((prev) => ({ ...prev, [campo]: !prev[campo] }));

  return (
    <div className="mx-auto max-w-[1120px]">
      <CabecalhoDePagina
        titulo="Configurações do Protocolo"
        subtitulo="Apenas regras do fluxo de protocolo, sem integração de envio."
      />
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {message ? <Banner tom={message.toLowerCase().includes("não foi possível") ? "perigo" : "sucesso"}>{message}</Banner> : null}
            <Banner tom="info">
              A configuração de WhatsApp fica em /configuracoes/whatsapp e a de e-mail em /configuracoes/email.
            </Banner>

            <div className="grid gap-4 md:grid-cols-3">
              <CampoSelecao
                id="proto-prioridade"
                label="Prioridade padrão"
                value={form.default_priority}
                onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, default_priority: value }))}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </CampoSelecao>

              <CampoTexto
                id="proto-prazo"
                type="number"
                label="Prazo padrão em dias"
                value={form.default_due_days}
                onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, default_due_days: value }))}
                min={1}
                max={365}
              />

              <CampoTexto
                id="proto-obs"
                label="Observações"
                value={form.observacoes}
                onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, observacoes: value }))}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant={form.allow_external_protocols ? "default" : "outline"} aria-pressed={form.allow_external_protocols} onClick={alterna("allow_external_protocols")}>
                {form.allow_external_protocols ? "Protocolos externos permitidos" : "Protocolos externos desativados"}
              </Button>
              <Button type="button" variant={form.allow_reopen ? "default" : "outline"} aria-pressed={form.allow_reopen} onClick={alterna("allow_reopen")}>
                {form.allow_reopen ? "Reabertura permitida" : "Reabertura desativada"}
              </Button>
              <Button type="button" variant={form.notify_whatsapp ? "default" : "outline"} aria-pressed={form.notify_whatsapp} onClick={alterna("notify_whatsapp")}>
                {form.notify_whatsapp ? "Alertas WhatsApp ativados" : "Alertas WhatsApp desativados"}
              </Button>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
