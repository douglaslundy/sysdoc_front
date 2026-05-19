export default function ExportButton({ data = [], filename = 'export', format = 'csv' }) {
  function exportar() {
    if (!data.length) return;
    if (format === 'csv') {
      const keys = Object.keys(data[0]);
      const linhas = [keys.join(';'), ...data.map(row => keys.map(k => String(row[k] ?? '')).join(';'))];
      const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` });
      a.click(); URL.revokeObjectURL(url);
    }
  }
  return (
    <button onClick={exportar} style={{
      padding: '6px 14px', background: '#1351B4', color: '#fff',
      border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
    }}>
      Exportar {format.toUpperCase()}
    </button>
  );
}
