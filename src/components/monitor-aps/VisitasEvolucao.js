import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Button, CircularProgress, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';
import VetorPanel from './VetorPanel';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import FeatherIcon from 'feather-icons-react';
import generateVisitasEvolucaoPDF from '../../reports/visitasEvolucao';

const MESES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES  = ['#1351B4', '#168821', '#FF8C00'];
const FONT   = { fontFamily: "'DM Sans', sans-serif" };

const DESFECHO_LABELS = { '1': 'Realizada', '2': 'Recusada', '3': 'Ausente' };
const GEO_LABELS      = { 'sim': 'Com geo', 'nao': 'Sem geo' };
const VETOR_VAZIO     = { ine: '', agente: '', desfecho: '', geo: '' };

function labelVetor(vetor, nomeEquipe, fallback) {
    const partes = [];
    if (vetor.ine)      partes.push(nomeEquipe || 'Equipe');
    if (vetor.agente)   partes.push(vetor.agente);
    if (vetor.desfecho) partes.push(DESFECHO_LABELS[vetor.desfecho]);
    if (vetor.geo)      partes.push(GEO_LABELS[vetor.geo]);
    return partes.length ? partes.join(' · ') : fallback;
}

function vetorConfigurado(v) {
    return !!(v.ine || v.agente || v.desfecho || v.geo);
}

export function buildChartSeries(series, cores) {
    return series.map((s, i) => ({
        name:  String(s.ano),
        data:  s.meses,
        color: cores[i] ?? '#888',
    }));
}

export default function VisitasEvolucao() {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [equipes,      setEquipes]      = useState([]);
    const [agenteOpcoes, setAgenteOpcoes] = useState([]);
    const [ine,          setIne]          = useState('');
    const [agente,       setAgente]       = useState('');
    const [desfecho,     setDesfecho]     = useState('');
    const [geo,          setGeo]          = useState('');
    const [series,       setSeries]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [erro,         setErro]         = useState(null);
    const ctrlRef = useRef(null);

    // ── modo comparação ──────────────────────────────────────────────
    const [modoComparacao,  setModoComparacao]  = useState(false);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [anoComparacao,   setAnoComparacao]   = useState('');
    const [vetor1,          setVetor1]          = useState(VETOR_VAZIO);
    const [nomeEquipe1,     setNomeEquipe1]     = useState('');
    const [vetor2,          setVetor2]          = useState(VETOR_VAZIO);
    const [nomeEquipe2,     setNomeEquipe2]     = useState('');
    const [seriesComp,      setSeriesComp]      = useState([]);
    const [loadingComp,     setLoadingComp]     = useState(false);
    const [erroComp,        setErroComp]        = useState(null);

    useMonitorApsAudit('/monitor-aps/visitas/evolucao', 'Monitor APS - Evolução de Visitas', {
        equipe: ine, agente, desfecho, geo,
    });

    useEffect(() => {
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!ine) { setAgenteOpcoes([]); return; }
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgenteOpcoes(d.agentes ?? []))
            .catch(() => setAgenteOpcoes([]));
    }, [ine, anoAtual, mesAtual]);

    useEffect(() => { setAgente(''); }, [ine]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (ine)      params.set('ine',      ine);
        if (agente)   params.set('agente',   agente);
        if (desfecho) params.set('desfecho', desfecho);
        if (geo)      params.set('has_geo',  geo);

        const key = `visitas_evolucao_${ine}_${agente}_${desfecho}_${geo}`;
        const cached = getCached(key);
        if (cached) { setSeries(cached.series ?? []); setLoading(false); return; }

        if (ctrlRef.current) ctrlRef.current.abort();
        ctrlRef.current = new AbortController();

        setLoading(true);
        setErro(null);
        monitorApsApi.get(`/visitas/evolucao?${params}`, { signal: ctrlRef.current.signal })
            .then(d => { setCached(key, d); setSeries(d.series ?? []); })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setErro(e.message); })
            .finally(() => setLoading(false));
    }, [ine, agente, desfecho, geo]);

    function ativarComparacao() {
        setModoComparacao(true);
        setAnoComparacao('');
        setVetor1(VETOR_VAZIO); setNomeEquipe1('');
        setVetor2(VETOR_VAZIO); setNomeEquipe2('');
        setSeriesComp([]); setErroComp(null);

        monitorApsApi.get('/visitas/evolucao/anos')
            .then(d => setAnosDisponiveis(d.anos ?? []))
            .catch(() => setAnosDisponiveis([]));
    }

    function desativarComparacao() {
        setModoComparacao(false);
        setSeriesComp([]);
        setErroComp(null);
    }

    async function handleComparar() {
        setLoadingComp(true);
        setErroComp(null);
        setSeriesComp([]);

        const buildParams = (v) => {
            const p = new URLSearchParams({ ano: anoComparacao });
            if (v.ine)      p.set('ine',      v.ine);
            if (v.agente)   p.set('agente',   v.agente);
            if (v.desfecho) p.set('desfecho', v.desfecho);
            if (v.geo)      p.set('has_geo',  v.geo);
            return p.toString();
        };

        const fetchVetor = async (v, cacheKey) => {
            const cached = getCached(cacheKey);
            if (cached) return cached;
            const data = await monitorApsApi.get(`/visitas/evolucao?${buildParams(v)}`);
            setCached(cacheKey, data);
            return data;
        };

        const keyV1 = `visitas_evolucao_cmp_${anoComparacao}_${vetor1.ine}_${vetor1.agente}_${vetor1.desfecho}_${vetor1.geo}`;
        const keyV2 = `visitas_evolucao_cmp_${anoComparacao}_${vetor2.ine}_${vetor2.agente}_${vetor2.desfecho}_${vetor2.geo}`;

        try {
            const [res1, res2] = await Promise.all([
                fetchVetor(vetor1, keyV1),
                fetchVetor(vetor2, keyV2),
            ]);

            setSeriesComp([
                {
                    name:  labelVetor(vetor1, nomeEquipe1, 'Vetor 1'),
                    data:  res1.series?.[0]?.meses ?? Array(12).fill(0),
                    color: CORES[0],
                },
                {
                    name:  labelVetor(vetor2, nomeEquipe2, 'Vetor 2'),
                    data:  res2.series?.[0]?.meses ?? Array(12).fill(0),
                    color: CORES[1],
                },
            ]);
        } catch (e) {
            setErroComp(e.message ?? 'Erro ao comparar vetores.');
        } finally {
            setLoadingComp(false);
        }
    }

    const chartSeries = useMemo(() => buildChartSeries(series, CORES), [series]);

    const labelColor = isDarkMode ? '#ffffff' : '#b0bec5';
    const legendColor = isDarkMode ? '#ffffff' : '#546e7a';

    const chartOptions = useMemo(() => ({
        chart:       { ...FONT, id: 'visitas-evolucao-chart', toolbar: { show: false }, zoom: { enabled: false } },
        xaxis:       { categories: MESES, labels: { style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        yaxis:       { labels: { formatter: v => v.toLocaleString('pt-BR'), style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        stroke:      { width: 2, curve: 'smooth' },
        markers:     { size: 4 },
        dataLabels:  {
            enabled:    true,
            formatter:  v => v != null ? v.toLocaleString('pt-BR') : '',
            offsetY:    -8,
            style:      { fontFamily: FONT.fontFamily, fontSize: '11px', fontWeight: '600' },
            background: { enabled: false },
        },
        legend:      { position: 'bottom', fontFamily: FONT.fontFamily, labels: { colors: legendColor } },
        tooltip:     { theme: 'dark', y: { formatter: v => v.toLocaleString('pt-BR') } },
        grid:        { borderColor: 'var(--lg-border)' },
        colors:      series.map((_, i) => CORES[i] ?? '#888'),
    }), [series, labelColor, legendColor]);

    const [printLoading, setPrintLoading] = useState(false);

    const handlePrint = async () => {
        setPrintLoading(true);
        try {
            const equipeNome = equipes.find(e => e.nu_ine === ine)?.no_equipe ?? '';
            await generateVisitasEvolucaoPDF({
                series,
                filtros: { equipeNome, agente, desfecho, geo },
                anoAtual,
            });
        } finally {
            setPrintLoading(false);
        }
    };

    const selSx = { minWidth: 140 };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h5" fontWeight={700}>Evolução de Visitas ACS/TACS</Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={printLoading || loading || !series.length}
                        onClick={handlePrint}
                        startIcon={<FeatherIcon icon={printLoading ? 'loader' : 'printer'} width={15} height={15} />}
                        sx={{ textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap' }}
                    >
                        {printLoading ? 'Gerando...' : 'Imprimir PDF'}
                    </Button>
                    <Button
                        variant={modoComparacao ? 'contained' : 'outlined'}
                        size="small"
                        color="primary"
                        onClick={modoComparacao ? desativarComparacao : ativarComparacao}
                        startIcon={<FeatherIcon icon="git-compare" width={15} height={15} />}
                        sx={{ textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap' }}
                    >
                        {modoComparacao ? 'Sair da comparação' : 'Comparar'}
                    </Button>
                </Box>
                {!modoComparacao && (
                    <Box display="flex" gap={1.5} flexWrap="wrap">
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Equipe</InputLabel>
                            <Select label="Equipe" value={ine}
                                onChange={e => setIne(e.target.value)}>
                                <MenuItem value="">Todas as equipes</MenuItem>
                                {equipes.map(eq => (
                                    <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe?.split(' - ').slice(1).join(' - ').trim() || eq.no_equipe}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {ine && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Agente</InputLabel>
                                <Select label="Agente" value={agente}
                                    onChange={e => setAgente(e.target.value)}>
                                    <MenuItem value="">Todos os agentes</MenuItem>
                                    {agenteOpcoes.map((a, i) => (
                                        <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl size="small" sx={selSx}>
                            <InputLabel>Desfecho</InputLabel>
                            <Select label="Desfecho" value={desfecho}
                                onChange={e => setDesfecho(e.target.value)}>
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="1">Realizada</MenuItem>
                                <MenuItem value="2">Recusada</MenuItem>
                                <MenuItem value="3">Ausente</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <InputLabel>Geolocalização</InputLabel>
                            <Select label="Geolocalização" value={geo}
                                onChange={e => setGeo(e.target.value)}>
                                <MenuItem value="">Todas</MenuItem>
                                <MenuItem value="sim">Com geolocalização</MenuItem>
                                <MenuItem value="nao">Sem geolocalização</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </Box>

            {modoComparacao && (
                <Box mt={2}>
                    {/* Seletor de Ano */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Ano</InputLabel>
                            <Select label="Ano" value={anoComparacao}
                                onChange={e => setAnoComparacao(e.target.value)}>
                                <MenuItem value="">Selecione o ano</MenuItem>
                                {anosDisponiveis.map(a => (
                                    <MenuItem key={a} value={String(a)}>{a}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {anosDisponiveis.length === 0 && (
                            <Typography variant="caption" color="textSecondary">
                                Carregando anos disponíveis...
                            </Typography>
                        )}
                    </Box>

                    {/* Dois vetores lado a lado */}
                    <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                        <VetorPanel
                            label="Vetor 1"
                            equipes={equipes}
                            vetor={vetor1}
                            onChange={(v, ne) => { setVetor1(v); setNomeEquipe1(ne); }}
                        />
                        <VetorPanel
                            label="Vetor 2"
                            equipes={equipes}
                            vetor={vetor2}
                            onChange={(v, ne) => { setVetor2(v); setNomeEquipe2(ne); }}
                        />
                    </Box>

                    {/* Botão Comparar */}
                    <Box display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            size="medium"
                            disabled={
                                !anoComparacao ||
                                !vetorConfigurado(vetor1) ||
                                !vetorConfigurado(vetor2) ||
                                loadingComp
                            }
                            onClick={handleComparar}
                            startIcon={
                                loadingComp
                                    ? <CircularProgress size={14} color="inherit" />
                                    : <FeatherIcon icon="bar-chart-2" width={15} height={15} />
                            }
                            sx={{ textTransform: 'none', borderRadius: 1.5, px: 4 }}
                        >
                            {loadingComp ? 'Comparando...' : 'Comparar'}
                        </Button>
                    </Box>
                </Box>
            )}

            {modoComparacao ? (
                <BaseCard title={`Comparação de Vetores — ${anoComparacao || '...'}`}>
                    {loadingComp ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : erroComp ? (
                        <Box p={3}>
                            <Typography color="error">Erro: {erroComp}</Typography>
                        </Box>
                    ) : seriesComp.length === 0 ? (
                        <Box p={3} textAlign="center">
                            <Typography color="textSecondary">
                                Configure os dois vetores e clique em Comparar.
                            </Typography>
                        </Box>
                    ) : (
                        <Chart type="line" height={420}
                            options={{
                                ...chartOptions,
                                colors: [CORES[0], CORES[1]],
                                chart: { ...chartOptions.chart, id: 'visitas-comparacao-chart' },
                            }}
                            series={seriesComp}
                        />
                    )}
                </BaseCard>
            ) : (
                <BaseCard title={`Visitas por Mês — ${anoAtual - 2} a ${anoAtual}`}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : erro ? (
                        <Box p={3}>
                            <Typography color="error">Erro: {erro}</Typography>
                        </Box>
                    ) : chartSeries.length === 0 ? (
                        <Box p={3} textAlign="center">
                            <Typography color="textSecondary">Sem dados para exibir.</Typography>
                        </Box>
                    ) : (
                        <Chart type="line" height={420}
                            options={chartOptions}
                            series={chartSeries}
                        />
                    )}
                </BaseCard>
            )}
        </Box>
    );
}
