import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, Inbox, Timer } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { SelectNativo } from "../ui/campos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";
import { Distribuicao, formatarDuracao } from "./OsDashboard";

const number = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const dias = (valor) => `${String(Number(valor || 0).toFixed(1)).replace(".", ",")} d`;

const STATUS = {
  novo: "Novo",
  recebido: "Recebido",
  encaminhado: "Encaminhado",
  devolvido: "Devolvido",
  reaberto: "Reaberto",
  encerrado: "Concluído",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
const PRIORIDADE = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };

const colunas = (titulo) => [
  { chave: "nome", titulo, render: (item) => item.nome },
  { chave: "abertos", titulo: "Em aberto", numerica: true, render: (item) => number(item.abertos) },
  { chave: "vencidos", titulo: "Vencidos", numerica: true, render: (item) => number(item.vencidos) },
  { chave: "parado", titulo: "Parado em média", numerica: true, render: (item) => dias(item.dias_parado) },
];

function Ranking({ titulo, descricao, coluna, linhas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable rotulo={titulo} colunas={colunas(coluna)} linhas={linhas || []} chaveDaLinha={(item) => item.nome} vazio="Nenhum protocolo em aberto." />
      </CardContent>
    </Card>
  );
}

export default function ProtocolosDashboard() {
  const [periodo, setPeriodo] = useState("30");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api.get("/dashboard/protocolos", { params: { dias: periodo } })
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard de protocolos.")
      );
  }, [periodo]);

  const seletor = (
    <div className="flex items-center justify-end gap-2">
      <label htmlFor="protocolos-dias" className="text-sm text-muted-foreground">Período</label>
      <div className="w-44">
        <SelectNativo id="protocolos-dias" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </SelectNativo>
      </div>
    </div>
  );

  if (error) return <Banner tom="perigo">{error}</Banner>;
  if (!data) return (
    <div className="grid gap-4">
      {seletor}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Esqueleto key={`metric-${index}`} className="h-[126px]" />
        ))}
      </div>
      <Esqueleto className="h-80" />
    </div>
  );

  const t = data.totais || {};
  const taxa = data.taxa_no_prazo == null ? "—" : `${String(data.taxa_no_prazo).replace(".", ",")}%`;

  return (
    <div className="grid gap-4">
      {seletor}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icone={Inbox} titulo="Em aberto agora" valor={number(t.abertos)} legenda={`${number(t.novos)} ainda não abertos pelo destinatário`} />
        <StatCard Icone={AlertTriangle} tom="perigo" titulo="Vencidos" valor={number(t.vencidos)} legenda="Prazo vencido e ainda em aberto" />
        <StatCard Icone={Clock} tom="primario" titulo="Vencem em até 3 dias" valor={number(t.vence_em_breve)} legenda="Em aberto, prazo próximo" />
        <StatCard Icone={FileText} tom="info" titulo="Abertos no período" valor={number(t.total)} legenda={`${number(t.concluidos)} concluídos e ${number(t.cancelados)} cancelados`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard Icone={Timer} titulo="Tempo médio até o recebimento" valor={formatarDuracao(data.tempo_medio_recebimento_horas)} legenda="Da abertura até o destinatário receber" />
        <StatCard Icone={Timer} tom="info" titulo="Tempo médio até a conclusão" valor={formatarDuracao(data.tempo_medio_conclusao_horas)} legenda="Da abertura até o encerramento" />
        <StatCard Icone={CheckCircle2} tom="sucesso" titulo="Concluídos no prazo" valor={taxa} legenda="Entre os concluídos com prazo definido" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Distribuicao titulo="Por status" itens={data.por_status || []} rotulo={(item) => STATUS[item.status] || item.status} />
        <Distribuicao titulo="Por prioridade" itens={data.por_prioridade || []} rotulo={(item) => PRIORIDADE[item.prioridade] || item.prioridade} />
        <Distribuicao titulo="Por tipo" itens={data.por_tipo || []} rotulo={(item) => item.nome} />
      </div>

      {(data.por_secretaria || []).length > 1 && (
        <Ranking titulo="Por secretaria" descricao="Protocolos em aberto agora em cada secretaria." coluna="Secretaria" linhas={data.por_secretaria} />
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Ranking titulo="Por unidade de destino" descricao="Onde os protocolos em aberto estão parados." coluna="Unidade" linhas={data.por_unidade} />
        <Ranking titulo="Por responsável" descricao="Quem está com os protocolos em aberto." coluna="Responsável" linhas={data.por_responsavel} />
      </div>
    </div>
  );
}
