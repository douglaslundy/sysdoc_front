import { useEffect, useState } from 'react';
import { monitorApsApi } from '../services/monitorApsApi';
import ClassificacaoBadge from '../components/ClassificacaoBadge';
import ExportButton from '../components/ExportButton';

export default function VinculoTerritorial() {
  const [ano, setAno]   = useState(2025);
  const [quad, setQuad] = useState(2);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setLoading(true);
    monitorApsApi.getVinculo(ano, quad)
      .then(d => setData(d.equipes))
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [ano, quad]);

  const totais = data?.reduce((acc, e) => ({
    individuais: acc.individuais + e.cadastros.individuais,
    domiciliares: acc.domiciliares + e.cadastros.domiciliares,
    criancas:  acc.criancas  + e.grupos_prioritarios.criancas_0_5,
    idosos:    acc.idosos    + e.grupos_prioritarios.idosos_60_mais,
    bolsa:     acc.bolsa     + e.grupos_prioritarios.bolsa_familia,
    bpc:       acc.bpc       + e.grupos_prioritarios.bpc,
  }), { individuais:0, domiciliares:0, criancas:0, idosos:0, bolsa:0, bpc:0 });

  const exportData = data?.map(e => ({
    ine: e.ine, nome: e.nome, tipo: e.tipo,
    cadastros_ind: e.cadastros.individuais,
    cadastros_dom: e.cadastros.domiciliares,
    pct_completude: e.cadastros.pct_completude,
    pontuacao: e.cadastros.pontuacao,
    classificacao: e.classificacao,
  }));

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:20, color:'#1351B4' }}>Vínculo e Acompanhamento Territorial</h1>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={sel}>
            {[2023,2024,2025].map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={quad} onChange={e => setQuad(Number(e.target.value))} style={sel}>
            {[1,2,3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
          </select>
          <ExportButton data={exportData ?? []} filename="vinculo-territorial" />
        </div>
      </div>

      {erro    && <div style={errStyle}>Erro: {erro}</div>}
      {loading && <div style={{ textAlign:'center', color:'#888', padding:40 }}>Carregando...</div>}

      {!loading && data && (
        <>
          {/* Cards de totais */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            <Card label="Cadastros Individuais" valor={totais.individuais} />
            <Card label="Com Cadastro Domiciliar" valor={totais.domiciliares} />
            <Card label="Crianças < 5 anos" valor={totais.criancas} />
            <Card label="Idosos ≥ 60 anos" valor={totais.idosos} />
          </div>

          {/* Grupos prioritários */}
          <div style={sectionStyle}>
            <h3 style={h3Style}>Grupos Prioritários</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              <GrupoBar label="👶 Crianças < 5 anos" total={totais.individuais} valor={totais.criancas} cor="#1351B4" />
              <GrupoBar label="👴 Idosos ≥ 60 anos"  total={totais.individuais} valor={totais.idosos}   cor="#0072B7" />
              <GrupoBar label="💰 Bolsa Família"       total={totais.individuais} valor={totais.bolsa}   cor="#FF8C00" />
              <GrupoBar label="♿ BPC"                  total={totais.individuais} valor={totais.bpc}    cor="#168821" />
            </div>
          </div>

          {/* Tabela por equipe */}
          <div style={sectionStyle}>
            <h3 style={h3Style}>Detalhamento por Equipe</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f5f5f5' }}>
                  {['INE','Equipe','Tipo','Cad. Ind.','Cad. Dom.','Completude','Pontuação','Classif.']
                    .map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map(e => (
                  <tr key={e.ine} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={td}>{e.ine}</td>
                    <td style={td}>{e.nome}</td>
                    <td style={td}>{e.tipo}</td>
                    <td style={td}>{e.cadastros.individuais}</td>
                    <td style={td}>{e.cadastros.domiciliares}</td>
                    <td style={td}>{e.cadastros.pct_completude}%</td>
                    <td style={td}>{e.cadastros.pontuacao}</td>
                    <td style={td}><ClassificacaoBadge classificacao={e.classificacao} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const Card = ({ label, valor }) => (
  <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:14 }}>
    <div style={{ fontSize:11, color:'#888' }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color:'#1351B4' }}>{valor}</div>
  </div>
);

const GrupoBar = ({ label, total, valor, cor }) => {
  const pct = total > 0 ? Math.round(valor/total*100) : 0;
  return (
    <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:6, padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
        <span>{label}</span>
        <span style={{ fontWeight:700, color:cor }}>{valor} ({pct}%)</span>
      </div>
      <div style={{ background:'#e0e0e0', borderRadius:4, height:8 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:cor, borderRadius:4, transition:'width .4s' }} />
      </div>
    </div>
  );
};

const sectionStyle = { background:'#fff', border:'1px solid #e0e0e0', borderRadius:8, padding:16, marginBottom:16 };
const h3Style   = { margin:'0 0 12px', fontSize:14, color:'#333' };
const sel       = { border:'1px solid #ccc', borderRadius:4, padding:'4px 8px', fontSize:13 };
const errStyle  = { background:'#fff0f0', border:'1px solid #E52207', borderRadius:6, padding:12, color:'#E52207', marginBottom:16 };
const th = { padding:'8px 10px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #ddd', fontSize:12 };
const td = { padding:'7px 10px' };
