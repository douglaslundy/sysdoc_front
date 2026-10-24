import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from '../actions';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import EstabelecimentoDialog from '../modal/estabelecimento';
import { getAllEstabelecimentos, removeEstabelecimentoFetch } from '../../store/fetchActions/estabelecimentos';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { PaginaDeLista } from '../ui/pagina-de-lista';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatDate = (s) => {
    if (!s) return '-';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const trunc = (s, n = 30) => {
    if (!s) return '-';
    return s.length > n ? s.substring(0, n) + '...' : s;
};

const renderCnaes = (item) => {
    if (Array.isArray(item?.cnaes) && item.cnaes.length > 0) return item.cnaes.join(', ');
    if (item?.cnaes_texto) return item.cnaes_texto;
    return '-';
};

export default function ListaEstabelecimentos() {
    const dispatch = useDispatch();
    const { estabelecimentos, pagination } = useSelector((state) => state.estabelecimentos);

    const [busca, setBusca] = useState('');
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
        ...overrides,
    });

    const carregar = (params = {}) => {
        dispatch(getAllEstabelecimentos(buildParams(params)));
    };

    useEffect(() => {
        carregar({ page: 1 });
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
            dispatch(getAllEstabelecimentos(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handlePerPage = (valor) => {
        setPerPage(valor);
        setPage(0);
        dispatch(getAllEstabelecimentos(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (newPage) => {
        setPage(newPage);
        dispatch(getAllEstabelecimentos(buildParams({ page: newPage + 1 })));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (est) => {
        setEditando(est);
        setDialogOpen(true);
    };

    const handleExcluir = (est) => {
        dispatch(changeTitleAlert(`Estabelecimento ${est.nome_estabelecimento} excluido com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir ${est.nome_estabelecimento}?`,
            subTitle: 'Esta acao nao podera ser desfeita',
            confirm: removeEstabelecimentoFetch(est.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        carregar({ page: page + 1 });
    };

    const colunas = [
        { chave: 'nome', titulo: 'Estabelecimento', render: (e) => <span className="font-semibold uppercase">{trunc(e.nome_estabelecimento, 30)}</span> },
        { chave: 'responsavel', titulo: 'Responsável', render: (e) => <span className="uppercase">{trunc(e.nome_responsavel, 30)}</span> },
        { chave: 'endereco', titulo: 'Endereço', render: (e) => <span className="uppercase">{trunc(e.endereco, 30)}</span> },
        { chave: 'cnae', titulo: 'CNAE', render: (e) => trunc(renderCnaes(e), 30) },
        { chave: 'cadastro', titulo: 'Cadastro', render: (e) => formatDate(e.created_at) },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (e) => (
                <div className="flex gap-2">
                    <ActionEditButton onClick={() => handleEditar(e)} title="Editar" />
                    <ActionDeleteButton onClick={() => handleExcluir(e)} title="Excluir" />
                </div>
            ),
        },
    ];

    return (
        <PaginaDeLista
            titulo="Estabelecimentos"
            subtitulo={pagination ? `${pagination.total} registros` : undefined}
            busca={{ rotulo: 'Pesquisar estabelecimentos', placeholder: 'Pesquisar por nome, responsável ou CNAE', value: busca, onChange: handleBusca }}
            barra={<ActionCreateFab onClick={handleNovo} title="Novo estabelecimento" />}
            colunas={colunas}
            linhas={estabelecimentos}
            chaveDaLinha={(e) => e.id}
            vazio="Nenhum estabelecimento encontrado."
            paginacao={{ total: pagination?.total || 0, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
        >
            <AlertModal />
            <EstabelecimentoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} estabelecimento={editando} onSuccess={handleSuccess} />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
}
