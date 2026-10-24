import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { Campo, Input, SelectNativo, TextareaNativo } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { Interruptor } from '../ui/interruptor';
import { Paginacao } from '../ui/paginacao';

const initialValue = (field) => {
  if (field.type === 'switch') return field.defaultValue ?? true;
  return field.defaultValue ?? '';
};

const normalizePayload = (fields, form) => {
  const payload = {};
  fields.forEach((field) => {
    let value = form[field.name];
    if (field.type === 'number') {
      value = value === '' || value == null ? null : Number(value);
    }
    if (field.type === 'switch') {
      value = !!value;
    }
    if (value === '' && field.allowEmpty !== true) {
      value = null;
    }
    payload[field.name] = value;
  });
  return payload;
};

export default function CrudPage({
  title,
  subtitle,
  apiPath,
  fields,
  columns,
  perPageOptions = [10, 15, 25],
  tableActions = true,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(perPageOptions[0] || 10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });
  const searchTimer = useRef(null);

  const emptyForm = useMemo(() => {
    const value = {};
    fields.forEach((field) => {
      value[field.name] = initialValue(field);
    });
    return value;
  }, [fields]);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get(apiPath, { params: { page: page + 1, per_page: perPage, search: search || undefined, ...params } });
      const data = response.data;
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = data?.meta || data?.pagination || {};
      setItems(list);
      setTotal(Number(meta.total ?? list.length));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [apiPath, page, perPage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ ...emptyForm, ...row });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = normalizePayload(fields, form);
    if (editing?.id) {
      await api.put(`${apiPath}/${editing.id}`, payload);
    } else {
      await api.post(apiPath, payload);
    }
    setOpen(false);
    await load();
  };

  const handleDelete = (row) => {
    setConfirmDialog({
      isOpen: true,
      title: `Deseja inativar ${row.nome || 'o registro'}?`,
      subTitle: 'Esta ação não poderá ser desfeita.',
      confirm: async () => {
        await api.delete(`${apiPath}/${row.id}`);
        await load();
      },
    });
  };

  const onSearch = ({ target }) => {
    setSearch(target.value);
    setPage(0);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ search: target.value || undefined, page: 1 }), 350);
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const colunas = [
    ...columns.map((column) => ({
      chave: column.key,
      titulo: column.label,
      render: (row) => (column.render ? column.render(row) : row[column.key] ?? '-'),
    })),
    ...(tableActions
      ? [{
        chave: '__acoes',
        titulo: 'Ações',
        render: (row) => (
          <div className="flex gap-2">
            <Button variant="success" size="icon-sm" title="Editar" aria-label="Editar" onClick={() => openEdit(row)}>
              <Pencil />
            </Button>
            <Button variant="destructive" size="icon-sm" title="Inativar" aria-label="Inativar" onClick={() => handleDelete(row)}>
              <Trash2 />
            </Button>
          </div>
        ),
      }]
      : []),
  ];

  const renderField = (field) => {
    const id = `crud-${field.name}`;
    if (field.type === 'switch') {
      return (
        <Interruptor key={field.name} id={id} marcado={!!form[field.name]} aoMudar={(v) => setField(field.name, v)}>
          {field.label}
        </Interruptor>
      );
    }
    return (
      <Campo key={field.name} id={id} label={field.label} dica={field.helperText}>
        {(p) => {
          if (field.type === 'select') {
            return (
              <SelectNativo {...p} value={form[field.name] ?? ''} onChange={(e) => setField(field.name, e.target.value)}>
                <option value="">Selecione</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectNativo>
            );
          }
          if (field.multiline) {
            return <TextareaNativo {...p} rows={field.rows} value={form[field.name] ?? ''} onChange={(e) => setField(field.name, e.target.value)} {...field.inputProps} />;
          }
          return <Input {...p} type={field.type || 'text'} value={form[field.name] ?? ''} onChange={(e) => setField(field.name, e.target.value)} {...field.inputProps} />;
        }}
      </Campo>
    );
  };

  return (
    <div className="ui-reset">
      <CabecalhoDePagina titulo={title} subtitulo={subtitle} />
      <AlertModal />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca rotulo="Pesquisar" placeholder="Pesquisar..." value={search} onChange={onSearch} />
        <Button onClick={openCreate}>
          <Plus /> Novo
        </Button>
      </div>

      <DataTable rotulo={title} colunas={colunas} linhas={items} chaveDaLinha={(row) => row.id} carregando={loading} vazio="Nenhum registro encontrado." />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={perPage}
        opcoes={perPageOptions}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => {
          setPerPage(n);
          setPage(0);
        }}
      />

      <Dialogo aberto={open} aoFechar={() => setOpen(false)}>
        <DialogoCabecalho>{editing ? `Editar ${title}` : `Novo ${title}`}</DialogoCabecalho>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {fields.map(renderField)}
          <DialogoRodape>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Gravar</Button>
          </DialogoRodape>
        </form>
      </Dialogo>

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </div>
  );
}
