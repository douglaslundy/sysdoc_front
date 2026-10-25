import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import { getClientsSelect } from '../../../store/fetchActions/clients';
import { getAllExames } from '../../../store/fetchActions/exames';
import { addPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import InputSelectClient from '../../inputs/inputSelectClient';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { CampoTexto } from '../../ui/campos';

const FORM_INICIAL = {
    client_id: '',
    medico_solicitante: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_coleta: '',
    observacoes: '',
    exames: [],
};

const formatExamLabel = (name) => {
    const value = name || '—';
    return value.length > 30 ? `${value.slice(0, 27)}...` : value;
};

export default function NovoPedido() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { clients } = useSelector(state => state.clients);
    const { exames }  = useSelector(state => state.exames);

    const [form, setForm]         = useState(FORM_INICIAL);
    const [busca, setBusca]       = useState('');

    useEffect(() => {
        dispatch(getClientsSelect({ limit: 50 }));
        dispatch(getAllExames({ ativo: true, per_page: 100 }));
    }, []);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const toggleExame = (exameId) => {
        setForm(f => ({
            ...f,
            exames: f.exames.includes(exameId)
                ? f.exames.filter(id => id !== exameId)
                : [...f.exames, exameId],
        }));
    };

    const examesFiltrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleSubmit = () => {
        dispatch(addPedidoFetch(form, () => router.push('/laboratorio/pedidos')));
    };

    return (
        <Card className="ui-reset">
            <CardHeader>
                <CardTitle>Novo Pedido de Exame</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid max-w-[700px] gap-5">
                    <InputSelectClient
                        label="Paciente"
                        name="client_id"
                        clients={clients}
                        value={form.client_id}
                        setClient={(client) => setForm(f => ({ ...f, client_id: client?.id || '' }))}
                        wd="100%"
                    />

                    <CampoTexto id="pedido-medico" label="Médico Solicitante" name="medico_solicitante" value={form.medico_solicitante} onChange={change} maxLength={100} />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <CampoTexto id="pedido-data" label="Data do Pedido" type="date" name="data_pedido" value={form.data_pedido} onChange={change} required obrigatorio />
                        <CampoTexto id="pedido-coleta" label="Data da Coleta" type="date" name="data_coleta" value={form.data_coleta} onChange={change} />
                    </div>

                    <CampoTexto id="pedido-obs" label="Observações" name="observacoes" value={form.observacoes} onChange={change} multiline rows={2} maxLength={500} />

                    <hr className="border-border" />
                    <h3 className="font-display text-base font-bold">Selecionar Exames</h3>
                    <CampoTexto id="pedido-filtro-exames" label="Filtrar exames" placeholder="Filtrar exames" value={busca} onChange={e => setBusca(e.target.value)} />

                    <div className="grid max-h-[260px] gap-2 overflow-y-auto rounded-lg border border-border p-3">
                        {examesFiltrados.map(exame => (
                            <CaixaDeMarcacao
                                key={exame.id}
                                id={`pedido-exame-${exame.id}`}
                                marcado={form.exames.includes(exame.id)}
                                aoMudar={() => toggleExame(exame.id)}
                            >
                                <span>
                                    <span className="block">{exame.nome}</span>
                                    <span className="block text-xs text-muted-foreground">{formatExamLabel(exame.nome)}</span>
                                </span>
                            </CaixaDeMarcacao>
                        ))}
                        {examesFiltrados.length === 0 && <p className="p-1 text-sm text-muted-foreground">Nenhum exame encontrado</p>}
                    </div>

                    {form.exames.length > 0 && (
                        <div>
                            <p className="text-xs text-muted-foreground">{form.exames.length} exame(s) selecionado(s):</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {exames.filter(e => form.exames.includes(e.id)).map(e => (
                                    <span key={e.id} title={e.codigo} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs">
                                        {formatExamLabel(e.nome)}
                                        <button type="button" aria-label={`Remover ${e.nome}`} onClick={() => toggleExame(e.id)} className="rounded text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none">
                                            <X className="size-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleSubmit} disabled={!form.client_id || form.exames.length === 0}>
                            Criar Pedido
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/laboratorio/pedidos')}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
