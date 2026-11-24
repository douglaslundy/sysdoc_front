import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Plus, Trash2 } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";
import { CampoTexto } from "../ui/campos";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { buscarConfigAdmin, enviarLogo, removerLogo, salvarConfig } from "../../services/ouvidoria";

const MAX_ITENS = 10;
const LIMITES = { nome: 60, titulo: 120, texto: 500, item: 160 };
const SECOES = [
  { chave: "registrar", rotulo: "Página de registro", nome: "registro", href: "/ouvidoria" },
  { chave: "consultar", rotulo: "Página de consulta", nome: "consulta", href: "/ouvidoria/consulta" },
];

const msgErro = (e, padrao) => e?.response?.data?.message || padrao;

/** Tela do admin: textos, itens e logo do portal público da ouvidoria. */
export default function ConfigPortal() {
  const { profile } = useContext(AuthContext) || {};
  const naoAdmin = Boolean(profile) && profile !== "admin";
  const router = useRouter();

  useEffect(() => {
    // Só o admin edita (a API responde 403): quem não é volta para a caixa da ouvidoria.
    if (naoAdmin) router.replace("/sistema/ouvidoria");
  }, [naoAdmin, router]);

  if (naoAdmin) return null;
  return <FormConfigPortal />;
}

function FormConfigPortal() {
  const [form, setForm] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [msg, setMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  useEffect(() => {
    buscarConfigAdmin()
      .then((d) => {
        setForm({ nome_marca: d.nome_marca, registrar: d.registrar, consultar: d.consultar });
        setLogoUrl(d.logo_url);
      })
      .catch((e) => setMsg({ tom: "perigo", texto: msgErro(e, "Não foi possível carregar a configuração.") }));
  }, []);

  if (!form) {
    return msg ? <Banner tom={msg.tom}>{msg.texto}</Banner> : <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  const mudarSecao = (secao, campo, valor) => setForm((f) => ({ ...f, [secao]: { ...f[secao], [campo]: valor } }));
  const mudarItem = (secao, i, valor) => mudarSecao(secao, "itens", form[secao].itens.map((it, j) => (j === i ? valor : it)));
  const removerItem = (secao, i) => mudarSecao(secao, "itens", form[secao].itens.filter((_, j) => j !== i));
  const adicionarItem = (secao) => mudarSecao(secao, "itens", [...form[secao].itens, ""]);

  const erros = {
    nome_marca: !form.nome_marca.trim() ? "Informe o nome." : null,
    ...Object.fromEntries(SECOES.map(({ chave }) => [chave, !form[chave].titulo.trim() ? "Informe o título." : null])),
  };
  const temErro = Object.values(erros).some(Boolean);

  const salvar = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);
    try {
      const limpar = (s) => ({ ...s, itens: s.itens.map((it) => it.trim()).filter(Boolean) });
      const d = await salvarConfig({ nome_marca: form.nome_marca, registrar: limpar(form.registrar), consultar: limpar(form.consultar) });
      setForm({ nome_marca: d.nome_marca, registrar: d.registrar, consultar: d.consultar });
      setMsg({ tom: "sucesso", texto: "Configuração salva." });
    } catch (err) {
      setMsg({ tom: "perigo", texto: msgErro(err, "Não foi possível salvar.") });
    } finally {
      setSalvando(false);
    }
  };

  const trocarLogo = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setMsg(null);
    setEnviandoLogo(true);
    try {
      setLogoUrl((await enviarLogo(arquivo)).logo_url);
      setMsg({ tom: "sucesso", texto: "Logo atualizada." });
    } catch (err) {
      setMsg({ tom: "perigo", texto: msgErro(err, "Não foi possível enviar a logo. Use PNG, JPG ou WEBP de até 1 MB.") });
    } finally {
      setEnviandoLogo(false);
    }
  };

  const tirarLogo = async () => {
    setMsg(null);
    try {
      setLogoUrl((await removerLogo()).logo_url);
      setMsg({ tom: "sucesso", texto: "Logo removida. O portal volta a mostrar \"DL\"." });
    } catch (err) {
      setMsg({ tom: "perigo", texto: msgErro(err, "Não foi possível remover a logo.") });
    }
  };

  return (
    <div className="max-w-3xl">
      <CabecalhoDePagina
        titulo="Configuração do portal"
        subtitulo="Textos e logo que o cidadão vê nas páginas públicas da ouvidoria."
        acoes={<a href="/ouvidoria" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">Abrir o portal</a>}
      />
      {msg && <div className="mb-4"><Banner tom={msg.tom} onDispensar={() => setMsg(null)}>{msg.texto}</Banner></div>}

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Marca</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo atual" className="h-12 w-auto max-w-[160px] rounded border border-border object-contain p-1" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-[10px] bg-primary font-display text-lg font-extrabold text-primary-foreground">DL</span>
            )}
            <label htmlFor="oc-logo" className="cursor-pointer">
              <span className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent">
                {enviandoLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
              </span>
              <input id="oc-logo" type="file" accept=".png,.jpg,.jpeg,.webp" aria-label="Arquivo da logo" className="sr-only" onChange={trocarLogo} disabled={enviandoLogo} />
            </label>
            {logoUrl ? <Button type="button" variant="outline" onClick={tirarLogo}>Remover logo</Button> : null}
          </div>
          <p className="text-[11px] text-muted-foreground">PNG, JPG ou WEBP de até 1 MB. Sem logo, o portal mostra o quadrado "DL".</p>
          <CampoTexto id="oc-nome" label="Nome exibido ao lado da logo" value={form.nome_marca} maxLength={LIMITES.nome}
            onChange={({ target: { value } }) => setForm((f) => ({ ...f, nome_marca: value }))} erro={erros.nome_marca} obrigatorio />
        </CardContent>
      </Card>

      <form onSubmit={salvar} className="grid gap-4">
        {SECOES.map(({ chave, rotulo, nome, href }) => {
          const secao = form[chave];
          return (
            <Card key={chave}>
              <CardHeader><CardTitle className="text-base">{rotulo} <span className="text-xs font-normal text-muted-foreground">({href})</span></CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <CampoTexto id={`oc-${chave}-titulo`} label="Título" value={secao.titulo} maxLength={LIMITES.titulo}
                  onChange={(e) => mudarSecao(chave, "titulo", e.target.value)} erro={erros[chave]} obrigatorio />
                <CampoTexto id={`oc-${chave}-texto`} label="Texto" multiline rows={2} value={secao.texto} maxLength={LIMITES.texto}
                  onChange={(e) => mudarSecao(chave, "texto", e.target.value)} />
                <div className="grid gap-2">
                  <p className="text-[13px] text-muted-foreground">Itens da lista ({secao.itens.length}/{MAX_ITENS})</p>
                  {secao.itens.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        aria-label={`Item ${i + 1} da página de ${nome}`}
                        className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm"
                        value={item}
                        maxLength={LIMITES.item}
                        onChange={(e) => mudarItem(chave, i, e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon-sm" aria-label={`Remover item ${i + 1} da página de ${nome}`} onClick={() => removerItem(chave, i)}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button type="button" variant="outline" size="sm" aria-label={`Adicionar item na página de ${nome}`}
                      onClick={() => adicionarItem(chave)} disabled={secao.itens.length >= MAX_ITENS}>
                      <Plus /> Adicionar item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <div><Button type="submit" disabled={salvando || temErro}>{salvando ? "Salvando..." : "Salvar"}</Button></div>
      </form>
    </div>
  );
}
