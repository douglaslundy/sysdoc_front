import { useEffect, useMemo, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Card, CardContent, Chip, CircularProgress, FormControl, Grid,
    InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead,
    TableRow, Typography,
} from '@mui/material';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };
const FONT = { fontFamily: "'DM Sans', sans-serif", toolbar: { show: false } };

function ClassCard({ titulo, classificacao, repasse }) {
    const cor = COR[classificacao] ?? '#888';
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-muted)', mb: 1 }}>{titulo}</Typography>
                <Chip label={LABEL[classificacao] ?? '—'} sx={{ bgcolor: cor + '22', color: cor, fontWeight: 700, mb: 1 }} />
                {repasse !== undefined && (
                    <Typography variant="caption" display="block" sx={{ color: 'var(--lg-text-secondary)' }}>
                        + R$ {(repasse ?? 0).toLocaleString('pt-BR')}/mês
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default function PorEquipe() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]       = useState(anoAtual);
    const [quad, setQuad]     = useState(quadAtual);
    const [equipes, setEquipes] = useState([]);
    const [ine, setIne]       = useState('');
    const [vinculo, setVinculo]   = useState(null);
    const [indicadores, setIndicadores] = useState([]);
    const [repasse, setRepasse]   = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);

    useMonitorApsAudit('/monitor-aps/equipe', 'Monitor APS - Por Equipe', { ano, quadrimestre: quad, equipe: ine });

    useEffect(() => {
        monitorApsApi.get('/config/equipes').then(d => {
            const eq = d.equipes ?? [];
            setEquipes(eq);
            if (eq.length > 0) setIne(eq[0].nu_ine);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!ine) return;
        const key = `porequipe_${ine}_${ano}_${quad}`;
        const cached = getCached(key);
        if (cached) {
            setVinculo(cached.vinculo);
            setIndicadores(cached.indicadores);
            setRepasse(cached.repasse);
            setHistorico(cached.historico);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([
            monitorApsApi.get(`/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}&ine=${ine}`),
            monitorApsApi.get(`/indicadores/qualidade?ano=${ano}&quadrimestre=${quad}&ine=${ine}`),
            monitorApsApi.get(`/indicadores/repasse?ano=${ano}&quadrimestre=${quad}`),
            monitorApsApi.get(`/indicadores/historico?ine=${ine}&indicador_id=8&anos=${ano}`),
        ]).then(([v, q, r, h]) => {
            const vinculo     = v.equipes?.[0] ?? null;
            const indicadores = q.indicadores ?? [];
            const repasse     = r.repasse?.find(x => x.ine === ine) ?? null;
            const historico   = h.historico ?? [];
            setCached(key, { vinculo, indicadores, repasse, historico });
            setVinculo(vinculo);
            setIndicadores(indicadores);
            setRepasse(repasse);
            setHistorico(historico);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [ine, ano, quad]);

    const radar = useMemo(() => {
        if (!indicadores.length) return null;
        return {
            categories: indicadores.map(i => `IND ${i.indicador?.id}`),
            resultados: indicadores.map(i => i.indicador?.resultado?.percentual ?? 0),
            metas:      indicadores.map(i => i.indicador?.resultado?.meta_bom ?? 60),
        };
    }, [indicadores]);

    const linha = useMemo(() => ({
        labels: historico.map(h => `${h.quadrimestre}°Q`),
        valores: historico.map(h => h.percentual ?? 0),
    }), [historico]);

    const classQ = useMemo(() => {
        if (!indicadores.length) return 'regular';
        const ordem = ['regular', 'suficiente', 'bom', 'otimo'];
        const media = Math.round(indicadores.reduce((s, i) => s + ordem.indexOf(i.indicador?.resultado?.classificacao ?? 'regular'), 0) / indicadores.length);
        return ordem[media] ?? 'regular';
    }, [indicadores]);

    return (
        <Box>
            {/* Seletores */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Desempenho por Equipe</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine} onChange={e => setIne(e.target.value)}>
                            {equipes.map(eq => <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe?.split(' - ').slice(1).join(' - ').trim() || eq.no_equipe}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Ano</InputLabel>
                        <Select label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))}>
                            {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Quadrimestre</InputLabel>
                        <Select label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))}>
                            {[1, 2, 3].map(q => <MenuItem key={q} value={q}>{q}° Quad.</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
            ) : (
                <>
                    {/* Cards de classificação */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={12} sm={4}>
                            <ClassCard titulo="Vínculo Territorial" classificacao={vinculo?.classificacao} repasse={repasse?.componente_vinculo} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <ClassCard titulo="Qualidade dos Indicadores" classificacao={classQ} repasse={repasse?.componente_qualidade} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-muted)', mb: 1 }}>Repasse Estimado</Typography>
                                    <Typography variant="h3" fontWeight={700} sx={{ color: '#168821' }}>
                                        R$ {(repasse?.total_estimado ?? 0).toLocaleString('pt-BR')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>/mês</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Radar */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={1}>Radar dos Indicadores</Typography>
                                    {radar ? (
                                        <Chart type="radar" height={300}
                                            options={{
                                                chart: { ...FONT },
                                                xaxis: { categories: radar.categories },
                                                yaxis: { show: false, min: 0, max: 100 },
                                                plotOptions: { radar: { size: 120, polygons: { strokeColors: 'var(--lg-border)', fill: { colors: ['transparent'] } } } },
                                                stroke: { width: 2 },
                                                fill: { opacity: 0.15 },
                                                markers: { size: 3 },
                                                legend: { position: 'bottom', labels: { colors: 'var(--lg-text-secondary)' } },
                                                colors: ['#1351B4', '#168821'],
                                                tooltip: { theme: 'dark' },
                                            }}
                                            series={[
                                                { name: 'Resultado', data: radar.resultados },
                                                { name: 'Meta Bom', data: radar.metas },
                                            ]}
                                        />
                                    ) : <Typography color="textSecondary" textAlign="center" py={4}>Sem dados</Typography>}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Histórico */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={1}>Histórico — IND 8 (Visita ACS)</Typography>
                                    {linha.valores.length > 0 ? (
                                        <Chart type="line" height={300}
                                            options={{
                                                chart: { ...FONT },
                                                stroke: { curve: 'smooth', width: 2 },
                                                xaxis: { categories: linha.labels, labels: { style: { colors: 'var(--lg-text-muted)' } } },
                                                yaxis: { min: 0, max: 100, labels: { formatter: v => `${v}%`, style: { colors: 'var(--lg-text-muted)' } } },
                                                markers: { size: 4 },
                                                colors: ['#1351B4'],
                                                tooltip: { theme: 'dark', y: { formatter: v => `${v}%` } },
                                                grid: { borderColor: 'var(--lg-border)' },
                                            }}
                                            series={[{ name: 'IND 8', data: linha.valores }]}
                                        />
                                    ) : <Typography color="textSecondary" textAlign="center" py={4}>Histórico sem dados disponíveis</Typography>}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Tabela de todos os indicadores */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={2}>Todos os Indicadores</Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'var(--lg-text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--lg-border)' } }}>
                                                <TableCell>IND</TableCell>
                                                <TableCell>Nome</TableCell>
                                                <TableCell align="right">Num.</TableCell>
                                                <TableCell align="right">Den.</TableCell>
                                                <TableCell align="right">%</TableCell>
                                                <TableCell align="center">Classificação</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {indicadores.map(i => {
                                                const r = i.indicador?.resultado ?? {};
                                                const cor = COR[r.classificacao] ?? '#888';
                                                return (
                                                    <TableRow key={i.indicador?.id} hover>
                                                        <TableCell sx={{ fontWeight: 700 }}>{i.indicador?.id}</TableCell>
                                                        <TableCell>{i.indicador?.nome}</TableCell>
                                                        <TableCell align="right">{r.numerador}</TableCell>
                                                        <TableCell align="right">{r.denominador}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700, color: cor }}>{r.percentual}%</TableCell>
                                                        <TableCell align="center">
                                                            <Chip label={LABEL[r.classificacao] ?? '—'} size="small"
                                                                sx={{ bgcolor: cor + '22', color: cor, fontWeight: 700 }} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}
