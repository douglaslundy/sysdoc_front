import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addAlvaraFetch, editAlvaraFetch } from '../../../store/fetchActions/alvaras';
import { getEstabelecimentosSelect } from '../../../store/fetchActions/estabelecimentos';
import { Banner } from '../../ui/banner';
import { FormularioModal } from '../../ui/formulario-modal';

const STATUS_OPTIONS = [
    'Não requerido', 'Dispensado', 'Protocolado', 'Em análise', 'Em exigência',
    'Vigente', 'Vencido', 'Em renovação',
    'Suspenso', 'Cassado', 'Cancelado', 'Cancelado de ofício', 'Interditado',
];

const EMPTY = {
    estabelecimento_id: '',
    nivel_risco: '',
    status: 'Não requerido',
    data_alvara: '',
    vencimento_alvara: '',
    contato: '',
};

export default function AlvaraDialog({ open, onClose, alvara, onSuccess }) {
    const dispatch = useDispatch();
    const { selectList } = useSelector(state => state.estabelecimentos);
    const [form, setForm] = useState(EMPTY);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (open) {
            dispatch(getEstabelecimentosSelect());
            setLocalError('');
            setForm(alvara
                ? {
                    estabelecimento_id: alvara.estabelecimento_id || '',
                    nivel_risco:        alvara.nivel_risco || '',
                    status:             alvara.status || 'Não requerido',
                    data_alvara:        alvara.data_alvara?.substring(0, 10) || '',
                    vencimento_alvara:  alvara.vencimento_alvara?.substring(0, 10) || '',
                    contato:            alvara.contato || '',
                }
                : EMPTY
            );
        }
    }, [open, alvara?.id]);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const handleSalvar = () => {
        setLocalError('');
        const dados = {
            ...form,
            vencimento_alvara: form.vencimento_alvara || null,
            contato: form.contato || null,
        };
        if (alvara?.id) {
            dispatch(editAlvaraFetch(alvara.id, dados, onSuccess, setLocalError));
        } else {
            dispatch(addAlvaraFetch(dados, onSuccess, setLocalError));
        }
    };

    const editando = Boolean(alvara?.id);
    const campos = useMemo(() => [
        { name: 'estabelecimento_id', label: 'Estabelecimento', required: true, disabled: editando, options: selectList.map(est => ({ value: est.id, label: est.nome_estabelecimento })) },
        { name: 'nivel_risco', label: 'Nível de Risco', required: true, span: 6, options: [{ value: '1', label: '1 — Baixo' }, { value: '2', label: '2 — Médio' }, { value: '3', label: '3 — Alto' }, { value: 'N/A', label: 'N/A' }] },
        { name: 'status', label: 'Status', span: 6, options: STATUS_OPTIONS.map(s => ({ value: s, label: s })) },
        { name: 'data_alvara', label: 'Data do Alvará', type: 'date', required: true, span: 6, disabled: editando, dica: !editando ? 'O número será gerado automaticamente com base na data' : undefined },
        { name: 'vencimento_alvara', label: 'Vencimento (opcional)', type: 'date', span: 6, dica: 'Se não preenchido, é calculado automaticamente para 365 dias após a data do alvará' },
        { name: 'contato', label: 'Contato (opcional)', max: 1000 },
    ], [editando, selectList]);

    return (
        <FormularioModal
            aberto={open}
            titulo={editando ? `Editar Alvará — ${alvara.numero_alvara}` : 'Cadastrar Alvará'}
            aoFechar={onClose}
            aoGravar={handleSalvar}
            campos={campos}
            valores={form}
            aoMudar={change}
            tamanho="md"
            antes={(
                <div className="mb-4 space-y-3">
                    {localError && <Banner tom="perigo">{localError}</Banner>}
                    {editando && <p className="text-sm text-muted-foreground">Número: <strong>{alvara.numero_alvara}</strong> (gerado automaticamente, não editável)</p>}
                </div>
            )}
        />
    );
}
