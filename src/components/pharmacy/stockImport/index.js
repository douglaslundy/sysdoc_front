import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert, turnLoading } from '../../../store/ducks/Layout';

const summaryChip = (label, value, color = 'default') => (
  <Chip label={`${label}: ${value}`} color={color} variant="outlined" sx={{ mr: 1, mb: 1 }} />
);

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
        <td>${item.csv_name || '-'}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>-</td>
        <td>${item.reason || '-'}</td>
      </tr>
    `).join('');
    const ambiguousRows = (report.ambiguous_items || []).map((item) => `
      <tr>
        <td>Ambíguo</td>
        <td>${item.csv_name || '-'}</td>
        <td>${item.farmaco || '-'}</td>
        <td style="text-align:right;">${item.quantity ?? 0}</td>
        <td>${(item.candidates || []).map((candidate) => candidate.label).join(' | ') || '-'}</td>
        <td>${item.reason || '-'}</td>
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
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Medicamento CSV</th>
              <th>Fármaco</th>
              <th>Quantidade</th>
              <th>Candidatos</th>
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

  return (
    <Box sx={modalFormRootSx}>
      <BaseCard title="Importação de Estoque (CSV)">
        <AlertModal />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Button variant="outlined" onClick={handleDownloadCurrentStockBackup}>
            Baixar Backup do Estoque Atual (CSV)
          </Button>
          <Button variant="outlined" component="label">
            Selecionar CSV
            <input hidden type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {file ? file.name : 'Nenhum arquivo selecionado'}
          </Typography>
          <Button variant="contained" onClick={handleImport} disabled={!canImport}>
            Importar Estoque
          </Button>
        </Box>

        {report && (
          <Box>
            <Box sx={{ mb: 2 }}>
              {summaryChip('Data de referência', report.reference_date || '-')}
              {summaryChip('Linhas CSV', report.total_rows || 0)}
              {summaryChip('Itens agrupados', report.grouped_items || 0)}
              {summaryChip('Atualizados', report.updated_items || 0, 'success')}
              {summaryChip('Não conciliados', report.unmatched_items?.length || 0, (report.unmatched_items?.length || 0) > 0 ? 'warning' : 'default')}
              {summaryChip('Ambíguos', report.ambiguous_items?.length || 0, (report.ambiguous_items?.length || 0) > 0 ? 'warning' : 'default')}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handleDownloadPendingPdf} disabled={!hasPendingItems}>
                Baixar Relatório de Pendências (PDF)
              </Button>
            </Box>

            <Typography variant="h6" sx={{ mb: 1 }}>Itens Não Conciliados</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicamento CSV</TableCell>
                    <TableCell>Fármaco</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.unmatched_items || []).map((item, idx) => (
                    <TableRow key={`unmatched-${idx}`}>
                      <TableCell>{item.csv_name || '-'}</TableCell>
                      <TableCell>{item.farmaco || '-'}</TableCell>
                      <TableCell align="right">{item.quantity ?? 0}</TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(report.unmatched_items || []).length === 0 && (
                    <TableRow><TableCell colSpan={4}>Nenhum item.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 1 }}>Itens Ambíguos</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicamento CSV</TableCell>
                    <TableCell>Fármaco</TableCell>
                    <TableCell>Candidatos</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.ambiguous_items || []).map((item, idx) => (
                    <TableRow key={`ambiguous-${idx}`}>
                      <TableCell>{item.csv_name || '-'}</TableCell>
                      <TableCell>{item.farmaco || '-'}</TableCell>
                      <TableCell>{(item.candidates || []).map((candidate) => candidate.label).join(' | ') || '-'}</TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(report.ambiguous_items || []).length === 0 && (
                    <TableRow><TableCell colSpan={4}>Nenhum item.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </BaseCard>
    </Box>
  );
}
