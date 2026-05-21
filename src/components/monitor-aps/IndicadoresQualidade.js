import { useEffect, useMemo, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Chip, CircularProgress, Dialog, DialogContent, DialogTitle,
    Grid, IconButton, MenuItem, Select, Table, TableBody, TableCell,
    TableHead, TableRow, Typography, Card, CardContent, LinearProgress,
    FormControl, InputLabel,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };

function ClassChip({ c, size = 'small' }) {
    return (
        <Chip label={LABEL[c] ?? '—'} size={size}
            sx={{ bgcolor: (COR[c] || '#888') + '22', color: COR[c] || '#888', fontWeight: 700 }} />
    );
}

function IndicadorCard({ indicador, onDetalhes }) {
    const { id, nome, bloco, resultado } = indicador;
    const { percentual = 0, classificacao, numerador, denominador, meta_suficiente, meta_bom, meta_otimo } = resultado ?? {};
    const cor = COR[classificacao] ?? '#888';

    const gaugeOptions = useMemo(() => ({
        chart: { type: 'radialBar', sparkline: { enabled: true }, fontFamily: "'DM Sans', sans-serif" },
        plotOptions: {
            radialBar: {
                startAngle: -90, endAngle: 90,
                hollow: { size: '55%' },
                dataLabels: {
                    name: { show: false },
                    value: { fontSize: '15px', fontWeight: 700, formatter: v => `${v}%`, color: cor, offsetY: -2 },
                },
                track: { background: '#e0e0e0', strokeWidth: '100%' },
            },
        },
        colors: [cor],
        stroke: { lineCap: 'round' },
    }), [cor]);

    return (
        <Card sx={{ height: '100%', cursor: 'pointer', transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }}
            onClick={() => onDetalhes(indicador)}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)', fontWeight: 600 }}>IND {id} · {bloco}</Typography>
                        <Typography variant="body2" fontWeight={700} mt={0.3}>{nome}</Typography>
                    </Box>
                    <ClassChip c={classificacao} />
                </Box>

                <Box display="flex" justifyContent="center">
                    <Chart type="radialBar" height={120} options={gaugeOptions} series={[percentual ?? 0]} />
                </Box>

                <Typography variant="caption" display="block" textAlign="center" sx={{ color: 'var(--lg-text-muted)', mb: 1 }}>
                    {numerador} / {denominador}
                </Typography>

                {/* Barra de progresso com marcadores */}
                <Box position="relative">
                    <LinearProgress variant="determinate" value={Math.min(percentual, 100)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: cor, borderRadius: 4 } }} />
                    {[meta_suficiente, meta_bom, meta_otimo].filter(Boolean).map((meta, i) => (
                        <Box key={i} sx={{ position: 'absolute', top: 0, left: `${meta}%`, width: 2, height: 8, bgcolor: '#555', opacity: 0.5 }} title={`${['Suf.', 'Bom', 'Ótimo'][i]}: ${meta}%`} />
                    ))}
                </Box>
                <Box display="flex" justifyContent="flex-end" mt={0.5}>
                    <Typography variant="caption" sx={{ color: '#1351B4', fontWeight: 600 }}>Ver detalhes →</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function IndicadoresQualidade() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]     = useState(anoAtual);
    const [quad, setQuad]   = useState(quadAtual);
    const [ine, setIne]     = useState('');
    const [bloco, setBloco] = useState('');
    const [equipes, setEquipes] = useState([]);
    const [data, setData]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [detalhe, setDetalhe] = useState(null);

    useEffect(() => {
        monitorApsApi.get('/config/equipes').then(d => setEquipes(d.equipes ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        const p = new URLSearchParams({ ano, quadrimestre: quad });
        if (ine)   p.set('ine', ine);
        if (bloco) p.set('bloco', bloco);
        const key = `qualidade_${p}`;
        const cached = getCached(key);
        if (cached) { setData(cached); setLoading(false); return; }
        setLoading(true);
        monitorApsApi.get(`/indicadores/qualidade?${p}`)
            .then(d => { const ind = d.indicadores ?? []; setCached(key, ind); setData(ind); })
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [ano, quad, ine, bloco]);

    // Deduplica por ID de indicador
    const lista = useMemo(() => {
        const seen = {};
        data.forEach(i => { const id = i.indicador?.id; if (!seen[id]) seen[id] = i; });
        return Object.values(seen).sort((a, b) => a.indicador.id - b.indicador.id);
    }, [data]);

    const selSx = { minWidth: 120 };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Indicadores de Qualidade</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Ano</InputLabel>
                        <Select label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))}>
                            {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Quadrimestre</InputLabel>
                        <Select label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))}>
                            {[1, 2, 3].map(q => <MenuItem key={q} value={q}>{q}° Quad.</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine} onChange={e => setIne(e.target.value)}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Bloco</InputLabel>
                        <Select label="Bloco" value={bloco} onChange={e => setBloco(e.target.value)}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="esf">eSF / eAP</MenuItem>
                            <MenuItem value="esb">eSB</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
            ) : (
                <>
                    <Grid container spacing={2}>
                        {lista.map(i => (
                            <Grid key={i.indicador.id} item xs={12} sm={6} md={4} lg={3}>
                                <IndicadorCard indicador={i.indicador} onDetalhes={setDetalhe} />
                            </Grid>
                        ))}
                        {lista.length === 0 && (
                            <Grid item xs={12}>
                                <Typography color="textSecondary" textAlign="center" py={6}>
                                    Nenhum indicador encontrado para os filtros selecionados.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </>
            )}

            {/* Modal de detalhes */}
            <Dialog open={!!detalhe} onClose={() => setDetalhe(null)} maxWidth="sm" fullWidth>
                {detalhe && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6">IND {detalhe.id} — {detalhe.nome}</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{detalhe.bloco}</Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                                <ClassChip c={detalhe.resultado?.classificacao} />
                                <IconButton size="small" onClick={() => setDetalhe(null)}>
                                    <FeatherIcon icon="x" width="18" height="18" />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body2" mb={2} sx={{ color: 'var(--lg-text-secondary)' }}>
                                {detalhe.resultado?.numerador} / {detalhe.resultado?.denominador} — {detalhe.resultado?.percentual}%
                            </Typography>
                            {detalhe.subindicadores?.length > 0 && (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'var(--lg-text-muted)', textTransform: 'uppercase' } }}>
                                            <TableCell>Subindicador</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {detalhe.subindicadores.map((s, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell>{s.nome}</TableCell>
                                                <TableCell align="right">{s.valor}</TableCell>
                                                <TableCell align="right">{s.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            <Typography variant="caption" display="block" mt={2} sx={{ color: 'var(--lg-text-muted)' }}>
                                Fonte: Fichas Técnicas MS — Portaria GM/MS nº 6.907/2025
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
