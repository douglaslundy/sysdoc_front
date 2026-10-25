import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent } from "../../src/components/ui/card";
import { DataTable } from "../../src/components/ui/data-table";
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from "../../src/components/ui/dialogo";
import { Paginacao } from "../../src/components/ui/paginacao";
import { Pilula } from "../../src/components/ui/pilula";
import { api } from "../../src/services/api";
import { deviceDetails, deviceSummary } from "../../src/utils/deviceSummary";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const clip = (text, max) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text);

const formatDate = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");

export default function IpsBanidosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [limit, setLimit] = useState("5");
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(0); // base 0 (Paginacao); a API usa base 1
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detalhe, setDetalhe] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/banned-ips", {
        params: {
          page: page + 1,
          per_page: perPage,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      // Desbaniu o último item da página: volta uma página.
      if (!res.data.data?.length && page > 0) setPage(page - 1);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.errors?.date_to?.[0] || e?.response?.data?.message || "Não foi possível carregar os IPs banidos.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    try {
      await fn();
      setError("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Operação não concluída.");
    }
  };

  const ban = () => act(async () => {
    await api.post("/banned-ips", { ip: ip.trim(), reason: reason.trim() || undefined });
    setIp("");
    setReason("");
  });

  const unban = (item) => act(() => api.delete(`/banned-ips/${item.id}`));

  useEffect(() => {
    api.get("/banned-ips/settings")
      .then((res) => setLimit(String(res.data.strike_limit)))
      .catch(() => setError("Não foi possível carregar a configuração de tentativas."));
  }, []);

  const saveLimit = async () => {
    try {
      const res = await api.put("/banned-ips/settings", { strike_limit: Number(limit) });
      setLimit(String(res.data.strike_limit));
      setError("");
      setSaved(true);
    } catch (e) {
      setSaved(false);
      setError(e?.response?.data?.errors?.strike_limit?.[0] || e?.response?.data?.message || "Não foi possível salvar.");
    }
  };

  const colunas = [
    { chave: "ip", titulo: "IP", render: (item) => <span className="text-base font-semibold" title={item.ip}>{clip(item.ip, 15)}</span> },
    {
      chave: "origem",
      titulo: "Origem do IP",
      render: (item) => (
        <>
          <span className="block text-sm" title={item.origin || ""}>{clip(item.origin, 30) || "—"}</span>
          {item.client_info ? <span className="block text-xs text-muted-foreground">{deviceSummary(item.client_info)}</span> : null}
        </>
      ),
    },
    { chave: "motivo", titulo: "Motivo", render: (item) => <span className="text-sm" title={item.reason || ""}>{clip(item.reason, 40) || "—"}</span> },
    { chave: "tipo", titulo: "Tipo", render: (item) => <Pilula tom={item.source === "auto" ? "alerta" : "info"}>{item.source === "auto" ? "Automático" : "Manual"}</Pilula> },
    { chave: "banido", titulo: "Banido em", render: (item) => <span className="text-sm">{formatDate(item.created_at)}</span> },
    { chave: "expira", titulo: "Expira em", render: (item) => <span className="text-sm">{item.expires_at ? formatDate(item.expires_at) : "Permanente"}</span> },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (item) => (
        <span className="inline-flex gap-2">
          <Button size="xs" variant="outline" title="Ver o log completo" onClick={() => setDetalhe(item)}>
            ver
          </Button>
          <Button size="icon-xs" variant="destructive" title="Desbanir" aria-label={`Desbanir ${item.ip}`} onClick={() => unban(item)}>
            <Trash2 />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDePagina
        titulo={`IPs banidos — ${total} ${total === 1 ? "registro" : "registros"}`}
        subtitulo="Robôs que varrem rotas inexistentes são banidos automaticamente. O limite conta 404 em rotas inexistentes em 10 minutos (padrão 5)."
      />

      {error ? <Banner tom="perigo">{error}</Banner> : null}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px] max-w-full">
              <CampoTexto
                id="ip-limite"
                type="number"
                label="Tentativas até bloquear"
                value={limit}
                min={1}
                max={1000}
                onChange={(e) => { setLimit(e.target.value); setSaved(false); }}
              />
            </div>
            <Button disabled={!limit || Number(limit) < 1} onClick={saveLimit}>Salvar</Button>
            {saved ? <span className="pb-2 text-sm text-success-text">Salvo.</span> : null}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px] max-w-full">
              <CampoTexto id="ip-banir" label="IP a banir" placeholder="IP a banir" value={ip} autoComplete="off" onChange={(e) => setIp(e.target.value)} />
            </div>
            <div className="min-w-[220px] flex-[1_1_280px]">
              <CampoTexto id="ip-motivo" label="Motivo" placeholder="Motivo" value={reason} autoComplete="off" onChange={(e) => setReason(e.target.value)} />
            </div>
            <Button disabled={!ip.trim()} onClick={ban}>Banir IP</Button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[200px] max-w-full">
              <CampoTexto id="ip-de" type="date" label="Banido de" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
            </div>
            <div className="w-[200px] max-w-full">
              <CampoTexto id="ip-ate" type="date" label="Banido até" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
            </div>
            {dateFrom || dateTo ? (
              <Button variant="outline" onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}>Limpar período</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <DataTable
        rotulo="IPs banidos"
        colunas={colunas}
        linhas={items}
        chaveDaLinha={(item) => item.id}
        carregando={loading}
        vazio="Nenhum IP banido."
      />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={perPage}
        opcoes={PER_PAGE_OPTIONS}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => { setPerPage(n); setPage(0); }}
      />

      <Dialogo aberto={Boolean(detalhe)} aoFechar={() => setDetalhe(null)} tamanho="lg">
        <DialogoCabecalho>
          <DialogoTitulo>Log do IP</DialogoTitulo>
        </DialogoCabecalho>
        {detalhe ? (
          <pre className="rounded-lg bg-muted p-3 font-mono text-xs break-words whitespace-pre-wrap">
            {[`IP: ${detalhe.ip}`, detalhe.reason ? `Motivo: ${detalhe.reason}` : "", deviceDetails(detalhe.client_info, detalhe.origin) || (detalhe.origin ? `Localização do IP: ${detalhe.origin}` : "")].filter(Boolean).join("\n")}
          </pre>
        ) : null}
        <DialogoRodape>
          <Button variant="outline" onClick={() => setDetalhe(null)}>Fechar</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
