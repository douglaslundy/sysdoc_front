import React, { useCallback, useEffect, useState } from "react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoTexto } from "../../src/components/ui/campos";
import { DataTable } from "../../src/components/ui/data-table";
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from "../../src/components/ui/dialogo";
import { Interruptor } from "../../src/components/ui/interruptor";
import { Pilula } from "../../src/components/ui/pilula";
import { api } from "../../src/services/api";

const emptyForm = {
  codigo: "",
  nome: "",
  descricao: "",
  ordem: 0,
  ativo: true,
};

export default function ProtocolTypesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/protocolos/tipos");
      setTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage("Não foi possível carregar os tipos de protocolo.");
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      codigo: item.codigo || "",
      nome: item.nome || "",
      descricao: item.descricao || "",
      ordem: Number(item.ordem ?? 0),
      ativo: Boolean(item.ativo),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.put(`/protocolos/tipos/${editingId}`, form);
        setMessage("Tipo atualizado com sucesso.");
      } else {
        await api.post("/protocolos/tipos", form);
        setMessage("Tipo cadastrado com sucesso.");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadTypes();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível salvar o tipo de protocolo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Inativar o tipo "${item.nome}"?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await api.delete(`/protocolos/tipos/${item.id}`);
      setMessage("Tipo inativado com sucesso.");
      await loadTypes();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível inativar o tipo.");
    } finally {
      setSaving(false);
    }
  };

  const colunas = [
    { chave: "codigo", titulo: "Código", render: (item) => item.codigo },
    { chave: "nome", titulo: "Nome", render: (item) => item.nome },
    { chave: "descricao", titulo: "Descrição", render: (item) => item.descricao || "—" },
    { chave: "ordem", titulo: "Ordem", render: (item) => item.ordem ?? 0 },
    { chave: "status", titulo: "Status", render: (item) => <Pilula tom={item.ativo ? "sucesso" : "neutro"}>{item.ativo ? "Ativo" : "Inativo"}</Pilula> },
    {
      chave: "acoes",
      titulo: "Ações",
      numerica: true,
      render: (item) => (
        <span className="inline-flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Editar</Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(item)} disabled={saving || !item.ativo} className="text-danger-text">
            Inativar
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDePagina
        titulo="Tipos de Protocolo"
        subtitulo="Cadastre os tipos usados no campo tipo do novo protocolo."
        acoes={<Button onClick={openCreate}>Novo tipo</Button>}
      />

      {message ? (
        <Banner tom={message.toLowerCase().includes("não foi") ? "perigo" : "sucesso"} onDispensar={() => setMessage("")}>
          {message}
        </Banner>
      ) : null}

      <DataTable
        rotulo="tipos de protocolo"
        colunas={colunas}
        linhas={types}
        chaveDaLinha={(item) => item.id}
        carregando={loading}
        vazio="Nenhum tipo cadastrado."
      />

      <Dialogo aberto={dialogOpen} aoFechar={() => setDialogOpen(false)} tamanho="md">
        <DialogoCabecalho>
          <DialogoTitulo>{editingId ? "Editar tipo" : "Novo tipo"}</DialogoTitulo>
        </DialogoCabecalho>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            id="tipo-codigo"
            label="Código"
            value={form.codigo}
            onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, codigo: value }))}
            obrigatorio
            required
          />
          <CampoTexto
            id="tipo-ordem"
            label="Ordem"
            type="number"
            value={form.ordem}
            onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, ordem: Number(value) }))}
          />
          <div className="sm:col-span-2">
            <CampoTexto
              id="tipo-nome"
              label="Nome"
              value={form.nome}
              onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, nome: value }))}
              obrigatorio
              required
            />
          </div>
          <div className="sm:col-span-2">
            <CampoTexto
              id="tipo-descricao"
              label="Descrição"
              multiline
              rows={3}
              value={form.descricao}
              onChange={({ target: { value } }) => setForm((prev) => ({ ...prev, descricao: value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Interruptor id="tipo-ativo" marcado={Boolean(form.ativo)} aoMudar={(marcado) => setForm((prev) => ({ ...prev, ativo: marcado }))}>
              Ativo
            </Interruptor>
          </div>
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
