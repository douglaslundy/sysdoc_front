import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CheckCircle2, Clock, Loader, Printer, UserX } from 'lucide-react';
import { painelEsusApi } from '../../services/painelEsusApi';
import generateFilaEsusPDF from '../../reports/filaEsus';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { Card, CardContent } from '../ui/card';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';

function ContadorCard({ Icone, titulo, valor, cor }) {
    return (
        <Card size="sm">
            <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
                    <p className={`mt-1 font-mono text-3xl font-bold ${cor}`}>{valor ?? '—'}</p>
                </div>
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-hover ${cor}`}>
                    <Icone className="size-5" aria-hidden />
                </span>
            </CardContent>
        </Card>
    );
}
const hojeIso = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const MAX_DIAS_INTERVALO = 30;

const addDiasIso = (iso, dias) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + dias);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const diffDias = (inicio, fim) =>
    Math.round((new Date(`${fim}T12:00:00`) - new Date(`${inicio}T12:00:00`)) / 86400000);

const normalizaTexto = (s) => (s ?? '').toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

const somenteDigitos = (s) => (s ?? '').toString().replace(/\D/g, '');

export default function FilaEsus() {
    const [cnes,            setCnes]            = useState(null);
    const [unidades,        setUnidades]        = useState([]);
    const [loadingUnidades, setLoadingUnidades] = useState(true);
    const [erroUnidades,    setErroUnidades]    = useState('');
    const [equipes,         setEquipes]         = useState([]);
    const [restrito,        setRestrito]        = useState(false);
    const [profissionais,   setProfissionais]   = useState([]);
    const [equipeId,        setEquipeId]        = useState('');
    const [profId,          setProfId]          = useState('');
    const [dataInicio,      setDataInicio]      = useState(hojeIso());
    const [dataFim,         setDataFim]         = useState(hojeIso());
    const [busca,           setBusca]           = useState('');
    const [situacao,        setSituacao]        = useState('aguardando');
    const [dados,           setDados]           = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [erro,            setErro]            = useState(null);
    const [printLoading,    setPrintLoading]    = useState(false);
    const abortRef = useRef(null);

    // Carrega unidades no mount — auto-seleciona se houver apenas 1
    useEffect(() => {
        const ac = new AbortController();
        setLoadingUnidades(true);
        painelEsusApi.unidades({ signal: ac.signal })
            .then(d => {
                const lista = d.unidades ?? [];
                setUnidades(lista);
                if (lista.length === 1) setCnes(lista[0].cnes);
            })
            .catch(e => {
                if (e?.code === 'ERR_CANCELED') return;
                setErroUnidades('Não foi possível carregar as unidades de saúde.');
            })
            .finally(() => setLoadingUnidades(false));
        return () => ac.abort();
    }, []);

    // Carrega filtros quando CNES ou data muda
    useEffect(() => {
        if (!cnes) return;
        const ac = new AbortController();
        const params = { cnes, data_inicio: dataInicio, data_fim: dataFim };
        if (equipeId) params.equipe = equipeId;
        painelEsusApi.filtros(params, { signal: ac.signal })
            .then(d => {
                const eqs = d.equipes ?? [];
                setEquipes(eqs);
                setProfissionais(d.profissionais ?? []);
                setRestrito(Boolean(d.restrito));
                // RT restrito a uma única equipe: pré-seleciona (select fica desabilitado)
                if (d.restrito && eqs.length === 1) setEquipeId(eqs[0].id);
            })
            .catch(e => {
                if (e?.code === 'ERR_CANCELED' || e?.message === 'canceled') return;
                setErro('Erro no servidor ao carregar os filtros de equipe e profissional.');
            });
        return () => ac.abort();
    }, [cnes, dataInicio, dataFim, equipeId]);

    // Intervalo máximo de 30 dias: ajusta a outra data quando o limite é excedido
    const handleDataInicio = (valor) => {
        const v = valor || hojeIso();
        setDataInicio(v);
        if (dataFim < v) setDataFim(v);
        else if (diffDias(v, dataFim) > MAX_DIAS_INTERVALO) setDataFim(addDiasIso(v, MAX_DIAS_INTERVALO));
        setEquipeId('');
        setProfId('');
    };

    const handleDataFim = (valor) => {
        const v = valor || hojeIso();
        setDataFim(v);
        if (v < dataInicio) setDataInicio(v);
        else if (diffDias(dataInicio, v) > MAX_DIAS_INTERVALO) setDataInicio(addDiasIso(v, -MAX_DIAS_INTERVALO));
        setEquipeId('');
        setProfId('');
    };

    // Busca local por nome, CPF ou CNS sobre a lista carregada
    const listaFiltrada = useMemo(() => {
        const rows = dados?.aguardando ?? [];
        const q = busca.trim();
        if (!q) return rows;
        const qTexto = normalizaTexto(q);
        const qDigitos = somenteDigitos(q);
        return rows.filter(r =>
            normalizaTexto(r.cidadao).includes(qTexto) ||
            (qDigitos && (
                somenteDigitos(r.cpf).includes(qDigitos) ||
                somenteDigitos(r.cns).includes(qDigitos)
            ))
        );
    }, [dados, busca]);

    const handlePrint = async () => {
        setPrintLoading(true);
        try {
            const equipeNome      = equipes.find(e => String(e.id) === String(equipeId))?.nome ?? '';
            const profissionalNome = profissionais.find(p => String(p.id) === String(profId))?.nome ?? '';
            await generateFilaEsusPDF({
                dados: { ...dados, aguardando: listaFiltrada },
                unidadeNome: unidades.find(u => u.cnes === cnes)?.nome ?? '',
                cnes,
                dataFiltro: dataInicio,
                dataFim,
                situacao,
                equipeNome,
                profissionalNome,
            });
        } finally {
            setPrintLoading(false);
        }
    };

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        setErro(null);
        const params = { cnes, data_inicio: dataInicio, data_fim: dataFim, situacao };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params, { signal: ac.signal })
            .then(d => setDados(d))
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Erro ao carregar a fila. Tente novamente.');
            })
            .finally(() => setLoading(false));
    }, [cnes, dataInicio, dataFim, equipeId, profId, situacao]);

    // Re-fetch quando qualquer filtro muda
    useEffect(() => {
        carregarFila();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [carregarFila]);

    if (loadingUnidades) {
        return <Carregando className="min-h-[300px] justify-center">Carregando unidades...</Carregando>;
    }

    if (erroUnidades) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-danger">{erroUnidades}</p>
            </div>
        );
    }

    const unidadeAtual = unidades.find(u => u.cnes === cnes);
    const colunas = [
        { chave: 'n', titulo: '#', render: (row, i) => <span className="text-xs text-muted-foreground">{i + 1}</span> },
        { chave: 'cidadao', titulo: 'Cidadão', render: (row) => <span className="font-semibold">{row.cidadao}</span> },
        { chave: 'data', titulo: 'Data', numerica: true, render: (row) => row.data_atendimento || '—' },
        {
            chave: 'chegada',
            titulo: 'Chegada',
            numerica: true,
            render: (row) => (
                <>
                    <span className="block">{row.hr_chegada || '—'}</span>
                    <span className="block text-xs text-muted-foreground">Saída: {row.hr_saida || '—'}</span>
                </>
            ),
        },
        { chave: 'espera', titulo: 'Tempo Espera', numerica: true, render: (row) => row.tempo_espera || '—' },
        { chave: 'equipe', titulo: 'Equipe', render: (row) => row.equipe || '—' },
        { chave: 'profissional', titulo: 'Profissional', render: (row) => row.profissional || '—' },
    ];

    return (
        <div>
            {/* Nome da unidade selecionada */}
            {unidadeAtual && (
                <p className="mb-4 text-sm font-semibold text-muted-foreground">
                    <span>{unidadeAtual.nome}</span>
                    {' — CNES '}
                    {cnes}
                </p>
            )}

            {/* Estado: aguardando seleção */}
            {!cnes && unidades.length <= 1 && (
                <div className="flex min-h-[200px] items-center justify-center">
                    <p className="text-muted-foreground">Selecione uma unidade de saúde para visualizar a fila.</p>
                </div>
            )}

            {/* Conteúdo principal */}
            {(cnes || unidades.length > 1) && (
                <>
                    {/* Filtros */}
                    <Card className="mb-6">
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {unidades.length > 1 && (
                                <CampoSelecao
                                    id="fila-unidade"
                                    label="Unidade de Saúde"
                                    value={cnes ?? ''}
                                    onChange={e => {
                                        setCnes(e.target.value || null);
                                        setEquipeId('');
                                        setProfId('');
                                        setDados(null);
                                    }}
                                >
                                    <option value="">Selecione uma unidade</option>
                                    {unidades.map(u => (
                                        <option key={u.cnes} value={u.cnes}>{u.nome}</option>
                                    ))}
                                </CampoSelecao>
                            )}
                            {cnes && (
                                <CampoTexto id="fila-inicio" label="Data inicial" type="date" value={dataInicio} onChange={e => handleDataInicio(e.target.value)} />
                            )}
                            {cnes && (
                                <CampoTexto id="fila-fim" label="Data final" type="date" value={dataFim} onChange={e => handleDataFim(e.target.value)} />
                            )}
                            {cnes && (
                                <CampoSelecao id="fila-situacao" label="Situação" value={situacao} onChange={e => setSituacao(e.target.value)}>
                                    <option value="aguardando">Em espera</option>
                                    <option value="atendidos">Atendidos</option>
                                    <option value="nao_aguardaram">Não aguardaram</option>
                                </CampoSelecao>
                            )}
                            {cnes && (
                                <CampoSelecao
                                    id="fila-equipe"
                                    label="Equipe"
                                    value={equipeId}
                                    disabled={restrito && equipes.length === 1}
                                    onChange={e => { setEquipeId(e.target.value); setProfId(''); }}
                                >
                                    {!(restrito && equipes.length === 1) && (
                                        <option value="">{restrito ? 'Todas as minhas equipes' : 'Todas'}</option>
                                    )}
                                    {equipes.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.nome}</option>
                                    ))}
                                </CampoSelecao>
                            )}
                            {cnes && (
                                <CampoSelecao id="fila-profissional" label="Profissional" value={profId} onChange={e => setProfId(e.target.value)}>
                                    <option value="">Todos</option>
                                    {profissionais.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </CampoSelecao>
                            )}
                        </CardContent>
                    </Card>

                    {cnes && (
                        <>
                            {/* Contadores */}
                            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <ContadorCard Icone={Clock} titulo="Em Espera" valor={dados?.contadores?.aguardando} cor="text-info" />
                                <ContadorCard Icone={CheckCircle2} titulo="Atendidos" valor={dados?.contadores?.atendidos} cor="text-success" />
                                <ContadorCard Icone={UserX} titulo="Não Aguardaram" valor={dados?.contadores?.nao_aguardaram} cor="text-danger" />
                                <ContadorCard Icone={Activity} titulo="Tempo Médio" valor={dados?.contadores?.tempo_medio_espera} cor="text-primary-text" />
                            </div>

                            {/* Lista de atendimentos */}
                            <Card>
                                <CardContent className="grid gap-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h2 className="font-display text-lg font-bold">
                                            {situacao === 'atendidos' ? 'Cidadãos Atendidos' : situacao === 'nao_aguardaram' ? 'Não Aguardaram' : 'Aguardando Atendimento'}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <CampoDeBusca
                                                className="min-w-[260px]"
                                                rotulo="Buscar por nome, CPF ou CNS"
                                                placeholder="Buscar por nome, CPF ou CNS"
                                                value={busca}
                                                onChange={e => setBusca(e.target.value)}
                                            />
                                            <Button variant="outline" size="sm" disabled={printLoading || loading || !dados} onClick={handlePrint}>
                                                {printLoading ? <Loader className="animate-spin" /> : <Printer />}
                                                {printLoading ? 'Gerando...' : 'Imprimir PDF'}
                                            </Button>
                                        </div>
                                    </div>

                                    {erro && !loading && <Banner tom="perigo">Erro: {erro}</Banner>}

                                    {!erro && (
                                        <DataTable
                                            rotulo="fila de atendimento e-SUS"
                                            colunas={colunas}
                                            linhas={listaFiltrada}
                                            chaveDaLinha={(row) => row.id}
                                            carregando={loading}
                                            vazio="Nenhum registro encontrado"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
