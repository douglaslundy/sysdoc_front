import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import generateCidadaosAcsPDF from '../../reports/cidadaosAcs';
import { isMonitorApsCanceled, monitorApsApi } from '../../services/monitorApsApi';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Paginacao } from '../ui/paginacao';
import { SeloAps } from './pecas';

const CHIP_CONDICOES = [
    { key: 'st_gestante', label: 'Gestante', cor: '#1351B4' },
    { key: 'st_has',      label: 'HAS',      cor: '#FF8C00' },
    { key: 'st_dm',       label: 'DM',       cor: '#7B2D8B' },
    { key: 'st_idoso',    label: 'Idoso',    cor: '#168821' },
    { key: 'st_obito',    label: 'Óbito',    cor: '#DC2626' },
];

const FILTROS_CONDICOES = [
    { value: 'gestante', label: 'Gestante' },
    { value: 'has', label: 'HAS' },
    { value: 'dm', label: 'DM' },
    { value: 'idoso', label: 'Idoso' },
    { value: 'obito', label: 'Óbito' },
];

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const formatCpf = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 11 || /^0+$/.test(digits)) return '--';
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatCns = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 15 || /^0+$/.test(digits)) return '--';
    return digits;
};

const formatIdade = (value) => {
    if (value == null) return '--';
    const idade = Number(value);
    if (!Number.isFinite(idade)) return '--';
    return `${idade} ${idade === 1 ? 'ano' : 'anos'}`;
};

const truncateText = (value, limit = 20) => {
    const text = String(value ?? '--');
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}...`;
};

const formatEquipe = (value) => {
    const text = String(value ?? '--');
    const parts = text.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ') : text;
};

const parseDateLikeToTs = (value) => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        const [d, m, y] = v.split('/').map(Number);
        return new Date(y, m - 1, d).getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
        const iso = v.slice(0, 10);
        return new Date(`${iso}T00:00:00`).getTime();
    }
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
};

const isTruthyCondition = (value) => (
    value === 1 ||
    value === '1' ||
    value === true ||
    value === 'true' ||
    value === 't' ||
    value === 'S' ||
    value === 's' ||
    value === 'sim' ||
    value === 'yes' ||
    value === 'y'
);

const isFilledDateLike = (value) => {
    if (value == null) return false;
    const v = String(value).trim();
    if (!v) return false;
    return /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{2}\/\d{2}\/\d{4}/.test(v);
};

const hasTruthyByPattern = (obj, pattern) => Object.entries(obj || {}).some(([key, value]) => {
    if (!pattern.test(String(key))) return false;
    if (value == null) return false;
    if (typeof value === 'object') return hasTruthyByPattern(value, pattern);
    if (isFilledDateLike(value)) return true;
    return isTruthyCondition(String(value).toLowerCase());
});

const isObitoCondition = (cidadao) => (
    isTruthyCondition(cidadao?.st_obito) ||
    isTruthyCondition(cidadao?.st_falecido) ||
    isTruthyCondition(cidadao?.obito) ||
    isTruthyCondition(cidadao?.falecido) ||
    isFilledDateLike(cidadao?.data_obito) ||
    isFilledDateLike(cidadao?.dt_obito) ||
    isFilledDateLike(cidadao?.data_falecimento) ||
    isFilledDateLike(cidadao?.dt_falecimento) ||
    hasTruthyByPattern(cidadao, /(condic|classif).*(obit|falec)|(obit|falec).*(condic|classif)/i) ||
    hasTruthyByPattern(cidadao, /(obit|falec)/i)
);

export default function CidadaosPage() {

    const [equipes,        setEquipes]        = useState([]);
    const [agentes,        setAgentes]        = useState([]);
    const [ine,            setIne]            = useState('');
    const [agenteCns,      setAgenteCns]      = useState('');
    const [condicao,       setCondicao]       = useState('');
    const [busca,          setBusca]          = useState('');
    const [multiDomicilio, setMultiDomicilio] = useState(false);
    // Campos de idade são rascunho; só valem (idadeMin/idadeMax) após clicar em Filtrar
    const [idadeMinTxt,    setIdadeMinTxt]    = useState('');
    const [idadeMaxTxt,    setIdadeMaxTxt]    = useState('');
    const [idadeMin,       setIdadeMin]       = useState('');
    const [idadeMax,       setIdadeMax]       = useState('');
    const [gerandoPdf,     setGerandoPdf]     = useState(false);
    const faixaInvalida = idadeMinTxt !== '' && idadeMaxTxt !== '' && Number(idadeMinTxt) > Number(idadeMaxTxt);
    const aplicarIdade = () => {
        if (faixaInvalida) return;
        setIdadeMin(idadeMinTxt);
        setIdadeMax(idadeMaxTxt);
        setPage(0);
    };
    const [cidadaos,  setCidadaos]  = useState([]);
    const [sortConfig, setSortConfig] = useState({ field: null, dir: 'asc' });
    const [meta,      setMeta]      = useState({ total: 0, page: 1, per_page: 50, pages: 0 });
    const [page,      setPage]      = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [loading,   setLoading]   = useState(false);
    const [erro,      setErro]      = useState(null);
    const debounceRef = useRef(null);
    const ctrlRef     = useRef(null);
    const requestRef  = useRef(0);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    // Carrega equipes conforme permissoes do usuario
    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
            return;
        }
        const ctrl = new AbortController();
        monitorApsApi.get('/config/equipes', { signal: ctrl.signal })
            .then(d => setEquipes(d.equipes ?? []))
            .catch(e => { if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro no servidor ao carregar a lista de equipes.'); });
        return () => ctrl.abort();
    }, [isRestrito, minhasEquipes, loadingPerms]);

    // Carrega agentes quando equipe muda
    useEffect(() => {
        setAgenteCns('');
        const ctrl = new AbortController();
        const params = new URLSearchParams();
        if (ine) params.set('ine', ine);
        monitorApsApi.get(`/cidadaos/agentes?${params}`, { signal: ctrl.signal })
            .then(d => setAgentes(d.agentes ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, [ine]);

    const fetchCidadaos = useCallback((overridePage = 0) => {
        if (ctrlRef.current) ctrlRef.current.abort();
        const ctrl = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        ctrlRef.current = ctrl;

        const params = new URLSearchParams({ page: overridePage + 1, per_page: rowsPerPage });
        if (ine)               params.set('ine', ine);
        if (agenteCns)         params.set('agente_cns', agenteCns);
        if (condicao)          params.set('condicao', condicao);
        if (busca.length >= 3) params.set('busca', busca);
        if (multiDomicilio)    params.set('multi_domicilio', '1');
        if (idadeMin !== '') params.set('idade_min', idadeMin);
        if (idadeMax !== '') params.set('idade_max', idadeMax);
        if (sortConfig.field === 'idade') {
            params.set('sort', 'idade');
            params.set('dir', sortConfig.dir);
        }

        setLoading(true);
        setErro(null);
        setCidadaos([]);
        setMeta({ total: 0, page: overridePage + 1, per_page: rowsPerPage, pages: 0 });
        monitorApsApi.get(`/cidadaos?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== requestRef.current || ctrl.signal.aborted) return;
                setCidadaos(d.cidadaos ?? []);
                setMeta(d.meta ?? { total: 0, page: 1, per_page: 50, pages: 0 });
            })
            .catch(e => {
                if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar cidadãos.');
            })
            .finally(() => {
                if (requestId === requestRef.current && !ctrl.signal.aborted) setLoading(false);
            });
    }, [ine, agenteCns, condicao, busca, multiDomicilio, idadeMin, idadeMax, sortConfig.field, sortConfig.dir, rowsPerPage]);

    // Fetch com debounce de 400ms para campos de texto (busca e faixa de idade)
    useEffect(() => {
        setPage(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCidadaos(0), busca ? 400 : 0);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ine, agenteCns, condicao, busca, multiDomicilio, idadeMin, idadeMax, sortConfig.field, sortConfig.dir, rowsPerPage]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchCidadaos(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        setPage(0);
    };

    useEffect(() => {
        if (condicao === 'obito' && !sortConfig.field) {
            setSortConfig({ field: 'obito', dir: 'asc' });
        }
        if (condicao !== 'obito' && sortConfig.field === 'obito') {
            setSortConfig({ field: null, dir: 'asc' });
        }
    }, [condicao, sortConfig.field]);

    const toggleSort = (field) => {
        setPage(0);
        setSortConfig(prev => (
            prev.field === field
                ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { field, dir: 'asc' }
        ));
    };

    // Busca todas as páginas do resultado atual (API limita 200 por página) e gera o PDF
    const gerarPdf = async () => {
        setGerandoPdf(true);
        try {
            const base = new URLSearchParams({ per_page: 200 });
            if (ine)               base.set('ine', ine);
            if (agenteCns)         base.set('agente_cns', agenteCns);
            if (condicao)          base.set('condicao', condicao);
            if (busca.length >= 3) base.set('busca', busca);
            if (multiDomicilio)    base.set('multi_domicilio', '1');
            if (idadeMin !== '')   base.set('idade_min', idadeMin);
            if (idadeMax !== '')   base.set('idade_max', idadeMax);
            if (sortConfig.field === 'idade') { base.set('sort', 'idade'); base.set('dir', sortConfig.dir); }

            let todos = [];
            let pagina = 1;
            let paginas = 1;
            do {
                base.set('page', pagina);
                const d = await monitorApsApi.get(`/cidadaos?${base}`);
                todos = todos.concat(d.cidadaos ?? []);
                paginas = d.meta?.pages ?? 1;
                pagina += 1;
            } while (pagina <= paginas);

            const linhas = todos.map(c => ({
                nome: c.nome,
                cpf: formatCpf(c.cpf),
                cns: formatCns(c.cns),
                idade: formatIdade(c.idade),
                equipe: formatEquipe(c.no_equipe),
                agente: multiDomicilio ? (c.domicilios ?? '--').split(' | ').join('; ') : (c.agente ?? '--'),
                condicoes: CHIP_CONDICOES
                    .filter(({ key }) => (key === 'st_obito' ? isObitoCondition(c) : isTruthyCondition(c[key])))
                    .map(({ label }) => label).join(', '),
            }));

            const eq = equipes.find(e => e.nu_ine === ine);
            const ag = agentes.find(a => (a.agente_cns ?? '') === agenteCns);
            let faixaIdade = null;
            if (idadeMin !== '' && idadeMax !== '') faixaIdade = `${idadeMin} a ${idadeMax} anos`;
            else if (idadeMin !== '') faixaIdade = `a partir de ${idadeMin} anos`;
            else if (idadeMax !== '') faixaIdade = `até ${idadeMax} anos`;

            await generateCidadaosAcsPDF({
                cidadaos: linhas,
                filtros: {
                    equipeNome: eq ? equipeLabel(eq.no_equipe) : null,
                    agenteNome: ag?.nome ?? null,
                    condicaoLabel: FILTROS_CONDICOES.find(f => f.value === condicao)?.label ?? null,
                    faixaIdade,
                    busca: busca.length >= 3 ? busca : null,
                    multiDomicilio,
                },
            });
        } catch (e) {
            if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro ao gerar o PDF.');
        } finally {
            setGerandoPdf(false);
        }
    };

    const cidadaosSorted = useMemo(() => {
        if (!sortConfig.field) return cidadaos;
        if (sortConfig.field !== 'obito') return cidadaos;
        const mult = sortConfig.dir === 'desc' ? -1 : 1;
        return [...cidadaos].sort((a, b) => {
            if (sortConfig.field === 'obito') {
                const ta = parseDateLikeToTs(a?.data_obito ?? a?.dt_obito);
                const tb = parseDateLikeToTs(b?.data_obito ?? b?.dt_obito);
                if (ta == null && tb == null) return 0;
                if (ta == null) return 1;
                if (tb == null) return -1;
                return (ta - tb) * mult;
            }
            return 0;
        });
    }, [cidadaos, sortConfig]);

    const indicadorDeOrdem = (campo) => (sortConfig.field === campo && sortConfig.dir === 'desc' ? '↓' : '↑');
    const rotuloDeOrdem = (campo, nome) => `Ordenar ${nome} ${sortConfig.field === campo && sortConfig.dir === 'asc' ? 'decrescente' : 'crescente'}`;
    const comObito = condicao === 'obito';

    const colunas = [
        { chave: 'n', titulo: '#', render: (c, i) => <span className="text-[11px] text-muted-foreground">{(page * rowsPerPage) + i + 1}</span> },
        {
            chave: 'nome',
            titulo: 'Nome',
            render: (c) => (
                <>
                    <span className="block text-sm font-semibold" title={c.nome ?? '--'}>{truncateText(c.nome, 30)}</span>
                    <span className="block text-xs text-muted-foreground">{c.data_atualizacao ?? '--'}</span>
                </>
            ),
        },
        {
            chave: 'doc',
            titulo: 'CPF / CNS',
            render: (c) => (
                <span className="font-mono text-xs">
                    <span className="block">{formatCpf(c.cpf)}</span>
                    <span className="mt-0.5 block text-muted-foreground">{formatCns(c.cns)}</span>
                </span>
            ),
        },
        {
            chave: 'idade',
            titulo: (
                <span className="flex items-center gap-1">
                    Idade
                    <button type="button" aria-label={rotuloDeOrdem('idade', 'idade')} onClick={() => toggleSort('idade')} className="rounded px-1 text-xs font-bold hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none">
                        {indicadorDeOrdem('idade')}
                    </button>
                </span>
            ),
            render: (c) => <span className="text-xs">{formatIdade(c.idade)}</span>,
        },
        { chave: 'equipe', titulo: 'Equipe', render: (c) => <span className="text-sm" title={c.no_equipe ?? '--'}>{truncateText(formatEquipe(c.no_equipe), 15)}</span> },
        {
            chave: 'agente',
            titulo: multiDomicilio ? 'Domicílios' : 'Agente',
            render: (c) => (multiDomicilio ? (
                <span className="block max-w-[260px] text-[11px] leading-relaxed whitespace-pre-wrap" title={c.domicilios ?? '--'}>
                    {c.domicilios
                        ? c.domicilios.split(' | ').map((d, i) => <span key={i} className="block">- {d}</span>)
                        : '--'}
                </span>
            ) : (
                <span className="text-sm" title={c.agente ?? '--'}>{truncateText(c.agente, 25)}</span>
            )),
        },
        {
            chave: 'condicoes',
            titulo: 'Condições',
            render: (c) => (
                <span className="flex flex-wrap gap-1">
                    {CHIP_CONDICOES.map(({ key, label, cor }) =>
                        (key === 'st_obito' ? isObitoCondition(c) : isTruthyCondition(c[key])) ? (
                            <SeloAps key={key} cor={cor}>{label}</SeloAps>
                        ) : null
                    )}
                </span>
            ),
        },
        ...(comObito ? [
            {
                chave: 'dataObito',
                titulo: (
                    <span className="flex items-center gap-1">
                        Data óbito
                        <button type="button" aria-label={rotuloDeOrdem('obito', 'data de obito')} onClick={() => toggleSort('obito')} className="rounded px-1 text-xs font-bold hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none">
                            {indicadorDeOrdem('obito')}
                        </button>
                    </span>
                ),
                render: (c) => <span className="text-xs">{isObitoCondition(c) ? (c.data_obito ?? c.dt_obito ?? '--') : '--'}</span>,
            },
            { chave: 'fonteObito', titulo: 'Fonte óbito', render: (c) => <span className="text-xs text-muted-foreground">{isObitoCondition(c) ? (c.fonte_obito ?? '--') : '--'}</span> },
        ] : []),
    ];

    return (
        <div className="ui-reset monitor-aps-cidadaos-page">
            <CabecalhoDePagina
                titulo={`Cidadãos (${meta.total.toLocaleString('pt-BR')})`}
            />

            <div className="mb-4 flex flex-wrap items-end gap-3">
                <CampoDeBusca
                    className="min-w-[260px] flex-[1_1_320px]"
                    rotulo="Buscar cidadão"
                    placeholder="Buscar: Nome, CPF ou CNS"
                    autoComplete="off"
                    name="search"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                />
                <CampoSelecao id="cid-equipe" label="Equipe" value={ine}
                    onChange={e => { setIne(e.target.value); setPage(0); }}
                    disabled={isRestrito && equipes.length === 1}
                    className="min-w-[220px]">
                    <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                    {equipes.map(eq => (
                        <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                    ))}
                </CampoSelecao>
                <CampoSelecao id="cid-agente" label="Agente" value={agenteCns}
                    onChange={e => { setAgenteCns(e.target.value); setPage(0); }}
                    className="min-w-[200px]">
                    <option value="">Todos os agentes</option>
                    {agentes.map(a => (
                        <option key={a.agente_cns ?? a.id ?? a.nome} value={a.agente_cns ?? ''}>{a.nome}</option>
                    ))}
                </CampoSelecao>
                <CampoSelecao id="cid-condicao" label="Condição" value={condicao}
                    onChange={e => { setCondicao(e.target.value); setPage(0); }}
                    className="min-w-[180px]">
                    <option value="">Todas</option>
                    {FILTROS_CONDICOES.map(item => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                </CampoSelecao>
                <div className="w-[110px]">
                    <CampoTexto
                        id="cid-idade-de"
                        type="number"
                        label="Idade de"
                        value={idadeMinTxt}
                        erro={faixaInvalida ? ' ' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter') aplicarIdade(); }}
                        onChange={e => setIdadeMinTxt(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        min={0}
                        max={130}
                        inputMode="numeric"
                    />
                </div>
                <div className="w-[110px]">
                    <CampoTexto
                        id="cid-idade-ate"
                        type="number"
                        label="até"
                        value={idadeMaxTxt}
                        erro={faixaInvalida ? 'Inicial maior que final' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter') aplicarIdade(); }}
                        onChange={e => setIdadeMaxTxt(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        min={0}
                        max={130}
                        inputMode="numeric"
                    />
                </div>
                <Button onClick={aplicarIdade} disabled={faixaInvalida}>Filtrar</Button>
                <Button variant="outline" onClick={gerarPdf} disabled={gerandoPdf || loading || meta.total === 0}>
                    {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF'}
                </Button>
                <Button
                    variant={multiDomicilio ? 'default' : 'outline'}
                    aria-pressed={multiDomicilio}
                    title="Exibe apenas cidadãos vinculados a mais de um domicílio e substitui a coluna Agente pelos domicílios"
                    onClick={() => { setMultiDomicilio(v => !v); setPage(0); }}
                >
                    Múltiplos domicílios
                </Button>
            </div>
            {isRestrito && !loadingPerms && equipes.length === 0 && (
                <div className="mb-4">
                    <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                </div>
            )}

            {erro && <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div>}
            <DataTable
                rotulo="cidadãos"
                colunas={colunas}
                linhas={cidadaosSorted}
                chaveDaLinha={(c) => c.co_fat_cidadao_pec ?? `${c.cpf}-${c.cns}-${c.nome}`}
                carregando={loading}
                vazio={erro ? '' : 'Nenhum cidadão encontrado com os filtros aplicados.'}
            />
            <Paginacao
                total={meta.total}
                pagina={page}
                porPagina={rowsPerPage}
                opcoes={[10, 25, 50, 100]}
                aoMudarPagina={(newPage) => handlePageChange(null, newPage)}
                aoMudarPorPagina={(n) => handleChangeRowsPerPage({ target: { value: String(n) } })}
            />
        </div>
    );
}