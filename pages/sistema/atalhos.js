import React, { useCallback, useEffect, useState } from "react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CampoSelecao, CampoTexto, Label } from "../../src/components/ui/campos";
import { Combobox } from "../../src/components/ui/combobox";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../../src/components/ui/dialogo";
import { IconeDinamico } from "../../src/components/ui/icone-dinamico";
import { useConfirmacao } from "../../src/components/ui/confirmacao";
import { api } from "../../src/services/api";
import { ICONES_ATALHO } from "../../src/components/painelPublico/iconesAtalho";

const VAZIO = { id: null, titulo: "", url: "", icone: "link", ordem: "", ativo: true };
const URL_VALIDA = /^(\/(?!\/)|https?:\/\/)/i;
const msgErro = (e) => e?.response?.data?.message || "Não foi possível concluir a operação.";

export default function AtalhosAdminPage() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [confirmar, dialogoConfirmacao] = useConfirmacao();
  const [paginas, setPaginas] = useState([]);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(() => {
    api.get("/admin/dashboard-atalhos").then((r) => setLista(r.data)).catch((e) => setMsg({ tom: "perigo", texto: msgErro(e) }));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    api.get("/system-pages").then((r) => setPaginas((Array.isArray(r.data) ? r.data : []).filter((p) => p.ativo !== false))).catch(() => {});
  }, []);

  const termo = busca.trim().toLowerCase();
  const opcoes = paginas.filter((p) => !termo || `${p.titulo} ${p.path}`.toLowerCase().includes(termo)).slice(0, 50);
  const paginaAtual = paginas.find((p) => p.path === form?.url) || null;
  const escolherPagina = (p) => setForm((f) => ({
    ...f,
    url: p.path,
    titulo: f.titulo.trim() ? f.titulo : String(p.titulo).replace(/^Dashboard - /, ""),
    icone: f.id || f.icone !== "link" ? f.icone : (ICONES_ATALHO.includes(p.icone) ? p.icone : f.icone),
  }));

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const urlInvalida = form && form.url !== "" && !URL_VALIDA.test(form.url);
  const podeSalvar = form && form.titulo.trim() && URL_VALIDA.test(form.url);

  const salvar = async () => {
    setErroForm(null);
    const dados = { titulo: form.titulo.trim(), url: form.url.trim(), icone: form.icone, ativo: form.ativo, ordem: form.ordem === "" ? undefined : Number(form.ordem) };
    try {
      if (form.id) await api.put(`/admin/dashboard-atalhos/${form.id}`, dados);
      else await api.post("/admin/dashboard-atalhos", dados);
      setForm(null);
      carregar();
    } catch (e) {
      setErroForm(msgErro(e));
    }
  };

  const remover = async (a) => {
    if (!(await confirmar({ titulo: "Remover atalho", mensagem: `Remover o atalho "${a.titulo}"?`, confirmar: "Remover" }))) return;
    try {
      await api.delete(`/admin/dashboard-atalhos/${a.id}`);
      carregar();
    } catch (e) {
      setMsg({ tom: "perigo", texto: msgErro(e) });
    }
  };

  return (
    <div className="max-w-3xl">
      {dialogoConfirmacao}
      <CabecalhoDePagina
        titulo="Atalhos do dashboard"
        subtitulo="Botões da aba Início do dashboard. Cada usuário vê só os que levam a páginas que ele pode abrir."
        acoes={<Button type="button" onClick={() => { setErroForm(null); setForm(VAZIO); }}>+ Novo atalho</Button>}
      />
      {msg && <div className="mb-4"><Banner tom={msg.tom} onDispensar={() => setMsg(null)}>{msg.texto}</Banner></div>}

      <div className="grid gap-2">
        {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum atalho cadastrado.</p>}
        {lista.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <IconeDinamico nome={a.icone} className="size-6 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{a.titulo}{!a.ativo && <span className="ml-2 text-xs font-normal text-muted-foreground">(oculto)</span>}</p>
              <p className="truncate text-xs text-muted-foreground">{a.url} · ordem {a.ordem}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => { setErroForm(null); setForm({ ...a, ordem: String(a.ordem) }); }}>Editar</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => remover(a)}>Remover</Button>
          </div>
        ))}
      </div>

      <Dialogo aberto={Boolean(form)} aoFechar={() => setForm(null)}>
        <DialogoCabecalho>{form?.id ? "Editar atalho" : "Novo atalho"}</DialogoCabecalho>
        {form && (
          <div className="grid gap-3">
            {erroForm && <Banner tom="perigo">{erroForm}</Banner>}
            <CampoTexto id="at-titulo" label="Nome do botão" value={form.titulo} onChange={set("titulo")} maxLength={60} />
            <div className="grid gap-1.5">
              <Label htmlFor="at-pagina">Buscar página do sistema</Label>
              <Combobox id="at-pagina" opcoes={opcoes} selecionado={paginaAtual} aoSelecionar={escolherPagina} aoDigitar={setBusca}
                chaveDaOpcao={(p) => p.id} rotuloDaOpcao={(p) => `${p.titulo} — ${p.path}`} placeholder="Digite o nome da página" vazio="Nenhuma página encontrada." />
            </div>
            <CampoTexto id="at-url" label="Endereço que o botão abre (preenchido ao escolher; pode digitar um site externo)" value={form.url} onChange={set("url")} maxLength={500}
              erro={urlInvalida ? "Use um caminho do sistema (/clients) ou um endereço https://." : null} dica="Ex.: /clients, /trips ou https://site.com" />
            <CampoSelecao id="at-icone" label="Ícone" value={form.icone} onChange={set("icone")}>
              {ICONES_ATALHO.map((i) => <option key={i} value={i}>{i}</option>)}
            </CampoSelecao>
            <div className="flex items-center gap-2 text-sm"><IconeDinamico nome={form.icone} className="size-6 text-primary" /> Prévia do ícone</div>
            <CampoTexto id="at-ordem" label="Ordem" type="number" min={0} value={form.ordem} onChange={set("ordem")} dica="Vazio coloca no fim." />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} /> Visível no dashboard</label>
          </div>
        )}
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
          <Button type="button" disabled={!podeSalvar} onClick={salvar}>Salvar</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
