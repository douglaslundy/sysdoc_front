import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { Carregando } from "../../src/components/ui/carregando";
import { api } from "../../src/services/api";

const msgErro = (e) => e?.response?.data?.message || "Não foi possível carregar a documentação.";

/** Link relativo para um .md da documentação (README.md, ../05-x.md, referencia/chat.md) -> slug do documento. */
export function slugDeLink(href) {
  const m = /([^/]+)\.md(?:#.*)?$/i.exec(href || "");
  if (!m || /^https?:/i.test(href)) return null;
  const nome = m[1];
  if (nome === "README") return "inicio";
  return /(^|\/)referencia\//.test(href) ? `ref-${nome}` : nome;
}

// Estilo do conteúdo gerado do Markdown.
const CONTEUDO = [
  "max-w-none text-sm leading-relaxed break-words",
  "[&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-extrabold",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold",
  "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_a]:text-primary-text [&_a]:underline",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px]",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-4 [&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
].join(" ");

export default function DocumentacaoApiPage() {
  const [itens, setItens] = useState([]);
  const [temOpenapi, setTemOpenapi] = useState(false);
  const [slug, setSlug] = useState("inicio");
  const [doc, setDoc] = useState(null);
  const [erro, setErro] = useState("");
  const topo = useRef(null);

  useEffect(() => {
    api.get("/docs-api").then((r) => { setItens(r.data.itens || []); setTemOpenapi(Boolean(r.data.openapi)); }).catch((e) => setErro(msgErro(e)));
  }, []);

  useEffect(() => {
    let cancelado = false;
    setDoc(null);
    Promise.all([api.get(`/docs-api/${slug}`), import("dompurify")])
      .then(([r, mod]) => {
        if (cancelado) return;
        const purify = mod.default || mod;
        setErro("");
        setDoc({ titulo: r.data.titulo, html: purify.sanitize(r.data.html) });
        topo.current?.scrollIntoView?.({ block: "start" });
      })
      .catch((e) => { if (!cancelado) setErro(msgErro(e)); });
    return () => { cancelado = true; };
  }, [slug]);

  const aoClicar = useCallback((evento) => {
    const a = evento.target.closest?.("a");
    if (!a) return;
    const href = a.getAttribute("href");
    const destino = slugDeLink(href);
    if (destino) { evento.preventDefault(); setSlug(destino); return; }
    if (/^https?:/i.test(href || "")) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  }, []);

  const baixarOpenapi = async () => {
    try {
      const { data } = await api.get("/docs-api/openapi", { responseType: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(data);
      link.download = "sysdoc-openapi.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      setErro(msgErro(e));
    }
  };

  const grupos = itens.reduce((acc, i) => ({ ...acc, [i.grupo]: [...(acc[i.grupo] || []), i] }), {});

  return (
    <div ref={topo}>
      <CabecalhoDePagina
        titulo="Documentação da API"
        subtitulo="Como autenticar, montar cabeçalhos e consumir os endpoints do SysDoc."
        acoes={temOpenapi ? <Button type="button" variant="outline" onClick={baixarOpenapi}><Download aria-hidden className="mr-2 size-4" />Baixar OpenAPI (JSON)</Button> : null}
      />
      {erro ? <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div> : null}
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Documentos da API" className="grid content-start gap-4">
          {Object.entries(grupos).map(([grupo, lista]) => (
            <div key={grupo}>
              <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">{grupo}</p>
              <ul className="grid gap-0.5">
                {lista.map((i) => (
                  <li key={i.slug}>
                    <button
                      type="button"
                      onClick={() => setSlug(i.slug)}
                      aria-current={i.slug === slug ? "page" : undefined}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover ${i.slug === slug ? "bg-hover font-semibold" : ""}`}
                    >
                      {i.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <article className="min-w-0 rounded-xl border border-border bg-card p-5" onClick={aoClicar}>
          {doc ? <div className={CONTEUDO} dangerouslySetInnerHTML={{ __html: doc.html }} /> : <Carregando />}
        </article>
      </div>
    </div>
  );
}
