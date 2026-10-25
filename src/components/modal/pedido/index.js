import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Loader2, Search } from 'lucide-react';
import AlertModal from '../../messagesModal';
import BasicDatePicker from '../../inputs/datePicker';
import { closePedidoModal } from '../../../store/ducks/Layout';
import { addPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { getAllExames } from '../../../store/fetchActions/exames';
import { getAllMedicos } from '../../../store/fetchActions/medicosSolicitantes';
import { api } from '../../../services/api';
import SeletorDeExames from '../_shared/SeletorDeExames';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const hoje = () => new Date().toISOString().split('T')[0];

const FORM_INICIAL = {
    client_id: '',
    medico_solicitante_id: '',
    data_pedido: hoje(),
    data_coleta: '',
    observacoes: '',
    exames: [],
};

export default function PedidoModal(props) {
    const dispatch = useDispatch();
    const { isOpenPedidoModal } = useSelector(state => state.layout);
    const { exames } = useSelector(state => state.exames);
    const { medicos } = useSelector(state => state.medicosSolicitantes);
    const defaultDataColeta = props.defaultDataColeta || '';

    const [form, setForm] = useState(FORM_INICIAL);
    const [cpfCns, setCpfCns] = useState('');
    const [paciente, setPaciente] = useState(null);
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);
    const [erroPaciente, setErroPaciente] = useState('');
    const [credenciais, setCredenciais] = useState(null);

    useEffect(() => {
        if (isOpenPedidoModal) {
            dispatch(getAllExames({ ativo: true, per_page: 200 }));
            dispatch(getAllMedicos({ all: true, ativo: true }));
            if (defaultDataColeta) {
                setForm(f => ({ ...f, data_coleta: defaultDataColeta }));
            }
        }
    }, [isOpenPedidoModal, defaultDataColeta]);

    const buscarPaciente = async () => {
        const termo = cpfCns.replace(/\D/g, '');
        if (termo.length < 6) {
            setErroPaciente('Informe ao menos 6 dígitos do CPF ou CNS.');
            return;
        }
        setBuscandoPaciente(true);
        setErroPaciente('');
        setPaciente(null);
        try {
            const res = await api.get('/clients/buscar-cpf-cns', { params: { q: termo } });
            setPaciente(res.data);
            setForm(f => ({ ...f, client_id: res.data.id }));
        } catch (err) {
            setErroPaciente(err.response?.data?.message || 'Paciente não encontrado.');
            setForm(f => ({ ...f, client_id: '' }));
        } finally {
            setBuscandoPaciente(false);
        }
    };

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

    const cleanForm = () => {
        setForm({ ...FORM_INICIAL, data_pedido: hoje() });
        setCpfCns('');
        setPaciente(null);
        setErroPaciente('');
        dispatch(closePedidoModal());
    };

    const handleSave = () => {
        dispatch(addPedidoFetch(form, (_pedido, protocolo, senha) => {
            setCredenciais({ protocolo, senha });
            props.onSaved && props.onSaved(_pedido);
        }));
    };

    const handleFecharCredenciais = () => {
        setCredenciais(null);
        cleanForm();
    };

    return (
        <div>
            <Dialogo aberto={Boolean(credenciais)} aoFechar={handleFecharCredenciais} tamanho="sm" bloqueante elevado>
                <DialogoCabecalho comFechar={false}>
                    <span className="flex items-center gap-2"><CheckCircle2 className="size-5 text-success" aria-hidden /> Pedido Criado — Credenciais de Acesso</span>
                </DialogoCabecalho>
                <div className="grid gap-4">
                    <Banner tom="alerta">Anote a senha agora. Ela não poderá ser recuperada depois.</Banner>
                    <div>
                        <p className="text-xs text-muted-foreground">Protocolo</p>
                        <p className="mt-1 font-display text-xl font-extrabold tracking-wider text-success" data-testid="protocolo-criado">{credenciais?.protocolo}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Senha de Acesso</p>
                        <p className="mt-1 font-display text-2xl font-extrabold tracking-[0.25em] text-primary-text" data-testid="senha-criada">{credenciais?.senha}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Entregue estas credenciais ao paciente para que ele possa consultar o resultado do exame online.
                    </p>
                </div>
                <DialogoRodape>
                    <Button type="button" onClick={handleFecharCredenciais}>Entendi, fechar</Button>
                </DialogoRodape>
            </Dialogo>

            {props.children}
            <Dialogo aberto={Boolean(isOpenPedidoModal)} aoFechar={cleanForm} tamanho="lg">
                <DialogoCabecalho>Cadastrar Pedido de Exame</DialogoCabecalho>
                <AlertModal />
                <div className="grid gap-5">
                    {/* Busca de paciente por CPF/CNS */}
                    <div className="grid gap-2">
                        <h3 className="font-display text-sm font-bold">Buscar Paciente</h3>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <CampoTexto
                                    id="pedido-cpf-cns"
                                    label="CPF ou CNS do paciente"
                                    value={cpfCns}
                                    onChange={e => setCpfCns(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && buscarPaciente()}
                                    maxLength={20}
                                    autoComplete="off"
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={buscarPaciente} disabled={buscandoPaciente}>
                                {buscandoPaciente ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />} Buscar
                            </Button>
                        </div>
                        {erroPaciente && <Banner tom="alerta">{erroPaciente}</Banner>}
                        {paciente && (
                            <Banner tom="sucesso" onDispensar={() => { setPaciente(null); setCpfCns(''); setForm(f => ({ ...f, client_id: '' })); }}>
                                <strong>{paciente.name}</strong>
                                {paciente.cpf && ` — CPF: ${paciente.cpf}`}
                                {paciente.cns && ` — CNS: ${paciente.cns}`}
                            </Banner>
                        )}
                    </div>

                    <CampoSelecao
                        id="pedido-medico"
                        label="Médico Solicitante"
                        name="medico_solicitante_id"
                        value={form.medico_solicitante_id}
                        onChange={({ target: { value } }) => setForm(f => ({ ...f, medico_solicitante_id: value === '' ? '' : Number(value) }))}
                    >
                        <option value="">Nenhum</option>
                        {medicosAtivos.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nome}{m.crm ? ` — CRM ${m.crm}${m.uf_crm ? '/' + m.uf_crm : ''}` : ''}
                            </option>
                        ))}
                    </CampoSelecao>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <BasicDatePicker
                            label="Data do Pedido"
                            name="data_pedido"
                            value={form.data_pedido}
                            setValue={(v) => setForm(f => ({ ...f, data_pedido: v ? v.toISOString().split('T')[0] : '' }))}
                        />
                        <BasicDatePicker
                            label="Data da Coleta"
                            name="data_coleta"
                            value={form.data_coleta}
                            setValue={(v) => setForm(f => ({ ...f, data_coleta: v ? v.toISOString().split('T')[0] : '' }))}
                        />
                    </div>

                    <CampoTexto id="pedido-obs" label="Observações" name="observacoes" value={form.observacoes} onChange={change} multiline rows={2} maxLength={500} />

                    <h3 className="border-t border-border pt-4 font-display text-base font-bold">Selecionar Exames</h3>
                    <SeletorDeExames exames={exames} selecionados={form.exames} aoAlternar={toggleExame} idBase="pedido-exame" />
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={cleanForm}>Cancelar</Button>
                    <Button type="button" onClick={handleSave} disabled={!form.client_id || form.exames.length === 0}>Criar Pedido</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
