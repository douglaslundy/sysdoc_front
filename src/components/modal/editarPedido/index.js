import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { getAllExames } from '../../../store/fetchActions/exames';
import { getAllMedicos } from '../../../store/fetchActions/medicosSolicitantes';
import SeletorDeExames from '../_shared/SeletorDeExames';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const STATUS_BLOQUEADO = ['liberado', 'cancelado'];

const initFromPedido = (pedido) => ({
    medico_solicitante_id: pedido?.medico_solicitante?.id || '',
    data_pedido: pedido?.data_pedido || '',
    data_coleta: pedido?.data_coleta || '',
    observacoes: pedido?.observacoes || '',
    exames: pedido?.exames?.map(e => e.id) || [],
});

export default function EditarPedidoDialog({ open, onClose, pedido }) {
    const dispatch = useDispatch();
    const { exames } = useSelector(state => state.exames);
    const { medicos } = useSelector(state => state.medicosSolicitantes);

    const [form, setForm] = useState(initFromPedido(pedido));

    useEffect(() => {
        if (open) {
            dispatch(getAllExames({ ativo: true, per_page: 200 }));
            dispatch(getAllMedicos({ all: true, ativo: true }));
        }
    }, [open]);

    useEffect(() => {
        setForm(initFromPedido(pedido));
    }, [pedido?.id]);

    const bloqueado = STATUS_BLOQUEADO.includes(pedido?.status);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const toggleExame = (exameId) => {
        setForm(f => ({
            ...f,
            exames: f.exames.includes(exameId)
                ? f.exames.filter(id => id !== exameId)
                : [...f.exames, exameId],
        }));
    };

    const medicosAtivos = medicos.filter(m => m.ativo);

    const handleSave = () => {
        dispatch(updatePedidoFetch(pedido.id, form, () => onClose()));
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
            <DialogoCabecalho>Editar Pedido de Exame</DialogoCabecalho>
            <div className="grid gap-4">
                {bloqueado && (
                    <Banner tom="alerta">
                        Pedidos com status <strong>{pedido?.status}</strong> não podem ser editados.
                    </Banner>
                )}

                <CampoSelecao
                    id="ep-medico"
                    label="Médico Solicitante"
                    name="medico_solicitante_id"
                    value={form.medico_solicitante_id}
                    onChange={({ target: { value } }) => setForm(f => ({ ...f, medico_solicitante_id: value === '' ? '' : Number(value) }))}
                    disabled={bloqueado}
                >
                    <option value="">Nenhum</option>
                    {medicosAtivos.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.nome}{m.crm ? ` — CRM ${m.crm}${m.uf_crm ? '/' + m.uf_crm : ''}` : ''}
                        </option>
                    ))}
                </CampoSelecao>

                <div className="grid gap-4 sm:grid-cols-2">
                    <CampoTexto id="ep-data-pedido" label="Data do Pedido" name="data_pedido" type="date" value={form.data_pedido} onChange={change} disabled={bloqueado} />
                    <CampoTexto id="ep-data-coleta" label="Data da Coleta" name="data_coleta" type="date" value={form.data_coleta} onChange={change} disabled={bloqueado} />
                </div>

                <CampoTexto id="ep-obs" label="Observações" name="observacoes" value={form.observacoes} onChange={change} multiline rows={2} disabled={bloqueado} maxLength={500} />

                <h3 className="border-t border-border pt-4 font-display text-base font-bold">Exames</h3>
                <SeletorDeExames exames={exames} selecionados={form.exames} aoAlternar={toggleExame} desabilitado={bloqueado} idBase="ep-exame" />
            </div>
            <DialogoRodape>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={handleSave} disabled={bloqueado}>Salvar Alterações</Button>
            </DialogoRodape>
        </Dialogo>
    );
}
