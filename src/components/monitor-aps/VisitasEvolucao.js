import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Button, CircularProgress, FormControl, InputLabel,
    MenuItem, Select, Typography,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import FeatherIcon from 'feather-icons-react';
import generateVisitasEvolucaoPDF from '../../reports/visitasEvolucao';

const MESES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES  = ['#1351B4', '#168821', '#FF8C00'];
const FONT   = { fontFamily: "'DM Sans', sans-serif" };

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

    const chartSeries = useMemo(() => buildChartSeries(series, CORES), [series]);

    const labelColor = isDarkMode ? '#ffffff' : '#b0bec5';
    const legendColor = isDarkMode ? '#ffffff' : '#546e7a';

    const chartOptions = useMemo(() => ({
        chart:   { ...FONT, id: 'visitas-evolucao-chart', toolbar: { show: false }, zoom: { enabled: false } },
        xaxis:   { categories: MESES, labels: { style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        yaxis:   { labels: { formatter: v => v.toLocaleString('pt-BR'), style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        stroke:  { width: 2, curve: 'smooth' },
        markers: { size: 4 },
        legend:  { position: 'bottom', fontFamily: FONT.fontFamily, labels: { colors: legendColor } },
        tooltip: { theme: 'dark', y: { formatter: v => v.toLocaleString('pt-BR') } },
        grid:    { borderColor: 'var(--lg-border)' },
        colors:  series.map((_, i) => CORES[i] ?? '#888'),
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
                </Box>
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
            </Box>

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
        </Box>
    );
}
