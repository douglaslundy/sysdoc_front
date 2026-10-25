import React, { useEffect, useState } from "react";
import { AlertTriangle, Clipboard, Layers, Package } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";

const number = (value) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value || 0));

const colunasEstoque = [
  { chave: "produto", titulo: "Produto", render: (item) => item.nome },
  { chave: "codigo", titulo: "Código", render: (item) => item.codigo_interno || "-" },
  { chave: "disponivel", titulo: "Disponível", numerica: true, render: (item) => number(item.quantidade_disponivel) },
  { chave: "minimo", titulo: "Mínimo", numerica: true, render: (item) => number(item.estoque_minimo) },
];

const colunasMovimentacoes = [
  { chave: "produto", titulo: "Produto", render: (item) => item.produto },
  { chave: "tipo", titulo: "Tipo", render: (item) => String(item.tipo || "-").replace(/_/g, " ") },
  { chave: "quantidade", titulo: "Quantidade", numerica: true, render: (item) => number(item.quantidade) },
  { chave: "data", titulo: "Data", render: (item) => (item.created_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(item.created_at)) : "-") },
];

export default function AlmoxarifadoDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/almoxarifado")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard do almoxarifado.")
      );
  }, []);

  if (error) return <Banner tom="perigo">{error}</Banner>;
  if (!data) return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Esqueleto key={`metric-${index}`} className="h-[126px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Esqueleto key={`table-${index}`} className="h-80" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icone={Package} titulo="Produtos ativos" valor={number(data.totais?.produtos)} legenda="Itens cadastrados no almoxarifado" />
        <StatCard Icone={Layers} titulo="Saldo disponível" valor={number(data.totais?.quantidade_disponivel)} legenda="Soma das quantidades disponíveis" />
        <StatCard Icone={AlertTriangle} tom="perigo" titulo="Estoque abaixo do mínimo" valor={number(data.totais?.estoque_baixo)} legenda="Itens que exigem reposição" />
        <StatCard Icone={Clipboard} tom="info" titulo="Requisições pendentes" valor={number(data.totais?.requisicoes_pendentes)} legenda={`${number(data.totais?.movimentacoes_mes)} movimentações no mês`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Itens com estoque baixo</CardTitle></CardHeader>
          <CardContent>
            <DataTable rotulo="itens com estoque baixo" colunas={colunasEstoque} linhas={data.estoque_baixo || []} chaveDaLinha={(item) => `${item.codigo_interno}-${item.nome}`} vazio="Nenhum item com estoque baixo." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Movimentações recentes</CardTitle></CardHeader>
          <CardContent>
            <DataTable rotulo="movimentações recentes" colunas={colunasMovimentacoes} linhas={data.movimentacoes_recentes || []} chaveDaLinha={(item) => item.id} vazio="Nenhuma movimentação recente." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
