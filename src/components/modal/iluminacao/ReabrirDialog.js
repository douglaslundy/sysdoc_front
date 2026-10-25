import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../../lib/mensagemDeErro";
import { reabrirPoste } from "../../../services/iluminacaoPostes";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { CampoTexto } from "../../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../../ui/dialogo";

/** Administrador reabre um poste: volta a Pendente e o motivo fica no histórico. */
export default function ReabrirDialog({ open, onClose, posteId, onSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMotivo("");
    setErro("");
  }, [open]);

  const reabrir = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const resposta = await reabrirPoste(posteId, motivo.trim());
      onSuccess && onSuccess(resposta);
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível reabrir o poste."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md">
      <DialogoCabecalho>Reabrir poste</DialogoCabecalho>
      <form onSubmit={reabrir} className="space-y-4">
        {erro ? <Banner tom="perigo">{erro}</Banner> : null}
        <CampoTexto
          id="reabrir-motivo"
          label="Motivo"
          obrigatorio
          multiline
          rows={3}
          name="motivo"
          maxLength={1000}
          dica="O poste volta a Pendente e o motivo fica registrado no histórico."
          value={motivo}
          disabled={salvando}
          onChange={({ target: { value } }) => setMotivo(value)}
        />
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={motivo.trim().length < 3 || salvando}>Reabrir poste</Button>
        </DialogoRodape>
      </form>
    </Dialogo>
  );
}
