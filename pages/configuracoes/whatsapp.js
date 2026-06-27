import React, { useCallback, useEffect, useRef, useState } from "react";
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

function SecretInput({ label, value, onChange, placeholder, maskedValue = "" }) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const displayValue = !editing && !value && maskedValue ? maskedValue : value;

  return (
    <div>
      <label className="system-config-label" style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="system-config-input"
          type={visible ? "text" : "password"}
          value={displayValue}
          onFocus={() => {
            if (!value && maskedValue) {
              setEditing(true);
            }
          }}
          onBlur={() => {
            if (!value) {
              setEditing(false);
            }
          }}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••••••"}
          style={{ ...fieldStyle, paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--lg-text-muted)",
            fontSize: 13,
            padding: 4,
          }}
        >
          {visible ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    open: { label: "● Conectado", color: "var(--success)" },
    connecting: { label: "◌ Conectando", color: "var(--accent)" },
    close: { label: "● Desconectado", color: "var(--danger)" },
    disconnected: { label: "● Desconectado", color: "var(--danger)" },
    unknown: { label: "? Desconhecido", color: "var(--lg-text-muted)" },
  };
  const item = map[normalized] || map.unknown;

  return <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.label}</span>;
}

export default function WhatsappConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [testPhone, setTestPhone] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState({ status: "unknown", number: null });
  const [form, setForm] = useState({
    whatsapp_base_url: "",
    whatsapp_api_key: "",
    whatsapp_api_key_masked: "",
    whatsapp_instance_name: "",
    whatsapp_instance_token: "",
    whatsapp_ativo: false,
  });
  const pollRef = useRef(null);

  const notify = (type, message) => setFeedback({ type, message });

  const loadConfig = useCallback(async () => {
    const { data } = await api.get("/whatsapp/config");
    setForm({
      whatsapp_base_url: data?.whatsapp_base_url || "",
      whatsapp_api_key: data?.whatsapp_api_key || "",
      whatsapp_api_key_masked: data?.whatsapp_api_key_masked || "",
      whatsapp_instance_name: data?.whatsapp_instance_name || "",
      whatsapp_instance_token: data?.whatsapp_instance_token || "",
      whatsapp_ativo: Boolean(data?.whatsapp_ativo),
    });
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/whatsapp/status");
      setStatus(data || { status: "unknown", number: null });
      if (String(data?.status || "").toLowerCase() === "open" && showQr) {
        setShowQr(false);
        setQrCode(null);
        notify("success", "WhatsApp conectado com sucesso.");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (_) {
      setStatus({ status: "unknown", number: null });
    }
  }, [showQr]);

  useEffect(() => {
    Promise.all([loadConfig(), fetchStatus()])
      .catch(() => notify("danger", "Não foi possível carregar a configuração do WhatsApp."))
      .finally(() => setLoading(false));
  }, [fetchStatus, loadConfig]);

  useEffect(() => {
    if (showQr) {
      pollRef.current = setInterval(fetchStatus, 4000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showQr, fetchStatus]);

  const updateField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const salvar = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/whatsapp/config", form);
      setForm((prev) => ({
        ...prev,
        whatsapp_base_url: data?.whatsapp_base_url || prev.whatsapp_base_url,
        whatsapp_api_key: data?.whatsapp_api_key || "",
        whatsapp_api_key_masked: data?.whatsapp_api_key_masked || prev.whatsapp_api_key_masked,
        whatsapp_instance_name: data?.whatsapp_instance_name || prev.whatsapp_instance_name,
        whatsapp_instance_token: data?.whatsapp_instance_token || prev.whatsapp_instance_token,
        whatsapp_ativo: Boolean(data?.whatsapp_ativo),
      }));
      notify("success", "Configuração salva.");
      fetchStatus();
    } catch (error) {
      const message = error?.response?.data?.message || "Erro ao salvar a configuração.";
      notify("danger", message);
    } finally {
      setSaving(false);
    }
  };

  const testar = async () => {
    setTesting(true);
    try {
      const { data } = await api.post("/whatsapp/testar");
      if (data?.ok) {
        notify("success", `Conexão OK. Status: ${data.status || "open"}`);
      } else {
        notify("danger", data?.error || "Falha ao testar a conexão.");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Erro ao testar a conexão.";
      notify("danger", message);
    } finally {
      setTesting(false);
    }
  };

  const verQrCode = async () => {
    try {
      const { data } = await api.get("/whatsapp/qrcode");
      setQrCode(data?.qrcode || null);
      setShowQr(true);
    } catch (error) {
      const message = error?.response?.data?.message || "Erro ao gerar o QR code.";
      notify("danger", message);
    }
  };

  const desconectar = async () => {
    if (!window.confirm("Desconectar a sessão do WhatsApp? Será necessário escanear o QR code novamente para reconectar.")) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.post("/whatsapp/desconectar");
      setStatus({ status: "close", number: null });
      notify("success", "Sessão desconectada.");
      fetchStatus();
    } catch (error) {
      const message = error?.response?.data?.message || "Erro ao desconectar.";
      notify("danger", message);
    } finally {
      setDisconnecting(false);
    }
  };

  const enviarTeste = async () => {
    const numero = String(testPhone || "").replace(/\D/g, "");
    if (numero.length < 10) {
      notify("danger", "Informe um número válido com DDD.");
      return;
    }

    setSendingTest(true);
    try {
      await api.post("/whatsapp/enviar-teste", { telefone: testPhone });
      notify("success", "Mensagem de teste enviada.");
    } catch (error) {
      const message = error?.response?.data?.message || "Erro ao enviar a mensagem de teste.";
      notify("danger", message);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--lg-text-muted)" }}>Carregando...</div>;
  }

  return (
    <Box className="queue-page system-config-page whatsapp-config-page" sx={{ ...modalFormRootSx, ...systemConfigPageSx }}>
      <div className="system-config-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
          Configurações WhatsApp
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--lg-text-muted)", fontSize: 14 }}>
          Configuração geral do sistema para a integração com a Evolution API.
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

      <BaseCard
        title="Status da instância"
        sx={{ mb: 2.25 }}
        action={
          <div className="system-config-inline-actions">
            {String(status.status || "").toLowerCase() !== "open" ? (
              <button
                className="system-config-action system-config-action--primary"
                type="button"
                onClick={verQrCode}
                style={{ ...actionStyle, background: "var(--lg-accent)", color: "#000" }}
              >
                Escanear QR Code
              </button>
            ) : (
              <button
                className="system-config-action system-config-action--danger"
                type="button"
                onClick={desconectar}
                disabled={disconnecting}
                style={{
                  ...actionStyle,
                  background: "transparent",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  cursor: disconnecting ? "not-allowed" : "pointer",
                }}
              >
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </button>
            )}
            <button
              className="system-config-action system-config-action--secondary"
              type="button"
              onClick={fetchStatus}
              style={{
                ...actionStyle,
                background: "transparent",
                border: "1px solid var(--lg-border)",
                color: "var(--lg-text-muted)",
              }}
            >
              Atualizar
            </button>
          </div>
        }
      >
        <div className="system-config-section">
          <div style={{ fontSize: 12, color: "var(--lg-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Status da instância
          </div>
          <StatusChip status={status.status} />
          {status.number ? (
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--lg-text-muted)" }}>
              📱 {String(status.number).replace("@s.whatsapp.net", "")}
            </div>
          ) : null}
        </div>

        <div className="system-config-inline-actions" style={{ display: "none" }}>
          {String(status.status || "").toLowerCase() !== "open" ? (
            <button
              className="system-config-action system-config-action--primary"
              type="button"
              onClick={verQrCode}
              style={{ ...actionStyle, background: "var(--lg-accent)", color: "#000" }}
            >
              📷 Escanear QR Code
            </button>
          ) : (
            <button
              className="system-config-action system-config-action--danger"
              type="button"
              onClick={desconectar}
              disabled={disconnecting}
              style={{
                ...actionStyle,
                background: "transparent",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                cursor: disconnecting ? "not-allowed" : "pointer",
              }}
            >
              {disconnecting ? "⟳ Desconectando..." : "⏻ Desconectar"}
            </button>
          )}
          <button
            className="system-config-action system-config-action--secondary"
            type="button"
            onClick={fetchStatus}
            style={{
              ...actionStyle,
              background: "transparent",
              border: "1px solid var(--lg-border)",
              color: "var(--lg-text-muted)",
            }}
          >
            ↻ Atualizar
          </button>
        </div>
      </BaseCard>

      {showQr ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              ...panelStyle,
              background: "var(--lg-glass-modal)",
              padding: 28,
              width: "100%",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            <h3 className="font-display" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>
              Escanear QR Code
            </h3>
            <p style={{ margin: "0 0 18px", color: "var(--lg-text-muted)", fontSize: 13 }}>
              Abra o WhatsApp, vá em Dispositivos vinculados e escaneie o código abaixo.
            </p>

            {qrCode ? (
              <img
                src={String(qrCode).startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 12,
                  background: "#fff",
                  padding: 10,
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  width: 240,
                  height: 240,
                  margin: "0 auto",
                  borderRadius: 12,
                  background: "var(--lg-glass-input)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lg-text-muted)",
                }}
              >
                Carregando QR...
              </div>
            )}

            <div style={{ marginTop: 14, color: "var(--lg-text-muted)", fontSize: 12 }}>
              ◌ Aguardando conexão... a tela atualiza automaticamente.
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQr(false);
                setQrCode(null);
              }}
              style={{
                ...actionStyle,
                marginTop: 16,
                background: "transparent",
                border: "1px solid var(--lg-border)",
                color: "var(--lg-text-muted)",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      <BaseCard title="Credenciais da integração" sx={{ mb: 2.25 }}>
        <div className="system-config-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="system-config-label" style={labelStyle}>URL da Evolution API</label>
            <input
              className="system-config-input"
              value={form.whatsapp_base_url}
              onChange={(e) => updateField("whatsapp_base_url")(e.target.value)}
              style={fieldStyle}
              placeholder="http://192.168.0.115:8081"
            />
          </div>

          <SecretInput
            label="API Key (apikey)"
            value={form.whatsapp_api_key}
            onChange={updateField("whatsapp_api_key")}
            maskedValue={form.whatsapp_api_key_masked}
            placeholder="620096bf1e66..."
          />

          <div>
            <label className="system-config-label" style={labelStyle}>Nome da instância</label>
            <input
              className="system-config-input"
              value={form.whatsapp_instance_name}
              onChange={(e) => updateField("whatsapp_instance_name")(e.target.value)}
              style={fieldStyle}
              placeholder="sysdoc"
            />
          </div>

          <SecretInput
            label="Token da instância (opcional)"
            value={form.whatsapp_instance_token}
            onChange={updateField("whatsapp_instance_token")}
          />

          <label className="system-config-checkbox-label">
            <input
              type="checkbox"
              checked={form.whatsapp_ativo}
              onChange={(e) => updateField("whatsapp_ativo")(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--lg-accent)" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Ativar integração WhatsApp</span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8, borderTop: "1px solid var(--lg-border)" }}>
            <button
              className="system-config-action system-config-action--secondary"
              type="button"
              onClick={testar}
              disabled={testing}
              style={{
                ...actionStyle,
                background: "transparent",
                border: "1px solid var(--lg-accent)",
                color: "var(--lg-accent)",
                cursor: testing ? "not-allowed" : "pointer",
              }}
            >
              {testing ? "⟳ Testando..." : "🔌 Testar conexão"}
            </button>
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
                minWidth: 140,
              }}
            >
              {saving ? "⟳ Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </div>
      </BaseCard>

      <BaseCard
        title="Enviar mensagem de teste"
        subtitle="Informe um número com DDD para confirmar o envio."
      >
        <div className="system-config-section">
          {String(status.status || "").toLowerCase() !== "open" ? (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                background: "rgba(245, 166, 35, .08)",
                border: "1px solid rgba(245, 166, 35, .25)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--lg-text-accent)",
              }}
            >
              ⚠️ O WhatsApp precisa estar conectado para enviar mensagens. Escaneie o QR code primeiro.
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <label className="system-config-label" style={labelStyle}>Número do WhatsApp (com DDD)</label>
              <input
                className="system-config-input"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") enviarTeste();
                }}
                placeholder="11999998888"
                style={fieldStyle}
              />
            </div>
            <button
              className="system-config-action system-config-action--success"
              type="button"
              onClick={enviarTeste}
              disabled={sendingTest || String(status.status || "").toLowerCase() !== "open"}
              style={{
                ...actionStyle,
                background: sendingTest || String(status.status || "").toLowerCase() !== "open" ? "var(--lg-border)" : "var(--success)",
                color: sendingTest || String(status.status || "").toLowerCase() !== "open" ? "var(--lg-text-muted)" : "#fff",
                cursor: sendingTest || String(status.status || "").toLowerCase() !== "open" ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {sendingTest ? "⟳ Enviando..." : "📨 Enviar teste"}
            </button>
          </div>
        </div>
      </BaseCard>

      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "rgba(30,136,229,.08)",
          border: "1px solid rgba(30,136,229,.2)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--lg-text-accent)",
        }}
      >
        ℹ️ A integração usa a Evolution API configurada nesta tela. O QR code e o status dependem da instância salva.
      </div>
      </div>
    </Box>
  );
}
