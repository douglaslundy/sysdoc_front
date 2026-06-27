import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import { AuthContext } from '../../contexts/AuthContext';
import { modalFormRootSx, modalPrimaryButtonSx, modalSecondaryButtonSx, modalShellSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';

const initialForm = {
  id: null,
  document_type_id: '',
  titulo: '',
  resumo: '',
  sigilo: 'publico',
  status: 'rascunho',
};

const SIGILO_LABELS = {
  publico: 'Público',
  interno: 'Interno',
  restrito: 'Restrito/Sigiloso',
};

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
};

export default function Documentos() {
  const { profile } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ document_type_id: '', sigilo: '', status: '' });
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', onConfirm: null });
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [versionFile, setVersionFile] = useState(null);

  const loadTypes = async () => {
    const res = await api.get('/documentos/tipos');
    setTypes(res.data || []);
  };

  const loadDocuments = async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
    setLoading(true);
    try {
      const params = {
        page: nextPage + 1,
        per_page: nextRowsPerPage,
        search: search || undefined,
        document_type_id: filters.document_type_id || undefined,
        sigilo: filters.sigilo || undefined,
        status: filters.status || undefined,
      };
      const res = await api.get('/documentos', { params });
      setDocuments(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Erro ao carregar documentos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadTypes();
      await loadDocuments(0, rowsPerPage);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTypes = useMemo(() => types.filter((type) => type.ativo !== false), [types]);

  const openNew = () => {
    setForm(initialForm);
    setFile(null);
    setCurrentDocument(null);
    setIsModalOpen(true);
  };

  const openEdit = (doc) => {
    setForm({
      id: doc.id,
      document_type_id: doc.document_type_id || '',
      titulo: doc.titulo || '',
      resumo: doc.resumo || '',
      sigilo: doc.sigilo || 'publico',
      status: doc.status || 'rascunho',
    });
    setFile(null);
    setCurrentDocument(doc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setFile(null);
    setCurrentDocument(null);
  };

  const saveDocument = async () => {
    const payload = new FormData();
    payload.append('document_type_id', form.document_type_id || '');
    payload.append('titulo', form.titulo || '');
    payload.append('resumo', form.resumo || '');
    payload.append('sigilo', form.sigilo || 'publico');
    payload.append('status', form.status || 'rascunho');
    if (file) {
      payload.append('arquivo', file);
    }

    try {
      if (form.id) {
        payload.append('_method', 'PUT');
        await api.post(`/documentos/${form.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/documentos', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setAlertState({
        visible: true,
        type: 'success',
        message: form.id ? 'Documento atualizado com sucesso.' : 'Documento cadastrado com sucesso.',
      });
      closeModal();
      await loadDocuments();
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível salvar o documento.' });
    }
  };

  const openVersions = async (doc) => {
    setCurrentDocument(doc);
    setVersionFile(null);
    setVersionsOpen(true);
    setVersionsLoading(true);
    try {
      const res = await api.get(`/documentos/${doc.id}/versoes`);
      setVersions(res.data || []);
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível carregar as versões.' });
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleDownloadVersion = async (version) => {
    if (!currentDocument?.id) return;
    const response = await api.get(`/documentos/${currentDocument.id}/versoes/${version.id}/download`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: version.mime_type || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = version.original_name || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUploadVersion = async () => {
    if (!currentDocument?.id || !versionFile) return;

    const payload = new FormData();
    payload.append('arquivo', versionFile);

    try {
      await api.post(`/documentos/${currentDocument.id}/versoes`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAlertState({ visible: true, type: 'success', message: 'Nova versão enviada com sucesso.' });
      setVersionFile(null);
      const res = await api.get(`/documentos/${currentDocument.id}/versoes`);
      setVersions(res.data || []);
      await loadDocuments();
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível enviar a nova versão.' });
    }
  };

  const confirmDelete = async (documentId) => {
    try {
      await api.delete(`/documentos/${documentId}`);
      setAlertState({ visible: true, type: 'success', message: 'Documento excluído com sucesso.' });
      await loadDocuments();
      setConfirmDialog({ isOpen: false, title: '', subTitle: '', onConfirm: null });
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível excluir o documento.' });
    }
  };

  const askDelete = (doc) => {
    setCurrentDocument(doc);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir documento',
      subTitle: 'Esta ação não poderá ser desfeita.',
      onConfirm: () => confirmDelete(doc.id),
    });
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page documentos-page">
      <BaseCard title="Documentos">
        {alertState.visible && (
          <Alert
            sx={{ mb: 2 }}
            variant="filled"
            severity={alertState.type}
            onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}
          >
            {alertState.message}
          </Alert>
        )}

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.document_type_id}
                label="Tipo"
                onChange={(e) => setFilters((prev) => ({ ...prev, document_type_id: e.target.value }))}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {filteredTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Sigilo</InputLabel>
              <Select
                value={filters.sigilo}
                label="Sigilo"
                onChange={(e) => setFilters((prev) => ({ ...prev, sigilo: e.target.value }))}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {Object.entries(SIGILO_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button fullWidth variant="contained" onClick={() => loadDocuments(0, rowsPerPage)}>Filtrar</Button>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={openNew}>Novo documento</Button>
          <Button variant="outlined" href="/documentos/tipos">Gerenciar tipos</Button>
          {profile === 'admin' && <Button variant="outlined" href="/documentos/configuracoes">Configurações</Button>}
        </Stack>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Sigilo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Versão</TableCell>
                <TableCell>Criado por</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.titulo}</TableCell>
                  <TableCell>{doc.type?.nome || '—'}</TableCell>
                  <TableCell><Chip size="small" label={SIGILO_LABELS[doc.sigilo] || doc.sigilo} /></TableCell>
                  <TableCell>{STATUS_LABELS[doc.status] || String(doc.status || '').toUpperCase()}</TableCell>
                  <TableCell>{doc.current_version_number || 0}</TableCell>
                  <TableCell>{doc.creator?.name || '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => openVersions(doc)}>Versões</Button>
                      <Button size="small" variant="outlined" onClick={() => openEdit(doc)}>Editar</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => askDelete(doc)}>Excluir</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Nenhum documento encontrado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[15, 25, 50]}
            onPageChange={(_, nextPage) => {
              setPage(nextPage);
              loadDocuments(nextPage, rowsPerPage);
            }}
            onRowsPerPageChange={(e) => {
              const nextRows = Number(e.target.value);
              setRowsPerPage(nextRows);
              setPage(0);
              loadDocuments(0, nextRows);
            }}
          />
        </TableContainer>
      </BaseCard>

      <Modal open={isModalOpen} onClose={closeModal}>
        <Box sx={{ ...modalShellSx, ...modalFormRootSx, maxWidth: 780 }}>
          <BaseCard title={form.id ? 'Editar Documento' : 'Novo Documento'}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Título"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={form.document_type_id}
                  label="Tipo"
                  onChange={(e) => setForm((prev) => ({ ...prev, document_type_id: e.target.value }))}
                >
                  <MenuItem value=""><em>Selecione</em></MenuItem>
                  {filteredTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Sigilo</InputLabel>
                <Select
                  value={form.sigilo}
                  label="Sigilo"
                  onChange={(e) => setForm((prev) => ({ ...prev, sigilo: e.target.value }))}
                >
                  {Object.entries(SIGILO_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Resumo"
                multiline
                minRows={4}
                value={form.resumo}
                onChange={(e) => setForm((prev) => ({ ...prev, resumo: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Arquivo"
                type="file"
                InputLabelProps={{ shrink: true }}
                inputProps={{ accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg' }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {form.id && (
                <Typography variant="body2" color="text.secondary">
                  Se anexar um arquivo, o sistema criará uma nova versão.
                </Typography>
              )}
            </Stack>

            <Box sx={{ mt: 2.2, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              <Button onClick={saveDocument} variant="contained" sx={modalPrimaryButtonSx}>
                Gravar
              </Button>
              <Button onClick={closeModal} variant="outlined" sx={modalSecondaryButtonSx}>
                Cancelar
              </Button>
            </Box>
          </BaseCard>
        </Box>
      </Modal>

      <Dialog open={versionsOpen} onClose={() => setVersionsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Versões do documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mb={2}>
            <Button component="label" variant="outlined">
              Selecionar nova versão
              <input hidden type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setVersionFile(e.target.files?.[0] || null)} />
            </Button>
            {versionFile && (
              <Typography variant="body2" color="text.secondary">
                Arquivo selecionado: {versionFile.name}
              </Typography>
            )}
            <Button variant="contained" onClick={handleUploadVersion} disabled={!versionFile || !currentDocument?.id}>
              Enviar nova versão
            </Button>
          </Stack>
          {versionsLoading && <Typography color="text.secondary">Carregando versões...</Typography>}
          {!versionsLoading && versions.length === 0 && <Typography color="text.secondary">Nenhuma versão registrada.</Typography>}
          {versions.map((version) => (
            <Box
              key={version.id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              py={1}
              borderBottom="1px solid rgba(0,0,0,0.08)"
            >
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  Versão {version.version_number}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {version.original_name} | {version.mime_type || '—'}
                </Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => handleDownloadVersion(version)}>
                Baixar
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsOpen(false)} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    </Box>
  );
}
