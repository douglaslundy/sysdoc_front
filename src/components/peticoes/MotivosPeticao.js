import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CaixaDeMarcacao } from "../ui/caixa-de-marcacao";
import { CampoSelecao, CampoTexto } from "../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { Pilula } from "../ui/pilula";

const EMPTY = { nome: "", descricao: "", unit_id: "", ativo: true, ordem: 0 };

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    acc.push({ ...item, level });
    if (Array.isArray(item?.children)) acc.push(...flattenUnits(item.children, level + 1));
    return acc;
  }, []);

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || fallback;
};

/**
 * Motivos das petições públicas (denúncia, solicitar vistoria...). Cada motivo aponta a unidade
 * responsável, que recebe o card no kanban.
 */
export default function MotivosPeticao() {
  const [motivos, setMotivos] = useState([]);
  const [units, setUnits] = useState([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(null); // null = fechado; objeto = aberto (com id => edição)
  const [excluir, setExcluir] = useState(null);
  const [saving, setSaving] = useState(false);

  const unitOptions = useMemo(() => flattenUnits(units).filter((unit) => unit.ativo !== false), [units]);

  const load = useCallback(async () => {
    try {
      const [motivosRes, unitsRes] = await Promise.all([
        api.get("/peticao-motivos"),
        api.get("/protocolos/unidades-organizacionais"),
      ]);
      setMotivos(Array.isArray(motivosRes.data) ? motivosRes.data : []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível carregar os motivos."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => setForm({ ...EMPTY });
  const openEdit = (motivo) =>
    setForm({
      id: motivo.id,
      nome: motivo.nome,
      descricao: motivo.descricao || "",
      unit_id: motivo.unit_id ? String(motivo.unit_id) : "",
      ativo: Boolean(motivo.ativo),
      ordem: motivo.ordem ?? 0,
    });

  const mudar = ({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value }));

  const handleSave = async () => {
    setErro("");
    if (!form.nome.trim()) {
      setErro("Informe o nome do motivo.");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      ativo: form.ativo,
      ordem: Number(form.ordem) || 0,
    };

    setSaving(true);
    try {
      if (form.id) await api.put(`/peticao-motivos/${form.id}`, payload);
      else await api.post("/peticao-motivos", payload);
      setForm(null);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível salvar o motivo."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const motivo = excluir;
    setExcluir(null);
    setErro("");
    try {
      await api.delete(`/peticao-motivos/${motivo.id}`);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível excluir o motivo."));
    }
  };

  return (
    <div className="ui-reset grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Motivos de petição</h2>
        <Button onClick={openNew}>Novo motivo</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Aparecem no formulário público (/petition). A unidade responsável recebe cada petição como um card no kanban.
      </p>

      {erro ? <Banner tom="perigo">{erro}</Banner> : null}

      {motivos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum motivo cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {motivos.map((motivo) => (
            <li key={motivo.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{motivo.nome}</p>
                <p className="text-sm text-muted-foreground">{motivo.unit?.nome || "Sem unidade responsável"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!motivo.ativo ? <Pilula tom="neutro">Inativo</Pilula> : null}
                <Button size="sm" variant="outline" onClick={() => openEdit(motivo)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => setExcluir(motivo)}>Excluir</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialogo aberto={Boolean(form)} aoFechar={() => setForm(null)} tamanho="md">
        <DialogoCabecalho>{form?.id ? "Editar motivo" : "Novo motivo"}</DialogoCabecalho>
        <div className="grid gap-4">
          <CampoTexto id="motivo-nome" label="Nome" name="nome" value={form?.nome || ""} onChange={mudar} maxLength={120} required obrigatorio />
          <CampoTexto id="motivo-descricao" label="Descrição (opcional)" name="descricao" value={form?.descricao || ""} onChange={mudar} maxLength={255} />
          <CampoSelecao id="motivo-unidade" label="Unidade responsável" name="unit_id" value={form?.unit_id || ""} onChange={mudar}>
            <option value="">Nenhuma</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={String(unit.id)}>{`${"— ".repeat(unit.level)}${unit.nome}`}</option>
            ))}
          </CampoSelecao>
          <CampoTexto id="motivo-ordem" label="Ordem" name="ordem" type="number" min={0} value={form?.ordem ?? 0} onChange={mudar} />
          <CaixaDeMarcacao id="motivo-ativo" marcado={Boolean(form?.ativo)} aoMudar={(v) => setForm((f) => ({ ...f, ativo: v }))}>
            Ativo (aparece no formulário público)
          </CaixaDeMarcacao>
        </div>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar</Button>
        </DialogoRodape>
      </Dialogo>

      <Dialogo aberto={Boolean(excluir)} aoFechar={() => setExcluir(null)} alerta tamanho="sm">
        <DialogoCabecalho>Excluir motivo</DialogoCabecalho>
        <p className="text-sm">Excluir o motivo {excluir?.nome}?</p>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setExcluir(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
