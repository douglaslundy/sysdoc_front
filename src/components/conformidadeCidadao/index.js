// src/components/conformidadeCidadao/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Loader, RefreshCw } from 'lucide-react';
import { conformidadeCidadaoApi } from '../../services/conformidadeCidadaoApi';
import { generateConformidadeHistoricoPDF } from '../../reports/conformidadeCidadao';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoRodape, DialogoTitulo } from '../ui/dialogo';
import { Input } from '../ui/campos';
import { Pilula } from '../ui/pilula';

const CHIP_TONS = { criar: 'sucesso', atualizar: 'info', obito: 'perigo' };
const CHIP_LABELS = { criar: 'Criar', atualizar: 'Atualizar', obito: 'Óbito' };

const STATUS_LABELS = {
    pending: 'aguardando',
    analyzing: 'analisando',
    preview_ready: 'prévia pronta',
    applying: 'aplicando',
    completed: 'concluído',
    failed: 'falhou',
};

function diffToString(payload) {
    return Object.keys(payload)
        .filter(k => k !== 'address')
        .map(k => {
            if (k === 'nome') return 'Nome';
            if (k === 'born_date') return 'Nascimento';
            if (k === 'phone') return 'Telefone';
            return k;
        })
        .concat(payload.address ? ['Endereço'] : [])
        .join(', ') || '—';
}

function PageJumper({ currentPage, lastPage, onGo }) {
    const [value, setValue] = useState(String(currentPage));

    useEffect(() => { setValue(String(currentPage)); }, [currentPage]);

    const go = () => {
        const n = parseInt(value, 10);
        if (n >= 1 && n <= lastPage && n !== currentPage) {
            onGo(n);
        } else {
            setValue(String(currentPage));
        }
    };

    if (lastPage <= 1) return null;

    return (
        <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-muted-foreground">Ir para</span>
            <Input
                aria-label="Número da página"
                value={value}
                onChange={e => setValue(e.target.value.replace(/\D/g, '') || '')}
                onBlur={go}
                onKeyDown={e => e.key === 'Enter' && go()}
                className="h-8 w-12 px-1.5 text-center text-[13px]"
            />
            <span className="text-xs text-muted-foreground">de {lastPage}</span>
            {currentPage < lastPage && (
                <Button size="xs" variant="outline" onClick={() => onGo(lastPage)}>
                    Ultima
                </Button>
            )}
        </div>
    );
}

// Rodapé de paginação do servidor: salto de página + intervalo + anterior/próxima.
function NavegacaoDePaginas({ meta, aoIr }) {
    const inicio = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const fim = Math.min(meta.total, meta.current_page * meta.per_page);
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 text-sm text-muted-foreground">
            <PageJumper currentPage={meta.current_page} lastPage={meta.last_page} onGo={aoIr} />
            <span aria-live="polite">{inicio}–{fim} de {meta.total}</span>
            <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={meta.current_page <= 1} onClick={() => aoIr(meta.current_page - 1)}>
                <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Próxima página" disabled={meta.current_page >= meta.last_page} onClick={() => aoIr(meta.current_page + 1)}>
                <ChevronRight />
            </Button>
        </div>
    );
}

function Contador({ valor, rotulo, cor }) {
    return (
        <div className="rounded-xl border border-border p-4 text-center">
            <p className={`font-mono text-3xl font-bold ${cor}`}>{valor}</p>
            <p className="text-sm">{rotulo}</p>
        </div>
    );
}
export default function ConformidadeCidadao() {
    const [fase, setFase] = useState('idle');
    const [jobId, setJobId] = useState(null);
    const [syncData, setSyncData] = useState(null);
    const [itens, setItens] = useState([]);
    const [itensMeta, setItensMeta] = useState({ total: 0, per_page: 20, current_page: 1, last_page: 1 });
    const [historico, setHistorico] = useState([]);
    const [histMeta, setHistMeta] = useState({ total: 0, per_page: 15, current_page: 1, last_page: 1 });
    const [errosDetalhe, setErrosDetalhe] = useState([]);
    const [detalhesHistorico, setDetalhesHistorico] = useState({
        open: false,
        loading: false,
        row: null,
        itens: [],
        meta: { total: 0, per_page: 50, current_page: 1, last_page: 1 },
    });
    const [pdfJobId, setPdfJobId] = useState(null);
    const [erro, setErro] = useState(null);
    const [cancelando, setCancelando] = useState(false);
    const pollingRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const carregarHistorico = useCallback(async (page = 1) => {
        try {
            const data = await conformidadeCidadaoApi.historico(page);
            setHistorico(data.data);
            setHistMeta(data.meta);
        } catch (_) {}
    }, []);

    // Processa resposta de status e transiciona de fase
    const processarStatus = useCallback((data, jid) => {
        setSyncData(data);
        if (data.status === 'preview_ready') {
            setItens(data.itens || []);
            setItensMeta(data.itens_meta || { total: 0, per_page: 20, current_page: 1, last_page: 1 });
            setFase('preview');
            stopPolling();
        } else if (data.status === 'completed') {
            setFase('done');
            stopPolling();
            carregarHistorico();
            if ((data.result_erros ?? 0) > 0 && jid) {
                conformidadeCidadaoApi.erros(jid)
                    .then((res) => setErrosDetalhe(res?.data ?? []))
                    .catch(() => setErrosDetalhe([]));
            } else {
                setErrosDetalhe([]);
            }
        } else if (data.status === 'failed') {
            setErro(data.erro_mensagem || 'Erro desconhecido na sincronização.');
            setFase('error');
            stopPolling();
        }
    }, [stopPolling, carregarHistorico]);

    const iniciarPolling = useCallback((jid) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const data = await conformidadeCidadaoApi.status(jid);
                processarStatus(data, jid);
            } catch (_) {}
        }, 1000);
    }, [stopPolling, processarStatus]);

    // Na montagem: carrega histórico e reconecta a job em andamento
    useEffect(() => {
        const init = async () => {
            try {
                const data = await conformidadeCidadaoApi.historico(1);
                setHistorico(data.data);
                setHistMeta(data.meta);

                const latest = data.data?.[0];
                if (latest?.job_id && ['pending', 'analyzing', 'applying'].includes(latest.status)) {
                    setJobId(latest.job_id);
                    setFase(latest.status === 'applying' ? 'applying' : 'analyzing');
                    // Busca status imediatamente para popular barra de progresso sem esperar 3s
                    try {
                        const s = await conformidadeCidadaoApi.status(latest.job_id);
                        setSyncData(s);
                    } catch (_) {}
                    iniciarPolling(latest.job_id);
                } else if (latest?.job_id && latest.status === 'preview_ready') {
                    setJobId(latest.job_id);
                    try {
                        const s = await conformidadeCidadaoApi.status(latest.job_id);
                        processarStatus(s, latest.job_id);
                    } catch (_) {}
                }
            } catch (_) {}
        };
        init();
        return () => stopPolling();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnalisar = async () => {
        setErro(null);
        setFase('analyzing');

        // Linha otimista: aparece imediatamente no histórico sem esperar a API
        const optimisticRow = {
            job_id: '__new__',
            status: 'analyzing',
            created_at: new Date().toISOString(),
            iniciado_por: null,
            preview_criados: null, preview_atualizados: null, preview_obitos: null,
            result_criados: null, result_atualizados: null, result_obitos: null, result_erros: null,
        };
        setHistorico(prev => [optimisticRow, ...prev]);

        try {
            const data = await conformidadeCidadaoApi.analisar();
            setJobId(data.job_id);
            // Substitui linha otimista pelos dados reais do servidor
            await carregarHistorico();
            iniciarPolling(data.job_id);
        } catch (err) {
            // Remove linha otimista se a requisição falhar
            setHistorico(prev => prev.filter(s => s.job_id !== '__new__'));
            const status = err?.response?.status;
            if (status === 409) setErro('Já existe uma sincronização em andamento.');
            else if (status === 403) setErro('Sem permissão para executar a sincronização.');
            else setErro('Erro ao iniciar a análise. Verifique a conexão com o servidor.');
            setFase('idle');
        }
    };

    const handleAplicar = async () => {
        setFase('applying');
        try {
            await conformidadeCidadaoApi.aplicar(jobId);
            iniciarPolling(jobId);
        } catch (err) {
            setErro('Erro ao iniciar a aplicação das alterações.');
            setFase('preview');
        }
    };

    const handleCancelar = async () => {
        if (!jobId) return;
        setCancelando(true);
        try {
            await conformidadeCidadaoApi.cancelar(jobId);
            stopPolling();
            setFase('idle');
            setJobId(null);
            setSyncData(null);
            setErro(null);
            carregarHistorico();
        } catch (_) {
            setErro('Não foi possível cancelar a sincronização.');
        } finally {
            setCancelando(false);
        }
    };

    const handleDescartarPreview = async () => {
        if (!jobId) return;
        setCancelando(true);
        try {
            await conformidadeCidadaoApi.cancelar(jobId);
            setFase('idle');
            setJobId(null);
            setSyncData(null);
            setItens([]);
            setErro(null);
            carregarHistorico();
        } catch (_) {
            setErro('Não foi possível descartar a prévia.');
        } finally {
            setCancelando(false);
        }
    };

    const handleItensPagina = async (_, newPage) => {
        try {
            const data = await conformidadeCidadaoApi.status(jobId, newPage + 1, itensMeta.per_page);
            setItens(data.itens || []);
            setItensMeta(data.itens_meta || itensMeta);
        } catch (_) {}
    };

    const handleNovaSincronizacao = () => {
        setFase('idle');
        setJobId(null);
        setSyncData(null);
        setItens([]);
        setErrosDetalhe([]);
        setErro(null);
        carregarHistorico();
    };

    const carregarDetalhesHistorico = async (row, page = 1) => {
        if (!row?.job_id || row.job_id === '__new__') return;

        setDetalhesHistorico(prev => ({
            ...prev,
            open: true,
            loading: true,
            row,
        }));

        try {
            const data = await conformidadeCidadaoApi.itens(row.job_id, page, detalhesHistorico.meta.per_page);
            setDetalhesHistorico(prev => ({
                ...prev,
                open: true,
                loading: false,
                row: data.sync ?? row,
                itens: data.data ?? [],
                meta: data.meta ?? prev.meta,
            }));
        } catch (_) {
            setDetalhesHistorico(prev => ({ ...prev, loading: false }));
            setErro('Não foi possível carregar os detalhes do histórico.');
        }
    };

    const fecharDetalhesHistorico = () => {
        setDetalhesHistorico(prev => ({
            ...prev,
            open: false,
            row: null,
            itens: [],
        }));
    };

    const baixarPdfHistorico = async (row) => {
        if (!row?.job_id || row.job_id === '__new__') return;
        setPdfJobId(row.job_id);

        try {
            const primeira = await conformidadeCidadaoApi.itens(row.job_id, 1, 500);
            let todos = primeira.data ?? [];
            const lastPage = primeira.meta?.last_page ?? 1;

            for (let page = 2; page <= lastPage; page += 1) {
                const data = await conformidadeCidadaoApi.itens(row.job_id, page, 500);
                todos = todos.concat(data.data ?? []);
            }

            generateConformidadeHistoricoPDF(primeira.sync ?? row, todos);
        } catch (_) {
            setErro('Não foi possível baixar o PDF do histórico.');
        } finally {
            setPdfJobId(null);
        }
    };

    const emAndamento = ['analyzing', 'applying'].includes(fase);

    const colunasPrevia = [
        { chave: 'acao', titulo: 'Ação', render: (item) => <Pilula tom={CHIP_TONS[item.acao] || 'neutro'}>{CHIP_LABELS[item.acao]}</Pilula> },
        { chave: 'nome', titulo: 'Nome (e-SUS)', render: (item) => item.nome_esus },
        { chave: 'doc', titulo: 'CPF / CNS', render: (item) => <span className="text-xs">{item.cpf || '—'}<br />{item.cns || '—'}</span> },
        {
            chave: 'campos',
            titulo: 'Campos',
            render: (item) => (
                <span className="text-xs">
                    {item.acao === 'criar' ? 'Novo cadastro' :
                     item.acao === 'obito' ? 'Inativar + filas' :
                     diffToString(item.payload)}
                </span>
            ),
        },
    ];

    const colunasErros = [
        { chave: 'nome', titulo: 'Nome (e-SUS)', render: (item) => item.nome_esus },
        { chave: 'cpf', titulo: 'CPF', render: (item) => item.cpf || '—' },
        { chave: 'acao', titulo: 'Ação', render: (item) => CHIP_LABELS[item.acao] || item.acao },
        { chave: 'erro', titulo: 'Motivo do erro', render: (item) => item.erro || '—' },
    ];

    const tomDoStatus = (status) => (
        status === 'completed' ? 'sucesso' :
        status === 'failed' ? 'perigo' :
        ['analyzing', 'applying', 'pending'].includes(status) ? 'alerta' :
        'neutro'
    );

    const colunasHistorico = [
        { chave: 'data', titulo: 'Data', render: (s) => <span className="text-xs">{s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : '—'}</span> },
        { chave: 'status', titulo: 'Status', render: (s) => <Pilula tom={tomDoStatus(s.status)}>{STATUS_LABELS[s.status] ?? s.status}</Pilula> },
        { chave: 'criados', titulo: 'Criados', render: (s) => s.result_criados ?? '—' },
        { chave: 'atualizados', titulo: 'Atualizados', render: (s) => s.result_atualizados ?? '—' },
        { chave: 'obitos', titulo: 'Óbitos', render: (s) => s.result_obitos ?? '—' },
        { chave: 'erros', titulo: 'Erros', render: (s) => s.result_erros ?? '—' },
        { chave: 'por', titulo: 'Iniciado por', render: (s) => s.iniciado_por?.name ?? '—' },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (s) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        title="Visualizar atualizacoes"
                        aria-label="Visualizar atualizacoes"
                        disabled={!s.job_id || s.job_id === '__new__'}
                        onClick={() => carregarDetalhesHistorico(s, 1)}
                    >
                        <Eye />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        title="Baixar PDF"
                        aria-label="Baixar PDF"
                        disabled={!s.job_id || s.job_id === '__new__' || pdfJobId === s.job_id}
                        onClick={() => baixarPdfHistorico(s)}
                    >
                        {pdfJobId === s.job_id ? <Loader className="animate-spin" /> : <Download />}
                    </Button>
                </div>
            ),
        },
    ];

    const colunasDetalhes = [
        { chave: 'acao', titulo: 'Acao', render: (item) => <Pilula tom={CHIP_TONS[item.acao] || 'neutro'}>{CHIP_LABELS[item.acao] ?? item.acao}</Pilula> },
        { chave: 'nome', titulo: 'Nome (e-SUS)', render: (item) => item.nome_esus },
        { chave: 'doc', titulo: 'CPF / CNS', render: (item) => <span className="text-xs">{item.cpf || '-'}<br />{item.cns || '-'}</span> },
        {
            chave: 'campos',
            titulo: 'Campos',
            render: (item) => (
                <span className="text-xs">
                    {item.acao === 'criar' ? 'Novo cadastro' :
                     item.acao === 'obito' ? 'Inativar + filas' :
                     diffToString(item.payload ?? {})}
                </span>
            ),
        },
        { chave: 'resultado', titulo: 'Resultado', render: (item) => <span className="text-xs">{item.erro || (item.aplicado ? 'Aplicado' : 'Pendente')}</span> },
    ];

    const Progresso = ({ pct }) => (
        <div className="flex items-center gap-2">
            <div
                role="progressbar"
                aria-label="Progresso"
                aria-valuenow={pct ?? undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 flex-1 overflow-hidden rounded-full bg-primary/20"
            >
                <div
                    className={`h-full rounded-full bg-primary ${pct === null ? 'w-1/3 animate-[pulse-suave_1.5s_ease-in-out_infinite]' : 'transition-[width] duration-[400ms]'}`}
                    style={pct === null ? undefined : { width: `${pct}%` }}
                />
            </div>
            {pct !== null && <span className="min-w-9 text-right text-xs">{pct}%</span>}
        </div>
    );

    return (
        <div className="conformidade-theme-surface grid gap-6">
            {erro && <Banner tom="perigo" onDispensar={() => setErro(null)}>{erro}</Banner>}

            {fase === 'idle' && (
                <Card>
                    <CardHeader><CardTitle>Conformidade de Cidadãos — e-SUS PEC</CardTitle></CardHeader>
                    <CardContent className="grid max-w-[560px] gap-4">
                        <p className="text-sm text-muted-foreground">
                            Compara os clientes cadastrados no Sysdoc com os cidadãos ativos no e-SUS PEC.
                            Atualiza dados divergentes, processa óbitos e cria novos registros. Uma prévia
                            é exibida antes de qualquer alteração ser aplicada.
                        </p>
                        <div>
                            <Button onClick={handleAnalisar}>
                                <RefreshCw /> Analisar agora
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {fase === 'analyzing' && (
                <Card>
                    <CardHeader><CardTitle>Analisando...</CardTitle></CardHeader>
                    <CardContent className="grid max-w-[560px] gap-4">
                        {(() => {
                            const previsto = syncData?.total_esus_previsto ?? 0;
                            const processado = syncData?.total_esus ?? 0;
                            const pct = previsto > 0 ? Math.min(100, Math.round((processado / previsto) * 100)) : null;
                            return (
                                <>
                                    <Progresso pct={pct} />
                                    <Carregando className="py-0">
                                        <div>
                                            <p className="text-foreground">Comparando cidadãos com e-SUS PEC...</p>
                                            {processado > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {processado.toLocaleString('pt-BR')}
                                                    {previsto > 0 && ` de ${previsto.toLocaleString('pt-BR')}`}
                                                    {' '}registros processados
                                                    {syncData.preview_criados > 0 && ` · ${syncData.preview_criados} para criar`}
                                                    {syncData.preview_atualizados > 0 && ` · ${syncData.preview_atualizados} para atualizar`}
                                                    {syncData.preview_obitos > 0 && ` · ${syncData.preview_obitos} óbitos`}
                                                </p>
                                            )}
                                        </div>
                                    </Carregando>
                                </>
                            );
                        })()}
                        <div>
                            <Button variant="destructive" size="sm" disabled={cancelando} onClick={handleCancelar}>
                                {cancelando ? 'Cancelando...' : 'Cancelar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {fase === 'preview' && syncData && (
                <Card>
                    <CardHeader><CardTitle>Prévia das Alterações</CardTitle></CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Contador valor={syncData.preview_criados} rotulo="Novos para criar" cor="text-success" />
                            <Contador valor={syncData.preview_atualizados} rotulo="Com dados diferentes" cor="text-info" />
                            <Contador valor={syncData.preview_obitos} rotulo="Óbitos a processar" cor="text-danger" />
                        </div>

                        <div>
                            <DataTable rotulo="prévia das alterações" colunas={colunasPrevia} linhas={itens} chaveDaLinha={(item) => item.id} vazio="Nenhuma alteração." />
                            <NavegacaoDePaginas meta={itensMeta} aoIr={(page) => handleItensPagina(null, page - 1)} />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={handleAplicar}>Aplicar alterações</Button>
                            <Button variant="outline" onClick={handleDescartarPreview} disabled={cancelando}>
                                Descartar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {fase === 'applying' && (
                <Card>
                    <CardHeader><CardTitle>Aplicando...</CardTitle></CardHeader>
                    <CardContent className="grid max-w-[560px] gap-4">
                        {(() => {
                            const totalAplicar = syncData?.total_a_aplicar ?? 0;
                            const aplicados = syncData?.total_aplicado ?? 0;
                            const pct = totalAplicar > 0 ? Math.min(100, Math.round((aplicados / totalAplicar) * 100)) : null;
                            return (
                                <>
                                    <Progresso pct={pct} />
                                    <Carregando className="py-0">
                                        <div>
                                            <p className="text-foreground">Aplicando alterações no Sysdoc...</p>
                                            {aplicados > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {aplicados.toLocaleString('pt-BR')}
                                                    {totalAplicar > 0 && ` de ${totalAplicar.toLocaleString('pt-BR')}`}
                                                    {' '}registros aplicados
                                                </p>
                                            )}
                                        </div>
                                    </Carregando>
                                </>
                            );
                        })()}

                        <div>
                            <Button variant="destructive" size="sm" disabled={cancelando} onClick={handleCancelar}>
                                {cancelando ? 'Cancelando...' : 'Cancelar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {fase === 'done' && syncData && (
                <Card>
                    <CardHeader><CardTitle>Sincronização Concluída</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                        {syncData.result_erros > 0 && (
                            <Banner tom="alerta">
                                {syncData.result_erros} item(s) com erro — verifique os detalhes no histórico.
                            </Banner>
                        )}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <Contador valor={syncData.result_criados ?? 0} rotulo="Criados" cor="text-success" />
                            <Contador valor={syncData.result_atualizados ?? 0} rotulo="Atualizados" cor="text-info" />
                            <Contador valor={syncData.result_obitos ?? 0} rotulo="Óbitos" cor="text-danger" />
                            <Contador valor={syncData.result_erros ?? 0} rotulo="Erros" cor={syncData.result_erros > 0 ? 'text-primary-text' : 'text-muted-foreground'} />
                        </div>
                        <div>
                            <Button variant="outline" onClick={handleNovaSincronizacao}>
                                Nova sincronização
                            </Button>
                        </div>
                        {syncData.result_erros > 0 && errosDetalhe.length > 0 && (
                            <div className="grid gap-3">
                                <div>
                                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                                        Exportar erros (PDF)
                                    </Button>
                                </div>
                                <DataTable rotulo="erros da sincronização" colunas={colunasErros} linhas={errosDetalhe} chaveDaLinha={(item) => item.id} vazio="Sem erros." />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {fase === 'error' && (
                <Card>
                    <CardHeader><CardTitle>Erro na Sincronização</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                        <Banner tom="perigo">{erro || 'Erro desconhecido.'}</Banner>
                        <div>
                            <Button variant="outline" onClick={handleNovaSincronizacao}>
                                Tentar novamente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {historico.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Histórico de Sincronizações</CardTitle></CardHeader>
                    <CardContent>
                        <DataTable rotulo="histórico de sincronizações" colunas={colunasHistorico} linhas={historico} chaveDaLinha={(s) => s.job_id ?? s.created_at} vazio="Sem histórico." />
                        <NavegacaoDePaginas meta={histMeta} aoIr={(page) => carregarHistorico(page)} />
                    </CardContent>
                </Card>
            )}

            <Dialogo aberto={detalhesHistorico.open} aoFechar={fecharDetalhesHistorico} tamanho="xl">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div>
                        <DialogoTitulo>Atualizacoes registradas</DialogoTitulo>
                        <p className="text-xs text-muted-foreground">Job {detalhesHistorico.row?.job_id ?? '-'}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!detalhesHistorico.row?.job_id || pdfJobId === detalhesHistorico.row?.job_id}
                        onClick={() => baixarPdfHistorico(detalhesHistorico.row)}
                    >
                        {pdfJobId === detalhesHistorico.row?.job_id ? <Loader className="animate-spin" /> : <Download />}
                        Baixar PDF
                    </Button>
                </div>
                {detalhesHistorico.loading ? (
                    <Carregando className="justify-center">Carregando...</Carregando>
                ) : (
                    <div>
                        <DataTable rotulo="atualizações registradas" colunas={colunasDetalhes} linhas={detalhesHistorico.itens} chaveDaLinha={(item) => item.id} vazio="Nenhuma atualizacao registrada." />
                        <NavegacaoDePaginas meta={detalhesHistorico.meta} aoIr={(page) => carregarDetalhesHistorico(detalhesHistorico.row, page)} />
                    </div>
                )}
                <DialogoRodape>
                    <Button variant="outline" onClick={fecharDetalhesHistorico}>
                        Fechar
                    </Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
}
