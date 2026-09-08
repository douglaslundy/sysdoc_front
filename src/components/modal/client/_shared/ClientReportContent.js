import React from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  styled,
  TableContainer,
  Grid,
  Divider,
  Chip,
} from "@mui/material";
import { parseISO, format } from "date-fns";

export const STATUS_COR = {
  solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

export const StyledTableRow = styled(TableRow)(() => ({
  "&:nth-of-type(odd)": {
    backgroundColor: 'var(--lg-glass-row-hover)',
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export const InfoItem = ({ label, value }) => (
  <Box
    sx={{
      border: "1px solid var(--lg-border)",
      borderRadius: 2,
      p: 2,
      height: "100%",
      bgcolor: "var(--lg-glass-panel)",
    }}
  >
    <Typography
      color="textSecondary"
      sx={{
        fontSize: "12px",
        fontWeight: 600,
        mb: 0.5,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>
    <Typography variant="h6">{value || "Não informado"}</Typography>
  </Box>
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

// Bloco de renderização do relatório detalhado do cliente (grid de dados
// pessoais + tabelas de viagens/fila/exames). Extraído de
// components/client_report para ser reutilizado tanto pela página standalone
// (/client_report) quanto pelo ClientReportModal.
export default function ClientReportContent({ reportData }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4, px: 2, pb: 2 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Cliente
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Nome" value={reportData?.name?.toUpperCase()} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Data de nascimento" value={formatDate(reportData?.born_date)} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Sexo" value={formatSex(reportData?.sexo?.toUpperCase())} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="CPF" value={reportData?.cpf} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="CNS" value={reportData?.cns} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Telefone" value={reportData?.phone} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="E-mail" value={reportData?.email} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Mãe" value={reportData?.mother?.toUpperCase()} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Pai" value={reportData?.father?.toUpperCase()} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Box
              sx={{
                border: "1px solid var(--lg-border)",
                borderRadius: 2,
                p: 2,
                height: "100%",
                bgcolor: "var(--lg-glass-panel)",
              }}
            >
              <Typography
                color="textSecondary"
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Status
              </Typography>
              <Chip
                label={reportData?.active ? "ATIVO" : "INATIVO"}
                color={reportData?.active ? "success" : "default"}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <InfoItem label="Atualizado em" value={formatDateTime(reportData?.updated_at)} />
          </Grid>

          <Grid item xs={12} md={12} lg={4}>
            <InfoItem
              label="Observações"
              value={reportData?.obs?.toUpperCase() || "Nenhuma observação cadastrada"}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Viagens ({reportData?.trips?.length ?? 0})
        </Typography>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" aria-label="tabela de viagens" sx={{ whiteSpace: "nowrap" }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Data / Hora
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Rota
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Motorista
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Veículo
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Observação
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {reportData?.trips?.length ? (
                [...reportData.trips]
                  .sort((a, b) => new Date(b.departure_date) - new Date(a.departure_date))
                  .map((trip) => (
                    <StyledTableRow key={trip.id} hover>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatDate(trip?.departure_date)}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          {trip?.departure_time?.slice(0, 5) || "Não informado"}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          ID viagem: {trip?.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {(trip?.route?.origin?.toUpperCase() || "Origem não informada").toUpperCase()}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          {(trip?.route?.destination?.toUpperCase() || "Destino não informado").toUpperCase()}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="h6">
                          {trip?.driver?.name?.toUpperCase() || "Não informado"}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          CPF: {trip?.driver?.cpf || "Não informado"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="h6">
                          {trip?.vehicle?.brand?.toUpperCase() || ""} {trip?.vehicle?.model?.toUpperCase() || "Não informado"}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          Placa: {trip?.vehicle?.license_plate?.toUpperCase() || "Não informado"}
                        </Typography>
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>
                          Ano: {trip?.vehicle?.year || "Não informado"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="h6">
                          {trip?.obs?.toUpperCase() || "Sem observação"}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="h6">
                      Nenhuma viagem encontrada.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider />

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Filas ({reportData?.queue?.length ?? 0})
        </Typography>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" aria-label="tabela de filas">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Especialidade
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Cadastrado em
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Status
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Realizado em
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="h6">
                    Observações
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {reportData?.queue?.length ? (
                [...reportData.queue]
                  .sort((a, b) => b.id - a.id)
                  .map((item, index) => (
                    <StyledTableRow key={item?.id || index} hover>
                      <TableCell>
                        <Typography variant="h6">
                          {item?.speciality?.name?.toUpperCase() || item?.name?.toUpperCase() || "Não informado"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {item?.created_at && format(parseISO(item?.created_at), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {item?.done === '1' ? 'REALIZADO' : 'NÃO REALIZADO'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {item?.date_of_realized && format(parseISO(item?.date_of_realized), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {item?.obs?.toUpperCase() || "Sem observações"}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="h6">
                      Nenhuma fila ou especialidade vinculada a este cliente.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider />

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Exames ({reportData?.pedidos_exame?.length ?? 0})
        </Typography>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" aria-label="tabela de exames" sx={{ whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography color="textSecondary" variant="h6">Data</Typography></TableCell>
                <TableCell><Typography color="textSecondary" variant="h6">Exames</Typography></TableCell>
                <TableCell><Typography color="textSecondary" variant="h6">Médico Solicitante</Typography></TableCell>
                <TableCell><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                <TableCell><Typography color="textSecondary" variant="h6">Cadastrado por</Typography></TableCell>
                <TableCell><Typography color="textSecondary" variant="h6">Liberado por</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData?.pedidos_exame?.length ? (
                [...reportData.pedidos_exame]
                  .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido))
                  .map((pedido) => (
                    <StyledTableRow key={pedido.id} hover>
                      <TableCell>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatDate(pedido.data_pedido)}
                        </Typography>
                        {pedido.data_coleta && (
                          <Typography color="textSecondary" sx={{ fontSize: '12px' }}>
                            Coleta: {formatDate(pedido.data_coleta)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {pedido.exames?.length ? (
                          pedido.exames.map((e) => (
                            <Chip key={e.id} label={e.nome || e.codigo} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))
                        ) : (
                          <Typography color="textSecondary" variant="h6">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {pedido.medico_solicitante?.nome?.toUpperCase() || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pedido.status?.replace(/_/g, ' ').toUpperCase()}
                          color={STATUS_COR[pedido.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {pedido.criado_por?.name?.toUpperCase() || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6">
                          {pedido.resultado?.liberado_por?.name?.toUpperCase() || '—'}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="h6">Nenhum exame encontrado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
