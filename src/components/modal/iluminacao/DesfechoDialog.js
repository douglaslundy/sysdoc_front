import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../../lib/mensagemDeErro";
import { registrarDesfecho } from "../../../services/iluminacaoPostes";
import CampoFotos from "../../iluminacao/CampoFotos";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { CampoTexto } from "../../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../../ui/dialogo";

const OPCOES = [
  { valor: "concluido", rotulo: "Concluído", dica: "O poste foi consertado." },
  { valor: "nao_concluido", rotulo: "Não concluído", dica: "Não foi possível consertar; informe o motivo." },
  { valor: "aguardando", rotulo: "Aguardando", dica: "Depende de material ou de outra etapa; informe o motivo." },
];

const exigeMotivo = (resultado) => resultado === "nao_concluido" || resultado === "aguardando";

/** Registra o desfecho de um poste (empresa): resultado, motivo quando necessário e até 4 fotos, numa só requisição. */
export default function DesfechoDialog({ open, onClose, posteId, onSuccess }) {
  const [resultado, setResultado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fotos, setFotos] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResultado("");
    setMotivo("");
    setFotos([]);
    setErro("");
  }, [open]);

  const motivoOk = !exigeMotivo(resultado) || motivo.trim().length >= 3;
  const valido = Boolean(resultado) && motivoOk;

  const gravar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    const dados = { resultado, ...(exigeMotivo(resultado) ? { motivo: motivo.trim() } : {}) };
    try {
      const resposta = await registrarDesfecho(posteId, dados, fotos);
      onSuccess && onSuccess(resposta);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível gravar o desfecho."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="lg">
      <DialogoCabecalho>Desfecho do poste</DialogoCabecalho>
      <form onSubmit={gravar} className="space-y-4">
        {erro ? <Banner tom="perigo">{erro}</Banner> : null}

        <div role="radiogroup" aria-labelledby="desfecho-resultado" className="space-y-2">
          <p id="desfecho-resultado" className="text-[13px] text-muted-foreground">Resultado<span aria-hidden className="ml-0.5 text-danger">*</span></p>
          {OPCOES.map((o) => (
            <label key={o.valor} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25 ${resultado === o.valor ? "border-primary bg-primary/10" : "border-border"}`}>
              <input type="radio" name="resultado" aria-labelledby={`desfecho-${o.valor}-t`} aria-describedby={`desfecho-${o.valor}-d`} value={o.valor} checked={resultado === o.valor} disabled={salvando} onChange={() => setResultado(o.valor)} className="mt-1 size-4 accent-primary" />
              <span>
                <span id={`desfecho-${o.valor}-t`} className="block text-sm font-semibold">{o.rotulo}</span>
                <span id={`desfecho-${o.valor}-d`} className="block text-xs text-muted-foreground">{o.dica}</span>
              </span>
            </label>
          ))}
        </div>

        {exigeMotivo(resultado) ? (
          <CampoTexto
            id="desfecho-motivo"
            label="Motivo"
            obrigatorio
            multiline
            rows={3}
            name="motivo"
            maxLength={1000}
            dica="Mínimo de 3 caracteres."
            value={motivo}
            disabled={salvando}
            onChange={({ target: { value } }) => setMotivo(value)}
          />
        ) : null}

        <CampoFotos fotos={fotos} aoMudar={setFotos} desabilitado={salvando} legenda="Fotos do serviço" textoAlt="Foto do serviço" />

        <DialogoRodape>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!valido || salvando}>Gravar</Button>
        </DialogoRodape>
      </form>
    </Dialogo>
  );
}
