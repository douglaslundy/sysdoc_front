import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import {
    Box, Button, Card, CardContent, CircularProgress, FormControl, IconButton,
    InputAdornment, InputLabel, MenuItem, Select, TextField,
    ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import VisitaDetalheModal from './VisitaDetalheModal';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false });

const MESES_COMPLETO = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MapaVisitasPage() {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [filtroModo, setFiltroModo]   = useState('todos'); // 'todos' | 'equipe'
    const [equipeIne, setEquipeIne]     = useState('');
    const [agenteNome, setAgenteNome]   = useState('');
    const [filtroSearch, setFiltroSearch] = useState('');
    const [searchAtivo, setSearchAtivo]   = useState(''); // debounced
    const [ano, setAno]                 = useState(anoAtual);
    const [mes, setMes]                 = useState(mesAtual);
    const debounceRef = useRef(null);

    const [equipes, setEquipes]   = useState([]);
    const [agentes, setAgentes]   = useState([]);
    const [pontos, setPontos]     = useState([]);
    const [loading, setLoading]   = useState(false);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    const [detalhe, setDetalhe]               = useState(null);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);
    const [modalAberto, setModalAberto]       = useState(false);

    useMonitorApsAudit('/monitor-aps/visitas/mapa', 'Monitor APS - Mapa de Visitas', {
        ano, mes, equipe: equipeIne, agente: agenteNome,
    });

    // Color mode is auto-determined by the filter state (no separate toggle needed)
    const modoExterno = useMemo(() => {
        if (filtroModo === 'todos' || !equipeIne) return 'todos'; // color by team
        if (!agenteNome)                          return 'equipe'; // color by agent
        return 'agente';                                           // color by outcome
    }, [filtroModo, equipeIne, agenteNome]);

    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            setFiltroModo('equipe');
            if (minhasEquipes.length === 1) setEquipeIne(minhasEquipes[0].nu_ine);
            return;
        }
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
    }, [isRestrito, minhasEquipes, loadingPerms]);

    // Força modo equipe quando isRestrito
    useEffect(() => {
        if (isRestrito) setFiltroModo('equipe');
    }, [isRestrito]);

    // Reload agent list whenever team or period changes
    useEffect(() => {
        if (!equipeIne) {
            setAgentes([]);
            setAgenteNome('');
            return;
        }
        const params = new URLSearchParams({ ano, mes, ine: equipeIne });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgentes(d.agentes ?? []))
            .catch(() => setAgentes([]));
    }, [equipeIne, ano, mes]);

    // Debounce do campo de busca: dispara após 400 ms sem digitação
    function handleSearchChange(valor) {
        setFiltroSearch(valor);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const v = valor.trim();
            setSearchAtivo(v.length >= 3 ? v : '');
        }, 400);
    }

    function limparSearch() {
        setFiltroSearch('');
        setSearchAtivo('');
        clearTimeout(debounceRef.current);
    }

    // Reload map points whenever any filter changes
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (equipeIne)    params.set('ine', equipeIne);
        if (agenteNome)   params.set('agente', agenteNome);
        if (searchAtivo)  params.set('busca', searchAtivo);

        setLoading(true);
        monitorApsApi.get(`/visitas/mapa?${params}`)
            .then(d => setPontos(d.pontos ?? []))
            .catch(() => setPontos([]))
            .finally(() => setLoading(false));
    }, [ano, mes, equipeIne, agenteNome, searchAtivo]);

    const abrirDetalhe = useCallback(async (id) => {
        setLoadingDetalhe(true);
        setModalAberto(true);
        setDetalhe(null);
        try {
            const data = await monitorApsApi.get(`/visitas/${id}`);
            setDetalhe(data);
        } catch {
            setModalAberto(false);
        } finally {
            setLoadingDetalhe(false);
        }
    }, []);

    const fecharModal = useCallback(() => {
        setModalAberto(false);
        setDetalhe(null);
    }, []);

    const anosDisponiveis = useMemo(
        () => Array.from({ length: anoAtual - 2020 + 1 }, (_, i) => anoAtual - i),
        [anoAtual]
    );

    function handleFiltroModo(_, valor) {
        if (!valor) return;
        setFiltroModo(valor);
        if (valor === 'todos') {
            setEquipeIne('');
            setAgenteNome('');
        } else {
            // ao mudar para Por Equipe, limpa a busca por cidadão
            limparSearch();
        }
    }

    return (
        <Box className="dashboard-neon-page monitor-aps-page">
            <Box className="dashboard-neon-home monitor-aps-surface monitor-aps-mapa-page">
            {/* Cabeçalho — oculto na impressão (substituído pelo print-header abaixo) */}
            <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Mapa de Visitas ACS/TACS</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    {!loading && pontos.length > 0 && (
                        <Typography variant="body2" sx={{ color: 'var(--lg-text-secondary)' }}>
                            {pontos.length.toLocaleString('pt-BR')} ponto{pontos.length !== 1 ? 's' : ''} no mapa
                        </Typography>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FeatherIcon icon="printer" width={14} height={14} />}
                        onClick={() => window.print()}
                        disabled={loading || pontos.length === 0}
                        sx={{ textTransform: 'none', borderRadius: '10px', minWidth: 90 }}
                    >
                        PDF
                    </Button>
                </Box>
            </Box>

            {/* Cabeçalho visível apenas na impressão */}
            <Box className="print-only" sx={{ display: 'none', mb: 2, pb: 1.5, borderBottom: '1px solid #ccc' }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'var(--lg-text-primary)', mb: 0.5 }}>
                    Mapa de Visitas ACS/TACS
                </Typography>
                <Typography variant="body2" sx={{ color: '#333' }}>
                    Período: {MESES_COMPLETO[mes]} / {ano}
                    {filtroModo === 'equipe' && equipeIne && equipes.find(e => e.nu_ine === equipeIne)
                        ? ` • Equipe: ${equipes.find(e => e.nu_ine === equipeIne).no_equipe}`
                        : ''}
                    {agenteNome ? ` • Agente: ${agenteNome}` : ''}
                    {searchAtivo ? ` • Busca: "${searchAtivo}"` : ''}
                    {pontos.length > 0
                        ? ` • ${pontos.length.toLocaleString('pt-BR')} ponto${pontos.length !== 1 ? 's' : ''} georreferenciado${pontos.length !== 1 ? 's' : ''}`
                        : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                    Gerado em: {new Date().toLocaleString('pt-BR')}
                </Typography>
            </Box>

            {/* Painel de filtros — oculto na impressão */}
            <Card className="no-print monitor-aps-panel" sx={{ mb: 2 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">

                        {/* Todos / Por Equipe */}
                        <ToggleButtonGroup
                            size="small" exclusive
                            value={filtroModo}
                            onChange={handleFiltroModo}
                            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}
                        >
                            {!isRestrito && <ToggleButton value="todos">Todos</ToggleButton>}
                            <ToggleButton value="equipe">Por Equipe</ToggleButton>
                        </ToggleButtonGroup>

                        {/* Busca por cidadão — só no modo Todos */}
                        {filtroModo === 'todos' && (
                            <TextField
                                size="small"
                                placeholder="CPF, CNS ou nome (mín. 3 letras)"
                                value={filtroSearch}
                                onChange={e => handleSearchChange(e.target.value)}
                                sx={{
                                    minWidth: 280,
                                    '& .MuiOutlinedInput-input': {
                                        backgroundColor: 'transparent !important',
                                    },
                                    '& input:-webkit-autofill': {
                                        WebkitBoxShadow: '0 0 0 100px transparent inset',
                                        transition: 'background-color 9999s ease-out 0s',
                                        WebkitTextFillColor: 'var(--lg-text-primary)',
                                        caretColor: 'var(--lg-text-primary)',
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FeatherIcon icon="search" width={14} height={14} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filtroSearch ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={limparSearch} edge="end">
                                                <FeatherIcon icon="x" width={14} height={14} />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />
                        )}

                        {/* Equipe — habilitado apenas quando modo equipe */}
                        {filtroModo === 'equipe' && (
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>Equipe</InputLabel>
                                <Select label="Equipe" value={equipeIne}
                                    onChange={e => { setEquipeIne(e.target.value); setAgenteNome(''); }}
                                    disabled={isRestrito && equipes.length === 1}
                                    renderValue={(val) => {
                                        if (!val) return '';
                                        const eq = equipes.find(e => e.nu_ine === val);
                                        return eq ? equipeLabel(eq.no_equipe) : val;
                                    }}>
                                    <MenuItem value="">
                                        {isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}
                                    </MenuItem>
                                    {equipes.map(eq => (
                                        <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {isRestrito && !loadingPerms && equipes.length === 0 && (
                            <Box sx={{ p: 2, border: '1px solid #FF8C00', borderRadius: 2, bgcolor: '#FF8C0011' }}>
                                <Typography variant="body2" color="warning.dark">
                                    Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.
                                </Typography>
                            </Box>
                        )}

                        {/* Agente — habilitado apenas quando equipe selecionada */}
                        {filtroModo === 'equipe' && equipeIne && (
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>Agente</InputLabel>
                                <Select label="Agente" value={agenteNome}
                                    onChange={e => setAgenteNome(e.target.value)}>
                                    <MenuItem value="">Todos os agentes</MenuItem>
                                    {agentes.map((a, i) => (
                                        <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Ano */}
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Ano</InputLabel>
                            <Select label="Ano" value={ano}
                                onChange={e => setAno(Number(e.target.value))}>
                                {anosDisponiveis.map(a => (
                                    <MenuItem key={a} value={a}>{a}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Mês */}
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Mês</InputLabel>
                            <Select label="Mês" value={mes}
                                onChange={e => setMes(Number(e.target.value))}>
                                {MESES_COMPLETO.slice(1).map((m, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            {/* Mapa */}
            <Card className="monitor-aps-panel">
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <MapaVisitas
                            pontos={pontos}
                            zoom={13}
                            onPinClick={abrirDetalhe}
                            modoExterno={modoExterno}
                            showToggle={false}
                        />
                    )}
                    <Typography variant="caption"
                        sx={{ color: 'var(--lg-text-muted)', display: 'block', mt: 1 }}>
                        Exibindo todos os pontos georreferenciados dos filtros selecionados.
                        Visitas sem coordenadas não aparecem no mapa.
                    </Typography>
                </CardContent>
            </Card>

            <VisitaDetalheModal
                open={modalAberto}
                onClose={fecharModal}
                visita={loadingDetalhe ? null : detalhe}
            />
            </Box>
        </Box>
    );
}

