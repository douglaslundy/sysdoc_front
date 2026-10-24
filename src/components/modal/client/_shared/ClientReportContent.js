import React from "react";
import { parseISO, format } from "date-fns";
import { DataTable } from "../../../ui/data-table";
import { Pilula, tomDaCor } from "../../../ui/pilula";

export const STATUS_COR = {
  solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

export const InfoItem = ({ label, value }) => (
  <div className="h-full rounded-lg border border-border bg-surface p-3">
    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">{label}</p>
    <p className="text-sm font-semibold break-words">{value || "Não informado"}</p>
  </div>
);

export const formatDate = (value) => {
  if (!value) return "Não informado";
  try {
    return format(parseISO(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
};

export const formatDateTime = (value) => {
  if (!value) return "Não informado";
  try {
    return format(parseISO(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
};

export const formatSex = (value) => {
  const map = {
    MASCULINE: "Masculino",
    FEMININE: "Feminino",
  };

  return map[value] || value || "Não informado";
};

// Normaliza o formato heterogêneo devolvido por /detailed-client-report
// (que pode vir como array, { data }, { client } ou o próprio objeto) num
// único objeto de cliente.
export const deriveReportData = (clientReport) =>
  Array.isArray(clientReport)
    ? clientReport[0]
    : clientReport?.data
      ? clientReport.data
      : clientReport?.client
        ? clientReport.client
        : clientReport;

export const hasClientData = (reportData) =>
  !!(
    reportData &&
    typeof reportData === "object" &&
    Object.keys(reportData).length > 0 &&
    (reportData.id || reportData.name || reportData.cpf || reportData.cns)
  );

const Secao = ({ titulo, children }) => (
  <section className="space-y-3">
    <h3 className="font-display text-xl font-extrabold">{titulo}</h3>
    {children}
  </section>
);

const Sub = ({ children }) => <span className="block text-xs text-muted-foreground">{children}</span>;

const colunasViagens = [
  {
    chave: "data",
    titulo: "Data / Hora",
    render: (trip) => (
      <>
        <span className="font-semibold">{formatDate(trip?.departure_date)}</span>
        <Sub>{trip?.departure_time?.slice(0, 5) || "Não informado"}</Sub>
        <Sub>ID viagem: {trip?.id}</Sub>
      </>
    ),
  },
  {
    chave: "rota",
    titulo: "Rota",
    render: (trip) => (
      <>
        <span className="font-semibold">{(trip?.route?.origin?.toUpperCase() || "Origem não informada").toUpperCase()}</span>
        <Sub>{(trip?.route?.destination?.toUpperCase() || "Destino não informado").toUpperCase()}</Sub>
      </>
    ),
  },
  {
    chave: "motorista",
    titulo: "Motorista",
    render: (trip) => (
      <>
        {trip?.driver?.name?.toUpperCase() || "Não informado"}
        <Sub>CPF: {trip?.driver?.cpf || "Não informado"}</Sub>
      </>
    ),
  },
  {
    chave: "veiculo",
    titulo: "Veículo",
    render: (trip) => (
      <>
        {trip?.vehicle?.brand?.toUpperCase() || ""} {trip?.vehicle?.model?.toUpperCase() || "Não informado"}
        <Sub>Placa: {trip?.vehicle?.license_plate?.toUpperCase() || "Não informado"}</Sub>
        <Sub>Ano: {trip?.vehicle?.year || "Não informado"}</Sub>
      </>
    ),
  },
  { chave: "obs", titulo: "Observação", render: (trip) => trip?.obs?.toUpperCase() || "Sem observação" },
];

const colunasFilas = [
  { chave: "especialidade", titulo: "Especialidade", render: (item) => item?.speciality?.name?.toUpperCase() || item?.name?.toUpperCase() || "Não informado" },
  { chave: "criado", titulo: "Cadastrado em", render: (item) => item?.created_at && format(parseISO(item?.created_at), 'dd/MM/yyyy') },
  { chave: "status", titulo: "Status", render: (item) => (item?.done === '1' ? 'REALIZADO' : 'NÃO REALIZADO') },
  { chave: "realizado", titulo: "Realizado em", render: (item) => item?.date_of_realized && format(parseISO(item?.date_of_realized), 'dd/MM/yyyy') },
  { chave: "obs", titulo: "Observações", render: (item) => item?.obs?.toUpperCase() || "Sem observações" },
];

const colunasExames = [
  {
    chave: "data",
    titulo: "Data",
    render: (pedido) => (
      <>
        <span className="font-semibold">{formatDate(pedido.data_pedido)}</span>
        {pedido.data_coleta && <Sub>Coleta: {formatDate(pedido.data_coleta)}</Sub>}
      </>
    ),
  },
  {
    chave: "exames",
    titulo: "Exames",
    render: (pedido) =>
      pedido.exames?.length ? (
        <div className="flex flex-wrap gap-1">
          {pedido.exames.map((e) => (
            <Pilula key={e.id} tom="neutro" contorno>{e.nome || e.codigo}</Pilula>
          ))}
        </div>
      ) : "—",
  },
  { chave: "medico", titulo: "Médico Solicitante", render: (pedido) => pedido.medico_solicitante?.nome?.toUpperCase() || '—' },
  {
    chave: "status",
    titulo: "Status",
    render: (pedido) => <Pilula tom={tomDaCor(STATUS_COR[pedido.status])}>{pedido.status?.replace(/_/g, ' ').toUpperCase()}</Pilula>,
  },
  { chave: "criado", titulo: "Cadastrado por", render: (pedido) => pedido.criado_por?.name?.toUpperCase() || '—' },
  { chave: "liberado", titulo: "Liberado por", render: (pedido) => pedido.resultado?.liberado_por?.name?.toUpperCase() || '—' },
];

// Bloco de renderização do relatório detalhado do cliente (grid de dados
// pessoais + tabelas de viagens/fila/exames). Extraído de
// components/client_report para ser reutilizado tanto pela página standalone
// (/client_report) quanto pelo ClientReportModal.
export default function ClientReportContent({ reportData }) {
  const viagens = reportData?.trips?.length ? [...reportData.trips].sort((a, b) => new Date(b.departure_date) - new Date(a.departure_date)) : [];
  const filas = reportData?.queue?.length ? [...reportData.queue].sort((a, b) => b.id - a.id) : [];
  const exames = reportData?.pedidos_exame?.length ? [...reportData.pedidos_exame].sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido)) : [];

  return (
    <div className="ui-reset flex flex-col gap-8">
      <Secao titulo="Cliente">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Nome" value={reportData?.name?.toUpperCase()} />
          <InfoItem label="Data de nascimento" value={formatDate(reportData?.born_date)} />
          <InfoItem label="Sexo" value={formatSex(reportData?.sexo?.toUpperCase())} />
          <InfoItem label="CPF" value={reportData?.cpf} />
          <InfoItem label="CNS" value={reportData?.cns} />
          <InfoItem label="Telefone" value={reportData?.phone} />
          <InfoItem label="E-mail" value={reportData?.email} />
          <InfoItem label="Mãe" value={reportData?.mother?.toUpperCase()} />
          <InfoItem label="Pai" value={reportData?.father?.toUpperCase()} />
          <div className="h-full rounded-lg border border-border bg-surface p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Status</p>
            <Pilula tom={reportData?.active ? "sucesso" : "neutro"}>{reportData?.active ? "ATIVO" : "INATIVO"}</Pilula>
          </div>
          <InfoItem label="Atualizado em" value={formatDateTime(reportData?.updated_at)} />
          <InfoItem label="Observações" value={reportData?.obs?.toUpperCase() || "Nenhuma observação cadastrada"} />
        </div>
      </Secao>

      <Secao titulo={`Viagens (${reportData?.trips?.length ?? 0})`}>
        <DataTable rotulo="Tabela de viagens" colunas={colunasViagens} linhas={viagens} chaveDaLinha={(t) => t.id} vazio="Nenhuma viagem encontrada." />
      </Secao>

      <Secao titulo={`Filas (${reportData?.queue?.length ?? 0})`}>
        <DataTable rotulo="Tabela de filas" colunas={colunasFilas} linhas={filas} chaveDaLinha={(item) => item.id} vazio="Nenhuma fila ou especialidade vinculada a este cliente." />
      </Secao>

      <Secao titulo={`Exames (${reportData?.pedidos_exame?.length ?? 0})`}>
        <DataTable rotulo="Tabela de exames" colunas={colunasExames} linhas={exames} chaveDaLinha={(p) => p.id} vazio="Nenhum exame encontrado." />
      </Secao>
    </div>
  );
}
