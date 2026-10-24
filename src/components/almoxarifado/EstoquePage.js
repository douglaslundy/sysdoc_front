import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import AlertModal from '../messagesModal';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao, CampoTexto, SelectNativo } from '../ui/campos';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../ui/dialogo';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';

const STATUS = (value, minimum) => {
  const qty = Number(value || 0);
  const min = Number(minimum || 0);
  if (qty <= 0) return { tom: 'perigo', label: 'Sem estoque' };
  if (min > 0 && qty < min) return { tom: 'alerta', label: 'Abaixo do mínimo' };
  return { tom: 'sucesso', label: 'OK' };
};

const EMPTY = { almoxarifado_produto_id: '', almoxarifado_secretaria_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '', secretaria_destino_id: '' };

const qtd = (valor) => <span className="font-mono">{Number(valor || 0).toFixed(3)}</span>;

export default function EstoquePage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [abaixoMinimo, setAbaixoMinimo] = useState(false);
  const [secretarias, setSecretarias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const loadOptions = async () => {
    const [sRes, pRes] = await Promise.all([
      api.get('/almoxarifado/catalogos/secretarias'),
      api.get('/almoxarifado/produtos', { params: { per_page: 100, page: 1, ativo: true } }),
    ]);
    setSecretarias(Array.isArray(sRes.data) ? sRes.data : []);
    setProdutos(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/almoxarifado/estoque', {
        params: {
          page: page + 1,
          per_page: perPage,
          search: search || undefined,
          abaixo_minimo: abaixoMinimo ? 1 : undefined,
        },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total ?? res.data?.meta?.total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions().catch(() => {});
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [page, perPage, abaixoMinimo]);

  const selectedProduct = useMemo(() => produtos.find((p) => String(p.id) === String(form.almoxarifado_produto_id)), [form.almoxarifado_produto_id, produtos]);
  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const submitMovement = async () => {
    await api.post('/almoxarifado/estoque/movimentar', {
      ...form,
      quantidade: Number(form.quantidade),
      almoxarifado_secretaria_id: form.almoxarifado_secretaria_id || null,
      secretaria_destino_id: form.secretaria_destino_id || null,
    });
    setOpen(false);
    setForm(EMPTY);
    await load();
  };

  const colunas = [
    {
      chave: 'produto',
      titulo: 'Produto',
      render: (row) => (
        <>
          <span className="font-semibold">{row.produto?.nome || '-'}</span>
          <span className="block text-xs text-muted-foreground">{row.produto?.codigo_interno || '-'}</span>
        </>
      ),
    },
    { chave: 'secretaria', titulo: 'Secretaria', render: (row) => row.secretaria?.nome || 'Estoque central' },
    { chave: 'disponivel', titulo: 'Disponível', render: (row) => qtd(row.quantidade_disponivel) },
    { chave: 'reservado', titulo: 'Reservado', render: (row) => qtd(row.quantidade_reservada) },
    { chave: 'separacao', titulo: 'Separação', render: (row) => qtd(row.quantidade_em_separacao) },
    { chave: 'entregue', titulo: 'Entregue', render: (row) => qtd(row.quantidade_entregue) },
    {
      chave: 'status',
      titulo: 'Status',
      render: (row) => {
        const meta = STATUS(row.quantidade_disponivel, row.produto?.estoque_minimo);
        return <Pilula tom={meta.tom}>{meta.label}</Pilula>;
      },
    },
  ];

  return (
    <div className="ui-reset">
      <CabecalhoDePagina titulo="Estoque" subtitulo="Saldo por produto e secretaria." />
      <AlertModal />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca
          rotulo="Pesquisar produto"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
        />
        <div className="w-full sm:w-52">
          <SelectNativo aria-label="Filtro" value={abaixoMinimo ? 'baixo' : 'todos'} onChange={(e) => setAbaixoMinimo(e.target.value === 'baixo')}>
            <option value="todos">Todos</option>
            <option value="baixo">Abaixo do mínimo</option>
          </SelectNativo>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Novo movimento
        </Button>
      </div>

      <DataTable rotulo="Estoque" colunas={colunas} linhas={rows} chaveDaLinha={(row) => row.id} carregando={loading} vazio="Nenhum saldo encontrado." />
      <Paginacao
        total={total}
        pagina={page}
        porPagina={perPage}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => {
          setPerPage(n);
          setPage(0);
        }}
      />

      <Dialogo aberto={open} aoFechar={() => setOpen(false)}>
        <DialogoCabecalho>Novo Movimento</DialogoCabecalho>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitMovement();
          }}
        >
          <CampoSelecao id="mov-produto" label="Produto" value={form.almoxarifado_produto_id} onChange={setField('almoxarifado_produto_id')}>
            <option value="">Selecione</option>
            {produtos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </CampoSelecao>
          <CampoSelecao id="mov-secretaria" label="Secretaria" value={form.almoxarifado_secretaria_id} onChange={setField('almoxarifado_secretaria_id')}>
            <option value="">Estoque central</option>
            {secretarias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </CampoSelecao>
          <CampoSelecao id="mov-tipo" label="Tipo" value={form.tipo} onChange={setField('tipo')}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferência</option>
          </CampoSelecao>
          {form.tipo === 'transferencia' && (
            <CampoSelecao id="mov-destino" label="Destino" value={form.secretaria_destino_id} onChange={setField('secretaria_destino_id')}>
              <option value="">Selecione</option>
              {secretarias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </CampoSelecao>
          )}
          <CampoTexto id="mov-quantidade" label="Quantidade" type="number" min={0} step="0.001" value={form.quantidade} onChange={setField('quantidade')} />
          <CampoTexto id="mov-motivo" label="Motivo" value={form.motivo} onChange={setField('motivo')} />
          <CampoTexto id="mov-observacao" label="Observação" multiline rows={3} value={form.observacao} onChange={setField('observacao')} />
          {selectedProduct ? <p className="text-xs text-muted-foreground">Produto selecionado: {selectedProduct.nome}</p> : null}
          <DialogoRodape>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Gravar</Button>
          </DialogoRodape>
        </form>
      </Dialogo>
    </div>
  );
}
