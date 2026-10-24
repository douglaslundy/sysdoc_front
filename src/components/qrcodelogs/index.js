import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { getAllQrCodeLogs } from "../../store/fetchActions/qrcodelogs";
import AlertModal from "../messagesModal";
import { deviceDetails, deviceSummary } from "../../utils/deviceSummary";
import { PaginaDeLista } from "../ui/pagina-de-lista";

export default () => {
    const dispatch = useDispatch();
    const { qrlogs, total } = useSelector(state => state.qrlogs);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getAllQrCodeLogs({ page, perPage: rowsPerPage }));
    }, [page, rowsPerPage]);

    const colunas = [
        {
            chave: 'protocolo',
            titulo: 'Protocolo / Escaneado em / UUID',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log?.queue_id}</span>
                    <span className="block text-xs text-muted-foreground">{log?.accessed_at && format(parseISO(log.accessed_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                    <span className="block break-all text-xs text-muted-foreground">{log?.uuid}</span>
                </>
            ),
        },
        {
            chave: 'cliente',
            titulo: 'Cliente / Posição',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log?.queue?.client?.name?.toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{log?.position}</span>
                </>
            ),
        },
        {
            chave: 'fila',
            titulo: 'Fila / Urgência / Cadastrado em',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log?.queue?.speciality?.name?.substring(0, 15).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{log?.queue?.urgency == 0 ? 'NORMAL' : 'URGENTE'}</span>
                    <span className="block text-xs text-muted-foreground">{log?.queue && format(parseISO(log.queue.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </>
            ),
        },
        {
            chave: 'ip',
            titulo: 'IP / Hostname',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log?.ip_address}</span>
                    <span className="block text-xs text-muted-foreground">{log?.host_name?.substring(0, 40)}</span>
                    {log?.ip_origin && <span className="block text-xs text-muted-foreground">{log.ip_origin}</span>}
                    {log?.client_info && (
                        <span className="block text-xs text-muted-foreground" title={deviceDetails(log.client_info, log.ip_origin)}>
                            {deviceSummary(log.client_info)}
                        </span>
                    )}
                </>
            ),
        },
        {
            chave: 'agente',
            titulo: 'Agente / Localização',
            render: (log) => (
                <>
                    <span className="block break-words font-semibold">{log?.user_agent?.substring(0, 100)}</span>
                    <span className="block text-xs text-muted-foreground">{log?.location?.substring(0, 100)}</span>
                </>
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo={`Você possui ${total} Logs Cadastrados`}
            colunas={colunas}
            linhas={qrlogs || []}
            chaveDaLinha={(log) => log.id}
            vazio="Nenhum registro encontrado!"
            rotuloDaTabela="logs de QR Code"
            paginacao={{
                total: total || 0,
                pagina: page,
                porPagina: rowsPerPage,
                aoMudarPagina: setPage,
                aoMudarPorPagina: (n) => { setRowsPerPage(n); setPage(0); },
            }}
        >
            <AlertModal />
        </PaginaDeLista>
    );
};
