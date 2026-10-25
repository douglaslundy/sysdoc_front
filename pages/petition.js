import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Banner } from "../src/components/ui/banner";
import { Button } from "../src/components/ui/button";
import { CampoSelecao, CampoTexto } from "../src/components/ui/campos";
import { Card, CardContent } from "../src/components/ui/card";
import { listarMotivos, registrarPeticao } from "../src/services/peticaoPublica";

const MAX_FILES = 5;
const MAX_FILE_MB = 10;

const EMPTY = {
  motivo_id: "",
  assunto: "",
  descricao_denuncia: "",
  local_endereco: "",
  estabelecimento_nome_informado: "",
  denunciante_nome: "",
  denunciante_contato: "",
  website: "",
};

const collectErrors = (error) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat();
  return [data?.message || "Não foi possível enviar a petição. Tente novamente."];
};

export default function Petition() {
  const [motivos, setMotivos] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);
  const [recibo, setRecibo] = useState(null);
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    let active = true;
    listarMotivos()
      .then((lista) => {
        if (active) setMotivos(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (active) setMotivos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const change = ({ target }) => {
    const { name, value } = target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFiles = ({ target }) => {
    const selected = Array.from(target.files || []);
    if (selected.length > MAX_FILES) {
      setErrors([`Envie no máximo ${MAX_FILES} arquivos.`]);
      return;
    }
    if (selected.some((file) => file.size > MAX_FILE_MB * 1024 * 1024)) {
      setErrors([`Cada arquivo pode ter no máximo ${MAX_FILE_MB} MB.`]);
      return;
    }
    setErrors([]);
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (motivos.length > 0 && !form.motivo_id) {
      setErrors(["Escolha o motivo da petição."]);
      return;
    }
    if (!form.assunto.trim() || !form.descricao_denuncia.trim() || !form.local_endereco.trim()) {
      setErrors(["Preencha o assunto, a descrição e o local da petição."]);
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // Sem motivo escolhido (ou sem motivos cadastrados) o campo nem é enviado.
      if (key === "motivo_id" && !value) return;
      body.append(key, value);
    });
    files.forEach((file) => body.append("files[]", file));

    setSending(true);
    setErrors([]);
    try {
      setRecibo(await registrarPeticao(body));
    } catch (error) {
      setErrors(collectErrors(error));
    } finally {
      setSending(false);
    }
  };

  const copiar = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(label);
    } catch {
      setCopiado("");
    }
  };

  const shell = (children) => (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-[720px]">
        <h1 className="mb-1 text-3xl font-extrabold">Petição à Vigilância Sanitária</h1>
        <p className="mb-6 text-muted-foreground">
          Registre uma denúncia, solicite uma vistoria ou outra petição. Você não precisa se identificar.
        </p>
        {children}
      </div>
    </div>
  );

  if (recibo) {
    return shell(
      <Card>
        <CardContent className="flex flex-col gap-3">
          <Banner tom="sucesso">Petição registrada com sucesso.</Banner>
          <div>
            <span className="block text-xs tracking-wide text-muted-foreground uppercase">Protocolo</span>
            <p className="text-2xl font-extrabold">{recibo.protocolo}</p>
          </div>
          <div>
            <span className="block text-xs tracking-wide text-muted-foreground uppercase">Senha de consulta</span>
            <p className="text-2xl font-extrabold tracking-[3px]">{recibo.senha}</p>
          </div>
          <Banner tom="alerta">
            Guarde a senha agora: ela é mostrada só uma vez e não pode ser recuperada. Sem ela você não consegue acompanhar a petição.
          </Banner>
          <div>
            <span className="block text-xs tracking-wide text-muted-foreground uppercase">Acompanhe em</span>
            <p className="break-all">{recibo.url_consulta}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => copiar("protocolo", recibo.protocolo)}>Copiar protocolo</Button>
            <Button variant="outline" onClick={() => copiar("senha", recibo.senha)}>Copiar senha</Button>
            <Button variant="outline" onClick={() => copiar("link", recibo.url_consulta)}>Copiar endereço</Button>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </div>
          {copiado ? <span className="text-xs text-muted-foreground">Copiado: {copiado}.</span> : null}
        </CardContent>
      </Card>
    );
  }

  return shell(
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {errors.length > 0 && (
            <Banner tom="perigo">
              {errors.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </Banner>
          )}

          {motivos.length > 0 && (
            <CampoSelecao id="pet-motivo" label="Motivo da petição" obrigatorio name="motivo_id" value={form.motivo_id} onChange={change}>
              <option value="">Selecione...</option>
              {motivos.map((motivo) => (
                <option key={motivo.id} value={String(motivo.id)}>{motivo.nome}</option>
              ))}
            </CampoSelecao>
          )}

          <CampoTexto id="pet-assunto" label="Assunto" obrigatorio name="assunto" value={form.assunto} onChange={change} maxLength={200} />
          <CampoTexto
            id="pet-descricao"
            label="Descreva a petição"
            obrigatorio
            name="descricao_denuncia"
            value={form.descricao_denuncia}
            onChange={change}
            multiline
            rows={4}
            maxLength={4000}
          />
          <CampoTexto id="pet-local" label="Local/endereço" obrigatorio name="local_endereco" value={form.local_endereco} onChange={change} maxLength={255} />
          <CampoTexto
            id="pet-estabelecimento"
            label="Nome do estabelecimento (se souber)"
            name="estabelecimento_nome_informado"
            value={form.estabelecimento_nome_informado}
            onChange={change}
            maxLength={200}
          />

          <div className="border-t border-border pt-4">
            <h2 className="mb-3 text-sm font-semibold">Identificação (opcional)</h2>
            <div className="flex flex-col gap-4">
              <CampoTexto id="pet-nome" label="Seu nome (opcional)" name="denunciante_nome" value={form.denunciante_nome} onChange={change} maxLength={150} />
              <CampoTexto id="pet-contato" label="Contato (opcional)" name="denunciante_contato" value={form.denunciante_contato} onChange={change} maxLength={150} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="text-sm font-semibold">Fotos e arquivos (opcional)</h2>
            <span className="text-xs text-muted-foreground">
              Até {MAX_FILES} arquivos de {MAX_FILE_MB} MB (JPG, PNG, WEBP ou PDF).
            </span>
            <input
              aria-label="Fotos e arquivos"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFiles}
              className="mt-2 block text-sm"
            />
            {files.length > 0 && <span className="text-xs">{files.length} arquivo(s) selecionado(s).</span>}
          </div>

          {/* Campo isca: invisível para pessoas; robôs costumam preencher. */}
          <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} />
          </div>

          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : null}
            Enviar petição
          </Button>
          <span className="text-xs text-muted-foreground">
            Ao enviar, você receberá um protocolo e uma senha para acompanhar o andamento.
          </span>
        </form>
      </CardContent>
    </Card>
  );
}
