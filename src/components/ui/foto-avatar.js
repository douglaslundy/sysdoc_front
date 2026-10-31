import { Camera, Trash2, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { enviarFoto, reduzirImagem, removerFoto, useFotoPessoa } from '../../lib/fotoPessoa';
import { Banner } from './banner';
import { Button } from './button';
import { Dialogo, DialogoCabecalho, DialogoRodape } from './dialogo';

const iniciais = (nome) => String(nome || '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/** Janela da webcam: mostra o vídeo e devolve o quadro capturado. Desliga a câmera ao fechar. */
function CapturaWebcam({ aberto, aoFechar, aoCapturar }) {
  const video = useRef(null);
  const [erro, setErro] = useState('');
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    if (!aberto) return undefined;
    let stream = null;
    let cancelado = false;
    setErro('');
    setPronta(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador não permite usar a câmera (é preciso HTTPS ou localhost).');
      return undefined;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelado) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível acessar a câmera. Verifique a permissão do navegador.'); });
    return () => {
      cancelado = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [aberto]);

  const capturar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && aoCapturar(blob), 'image/jpeg', 0.9);
  };

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} tamanho="md" elevado>
      <DialogoCabecalho>Tirar foto</DialogoCabecalho>
      {erro ? <Banner tom="alerta">{erro}</Banner> : (
        <video ref={video} autoPlay playsInline muted onLoadedMetadata={() => setPronta(true)} className="aspect-video w-full -scale-x-100 rounded-lg bg-black object-cover" />
      )}
      <DialogoRodape>
        <Button type="button" variant="outline" onClick={aoFechar}>Cancelar</Button>
        <Button type="button" onClick={capturar} disabled={!pronta || Boolean(erro)}>
          <Camera className="size-4" aria-hidden /> Capturar
        </Button>
      </DialogoRodape>
    </Dialogo>
  );
}

/**
 * Avatar editável de cidadão (`tipo="clients"`) ou usuário (`tipo="users"`).
 * Clicar no círculo envia um arquivo; o botão da câmera abre a webcam. A foto é compartilhada por CPF no back.
 */
export function FotoAvatar({ tipo, id, nome, className = '' }) {
  const url = useFotoPessoa(tipo, id);
  const entrada = useRef(null);
  const [camera, setCamera] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async (origem) => {
    setOcupado(true);
    setErro('');
    try {
      await enviarFoto(tipo, id, await reduzirImagem(origem));
    } catch (e) {
      setErro(e?.response?.data?.errors?.photo?.[0] || e?.response?.data?.message || e?.message || 'Não foi possível salvar a foto.');
    } finally {
      setOcupado(false);
    }
  };

  const aoEscolher = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (arquivo) salvar(arquivo);
  };

  const remover = async () => {
    setOcupado(true);
    setErro('');
    try {
      await removerFoto(tipo, id);
    } catch (e) {
      setErro(e?.response?.data?.message || 'Não foi possível remover a foto.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={ocupado}
          aria-label="Enviar foto"
          title="Clique para enviar uma foto"
          className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-2xl font-semibold text-muted-foreground transition hover:border-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
        >
          {url ? <img src={url} alt={nome ? `Foto de ${nome}` : 'Foto'} className="size-full object-cover" /> : (iniciais(nome) || <UserRound className="size-10" aria-hidden />)}
        </button>
        <div className="flex flex-col gap-1">
          <Button type="button" size="icon" variant="outline" onClick={() => setCamera(true)} disabled={ocupado} aria-label="Tirar foto com a webcam" title="Tirar foto com a webcam">
            <Camera className="size-4" aria-hidden />
          </Button>
          {url ? (
            <Button type="button" size="icon" variant="outline" onClick={remover} disabled={ocupado} aria-label="Remover foto" title="Remover foto">
              <Trash2 className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={aoEscolher} data-testid="foto-arquivo" />
      {erro ? <p role="alert" className="text-xs text-danger-text">{erro}</p> : null}
      <CapturaWebcam
        aberto={camera}
        aoFechar={() => setCamera(false)}
        aoCapturar={(blob) => { setCamera(false); salvar(blob); }}
      />
    </div>
  );
}
