import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { Clock } from 'lucide-react';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import FiscalizacaoDialog from '../modal/fiscalizacao';
import FiscalizacaoHistorico from './FiscalizacaoHistorico';
import { getAllFiscalizacoes, removeFiscalizacaoFetch } from '../../store/fetchActions/fiscalizacoes';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from '../actions';
import { Button } from '../ui/button';
import { SelectNativo } from '../ui/campos';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula, tomDaCor } from '../ui/pilula';

const RESULTADO_OPTIONS = ['Pendente de apuração', 'Conforme', 'Não conforme', 'Notificação', 'Auto de infração'];
const ORIGEM_OPTIONS = [
    { value: 'interna', label: 'Fiscalizações internas' },
    { value: 'peticao', label: 'Petições' },
];
const RESULTADO_COR = {
    'Pendente de apuração': 'info',
    'Conforme': 'success',
    'Não conforme': 'warning',
    'Notificação': 'warning',
    'Auto de infração': 'error',
};
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

export default function ListaFiscalizacoes() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { fiscalizacoes, pagination } = useSelector(state => state.fiscalizacoes);

    const [busca, setBusca] = useState('');
    const [resultadoFiltro, setResultadoFiltro] = useState('');
    const [origemFiltro, setOrigemFiltro] = useState('');
    const [historicoDe, setHistoricoDe] = useState(null);
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
        resultado: resultadoFiltro || undefined,
        origem: origemFiltro || undefined,
        ...overrides,
    });

    // Vindo do kanban (?busca=PROTOCOLO) a lista já abre filtrada; espera o roteador ficar pronto.
    useEffect(() => {
        if (router?.isReady === false) return;
        const inicial = router?.query?.busca ? String(router.query.busca) : '';
        if (inicial) setBusca(inicial);
        dispatch(getAllFiscalizacoes({ page: 1, per_page: perPage, busca: inicial || undefined }));
    }, [router?.isReady]);

    useEffect(() => {
        if (pagination?.current_page) {
            setPage(Math.max(0, pagination.current_page - 1));
        }
    }, [pagination?.current_page]);

    useEffect(() => () => clearTimeout(buscaRef.current), []);

    const handleBusca = ({ target }) => {
        const valor = target.value;
        setBusca(valor);
        setPage(0);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllFiscalizacoes(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handleResultadoFiltro = ({ target }) => {
        const valor = target.value;
        setResultadoFiltro(valor);
        setPage(0);
        dispatch(getAllFiscalizacoes(buildParams({ resultado: valor || undefined, page: 1 })));
    };

    const handleOrigemFiltro = ({ target }) => {
        const valor = target.value;
        setOrigemFiltro(valor);
        setPage(0);
        dispatch(getAllFiscalizacoes(buildParams({ origem: valor || undefined, page: 1 })));
    };

    const handlePerPage = (valor) => {
        setPerPage(valor);
        setPage(0);
        dispatch(getAllFiscalizacoes(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (newPage) => {
        setPage(newPage);
        dispatch(getAllFiscalizacoes(buildParams({ page: newPage + 1 })));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (fiscalizacao) => {
        setEditando(fiscalizacao);
        setDialogOpen(true);
    };

    const handleExcluir = (fiscalizacao) => {
        dispatch(changeTitleAlert('Fiscalização excluída com sucesso!'));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir esta fiscalização de ${fiscalizacao.estabelecimento?.nome_estabelecimento}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removeFiscalizacaoFetch(fiscalizacao.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        dispatch(getAllFiscalizacoes(buildParams()));
    };

    // Apos criar, mantem o dialogo aberto em modo edicao (em vez de fechar)
    // para que o fiscal consiga anexar fotos/documentos na mesma sessao,
    // sem precisar reabrir o registro recem-criado.
    const handleCreateSuccess = (criada) => {
        setEditando(criada);
        dispatch(getAllFiscalizacoes(buildParams()));
    };

    const colunas = [
        {
            chave: 'protocolo',
            titulo: 'Protocolo',
            render: (f) => (
                <>
                    <span className="font-bold">{f.protocolo || '—'}</span>
                    {f.origem === 'peticao' && <span className="mt-1 block"><Pilula tom="alerta" contorno>Petição</Pilula></span>}
                </>
            ),
        },
        { chave: 'estabelecimento', titulo: 'Estabelecimento', render: (f) => <span className="uppercase">{f.estabelecimento?.nome_estabelecimento || '—'}</span> },
        { chave: 'data', titulo: 'Data', render: (f) => formatDate(f.data_visita) },
        { chave: 'resultado', titulo: 'Resultado', render: (f) => <Pilula tom={tomDaCor(RESULTADO_COR[f.resultado])}>{f.resultado}</Pilula> },
        { chave: 'fiscal', titulo: 'Fiscal', render: (f) => f.fiscal?.name || '—' },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (f) => (
                <div className="flex gap-2">
                    <Button variant="outline" size="icon-sm" title="Histórico" aria-label="Histórico" onClick={() => setHistoricoDe(f)}><Clock /></Button>
                    <ActionEditButton onClick={() => handleEditar(f)} title="Editar" />
                    <ActionDeleteButton onClick={() => handleExcluir(f)} title="Excluir" />
                </div>
            ),
        },
    ];

    const barra = (
        <>
            <div className="w-full sm:w-52">
                <SelectNativo aria-label="Origem" value={origemFiltro} onChange={handleOrigemFiltro}>
                    <option value="">Origem: todas</option>
                    {ORIGEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectNativo>
            </div>
            <div className="w-full sm:w-52">
                <SelectNativo aria-label="Resultado" value={resultadoFiltro} onChange={handleResultadoFiltro}>
                    <option value="">Resultado: todos</option>
                    {RESULTADO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </SelectNativo>
            </div>
            <ActionCreateFab onClick={handleNovo} title="Nova fiscalização" />
        </>
    );

    return (
        <PaginaDeLista
            titulo="Fiscalizações"
            subtitulo={pagination ? `${pagination.total} registros` : undefined}
            busca={{ rotulo: 'Pesquisar fiscalizações', placeholder: 'Pesquisar por protocolo ou estabelecimento', value: busca, onChange: handleBusca }}
            barra={barra}
            colunas={colunas}
            linhas={fiscalizacoes}
            chaveDaLinha={(f) => f.id}
            vazio="Nenhuma fiscalização encontrada."
            paginacao={{ total: pagination?.total || 0, pagina: page, porPagina: perPage, opcoes: PER_PAGE_OPTIONS, aoMudarPagina: handlePage, aoMudarPorPagina: handlePerPage }}
        >
            <AlertModal />
            <FiscalizacaoDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fiscalizacao={editando}
                onSuccess={handleSuccess}
                onCreateSuccess={handleCreateSuccess}
            />
            <FiscalizacaoHistorico open={Boolean(historicoDe)} fiscalizacao={historicoDe} onClose={() => setHistoricoDe(null)} />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </PaginaDeLista>
    );
}
