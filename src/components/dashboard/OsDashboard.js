import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Timer, Wrench } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { BarraDeProgresso } from "../ui/barra-de-progresso";
import { SelectNativo } from "../ui/campos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";

const number = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));

const STATUS = {
  aberta: "Aberta",
  atribuida: "Atribuída",
  em_atendimento: "Em atendimento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
const PRIORIDADE = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };

/** Horas decimais -> "2 d 3 h", "5,5 h" ou "40 min". */
export function formatarDuracao(horas) {
  const h = Number(horas || 0);
  if (h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1).replace(".", ",")} h`;
  const dias = Math.floor(h / 24);
  return `${dias} d ${Math.round(h - dias * 24)} h`;
}

export function Distribuicao({ titulo, itens, rotulo }) {
  const maximo = Math.max(1, ...itens.map((item) => Number(item.total)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ul className="grid gap-3">
            {itens.map((item) => (
              <li key={rotulo(item)} className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span>{rotulo(item)}</span>
                  <span className="font-mono">{number(item.total)}</span>
                </div>
                <BarraDeProgresso valor={Number(item.total)} maximo={maximo * 1.25} rotulo={rotulo(item)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const colunasTecnico = [
  { chave: "nome", titulo: "Técnico", render: (item) => item.nome },
  { chave: "total", titulo: "OS", numerica: true, render: (item) => number(item.total) },
  { chave: "concluidas", titulo: "Concluídas", numerica: true, render: (item) => number(item.concluidas) },
  { chave: "horas", titulo: "Tempo médio", numerica: true, render: (item) => formatarDuracao(item.horas_medias) },
];

export default function OsDashboard() {
  const [dias, setDias] = useState("30");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api.get("/dashboard/ordens-servico", { params: { dias } })
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard de ordens de serviço.")
      );
  }, [dias]);

  const seletor = (
    <div className="flex items-center justify-end gap-2">
      <label htmlFor="os-dias" className="text-sm text-muted-foreground">Período</label>
      <div className="w-44">
        <SelectNativo id="os-dias" value={dias} onChange={(e) => setDias(e.target.value)}>
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

  return (
    <div className="grid gap-4">
      {seletor}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icone={ClipboardList} titulo="OS no período" valor={number(t.total)} legenda={`${number(t.abertas)} aguardando atendimento`} />
        <StatCard Icone={Wrench} tom="info" titulo="Em atendimento" valor={number(t.em_atendimento)} legenda="Já iniciadas pelo técnico" />
        <StatCard Icone={CheckCircle2} tom="sucesso" titulo="Concluídas" valor={number(t.concluidas)} legenda={`${number(t.canceladas)} canceladas`} />
        <StatCard Icone={AlertTriangle} tom="perigo" titulo="Atrasadas" valor={number(t.atrasadas)} legenda="Prazo vencido e ainda não encerradas" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard Icone={Timer} titulo="Tempo médio de resolução" valor={formatarDuracao(data.tempo_medio_resolucao_horas)} legenda="Da abertura até a conclusão" />
        <StatCard Icone={Clock} tom="info" titulo="Tempo médio de atendimento" valor={data.tempo_medio_atendimento_min ? `${number(data.tempo_medio_atendimento_min)} min` : "—"} legenda="Tempo gasto informado pelo técnico" />
        <StatCard Icone={CheckCircle2} tom="sucesso" titulo="Concluídas no prazo" valor={data.taxa_no_prazo == null ? "—" : `${String(data.taxa_no_prazo).replace(".", ",")}%`} legenda="Entre as OS concluídas com prazo" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Distribuicao titulo="Por status" itens={data.por_status || []} rotulo={(item) => STATUS[item.status] || item.status} />
        <Distribuicao titulo="Por prioridade" itens={data.por_prioridade || []} rotulo={(item) => PRIORIDADE[item.prioridade] || item.prioridade} />
        <Distribuicao titulo="Por tipo de serviço" itens={data.por_tipo || []} rotulo={(item) => item.nome} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por técnico</CardTitle>
          <CardDescription>OS atribuídas no período e tempo médio de resolução.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable rotulo="desempenho por técnico" colunas={colunasTecnico} linhas={data.por_tecnico || []} chaveDaLinha={(item) => item.nome} vazio="Nenhuma OS atribuída no período." />
        </CardContent>
      </Card>
    </div>
  );
}
