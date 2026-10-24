import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download } from 'lucide-react';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import AlvaraDialog from '../modal/alvara';
import { getAllAlvaras, removeAlvaraFetch, downloadAlvaraPdf } from '../../store/fetchActions/alvaras';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from '../actions';
import { Button } from '../ui/button';
import { SelectNativo } from '../ui/campos';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula, tomDaCor } from '../ui/pilula';

const NIVEIS_COR = { '1': 'success', '2': 'warning', '3': 'error', 'N/A': 'default' };

const STATUS_OPTIONS = [
    'Não requerido', 'Dispensado', 'Protocolado', 'Em análise', 'Em exigência',
    'Vigente', 'Vencido', 'Em renovação',
    'Suspenso', 'Cassado', 'Cancelado', 'Cancelado de ofício', 'Interditado',
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const trunc = (s, n = 30) => {
    if (!s) return '—';
    return s.length > n ? s.substring(0, n) + '…' : s;
};

export default function ListaAlvaras() {
    const dispatch = useDispatch();
    const { alvaras, pagination } = useSelector(state => state.alvaras);

    const [busca, setBusca] = useState('');
    const [nivelRisco, setNivelRisco] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const buscaRef = useRef(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

    const buildParams = (overrides = {}) => ({
        page: page + 1,
        per_page: perPage,
        busca: busca || undefined,
        nivel_risco: nivelRisco || undefined,
        status: statusFiltro || undefined,
        ...overrides,
    });

    useEffect(() => {
        dispatch(getAllAlvaras({ page: 1, per_page: perPage }));
        return () => clearTimeout(buscaRef.current);
    }, []);

    useEffect(() => {
        if (pagination?.current_page) {
            setPage(Math.max(0, pagination.current_page - 1));
        }
    }, [pagination?.current_page]);

    const handleBusca = ({ target }) => {
        const valor = target.value;
        setBusca(valor);
        setPage(0);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllAlvaras(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handleNivelRisco = ({ target }) => {
        const valor = target.value;
        setNivelRisco(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ nivel_risco: valor || undefined, page: 1 })));
    };

    const handleStatusFiltro = ({ target }) => {
        const valor = target.value;
        setStatusFiltro(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ status: valor || undefined, page: 1 })));
    };

    const handlePerPage = (valor) => {
        setPerPage(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (newPage) => {
        setPage(newPage);
        dispatch(getAllAlvaras(buildParams({ page: newPage + 1 })));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (alvara) => {
        setEditando(alvara);
        setDialogOpen(true);
    };

    const handleExcluir = (alvara) => {
        dispatch(changeTitleAlert(`Alvará ${alvara.numero_alvara} excluído com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir o alvará ${alvara.numero_alvara}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removeAlvaraFetch(alvara.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        dispatch(getAllAlvaras(buildParams()));
    };

    const colunas = [
        { chave: 'numero', titulo: 'Número', render: (a) => <span className="font-semibold uppercase">{a.numero_alvara}</span> },
        { chave: 'estabelecimento', titulo: 'Estabelecimento', render: (a) => <span className="uppercase">{trunc(a.estabelecimento?.nome_estabelecimento)}</span> },
        { chave: 'risco', titulo: 'Risco', render: (a) => <Pilula tom={tomDaCor(NIVEIS_COR[a.nivel_risco])}>{`Risco ${a.nivel_risco}`}</Pilula> },
        { chave: 'status', titulo: 'Status', render: (a) => a.status || '—' },
        { chave: 'emissao', titulo: 'Emissão', render: (a) => formatDate(a.data_alvara) },
        { chave: 'vencimento', titulo: 'Vencimento', render: (a) => formatDate(a.vencimento_alvara) },
        { chave: 'contato', titulo: 'Contato', render: (a) => <span className="block max-w-[150px] truncate">{a.contato || '—'}</span> },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (a) => (
                <div className="flex gap-2">
                    <ActionEditButton onClick={() => handleEditar(a)} title="Editar" />
                    {a.status === 'Vigente' && (
                        <Button variant="secondary" size="icon-sm" title="Baixar PDF" aria-label="Baixar PDF" onClick={() => dispatch(downloadAlvaraPdf(a.id, a.numero_alvara))}>
                            <Download />
                        </Button>
                    )}
                    <ActionDeleteButton onClick={() => handleExcluir(a)} title="Excluir" />
                </div>
            ),
        },
    ];

    const barra = (
        <>
            <div className="w-full sm:w-48">
                <SelectNativo aria-label="Nível de Risco" value={nivelRisco} onChange={handleNivelRisco}>
                    <option value="">Risco: todos</option>
                    <option value="1">1 — Baixo</option>
                    <option value="2">2 — Médio</option>
                    <option value="3">3 — Alto</option>
                    <option value="N/A">N/A</option>
                </SelectNativo>
            </div>
            <div className="w-full sm:w-48">
                <SelectNativo aria-label="Status" value={statusFiltro} onChange={handleStatusFiltro}>
                    <option value="">Status: todos</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectNativo>
            </div>
            <ActionCreateFab onClick={handleNovo} title="Novo alvará" />
        </>
    );

    return (
        <PaginaDeLista
            titulo="Alvarás"
            subtitulo={pagination ? `${pagination.total} registros` : undefined}
            busca={{ rotulo: 'Pesquisar alvarás', placeholder: 'Pesquisar por número ou estabelecimento', value: busca, onChange: handleBusca }}
            barra={barra}
            colunas={colunas}
            linhas={alvaras}
            chaveDaLinha={(a) => a.id}
            vazio="Nenhum alvará encontrado."
            paginacao={{ total: pagination?.total || 0, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
        >
            <AlertModal />
            <AlvaraDialog open={dialogOpen} onClose={() => setDialogOpen(false)} alvara={editando} onSuccess={handleSuccess} />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
}
