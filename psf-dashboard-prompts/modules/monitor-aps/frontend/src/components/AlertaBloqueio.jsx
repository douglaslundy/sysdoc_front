export default function AlertaBloqueio({ equipe, motivo, tipo = 'proporcional' }) {
  const cor = tipo === 'total' ? '#E52207' : '#FF8C00';
  return (
    <div style={{
      border: `2px solid ${cor}`, borderRadius: 6, padding: '10px 14px',
      background: tipo === 'total' ? '#fff5f5' : '#fffbe6', marginBottom: 8,
    }}>
      <div style={{ fontWeight: 700, color: cor, fontSize: 13 }}>
        ⚠️ {tipo === 'total' ? 'Suspensão Total' : 'Suspensão Proporcional'}
        {' — '}{equipe}
      </div>
      <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>{motivo}</div>
    </div>
  );
}
