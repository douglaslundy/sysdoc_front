import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { Campo, CampoTexto, Input } from "../../src/components/ui/campos";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { CaixaDeMarcacao } from "../../src/components/ui/caixa-de-marcacao";
import { Carregando } from "../../src/components/ui/carregando";
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape, DialogoTitulo } from "../../src/components/ui/dialogo";
import { Pilula } from "../../src/components/ui/pilula";
import { api } from "../../src/services/api";
import { useUid } from "../../src/lib/useUid";

function SecretInput({ label, value, onChange, placeholder, maskedValue = "" }) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const displayValue = !editing && !value && maskedValue ? maskedValue : value;
  const uid = useUid("segredo");

  return (
    <Campo id={uid} label={label}>
      {(p) => (
        <div className="relative">
          <Input
            {...p}
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
            className="pr-11"
          />
          <button
            type="button"
            aria-label={visible ? "Ocultar valor" : "Mostrar valor"}
            onClick={() => setVisible((prev) => !prev)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground outline-none hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
    </Campo>
  );
}

function StatusChip({ status }) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    open: { label: "Conectado", tom: "sucesso" },
    connecting: { label: "Conectando", tom: "alerta" },
    close: { label: "Desconectado", tom: "perigo" },
    disconnected: { label: "Desconectado", tom: "perigo" },
    unknown: { label: "Desconhecido", tom: "neutro" },
  };
  const item = map[normalized] || map.unknown;

  return <Pilula tom={item.tom}>{item.label}</Pilula>;
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

  const conectado = String(status.status || "").toLowerCase() === "open";
  const fecharQr = () => {
    setShowQr(false);
    setQrCode(null);
  };

  if (loading) {
    return <Carregando className="justify-center py-16">Carregando...</Carregando>;
  }

  return (
    <div className="ui-reset mx-auto flex max-w-3xl flex-col gap-4">
      <CabecalhoDePagina
        titulo="Configurações WhatsApp"
        subtitulo="Configuração geral do sistema para a integração com a Evolution API."
      />

      {feedback ? <Banner tom={feedback.type === "success" ? "sucesso" : "perigo"}>{feedback.message}</Banner> : null}

      <Card>
        <CardHeader>
          <CardTitle>Status da instância</CardTitle>
          <CardAction className="flex flex-wrap gap-2">
            {!conectado ? (
              <Button onClick={verQrCode}>Escanear QR Code</Button>
            ) : (
              <Button variant="destructive" onClick={desconectar} disabled={disconnecting}>
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </Button>
            )}
            <Button variant="outline" onClick={fetchStatus}>Atualizar</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Status da instância</div>
          <StatusChip status={status.status} />
          {status.number ? (
            <div className="mt-1 text-xs text-muted-foreground">{String(status.number).replace("@s.whatsapp.net", "")}</div>
          ) : null}
        </CardContent>
      </Card>

      <Dialogo aberto={showQr} aoFechar={fecharQr} tamanho="sm">
        <DialogoCabecalho>
          <div>
            <DialogoTitulo>Escanear QR Code</DialogoTitulo>
            <DialogoDescricao>Abra o WhatsApp, vá em Dispositivos vinculados e escaneie o código abaixo.</DialogoDescricao>
          </div>
        </DialogoCabecalho>

        <div className="flex flex-col items-center gap-3 text-center">
          {qrCode ? (
            <img
              src={String(qrCode).startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code WhatsApp"
              className="size-60 rounded-xl bg-white object-contain p-2.5"
            />
          ) : (
            <div className="flex size-60 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              Carregando QR...
            </div>
          )}
          <p className="text-xs text-muted-foreground">Aguardando conexão... a tela atualiza automaticamente.</p>
        </div>

        <DialogoRodape>
          <Button variant="outline" onClick={fecharQr}>Fechar</Button>
        </DialogoRodape>
      </Dialogo>

      <Card>
        <CardHeader><CardTitle>Credenciais da integração</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CampoTexto
            id="wa-base-url"
            label="URL da Evolution API"
            value={form.whatsapp_base_url}
            onChange={(e) => updateField("whatsapp_base_url")(e.target.value)}
            placeholder="http://192.168.0.115:8081"
          />

          <SecretInput
            label="API Key (apikey)"
            value={form.whatsapp_api_key}
            onChange={updateField("whatsapp_api_key")}
            maskedValue={form.whatsapp_api_key_masked}
            placeholder="620096bf1e66..."
          />

          <CampoTexto
            id="wa-instance"
            label="Nome da instância"
            value={form.whatsapp_instance_name}
            onChange={(e) => updateField("whatsapp_instance_name")(e.target.value)}
            placeholder="sysdoc"
          />

          <SecretInput
            label="Token da instância (opcional)"
            value={form.whatsapp_instance_token}
            onChange={updateField("whatsapp_instance_token")}
          />

          <CaixaDeMarcacao id="wa-ativo" marcado={form.whatsapp_ativo} aoMudar={updateField("whatsapp_ativo")}>
            <span className="font-semibold">Ativar integração WhatsApp</span>
          </CaixaDeMarcacao>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-3">
            <Button variant="outline" onClick={testar} disabled={testing}>
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
            <Button onClick={salvar} disabled={saving} className="min-w-[140px]">
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enviar mensagem de teste</CardTitle>
          <CardDescription>Informe um número com DDD para confirmar o envio.</CardDescription>
        </CardHeader>
        <CardContent>
          {!conectado ? (
            <div className="mb-4">
              <Banner tom="alerta">O WhatsApp precisa estar conectado para enviar mensagens. Escaneie o QR code primeiro.</Banner>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-[1_1_260px]">
              <CampoTexto
                id="wa-teste"
                label="Número do WhatsApp (com DDD)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") enviarTeste();
                }}
                placeholder="11999998888"
              />
            </div>
            <Button variant="success" onClick={enviarTeste} disabled={sendingTest || !conectado}>
              {sendingTest ? "Enviando..." : "Enviar teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Banner tom="info">A integração usa a Evolution API configurada nesta tela. O QR code e o status dependem da instância salva.</Banner>
    </div>
  );
}
