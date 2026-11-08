import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { CampoTexto } from "../ui/campos";
import { DataTable } from "../ui/data-table";
import { Dialogo, DialogoCabecalho, DialogoDescricao, DialogoRodape, DialogoTitulo } from "../ui/dialogo";
import { Pilula } from "../ui/pilula";
import { api } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";

const mensagemDeErro = (e, padrao) => {
  const erros = e?.response?.data?.errors;
  const primeiro = erros ? Object.values(erros).flat()[0] : null;
  return primeiro || e?.response?.data?.message || padrao;
};

const categoriaDe = (p) => p.category?.nome || p.categoria || "Outros";

export default function SecretariasAdmin() {
  const { profile } = useContext(AuthContext);
  const admin = profile === "admin";
  const [itens, setItens] = useState([]);
  const [paginas, setPaginas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(null); // { id?, nome, ativa, page_ids }
  const [erroForm, setErroForm] = useState("");
  const [inativando, setInativando] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get("/secretarias-admin", { semSecretaria: true });
      setItens(Array.isArray(res.data) ? res.data : []);
      setErro("");
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível carregar as secretarias."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    carregar();
    api.get("/system-pages", { semSecretaria: true })
      .then((res) => setPaginas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setErro("Não foi possível carregar a lista de módulos."));
  }, [admin, carregar]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    paginas.forEach((p) => {
      const cat = categoriaDe(p);
      mapa.set(cat, [...(mapa.get(cat) || []), p]);
    });
    return [...mapa.entries()];
  }, [paginas]);

  if (!admin) return null;

  const abrirNovo = () => { setErroForm(""); setForm({ nome: "", ativa: true, page_ids: [] }); };
  const abrirEdicao = (s) => {
    setErroForm("");
    setForm({ id: s.id, nome: s.nome, ativa: Boolean(s.ativa), page_ids: (s.pages || []).map((p) => p.id) });
  };
  const alternar = (id) =>
    setForm((f) => ({ ...f, page_ids: f.page_ids.includes(id) ? f.page_ids.filter((x) => x !== id) : [...f.page_ids, id] }));

  const salvar = async () => {
    const corpo = { nome: form.nome.trim(), ativa: form.ativa, page_ids: form.page_ids };
    try {
      if (form.id) await api.put(`/secretarias-admin/${form.id}`, corpo);
      else await api.post("/secretarias-admin", corpo);
      setForm(null);
      await carregar();
    } catch (e) {
      setErroForm(mensagemDeErro(e, "Não foi possível salvar."));
    }
  };

  const inativar = async () => {
    const alvo = inativando;
    setInativando(null);
    try {
      await api.delete(`/secretarias-admin/${alvo.id}`);
      await carregar();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível inativar."));
    }
  };

  const colunas = [
    { chave: "nome", titulo: "Nome", render: (s) => <span className="font-semibold">{s.nome}</span> },
    { chave: "slug", titulo: "Slug", render: (s) => <span className="text-sm">{s.slug}</span> },
    { chave: "ativa", titulo: "Situação", render: (s) => <Pilula tom={s.ativa ? "sucesso" : "neutro"}>{s.ativa ? "Ativa" : "Inativa"}</Pilula> },
    { chave: "paginas", titulo: "Páginas", render: (s) => <span className="text-sm">{(s.pages || []).length}</span> },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (s) => (
        <span className="inline-flex gap-2">
          <Button size="icon-xs" variant="outline" title="Editar" aria-label={`Editar ${s.nome}`} onClick={() => abrirEdicao(s)}><Pencil /></Button>
          {s.ativa ? (
            <Button size="icon-xs" variant="destructive" title="Inativar" aria-label={`Inativar ${s.nome}`} onClick={() => setInativando(s)}><Trash2 /></Button>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoDePagina
        titulo="Secretarias"
        subtitulo="Cada secretaria enxerga apenas os módulos liberados aqui. Administradores continuam com acesso total."
        acoes={<Button onClick={abrirNovo}>Nova secretaria</Button>}
      />
      {erro ? <Banner tom="perigo">{erro}</Banner> : null}
      <DataTable rotulo="Secretarias" colunas={colunas} linhas={itens} chaveDaLinha={(s) => s.id} carregando={carregando} vazio="Nenhuma secretaria cadastrada." />

      <Dialogo aberto={Boolean(form)} aoFechar={() => setForm(null)} tamanho="lg">
        <DialogoCabecalho>
          <DialogoTitulo>{form?.id ? "Editar secretaria" : "Nova secretaria"}</DialogoTitulo>
        </DialogoCabecalho>
        {form ? (
          <div className="flex flex-col gap-4">
            {erroForm ? <Banner tom="perigo">{erroForm}</Banner> : null}
            <CampoTexto id="sec-nome" label="Nome" value={form.nome} maxLength={80} autoComplete="off" onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ativa} onChange={(e) => setForm({ ...form, ativa: e.target.checked })} />
              Secretaria ativa
            </label>
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-semibold">Módulos liberados</legend>
              {grupos.map(([cat, lista]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{cat}</p>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {lista.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.page_ids.includes(p.id)} onChange={() => alternar(p.id)} />
                        {p.titulo}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          </div>
        ) : null}
        <DialogoRodape>
          <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
          <Button disabled={!form?.nome.trim()} onClick={salvar}>Salvar</Button>
        </DialogoRodape>
      </Dialogo>

      <Dialogo aberto={Boolean(inativando)} aoFechar={() => setInativando(null)} tamanho="sm" alerta>
        <DialogoCabecalho>
          <DialogoTitulo>Inativar secretaria</DialogoTitulo>
        </DialogoCabecalho>
        <DialogoDescricao>
          {inativando ? `Inativar "${inativando.nome}"? Usuários vinculados somente a ela perdem o acesso. Administradores não são afetados.` : ""}
        </DialogoDescricao>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setInativando(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={inativar}>Confirmar inativação</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
