import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Banner } from "../../src/components/ui/banner";
import { Button } from "../../src/components/ui/button";
import { CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent } from "../../src/components/ui/card";
import { Pilula } from "../../src/components/ui/pilula";
import { format, isValid, parseISO } from "date-fns";
import { consultarPeticao } from "../../src/services/peticaoPublica";
import { printFiscalizacaoPdf } from "../../src/reports/fiscalizacao";

const formatDateTime = (value) => {
  const parsed = value ? parseISO(String(value)) : null;
  return parsed && isValid(parsed) ? format(parsed, "dd/MM/yyyy HH:mm") : "—";
};

export default function PetitionTrack() {
  const router = useRouter();
  const [form, setForm] = useState({ protocolo: "", senha: "" });
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router?.isReady && router.query?.protocolo) {
      setForm((current) => ({ ...current, protocolo: String(router.query.protocolo).toUpperCase() }));
    }
  }, [router?.isReady, router?.query?.protocolo]);

  const change = ({ target: { name, value } }) =>
    setForm((current) => ({
      ...current,
      [name]: name === "protocolo" ? value.toUpperCase() : value,
    }));

  const handleConsultar = async (event) => {
    event.preventDefault();
    setErro("");
    setResultado(null);
    setLoading(true);
    try {
      setResultado(await consultarPeticao({ protocolo: form.protocolo.trim(), senha: form.senha.trim() }));
    } catch (error) {
      setErro(error?.response?.data?.error || error?.response?.data?.message || "Protocolo ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handlePdf = () =>
    printFiscalizacaoPdf({
      modo: "publico",
      fiscalizacao: {
        protocolo: resultado.protocolo,
        resultado: resultado.situacao,
        assunto: resultado.assunto,
        local_endereco: resultado.local_endereco,
        created_at: resultado.registrada_em,
        origem: "peticao",
      },
      movimentacoes: resultado.movimentacoes.map((mov, index) => ({
        id: index,
        titulo: mov.titulo,
        detalhe: mov.descricao,
        data: mov.data,
        publico: true,
      })),
    });

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-[720px]">
        <h1 className="mb-1 text-3xl font-extrabold">Acompanhar petição</h1>
        <p className="mb-6 text-muted-foreground">
          Informe o protocolo e a senha recebidos ao registrar a petição.
        </p>

        <Card className="mb-6">
          <CardContent>
            <form onSubmit={handleConsultar} className="flex flex-col gap-4">
              {erro && <Banner tom="perigo">{erro}</Banner>}
              <CampoTexto id="track-protocolo" label="Protocolo" name="protocolo" value={form.protocolo} onChange={change} />
              <CampoTexto id="track-senha" label="Senha" name="senha" value={form.senha} onChange={change} type="password" autoComplete="off" />
              <Button type="submit" disabled={loading || !form.protocolo || !form.senha}>
                Consultar
              </Button>
            </form>
          </CardContent>
        </Card>

        {resultado && (
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="block text-xs tracking-wide text-muted-foreground uppercase">Protocolo</span>
                  <p className="text-lg font-extrabold">{resultado.protocolo}</p>
                </div>
                <Pilula tom={resultado.situacao === "Apurada" ? "sucesso" : "info"}>{resultado.situacao}</Pilula>
              </div>
              {resultado.motivo ? <p className="mt-2"><strong>Motivo:</strong> {resultado.motivo}</p> : null}
              <p className={resultado.motivo ? "" : "mt-2"}><strong>Assunto:</strong> {resultado.assunto}</p>
              <p><strong>Local:</strong> {resultado.local_endereco}</p>
              <p><strong>Registrada em:</strong> {formatDateTime(resultado.registrada_em)}</p>

              <h2 className="mt-4 border-t border-border pt-4 font-bold">Movimentação</h2>
              <div className="mt-1 divide-y divide-border">
                {resultado.movimentacoes.map((mov, index) => (
                  <div key={`${mov.data}-${index}`} className="py-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold">{mov.titulo}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(mov.data)}</span>
                    </div>
                    {mov.descricao ? <p className="whitespace-pre-wrap text-muted-foreground">{mov.descricao}</p> : null}
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={handlePdf} className="mt-4">Imprimir PDF</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
