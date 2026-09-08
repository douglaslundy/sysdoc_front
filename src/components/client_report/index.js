import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    Typography,
    Box,
    Fab,
    TextField,
    CircularProgress
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import ClientModal from "../modal/client";

import { useSelector, useDispatch } from "react-redux";
import { detailed_client_report } from "../../store/fetchActions/clients";
import { clearClientReport } from "../../store/ducks/clients";
import AlertModal from "../messagesModal";
import { modalFormRootSx } from "../modal/_shared/modalFormStyles";
import ClientReportContent, { deriveReportData, hasClientData } from "../modal/client/_shared/ClientReportContent";

export default () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { clientReport } = useSelector((state) => state.clients);

    const [searchValue, setSearchValue] = useState("");
    const [loadingReport, setLoadingReport] = useState(false);
    const [searched, setSearched] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const setSearchClient = ({ target }) => {
        setSearchValue(target.value);
    };

    const reportData = deriveReportData(clientReport);
    const hasData = hasClientData(reportData);

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

    // Permite abrir o relatório já preenchido a partir de outra página, ex:
    // /client_report?value=<id> (o endpoint /detailed-client-report já aceita
    // cpf, cns OU id no parâmetro "value").
    useEffect(() => {
        if (!router.isReady) return;

        const queryValue = router.query.value;
        if (!queryValue) return;

        const value = Array.isArray(queryValue) ? queryValue[0] : queryValue;
        setSearchValue(value);
        HandleSearchClient(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady, router.query.value]);

    return (
        <Box sx={modalFormRootSx} className="queue-page">
        <BaseCard
            title={
                hasData && reportData?.name
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

            {!loadingReport && hasData ? (
                <ClientReportContent reportData={reportData} />
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
