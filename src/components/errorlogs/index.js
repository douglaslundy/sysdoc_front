import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { parseISO, format } from 'date-fns';
import { getAllErrorLogs } from "../../store/fetchActions/errorlogs";
import AlertModal from "../messagesModal";
import { CampoSelecao } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";

const getFriendlyError = (log) => {
    const rawType = log?.type || '';
    const type = rawType.split('\\').pop();
    const message = String(log?.message || '').toLowerCase();

    if (type === 'ValidationException') {
        return {
            summary: 'Não foi possível salvar porque alguns campos estão inválidos ou ausentes.',
            reason: 'Revise os campos obrigatórios destacados e tente novamente.',
        };
    }

    if (type === 'AuthenticationException') {
        return {
            summary: 'Sua sessão expirou ou você não está autenticado.',
            reason: 'Faça login novamente para continuar.',
        };
    }

    if (type === 'AuthorizationException') {
        return {
            summary: 'Você não tem permissão para executar esta ação.',
            reason: 'Solicite acesso ao administrador do sistema.',
        };
    }

    if (type === 'NotFoundHttpException') {
        return {
            summary: 'O recurso solicitado não foi encontrado.',
            reason: 'Verifique se o item ainda existe ou se o link/rota está correto.',
        };
    }

    if (type === 'QueryException') {
        return {
            summary: 'Ocorreu uma falha ao processar os dados no banco.',
            reason: 'Pode ser incompatibilidade de estrutura, dado inválido ou indisponibilidade temporária.',
        };
    }

    if (message.includes('timeout')) {
        return {
            summary: 'A operação excedeu o tempo esperado.',
            reason: 'Verifique conectividade, carga do servidor ou tente novamente.',
        };
    }

    return {
        summary: 'Ocorreu um erro inesperado durante a operação.',
        reason: 'Tente novamente. Se persistir, acione o suporte com o ID do log.',
    };
};

export default () => {
    const dispatch = useDispatch();
    const { errorlogs, total } = useSelector(state => state.errorlogs);

    const [use, setUse] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const usersExists = errorlogs.map(l => l.user).filter(Boolean).reduce((acc, u) => {
        if (!acc.some(item => item.id === u.id)) acc.push({ id: u.id, name: u.name });
        return acc;
    }, []);

    useEffect(() => {
        dispatch(getAllErrorLogs(page + 1, rowsPerPage));
    }, [page, rowsPerPage]);

    const displayedLogs = use ? errorlogs.filter(log => String(log.user?.id) === use) : errorlogs;

    const colunas = [
        {
            chave: 'id',
            titulo: 'ID / Usuário / Data',
            render: (errorlog) => (
                <>
                    <span className="block text-xs font-semibold">{errorlog.id}</span>
                    <span className="block text-xs">{(errorlog.user?.name || 'NÃO IDENTIFICADO').toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{errorlog.created_at && format(parseISO(errorlog.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </>
            ),
        },
        {
            chave: 'tipo',
            titulo: 'Tipo / Arquivo - Linha',
            render: (errorlog) => {
                const fileName = errorlog?.file ? errorlog.file.split('/').pop() : '-';
                const errorType = errorlog?.type ? errorlog.type.split('\\').pop() : '-';
                return (
                    <>
                        <span className="block font-semibold">{errorType}</span>
                        <span className="block text-xs text-muted-foreground">{fileName} linha / {errorlog.line || '-'}</span>
                    </>
                );
            },
        },
        {
            chave: 'mensagem',
            titulo: 'Mensagem amigável / Detalhe técnico',
            render: (errorlog) => {
                const friendly = getFriendlyError(errorlog);
                return (
                    <>
                        <span className="block font-semibold">{friendly.summary}</span>
                        <span className="mb-1 block text-xs text-muted-foreground">Motivo: {friendly.reason}</span>
                        <details className="text-xs">
                            <summary className="cursor-pointer">Detalhes técnicos</summary>
                            <p className="mt-1 break-words">{errorlog.message || '-'}</p>
                            <p className="break-words text-muted-foreground">{errorlog.context ? JSON.stringify(errorlog.context) : '-'}</p>
                        </details>
                    </>
                );
            },
        },
    ];

    const barra = (
        <CampoSelecao id="filtro-usuario-erro" label="Usuário" value={use} onChange={({ target }) => setUse(target.value)} className="min-w-[200px]">
            <option value="">Todos</option>
            {usersExists.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </CampoSelecao>
    );

    return (
        <PaginaDeLista
            titulo={`${total} Logs de erro Cadastrados`}
            barra={barra}
            colunas={colunas}
            linhas={displayedLogs}
            chaveDaLinha={(errorlog) => errorlog.id}
            vazio="Nenhum registro encontrado!"
            rotuloDaTabela="logs de erro"
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
        </PaginaDeLista>
    );
};
