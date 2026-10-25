import React, { useEffect, useState } from "react";
import { Archive, CheckCircle2, Copy, HardDrive } from "lucide-react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DataTable } from "../ui/data-table";
import { Esqueleto } from "../ui/esqueleto";
import { StatCard } from "../ui/stat-card";

const number = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const bytes = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
};

const colunas = [
  { chave: "documento", titulo: "Documento", render: (item) => item.titulo },
  { chave: "tipo", titulo: "Tipo", render: (item) => item.tipo || "-" },
  { chave: "status", titulo: "Status", render: (item) => String(item.status || "-").replace(/_/g, " ") },
  { chave: "sigilo", titulo: "Sigilo", render: (item) => String(item.sigilo || "-").replace(/_/g, " ") },
  { chave: "versao", titulo: "Versão", numerica: true, render: (item) => number(item.current_version_number) },
  { chave: "atualizacao", titulo: "Atualização", render: (item) => (item.updated_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(item.updated_at)) : "-") },
];

export default function ArquivoDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/arquivo")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || "Não foi possível carregar o dashboard do arquivo.")
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
      <Esqueleto className="h-80" />
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icone={Archive} titulo="Documentos ativos" valor={number(data.totais?.documentos)} legenda={`${number(data.totais?.documentos_mes)} adicionados no mês`} />
        <StatCard Icone={Copy} tom="info" titulo="Versões armazenadas" valor={number(data.totais?.versoes)} legenda="Histórico de versões preservado" />
        <StatCard Icone={HardDrive} titulo="Espaço ocupado" valor={bytes(data.totais?.tamanho_bytes)} legenda="Soma dos arquivos de todas as versões" />
        <StatCard Icone={CheckCircle2} tom="sucesso" titulo="Aprovações registradas" valor={number(data.totais?.aprovacoes_registradas)} legenda="Histórico formal de aprovação" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos atualizados recentemente</CardTitle>
          <CardDescription>Status, classificação de sigilo e versão atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable rotulo="documentos atualizados recentemente" colunas={colunas} linhas={data.recentes || []} chaveDaLinha={(item) => item.id} vazio="Nenhum documento recente." />
        </CardContent>
      </Card>
    </div>
  );
}
