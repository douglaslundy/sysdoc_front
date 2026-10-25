import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { normalizeIconName } from '../../utils/iconResolver';
import {
  getAllPageCategories,
  addPageCategoryFetch,
  editPageCategoryFetch,
  removePageCategoryFetch,
} from '../../store/fetchActions/accessProfiles';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import { ActionCreateFab } from '../actions';
import { AcoesDeLinha } from '../ui/acoes-de-linha';
import { FormularioModal } from '../ui/formulario-modal';
import { PaginaDeLista } from '../ui/pagina-de-lista';
import { Pilula } from '../ui/pilula';
import { usePaginacaoLocal } from '../../lib/usePaginacaoLocal';

const FORM_INICIAL = { nome: '', icone: '', ordem: 999, ativo: true };
const ICONES = [
  'home', 'pie-chart', 'user', 'users', 'shield', 'bar-chart-2',
  'thermometer', 'clipboard', 'tag', 'user-check', 'calendar',
  'award', 'layers', 'truck', 'map', 'map-pin', 'send', 'file-text',
  'cpu', 'tool', 'grid', 'monitor', 'activity', 'plus-circle', 'layout',
  'alert-triangle', 'maximize', 'settings', 'lock', 'key', 'log-in', 'package', 'check-square',
];

const OPCOES_ICONE = ICONES.map((ic) => ({ value: ic, label: ic }));

const CAMPOS = [
  { name: 'nome', label: 'Nome da Categoria', required: true, max: 80, upper: true },
  { name: 'icone', label: 'Icone', options: OPCOES_ICONE, vazio: 'Sem icone' },
  { name: 'ordem', label: 'Ordem', type: 'number' },
  { name: 'ativo', label: 'Categoria ativa', interruptor: true },
];

export default function PaginasCategorias() {
  const dispatch = useDispatch();
  const { pageCategories } = useSelector((state) => state.accessProfiles);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [busca, setBusca] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Deseja realmente remover?',
    subTitle: 'Esta acao nao podera ser desfeita.',
  });

  useEffect(() => {
    dispatch(getAllPageCategories());
  }, [dispatch]);

  const categoriasFiltradas = [...pageCategories]
    .filter(
      (cat) =>
        (cat.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (cat.icone || '').toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
  const { fatia, propsDaPaginacao } = usePaginacaoLocal(categoriasFiltradas, 10);

  const handleNova = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(true);
  };

  const handleEditar = (cat) => {
    setEditId(cat.id);
    setForm({
      nome: cat.nome || '',
      icone: cat.icone || '',
      ordem: Number(cat.ordem ?? 999),
      ativo: !!cat.ativo,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setEditId(null);
    setForm(FORM_INICIAL);
    setOpenModal(false);
  };

  const handleSave = () => {
    const payload = { ...form, ordem: Number(form.ordem || 999) };

    if (editId) {
      dispatch(
        editPageCategoryFetch(editId, payload, () => {
          handleCloseModal();
          dispatch(getAllPageCategories());
        })
      );
      return;
    }

    dispatch(
      addPageCategoryFetch(payload, () => {
        handleCloseModal();
        dispatch(getAllPageCategories());
      })
    );
  };

  const handleRemove = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja remover a categoria ${cat.nome}?`,
      subTitle: 'Esta acao nao podera ser desfeita.',
      confirm: () => dispatch(removePageCategoryFetch(cat.id)),
    });
  };

  const colunas = [
    { chave: 'nome', titulo: 'Nome', render: (cat) => <span className="font-semibold">{(cat.nome || '').toUpperCase()}</span> },
    {
      chave: 'icone',
      titulo: 'Icone',
      render: (cat) => (cat.icone ? (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <FeatherIcon icon={normalizeIconName(cat.icone, 'circle')} width="16" height="16" />
          {cat.icone}
        </span>
      ) : <span className="text-xs text-muted-foreground">-</span>),
    },
    { chave: 'ordem', titulo: 'Ordem', render: (cat) => cat.ordem ?? 999 },
    {
      chave: 'status',
      titulo: 'Status',
      render: (cat) => <Pilula tom={cat.ativo ? 'sucesso' : 'perigo'}>{cat.ativo ? 'Ativa' : 'Inativa'}</Pilula>,
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      render: (cat) => (
        <AcoesDeLinha rotuloEditar="Editar categoria" rotuloExcluir="Remover categoria" aoEditar={() => handleEditar(cat)} aoExcluir={() => handleRemove(cat)} />
      ),
    },
  ];

  return (
    <PaginaDeLista
      titulo={`Voce possui ${pageCategories.length} Categorias de Paginas Cadastradas`}
      busca={{ rotulo: 'Pesquisar categoria', placeholder: 'Pesquisar categoria: Nome ou Icone', value: busca, onChange: (e) => setBusca(e.target.value) }}
      barra={<ActionCreateFab title="Nova Categoria" onClick={handleNova} />}
      colunas={colunas}
      linhas={fatia}
      chaveDaLinha={(cat) => cat.id}
      vazio="Nenhum registro encontrado!"
      rotuloDaTabela="categorias de paginas"
      paginacao={propsDaPaginacao}
    >
      <AlertModal />
      <FormularioModal
        aberto={openModal}
        titulo={editId ? 'Editar Categoria de Pagina' : 'Nova Categoria de Pagina'}
        aoFechar={handleCloseModal}
        aoGravar={handleSave}
        campos={CAMPOS}
        valores={form}
        aoMudar={({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value }))}
        tamanho="md"
        antes={<AlertModal />}
        depois={form.icone ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FeatherIcon icon={normalizeIconName(form.icone, 'circle')} width="16" height="16" /> {form.icone}
          </p>
        ) : null}
      />
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </PaginaDeLista>
  );
}
