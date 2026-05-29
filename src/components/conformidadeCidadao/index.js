// src/components/conformidadeCidadao/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Button, Alert, CircularProgress,
    Table, TableBody, TableCell, TableHead, TableRow,
    TableContainer, Paper, Chip, Grid, TablePagination,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { conformidadeCidadaoApi } from '../../services/conformidadeCidadaoApi';

const CHIP_COLORS = { criar: 'success', atualizar: 'info', obito: 'error' };
const CHIP_LABELS = { criar: 'Criar', atualizar: 'Atualizar', obito: 'Óbito' };

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

export default function ConformidadeCidadao() {
    const [fase, setFase] = useState('idle');
    const [jobId, setJobId] = useState(null);
    const [syncData, setSyncData] = useState(null);
    const [itens, setItens] = useState([]);
    const [itensMeta, setItensMeta] = useState({ total: 0, per_page: 20, current_page: 1, last_page: 1 });
    const [historico, setHistorico] = useState([]);
    const [histMeta, setHistMeta] = useState({ total: 0, per_page: 15, current_page: 1, last_page: 1 });
    const [erro, setErro] = useState(null);
    const pollingRef = useRef(null);

    const carregarHistorico = useCallback(async (page = 1) => {
        try {
            const data = await conformidadeCidadaoApi.historico(page);
            setHistorico(data.data);
            setHistMeta(data.meta);
        } catch (_) {}
    }, []);

    useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

    const iniciarPolling = useCallback((jid) => {
        pollingRef.current = setInterval(async () => {
            try {
                const data = await conformidadeCidadaoApi.status(jid);
                setSyncData(data);
                if (data.status === 'preview_ready') {
                    setItens(data.itens || []);
                    setItensMeta(data.itens_meta || itensMeta);
                    setFase('preview');
                    clearInterval(pollingRef.current);
                } else if (data.status === 'completed') {
                    setFase('done');
                    clearInterval(pollingRef.current);
                    carregarHistorico();
                } else if (data.status === 'failed') {
                    setErro(data.erro_mensagem || 'Erro desconhecido na sincronização.');
                    setFase('error');
                    clearInterval(pollingRef.current);
                }
            } catch (_) {}
        }, 3000);
    }, [carregarHistorico, itensMeta]);

    useEffect(() => () => clearInterval(pollingRef.current), []);

    const handleAnalisar = async () => {
        setErro(null);
        setFase('analyzing');
        try {
            const data = await conformidadeCidadaoApi.analisar();
            setJobId(data.job_id);
            // Com QUEUE_CONNECTION=sync: job já completou, buscar status
            const status = await conformidadeCidadaoApi.status(data.job_id);
            setSyncData(status);
            if (status.status === 'preview_ready') {
                setItens(status.itens || []);
                setItensMeta(status.itens_meta || itensMeta);
                setFase('preview');
            } else if (status.status === 'analyzing' || status.status === 'pending') {
                iniciarPolling(data.job_id);
            } else if (status.status === 'failed') {
                setErro(status.erro_mensagem || 'Erro na análise.');
                setFase('error');
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 409) setErro('Já existe uma sincronização em andamento.');
            else if (status === 403) setErro('Sem permissão para executar a sincronização.');
            else setErro('Erro ao iniciar a análise. Verifique a conexão com o e-SUS.');
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

    const handleDescartarPreview = () => {
        setFase('idle');
        setJobId(null);
        setSyncData(null);
        setItens([]);
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
        setErro(null);
        carregarHistorico();
    };

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            {erro && <Alert severity="error" onClose={() => setErro(null)}>{erro}</Alert>}

            {fase === 'idle' && (
                <BaseCard title="Conformidade de Cidadãos — e-SUS PEC">
                    <Box display="flex" flexDirection="column" gap={2} maxWidth={560}>
                        <Typography variant="body2" color="textSecondary">
                            Compara os clientes cadastrados no Sysdoc com os cidadãos ativos no e-SUS PEC.
                            Atualiza dados divergentes, processa óbitos e cria novos registros. Uma prévia
                            é exibida antes de qualquer alteração ser aplicada.
                        </Typography>
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<FeatherIcon icon="refresh-cw" width="16" />}
                                onClick={handleAnalisar}
                            >
                                Analisar agora
                            </Button>
                        </Box>
                    </Box>
                </BaseCard>
            )}

            {fase === 'analyzing' && (
                <BaseCard title="Analisando...">
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={24} />
                        <Typography>Comparando cidadãos com e-SUS PEC...</Typography>
                    </Box>
                </BaseCard>
            )}

            {fase === 'preview' && syncData && (
                <BaseCard title="Prévia das Alterações">
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="success.main">{syncData.preview_criados}</Typography>
                                    <Typography variant="body2">Novos para criar</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="info.main">{syncData.preview_atualizados}</Typography>
                                    <Typography variant="body2">Com dados diferentes</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h4" color="error.main">{syncData.preview_obitos}</Typography>
                                    <Typography variant="body2">Óbitos a processar</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ação</TableCell>
                                        <TableCell>Nome (e-SUS)</TableCell>
                                        <TableCell>CPF / CNS</TableCell>
                                        <TableCell>Campos</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itens.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Chip
                                                    label={CHIP_LABELS[item.acao]}
                                                    color={CHIP_COLORS[item.acao]}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{item.nome_esus}</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem' }}>
                                                {item.cpf || '—'}<br />{item.cns || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem' }}>
                                                {item.acao === 'criar' ? 'Novo cadastro' :
                                                 item.acao === 'obito' ? 'Inativar + filas' :
                                                 diffToString(item.payload)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={itensMeta.total}
                                page={itensMeta.current_page - 1}
                                rowsPerPage={itensMeta.per_page}
                                rowsPerPageOptions={[]}
                                onPageChange={handleItensPagina}
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                            />
                        </TableContainer>

                        <Box display="flex" gap={2}>
                            <Button variant="contained" color="primary" onClick={handleAplicar}>
                                Aplicar alterações
                            </Button>
                            <Button variant="outlined" color="inherit" onClick={handleDescartarPreview}>
                                Descartar
                            </Button>
                        </Box>
                    </Box>
                </BaseCard>
            )}

            {fase === 'applying' && (
                <BaseCard title="Aplicando...">
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={24} />
                        <Typography>Aplicando alterações no Sysdoc...</Typography>
                    </Box>
                </BaseCard>
            )}

            {fase === 'done' && syncData && (
                <BaseCard title="Sincronização Concluída">
                    <Box display="flex" flexDirection="column" gap={2}>
                        {syncData.result_erros > 0 && (
                            <Alert severity="warning">
                                {syncData.result_erros} item(s) com erro — verifique os detalhes no histórico.
                            </Alert>
                        )}
                        <Grid container spacing={2}>
                            {[
                                { label: 'Criados', value: syncData.result_criados ?? 0, color: 'success.main' },
                                { label: 'Atualizados', value: syncData.result_atualizados ?? 0, color: 'info.main' },
                                { label: 'Óbitos', value: syncData.result_obitos ?? 0, color: 'error.main' },
                                { label: 'Erros', value: syncData.result_erros ?? 0, color: syncData.result_erros > 0 ? 'warning.main' : 'text.secondary' },
                            ].map(({ label, value, color }) => (
                                <Grid item xs={6} sm={3} key={label}>
                                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color={color}>{value}</Typography>
                                        <Typography variant="body2">{label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <Box>
                            <Button variant="outlined" onClick={handleNovaSincronizacao}>
                                Nova sincronização
                            </Button>
                        </Box>
                    </Box>
                </BaseCard>
            )}

            {fase === 'error' && (
                <BaseCard title="Erro na Sincronização">
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Alert severity="error">{erro || 'Erro desconhecido.'}</Alert>
                        <Box>
                            <Button variant="outlined" onClick={handleNovaSincronizacao}>
                                Tentar novamente
                            </Button>
                        </Box>
                    </Box>
                </BaseCard>
            )}

            {fase === 'idle' && historico.length > 0 && (
                <BaseCard title="Histórico de Sincronizações">
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Criados</TableCell>
                                    <TableCell>Atualizados</TableCell>
                                    <TableCell>Óbitos</TableCell>
                                    <TableCell>Erros</TableCell>
                                    <TableCell>Iniciado por</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historico.map((s, i) => (
                                    <TableRow key={i}>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.status}
                                                size="small"
                                                color={s.status === 'completed' ? 'success' : s.status === 'failed' ? 'error' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{s.result_criados ?? '—'}</TableCell>
                                        <TableCell>{s.result_atualizados ?? '—'}</TableCell>
                                        <TableCell>{s.result_obitos ?? '—'}</TableCell>
                                        <TableCell>{s.result_erros ?? '—'}</TableCell>
                                        <TableCell>{s.iniciado_por?.name ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={histMeta.total}
                            page={histMeta.current_page - 1}
                            rowsPerPage={histMeta.per_page}
                            rowsPerPageOptions={[]}
                            onPageChange={(_, p) => carregarHistorico(p + 1)}
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        />
                    </TableContainer>
                </BaseCard>
            )}
        </Box>
    );
}
