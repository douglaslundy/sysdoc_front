import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import ConfirmDialog from '../confirmDialog';
import DocumentoDetalhe from './detalhe';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { ActionCreateFab } from '../actions';
import { AcoesDeLinha } from '../ui/acoes-de-linha';
import { Banner } from '../ui/banner';
import { Button, buttonVariants } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao, CampoTexto } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from '../ui/dialogo';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';

const TOM_DO_ALERTA = { success: 'sucesso', error: 'perigo', warning: 'alerta' };

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

  const colunas = [
    { chave: 'titulo', titulo: 'Título', render: (doc) => <span className="font-bold">{doc.titulo || '-'}</span> },
    { chave: 'tipo', titulo: 'Tipo', render: (doc) => doc.type?.nome || '—' },
    { chave: 'sigilo', titulo: 'Sigilo', render: (doc) => <Pilula tom="neutro" contorno>{SIGILO_LABELS[doc.sigilo] || doc.sigilo}</Pilula> },
    { chave: 'status', titulo: 'Status', render: (doc) => STATUS_LABELS[doc.status] || String(doc.status || '').toUpperCase() },
    { chave: 'versao', titulo: 'Versão', render: (doc) => doc.current_version_number || 0 },
    { chave: 'criador', titulo: 'Criado por', render: (doc) => doc.creator?.name || '—' },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (doc) => (
        <AcoesDeLinha rotuloEditar="Editar documento" rotuloExcluir="Excluir documento" aoEditar={() => openEdit(doc)} aoExcluir={() => askDelete(doc)}>
          <Button variant="secondary" size="icon-sm" onClick={() => openView(doc)} title="Visualizar documento" aria-label="Visualizar documento">
            <Eye />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openVersions(doc)}>Versões</Button>
        </AcoesDeLinha>
      ),
    },
  ];

  return (
    <div className="documentos-page">
      <CabecalhoDePagina
        titulo={`Você possui ${total} Documentos Cadastrados`}
        subtitulo="Listagem, filtros e ações do módulo de documentos."
      />
      {alertState.visible && (
        <div className="mb-4">
          <Banner tom={TOM_DO_ALERTA[alertState.type] || 'info'} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>
            {alertState.message}
          </Banner>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoDeBusca
          rotulo="Pesquisar documento"
          placeholder="Pesquisar documento"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={80}
        />
        <CampoSelecao id="docs-filtro-tipo" label="Tipo" value={filters.document_type_id} onChange={(e) => setFilters((prev) => ({ ...prev, document_type_id: e.target.value }))} className="min-w-[160px]">
          <option value="">Todos</option>
          {filteredTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.nome}</option>
          ))}
        </CampoSelecao>
        <CampoSelecao id="docs-filtro-sigilo" label="Sigilo" value={filters.sigilo} onChange={(e) => setFilters((prev) => ({ ...prev, sigilo: e.target.value }))} className="min-w-[150px]">
          <option value="">Todos</option>
          {Object.entries(SIGILO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </CampoSelecao>
        <CampoSelecao id="docs-filtro-status" label="Status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="min-w-[150px]">
          <option value="">Todos</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </CampoSelecao>
        <ActionCreateFab title="Novo documento" onClick={openNew} />
      </div>

      <DataTable
        rotulo="documentos"
        colunas={colunas}
        linhas={documents}
        chaveDaLinha={(doc) => doc.id}
        carregando={loading}
        vazio="Nenhum documento encontrado."
      />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={rowsPerPage}
        opcoes={[15, 25, 50]}
        aoMudarPagina={(nextPage) => {
          setPage(nextPage);
          loadDocuments(nextPage, rowsPerPage);
        }}
        aoMudarPorPagina={(nextRows) => {
          setRowsPerPage(nextRows);
          setPage(0);
          loadDocuments(0, nextRows);
        }}
      />

      <Dialogo aberto={isModalOpen} aoFechar={closeModal} tamanho="lg">
        <DialogoCabecalho>{form.id ? 'Editar Documento' : 'Novo Documento'}</DialogoCabecalho>
        <div className="grid gap-4">
          <CampoTexto id="doc-titulo" label="Título" value={form.titulo} onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))} />
          <CampoSelecao id="doc-tipo" label="Tipo" value={form.document_type_id} onChange={(e) => setForm((prev) => ({ ...prev, document_type_id: e.target.value }))}>
            <option value="">Selecione</option>
            {filteredTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.nome}</option>
            ))}
          </CampoSelecao>
          <div className="flex justify-end">
            <a className={buttonVariants({ variant: 'outline', size: 'sm' })} href="/documentos/tipos">Gerenciar tipos</a>
          </div>
          <CampoSelecao id="doc-sigilo" label="Sigilo" value={form.sigilo} onChange={(e) => setForm((prev) => ({ ...prev, sigilo: e.target.value }))}>
            {Object.entries(SIGILO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </CampoSelecao>
          <CampoSelecao id="doc-status" label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </CampoSelecao>
          <CampoTexto id="doc-resumo" label="Resumo" multiline rows={4} value={form.resumo} onChange={(e) => setForm((prev) => ({ ...prev, resumo: e.target.value }))} />
          <CampoTexto
            id="doc-arquivo"
            label="Arquivo"
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {form.id && (
            <p className="text-sm text-muted-foreground">Se anexar um arquivo, o sistema criará uma nova versão.</p>
          )}
          {form.id && (
            <div className="grid gap-1">
              <p className="text-sm font-semibold">Anexos do documento</p>
              {versionsLoading && <p className="text-sm text-muted-foreground">Carregando anexos...</p>}
              {!versionsLoading && versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo registrado.</p>}
              {!versionsLoading && versions.map((version) => (
                <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{version.original_name || 'arquivo'}</p>
                    <p className="text-xs text-muted-foreground">Versão {version.version_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadVersion(version)}>Baixar</Button>
                    {isAdmin && (
                      <Button variant="destructive" size="sm" onClick={() => askDeleteVersion(version)}>Excluir</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogoRodape>
          <Button variant="outline" onClick={closeModal}>Cancelar</Button>
          <Button onClick={saveDocument}>Gravar</Button>
        </DialogoRodape>
      </Dialogo>

      <Dialogo aberto={viewOpen} aoFechar={closeView} tamanho="xl">
        <DialogoTitulo className="sr-only">Documento</DialogoTitulo>
        <DocumentoDetalhe documentId={viewDocumentId} embedded onClose={closeView} />
      </Dialogo>

      <Dialogo aberto={versionsOpen} aoFechar={() => setVersionsOpen(false)} tamanho="lg">
        <DialogoCabecalho>Versões do documento</DialogoCabecalho>
        <div className="mb-4 grid gap-3">
          <label className={`${buttonVariants({ variant: 'outline' })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25`}>
            Selecionar nova versão
            <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setVersionFile(e.target.files?.[0] || null)} />
          </label>
          {versionFile && (
            <p className="text-sm text-muted-foreground">Arquivo selecionado: {versionFile.name}</p>
          )}
          <Button onClick={handleUploadVersion} disabled={!versionFile || !currentDocument?.id}>
            Enviar nova versão
          </Button>
        </div>
        {versionsLoading && <p className="text-sm text-muted-foreground">Carregando versões...</p>}
        {!versionsLoading && versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>}
        {versions.map((version) => (
          <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
            <div className="min-w-0">
              <p className="text-sm font-bold">Versão {version.version_number}</p>
              <p className="text-xs text-muted-foreground">{version.original_name} | {version.mime_type || '—'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownloadVersion(version)}>Baixar</Button>
          </div>
        ))}
        <DialogoRodape>
          <Button variant="outline" onClick={() => setVersionsOpen(false)}>Fechar</Button>
        </DialogoRodape>
      </Dialogo>

      <ConfirmDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    </div>
  );
}
