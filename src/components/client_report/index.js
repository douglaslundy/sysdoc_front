import React, { useState, useEffect } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Fab,
    styled,
    TableContainer,
    TextField,
    Grid,
    Divider,
    Chip,
    CircularProgress
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import ClientModal from "../modal/client";

import { useSelector, useDispatch } from "react-redux";
import { detailed_client_report } from "../../store/fetchActions/clients";
import { clearClientReport } from "../../store/ducks/clients";
import AlertModal from "../messagesModal";
import { parseISO, format } from "date-fns";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";

const STATUS_COR = {
    solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

const StyledTableRow = styled(TableRow)(() => ({
    "&:nth-of-type(odd)": {
        backgroundColor: 'var(--lg-glass-row-hover)',
    },
    "&:last-child td, &:last-child th": {
        border: 0,
    },
}));

const InfoItem = ({ label, value }) => (
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

export default () => {
    const dispatch = useDispatch();
    const { clientReport } = useSelector((state) => state.clients);

    const [searchValue, setSearchValue] = useState("");
    const [loadingReport, setLoadingReport] = useState(false);
    const [searched, setSearched] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const setSearchClient = ({ target }) => {
        setSearchValue(target.value);
    };

    const formatDate = (value) => {
        if (!value) return "Não informado";
        try {
            return format(parseISO(value), "dd/MM/yyyy");
        } catch {
            return value;
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "Não informado";
        try {
            return format(parseISO(value), "dd/MM/yyyy HH:mm");
        } catch {
            return value;
        }
    };

    const formatSex = (value) => {
        const map = {
            MASCULINE: "Masculino",
            FEMININE: "Feminino",
        };

        return map[value] || value || "Não informado";
    };

    const reportData = Array.isArray(clientReport)
        ? clientReport[0]
        : clientReport?.data
            ? clientReport.data
            : clientReport?.client
                ? clientReport.client
                : clientReport;

    const hasClientData = !!(
        reportData &&
        typeof reportData === "object" &&
        Object.keys(reportData).length > 0 &&
        (reportData.id || reportData.name || reportData.cpf || reportData.cns)
    );

    const HandleSearchClient = async (value) => {
        if (!value?.trim()) return;

        setLoadingReport(true);
        setSearched(true);
        setNotFound(false);

        try {
            const response = await dispatch(detailed_client_report(value.trim()));

            const payload =
                Array.isArray(response)
                    ? response[0]
                    : response?.data
                        ? response.data
                        : response?.client
                            ? response.client
                            : response?.payload
                                ? response.payload
                                : response;

            const found = !!(
                payload &&
                typeof payload === "object" &&
                Object.keys(payload).length > 0 &&
                (payload.id || payload.name || payload.cpf || payload.cns)
            );

            setNotFound(!found);
        } catch (error) {
            setNotFound(true);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        dispatch(clearClientReport());

        return () => {
            dispatch(clearClientReport());
        };
    }, [dispatch]);

    return (
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard
            title={
                hasClientData && reportData?.name
                    ? `Relatório do Cliente ${reportData.name}`
                    : "Relatório detalhado do cliente"
            }
        >
            <AlertModal />

            <Box className="queue-page__toolbar"
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr auto", md: "minmax(280px, 1fr) auto" },
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                    mt: 1,
                }}
            >
                <TextField
                    className="lg-search-field"
                    sx={{ minWidth: 0, width: "100%" }}
                    placeholder="Pesquisar cliente: Informe o CPF ou CNS"
                    name="search"
                    autoComplete="off"
                    value={searchValue}
                    onChange={setSearchClient}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            HandleSearchClient(searchValue);
                        }
                    }}
                />

                <ClientModal>
                    <Fab
                        onClick={() => HandleSearchClient(searchValue)}
                        color="primary"
                        aria-label="search"
                        sx={{ justifySelf: { xs: "flex-end", sm: "center" } }}
                    >
                        <FeatherIcon icon="search" />
                    </Fab>
                </ClientModal>
            </Box>

            {loadingReport && (
                <Box
                    sx={{
                        px: 2,
                        pb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress size={22} />
                    <Typography variant="h6">
                        Carregando relatório do cliente...
                    </Typography>
                </Box>
            )}

            {!loadingReport && hasClientData ? (
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
            ) : !loadingReport && notFound ? (
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography color="textSecondary" variant="h6">
                        Nenhum cliente encontrado para o CPF ou CNS informado.
                    </Typography>
                </Box>
            ) : !loadingReport && !searched ? (
                <Box sx={{ px: 2, pb: 2 }}>
                    <Typography color="textSecondary" variant="h6">
                        Pesquise por um CPF ou CNS para exibir o relatório detalhado do cliente.
                    </Typography>
                </Box>
            ) : null}
        </BaseCard>
        </Box>
    );
};
