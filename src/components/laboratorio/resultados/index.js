import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { ArrowLeft, Download } from 'lucide-react';
import { getResultado, salvarCamposFetch, liberarResultadoFetch } from '../../../store/fetchActions/resultadoExames';
import { Banner } from '../../ui/banner';
import { Button, buttonVariants } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input, SelectNativo } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Pilula, tomDaCor } from '../../ui/pilula';

const STATUS_COR = { normal: 'success', baixo: 'info', alto: 'error', critico: 'secondary', indefinido: 'default' };

export default function PreencherResultado() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { resultadoId } = router.query;
    const { resultado } = useSelector(state => state.resultadoExames);

    const [valoresCampos, setValoresCampos] = useState({});
    const [openConfirm, setOpenConfirm]     = useState(false);
    const [protocoloGerado, setProtocoloGerado] = useState(null);

    useEffect(() => {
        if (resultadoId) dispatch(getResultado(resultadoId));
    }, [resultadoId]);

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

    const setCampoValor = (campoId, exameId, field, value) => {
        setValoresCampos(prev => ({
            ...prev,
            [campoId]: { ...prev[campoId], exame_campo_id: campoId, exame_id: exameId, [field]: value },
        }));
    };

    const buildPayload = () => Object.values(valoresCampos).filter(c => c.exame_campo_id);

    const handleSalvar = () => {
        dispatch(salvarCamposFetch(resultado.id, buildPayload()));
    };

    const handleLiberar = () => {
        dispatch(liberarResultadoFetch(resultado.id, (data) => {
            setProtocoloGerado(data.protocolo);
            setOpenConfirm(false);
        }));
    };

    const examesGrouped = resultado?.pedido?.exames || [];
    const jaLiberado    = !!resultado?.data_liberacao;

    const getRef = (campo) => {
        const refs = campo.referencias || [];
        return refs.find(r => r.perfil === 'geral') || refs[0] || null;
    };

    if (!resultado || !resultado.id) {
        return (
            <Card>
                <CardContent><p className="text-sm text-muted-foreground">Carregando resultado...</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/laboratorio/pedidos')}>
                        <ArrowLeft /> Voltar
                    </Button>
                    Resultado — {resultado.pedido?.cliente?.name || '—'}
                </CardTitle>
                {jaLiberado ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Pilula tom="sucesso">{`Protocolo: ${resultado.protocolo}`}</Pilula>
                        <a
                            className={buttonVariants({ variant: 'outline' })}
                            href={`${process.env.NEXT_PUBLIC_API_URL}/laboratorio/resultados/${resultado.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Download /> Baixar PDF
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleSalvar}>Salvar Rascunho</Button>
                        <Button variant="success" onClick={() => setOpenConfirm(true)}>Liberar Resultado</Button>
                    </div>
                )}
            </CardHeader>

            {jaLiberado && (
                <div className="px-6">
                    <Banner tom="sucesso">
                        Resultado liberado em {resultado.data_liberacao ? new Date(resultado.data_liberacao).toLocaleString('pt-BR') : '—'}.
                        {protocoloGerado && ` Protocolo: ${protocoloGerado}`}
                    </Banner>
                </div>
            )}

            <CardContent>
                {examesGrouped.map(exame => {
                    const camposAtivos = exame.campos_ativos || exame.camposAtivos || [];
                    return (
                        <div key={exame.id} className="mb-8">
                            <h3 className="mb-3 font-display text-base font-bold text-primary-text">{exame.nome}</h3>
                            <div className="grid gap-3">
                                {camposAtivos.map(campo => {
                                    const val = valoresCampos[campo.id] || {};
                                    const ref = getRef(campo);
                                    const rcSalvo = resultado.campos?.find(rc => rc.exame_campo_id === campo.id);
                                    const rotulo = campo.unidade ? `${campo.nome} (${campo.unidade})` : campo.nome;

                                    return (
                                        <div key={campo.id} className="flex flex-wrap items-center gap-3">
                                            <span className="min-w-[160px] text-sm font-medium">
                                                {campo.nome}
                                                {campo.unidade && <span className="ml-1 text-xs text-muted-foreground">({campo.unidade})</span>}
                                            </span>

                                            {campo.tipo_valor === 'numerico' && (
                                                <Input
                                                    aria-label={rotulo}
                                                    type="number"
                                                    value={val.valor_numerico ?? ''}
                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_numerico', e.target.value)}
                                                    disabled={jaLiberado}
                                                    className="w-[120px]"
                                                />
                                            )}
                                            {campo.tipo_valor === 'texto' && (
                                                <Input
                                                    aria-label={rotulo}
                                                    value={val.valor_texto ?? ''}
                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                    disabled={jaLiberado}
                                                    className="min-w-[200px] flex-1"
                                                />
                                            )}
                                            {campo.tipo_valor === 'booleano' && (
                                                <div className="w-[160px]">
                                                    <SelectNativo
                                                        aria-label={rotulo}
                                                        value={val.valor_texto ?? ''}
                                                        onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                        disabled={jaLiberado}
                                                    >
                                                        <option value="">—</option>
                                                        <option value="Reagente">Reagente</option>
                                                        <option value="Não Reagente">Não Reagente</option>
                                                    </SelectNativo>
                                                </div>
                                            )}
                                            {campo.tipo_valor === 'selecao' && (
                                                <div className="min-w-[160px]">
                                                    <SelectNativo
                                                        aria-label={rotulo}
                                                        value={val.valor_texto ?? ''}
                                                        onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                        disabled={jaLiberado}
                                                    >
                                                        <option value="">—</option>
                                                        {(campo.opcoes_selecao || []).map(op => <option key={op} value={op}>{op}</option>)}
                                                    </SelectNativo>
                                                </div>
                                            )}

                                            {ref && (
                                                <span className="text-xs text-muted-foreground">
                                                    Ref: {ref.valor_min !== null ? `${ref.valor_min} – ${ref.valor_max}` : ref.valor_texto || '—'}
                                                </span>
                                            )}

                                            {rcSalvo && (
                                                <Pilula tom={tomDaCor(STATUS_COR[rcSalvo.status_referencia] || 'default')}>{rcSalvo.status_referencia}</Pilula>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <hr className="mt-4 border-border" />
                        </div>
                    );
                })}
            </CardContent>

            {/* Confirmação de liberação */}
            <Dialogo aberto={openConfirm} aoFechar={() => setOpenConfirm(false)} alerta tamanho="sm">
                <DialogoCabecalho>Confirmar Liberação</DialogoCabecalho>
                <p className="text-sm text-muted-foreground">
                    Ao liberar, o resultado ficará disponível para o paciente via protocolo e senha gerados automaticamente. Esta ação não pode ser desfeita.
                </p>
                <DialogoRodape>
                    <Button variant="outline" onClick={() => setOpenConfirm(false)}>Cancelar</Button>
                    <Button variant="success" onClick={handleLiberar}>Confirmar Liberação</Button>
                </DialogoRodape>
            </Dialogo>
        </Card>
    );
}
