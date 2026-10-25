import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download } from 'lucide-react';
import AlertModal from '../../messagesModal';
import { api } from '../../../services/api';
import { turnResultadoModal } from '../../../store/ducks/Layout';
import { clearResultado } from '../../../store/ducks/resultadoExames';
import { salvarCamposFetch, liberarResultadoFetch } from '../../../store/fetchActions/resultadoExames';
import { getAllPedidos } from '../../../store/fetchActions/pedidosExame';
import { getLabConfig } from '../../../store/fetchActions/labConfig';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { Input, SelectNativo } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape } from '../../ui/dialogo';
import { Pilula, tomDaCor } from '../../ui/pilula';

const STATUS_COR = {
    normal: 'success', baixo: 'info', alto: 'error',
    critico: 'secondary', indefinido: 'default',
};

export default function ResultadoModal(props) {
    const dispatch = useDispatch();
    const { isOpenResultadoModal } = useSelector(state => state.layout);
    const { resultado } = useSelector(state => state.resultadoExames);
    const { config: labConfig } = useSelector(state => state.labConfig);

    const [valoresCampos, setValoresCampos] = useState({});
    const [openConfirm, setOpenConfirm] = useState(false);
    const [credenciais, setCredenciais] = useState(null);

    useEffect(() => {
        if (resultado && resultado.campos) {
            const init = {};
            resultado.campos.forEach(rc => {
                init[rc.exame_campo_id] = {
                    exame_campo_id: rc.exame_campo_id,
                    exame_id:       rc.exame_id,
                    valor_numerico: rc.valor_numerico ?? '',
                    valor_texto:    rc.valor_texto ?? '',
                    observacao:     rc.observacao ?? '',
                };
            });
            setValoresCampos(init);
        }
    }, [resultado?.id]);

    useEffect(() => {
        if (isOpenResultadoModal && !labConfig) {
            dispatch(getLabConfig());
        }
    }, [dispatch, isOpenResultadoModal, labConfig]);

    const setCampoValor = (campoId, exameId, field, value) => {
        setValoresCampos(prev => ({
            ...prev,
            [campoId]: { ...prev[campoId], exame_campo_id: campoId, exame_id: exameId, [field]: value },
        }));
    };

    const buildPayload = () => Object.values(valoresCampos).filter(c => c.exame_campo_id);

    const handleDownloadPdf = async (draft = false) => {
        if (!resultado?.id) return;
        try {
            const res = await api.get(`/laboratorio/resultados/${resultado.id}/pdf`, {
                responseType: 'blob',
                params: draft === true ? { rascunho: 1 } : undefined,
            });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${resultado.protocolo || resultado.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro tratado pelo interceptor global do api.js
        }
    };

    const handleClose = () => {
        setValoresCampos({});
        setOpenConfirm(false);
        dispatch(clearResultado());
        dispatch(turnResultadoModal());
    };

    const handleSalvar = () => {
        dispatch(salvarCamposFetch(resultado.id, buildPayload()));
    };

    const handleLiberar = () => {
        dispatch(liberarResultadoFetch(resultado.id, (data) => {
            setOpenConfirm(false);
            setCredenciais({ protocolo: data.protocolo, senha: data.senha });
            dispatch(getAllPedidos());
        }));
    };

    const getRef = (campo) => {
        const refs = campo.referencias || [];
        return refs.find(r => r.perfil === 'geral') || refs[0] || null;
    };

    const examesGrouped = resultado?.pedido?.exames || [];
    const jaLiberado = !!resultado?.data_liberacao;

    const temCampoPreenchido = Object.values(valoresCampos).some(c =>
        (c.valor_numerico !== '' && c.valor_numerico !== null && c.valor_numerico !== undefined) ||
        (c.valor_texto && c.valor_texto.trim() !== '')
    );

    const temCampoSalvo = (resultado?.campos?.length ?? 0) > 0;

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenResultadoModal)} aoFechar={handleClose} tamanho="xl">
                <DialogoCabecalho>{`Resultado — ${resultado?.pedido?.cliente?.name || '...'}`}</DialogoCabecalho>
                <AlertModal />

                {jaLiberado && (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Pilula tom="sucesso">Protocolo: {resultado.protocolo}</Pilula>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadPdf()}>
                            <Download aria-hidden /> PDF
                        </Button>
                    </div>
                )}
                {jaLiberado && (
                    <div className="mb-4">
                        <Banner tom="sucesso">
                            Resultado liberado em {resultado.data_liberacao
                                ? new Date(resultado.data_liberacao).toLocaleString('pt-BR')
                                : '—'}.
                        </Banner>
                    </div>
                )}

                {examesGrouped.map(exame => {
                    const camposAtivos = exame.campos_ativos || exame.camposAtivos || [];
                    return (
                        <section key={exame.id} className="mb-6 border-b border-border pb-4">
                            <h3 className="mb-3 font-display text-base font-bold text-primary-text">{exame.nome}</h3>
                            <div className="grid gap-3">
                                {camposAtivos.map(campo => {
                                    const val = valoresCampos[campo.id] || {};
                                    const ref = getRef(campo);
                                    const rcSalvo = resultado.campos?.find(rc => rc.exame_campo_id === campo.id);
                                    const idCampo = `res-${campo.id}`;

                                    return (
                                        <div key={campo.id} className="flex flex-wrap items-center gap-3">
                                            <label htmlFor={idCampo} className="min-w-[160px] text-sm font-medium">
                                                {campo.nome}
                                                {campo.unidade && <span className="ml-1 text-xs text-muted-foreground">({campo.unidade})</span>}
                                            </label>

                                            {campo.tipo_valor === 'numerico' && (
                                                <Input
                                                    id={idCampo}
                                                    type="number"
                                                    value={val.valor_numerico ?? ''}
                                                    onChange={({ target: { value } }) => setCampoValor(campo.id, exame.id, 'valor_numerico', value)}
                                                    disabled={jaLiberado}
                                                    max={99999999999}
                                                    step="any"
                                                    className="w-[120px]"
                                                />
                                            )}
                                            {campo.tipo_valor === 'texto' && (
                                                <Input
                                                    id={idCampo}
                                                    value={val.valor_texto ?? ''}
                                                    onChange={({ target: { value } }) => setCampoValor(campo.id, exame.id, 'valor_texto', value)}
                                                    disabled={jaLiberado}
                                                    className="min-w-[200px] flex-1"
                                                />
                                            )}
                                            {campo.tipo_valor === 'booleano' && (
                                                <div className="w-[160px]">
                                                    <SelectNativo id={idCampo} value={val.valor_texto ?? ''} onChange={({ target: { value } }) => setCampoValor(campo.id, exame.id, 'valor_texto', value)} disabled={jaLiberado}>
                                                        <option value="">—</option>
                                                        <option value="Reagente">Reagente</option>
                                                        <option value="Não Reagente">Não Reagente</option>
                                                    </SelectNativo>
                                                </div>
                                            )}
                                            {campo.tipo_valor === 'selecao' && (
                                                <div className="min-w-[140px]">
                                                    <SelectNativo id={idCampo} value={val.valor_texto ?? ''} onChange={({ target: { value } }) => setCampoValor(campo.id, exame.id, 'valor_texto', value)} disabled={jaLiberado}>
                                                        <option value="">—</option>
                                                        {(campo.opcoes_selecao || []).map(op => <option key={op} value={op}>{op}</option>)}
                                                    </SelectNativo>
                                                </div>
                                            )}

                                            {ref && (
                                                <span className="text-xs text-muted-foreground">
                                                    Ref:{' '}
                                                    {ref.valor_min !== null && ref.valor_max !== null
                                                        ? `${ref.valor_min} – ${ref.valor_max}`
                                                        : ref.valor_texto || '—'}
                                                </span>
                                            )}

                                            {rcSalvo?.status_referencia && (
                                                <Pilula tom={tomDaCor(STATUS_COR[rcSalvo.status_referencia])}>{rcSalvo.status_referencia}</Pilula>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {!jaLiberado && !temCampoSalvo && temCampoPreenchido && (
                    <p className="text-xs text-muted-foreground">Salve o rascunho para habilitar a liberação.</p>
                )}

                <DialogoRodape className="sm:flex-wrap">
                    {!jaLiberado && (
                        <>
                            <Button type="button" variant="outline" onClick={handleSalvar} disabled={!temCampoPreenchido}>
                                Salvar Rascunho
                            </Button>
                            {temCampoSalvo && labConfig?.imprimir_rascunho_exame && (
                                <Button type="button" variant="outline" onClick={() => handleDownloadPdf(true)}>
                                    <Download aria-hidden /> Baixar Rascunho
                                </Button>
                            )}
                            <Button type="button" variant="success" onClick={() => setOpenConfirm(true)} disabled={!temCampoSalvo} title={!temCampoSalvo ? 'Salve o rascunho antes de liberar' : ''}>
                                Liberar Resultado
                            </Button>
                        </>
                    )}
                    <Button type="button" variant="outline" onClick={handleClose}>Fechar</Button>
                </DialogoRodape>
            </Dialogo>

            <Dialogo aberto={openConfirm} aoFechar={() => setOpenConfirm(false)} tamanho="sm" alerta elevado>
                <DialogoCabecalho>Confirmar Liberação</DialogoCabecalho>
                <DialogoDescricao>
                    Ao liberar, o resultado ficará disponível para o paciente via protocolo gerado automaticamente. Esta ação não pode ser desfeita.
                </DialogoDescricao>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={() => setOpenConfirm(false)}>Cancelar</Button>
                    <Button type="button" variant="success" onClick={handleLiberar}>Confirmar Liberação</Button>
                </DialogoRodape>
            </Dialogo>

            <Dialogo aberto={Boolean(credenciais)} aoFechar={() => setCredenciais(null)} tamanho="sm" bloqueante elevado>
                <DialogoCabecalho comFechar={false}>Resultado Liberado — Dados para o Paciente</DialogoCabecalho>
                <DialogoDescricao className="mb-3">
                    Anote as informações abaixo e repasse ao paciente. A senha não poderá ser recuperada depois.
                </DialogoDescricao>
                <dl className="grid gap-2">
                    <div className="flex items-center gap-2">
                        <dt className="min-w-[80px] text-sm font-semibold">Protocolo:</dt>
                        <dd><Pilula tom="info">{credenciais?.protocolo}</Pilula></dd>
                    </div>
                    <div className="flex items-center gap-2">
                        <dt className="min-w-[80px] text-sm font-semibold">Senha:</dt>
                        <dd><Pilula tom="alerta">{credenciais?.senha}</Pilula></dd>
                    </div>
                </dl>
                <DialogoRodape>
                    <Button type="button" onClick={() => setCredenciais(null)}>Entendido</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
