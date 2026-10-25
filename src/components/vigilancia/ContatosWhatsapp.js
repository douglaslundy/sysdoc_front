import React, { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { CaixaDeMarcacao } from "../ui/caixa-de-marcacao";
import { CampoTexto } from "../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { Pilula } from "../ui/pilula";

const digits = (value) => String(value || "").replace(/\D+/g, "");

export const formatPhone = (value) => {
  const d = digits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value || "";
};

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || fallback;
};

/**
 * Profissionais da Vigilância que recebem avisos por WhatsApp (nova denúncia / nova fiscalização).
 * Cadastro simples: nome + telefone com DDD.
 */
export default function ContatosWhatsapp() {
  const [contatos, setContatos] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [remover, setRemover] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/vigilancia/contatos-whatsapp");
      setContatos(Array.isArray(data) ? data : []);
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível carregar os profissionais."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    setErro("");
    if (!nome.trim()) {
      setErro("Informe o nome do profissional.");
      return;
    }
    const numero = digits(telefone);
    if (numero.length < 10 || numero.length > 13) {
      setErro("Telefone inválido: informe DDD + número (10 a 13 dígitos).");
      return;
    }

    setSaving(true);
    try {
      await api.post("/vigilancia/contatos-whatsapp", { nome: nome.trim(), telefone: numero });
      setNome("");
      setTelefone("");
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível cadastrar o profissional."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (contato) => {
    setErro("");
    try {
      await api.put(`/vigilancia/contatos-whatsapp/${contato.id}`, {
        nome: contato.nome,
        telefone: contato.telefone,
        ativo: !contato.ativo,
      });
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível atualizar o profissional."));
    }
  };

  const handleRemove = async () => {
    const contato = remover;
    setRemover(null);
    setErro("");
    try {
      await api.delete(`/vigilancia/contatos-whatsapp/${contato.id}`);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível remover o profissional."));
    }
  };

  return (
    <div className="ui-reset grid gap-4">
      <div>
        <h2 className="font-display text-lg font-bold">Avisos por WhatsApp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os profissionais ativos abaixo recebem uma mensagem quando chega uma denúncia nova ou é registrada uma fiscalização.
          A mensagem traz só protocolo, assunto e local — nunca a identificação do denunciante.
        </p>
      </div>

      {erro ? <Banner tom="perigo">{erro}</Banner> : null}

      <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
        <CampoTexto id="contato-nome" label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} maxLength={150} />
        <CampoTexto id="contato-telefone" label="WhatsApp (com DDD)" value={telefone} onChange={(event) => setTelefone(event.target.value)} maxLength={20} />
        <Button onClick={handleAdd} disabled={saving} className="min-w-[140px]">
          Adicionar
        </Button>
      </div>

      {contatos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum profissional cadastrado. Cadastre para receber avisos de novas denúncias e fiscalizações por WhatsApp.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {contatos.map((contato) => (
            <li key={contato.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{contato.nome}</p>
                <p className="text-sm text-muted-foreground">{formatPhone(contato.telefone)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {!contato.ativo ? <Pilula tom="neutro">Inativo</Pilula> : null}
                <CaixaDeMarcacao
                  id={`contato-ativo-${contato.id}`}
                  marcado={Boolean(contato.ativo)}
                  aoMudar={() => handleToggle(contato)}
                  aria-label={`Receber avisos: ${contato.nome}`}
                />
                <Button size="sm" variant="destructive" onClick={() => setRemover(contato)}>
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialogo aberto={Boolean(remover)} aoFechar={() => setRemover(null)} alerta tamanho="sm">
        <DialogoCabecalho>Remover profissional</DialogoCabecalho>
        <p className="text-sm">Remover {remover?.nome} da lista de avisos por WhatsApp?</p>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setRemover(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleRemove}>Remover</Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );
}
