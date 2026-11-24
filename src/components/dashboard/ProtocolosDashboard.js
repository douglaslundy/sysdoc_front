import React, { useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, Inbox, Timer } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { SelectNativo } from "../ui/campos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";
import { Distribuicao, formatarDuracao } from "./OsDashboard";
import Chart from "../charts/ApexChartSafe";
import { ColorModeContext } from "../../contexts/ThemeContext";

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

// Cores validadas (dataviz/validate_palette): azul = entradas, laranja = resolvidos; passo próprio no escuro.
const CORES = {
  entradas: { light: "#2a78d6", dark: "#3987e5" },
  resolvidos: { light: "#eb6834", dark: "#d95926" },
};

const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ddmm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Um ponto por dia do período (dias sem registro = 0), do mais antigo ao de hoje. */
export function serieDiaria(linhas, campo, totalDias) {
  const porDia = new Map((linhas || []).map((l) => [String(l.dia).slice(0, 10), Number(l[campo] || 0)]));
  const hoje = new Date();
  return Array.from({ length: totalDias }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (totalDias - 1 - i));
    const dia = isoLocal(d);
    return { dia, total: porDia.get(dia) || 0 };
  });
}

function GraficoPorDia({ titulo, descricao, pontos, cor, nomeSerie }) {
  const { mode } = useContext(ColorModeContext);
  const escuro = mode === "dark";
  const pico = pontos.reduce((melhor, p) => (p.total > (melhor?.total ?? 0) ? p : melhor), null);
  const maiores = [...pontos].filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const tinta = escuro ? "#c3c2b7" : "#52514c";
  const linhaGrade = escuro ? "rgba(240,239,236,0.08)" : "rgba(26,26,25,0.08)";
  const corSerie = cor[escuro ? "dark" : "light"];

  const opcoes = {
    chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: "transparent", fontFamily: "inherit" },
    colors: [corSerie],
    stroke: { width: 2, curve: "straight" },
    markers: { size: 0, hover: { size: 5 }, strokeColors: escuro ? "#1a1a19" : "#fcfcfb", strokeWidth: 2 },
    dataLabels: { enabled: false },
    grid: { borderColor: linhaGrade, strokeDashArray: 0, xaxis: { lines: { show: false } } },
    xaxis: {
      categories: pontos.map((p) => ddmm(p.dia)),
      tickAmount: Math.min(10, pontos.length),
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: tinta, fontSize: "11px" } },
      axisBorder: { color: linhaGrade },
      axisTicks: { show: false },
      crosshairs: { show: true, stroke: { color: tinta, width: 1, dashArray: 3 } },
      tooltip: { enabled: false },
    },
    yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: tinta }, formatter: (v) => number(Math.round(v)) } },
    tooltip: { theme: escuro ? "dark" : "light", x: { show: true }, y: { formatter: (v) => `${number(v)} protocolo${v === 1 ? "" : "s"}` } },
    legend: { show: false },
    annotations: pico && pico.total > 0 ? {
      points: [{
        x: ddmm(pico.dia),
        y: pico.total,
        marker: { size: 5, fillColor: corSerie, strokeColor: escuro ? "#1a1a19" : "#fcfcfb", strokeWidth: 2 },
        label: { text: `Pico: ${number(pico.total)}`, borderWidth: 0, offsetY: -4, style: { background: "transparent", color: tinta, fontSize: "11px" } },
      }],
    } : {},
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>
          {pico && pico.total > 0 ? `${descricao} Dia com mais: ${ddmm(pico.dia)} (${number(pico.total)}).` : `${descricao} Sem registros no período.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={`${titulo}: gráfico de linhas por dia`}>
          <Chart type="line" height={260} options={opcoes} series={[{ name: nomeSerie, data: pontos.map((p) => p.total) }]} />
        </div>
        {maiores.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Ver os dias com mais {nomeSerie.toLowerCase()}</summary>
            <table className="mt-2 w-full text-left">
              <thead><tr><th className="py-1 font-medium">Dia</th><th className="py-1 text-right font-medium">{nomeSerie}</th></tr></thead>
              <tbody>
                {maiores.map((p) => (
                  <tr key={p.dia}><td className="py-1">{ddmm(p.dia)}</td><td className="py-1 text-right font-mono">{number(p.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

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

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficoPorDia
          titulo="Entradas por dia"
          descricao="Protocolos abertos em cada dia do período."
          nomeSerie="Entradas"
          cor={CORES.entradas}
          pontos={serieDiaria(data.por_dia, "abertos", Number(data.periodo_dias || periodo))}
        />
        <GraficoPorDia
          titulo="Resolvidos por dia"
          descricao="Protocolos concluídos em cada dia do período (pela data da conclusão)."
          nomeSerie="Resolvidos"
          cor={CORES.resolvidos}
          pontos={serieDiaria(data.resolvidos_por_dia, "resolvidos", Number(data.periodo_dias || periodo))}
        />
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
