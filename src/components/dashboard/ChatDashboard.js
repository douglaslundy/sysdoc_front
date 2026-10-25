import React, { useEffect, useState } from "react";
import { File, Layers, Mail, MessageCircle, Paperclip, Radio, UserCheck, Users } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";

const number = (value) =>
  new Intl.NumberFormat("pt-BR").format(Number(value || 0));

const bytes = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(1)} GB`;
};

const colunasHistorico = [
  {
    chave: "data",
    titulo: "Data",
    render: (item) => new Intl.DateTimeFormat("pt-BR").format(new Date(`${String(item.usage_date).slice(0, 10)}T12:00:00`)),
  },
  { chave: "mensagens", titulo: "Mensagens", numerica: true, render: (item) => number(item.messages_sent) },
  { chave: "eventos", titulo: "Eventos", numerica: true, render: (item) => number(item.events_published) },
  { chave: "pico", titulo: "Pico de conexões", numerica: true, render: (item) => number(item.peak_connections) },
  { chave: "anexos", titulo: "Anexos", numerica: true, render: (item) => number(item.attachments_sent) },
  { chave: "falhas", titulo: "Falhas", numerica: true, render: (item) => number(item.failed_events) },
];

function Uso({ titulo, linhaEsquerda, percentual, casas, aviso, legenda }) {
  return (
    <Card>
      <CardContent className="grid gap-2">
        <p className="font-bold">{titulo}</p>
        <div className="flex justify-between text-sm">
          <span>{linhaEsquerda}</span>
          <span>{percentual.toFixed(casas)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={titulo}
          aria-valuenow={Math.round(percentual)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[9px] overflow-hidden rounded-full bg-border"
        >
          <div className={`h-full rounded-full ${aviso ? "bg-primary" : "bg-success-strong"}`} style={{ width: `${percentual}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{legenda}</p>
      </CardContent>
    </Card>
  );
}

export default function ChatDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/chat")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(
          requestError?.response?.data?.message ||
            "Não foi possível carregar o dashboard do chat."
        )
      );
  }, []);

  if (error) return <Banner tom="perigo">{error}</Banner>;
  if (!data) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Esqueleto key={`metric-${index}`} className="h-[126px]" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Esqueleto key={`progress-${index}`} className="h-[150px]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Esqueleto key={`small-${index}`} className="h-[100px]" />
          ))}
        </div>
      </div>
    );
  }

  const dailyEvents = Number(data.today?.events_published || 0);
  const isSoketi = data.limits?.engine === "soketi";
  const eventLimit = data.limits?.daily_messages
    ? Number(data.limits.daily_messages)
    : null;
  const connectionLimit = data.limits?.concurrent_connections
    ? Number(data.limits.concurrent_connections)
    : null;
  const currentConnections = Number(data.current?.connections || 0);
  const dailyPercent = eventLimit
    ? Math.min(100, (dailyEvents / eventLimit) * 100)
    : 0;
  const connectionPercent = connectionLimit
    ? Math.min(100, (currentConnections / connectionLimit) * 100)
    : 0;

  return (
    <div className="grid gap-4">
      <Banner tom="info">
        {isSoketi
          ? "O SysDoc está monitorando o uso do servidor Soketi. Os limites dependem da capacidade do servidor onde ele está hospedado."
          : "O sistema registra publicações e conexões do chat. No Pusher, uma publicação entregue a vários usuários pode consumir mais de uma mensagem; confirme o valor faturável no painel do provedor."}
      </Banner>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icone={MessageCircle} titulo="Mensagens hoje" valor={number(data.today?.messages_sent)} legenda={`${number(data.month?.messages_sent)} no mes`} />
        <StatCard Icone={Radio} tom="info" titulo="Eventos publicados hoje" valor={number(dailyEvents)} legenda={`${number(data.month?.events_published)} no mes`} />
        <StatCard Icone={Users} tom="sucesso" titulo="Conexões atuais" valor={number(currentConnections)} legenda={`${number(data.today?.peak_connections)} pico hoje`} />
        <StatCard Icone={Paperclip} titulo="Anexos no mes" valor={number(data.month?.attachments_sent)} legenda={bytes(data.month?.attachment_bytes)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Uso
          titulo="Consumo diário do plano"
          linhaEsquerda={`${number(dailyEvents)} eventos registrados`}
          percentual={dailyPercent}
          casas={2}
          aviso={dailyPercent >= 80}
          legenda={eventLimit
            ? `Referência: ${number(eventLimit)} mensagens por dia no ${data.limits?.plan}.`
            : "Sem limite fixo configurado pelo provedor. Acompanhe a capacidade do servidor Soketi."}
        />
        <Uso
          titulo="Conexões simultâneas"
          linhaEsquerda={`${number(currentConnections)} conexões`}
          percentual={connectionPercent}
          casas={1}
          aviso={connectionPercent >= 80}
          legenda={connectionLimit
            ? `Limite de ${number(connectionLimit)} conexões simultâneas.`
            : "Sem limite fixo configurado. O teto depende dos recursos do servidor Soketi."}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico dos últimos 30 dias</CardTitle>
          <CardDescription>Mensagens, eventos, pico de conexões, anexos e falhas registrados pelo SysDoc.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable rotulo="histórico dos últimos 30 dias" colunas={colunasHistorico} linhas={data.daily || []} chaveDaLinha={(item) => item.usage_date} vazio="Sem histórico no período." />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard Icone={Layers} titulo="Conversas" valor={number(data.totals?.conversations)} legenda="Total persistido" />
        <StatCard Icone={Mail} titulo="Mensagens" valor={number(data.totals?.messages)} legenda={`${number(data.current?.unread_messages)} não lidas`} />
        <StatCard Icone={File} titulo="Arquivos" valor={number(data.totals?.attachments)} legenda={bytes(data.totals?.storage_bytes)} />
        <StatCard Icone={UserCheck} tom="sucesso" titulo="Usuários online" valor={number(data.current?.online_users)} legenda={`${number(data.month?.connection_events)} eventos de presença no mês`} />
      </div>
    </div>
  );
}
