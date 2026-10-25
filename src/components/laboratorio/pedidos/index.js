import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, FileText, Pencil } from 'lucide-react';
import { api } from '../../../services/api';
import { getAllPedidos, removePedidoFetch, viewPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { iniciarResultado, getResultado } from '../../../store/fetchActions/resultadoExames';
import { openPedidoModal, turnResultadoModal, changeTitleAlert } from '../../../store/ducks/Layout';
import PedidoModal from '../../modal/pedido';
import ResultadoModal from '../../modal/resultado';
import AlertModal from '../../messagesModal';
import EditarPedidoDialog from '../../modal/editarPedido';
import ConfirmDialog from '../../confirmDialog';
import { ActionCreateFab, ActionDeleteButton } from '../../actions';
import { Button } from '../../ui/button';
import { CampoSelecao } from '../../ui/campos';
import { PaginaDeLista } from '../../ui/pagina-de-lista';
import { Pilula, tomDaCor } from '../../ui/pilula';
import { usePaginacaoLocal } from '../../../lib/usePaginacaoLocal';

const STATUS_COR = {
    solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

const getStatusInfo = (pedido) => {
    const resultado = pedido?.resultado;
    const temRascunhoSalvo = !!resultado && !resultado.data_liberacao && (resultado.campos?.length || 0) > 0;

    if (temRascunhoSalvo) {
        return { label: 'RASCUNHO', color: 'secondary' };
    }

    return {
        label: pedido?.status?.replace(/_/g, ' ').toUpperCase() || '—',
        color: STATUS_COR[pedido?.status] || 'default',
    };
};

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const formatExamName = (name) => {
    const value = String(name || '—');
    return value.length > 30 ? `${value.slice(0, 27)}...` : value;
};

export default function ListaPedidos() {
    const dispatch = useDispatch();
    const { pedidos } = useSelector(state => state.pedidosExame);

    const [filtroStatus, setFiltroStatus] = useState('');
    const [busca, setBusca] = useState('');
    const buscaRef = useRef(null);
    const [editarPedido, setEditarPedido] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

    useEffect(() => {
        dispatch(getAllPedidos());
    }, []);

    const handleBusca = (valor) => {
        setBusca(valor);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllPedidos({ busca: valor || undefined }));
        }, 400);
    };

    const filtrados = pedidos.filter(p => !filtroStatus || p.status === filtroStatus);
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(filtrados, 15);

    const handleDownloadPdf = async (resultadoId, protocolo) => {
        try {
            const res = await api.get(`/laboratorio/resultados/${resultadoId}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${protocolo || resultadoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro tratado pelo interceptor global do api.js
        }
    };

    const handleRemoverPedido = (pedido) => {
        dispatch(changeTitleAlert(`Pedido de ${pedido.cliente?.name || 'paciente'} excluído com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir o pedido de ${pedido.cliente?.name || 'paciente'}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removePedidoFetch(pedido.id),
        });
    };

    const handleAbrirResultado = (pedido) => {
        if (pedido.resultado) {
            dispatch(getResultado(pedido.resultado.id));
            dispatch(turnResultadoModal());
        } else {
            dispatch(iniciarResultado(pedido.id, () => {
                dispatch(turnResultadoModal());
            }));
        }
    };

    const colunas = [
        { chave: 'protocolo', titulo: 'Protocolo', render: (pedido) => <span className="font-semibold tracking-wide">{pedido.resultado?.protocolo ?? '—'}</span> },
        {
            chave: 'paciente',
            titulo: 'Paciente',
            render: (pedido) => (
                <>
                    <span className="block font-semibold">{pedido.cliente?.name || '—'}</span>
                    {pedido.medico_solicitante?.nome && <span className="block text-xs text-muted-foreground">Dr. {pedido.medico_solicitante.nome}</span>}
                </>
            ),
        },
        {
            chave: 'data',
            titulo: 'Data',
            render: (pedido) => (
                <>
                    <span className="block">{formatDate(pedido.data_pedido)}</span>
                    {pedido.data_coleta && <span className="block text-xs text-muted-foreground">Coleta: {formatDate(pedido.data_coleta)}</span>}
                </>
            ),
        },
        {
            chave: 'exames',
            titulo: 'Exames',
            render: (pedido) => (
                <div className="flex flex-wrap items-center gap-1">
                    {pedido.exames?.slice(0, 2).map(e => (
                        <span key={e.id} title={e.nome || 'Exame sem nome'} className="rounded-full border border-border px-2.5 py-0.5 text-xs">{formatExamName(e.nome)}</span>
                    ))}
                    {pedido.exames?.length > 2 && <span className="text-xs text-muted-foreground">+{pedido.exames.length - 2}</span>}
                </div>
            ),
        },
        {
            chave: 'status',
            titulo: 'Status',
            render: (pedido) => {
                const { label, color } = getStatusInfo(pedido);
                return <Pilula tom={tomDaCor(color)}>{label}</Pilula>;
            },
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (pedido) => (
                <div className="flex flex-wrap gap-2">
                    {!['liberado', 'cancelado'].includes(pedido.status) && (
                        <Button variant="success" size="icon-sm" title="Editar pedido" aria-label="Editar pedido" onClick={() => dispatch(viewPedidoFetch(pedido.id, setEditarPedido))}>
                            <Pencil />
                        </Button>
                    )}
                    <Button variant="secondary" size="icon-sm" title="Preencher resultado" aria-label="Preencher resultado" onClick={() => handleAbrirResultado(pedido)}>
                        <FileText />
                    </Button>
                    {pedido.status === 'liberado' && pedido.resultado?.id && (
                        <Button variant="success" size="icon-sm" title="Baixar laudo PDF" aria-label="Baixar laudo PDF" onClick={() => handleDownloadPdf(pedido.resultado.id, pedido.resultado.protocolo)}>
                            <Download />
                        </Button>
                    )}
                    {pedido.status !== 'liberado' && (
                        <ActionDeleteButton title="Remover pedido" onClick={() => handleRemoverPedido(pedido)} />
                    )}
                </div>
            ),
        },
    ];

    const barra = (
        <>
            <CampoSelecao id="pedidos-filtro-status" label="Status" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="min-w-[160px]">
                <option value="">Todos</option>
                {Object.keys(STATUS_COR).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
            </CampoSelecao>
            <ActionCreateFab title="Novo Pedido" onClick={() => dispatch(openPedidoModal())} />
        </>
    );

    return (
        <>
            <ResultadoModal>
                <PedidoModal>
                    <PaginaDeLista
                        titulo={`Você possui ${pedidos.length} Pedidos Cadastrados`}
                        busca={{ rotulo: 'Buscar pedido', placeholder: 'Buscar por nome, CNS, CPF ou protocolo', value: busca, onChange: e => handleBusca(e.target.value) }}
                        barra={barra}
                        colunas={colunas}
                        linhas={fatia}
                        chaveDaLinha={(pedido) => pedido.id}
                        vazio="Nenhum pedido encontrado"
                        rotuloDaTabela="pedidos"
                        paginacao={{ ...propsDaPaginacao, opcoes: [10, 15, 25] }}
                    >
                        <AlertModal />
                    </PaginaDeLista>
                </PedidoModal>
            </ResultadoModal>
            <EditarPedidoDialog
                open={!!editarPedido}
                onClose={() => setEditarPedido(null)}
                pedido={editarPedido}
            />
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </>
    );
}
