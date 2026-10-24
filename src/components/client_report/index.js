import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Search } from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { detailed_client_report } from "../../store/fetchActions/clients";
import { clearClientReport } from "../../store/ducks/clients";
import AlertModal from "../messagesModal";
import ClientReportContent, { deriveReportData, hasClientData } from "../modal/client/_shared/ClientReportContent";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { Carregando } from "../ui/carregando";

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
        <div className="ui-reset">
            <CabecalhoDePagina
                titulo={hasData && reportData?.name ? `Relatório do Cliente ${reportData.name}` : "Relatório detalhado do cliente"}
            />
            <AlertModal />

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <CampoDeBusca
                    rotulo="Pesquisar cliente"
                    placeholder="Pesquisar cliente: Informe o CPF ou CNS"
                    name="search"
                    value={searchValue}
                    onChange={setSearchClient}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            HandleSearchClient(searchValue);
                        }
                    }}
                />
                <Button aria-label="Buscar" onClick={() => HandleSearchClient(searchValue)}>
                    <Search /> Buscar
                </Button>
            </div>

            {loadingReport && <Carregando>Carregando relatório do cliente...</Carregando>}

            {!loadingReport && hasData ? (
                <ClientReportContent reportData={reportData} />
            ) : !loadingReport && notFound ? (
                <p className="text-sm text-muted-foreground">Nenhum cliente encontrado para o CPF ou CNS informado.</p>
            ) : !loadingReport && !searched ? (
                <p className="text-sm text-muted-foreground">Pesquise por um CPF ou CNS para exibir o relatório detalhado do cliente.</p>
            ) : null}
        </div>
    );
};
