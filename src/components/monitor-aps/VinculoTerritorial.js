import { useEffect, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Button, Chip, CircularProgress, Grid, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Card, CardContent,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };

function MetricCard({ icon, titulo, valor, cor }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ px: 2.5, py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>{titulo}</Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor?.toLocaleString('pt-BR') ?? '—'}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 52, width: 52, height: 52, borderRadius: '50%', bgcolor: cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FeatherIcon icon={icon} color={cor} width="24" height="24" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function GrupoBar({ label, total, valor, cor }) {
    const pct = total > 0 ? Math.round(valor / total * 100) : 0;
    return (
        <Box mb={1.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: cor }}>{valor?.toLocaleString('pt-BR')} ({pct}%)</Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                sx={{ height: 8, borderRadius: 4, bgcolor: cor + '22', '& .MuiLinearProgress-bar': { bgcolor: cor, borderRadius: 4 } }} />
        </Box>
    );
}

function exportarCSV(data, filename) {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename + '.csv'; a.click();
    URL.revokeObjectURL(url);
}

export default function VinculoTerritorial() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]       = useState(anoAtual);
    const [quad, setQuad]     = useState(quadAtual);
    const [equipes, setEquipes] = useState([]);
    const [ine, setIne]       = useState('');
    const [data, setData]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro]     = useState(null);

    useMonitorApsAudit('/monitor-aps/vinculo', 'Monitor APS - Vínculo Territorial', { ano, quadrimestre: quad, equipe: ine });

    useEffect(() => {
        monitorApsApi.get('/config/equipes').then(d => setEquipes(d.equipes ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        const key = `vinculo_${ano}_${quad}_${ine || 'all'}`;
        const cached = getCached(key);
        if (cached) { setData(cached); setLoading(false); return; }
        setLoading(true); setErro(null);
        const params = `/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}`;
        monitorApsApi.get(params)
            .then(d => { const eq = d.equipes ?? []; setCached(key, eq); setData(eq); })
            .catch(e => setErro(e.message))
            .finally(() => setLoading(false));
    }, [ano, quad, ine]);

    const totais = data.reduce((acc, e) => ({
        individuais: acc.individuais + (e.cadastros?.individuais ?? 0),
        domiciliares: acc.domiciliares + (e.cadastros?.domiciliares ?? 0),
        criancas: acc.criancas + (e.grupos_prioritarios?.criancas_0_5 ?? 0),
        idosos: acc.idosos + (e.grupos_prioritarios?.idosos_60_mais ?? 0),
        bolsa: acc.bolsa + (e.grupos_prioritarios?.bolsa_familia ?? 0),
        bpc: acc.bpc + (e.grupos_prioritarios?.bpc ?? 0),
    }), { individuais: 0, domiciliares: 0, criancas: 0, idosos: 0, bolsa: 0, bpc: 0 });

    const csvData = data.map(e => ({
        ine: e.ine, nome: e.nome, tipo: e.tipo,
        cadastros_individuais: e.cadastros?.individuais,
        cadastros_domiciliares: e.cadastros?.domiciliares,
        completude_pct: e.cadastros?.pct_completude,
        pontuacao: e.cadastros?.pontuacao,
        classificacao: e.classificacao,
    }));

    const selSx = { border: '1px solid var(--lg-border-input)', borderRadius: 4, px: 8, py: 4, fontSize: 13, background: 'var(--lg-glass-input)', color: 'var(--lg-text-primary)' };

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;
    if (erro) return <Box p={3}><Typography color="error">Erro ao carregar vínculo territorial: {erro}</Typography></Box>;

    return (
        <Box>
            <Box mt="20px" mb={3}>
                <Typography variant="h5" fontWeight={700} mb={1.5}>Vínculo e Acompanhamento Territorial</Typography>
                <Box display="flex" gap={1} alignItems="center">
                    <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selSx}>
                        {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select value={quad} onChange={e => setQuad(Number(e.target.value))} style={selSx}>
                        {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
                    </select>
                    {equipes.length > 0 && (
                        <select value={ine} onChange={e => setIne(e.target.value)} style={{ ...selSx, maxWidth: 220 }}>
                            <option value="">Todas as equipes</option>
                            {equipes.map(eq => (
                                <option key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</option>
                            ))}
                        </select>
                    )}
                    <Button variant="outlined" size="small" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        startIcon={<FeatherIcon icon="download" width="16" height="16" />}
                        onClick={() => exportarCSV(csvData, `vinculo-${ano}-q${quad}`)}>
                        Exportar CSV
                    </Button>
                </Box>
            </Box>

            {/* Cards de totais */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={6} sm={3}><MetricCard icon="users" titulo="Cadastros Individuais" valor={totais.individuais} cor="#1351B4" /></Grid>
                <Grid item xs={6} sm={3}><MetricCard icon="home" titulo="Com Cadastro Domiciliar" valor={totais.domiciliares} cor="#0072B7" /></Grid>
                <Grid item xs={6} sm={3}><MetricCard icon="heart" titulo="Crianças < 5 anos" valor={totais.criancas} cor="#FF8C00" /></Grid>
                <Grid item xs={6} sm={3}><MetricCard icon="user" titulo="Idosos ≥ 60 anos" valor={totais.idosos} cor="#168821" /></Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Grupos prioritários */}
                <Grid item xs={12} md={5}>
                    <BaseCard title="Grupos Prioritários">
                        <GrupoBar label="👶 Crianças < 5 anos" total={totais.individuais} valor={totais.criancas} cor="#1351B4" />
                        <GrupoBar label="👴 Idosos ≥ 60 anos"  total={totais.individuais} valor={totais.idosos}   cor="#0072B7" />
                        <GrupoBar label="💰 Bolsa Família"      total={totais.individuais} valor={totais.bolsa}    cor="#FF8C00" />
                        <GrupoBar label="♿ BPC"                 total={totais.individuais} valor={totais.bpc}      cor="#168821" />
                    </BaseCard>
                </Grid>

                {/* Tabela por equipe */}
                <Grid item xs={12} md={7}>
                    <BaseCard title={`Detalhamento por Equipe (${data.length} equipes)`}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'var(--lg-text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--lg-border)' } }}>
                                        <TableCell>Equipe</TableCell>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell align="right">Ind.</TableCell>
                                        <TableCell align="right">Dom.</TableCell>
                                        <TableCell align="right">Completude</TableCell>
                                        <TableCell align="center">Classif.</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.map(e => (
                                        <TableRow key={e.ine} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} noWrap>{e.nome}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{e.ine}</Typography>
                                            </TableCell>
                                            <TableCell><Chip label={e.tipo} size="small" variant="outlined" /></TableCell>
                                            <TableCell align="right">{e.cadastros?.individuais?.toLocaleString('pt-BR')}</TableCell>
                                            <TableCell align="right">{e.cadastros?.domiciliares?.toLocaleString('pt-BR')}</TableCell>
                                            <TableCell align="right">{e.cadastros?.pct_completude}%</TableCell>
                                            <TableCell align="center">
                                                <Chip label={LABEL[e.classificacao] ?? '—'} size="small"
                                                    sx={{ bgcolor: (COR[e.classificacao] || '#888') + '22', color: COR[e.classificacao] || '#888', fontWeight: 700, fontSize: 11 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
