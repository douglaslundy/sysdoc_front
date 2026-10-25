import { useEffect, useMemo, useState } from "react";
import { Camera, Images, X } from "lucide-react";
import { comprimirImagem } from "../../lib/comprimirImagem";
import { Banner } from "../ui/banner";
import { buttonVariants } from "../ui/button";

// Botão que abre o seletor/câmera (rótulo + <input type="file"> escondido, acessível por teclado).
function BotaoDeArquivo({ icone: Icone, rotulo, disabled, ...props }) {
  return (
    <label className={`${buttonVariants({ variant: "outline" })} min-h-11 cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <Icone /> {rotulo}
      <input type="file" className="sr-only" disabled={disabled} {...props} />
    </label>
  );
}

/**
 * Seleção de fotos (câmera ou galeria) com prévia e remoção. Controlado: `fotos` é File[].
 * Cada arquivo passa por comprimirImagem antes de entrar na lista.
 */
export default function CampoFotos({ fotos, aoMudar, max = 4, desabilitado = false, legenda = "Fotos", textoAlt = "Foto" }) {
  const [aviso, setAviso] = useState("");
  const [lendo, setLendo] = useState(false);
  const urls = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const adicionar = async (e) => {
    const entrada = e.target;
    const escolhidas = Array.from(entrada.files || []);
    entrada.value = "";
    if (escolhidas.length === 0) return;

    const vagas = Math.max(0, max - fotos.length);
    setAviso(escolhidas.length > vagas ? `Máximo de ${max} fotos: as demais foram ignoradas.` : "");
    setLendo(true);
    const prontas = await Promise.all(escolhidas.slice(0, vagas).map((f) => comprimirImagem(f)));
    setLendo(false);
    aoMudar([...fotos, ...prontas]);
  };

  const remover = (indice) => {
    setAviso("");
    aoMudar(fotos.filter((_, i) => i !== indice));
  };

  const bloqueado = desabilitado || lendo || fotos.length >= max;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold">{legenda}</h3>
        <span aria-label={`${fotos.length} de ${max} fotos`} className="text-sm text-muted-foreground">{fotos.length}/{max}</span>
      </div>
      <p className="text-xs text-muted-foreground">Evite pessoas e placas de veículos nas fotos.</p>
      <div className="flex flex-wrap gap-2">
        <BotaoDeArquivo icone={Camera} rotulo="Tirar foto" disabled={bloqueado} accept="image/*" capture="environment" onChange={adicionar} />
        <BotaoDeArquivo icone={Images} rotulo="Escolher da galeria" disabled={bloqueado} accept="image/*" multiple onChange={adicionar} />
      </div>
      {aviso ? <Banner tom="alerta">{aviso}</Banner> : null}
      {fotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((foto, i) => (
            <li key={`${foto.name}-${foto.size}-${i}`} className="relative overflow-hidden rounded-lg border border-border">
              <img src={urls[i]} alt={`${textoAlt} ${i + 1}`} className="aspect-square w-full object-cover" />
              <button
                type="button"
                disabled={desabilitado}
                aria-label={`Remover foto ${i + 1}`}
                onClick={() => remover(i)}
                className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
