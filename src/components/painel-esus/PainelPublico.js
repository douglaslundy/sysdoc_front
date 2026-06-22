import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AuthContext } from '../../contexts/AuthContext';
import { painelEsusApi, painelEsusPublicApi } from '../../services/painelEsusApi';

function Relogio() {
    const [hora, setHora] = useState('--:--:--');
    useEffect(() => {
        const tick = () =>
            setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return <span style={s.relogio}>{hora}</span>;
}

function tocarCampainha() {
    if (typeof window === 'undefined') return Promise.resolve();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return Promise.resolve();

    const ctx = new AudioContext();
    const tocarTom = (inicio, frequencia) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequencia, inicio);
        gain.gain.setValueAtTime(0.0001, inicio);
        gain.gain.exponentialRampToValueAtTime(0.35, inicio + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + 0.3);
    };

    const now = ctx.currentTime;
    tocarTom(now, 880);
    tocarTom(now + 0.34, 1046);

    return new Promise(resolve => {
        setTimeout(() => {
            ctx.close?.();
            resolve();
        }, 780);
    });
}

function falarChamada(cidadao, profissional) {
    return new Promise(resolve => {
        if (typeof window === 'undefined' || !window.speechSynthesis || !cidadao) {
            resolve(); return;
        }
        const nomeProfissional = profissional || 'profissional da unidade';
        const frase = `Chamando ${cidadao} você será atendido agora por ${nomeProfissional}`;
        const utterance = new window.SpeechSynthesisUtterance(frase);
        utterance.lang    = 'pt-BR';
        utterance.rate    = 0.81;
        utterance.pitch   = 1;
        utterance.volume  = 1;
        utterance.onend   = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    });
}

// validacao: null | 'loading' | { cnes, nome } | 'erro'
function FormCnes({ onConfirmar, initialCnes = '' }) {
    const [cnesInput, setCnesInput]   = useState(initialCnes);
    const [validacao, setValidacao]   = useState(null);
    const [erroMsg,   setErroMsg]     = useState('');

    const validar = useCallback((v) => {
        setValidacao('loading');
        setErroMsg('');
        painelEsusPublicApi.validarCnes(v)
            .then(d => setValidacao(d))
            .catch(err => {
                const msg = err?.response?.data?.error ?? 'Erro ao verificar o CNES. Tente novamente.';
                setErroMsg(msg);
                setValidacao('erro');
            });
    }, []);

    // Auto-valida quando CNES vier pré-preenchido da URL
    useEffect(() => {
        if (initialCnes) validar(initialCnes);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e) => {
        e.preventDefault();
        const v = cnesInput.trim();
        if (!v) return;
        validar(v);
    };

    return (
        <div style={s.formRoot}>
            <Head><title>Painel de Atendimento — eSUS PEC</title></Head>
            <div style={s.formBox}>
                <h1 style={s.formTitle}>Painel de Atendimento</h1>
                <p style={s.formSub}>Digite o CNES da unidade de saúde</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
                    <input
                        style={s.input}
                        value={cnesInput}
                        onChange={e => { setCnesInput(e.target.value); setValidacao(null); setErroMsg(''); }}
                        placeholder="Ex: 1234567"
                        maxLength={10}
                        autoFocus
                        disabled={validacao === 'loading'}
                    />
                    <button
                        type="submit"
                        style={{ ...s.btnPrimary, opacity: validacao === 'loading' ? 0.7 : 1, cursor: validacao === 'loading' ? 'default' : 'pointer' }}
                        disabled={validacao === 'loading'}
                    >
                        {validacao === 'loading' ? 'Verificando...' : 'Buscar'}
                    </button>
                </form>

                {validacao && validacao !== 'loading' && validacao !== 'erro' && (
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{validacao.nome}</div>
                        <div style={{ fontSize: 13, color: '#7ba4d9', marginBottom: 20 }}>CNES {validacao.cnes}</div>
                        <button
                            onClick={() => onConfirmar(validacao.cnes)}
                            style={{ ...s.btnPrimary, background: '#168821', fontSize: 16, padding: '12px 32px' }}
                        >
                            Confirmar e Entrar
                        </button>
                    </div>
                )}

                {validacao === 'erro' && (
                    <div style={{ marginTop: 16, color: '#fca5a5', fontSize: 14 }}>{erroMsg}</div>
                )}
            </div>
        </div>
    );
}

const s = {
    root:       { minHeight: '100vh', background: 'var(--lg-bg-app-from)', color: 'var(--lg-text-primary)', fontFamily: "'Segoe UI', Arial, sans-serif", display: 'flex', flexDirection: 'column' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'var(--lg-glass-topbar)', borderBottom: '1px solid var(--lg-border)' },
    unidadeNome:{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 },
    unidadeSub: { fontSize: 13, color: 'var(--lg-text-secondary)', marginTop: 2 },
    relogio:    { fontSize: 32, fontWeight: 300, fontVariantNumeric: 'tabular-nums', color: 'var(--lg-text-secondary)' },
    mainSection:{ padding: '32px 40px 16px', flex: '0 0 auto' },
    sectionLabel:{ fontSize: 11, letterSpacing: 3, color: 'var(--lg-text-muted)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' },
    emAtendimentoCard: { background: 'var(--lg-glass-panel)', border: '1px solid var(--lg-border)', borderRadius: 16, padding: '32px 40px', minHeight: 120, boxShadow: 'var(--lg-shadow-panel)' },
    cidadaoNome:{ fontSize: 48, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, textTransform: 'uppercase' },
    profissionalRow: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 },
    profissionalNome:{ fontSize: 20, color: 'var(--lg-text-secondary)', fontWeight: 500 },
    hrBadge:    { fontSize: 14, color: 'var(--lg-text-accent)', background: 'rgba(var(--lg-accent-rgb),0.12)', borderRadius: 8, padding: '3px 10px', fontVariantNumeric: 'tabular-nums' },
    semDados:   { fontSize: 22, color: 'var(--lg-text-muted)', fontStyle: 'italic' },
    ultimosSection: { padding: '8px 40px 32px', flex: 1 },
    ultimosGrid:{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 },
    ultimoCard: { background: 'var(--lg-glass-panel)', border: '1px solid var(--lg-border)', borderRadius: 12, padding: '16px 20px', minWidth: 220, flex: '1 1 200px', maxWidth: 300, boxShadow: 'var(--lg-shadow-panel)' },
    ultimoCidadao: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
    ultimoProf: { fontSize: 13, color: 'var(--lg-text-secondary)', marginBottom: 6 },
    ultimoHr:   { fontSize: 12, color: 'var(--lg-text-accent)', fontVariantNumeric: 'tabular-nums' },
    filaSection: { padding: '8px 40px 24px' },
    filaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 8 },
    filaCard: { background: 'var(--lg-glass-panel)', border: '1px solid var(--lg-border)', borderRadius: 12, padding: '14px 18px', boxShadow: 'var(--lg-shadow-panel)' },
    filaNome: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
    erroBar:    { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(var(--lg-danger-rgb),0.90)', color: '#fff', padding: '10px 24px', fontSize: 13 },
    formRoot:   { minHeight: '100vh', background: 'var(--lg-bg-app-from)', color: 'var(--lg-text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Arial, sans-serif" },
    formBox:    { background: 'var(--lg-glass-modal)', border: '1px solid var(--lg-border)', borderRadius: 20, padding: '48px', maxWidth: 480, width: '90%', textAlign: 'center', boxShadow: 'var(--lg-shadow-modal)' },
    formTitle:  { fontSize: 28, fontWeight: 700, margin: '0 0 8px' },
    formSub:    { color: 'var(--lg-text-secondary)', margin: '0 0 32px', fontSize: 15 },
    input:      { background: 'var(--lg-glass-input)', border: '1px solid var(--lg-border-input)', borderRadius: 10, color: 'var(--lg-text-primary)', fontSize: 20, padding: '12px 16px', flex: 1, outline: 'none', letterSpacing: 2, boxShadow: 'var(--lg-shadow-panel)' },
    btnPrimary: { background: 'linear-gradient(135deg, var(--lg-accent), #6D28D9)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, padding: '12px 24px', cursor: 'pointer', boxShadow: 'var(--lg-shadow-btn)' },
};

export default function PainelPublico() {
    const router              = useRouter();
    const { isAuthenticated, profile, permissionsLoaded } = useContext(AuthContext);
    const [cnes, setCnes]     = useState('');
    const [dados, setDados]   = useState(null);
    const [erro, setErro]     = useState(null);
    const pollingRef       = useRef(null);
    const abortRef         = useRef(null);
    const primeiraCargaRef = useRef(true);
    const anunciadosRef    = useRef(new Set()); // IDs já anunciados
    const filaRef          = useRef([]);         // fila de chamadas pendentes
    const processandoRef   = useRef(false);      // mutex da fila
    const autoCnesRef      = useRef(false);

    const handleConfirmar = useCallback((cnesConfirmado) => {
        primeiraCargaRef.current = true;
        anunciadosRef.current    = new Set();
        filaRef.current          = [];
        processandoRef.current   = false;
        router.push({ pathname: '/painel-esus', query: { cnes: cnesConfirmado } }, undefined, { shallow: true });
        setCnes(cnesConfirmado);
    }, [router]);

    useEffect(() => {
        if (!permissionsLoaded || !isAuthenticated || profile === 'admin' || cnes || autoCnesRef.current) {
            return;
        }

        autoCnesRef.current = true;
        painelEsusApi.defaultCnes()
            .then((data) => {
                if (data?.cnes) {
                    handleConfirmar(String(data.cnes));
                }
            })
            .catch(() => {
                autoCnesRef.current = false;
            });
    }, [permissionsLoaded, isAuthenticated, profile, cnes, handleConfirmar]);

    // Processa a fila de chamadas sequencialmente: campainha → fala → próxima
    const processarFila = useCallback(async () => {
        if (processandoRef.current || filaRef.current.length === 0) return;
        processandoRef.current = true;
        while (filaRef.current.length > 0) {
            const item = filaRef.current.shift();
            await tocarCampainha();
            await falarChamada(item.cidadao, item.profissional);
        }
        processandoRef.current = false;
    }, []);

    const fetchDados = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        painelEsusPublicApi
            .estado(cnes, { signal: ac.signal })
            .then(d => { setDados(d); setErro(null); })
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Não foi possível atualizar os dados. Tentando novamente...');
            });
    }, [cnes]);

    // Inicia polling quando CNES estiver definido
    useEffect(() => {
        if (!cnes) return;
        fetchDados();
        pollingRef.current = setInterval(fetchDados, 10000);
        return () => {
            clearInterval(pollingRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [cnes, fetchDados]);

    useEffect(() => {
        const recentes = dados?.chamados_recentes;
        if (!recentes || recentes.length === 0) return;

        // Na primeira carga apenas marca todos como já anunciados (sem falar)
        if (primeiraCargaRef.current) {
            primeiraCargaRef.current = false;
            recentes.forEach(r => anunciadosRef.current.add(r.id));
            return;
        }

        // Filtra apenas os novos (não anunciados ainda)
        // recentes vem do mais novo → mais antigo; invertemos para anunciar na ordem certa
        const novos = [...recentes]
            .reverse()
            .filter(r => !anunciadosRef.current.has(r.id));

        if (novos.length === 0) return;

        novos.forEach(r => {
            anunciadosRef.current.add(r.id);
            filaRef.current.push(r);
        });

        processarFila();
    }, [dados?.chamados_recentes, processarFila]);

    if (!cnes) {
        const initialCnes = router.isReady && router.query.cnes ? String(router.query.cnes) : '';
        return <FormCnes key={initialCnes} onConfirmar={handleConfirmar} initialCnes={initialCnes} />;
    }

    return (
        <div style={s.root}>
            <Head><title>Painel — {dados?.unidade ?? 'eSUS PEC'}</title></Head>

            {/* Header */}
            <div style={s.header}>
                <div>
                    <div style={s.unidadeNome}>{dados?.unidade ?? 'Carregando...'}</div>
                    <div style={s.unidadeSub}>CNES {cnes}</div>
                </div>
                <Relogio />
            </div>

            {/* Em Atendimento Agora */}
            <div style={s.mainSection}>
                <div style={s.sectionLabel}>Em Atendimento Agora</div>
                <div style={s.emAtendimentoCard}>
                    {dados?.em_atendimento ? (
                        <>
                            <div style={s.cidadaoNome}>{dados.em_atendimento.cidadao}</div>
                            <div style={s.profissionalRow}>
                                <span style={s.profissionalNome}>{dados.em_atendimento.profissional}</span>
                                <span style={s.hrBadge}>{dados.em_atendimento.hr_inicio}</span>
                            </div>
                        </>
                    ) : (
                        <div style={s.semDados}>
                            {dados ? 'Nenhum atendimento em andamento no momento' : 'Carregando...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Fila de Espera */}
            <div style={s.filaSection}>
                <div style={s.sectionLabel}>Fila de Espera</div>
                <div style={s.filaGrid}>
                    {dados?.aguardando?.length > 0 ? (
                        dados.aguardando.map((item, i) => (
                            <div key={`${item.cidadao}-${item.hr_inicio}-${i}`} style={s.filaCard}>
                                <div style={s.filaNome}>{item.cidadao}</div>
                                <div style={s.ultimoProf}>{item.profissional}</div>
                                <div style={s.ultimoHr}>{item.hr_inicio}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ ...s.semDados, fontSize: 16 }}>
                            {dados ? 'Nenhum paciente aguardando no momento' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* Últimos Atendidos */}
            <div style={s.ultimosSection}>
                <div style={s.sectionLabel}>Últimos Atendidos</div>
                <div style={s.ultimosGrid}>
                    {dados?.ultimos_atendidos?.length > 0 ? (
                        dados.ultimos_atendidos.map((item, i) => (
                            <div key={i} style={s.ultimoCard}>
                                <div style={s.ultimoCidadao}>{item.cidadao}</div>
                                <div style={s.ultimoProf}>{item.profissional}</div>
                                <div style={s.ultimoHr}>{item.hr_inicio}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ ...s.semDados, fontSize: 16 }}>
                            {dados ? 'Nenhum atendimento realizado hoje' : ''}
                        </div>
                    )}
                </div>
            </div>

            {erro && <div style={s.erroBar}>{erro}</div>}
        </div>
    );
}
