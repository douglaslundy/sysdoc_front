// src/components/conformidadeCidadao/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Button, Alert, CircularProgress,
    Table, TableBody, TableCell, TableHead, TableRow,
    TableContainer, Paper, Chip, Grid, TablePagination,
    LinearProgress, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { conformidadeCidadaoApi } from '../../services/conformidadeCidadaoApi';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { generateConformidadeHistoricoPDF } from '../../reports/conformidadeCidadao';

const CHIP_COLORS = { criar: 'success', atualizar: 'info', obito: 'error' };
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
        <Box display="flex" alignItems="center" gap={1} sx={{ px: 1 }}>
            <Typography variant="caption" color="textSecondary">Ir para</Typography>
            <TextField
                size="small"
                value={value}
                onChange={e => setValue(e.target.value.replace(/\D/g, '') || '')}
                onBlur={go}
                onKeyDown={e => e.key === 'Enter' && go()}
                inputProps={{ style: { width: 44, textAlign: 'center', padding: '3px 6px', fontSize: 13 } }}
            />
            <Typography variant="caption" color="textSecondary">de {lastPage}</Typography>
            {currentPage < lastPage && (
                <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1, fontSize: 12 }}
                    onClick={() => onGo(lastPage)}>
                    Ultima
                </Button>
            )}
        </Box>
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
            setErro('Nao foi possivel descartar a previa.');
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
            setErro('Nao foi possivel carregar os detalhes do historico.');
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
            setErro('Nao foi possivel baixar o PDF do historico.');
        } finally {
            setPdfJobId(null);
        }
    };

    const emAndamento = ['analyzing', 'applying'].includes(fase);

    return (
        <Box
            className="conformidade-theme-surface"
            sx={{
                ...modalFormRootSx,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                "& .MuiCard-root.card.info-card, & .MuiCard-root.info-card": {
                    background: "linear-gradient(135deg, rgba(8, 24, 56, 0.82) 0%, rgba(7, 21, 49, 0.9) 100%) !important",
                    border: "1px solid rgba(82, 129, 218, 0.24) !important",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05) !important",
                    backdropFilter: "none !important",
                    WebkitBackdropFilter: "none !important",
                    borderRadius: "16px !important",
                    "[data-theme='light'] &": {
                        background: "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(239,246,255,0.78) 100%) !important",
                        border: "1px solid rgba(180, 210, 255, 0.35) !important",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92) !important",
                    }
                },
                "& .card.info-card .card__title, & .MuiCard-root .card__title": {
                    color: "var(--lg-text-primary)",
                    fontWeight: 700,
                },
                "& .card.info-card .card__content, & .MuiCard-root .card__content": {
                    color: "var(--lg-text-primary)",
                },
                "& .MuiPaper-root": {
                    background: "linear-gradient(135deg, rgba(8, 24, 56, 0.82) 0%, rgba(7, 21, 49, 0.9) 100%) !important",
                    border: "1px solid rgba(82, 129, 218, 0.24) !important",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05) !important",
                    backdropFilter: "none !important",
                    WebkitBackdropFilter: "none !important",
                    color: "var(--lg-text-primary)",
                    "[data-theme='light'] &": {
                        background: "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(239,246,255,0.78) 100%) !important",
                        border: "1px solid rgba(180, 210, 255, 0.35) !important",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92) !important",
                    }
                },
                "& .MuiTableContainer-root": {
                    borderRadius: "14px",
                    border: "0.5px solid var(--lg-border-input)",
                    background: "var(--lg-glass-panel)",
                },
                "& .MuiAlert-root": {
                    borderRadius: "10px",
                    backdropFilter: "var(--lg-blur-input)",
                    WebkitBackdropFilter: "var(--lg-blur-input)",
                },
                "& .MuiTableHead-root .MuiTableCell-root": {
                    color: "var(--lg-text-secondary)",
                    borderBottom: "1px solid var(--lg-border-row)",
                    fontWeight: 700,
                },
                "& .MuiTableBody-root .MuiTableCell-root": {
                    color: "var(--lg-text-primary)",
                    borderBottom: "1px solid var(--lg-border-row)",
                },
                "& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root": {
                    background: "var(--lg-glass-row-hover)",
                },
                "& .MuiChip-root": {
                    borderRadius: "8px",
                },
                "& .MuiButton-contained": {
                    borderRadius: "10px",
                    textTransform: "none",
                    boxShadow: "var(--lg-shadow-btn)",
                },
                "& .MuiButton-outlined": {
                    borderRadius: "10px",
                    textTransform: "none",
                    background: "var(--lg-glass-input)",
                    border: "0.5px solid var(--lg-border-input)",
                    color: "var(--lg-text-secondary)",
                },
                "& .MuiButton-outlined:hover": {
                    background: "var(--lg-glass-input-focus)",
                    color: "var(--lg-text-primary)",
                    border: "0.5px solid var(--lg-border-input)",
                },
                "& .MuiLinearProgress-root": {
                    background: "rgba(var(--lg-accent-rgb),0.18)",
                    borderRadius: "10px",
                    height: 8,
                },
                "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, var(--lg-accent), #7c3aed)",
                },
                "& .MuiTablePagination-root, & .MuiTablePagination-root *": {
                    color: "var(--lg-text-secondary)",
                },
            }}
        >
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
                    <Box display="flex" flexDirection="column" gap={2} maxWidth={560}>
                        {(() => {
                            const previsto = syncData?.total_esus_previsto ?? 0;
                            const processado = syncData?.total_esus ?? 0;
                            const pct = previsto > 0 ? Math.min(100, Math.round((processado / previsto) * 100)) : null;
                            return (
                                <>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box flex={1}>
                                            <LinearProgress
                                                variant={pct !== null ? 'determinate' : 'indeterminate'}
                                                value={pct ?? 0}
                                            />
                                        </Box>
                                        {pct !== null && (
                                            <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right' }}>
                                                {pct}%
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <CircularProgress size={20} />
                                        <Box>
                                            <Typography>Comparando cidadãos com e-SUS PEC...</Typography>
                                            {processado > 0 && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {processado.toLocaleString('pt-BR')}
                                                    {previsto > 0 && ` de ${previsto.toLocaleString('pt-BR')}`}
                                                    {' '}registros processados
                                                    {syncData.preview_criados > 0 && ` · ${syncData.preview_criados} para criar`}
                                                    {syncData.preview_atualizados > 0 && ` · ${syncData.preview_atualizados} para atualizar`}
                                                    {syncData.preview_obitos > 0 && ` · ${syncData.preview_obitos} óbitos`}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </>
                            );
                        })()}
                        <Box>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                disabled={cancelando}
                                onClick={handleCancelar}
                            >
                                {cancelando ? 'Cancelando...' : 'Cancelar'}
                            </Button>
                        </Box>
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
                            <Box display="flex" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                                <PageJumper
                                    currentPage={itensMeta.current_page}
                                    lastPage={itensMeta.last_page}
                                    onGo={page => handleItensPagina(null, page - 1)}
                                />
                                <TablePagination
                                    component="div"
                                    count={itensMeta.total}
                                    page={itensMeta.current_page - 1}
                                    rowsPerPage={itensMeta.per_page}
                                    rowsPerPageOptions={[]}
                                    onPageChange={handleItensPagina}
                                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                                />
                            </Box>
                        </TableContainer>

                        <Box display="flex" gap={2}>
                            <Button variant="contained" color="primary" onClick={handleAplicar}>
                                Aplicar alterações
                            </Button>
                            <Button variant="outlined" color="inherit" onClick={handleDescartarPreview} disabled={cancelando}>
                                Descartar
                            </Button>
                        </Box>
                    </Box>
                </BaseCard>
            )}

            {fase === 'applying' && (
                <BaseCard title="Aplicando...">
                    <Box display="flex" flexDirection="column" gap={2} maxWidth={560}>
                        {(() => {
                            const totalAplicar = syncData?.total_a_aplicar ?? 0;
                            const aplicados = syncData?.total_aplicado ?? 0;
                            const pct = totalAplicar > 0 ? Math.min(100, Math.round((aplicados / totalAplicar) * 100)) : null;
                            return (
                                <>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box flex={1}>
                                            <LinearProgress
                                                variant={pct !== null ? 'determinate' : 'indeterminate'}
                                                value={pct ?? 0}
                                            />
                                        </Box>
                                        {pct !== null && (
                                            <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'right' }}>
                                                {pct}%
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <CircularProgress size={20} />
                                        <Box>
                                            <Typography>Aplicando alterações no Sysdoc...</Typography>
                                            {aplicados > 0 && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {aplicados.toLocaleString('pt-BR')}
                                                    {totalAplicar > 0 && ` de ${totalAplicar.toLocaleString('pt-BR')}`}
                                                    {' '}registros aplicados
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </>
                            );
                        })()}

                        <Box>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                disabled={cancelando}
                                onClick={handleCancelar}
                            >
                                {cancelando ? 'Cancelando...' : 'Cancelar'}
                            </Button>
                        </Box>
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
                        {syncData.result_erros > 0 && errosDetalhe.length > 0 && (
                            <Box display="flex" flexDirection="column" gap={1.5}>
                                <Box>
                                    <Button variant="outlined" size="small" onClick={() => window.print()}>
                                        Exportar erros (PDF)
                                    </Button>
                                </Box>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nome (e-SUS)</TableCell>
                                            <TableCell>CPF</TableCell>
                                            <TableCell>Ação</TableCell>
                                            <TableCell>Motivo do erro</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {errosDetalhe.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.nome_esus}</TableCell>
                                                <TableCell>{item.cpf || '—'}</TableCell>
                                                <TableCell>{CHIP_LABELS[item.acao] || item.acao}</TableCell>
                                                <TableCell>{item.erro || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
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

            {historico.length > 0 && (
                <BaseCard title="Histórico de Sincronizações">
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                            mt: 1,
                            background: "transparent !important",
                            border: "none",
                            boxShadow: "none",
                            "& .MuiTableRow-root th": {
                                borderBottom: "1px solid rgba(117, 155, 228, 0.22)",
                                color: "var(--lg-text-secondary)",
                            },
                            "& .MuiTableRow-root td": {
                                borderBottom: "none",
                            }
                        }}
                    >
                        <Table size="small" sx={{ borderCollapse: "separate", borderSpacing: "0 10px" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Criados</TableCell>
                                    <TableCell>Atualizados</TableCell>
                                    <TableCell>Óbitos</TableCell>
                                    <TableCell>Erros</TableCell>
                                    <TableCell>Iniciado por</TableCell>
                                    <TableCell align="right">Acoes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historico.map((s, i) => (
                                    <TableRow
                                        key={i}
                                        sx={{
                                            "& td": {
                                                background: "linear-gradient(135deg, rgba(8, 24, 56, 0.82) 0%, rgba(7, 21, 49, 0.9) 100%)",
                                                borderTop: "1px solid rgba(82, 129, 218, 0.2)",
                                                borderBottom: "1px solid rgba(82, 129, 218, 0.2)",
                                                color: "var(--lg-text-primary)"
                                            },
                                            "& td:first-of-type": {
                                                borderLeft: "1px solid rgba(82, 129, 218, 0.2)",
                                                borderRadius: "12px 0 0 12px"
                                            },
                                            "& td:last-of-type": {
                                                borderRight: "1px solid rgba(82, 129, 218, 0.2)",
                                                borderRadius: "0 12px 12px 0"
                                            },
                                            "[data-theme='light'] & td": {
                                                background: "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(239,246,255,0.78) 100%)",
                                                borderTop: "1px solid rgba(180, 210, 255, 0.35)",
                                                borderBottom: "1px solid rgba(180, 210, 255, 0.35)"
                                            },
                                            "[data-theme='light'] & td:first-of-type": {
                                                borderLeft: "1px solid rgba(180, 210, 255, 0.35)"
                                            },
                                            "[data-theme='light'] & td:last-of-type": {
                                                borderRight: "1px solid rgba(180, 210, 255, 0.35)"
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={STATUS_LABELS[s.status] ?? s.status}
                                                size="small"
                                                color={
                                                    s.status === 'completed' ? 'success' :
                                                    s.status === 'failed'    ? 'error'   :
                                                    ['analyzing', 'applying', 'pending'].includes(s.status) ? 'warning' :
                                                    'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{s.result_criados ?? '—'}</TableCell>
                                        <TableCell>{s.result_atualizados ?? '—'}</TableCell>
                                        <TableCell>{s.result_obitos ?? '—'}</TableCell>
                                        <TableCell>{s.result_erros ?? '—'}</TableCell>
                                        <TableCell>{s.iniciado_por?.name ?? '—'}</TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <Tooltip title="Visualizar atualizacoes">
                                                    <span>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            disabled={!s.job_id || s.job_id === '__new__'}
                                                            onClick={() => carregarDetalhesHistorico(s, 1)}
                                                            sx={{ minWidth: 36, px: 1 }}
                                                        >
                                                            <FeatherIcon icon="eye" width="15" />
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Baixar PDF">
                                                    <span>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            disabled={!s.job_id || s.job_id === '__new__' || pdfJobId === s.job_id}
                                                            onClick={() => baixarPdfHistorico(s)}
                                                            sx={{ minWidth: 36, px: 1 }}
                                                        >
                                                            {pdfJobId === s.job_id
                                                                ? <CircularProgress size={14} />
                                                                : <FeatherIcon icon="download" width="15" />}
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Box display="flex" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                            <PageJumper
                                currentPage={histMeta.current_page}
                                lastPage={histMeta.last_page}
                                onGo={page => carregarHistorico(page)}
                            />
                            <TablePagination
                                component="div"
                                count={histMeta.total}
                                page={histMeta.current_page - 1}
                                rowsPerPage={histMeta.per_page}
                                rowsPerPageOptions={[]}
                                onPageChange={(_, p) => carregarHistorico(p + 1)}
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                            />
                        </Box>
                    </TableContainer>
                </BaseCard>
            )}
            <Dialog
                open={detalhesHistorico.open}
                onClose={fecharDetalhesHistorico}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        width: 'min(1180px, 96vw) !important',
                        maxWidth: '96vw !important',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h6">Atualizacoes registradas</Typography>
                        <Typography variant="caption" color="textSecondary">
                            Job {detalhesHistorico.row?.job_id ?? '-'}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={pdfJobId === detalhesHistorico.row?.job_id
                            ? <CircularProgress size={14} />
                            : <FeatherIcon icon="download" width="15" />}
                        disabled={!detalhesHistorico.row?.job_id || pdfJobId === detalhesHistorico.row?.job_id}
                        onClick={() => baixarPdfHistorico(detalhesHistorico.row)}
                    >
                        Baixar PDF
                    </Button>
                </DialogTitle>
                <DialogContent dividers>
                    {detalhesHistorico.loading ? (
                        <Box display="flex" alignItems="center" justifyContent="center" py={5}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Acao</TableCell>
                                        <TableCell>Nome (e-SUS)</TableCell>
                                        <TableCell>CPF / CNS</TableCell>
                                        <TableCell>Campos</TableCell>
                                        <TableCell>Resultado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {detalhesHistorico.itens.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                Nenhuma atualizacao registrada.
                                            </TableCell>
                                        </TableRow>
                                    ) : detalhesHistorico.itens.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Chip
                                                    label={CHIP_LABELS[item.acao] ?? item.acao}
                                                    color={CHIP_COLORS[item.acao] ?? 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{item.nome_esus}</TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem' }}>
                                                {item.cpf || '-'}<br />{item.cns || '-'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem' }}>
                                                {item.acao === 'criar' ? 'Novo cadastro' :
                                                 item.acao === 'obito' ? 'Inativar + filas' :
                                                 diffToString(item.payload ?? {})}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem' }}>
                                                {item.erro || (item.aplicado ? 'Aplicado' : 'Pendente')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Box display="flex" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                                <PageJumper
                                    currentPage={detalhesHistorico.meta.current_page}
                                    lastPage={detalhesHistorico.meta.last_page}
                                    onGo={page => carregarDetalhesHistorico(detalhesHistorico.row, page)}
                                />
                                <TablePagination
                                    component="div"
                                    count={detalhesHistorico.meta.total}
                                    page={detalhesHistorico.meta.current_page - 1}
                                    rowsPerPage={detalhesHistorico.meta.per_page}
                                    rowsPerPageOptions={[]}
                                    onPageChange={(_, p) => carregarDetalhesHistorico(detalhesHistorico.row, p + 1)}
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                />
                            </Box>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={fecharDetalhesHistorico}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
