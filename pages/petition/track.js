import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, TextField, Typography } from "@mui/material";
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

  const change = ({ target }) =>
    setForm((current) => ({
      ...current,
      [target.name]: target.name === "protocolo" ? target.value.toUpperCase() : target.value,
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
        origem: "denuncia",
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2, display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 720 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Acompanhar petição</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Informe o protocolo e a senha recebidos ao registrar a petição.
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleConsultar}>
              <Stack spacing={2}>
                {erro && <Alert severity="error">{erro}</Alert>}
                <TextField label="Protocolo" name="protocolo" value={form.protocolo} onChange={change} fullWidth />
                <TextField label="Senha" name="senha" value={form.senha} onChange={change} type="password" autoComplete="off" fullWidth />
                <Button type="submit" variant="contained" disabled={loading || !form.protocolo || !form.senha}>
                  Consultar
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {resultado && (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="overline">Protocolo</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{resultado.protocolo}</Typography>
                </Box>
                <Chip color={resultado.situacao === "Apurada" ? "success" : "info"} label={resultado.situacao} />
              </Stack>
              {resultado.motivo ? <Typography sx={{ mt: 1 }}><strong>Motivo:</strong> {resultado.motivo}</Typography> : null}
              <Typography sx={{ mt: resultado.motivo ? 0 : 1 }}><strong>Assunto:</strong> {resultado.assunto}</Typography>
              <Typography><strong>Local:</strong> {resultado.local_endereco}</Typography>
              <Typography><strong>Registrada em:</strong> {formatDateTime(resultado.registrada_em)}</Typography>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Movimentação</Typography>
              <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
                {resultado.movimentacoes.map((mov, index) => (
                  <Box key={`${mov.data}-${index}`} sx={{ py: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={{ fontWeight: 700 }}>{mov.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(mov.data)}</Typography>
                    </Stack>
                    {mov.descricao ? <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{mov.descricao}</Typography> : null}
                  </Box>
                ))}
              </Stack>

              <Button variant="outlined" onClick={handlePdf} sx={{ mt: 2 }}>Imprimir PDF</Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
