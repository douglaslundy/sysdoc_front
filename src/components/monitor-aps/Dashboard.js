import { useEffect, useMemo, useRef, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Card, CardContent, Chip, CircularProgress, Grid, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };
const FONT = { fontFamily: "'DM Sans', sans-serif" };

function MetricCard({ icon, titulo, valor, sub, cor }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ px: 2.5, py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>{titulo}</Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5} sx={{ color: cor }}>{valor ?? '—'}</Typography>
                        {sub && <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{sub}</Typography>}
                    </Box>
                    <Box sx={{ minWidth: 52, width: 52, height: 52, borderRadius: '50%', bgcolor: cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FeatherIcon icon={icon} color={cor} width="24" height="24" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function ClassChip({ c }) {
    return (
        <Chip label={LABEL[c] ?? '—'} size="small"
            sx={{ bgcolor: (COR[c] || '#888') + '22', color: COR[c] || '#888', fontWeight: 700, fontSize: 11 }} />
    );
}

export default function MonitorApsDashboard() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]     = useState(anoAtual);
    const [quad, setQuad]   = useState(quadAtual);
    const [data, setData]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro]   = useState(null);

    useEffect(() => {
        const key = `resumo_${ano}_${quad}`;
        const cached = getCached(key);
        if (cached) { setData(cached); setLoading(false); return; }
        setLoading(true); setErro(null);
        monitorApsApi.get(`/indicadores/resumo?ano=${ano}&quadrimestre=${quad}`)
            .then(d => { setCached(key, d); setData(d); })
            .catch(e => setErro(e.message))
            .finally(() => setLoading(false));
    }, [ano, quad]);

    const chart = useMemo(() => {
        if (!data) return null;
        const todos = [...(data.qualidade?.esf ?? []), ...(data.qualidade?.esb ?? [])];
        const cont = { otimo: 0, bom: 0, suficiente: 0, regular: 0 };
        todos.forEach(i => { const c = i.indicador?.resultado?.classificacao; if (c) cont[c]++; });
        return { cont, todos };
    }, [data]);

    const totalRepasse = data?.repasse?.reduce((s, e) => s + (e.total_estimado ?? 0), 0) ?? 0;
    const alertas = data?.vinculos?.filter(v => v.classificacao === 'regular') ?? [];

    const selSx = { border: '1px solid var(--lg-border-input)', borderRadius: 1, px: 1, py: 0.5, fontSize: 13, background: 'var(--lg-glass-input)', color: 'var(--lg-text-primary)' };

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;
    if (erro) return <Box p={3}><Typography color="error">Erro: {erro}</Typography></Box>;

    const indicadores = chart?.todos ?? [];
    const equipes = data?.vinculos ?? [];
    const indIds = [...new Set(indicadores.map(i => i.indicador?.id))].sort((a, b) => a - b);

    const indPorId = {};
    indicadores.forEach(i => {
        const id = i.indicador?.id;
        const ine = i.indicador?.equipe?.ine;
        if (!indPorId[id]) indPorId[id] = {};
        indPorId[id][ine] = i.indicador?.resultado;
    });

    return (
        <Box>
            {/* Filtros */}
            <Box mb={3} mt="20px">
                <Typography variant="h5" fontWeight={700} mb={1.5}>Monitor APS — Cofinanciamento Federal</Typography>
                <Box display="flex" gap={1} alignItems="center">
                    <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selSx}>
                        {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select value={quad} onChange={e => setQuad(Number(e.target.value))} style={selSx}>
                        {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quadrimestre</option>)}
                    </select>
                </Box>
            </Box>

            {/* Métricas */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard icon="dollar-sign" titulo="Repasse Estimado" valor={`R$ ${totalRepasse.toLocaleString('pt-BR')}`} sub="/mês estimado" cor="#168821" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard icon="users" titulo="Equipes Monitoradas" valor={data?.total_equipes ?? 0} sub="eSF/eAP ativas" cor="#1351B4" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard icon="alert-triangle" titulo="Alertas de Risco" valor={alertas.length} sub="equipes em regular" cor={alertas.length > 0 ? '#E52207' : '#168821'} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard icon="activity" titulo="Indicadores Avaliados" valor={indIds.length} sub="no quadrimestre" cor="#FF8C00" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Heatmap de indicadores */}
                <Grid item xs={12} md={8}>
                    <BaseCard title="Indicadores por Equipe">
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'var(--lg-text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--lg-border)' } }}>
                                        <TableCell>IND</TableCell>
                                        {equipes.map(v => <TableCell key={v.ine} align="center">{v.nome?.split(' ').slice(-1)[0]}</TableCell>)}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {indIds.map(id => (
                                        <TableRow key={id} hover>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{id}</TableCell>
                                            {equipes.map(v => {
                                                const r = indPorId[id]?.[v.ine];
                                                const cor = COR[r?.classificacao] ?? '#ccc';
                                                return (
                                                    <TableCell key={v.ine} align="center" sx={{ bgcolor: cor + '18' }}>
                                                        {r ? <Chip label={`${r.percentual}%`} size="small" sx={{ bgcolor: cor + '28', color: cor, fontWeight: 700, fontSize: 11 }} /> : <Typography variant="caption" color="textSecondary">—</Typography>}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </BaseCard>
                </Grid>

                {/* Donut + Repasse */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Distribuição de Classificações">
                        {chart && Object.values(chart.cont).some(v => v > 0) ? (
                            <Chart type="donut" height={220}
                                options={{
                                    chart: { ...FONT },
                                    labels: ['Ótimo', 'Bom', 'Suficiente', 'Regular'],
                                    colors: [COR.otimo, COR.bom, COR.suficiente, COR.regular],
                                    legend: { position: 'bottom', fontSize: '12px', labels: { colors: 'var(--lg-text-secondary)' } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    plotOptions: { pie: { donut: { size: '60%' } } },
                                }}
                                series={[chart.cont.otimo, chart.cont.bom, chart.cont.suficiente, chart.cont.regular]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" py={4}>Sem dados</Typography>}
                    </BaseCard>

                    <Box mt={2}>
                        <BaseCard title="Repasse por Equipe">
                            {(data?.repasse ?? []).map(r => (
                                <Box key={r.ine} display="flex" justifyContent="space-between" alignItems="center"
                                    py={0.8} sx={{ borderBottom: '1px solid var(--lg-border)', '&:last-child': { borderBottom: 'none' } }}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{r.nome}</Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#168821' }}>
                                        R$ {(r.total_estimado ?? 0).toLocaleString('pt-BR')}
                                    </Typography>
                                </Box>
                            ))}
                        </BaseCard>
                    </Box>

                    {alertas.length > 0 && (
                        <Box mt={2}>
                            <BaseCard title="Alertas">
                                {alertas.map((a, i) => (
                                    <Box key={i} display="flex" alignItems="center" gap={1} py={0.8}
                                        sx={{ borderBottom: '1px solid var(--lg-border)', '&:last-child': { borderBottom: 'none' } }}>
                                        <FeatherIcon icon="alert-circle" color="#E52207" width="16" height="16" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{a.nome}</Typography>
                                            <Typography variant="caption" color="error">Vínculo territorial em Regular</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </BaseCard>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
