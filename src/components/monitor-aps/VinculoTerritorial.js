import { useEffect, useRef, useState } from 'react';
import { Download, Heart, Home, User, Users } from 'lucide-react';
import { equipeLabel } from '../../utils/equipeLabel';
import BaseCard from '../baseCard/BaseCard';
import { monitorApsApi, isMonitorApsCanceled } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../ui/campos';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';
import { Grade } from '../ui/grade';
import { Pilula } from '../ui/pilula';
import { MetricaAps, SeloAps } from './pecas';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };

function GrupoBar({ label, total, valor, cor }) {
    const pct = total > 0 ? Math.round(valor / total * 100) : 0;
    return (
        <div className="mb-3">
            <div className="mb-1 flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-bold" style={{ color: cor }}>{valor?.toLocaleString('pt-BR')} ({pct}%)</span>
            </div>
            <div
                role="progressbar"
                aria-label={label}
                aria-valuenow={Math.min(pct, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: `${cor}22` }}
            >
                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cor }} />
            </div>
        </div>
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
    const requestRef = useRef(0);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    useMonitorApsAudit('/monitor-aps/vinculo', 'Monitor APS - Vínculo Territorial', { ano, quadrimestre: quad, equipe: ine });

    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
            return;
        }
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(e => { if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro no servidor ao carregar a lista de equipes.'); });
    }, [isRestrito, minhasEquipes, loadingPerms]);

    useEffect(() => {
        const ctrl = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;

        setLoading(true);
        setErro(null);
        setData([]);
        const params = `/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}${ine ? `&ine=${ine}` : ''}`;
        monitorApsApi.get(params, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== requestRef.current) return;
                setData(d.equipes ?? []);
            })
            .catch(e => {
                if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar o vínculo territorial.');
            })
            .finally(() => {
                if (requestId === requestRef.current) setLoading(false);
            });

        return () => ctrl.abort();
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

    if (loading) return <Carregando className="min-h-[300px] justify-center">Carregando vínculo territorial...</Carregando>;
    if (erro) return <div className="p-6"><Banner tom="perigo">Erro ao carregar vínculo territorial: {erro}</Banner></div>;

    const colunas = [
        {
            chave: 'equipe',
            titulo: 'Equipe',
            render: (e) => (
                <>
                    <span className="block max-w-[220px] truncate text-sm font-semibold">{e.nome}</span>
                    <span className="block text-xs text-muted-foreground">{e.ine}</span>
                </>
            ),
        },
        { chave: 'tipo', titulo: 'Tipo', render: (e) => <Pilula tom="neutro" contorno>{e.tipo}</Pilula> },
        { chave: 'ind', titulo: 'Ind.', numerica: true, render: (e) => e.cadastros?.individuais?.toLocaleString('pt-BR') },
        { chave: 'dom', titulo: 'Dom.', numerica: true, render: (e) => e.cadastros?.domiciliares?.toLocaleString('pt-BR') },
        { chave: 'completude', titulo: 'Completude', numerica: true, render: (e) => `${e.cadastros?.pct_completude}%` },
        { chave: 'classif', titulo: 'Classif.', render: (e) => <SeloAps cor={COR[e.classificacao] || '#888'}>{LABEL[e.classificacao] ?? '—'}</SeloAps> },
    ];

    const filtros = (
        <>
            <CampoSelecao id="vinc-ano" label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))} className="min-w-[100px]">
                {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a}>{a}</option>)}
            </CampoSelecao>
            <CampoSelecao id="vinc-quad" label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))} className="min-w-[120px]">
                {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
            </CampoSelecao>
            {equipes.length > 0 && (
                <CampoSelecao id="vinc-equipe" label="Equipe" value={ine} onChange={e => setIne(e.target.value)} disabled={isRestrito && equipes.length === 1} className="max-w-[220px]">
                    <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                    {equipes.map(eq => (
                        <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                    ))}
                </CampoSelecao>
            )}
            <Button variant="outline" size="sm" onClick={() => exportarCSV(csvData, `vinculo-${ano}-q${quad}`)}>
                <Download /> Exportar CSV
            </Button>
        </>
    );

    return (
        <div className="monitor-aps-page">
            <CabecalhoDePagina titulo="Vínculo e Acompanhamento Territorial" acoes={filtros} />
            {isRestrito && !loadingPerms && equipes.length === 0 && (
                <div className="mb-4">
                    <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                </div>
            )}

            {/* Cards de totais */}
            <Grade container spacing={2} mb={3}>
                <Grade item xs={6} sm={3}><MetricaAps Icone={Users} titulo="Cadastros Individuais" valor={totais.individuais.toLocaleString('pt-BR')} cor="#1351B4" /></Grade>
                <Grade item xs={6} sm={3}><MetricaAps Icone={Home} titulo="Com Cadastro Domiciliar" valor={totais.domiciliares.toLocaleString('pt-BR')} cor="#0072B7" /></Grade>
                <Grade item xs={6} sm={3}><MetricaAps Icone={Heart} titulo="Crianças < 5 anos" valor={totais.criancas.toLocaleString('pt-BR')} cor="#FF8C00" /></Grade>
                <Grade item xs={6} sm={3}><MetricaAps Icone={User} titulo="Idosos ≥ 60 anos" valor={totais.idosos.toLocaleString('pt-BR')} cor="#168821" /></Grade>
            </Grade>

            <Grade container spacing={3}>
                {/* Grupos prioritários */}
                <Grade item xs={12} md={5}>
                    <BaseCard title="Grupos Prioritários">
                        <GrupoBar label="👶 Crianças < 5 anos" total={totais.individuais} valor={totais.criancas} cor="#1351B4" />
                        <GrupoBar label="👴 Idosos ≥ 60 anos"  total={totais.individuais} valor={totais.idosos}   cor="#0072B7" />
                        <GrupoBar label="💰 Bolsa Família"      total={totais.individuais} valor={totais.bolsa}    cor="#FF8C00" />
                        <GrupoBar label="♿ BPC"                 total={totais.individuais} valor={totais.bpc}      cor="#168821" />
                    </BaseCard>
                </Grade>

                {/* Tabela por equipe */}
                <Grade item xs={12} md={7}>
                    <BaseCard title={`Detalhamento por Equipe (${data.length} equipes)`}>
                        <DataTable rotulo="detalhamento por equipe" colunas={colunas} linhas={data} chaveDaLinha={(e) => e.ine} vazio="Sem equipes." />
                    </BaseCard>
                </Grade>
            </Grade>
        </div>
    );
}