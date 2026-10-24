import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { getAllLogs } from "../../store/fetchActions/logs";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { CampoSelecao } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";

export default () => {
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
    });

    const dispatch = useDispatch();
    const { logs, total } = useSelector(state => state.logs);

    const [use, setUse] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const usersExists = logs.reduce((acc, log) => {
        const u = log.user;
        if (!acc.some(item => item.id === u?.id)) {
            acc.push({ id: u?.id, name: u?.name });
        }
        return acc;
    }, []);

    useEffect(() => {
        dispatch(getAllLogs(page + 1, rowsPerPage));
    }, [page, rowsPerPage]);

    const displayedLogs = use ? logs.filter(log => String(log.user?.id) === use) : logs;

    const colunas = [
        {
            chave: 'id',
            titulo: 'ID / Data',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log.id}</span>
                    <span className="block text-xs text-muted-foreground">{log.created_at && format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </>
            ),
        },
        {
            chave: 'usuario',
            titulo: 'Usuário / Ação',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log.user?.name?.toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{log.action}</span>
                </>
            ),
        },
        {
            chave: 'descricao',
            titulo: 'Descrição / IP',
            render: (log) => (
                <>
                    <span className="block font-semibold">{log.description}</span>
                    <span className="block text-xs text-muted-foreground">{log.ip_address}</span>
                </>
            ),
        },
    ];

    const barra = (
        <CampoSelecao id="filtro-usuario-log" label="Usuário" value={use} onChange={({ target }) => setUse(target.value)} className="min-w-[200px]">
            <option value="">Todos</option>
            {usersExists.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </CampoSelecao>
    );

    return (
        <PaginaDeLista
            titulo={`${total} Logs Cadastrados`}
            barra={barra}
            colunas={colunas}
            linhas={displayedLogs}
            chaveDaLinha={(log) => log.id}
            vazio="Nenhum registro encontrado!"
            rotuloDaTabela="logs"
            paginacao={{
                total: use ? displayedLogs.length : total,
                pagina: page,
                porPagina: rowsPerPage,
                opcoes: [25, 50, 100],
                aoMudarPagina: setPage,
                aoMudarPorPagina: (n) => { setRowsPerPage(n); setPage(0); },
            }}
        >
            <AlertModal />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
};
