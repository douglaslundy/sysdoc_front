import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { modalFormRootSx } from "../../src/components/modal/_shared/modalFormStyles";
import { systemConfigPageSx } from "../../src/components/systemConfig/systemConfigPageStyles";
import { api } from "../../src/services/api";

const panelStyle = {
  background: "var(--lg-glass-panel)",
  border: "1px solid var(--lg-border)",
  borderRadius: 14,
  boxShadow: "var(--lg-shadow-panel)",
};

const fieldStyle = {
  width: "100%",
  minHeight: 48,
  padding: "12px 14px",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--lg-text-muted)",
  marginBottom: 6,
};

const actionStyle = {
  minHeight: 44,
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

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
    return <div style={{ padding: 40, color: "var(--lg-text-muted)" }}>Carregando...</div>;
  }

  return (
    <Box className="queue-page system-config-page email-config-page" sx={{ ...modalFormRootSx, ...systemConfigPageSx }}>
      <div className="system-config-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
          Configurações E-mail
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--lg-text-muted)", fontSize: 14 }}>
          Configuração do motor de envio por e-mail usado pelos alertas do sistema.
        </p>
      </div>

      {feedback ? (
        <div
          style={{
            ...panelStyle,
            marginBottom: 16,
            padding: "12px 16px",
            borderColor: feedback.type === "success" ? "rgba(22,163,74,.35)" : "rgba(220,38,38,.35)",
            color: feedback.type === "success" ? "var(--success)" : "var(--danger)",
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      <BaseCard title="Servidor SMTP" sx={{ mb: 2.25 }}>
        <div className="system-config-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="system-config-label" style={labelStyle}>Host SMTP</label>
            <input className="system-config-input" value={form.smtp_host} onChange={(e) => setForm((prev) => ({ ...prev, smtp_host: e.target.value }))} style={fieldStyle} placeholder="smtp.exemplo.com" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div>
              <label className="system-config-label" style={labelStyle}>Porta</label>
              <input className="system-config-input" value={form.smtp_port} onChange={(e) => setForm((prev) => ({ ...prev, smtp_port: e.target.value }))} style={fieldStyle} placeholder="587" />
            </div>
            <div>
              <label className="system-config-label" style={labelStyle}>Criptografia</label>
              <input className="system-config-input" value={form.smtp_encryption} onChange={(e) => setForm((prev) => ({ ...prev, smtp_encryption: e.target.value }))} style={fieldStyle} placeholder="tls" />
            </div>
          </div>

          <div>
            <label className="system-config-label" style={labelStyle}>Usuário</label>
            <input className="system-config-input" value={form.smtp_username} onChange={(e) => setForm((prev) => ({ ...prev, smtp_username: e.target.value }))} style={fieldStyle} placeholder="usuario@exemplo.com" />
          </div>

          <div>
            <label className="system-config-label" style={labelStyle}>Senha</label>
            <input
              className="system-config-input"
              type="password"
              value={form.smtp_password}
              onChange={(e) => setForm((prev) => ({ ...prev, smtp_password: e.target.value }))}
              style={fieldStyle}
              placeholder="............"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div>
              <label className="system-config-label" style={labelStyle}>E-mail remetente</label>
              <input className="system-config-input" value={form.from_address} onChange={(e) => setForm((prev) => ({ ...prev, from_address: e.target.value }))} style={fieldStyle} placeholder="noreply@exemplo.com" />
            </div>
            <div>
              <label className="system-config-label" style={labelStyle}>Nome remetente</label>
              <input className="system-config-input" value={form.from_name} onChange={(e) => setForm((prev) => ({ ...prev, from_name: e.target.value }))} style={fieldStyle} placeholder="Sysdoc" />
            </div>
          </div>

          <label className="system-config-checkbox-label">
            <input
              type="checkbox"
              checked={form.email_ativo}
              onChange={(e) => setForm((prev) => ({ ...prev, email_ativo: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--lg-accent)" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Ativar integração de e-mail</span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="system-config-action system-config-action--primary"
              type="button"
              onClick={salvar}
              disabled={saving}
              style={{
                ...actionStyle,
                background: saving ? "var(--lg-border)" : "var(--lg-accent)",
                color: saving ? "var(--lg-text-muted)" : "#000",
                cursor: saving ? "not-allowed" : "pointer",
                minWidth: 150,
              }}
            >
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </div>
      </BaseCard>

      <BaseCard
        title="Teste de envio"
        subtitle="Informe um destinatário para validar o servidor SMTP."
      >
        <div className="system-config-section">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <label className="system-config-label" style={labelStyle}>E-mail destinatário</label>
              <input
                className="system-config-input"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="destino@exemplo.com"
                style={fieldStyle}
              />
            </div>
            <button
              className="system-config-action system-config-action--success"
              type="button"
              onClick={testar}
              disabled={testing}
              style={{
                ...actionStyle,
                background: testing ? "var(--lg-border)" : "var(--success)",
                color: testing ? "var(--lg-text-muted)" : "#fff",
                cursor: testing ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {testing ? "Enviando..." : "Enviar teste"}
            </button>
          </div>
        </div>
      </BaseCard>
      </div>
    </Box>
  );
}
