import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import AlertModal from '../../messagesModal';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../../store/ducks/Layout';
import { Button, buttonVariants } from '../../ui/button';
import { CabecalhoDePagina } from '../../ui/cabecalho-de-pagina';
import { DataTable } from '../../ui/data-table';
import { Pilula } from '../../ui/pilula';

export default function PharmacyStockImportManager() {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);

  const canImport = useMemo(() => !!file, [file]);
  const hasPendingItems = useMemo(
    () => (report?.unmatched_items?.length || 0) > 0 || (report?.ambiguous_items?.length || 0) > 0,
    [report]
  );

  const handleDownloadPendingPdf = () => {
    if (!report) return;
    const unmatchedRows = (report.unmatched_items || []).map((item) => `
      <tr>
        <td>Não conciliado</td>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>-</td>
        <td>${item.medicine_item_id_lido ?? '-'}</td>
        <td>${item.internal_code_lido || '-'}</td>
        <td>${item.reason || '-'}</td>
      </tr>
    `).join('');
    const ambiguousRows = (report.ambiguous_items || []).map((item) => `
      <tr>
        <td>Ambíguo</td>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>${(item.candidates || []).map((candidate) => candidate.label).join(' | ') || '-'}</td>
        <td>${item.reason || '-'}</td>
      </tr>
    `).join('');
    const importedRows = (report.imported_items || []).map((item) => `
      <tr>
        <td>${item.medicine_item_id ?? '-'}</td>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>${item.availability_status || '-'}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Relatório de Pendências - Importação de Estoque</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 8px; font-size: 20px; }
          p { margin: 4px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Relatório de Pendências da Importação de Estoque</h1>
        <p>Data de referência: ${report.reference_date || '-'}</p>
        <p>Itens não conciliados: ${(report.unmatched_items || []).length}</p>
        <p>Itens ambíguos: ${(report.ambiguous_items || []).length}</p>
        <p>Itens importados: ${(report.imported_items || []).length}</p>
        <h2 style="margin-top:16px;">Itens Importados</h2>
        <table>
          <thead>
            <tr>
              <th>ID Medicamento</th>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Quantidade</th>
              <th>Status Aplicado</th>
            </tr>
          </thead>
          <tbody>
            ${importedRows || '<tr><td colspan="5">Nenhum item importado.</td></tr>'}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Quantidade</th>
              <th>Candidatos</th>
              <th>medicine_item_id lido</th>
              <th>internal_code lido</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${unmatchedRows}
            ${ambiguousRows}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadImportReportPdf = () => {
    if (!report) return;

    const importedRows = (report.imported_items || []).map((item) => `
      <tr>
        <td>${item.medicine_item_id ?? '-'}</td>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>${item.availability_status || '-'}</td>
      </tr>
    `).join('');

    const unmatchedRows = (report.unmatched_items || []).map((item) => `
      <tr>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>${item.reason || '-'}</td>
      </tr>
    `).join('');

    const ambiguousRows = (report.ambiguous_items || []).map((item) => `
      <tr>
        <td>${formatMedicineWithConcentration(item.csv_name, item.concentration)}</td>
        <td>${item.farmaco || '-'}</td>
        <td>${(item.candidates || []).map((candidate) => candidate.label).join(' | ') || '-'}</td>
        <td>${item.reason || '-'}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Relatório de Importação de Estoque</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 8px; font-size: 20px; }
          h2 { margin: 20px 0 8px; font-size: 16px; }
          p { margin: 4px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Relatório de Importação de Estoque</h1>
        <p>Data de referência: ${report.reference_date || '-'}</p>
        <p>Total de linhas CSV: ${report.total_rows || 0}</p>
        <p>Itens agrupados: ${report.grouped_items || 0}</p>
        <p>Itens atualizados: ${report.updated_items || 0}</p>
        <p>Não conciliados: ${(report.unmatched_items || []).length}</p>
        <p>Ambíguos: ${(report.ambiguous_items || []).length}</p>

        <h2>Itens Importados</h2>
        <table>
          <thead>
            <tr>
              <th>ID Medicamento</th>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Quantidade</th>
              <th>Status Aplicado</th>
            </tr>
          </thead>
          <tbody>
            ${importedRows || '<tr><td colspan="5">Nenhum item importado.</td></tr>'}
          </tbody>
        </table>

        <h2>Itens Não Conciliados</h2>
        <table>
          <thead>
            <tr>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Quantidade</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${unmatchedRows || '<tr><td colspan="4">Nenhum item.</td></tr>'}
          </tbody>
        </table>

        <h2>Itens Ambíguos</h2>
        <table>
          <thead>
            <tr>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Candidatos</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${ambiguousRows || '<tr><td colspan="4">Nenhum item.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleImport = async () => {
    if (!file) {
      dispatch(addAlertMessage('Selecione um arquivo CSV antes de importar.'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    dispatch(turnLoading());
    try {
      const response = await api.post('/pharmacy/medicines/stock-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(response.data);
      dispatch(addMessage('Estoque importado com sucesso.'));
      dispatch(turnAlert());
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível importar o arquivo CSV.';
      dispatch(addAlertMessage(message));
    } finally {
      dispatch(turnLoading());
    }
  };

  const handleDownloadCurrentStockBackup = async () => {
    dispatch(turnLoading());
    try {
      const response = await api.get('/pharmacy/medicines/stock-import/current-stock', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-estoque-atual-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível baixar o backup do estoque atual.';
      dispatch(addAlertMessage(message));
    } finally {
      dispatch(turnLoading());
    }
  };

  const colunasImportados = [
    { chave: 'id', titulo: 'ID Medicamento', render: (item) => item.medicine_item_id ?? '-' },
    { chave: 'csv', titulo: 'Medicamento CSV', render: (item) => formatMedicineWithConcentration(item.csv_name, item.concentration) },
    { chave: 'farmaco', titulo: 'Fármaco', render: (item) => item.farmaco || '-' },
    { chave: 'qtd', titulo: 'Quantidade', numerica: true, render: (item) => item.quantity ?? 0 },
    { chave: 'status', titulo: 'Status Aplicado', render: (item) => item.availability_status || '-' },
  ];

  const colunasNaoConciliados = [
    { chave: 'csv', titulo: 'Medicamento CSV', render: (item) => formatMedicineWithConcentration(item.csv_name, item.concentration) },
    { chave: 'farmaco', titulo: 'Fármaco', render: (item) => item.farmaco || '-' },
    { chave: 'qtd', titulo: 'Quantidade', numerica: true, render: (item) => item.quantity ?? 0 },
    { chave: 'idlido', titulo: 'medicine_item_id lido', render: (item) => item.medicine_item_id_lido ?? '-' },
    { chave: 'codlido', titulo: 'internal_code lido', render: (item) => item.internal_code_lido || '-' },
    { chave: 'motivo', titulo: 'Motivo', render: (item) => item.reason || '-' },
  ];

  const colunasAmbiguos = [
    { chave: 'csv', titulo: 'Medicamento CSV', render: (item) => formatMedicineWithConcentration(item.csv_name, item.concentration) },
    { chave: 'farmaco', titulo: 'Fármaco', render: (item) => item.farmaco || '-' },
    { chave: 'candidatos', titulo: 'Candidatos', render: (item) => (item.candidates || []).map((candidate) => candidate.label).join(' | ') || '-' },
    { chave: 'motivo', titulo: 'Motivo', render: (item) => item.reason || '-' },
  ];

  return (
    <div className="ui-reset pharmacy-stockimport-page">
      <CabecalhoDePagina titulo="Importação de Estoque (CSV)" />
      <AlertModal />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={handleDownloadCurrentStockBackup}>
          Baixar Backup do Estoque Atual (CSV)
        </Button>
        <label className={`${buttonVariants({ variant: 'outline' })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25`}>
          Selecionar CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <p className="text-sm text-muted-foreground">{file ? file.name : 'Nenhum arquivo selecionado'}</p>
        <Button variant="success" onClick={handleImport} disabled={!canImport}>
          Importar Estoque
        </Button>
      </div>

      {report && (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <Pilula tom="neutro" contorno>{`Data de referência: ${report.reference_date || '-'}`}</Pilula>
            <Pilula tom="neutro" contorno>{`Linhas CSV: ${report.total_rows || 0}`}</Pilula>
            <Pilula tom="neutro" contorno>{`Itens agrupados: ${report.grouped_items || 0}`}</Pilula>
            <Pilula tom="sucesso" contorno>{`Atualizados: ${report.updated_items || 0}`}</Pilula>
            <Pilula tom="sucesso" contorno>{`Importados no relatório: ${report.imported_items?.length || 0}`}</Pilula>
            <Pilula tom={(report.unmatched_items?.length || 0) > 0 ? 'alerta' : 'neutro'} contorno>{`Não conciliados: ${report.unmatched_items?.length || 0}`}</Pilula>
            <Pilula tom={(report.ambiguous_items?.length || 0) > 0 ? 'alerta' : 'neutro'} contorno>{`Ambíguos: ${report.ambiguous_items?.length || 0}`}</Pilula>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="success" onClick={handleDownloadImportReportPdf}>
              Baixar Relatório de Importação (PDF)
            </Button>
            <Button variant="secondary" onClick={handleDownloadPendingPdf} disabled={!hasPendingItems}>
              Baixar Relatório de Pendências (PDF)
            </Button>
          </div>

          <section>
            <h3 className="mb-2 font-display text-base font-bold">Itens Importados</h3>
            <DataTable rotulo="itens importados" colunas={colunasImportados} linhas={report.imported_items || []} chaveDaLinha={(item) => `imported-${item.medicine_item_id}-${item.csv_name}`} vazio="Nenhum item." />
          </section>

          <section>
            <h3 className="mb-2 font-display text-base font-bold">Itens Não Conciliados</h3>
            <DataTable rotulo="itens não conciliados" colunas={colunasNaoConciliados} linhas={report.unmatched_items || []} chaveDaLinha={(item) => `unmatched-${item.csv_name}-${item.concentration}`} vazio="Nenhum item." />
          </section>

          <section>
            <h3 className="mb-2 font-display text-base font-bold">Itens Ambíguos</h3>
            <DataTable rotulo="itens ambíguos" colunas={colunasAmbiguos} linhas={report.ambiguous_items || []} chaveDaLinha={(item) => `ambiguous-${item.csv_name}-${item.concentration}`} vazio="Nenhum item." />
          </section>
        </div>
      )}
    </div>
  );
}
const formatMedicineWithConcentration = (medicineName, concentration) => {
    const name = String(medicineName || '').trim();
    if (!name) return '-';

    // Ex.: "6 mcg de fumarato de formoterol ... e 200 mcg de budesonida"
    // -> "Formoterol + Budesonida - 6/200 mcg"
    const comboPattern = /(\d+(?:[.,]\d+)?)\s*(mcg|mg|g|ml|ui)\s+de\s+(.+?)\s+e\s+(\d+(?:[.,]\d+)?)\s*(mcg|mg|g|ml|ui)\s+de\s+(.+)/i;
    const comboMatch = name.match(comboPattern);
    if (comboMatch) {
      const dose1 = comboMatch[1];
      const unit1 = comboMatch[2].toLowerCase();
      const med1 = comboMatch[3].replace(/di-hidratado|monoidratado|cloridrato|maleato/gi, '').trim();
      const dose2 = comboMatch[4];
      const unit2 = comboMatch[5].toLowerCase();
      const med2 = comboMatch[6].replace(/di-hidratado|monoidratado|cloridrato|maleato/gi, '').trim();
      const unit = unit1 === unit2 ? unit1 : `${unit1}/${unit2}`;
      const medA = med1.replace(/\bfumarato de\b/gi, '').trim();
      const medB = med2.trim();
      const titled = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      return `${titled(medA)} + ${titled(medB)} - ${dose1}/${dose2} ${unit}`;
    }

    const concentrationFromApi = String(concentration || '').trim();
    if (concentrationFromApi) {
      const normalizedConcentration = concentrationFromApi.replace(/\s+/g, ' ').trim();
      const escaped = normalizedConcentration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cleanedName = name.replace(new RegExp(escaped, 'i'), '').replace(/\s{2,}/g, ' ').trim();
      return cleanedName ? `${cleanedName} - ${normalizedConcentration}` : `${name} - ${normalizedConcentration}`;
    }

    const normalized = name.toUpperCase();
    const match = normalized.match(/\b\d+(?:[.,]\d+)?(?:\+\d+(?:[.,]\d+)?)?\s*(?:MG\/ML|MG\/G|MCG\/DOSE|MG\/DOSE|MCG|MG|G|ML|UI|%)\b/);
    if (!match) return name;

    const concentrationMatch = match[0].replace(/\s+/g, ' ').trim();
    const medicineOnly = name.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();

    return medicineOnly ? `${medicineOnly} - ${concentrationMatch}` : name;
};
