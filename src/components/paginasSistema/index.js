import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { normalizeIconName, resolveIconForPath } from '../../utils/iconResolver';
import {
  getAllPages,
  addPageFetch,
  editPageFetch,
  removePageFetch,
  getAllPageCategories,
} from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import { ActionCreateFab } from '../actions';
import { AcoesDeLinha } from '../ui/acoes-de-linha';
import { CampoSelecao } from '../ui/campos';
import { FormularioModal } from '../ui/formulario-modal';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula } from '../ui/pilula';
import { usePaginacaoLocal } from '../../lib/usePaginacaoLocal';

const FORM_INICIAL = {
  titulo: '',
  path: '',
  icone: '',
  categoria: '',
  category_id: '',
  ordem: 1,
  ativo: true,
};

const ICONES = [
  'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
  'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
  'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
  'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
  'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in', 'package', 'check-square',
];

export default function PaginasSistema() {
  const dispatch = useDispatch();
  const { pages, pageCategories } = useSelector((state) => state.accessProfiles);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Deseja realmente excluir?',
    subTitle: 'Esta acao nao podera ser desfeita.',
  });

  useEffect(() => {
    dispatch(getAllPages());
    dispatch(getAllPageCategories());
  }, [dispatch]);

  const pageCategoryById = useMemo(() => {
    return new Map((Array.isArray(pageCategories) ? pageCategories : []).map((category) => [String(category.id), category]));
  }, [pageCategories]);

  const resolveCategory = (page) => {
    const category = (page?.category_id && pageCategoryById.get(String(page.category_id))) || page?.category || null;
    return category?.nome || page?.categoria || '';
  };

  const filtradas = pages
      .filter(
        (p) =>
          p.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
          p.path?.toLowerCase().includes(busca.toLowerCase()) ||
          resolveCategory(p).toLowerCase().includes(busca.toLowerCase())
      )
      .filter((p) => !filtroCategoria || String(p.category_id || '') === String(filtroCategoria))
      .sort((a, b) => {
      const catCmp = resolveCategory(a).localeCompare(resolveCategory(b));
      if (catCmp !== 0) return catCmp;
      const orderCmp = Number(a.ordem ?? 999) - Number(b.ordem ?? 999);
      if (orderCmp !== 0) return orderCmp;
      return (a.titulo || '').localeCompare(b.titulo || '');
    });
  const { fatia, propsDaPaginacao } = usePaginacaoLocal(filtradas, 15);

  const categoriasAtivas = pageCategories
    .filter((c) => c.ativo)
    .sort((a, b) => {
      if ((a.ordem ?? 999) !== (b.ordem ?? 999)) return (a.ordem ?? 999) - (b.ordem ?? 999);
      return (a.nome || '').localeCompare(b.nome || '');
    });

  const handleNova = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(true);
  };

  const handleEditar = (pg) => {
    setEditId(pg.id);
    setForm({
      titulo: pg.titulo,
      path: pg.path,
      icone: pg.icone || '-',
      categoria: resolveCategory(pg),
      category_id: pg.category_id || pg.category?.id || '',
      ordem: Number(pg.ordem ?? 1),
      ativo: pg.ativo,
    });
    setOpenModal(true);
  };

  const handleSave = () => {
    const payload = { ...form, ordem: Number(form.ordem || 1) };
    if (!payload.category_id) payload.category_id = null;

    if (editId) {
      dispatch(
        editPageFetch(editId, payload, () => {
          setOpenModal(false);
          dispatch(getAllPages());
        })
      );
    } else {
      dispatch(
        addPageFetch(payload, () => {
          setOpenModal(false);
          dispatch(getAllPages());
        })
      );
    }
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'category_id') {
        const selected = pageCategories.find((c) => String(c.id) === String(value));
        next.categoria = selected?.nome || '';
      }
      return next;
    });
  };

  const previewReorder = () => {
    const targetCategoryId = form.category_id || null;
    const targetOrder = Number(form.ordem || 1);
    const sameCategoryPages = pages
      .filter((p) => String(p.category_id || '') === String(targetCategoryId || ''))
      .filter((p) => !editId || p.id !== editId)
      .sort((a, b) => Number(a.ordem ?? 999) - Number(b.ordem ?? 999));

    if (sameCategoryPages.length === 0) {
      return `A pagina sera posicionada como ${targetOrder}a nesta categoria.`;
    }

    const conflict = sameCategoryPages.find((p) => Number(p.ordem) === targetOrder);
    if (conflict) {
      return `Ao salvar, "${conflict.titulo}" e as proximas serao deslocadas automaticamente.`;
    }

    const maxOrder = Number(sameCategoryPages[sameCategoryPages.length - 1].ordem ?? 0);
    if (targetOrder > maxOrder + 1) {
      return 'A ordem informada e maior que a sequencia atual; ela sera posicionada ao final da categoria.';
    }

    return `A pagina sera posicionada como ${targetOrder}a nesta categoria.`;
  };

  const handleRemove = (pg) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja remover a pagina ${pg.titulo}?`,
      subTitle: 'Esta acao nao podera ser desfeita.',
      confirm: () => dispatch(removePageFetch(pg.id)),
    });
  };

  const campos = [
    { name: 'titulo', label: 'Titulo da Pagina', required: true, max: 80 },
    { name: 'path', label: 'Path (rota)', required: true, max: 120, dica: 'Caminho da pagina, ex: /laboratorio/exames' },
    { name: 'category_id', label: 'Categoria', options: categoriasAtivas.map((c) => ({ value: c.id, label: c.nome })), vazio: 'Sem categoria' },
    { name: 'ordem', label: 'Ordem dentro da categoria', type: 'number', dica: previewReorder() },
    { name: 'icone', label: 'icone', options: ICONES.map((ic) => ({ value: ic, label: ic })), vazio: 'Sem icone' },
    { name: 'ativo', label: 'Pagina ativa', interruptor: true },
  ];

  const colunas = [
    {
      chave: 'titulo',
      titulo: 'Titulo',
      render: (pg) => (
        <span className="flex items-center gap-2 font-semibold">
          {pg.icone && <FeatherIcon icon={resolveIconForPath(pg.path, pg.icone, 'circle')} width="16" height="16" />}
          {pg.titulo}
        </span>
      ),
    },
    { chave: 'path', titulo: 'Path', render: (pg) => <code className="rounded bg-hover px-2 py-0.5 text-sm">{pg.path}</code> },
    { chave: 'icone', titulo: 'icone', render: (pg) => <span className="text-xs text-muted-foreground">{pg.icone || '-'}</span> },
    {
      chave: 'categoria',
      titulo: 'Categoria',
      render: (pg) => (resolveCategory(pg) ? <Pilula tom="neutro" contorno>{resolveCategory(pg)}</Pilula> : <span className="text-xs text-muted-foreground">-</span>),
    },
    { chave: 'ordem', titulo: 'Ordem', render: (pg) => Number(pg.ordem ?? 999) },
    { chave: 'status', titulo: 'Status', render: (pg) => <Pilula tom={pg.ativo ? 'sucesso' : 'perigo'}>{pg.ativo ? 'Ativa' : 'Inativa'}</Pilula> },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (pg) => (
        <AcoesDeLinha rotuloEditar="Editar pagina" rotuloExcluir="Remover pagina" aoEditar={() => handleEditar(pg)} aoExcluir={() => handleRemove(pg)} />
      ),
    },
  ];

  const barra = (
    <>
      <CampoSelecao id="paginas-filtro-categoria" label="Filtrar categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="min-w-[220px]">
        <option value="">Todas</option>
        {categoriasAtivas.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </CampoSelecao>
      <ActionCreateFab title="Nova Pagina" onClick={handleNova} />
    </>
  );

  return (
    <PaginaDeLista
      titulo={`Voce possui ${pages.length} Paginas Cadastradas no Sistema`}
      busca={{ rotulo: 'Buscar pagina', placeholder: 'Buscar por titulo, path ou categoria...', value: busca, onChange: (e) => setBusca(e.target.value), maxLength: 80 }}
      barra={barra}
      colunas={colunas}
      linhas={fatia}
      chaveDaLinha={(pg) => pg.id}
      vazio="Nenhuma pagina encontrada"
      rotuloDaTabela="paginas"
      paginacao={{ ...propsDaPaginacao, opcoes: [10, 15, 25] }}
    >
      <AlertModal />
      <FormularioModal
        aberto={openModal}
        titulo={editId ? 'Editar Pagina do Sistema' : 'Nova Pagina do Sistema'}
        aoFechar={() => setOpenModal(false)}
        aoGravar={handleSave}
        campos={campos}
        valores={form}
        aoMudar={handleChange}
        tamanho="md"
        antes={<AlertModal />}
        depois={form.icone && form.icone !== '-' ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FeatherIcon icon={resolveIconForPath(form.path, form.icone, 'circle')} width="16" height="16" /> {form.icone}
          </p>
        ) : null}
      />
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </PaginaDeLista>
  );
}
