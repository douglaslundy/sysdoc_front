import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { baixarFoto } from "../../services/iluminacaoPostes";
import { buttonVariants } from "../ui/button";
import { Button } from "../ui/button";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";

/**
 * Miniaturas das fotos de um poste. O arquivo vem por requisição autenticada (blob), nunca por URL pública.
 * `descricao` completa o alt: "Foto 1 do <descricao>".
 */
export default function GaleriaFotos({ posteId, fotos, descricao }) {
  const [itens, setItens] = useState([]);
  const [ampliada, setAmpliada] = useState(null);
  const chave = fotos.map((f) => f.id).join(",");

  useEffect(() => {
    let vivo = true;
    const criadas = [];
    setItens(fotos.map((f) => ({ id: f.id, url: null, erro: false })));

    fotos.forEach((f) => {
      baixarFoto(posteId, f.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          if (!vivo) {
            URL.revokeObjectURL(url);
            return;
          }
          criadas.push(url);
          setItens((prev) => prev.map((i) => (i.id === f.id ? { ...i, url } : i)));
        })
        .catch(() => vivo && setItens((prev) => prev.map((i) => (i.id === f.id ? { ...i, erro: true } : i))));
    });

    return () => {
      vivo = false;
      criadas.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [posteId, chave]);

  if (fotos.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma foto.</p>;

  const alt = (i) => `Foto ${i + 1} do ${descricao}`;
  const aberta = ampliada != null ? itens[ampliada] : null;

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,200px))] gap-3">
        {itens.map((item, i) => (
          <li key={item.id} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            {item.url ? (
              <button type="button" aria-label={`Ampliar foto ${i + 1}`} onClick={() => setAmpliada(i)} className="block size-full cursor-zoom-in focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none">
                <img src={item.url} alt={alt(i)} className="size-full object-cover" />
              </button>
            ) : item.erro ? (
              <p className="flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground">Não foi possível carregar a foto.</p>
            ) : (
              <div aria-busy className="size-full animate-[pulse-suave_1.5s_ease-in-out_infinite] bg-border" />
            )}
          </li>
        ))}
      </ul>

      <Dialogo aberto={Boolean(aberta?.url)} aoFechar={() => setAmpliada(null)} tamanho="lg">
        <DialogoCabecalho>{ampliada != null ? alt(ampliada) : ""}</DialogoCabecalho>
        {aberta?.url ? <img src={aberta.url} alt={alt(ampliada)} className="max-h-[70vh] w-full rounded-lg object-contain" /> : null}
        <DialogoRodape>
          {aberta?.url ? (
            <a href={aberta.url} download={`foto-${ampliada + 1}.jpg`} className={buttonVariants({ variant: "outline" })}>
              <Download /> Baixar
            </a>
          ) : null}
          <Button variant="outline" onClick={() => setAmpliada(null)}>Fechar</Button>
        </DialogoRodape>
      </Dialogo>
    </>
  );
}
