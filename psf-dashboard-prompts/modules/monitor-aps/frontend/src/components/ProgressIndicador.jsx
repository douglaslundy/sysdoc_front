export default function ProgressIndicador({ valor = 0, metas = {}, altura = 12 }) {
  const { suficiente = 30, bom = 60, otimo = 80 } = metas;
  const cor =
    valor >= otimo     ? '#168821' :
    valor >= bom       ? '#1351B4' :
    valor >= suficiente? '#FF8C00' : '#E52207';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trilho */}
      <div style={{ background: '#e0e0e0', borderRadius: 6, height: altura, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(valor, 100)}%`, height: '100%', background: cor, borderRadius: 6, transition: 'width .4s' }} />
      </div>
      {/* Marcadores */}
      {[suficiente, bom, otimo].map((meta, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${meta}%`,
          width: 2, height: altura, background: '#555', opacity: 0.6,
        }} title={['Suficiente', 'Bom', 'Ótimo'][i] + `: ${meta}%`} />
      ))}
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#666', marginTop: 2 }}>
        <span>0%</span>
        <span style={{ marginLeft: `${suficiente}%` }}>{suficiente}%</span>
        <span>{bom}%</span>
        <span>{otimo}%</span>
      </div>
    </div>
  );
}
