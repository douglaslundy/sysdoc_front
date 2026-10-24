import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Download, Search, X } from 'lucide-react';
import { getAuditLogs } from '../../store/fetchActions/auditLogs';
import { auditoriaPDF } from '../../reports/auditoria';
import { api } from '../../services/api';
import { deviceDetails, deviceSummary } from '../../utils/deviceSummary';
import { Button } from '../ui/button';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula, tomDaCor } from '../ui/pilula';

// cor do Chip antigo; tomDaCor converte para o tom da Pilula
const ACTION_COLORS = {
    LOGIN: 'info', LOGOUT: 'default', CREATE: 'success',
    UPDATE: 'warning', DELETE: 'error',
    READ: 'default',
    VIEW: 'primary', VIEW_REPORT: 'secondary', LIBERAR: 'success', DOWNLOAD: 'info',
};

const RECURSOS = [
    'Client', 'User', 'Queue', 'PedidoExame', 'ResultadoExame',
    'Trip', 'LabConfig', 'AccessProfile',
];

const ACOES = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
    'READ', 'VIEW', 'VIEW_REPORT', 'LIBERAR', 'DOWNLOAD',
];

const hoje = new Date().toISOString().slice(0, 10);
const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const FORM_INICIAL = { action: '', model_type: '', user_name: '', date_from: seteDiasAtras, date_to: hoje };
const PAGE_LABELS = {
    '/': 'Início',
    '/dashboard': 'Dashboard',
    '/auditoria': 'Auditoria',
    '/users': 'Usuários',
    '/clients': 'Cidadãos',
    '/client_report': 'Relatório de Clientes',
    '/laboratorio/exames': 'Laboratório - Exames',
    '/laboratorio/pedidos': 'Laboratório - Pedidos',
    '/laboratorio/resultados': 'Laboratório - Resultados',
    '/fila': 'Fila',
    '/tfd': 'TFD',
    '/estabelecimentos': 'Vigilância - Estabelecimentos',
    '/alvaras': 'Vigilância - Alvarás',
    '/pharmacy/consulta-medicamentos': 'Farmácia - Consulta de Medicamentos',
    '/pharmacy/medicines': 'Farmácia - Medicamentos',
    '/pharmacy/daily-status': 'Farmácia - Status Diário',
    '/pharmacy/monthly-acquisitions': 'Farmácia - Aquisições Mensais',
    '/pharmacy/compliance': 'Farmácia - Conformidade',
    // Monitor APS
    '/monitor-aps': 'Monitor APS - Resumo',
    '/monitor-aps/qualidade': 'Monitor APS - Indicadores de Qualidade',
    '/monitor-aps/vinculo': 'Monitor APS - Vínculo Territorial',
    '/monitor-aps/equipe': 'Monitor APS - Por Equipe',
    '/monitor-aps/visitas': 'Monitor APS - Visitas ACS',
    '/monitor-aps/visitas/evolucao': 'Monitor APS - Evolução de Visitas',
    '/monitor-aps/visitas/mapa': 'Monitor APS - Mapa de Visitas',
    '/monitor-aps/configuracoes': 'Monitor APS - Configurações',
};

const endpointLabel = (endpoint) => {
    if (!endpoint) return null;
    return endpoint
        .replace(/^api\//, '')        // remove prefixo api/
        .replace(/\/\d+$/, '')        // remove ID numérico final
        .replace(/\/\d+\//, '/')      // remove IDs intermediários
        .replace(/-/g, ' ');          // hífens → espaços
};

const pageViewFriendlyLabel = (log) => {
    // Prioridade 1: label explícito gravado pelo frontend (monitor-aps, etc.)
    if (log?.new_values?.label) return log.new_values.label;

    const path = log?.new_values?.path;
    if (!path) return null;

    // Prioridade 2: mapeamento estático de paths conhecidos
    const normalized = `/${String(path).replace(/^\/+/, '').replace(/\/\d+$/, '')}`;
    if (PAGE_LABELS[normalized]) return PAGE_LABELS[normalized];

    // Fallback: path legível
    const fallback = normalized
        .replace(/^\/+/, '')
        .replace(/-/g, ' ')
        .replace(/\//g, ' / ')
        .trim();

    return fallback ? fallback.toUpperCase() : '/';
};

const auditDetails = (log) => {
    const stripMeta = (values) => {
        if (!values) return values;
        return Object.fromEntries(Object.entries(values).filter(([key]) => !key.startsWith('__audit_')));
    };

    return {
        oldValues: stripMeta(log.old_values),
        newValues: stripMeta(log.new_values),
    };
};

const citizenActionTarget = (log) => {
    if (log.model_type !== 'Client') return null;

    return log.new_values?.__audit_subject_name
        || log.new_values?.nome
        || log.new_values?.name
        || log.old_values?.nome
        || log.old_values?.name
        || null;
};

export default function Auditoria() {
    const dispatch = useDispatch();
    const { logs, total } = useSelector(s => s.auditLogs);

    const [filters, setFilters]       = useState(FORM_INICIAL);
    const [page, setPage]             = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [detalhe, setDetalhe]       = useState(null);
    const [usuarios, setUsuarios]     = useState([]);

    const loadUsers = (activeFilters) => {
        const { user_name: _, ...params } = activeFilters;
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
        api.get('/audit-logs/users', { params: cleanParams })
            .then(res => setUsuarios(Array.isArray(res.data) ? res.data : []))
            .catch(() => setUsuarios([]));
    };

    useEffect(() => {
        dispatch(getAuditLogs(FORM_INICIAL, 1, 50));
        loadUsers(FORM_INICIAL);
    }, []);

    const load = (pg = 0, nextFilters = filters, perPage = rowsPerPage) => {
        const active = Object.fromEntries(Object.entries(nextFilters).filter(([, v]) => v !== ''));
        dispatch(getAuditLogs(active, pg + 1, perPage));
    };

    const handleFilter = () => { setPage(0); load(0); loadUsers(filters); };
    const handleReset  = () => { setFilters(FORM_INICIAL); setPage(0); load(0, FORM_INICIAL, rowsPerPage); loadUsers(FORM_INICIAL); };
    const handlePage   = (p) => { setPage(p); load(p); };
    const handleChangeRowsPerPage = (value) => {
        setRowsPerPage(value);
        setPage(0);
        load(0, filters, value);
    };

    const renderDiff = (log) => {
        const { oldValues, newValues } = auditDetails(log);

        if (log.action === 'UPDATE' && oldValues && newValues) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="text-muted-foreground">
                                <th scope="col" className="py-1 pr-3 font-bold">Campo</th>
                                <th scope="col" className="py-1 pr-3 font-bold">Antes</th>
                                <th scope="col" className="py-1 font-bold">Depois</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(newValues).map(k => (
                                <tr key={k} className="border-t border-border align-top">
                                    <td className="py-1 pr-3 font-mono">{k}</td>
                                    <td className="break-words py-1 pr-3 text-danger">{String(oldValues[k] ?? '—')}</td>
                                    <td className="break-words py-1 text-success">{String(newValues[k] ?? '—')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        const data = newValues || oldValues;
        if (!data) return <p className="text-sm text-muted-foreground">Sem dados registrados.</p>;

        return <pre className="m-0 max-h-[320px] overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>;
    };

    const colunas = [
        {
            chave: 'data',
            titulo: 'Data/Hora',
            render: (log) => <span className="text-xs">{new Date(log.created_at).toLocaleString('pt-BR')}</span>,
        },
        {
            chave: 'usuario',
            titulo: 'Usuário',
            render: (log) => <span className="font-semibold">{log.user_name?.toUpperCase()}</span>,
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            render: (log) => (
                <div className="flex flex-wrap items-center gap-1">
                    <Pilula tom={tomDaCor(ACTION_COLORS[log.action])}>{log.action}</Pilula>
                    {['VIEW', 'VIEW_REPORT', 'READ'].includes(log.action) && (
                        <span className="font-mono text-[11px] text-muted-foreground">{pageViewFriendlyLabel(log) ?? endpointLabel(log.endpoint) ?? ''}</span>
                    )}
                    {citizenActionTarget(log) && (
                        <span className="text-xs font-bold text-success">{citizenActionTarget(log).toUpperCase()}</span>
                    )}
                    {log.action === 'READ' && log.new_values?.filtros && (
                        <span className="max-w-[320px] truncate rounded-full border border-border px-2 text-[10px]">
                            {Object.entries(log.new_values.filtros)
                                .filter(([, v]) => v !== '' && v != null)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            chave: 'recurso',
            titulo: 'Recurso',
            render: (log) => log.model_type
                ? <Pilula tom="neutro" contorno>{log.model_type.replace(/([A-Z])/g, ' $1').trim()}</Pilula>
                : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
            chave: 'id',
            titulo: 'ID',
            render: (log) => <span className="font-mono text-xs">{log.model_id ?? '—'}</span>,
        },
        {
            chave: 'ip',
            titulo: 'IP',
            render: (log) => (
                <span title={deviceDetails(log.client_info, log.ip_origin)}>
                    <span className="block font-mono text-xs">{log.ip_address}</span>
                    {log.ip_origin && <span className="block text-xs text-muted-foreground">{log.ip_origin}</span>}
                    {log.client_info && <span className="block text-xs text-muted-foreground">{deviceSummary(log.client_info)}</span>}
                </span>
            ),
        },
        {
            chave: 'detalhes',
            titulo: 'Detalhes',
            render: (log) => (
                <div className="flex items-center gap-1">
                    {(log.old_values || log.new_values) && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDetalhe(log)}>
                            ver <ChevronDown aria-hidden />
                        </Button>
                    )}
                    {log.action === 'UPDATE' && log.old_values && log.new_values && (
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => auditoriaPDF(log)} title="Baixar PDF desta alteração" aria-label="Baixar PDF desta alteração">
                            <Download />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const barra = (
        <div className="flex w-full flex-wrap items-end gap-3">
            <CampoSelecao id="aud-acao" label="Ação" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                <option value="">Todas</option>
                {ACOES.map(a => <option key={a} value={a}>{a}</option>)}
            </CampoSelecao>
            <CampoSelecao id="aud-recurso" label="Recurso" value={filters.model_type} onChange={e => setFilters(f => ({ ...f, model_type: e.target.value }))}>
                <option value="">Todos</option>
                {RECURSOS.map(m => <option key={m} value={m}>{m.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</option>)}
            </CampoSelecao>
            <CampoSelecao id="aud-usuario" label="Usuário" value={filters.user_name} onChange={e => setFilters(f => ({ ...f, user_name: e.target.value }))}>
                <option value="">Todos</option>
                {usuarios.map(u => <option key={u.user_id} value={u.user_name}>{u.user_name.toUpperCase()}</option>)}
            </CampoSelecao>
            <CampoTexto id="aud-de" label="De" type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            <CampoTexto id="aud-ate" label="Até" type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
            <Button type="button" onClick={handleFilter} aria-label="Filtrar"><Search aria-hidden /> Filtrar</Button>
            <Button type="button" variant="outline" onClick={handleReset} aria-label="Limpar filtros"><X aria-hidden /> Limpar</Button>
        </div>
    );

    return (
        <PaginaDeLista
            titulo={`Auditoria — ${total} registros`}
            barra={barra}
            colunas={colunas}
            linhas={logs}
            chaveDaLinha={(log) => log.id}
            vazio="Nenhum registro encontrado"
            rotuloDaTabela="registros de auditoria"
            paginacao={{
                total,
                pagina: page,
                porPagina: rowsPerPage,
                opcoes: [10, 25, 50, 100],
                aoMudarPagina: handlePage,
                aoMudarPorPagina: handleChangeRowsPerPage,
            }}
        >
            <Dialogo aberto={Boolean(detalhe)} aoFechar={() => setDetalhe(null)} tamanho="lg">
                <DialogoCabecalho>Detalhes do registro {detalhe?.id}</DialogoCabecalho>
                {detalhe && renderDiff(detalhe)}
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={() => setDetalhe(null)}>Fechar</Button>
                </DialogoRodape>
            </Dialogo>
        </PaginaDeLista>
    );
}
