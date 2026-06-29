import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  InputAdornment,
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
  styled,
} from '@mui/material';
import BaseCard from '../baseCard/BaseCard';
import ConfirmDialog from '../confirmDialog';
import DocumentoDetalhe from './detalhe';
import { modalFormRootSx, modalPrimaryButtonSx, modalSecondaryButtonSx, modalShellSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import FeatherIcon from 'feather-icons-react';

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

const StyledTableRow = styled(TableRow)(() => ({
  '& td': {
    background: 'var(--queue-row-bg)',
    borderTop: '0.5px solid var(--lg-border)',
    borderBottom: '0.5px solid var(--lg-border)',
    paddingTop: 12,
    paddingBottom: 12,
    color: 'var(--queue-text-primary)',
  },
  '& td:first-of-type': {
    borderLeft: '0.5px solid var(--lg-border)',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  '& td:last-of-type': {
    borderRight: '0.5px solid var(--lg-border)',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  '&:hover td': {
    background: 'var(--queue-row-hover)',
  },
}));

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
  const hasLoadedInitial = useRef(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [viewDocumentId, setViewDocumentId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const loadTypes = async () => {
    const res = await api.get('/documentos/tipos');
    setTypes(res.data || []);
  };

  const loadDocuments = async (nextPage = page, nextRowsPerPage = rowsPerPage, overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page: nextPage + 1,
        per_page: nextRowsPerPage,
        search: overrides.search !== undefined ? (overrides.search || undefined) : (search || undefined),
        document_type_id: overrides.document_type_id !== undefined ? (overrides.document_type_id || undefined) : (filters.document_type_id || undefined),
        sigilo: overrides.sigilo !== undefined ? (overrides.sigilo || undefined) : (filters.sigilo || undefined),
        status: overrides.status !== undefined ? (overrides.status || undefined) : (filters.status || undefined),
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
    Promise.all([loadTypes(), loadDocuments(0, rowsPerPage)]).then(() => {
      hasLoadedInitial.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasLoadedInitial.current) return;
    setPage(0);
    loadDocuments(0, rowsPerPage, {
      document_type_id: filters.document_type_id,
      sigilo: filters.sigilo,
      status: filters.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.document_type_id, filters.sigilo, filters.status]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setPage(0);
      loadDocuments(0, rowsPerPage, { search });
    }, 250);

    return () => window.clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filteredTypes = useMemo(() => types.filter((type) => type.ativo !== false), [types]);
  const isAdmin = profile === 'admin';

  const loadDocumentVersions = async (documentId) => {
    if (!documentId) {
      setVersions([]);
      return;
    }

    setVersionsLoading(true);
    try {
      const res = await api.get(`/documentos/${documentId}/versoes`);
      setVersions(res.data || []);
    } catch (error) {
      setVersions([]);
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível carregar os anexos do documento.' });
    } finally {
      setVersionsLoading(false);
    }
  };

  const openNew = () => {
    setForm(initialForm);
    setFile(null);
    setCurrentDocument(null);
    setVersions([]);
    setIsModalOpen(true);
  };

  const openEdit = async (doc) => {
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
    await loadDocumentVersions(doc.id);
  };

  const openView = (doc) => {
    setViewDocumentId(doc.id);
    setViewOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setFile(null);
    setCurrentDocument(null);
    setVersions([]);
  };

  const closeView = () => {
    setViewOpen(false);
    setViewDocumentId(null);
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

  const confirmDeleteVersion = async (version) => {
    if (!currentDocument?.id) return;

    try {
      await api.delete(`/documentos/${currentDocument.id}/versoes/${version.id}`);
      setAlertState({ visible: true, type: 'success', message: 'Anexo removido com sucesso.' });
      await loadDocumentVersions(currentDocument.id);
      await loadDocuments();
      setConfirmDialog({ isOpen: false, title: '', subTitle: '', onConfirm: null });
    } catch (error) {
      setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Nao foi possivel excluir o anexo.' });
    }
  };

  const askDeleteVersion = (version) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir anexo',
      subTitle: 'Somente administrador pode excluir um anexo de documento. Deseja continuar?',
      onConfirm: () => confirmDeleteVersion(version),
    });
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

      <BaseCard title={`Voce possui ${total} Documentos Cadastrados`} sx={{ mb: 3 }}>
        <Box
          className="queue-page__toolbar"
          sx={{
            '& > :not(style)': { m: 0 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <TextField
            className="lg-search-field"
            sx={{ flex: 1, minWidth: 240 }}
            placeholder="Pesquisar documento"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FeatherIcon icon="search" width="22" height="22" />
                </InputAdornment>
              ),
            }}
            inputProps={{ maxLength: 80, autoComplete: 'off' }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
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

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Fab
              className="queue-page__fab queue-page__fab--add"
              onClick={openNew}
              color="primary"
              aria-label="novo documento"
              sx={{ width: 62, height: 62, borderRadius: '14px' }}
            >
              <FeatherIcon icon="file-plus" />
            </Fab>
          </Stack>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Listagem, filtros e ações do módulo de documentos.
        </Typography>
      </BaseCard>

      <BaseCard title="Listagem">
        <TableContainer className="queue-page__table-wrap">
          <Table
            className="queue-page__table"
            size="small"
            sx={{ mt: 2, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Tipo</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Sigilo</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                <TableCell>Versão</TableCell>
                <TableCell className="queue-page__th"><Typography color="textSecondary" variant="h6">Criado por</Typography></TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <StyledTableRow key={doc.id} hover>
                  <TableCell><Typography variant="h6" sx={{ fontWeight: 700 }}>{doc.titulo || '-'}</Typography></TableCell>
                  <TableCell>{doc.type?.nome || '—'}</TableCell>
                  <TableCell><Chip size="small" label={SIGILO_LABELS[doc.sigilo] || doc.sigilo} /></TableCell>
                  <TableCell><Typography variant="h6">{STATUS_LABELS[doc.status] || String(doc.status || '').toUpperCase()}</Typography></TableCell>
                  <TableCell><Typography variant="h6">{doc.current_version_number || 0}</Typography></TableCell>
                  <TableCell>{doc.creator?.name || '—'}</TableCell>
                  <TableCell align="center">
                    <Box className="queue-page__actions" sx={{ '& button': { mx: 0.5 } }}>
                      <Button size="medium" variant="outlined" onClick={() => openView(doc)} title="Visualizar documento" sx={{ minWidth: 44, px: 1.25 }}>
                        <FeatherIcon icon="eye" width="18" height="18" />
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => openVersions(doc)}>Versões</Button>
                      <Button className="queue-page__action queue-page__action--success" color="success" size="medium" variant="contained" sx={{ minWidth: 62, height: 40 }} onClick={() => openEdit(doc)} title="Editar documento">
                        <FeatherIcon icon="edit" width="18" height="18" />
                      </Button>
                      <Button className="queue-page__action queue-page__action--danger" color="error" size="medium" variant="contained" sx={{ minWidth: 62, height: 40 }} onClick={() => askDelete(doc)} title="Excluir documento">
                        <FeatherIcon icon="trash" width="18" height="18" />
                      </Button>
                    </Box>
                  </TableCell>
                </StyledTableRow>
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" href="/documentos/tipos">Gerenciar tipos</Button>
              </Box>
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
              {form.id && (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="subtitle2">Anexos do documento</Typography>
                  {versionsLoading && <Typography color="text.secondary">Carregando anexos...</Typography>}
                  {!versionsLoading && versions.length === 0 && <Typography color="text.secondary">Nenhum anexo registrado.</Typography>}
                  {!versionsLoading && versions.map((version) => (
                    <Box
                      key={version.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        py: 1,
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {version.original_name || 'arquivo'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Versao {version.version_number}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" onClick={() => handleDownloadVersion(version)}>
                          Baixar
                        </Button>
                        {isAdmin && (
                          <Button variant="outlined" color="error" size="small" onClick={() => askDeleteVersion(version)}>
                            Excluir
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Box>
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

      <Dialog
        open={viewOpen}
        onClose={closeView}
        fullScreen
        PaperProps={{
          sx: {
            background: 'var(--lg-glass-modal)',
            backdropFilter: 'var(--lg-blur-modal)',
            WebkitBackdropFilter: 'var(--lg-blur-modal)',
          },
        }}
      >
        <DocumentoDetalhe documentId={viewDocumentId} embedded onClose={closeView} />
      </Dialog>

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
