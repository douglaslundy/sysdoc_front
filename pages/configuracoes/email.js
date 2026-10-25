import React, { useCallback, useEffect, useState } from "react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { CaixaDeMarcacao } from "../../src/components/ui/caixa-de-marcacao";
import { Carregando } from "../../src/components/ui/carregando";
import { api } from "../../src/services/api";

export default function EmailConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "",
    from_address: "",
    from_name: "",
    email_ativo: false,
  });
  const [testRecipient, setTestRecipient] = useState("");

  const notify = (type, message) => setFeedback({ type, message });

  const loadConfig = useCallback(async () => {
    const { data } = await api.get("/email/config");
    setForm({
      smtp_host: data?.smtp_host || "",
      smtp_port: data?.smtp_port || "",
      smtp_username: data?.smtp_username || "",
      smtp_password: data?.smtp_password || "",
      smtp_encryption: data?.smtp_encryption || "",
      from_address: data?.from_address || "",
      from_name: data?.from_name || "",
      email_ativo: Boolean(data?.email_ativo),
    });
  }, []);

  useEffect(() => {
    loadConfig()
      .catch(() => notify("danger", "Não foi possível carregar a configuração de e-mail."))
      .finally(() => setLoading(false));
  }, [loadConfig]);

  const salvar = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/email/config", form);
      setForm((prev) => ({
        ...prev,
        smtp_host: data?.smtp_host || prev.smtp_host,
        smtp_port: data?.smtp_port || prev.smtp_port,
        smtp_username: data?.smtp_username || prev.smtp_username,
        smtp_password: data?.smtp_password || prev.smtp_password,
        smtp_encryption: data?.smtp_encryption || prev.smtp_encryption,
        from_address: data?.from_address || prev.from_address,
        from_name: data?.from_name || prev.from_name,
        email_ativo: Boolean(data?.email_ativo),
      }));
      notify("success", "Configuração de e-mail salva.");
    } catch (error) {
      notify("danger", error?.response?.data?.message || "Erro ao salvar a configuração de e-mail.");
    } finally {
      setSaving(false);
    }
  };

  const testar = async () => {
    const destinatario = String(testRecipient || "").trim();
    if (!destinatario) {
      notify("danger", "Informe um destinatário de teste.");
      return;
    }

    setTesting(true);
    try {
      await api.post("/email/testar", { destinatario });
      notify("success", "E-mail de teste enviado.");
    } catch (error) {
      notify("danger", error?.response?.data?.message || "Erro ao enviar o e-mail de teste.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <Carregando className="justify-center py-16">Carregando...</Carregando>;
  }

  const campo = (nome) => ({ target: { value } }) => setForm((prev) => ({ ...prev, [nome]: value }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <CabecalhoDePagina
        titulo="Configurações E-mail"
        subtitulo="Configuração do motor de envio por e-mail usado pelos alertas do sistema."
      />

      {feedback ? <Banner tom={feedback.type === "success" ? "sucesso" : "perigo"}>{feedback.message}</Banner> : null}

      <Card>
        <CardHeader><CardTitle>Servidor SMTP</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CampoTexto id="smtp-host" label="Host SMTP" value={form.smtp_host} onChange={campo("smtp_host")} placeholder="smtp.exemplo.com" />

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto id="smtp-port" label="Porta" value={form.smtp_port} onChange={campo("smtp_port")} placeholder="587" />
            <CampoTexto id="smtp-encryption" label="Criptografia" value={form.smtp_encryption} onChange={campo("smtp_encryption")} placeholder="tls" />
          </div>

          <CampoTexto id="smtp-username" label="Usuário" value={form.smtp_username} onChange={campo("smtp_username")} placeholder="usuario@exemplo.com" />
          <CampoTexto id="smtp-password" label="Senha" type="password" value={form.smtp_password} onChange={campo("smtp_password")} placeholder="............" />

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto id="from-address" label="E-mail remetente" value={form.from_address} onChange={campo("from_address")} placeholder="noreply@exemplo.com" />
            <CampoTexto id="from-name" label="Nome remetente" value={form.from_name} onChange={campo("from_name")} placeholder="Sysdoc" />
          </div>

          <CaixaDeMarcacao id="email-ativo" marcado={form.email_ativo} aoMudar={(marcado) => setForm((prev) => ({ ...prev, email_ativo: marcado }))}>
            <span className="font-semibold">Ativar integração de e-mail</span>
          </CaixaDeMarcacao>

          <div className="flex justify-end">
            <Button onClick={salvar} disabled={saving} className="min-w-[150px]">
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de envio</CardTitle>
          <CardDescription>Informe um destinatário para validar o servidor SMTP.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-[1_1_260px]">
              <CampoTexto id="email-teste" label="E-mail destinatário" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="destino@exemplo.com" />
            </div>
            <Button variant="success" onClick={testar} disabled={testing}>
              {testing ? "Enviando..." : "Enviar teste"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
